import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { mobileAuthCodes, sessions } from "@/db/schema";

/*
  FRD F15. The mobile sign-in bridge, in one module so the allowlist, the code
  lifecycle and the PKCE maths are reviewable together.

  Nothing here stores or logs a raw one-time code or a code_verifier. Only
  SHA-256 hashes and the S256 challenge reach the database.
*/

export const CODE_TTL_MS = 2 * 60 * 1000;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/*
  FRD F15 step 4. The redirect-scheme allowlist. This is the defence against the
  sign-in endpoint being used as an open redirect that leaks an auth code to an
  attacker's app, so the check is exact-scheme and nothing looser.

  jaynies://  the app scheme, used by a standalone build
  exp://      Expo Go, which intercepts its own scheme during development

  Kept as a code constant rather than an env var (AGENTS.md Decisions) so it is
  reviewable in the diff, and because it is not a secret.
*/
export const ALLOWED_REDIRECT_PREFIXES = ["jaynies://", "exp://"] as const;

export function isAllowedRedirectUri(value: string): boolean {
  return ALLOWED_REDIRECT_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** SHA-256, base64url. Used for both the code hash and the PKCE challenge. */
function sha256Base64Url(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("base64url");
}

export function hashCode(code: string): string {
  return sha256Base64Url(code);
}

export function generateCode(): string {
  return randomToken();
}

/**
 * The PKCE S256 challenge for a verifier: base64url(SHA-256(code_verifier)).
 * The app computes exactly this and sends it to /start; only the verifier is
 * ever sent back, and only from the device that generated it.
 */
export function codeChallengeFor(codeVerifier: string): string {
  return sha256Base64Url(codeVerifier);
}

/**
 * FRD F15 step 9 and AGENTS.md rule 18. Constant-time comparison of the verifier
 * against the stored challenge, so a wrong verifier cannot be discovered one
 * byte at a time by timing the rejection.
 */
export function verifyCodeChallenge(
  codeVerifier: string,
  storedChallenge: string,
): boolean {
  const candidate = Buffer.from(sha256Base64Url(codeVerifier), "utf8");
  const expected = Buffer.from(storedChallenge, "utf8");

  /* timingSafeEqual throws on a length mismatch, so compare lengths first. The
     lengths are both fixed base64url digests, so this leaks nothing useful. */
  if (candidate.length !== expected.length) return false;

  return timingSafeEqual(candidate, expected);
}

/** Creates a code row. Only the hash and the challenge are persisted. */
export async function createMobileAuthCode(params: {
  userId: string;
  codeChallenge: string;
  state: string;
  redirectUri: string;
}) {
  const code = generateCode();

  await db.insert(mobileAuthCodes).values({
    codeHash: hashCode(code),
    codeChallenge: params.codeChallenge,
    state: params.state,
    userId: params.userId,
    redirectUri: params.redirectUri,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });

  return code;
}

/**
 * FRD F15 step 9. The single gate every exchange passes through. Returns null on
 * ANY failure, so the caller cannot tell which check failed.
 *
 * Note it marks the row used in the same statement that reads it, so two
 * concurrent exchanges of one code cannot both succeed.
 */
export async function consumeMobileAuthCode(code: string) {
  const [row] = await db
    .update(mobileAuthCodes)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(mobileAuthCodes.codeHash, hashCode(code)),
        isNull(mobileAuthCodes.usedAt),
        gt(mobileAuthCodes.expiresAt, new Date()),
      ),
    )
    .returning();

  return row ?? null;
}

/** The row as it stands, for checking before the verifier is compared. */
export async function findMobileAuthCode(code: string) {
  const [row] = await db
    .select()
    .from(mobileAuthCodes)
    .where(eq(mobileAuthCodes.codeHash, hashCode(code)))
    .limit(1);

  return row ?? null;
}

/**
 * FRD F15 step 10. Mints the bearer token as an ordinary sessions row, so the app
 * and the website share one identity. Expired rows for that user are swept in
 * the same batch, because there is no refresh flow.
 */
export async function createMobileSession(userId: string) {
  const sessionToken = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.batch([
    db.delete(sessions).where(lt(sessions.expires, new Date())),
    db.insert(sessions).values({ sessionToken, userId, expires: expiresAt }),
  ]);

  return { sessionToken, expiresAt };
}

/** Sign-out deletes exactly one session row, so other surfaces stay signed in. */
export async function deleteMobileSession(sessionToken: string) {
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}

/**
 * FRD F15 and the data model note: expired and used rows are inert, and nothing
 * depends on them afterwards. Exposed so the sweep can be run by hand or later
 * on a schedule.
 */
export async function sweepExpiredCodes() {
  const deleted = await db
    .delete(mobileAuthCodes)
    .where(lt(mobileAuthCodes.expiresAt, new Date()))
    .returning({ id: mobileAuthCodes.id });

  return deleted.length;
}