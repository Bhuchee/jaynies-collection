import { and, eq, gt } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

/*
  FRD F15 and AGENTS.md rule 17. One resolver for who is calling, used by every
  authenticated route.

  It accepts EITHER an Authorization: Bearer <token> header OR the Auth.js
  cookie session, bearer first. Supporting both is what lets the website and the
  app call the SAME endpoints (FRD F14): the website arrives with a cookie, the
  app with a bearer token.

  Why a sessions row is a valid bearer token: Auth.js stores
  sessions.sessionToken in plaintext and looks it up by equality (confirmed in
  node_modules/@auth/core/lib/actions/session.js, getSessionAndUser(sessionToken)).
  So a direct equality lookup, plus the expiry check, is exactly what Auth.js
  itself does. There is no parallel token system to maintain, and a token that
  works here is the same credential the website uses.

  A token is never logged, never placed in a query string, and never returned to
  another user.
*/

export type ApiUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

/** Reads a bearer token from the Authorization header, or null. */
function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");

  if (!header) return null;

  const match = /^Bearer\s+(\S+)$/.exec(header.trim());
  if (!match) return null;

  return match[1];
}

/** Looks up a sessions row by equality and checks it has not expired. */
async function userFromToken(token: string): Promise<ApiUser | null> {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.sessionToken, token), gt(sessions.expires, new Date())))
    .limit(1);

  return row ?? null;
}

/**
 * The signed-in shopper for this request, or null when there is no usable
 * session. Bearer wins over cookie, so a request that carries both is
 * authenticated as the bearer token's owner.
 */
export async function getUserFromRequest(
  request: Request,
): Promise<ApiUser | null> {
  const token = readBearerToken(request);

  if (token) {
    const fromToken = await userFromToken(token);
    /* A present-but-stale bearer token must NOT silently fall back to a cookie:
       the app would keep polling with a dead token while looking signed in. */
    return fromToken;
  }

  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  };
}

/**
 * The shopper's id, or null. Routes use this to scope every query
 * (AGENTS.md rule 16): a route must never take a userId from the request.
 */
export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const user = await getUserFromRequest(request);
  return user?.id ?? null;
}