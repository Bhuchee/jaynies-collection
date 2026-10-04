import { auth, signIn } from "@/auth";
import { badRequest, serverError } from "@/lib/api-response";
import {
  createMobileAuthCode,
  isAllowedRedirectUri,
} from "@/lib/mobile-auth";

/*
  FRD F15 steps 5 and 6. GET /api/v1/auth/mobile/callback

  Two cases:

    - No session yet: run the EXISTING Auth.js Google sign-in, which returns to
      this same URL with a session cookie set. The browser lands here again.
    - Session already present: issue the one-time code immediately.

  Either way the end of this route is the same: create a code row and redirect to
  the allowlisted app URI with the code and the state. The raw code appears in the
  redirect URL and nowhere else; only its SHA-256 hash is stored.

  The callback is deliberately NOT a PKCE verifier. It stores the challenge that
  /start supplied; the proof that the app holds the matching verifier only has
  to be checked at /exchange, where the verifier actually arrives.
*/

function readParams(url: URL) {
  const redirectUri = url.searchParams.get("redirect_uri") ?? "";
  const codeChallenge = url.searchParams.get("code_challenge") ?? "";
  const state = url.searchParams.get("state") ?? "";

  return { redirectUri, codeChallenge, state };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { redirectUri, codeChallenge, state } = readParams(url);

    /* Re-checked here, not just in /start. The callback is a public URL, so it
       must not trust parameters that arrived on it from anywhere. */
    if (!redirectUri || !isAllowedRedirectUri(redirectUri)) {
      return badRequest("That redirect address is not allowed.");
    }

    if (!codeChallenge || !state) {
      return badRequest("Missing sign-in parameters.");
    }

    const session = await auth();

    if (!session?.user?.id) {
      /* Auth.js will redirect to Google and come back here with a session. */
      await signIn("google", {
        redirectTo: url.toString(),
      });

      /* signIn returns only in the "already signed in" case, handled above. */
      return badRequest("Could not start sign-in.");
    }

    const code = await createMobileAuthCode({
      userId: session.user.id,
      codeChallenge,
      state,
      redirectUri,
    });

    const target = new URL(redirectUri);

    target.searchParams.set("code", code);
    target.searchParams.set("state", state);

    return Response.redirect(target.toString(), 302);
  } catch (error) {
    return serverError("GET /api/v1/auth/mobile/callback", error);
  }
}