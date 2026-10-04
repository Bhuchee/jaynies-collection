import { z } from "zod";
import { apiError, badRequest, serverError } from "@/lib/api-response";
import {
  ALLOWED_REDIRECT_PREFIXES,
  isAllowedRedirectUri,
} from "@/lib/mobile-auth";

/*
  FRD F15 step 2. POST /api/v1/auth/mobile/start

  This endpoint does NOT authenticate. It is what CREATES authentication, so it
  has to be callable by an app holding nothing but a code_challenge.

  It validates the redirect_uri against the allowlist FIRST, before anything is
  created or any URL is built. That ordering matters: this endpoint is an open
  redirect waiting to happen if the scheme is checked late or loosely, and a
  leaked code is a full account takeover for two minutes.

  It returns an auth_url for the app to open in the system browser with
  expo-web-browser. The Auth.js Google sign-in that follows is the existing
  website flow: no new OAuth client, no new provider.
*/

const startSchema = z.object({
  redirect_uri: z.string().min(1).max(512),
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: z.literal("S256"),
  state: z.string().min(8).max(256),
});

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return badRequest("Send a JSON body.");
    }

    const parsed = startSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Send redirect_uri, code_challenge, state and S256.");
    }

    /* FRD F15 step 4. The allowlist gate. Exact scheme prefix, no wildcards. */
    if (!isAllowedRedirectUri(parsed.data.redirect_uri)) {
      return apiError(
        "invalid_redirect_uri",
        "That redirect address is not allowed.",
        400,
      );
    }

    /*
      The Auth.js sign-in carries the PKCE parameters and the allowlisted
      redirect through to the callback, which is what ties the eventual code to
      THIS request. auth_url is built from NEXT_PUBLIC_SITE_URL, never from
      localhost, because a physical phone cannot reach a laptop on :3000.
    */
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!siteUrl) {
      return apiError(
        "misconfigured",
        "Sign-in is not available right now.",
        500,
      );
    }

    const authUrl = new URL("/api/v1/auth/mobile/callback", siteUrl);

    authUrl.searchParams.set("redirect_uri", parsed.data.redirect_uri);
    authUrl.searchParams.set("code_challenge", parsed.data.code_challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("state", parsed.data.state);
    /* Tells the callback to run the Google sign-in rather than assume a session. */
    authUrl.searchParams.set("sign_in", "1");

    return Response.json(
      {
        auth_url: authUrl.toString(),
        allowed_schemes: ALLOWED_REDIRECT_PREFIXES,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return serverError("POST /api/v1/auth/mobile/start", error);
  }
}