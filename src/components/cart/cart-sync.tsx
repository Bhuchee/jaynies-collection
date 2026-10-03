"use client";

import { useEffect, useRef } from "react";
import {
  addSavedCartLine,
  fetchSavedCart,
  mergeGuestCart,
  removeSavedCartLine,
  setSavedCartQuantity,
  type CartActionResult,
} from "@/actions/cart";
import { useCartStore } from "@/store/cart";

type CartSyncProps = {
  /** The session's user id, or null when signed out. Rendered on the server. */
  userId: string | null;
};

/**
 * FRD F5. Three jobs, in order of importance:
 *
 *  1. On sign-in, merge the guest localStorage cart into the saved cart and take
 *     the server's answer as the truth.
 *  2. While signed in, mirror every add, quantity change and remove to the
 *     server.
 *  3. Reload from the server on page load and whenever the tab regains focus,
 *     so another device's change appears without a manual refresh.
 *
 * The merge runs once per user id. A focus reload is skipped while a write is in
 * flight, so it can never overwrite a change that has not been saved yet.
 */
export function CartSync({ userId }: CartSyncProps) {
  const mergedFor = useRef<string | null>(null);

  useEffect(() => {
    const store = useCartStore.getState();
    store.setIdentity(userId);
  }, [userId]);

  /* The sign-in merge, plus a plain load on every page load while signed in. */
  useEffect(() => {
    if (!userId) return;
    if (mergedFor.current === userId) return;

    mergedFor.current = userId;
    const store = useCartStore.getState();
    store.setSyncState("syncing");

    let cancelled = false;

    void (async () => {
      try {
        /* The local lines are the guest cart, which is exactly what should be
           merged on the first load for this user. */
        const result: CartActionResult = await mergeGuestCart(
          useCartStore.getState().lines,
        );

        if (cancelled) return;

        if (result.ok) {
          useCartStore.getState().setLines(result.lines);
        }

        useCartStore.getState().setSyncState("ready");
      } catch {
        if (!cancelled) {
          /* A failed merge must not trap the shopper on a loading screen: keep
             the local cart and let them carry on. */
          useCartStore.getState().setSyncState("ready");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  /* Reload when the tab comes back, so another device's change shows up. */
  useEffect(() => {
    if (!userId) return;

    async function reload() {
      const state = useCartStore.getState();

      if (state.pending > 0) return;

      try {
        const result = await fetchSavedCart();

        if (result.ok && useCartStore.getState().pending === 0) {
          useCartStore.getState().setLines(result.lines);
        }
      } catch {
        /* Offline or a dropped request: keep what we have and try again later. */
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        void reload();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [userId]);

  /* Sign-out: clear the local cart so the next person on the device sees none.
     The saved cart stays in Neon, so the shopper gets it back on sign-in. */
  useEffect(() => {
    if (userId) return;
    if (useCartStore.getState().syncState === "unknown") return;

    useCartStore.getState().clear();
    mergedFor.current = null;
  }, [userId]);

  return null;
}

/**
 * FRD F5. Mirrors one local cart change to the server when signed in, and adopts
 * the server's response as the new local cart. Returns true when a server write
 * happened.
 */
export async function pushCartChange(
  change:
    | { kind: "add"; productId: string; size: string; quantity: number }
    | { kind: "setQuantity"; productId: string; size: string; quantity: number }
    | { kind: "remove"; productId: string; size: string; quantity?: number },
): Promise<boolean> {
  const state = useCartStore.getState();

  if (!state.userId) return false;

  const payload = {
    productId: change.productId,
    size: change.size,
    quantity: change.kind === "remove" ? 1 : change.quantity,
  };

  state.beginWrite();

  try {
    const result =
      change.kind === "add"
        ? await addSavedCartLine(payload)
        : change.kind === "setQuantity"
          ? await setSavedCartQuantity(payload)
          : await removeSavedCartLine(payload);

    if (result.ok) {
      useCartStore.getState().setLines(result.lines);
      return true;
    }

    /* The server refused, so its version of the cart is the truth. */
    const refreshed = await fetchSavedCart();

    if (refreshed.ok) {
      useCartStore.getState().setLines(refreshed.lines);
    }

    return false;
  } catch {
    return false;
  } finally {
    useCartStore.getState().endWrite();
  }
}