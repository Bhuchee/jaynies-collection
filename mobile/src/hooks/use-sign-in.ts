/*
  FRD F15 steps 1 to 11. The mobile sign-in hand-off, in one hook.

  The flow:
    1. generate code_verifier + state in MEMORY ONLY
    2. compute the S256 challenge and POST /auth/mobile/start
    3. open the returned auth_url in the SYSTEM BROWSER with openAuthSessionAsync
    4. the browser runs the website's existing Google sign-in
    5. the site redirects back to jaynies://auth/callback?code=...&state=...
    6. compare state, and ONLY if it matches, exchange the code + verifier
    7. store the bearer token in expo-secure-store

  Two decisions worth stating:

    - The system browser, never a WebView. Google refuses to sign in inside an
      embedded webview, so expo-web-browser is a hard requirement.
    - state is checked BEFORE the exchange, not after. A response whose state
      does not match this attempt is discarded and nothing is exchanged.

  EVERY failure gets its own message. A single generic "something went wrong"
  cost an afternoon once already: the app was pointed at the wrong host, the 404
  was folded into a generic string, and the real cause was invisible. Each branch
  below names what went wrong, and logs the same detail to the console.

  NOTHING sensitive is ever logged: no token, no one-time code, no code_verifier.
*/

import { useCallback, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { router } from "expo-router";

import { ApiError, NetworkError, apiHost, exchangeCode, startMobileAuth } from "@/api/client";
import { createAuthPair, parseCallbackUrl } from "@/api/pkce";
import { useSession } from "@/store/session";

const APP_SCHEME = Constants.expoConfig?.scheme ?? "jaynies";
const CALLBACK_URL = `${APP_SCHEME}://auth/callback`;

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

    const { codeVerifier, codeChallenge, state } = await createAuthPair();

    try {
      /* --- Stage 1: ask the server where to send the shopper --- */
      let authUrl: string;

      try {
        const start = await startMobileAuth({
          redirectUri: CALLBACK_URL,
          codeChallenge,
          state,
        });
        authUrl = start.auth_url;
      } catch (cause) {
        if (cause instanceof NetworkError) {
          console.warn(`[signin] could not reach ${cause.host}`);
          setError(
            `Could not reach the shop at ${cause.host}. Check the address in mobile/.env and your connection.`,
          );
          return;
        }

        if (cause instanceof ApiError) {
          console.warn(`[signin] start rejected: ${cause.status} ${cause.code}`);
          setError(`Sign-in was rejected (${cause.status} ${cause.code}). ${cause.message}`);
          return;
        }

        console.warn("[signin] start failed", cause);
        setError("Could not start sign-in. Please try again.");
        return;
      }

      /* --- Stage 2: the browser, and the shopper doing the signing in --- */
      const result = await openAuthSessionWithTimeout(authUrl, CALLBACK_URL);

      WebBrowser.dismissAuthSession();

      if (result.type !== "success") {
        console.log("[signin] browser closed without a result:", result.type);
        setError("Sign-in was cancelled before it finished. Please try again.");
        return;
      }

      const callback = parseCallbackUrl(result.url);

      if (!callback) {
        console.warn("[signin] the app was reopened but the link carried no code");
        setError("That sign-in link was not valid. Please try again.");
        return;
      }

      /* --- Stage 3: bind the response to THIS attempt before exchanging --- */
      if (callback.state !== state) {
        console.warn("[signin] state mismatch, discarding the response without exchanging");
        setError(
          "That sign-in link did not come from this app, so it was discarded. Please try again.",
        );
        return;
      }

      /* --- Stage 4: trade the code and verifier for a bearer token --- */
      let token: string;
      let user: { id: string; name: string | null; email: string | null; image: string | null };

      try {
        const exchanged = await exchangeCode({
          code: callback.code,
          codeVerifier,
        });
        token = exchanged.token;
        user = exchanged.user;
      } catch (cause) {
        if (cause instanceof NetworkError) {
          console.warn(`[signin] exchange could not reach ${cause.host}`);
          setError(`Could not reach ${cause.host} to finish signing in.`);
          return;
        }

        if (cause instanceof ApiError) {
          console.warn(`[signin] exchange rejected: ${cause.status} ${cause.code}`);
          setError(
            cause.code === "invalid_grant"
              ? "That sign-in link had already been used or had expired. Please sign in again."
              : `Sign-in was rejected (${cause.status} ${cause.code}).`,
          );
          return;
        }

        console.warn("[signin] exchange failed", cause);
        setError("Could not finish signing in. Please try again.");
        return;
      }

      await signInToStore(token, user);
      router.replace("/(tabs)");
    } finally {
      setBusy(false);
    }
  }, [busy, signInToStore]);

  return { signIn, busy, error };
}