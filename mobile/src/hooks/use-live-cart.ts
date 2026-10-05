/*
  FRD F17. The 2-second poll that makes R2 true.

  A cart item added on the WEBSITE has to appear in the app "almost instantly",
  and the website does not push. So the app pulls, every two seconds, while it
  is in front of the shopper.

  Five rules make those two seconds mean something rather than just firing:

    1. FOREGROUND ONLY. Polling stops when the app is backgrounded, because
       Android will throttle it anyway and a background poller is a battery
       complaint waiting to happen.
    2. ONE REQUEST IN FLIGHT. A ref guard means a slow network cannot queue up a
       backlog of polls that all land at once.
    3. PAUSE DURING A WRITE. If the shopper is changing a quantity, the poller
       stands down, so a read cannot overwrite a change that has not been saved
       yet. This is the same guard the website has via its `pending` counter.
    4. BACK OFF ON FAILURE. 2s, then 4s, then 8s, and straight back to 2s on the
       first success. A flaky connection must not turn into a hammering one.
    5. ONE IMMEDIATE POLL ON RESUME. Coming back to the app should show the cart
       straight away, not up to two seconds later.
*/

import { useCallback, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useCartStore } from "@/store/cart";
import { useSession } from "@/store/session";

export const POLL_INTERVAL_MS = 2000;
export const BACKOFF_INTERVALS_MS = [4000, 8000] as const;

export function useLiveCart() {
  const token = useSession((state) => state.token);
  const state = useSession((state) => state.state);
  const signOut = useSession((state) => state.signOut);

  const load = useCartStore((store) => store.load);

  /*
    Refs, not state: these are bookkeeping, and putting them in state would make
    the polling effect re-subscribe on every single poll.
      inFlight     rule 2, one request at a time
      failureCount rule 4, how many polls have failed in a row
      appStateRef  rule 1, foreground or not
      timerRef     so the interval can be rescheduled with a different delay
  */
  const inFlight = useRef(false);
  const failureCount = useRef(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signedIn = state === "signedIn" && Boolean(token);

  /*
    A 401 from any cart call means the token is dead. The store calls this, and
    signing out here means the app returns to the sign-in screen instead of
    polling forever with a token that can only ever 401.
  */
  const handleUnauthorized = useCallback(() => {
    void signOut();
  }, [signOut]);

  useEffect(() => {
    useCartStore.setState({ onUnauthorized: handleUnauthorized });
  }, [handleUnauthorized]);

  const poll = useCallback(async () => {
    /* Rule 3: never race a read against a write. Read the store directly so this
       stays current without making the callback depend on pending. */
    if (useCartStore.getState().pending > 0) return;

    /* Rule 2: one at a time. */
    if (inFlight.current) return;

    if (!token) return;

    inFlight.current = true;

    try {
      await load(token);

      /* Rule 4: a success clears the backoff. */
      failureCount.current = 0;
    } catch {
      failureCount.current += 1;
    } finally {
      inFlight.current = false;
    }
  }, [load, token]);

  /* How long to wait before the next poll, given how the last one went. */
  function nextDelay(): number {
    const index = Math.min(failureCount.current, BACKOFF_INTERVALS_MS.length);

    return index === 0 ? POLL_INTERVAL_MS : BACKOFF_INTERVALS_MS[index - 1];
  }

  useEffect(() => {
    if (!signedIn) {
      /* Signed out: make sure nothing is left running from a previous session. */
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }

    let cancelled = false;

    /*
      A self-rescheduling timeout rather than setInterval, because rule 4 needs a
      DIFFERENT delay after a failure and an interval cannot change its own period.
    */
    const schedule = () => {
      if (cancelled) return;

      timerRef.current = setTimeout(async () => {
        if (cancelled) return;

        /* Rule 1, checked at tick time so backgrounding stops it immediately. */
        if (appStateRef.current === "active") {
          await poll();
        }

        schedule();
      }, nextDelay());
    };

    /* Rule 1: track foreground and background. */
    const subscription = AppState.addEventListener("change", (next) => {
      const wasActive = appStateRef.current === "active";
      appStateRef.current = next;

      /*
        Rule 5: on return to the foreground, poll immediately rather than waiting
        for the next scheduled tick, which could be up to two seconds away.
      */
      if (next === "active" && !wasActive) void poll();
    });

    /* First read, so the cart screen is not empty on arrival. */
    void poll();
    schedule();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      subscription.remove();
    };
  }, [signedIn, poll]);

  return { signedIn };
}