import { apiJson, serverError } from "@/lib/api-response";
import { deleteMobileSession } from "@/lib/mobile-auth";

/*
  FRD F15. DELETE /api/v1/auth/mobile/session

  Sign-out for the app. It deletes EXACTLY ONE sessions row, the one this request
  authenticated with.

  That narrowness is the point. The website's cookie session and any other device
  are separate rows, so signing out of the app does not sign the shopper out of
  the website, and signing out of the website does not strand the app. It also
  means a bug here can never clear everybody's sessions.

  The token is read from the Authorization header and never echoed back.
*/

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;

  const match = /^Bearer\s+(\S+)$/.exec(header.trim());
  return match ? match[1] : null;
}

export async function DELETE(request: Request) {
  try {
    const token = bearerToken(request);

    /* Signing out without a usable token is a no-op success, not an error: the
       app clears its secure store either way and the shopper ends signed out. */
    if (!token) return apiJson({ ok: true });

    await deleteMobileSession(token);

    return apiJson({ ok: true });
  } catch (error) {
    return serverError("DELETE /api/v1/auth/mobile/session", error);
  }
}