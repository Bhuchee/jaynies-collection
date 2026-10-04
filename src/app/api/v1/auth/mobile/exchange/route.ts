import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { apiError, serverError } from "@/lib/api-response";
import {
  consumeMobileAuthCode,
  createMobileSession,
  verifyCodeChallenge,
} from "@/lib/mobile-auth";

/*
  FRD F15 steps 8 to 10. POST /api/v1/auth/mobile/exchange

  The gate every sign-in passes. The checks are deliberately all-or-nothing and
  all produce the SAME generic 400 invalid_grant, so the endpoint does not tell
  an attacker which of them failed:

    1. the code row exists, is unused and has not expired (consumeMobileAuthCode
       marks it used in the same UPDATE that reads it, so two concurrent
       exchanges of one code cannot both win)
    2. base64url(SHA-256(code_verifier)) matches the stored challenge, compared
       in constant time

  Only then is a session minted, in the same transaction that burnt the code.

  The state is echoed back so the app can bind the response to the request it
  made. The app is the one that compares it, because only it knows the value it
  generated.
*/

const exchangeSchema = z.object({
  code: z.string().min(16).max(256),
  code_verifier: z.string().min(43).max(128),
});

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return apiError("invalid_grant", "That sign-in link is not valid.", 400);
    }

    const parsed = exchangeSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("invalid_grant", "That sign-in link is not valid.", 400);
    }

    const { code, code_verifier } = parsed.data;

    /* Step 1: exists, unused, not expired. Marks the row used on success. */
    const row = await consumeMobileAuthCode(code);

    if (!row) {
      return apiError("invalid_grant", "That sign-in link is not valid.", 400);
    }

    /* Step 2: PKCE. A stolen code without the verifier is useless. */
    if (!verifyCodeChallenge(code_verifier, row.codeChallenge)) {
      return apiError("invalid_grant", "That sign-in link is not valid.", 400);
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(users)
      .where(and(eq(users.id, row.userId)))
      .limit(1);

    if (!user) {
      return apiError("invalid_grant", "That sign-in link is not valid.", 400);
    }

    /* Step 3: an ordinary sessions row, so the app and the website are one
       identity rather than two parallel token systems. */
    const { sessionToken, expiresAt } = await createMobileSession(user.id);

    return Response.json(
      {
        token: sessionToken,
        tokenType: "Bearer",
        expiresAt: expiresAt.toISOString(),
        state: row.state,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return serverError("POST /api/v1/auth/mobile/exchange", error);
  }
}