/*
  FRD F15 steps 1 to 11. The mobile sign-in hand-off, in one hook.

  The shape of it:

    1. generate code_verifier + state in MEMORY ONLY
    2. compute the S256 challenge and POST /auth/mobile/start
    3. open the returned auth_url in the SYSTEM BROWSER with openAuthSessionAsync
    4. the browser runs the website's existing Google sign-in
    5. the site redirects back to jaynies://auth/callback?code=...&state=...
    6. compare state, and ONLY if it matches, exchange the code + verifier
    7. store the bearer token in expo-secure-store

  Two decisions worth stating:

    - The system browser, never a WebView. Google refuses to sign in inside an
      embedded webview, so expo-web-browser is a hard requirement, not a
      preference.
    - state is checked BEFORE the exchange, not after. A response whose state
      does not match this attempt is discarded and nothing is exchanged.
*/

import { useCallback, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { router } from "expo-router";

import { exchangeCode, startMobileAuth } from "@/api/client";
import { createAuthPair, parseCallbackUrl } from "@/api/pkce";
import { useSession } from "@/store/session";

/*
  The scheme declared in app.json. Expo Go substitutes its own exp:// scheme, so
  the allowlist on the server accepts either; the app does not need to know which
  one it is running under.
*/
const APP_SCHEME = Constants.expoConfig?.scheme ?? "jaynies";
const CALLBACK_URL = `${APP_SCHEME}://auth/callback`;

/**
 * Five minutes is generous on purpose: the shopper may be picking a Google
 * account, typing a password or hitting a second factor. The one-time code only
 * lives two minutes, but this timeout is about not leaving a browser sheet open
 * on a phone the shopper has walked away from.
 *
 * SDK 57 removed expo-web-browser's own `timeoutInMs` option, so the timeout is
 * enforced here with a Promise.race. Without it the sheet would stay open until
 * the shopper came back and dismissed it.
 */
const AUTH_SESSION_TIMEOUT_MS = 5 * 60 * 1000;

type AuthSessionResult = Awaited<ReturnType<typeof WebBrowser.openAuthSessionAsync>>;

function openAuthSessionWithTimeout(
  authUrl: string,
  redirectUrl: string,
): Promise<AuthSessionResult> {
  const opened = WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

  const timeout = new Promise<AuthSessionResult>((resolve) => {
    setTimeout(() => {
      void WebBrowser.dismissAuthSession();
      /* Treated exactly like a cancellation by the caller: no error dialog, the
         shopper simply taps sign in again. */
      resolve({ type: "cancel" } as AuthSessionResult);
    }, AUTH_SESSION_TIMEOUT_MS);
  });

  return Promise.race([opened, timeout]);
}

export function useSignIn() {
  const signInToStore = useSession((state) => state.signIn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    if (busy) return;

    setBusy(true);
    setError(null);

    /* The verifier and state live only in these locals. Nothing about this
       attempt is written to storage. */
    const { codeVerifier, codeChallenge, state } = await createAuthPair();

    try {
      const { auth_url: authUrl } = await startMobileAuth({
        redirectUri: CALLBACK_URL,
        codeChallenge,
        state,
      });

      /*
        openAuthSessionAsync keeps this app alive while the browser is in front,
        and resolves with the deep link the browser was redirected to. dismissAuthSession
        then closes the browser sheet if it is still open.
      */
      const result = await openAuthSessionWithTimeout(authUrl, CALLBACK_URL);

      WebBrowser.dismissAuthSession();

      if (result.type !== "success") {
        /* Cancelled, or the timeout fired. Not an error worth shouting about. */
        setError("Sign-in was cancelled. Please try again.");
        return;
      }

      const callback = parseCallbackUrl(result.url);

      if (!callback) {
        setError("That sign-in link was not valid. Please try again.");
        return;
      }

      /* FRD F15 step 7. Check state BEFORE exchanging anything. */
      if (callback.state !== state) {
        setError("That sign-in link did not come from this app. Please try again.");
        return;
      }

      const exchanged = await exchangeCode({
        code: callback.code,
        codeVerifier,
      });

      await signInToStore(exchanged.token, exchanged.user);

      router.replace("/account");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not sign you in. Please try again.",
      );
    } finally {
      /* The verifier is dropped here. It is never stored or logged. */
      setBusy(false);
    }
  }, [busy, signInToStore]);

  return { signIn, busy, error };
}