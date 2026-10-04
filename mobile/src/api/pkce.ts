/*
  FRD F15. The one-time code exchange with PKCE.

  This module owns the PKCE maths and the deep-link parsing. It deliberately
  holds NO React and NO navigation, so the rules about secrets and state can be
  read in one place.

  AGENTS.md rule 18 and FRD F15:
    - the verifier is generated on the device and NEVER stored or logged
    - the challenge sent to the server is base64url(SHA-256(verifier)), S256
    - state is generated per attempt and compared on the way back
    - a mismatch on state means the response is discarded and nothing exchanged
*/

import * as Crypto from "expo-crypto";

/*
  FRD F15. The one-time code exchange with PKCE.

  This module owns the PKCE maths and the deep-link parsing. It deliberately
  holds NO React and NO navigation, so the rules about secrets and state can be
  read in one place.

  AGENTS.md rule 18 and FRD F15:
    - the verifier is generated on the device and NEVER stored or logged
    - the challenge sent to the server is base64url(SHA-256(verifier)), S256
    - state is generated per attempt and compared on the way back
    - a mismatch on state means the response is discarded and nothing exchanged

  Why expo-crypto and not node:crypto: React Native has no Node crypto. expo-crypto
  is the supported equivalent, it is included in Expo Go, and it is backed by the
  platform keystore.
*/

const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * base64url WITHOUT padding, which is what PKCE (RFC 7636) requires.
 *
 * Written out rather than imported because React Native has no Buffer and no
 * btoa, and expo-crypto's digest encoding options only offer BASE64 (padded) and
 * HEX, neither of which is base64url.
 */
function bytesToBase64Url(bytes: Uint8Array): string {
  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const byte1 = bytes[index];
    const byte2 = bytes[index + 1];
    const byte3 = bytes[index + 2];

    output += BASE64_ALPHABET[byte1 >> 2];
    output += BASE64_ALPHABET[((byte1 & 0x03) << 4) | ((byte2 ?? 0) >> 4)];
    output += byte2 === undefined ? "" : BASE64_ALPHABET[((byte2 & 0x0f) << 2) | ((byte3 ?? 0) >> 6)];
    output += byte3 === undefined ? "" : BASE64_ALPHABET[byte3 & 0x3f];
  }

  /* RFC 7636 wants the padding characters dropped. */
  return output.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Converts padded base64 to base64url by removing the padding and swapping the two
 * url-safe characters. expo-crypto can only return padded base64.
 */
function base64ToBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 32 random bytes as base64url. The one-time code verifier. */
export async function randomToken(bytes = 32): Promise<string> {
  const random = await Crypto.getRandomBytesAsync(bytes);
  return bytesToBase64Url(random);
}

/** A fresh random state, bound to exactly one sign-in attempt. */
export async function randomState(): Promise<string> {
  return Crypto.randomUUID().replace(/-/g, "");
}

/**
 * base64url(SHA-256(value)), matching src/lib/mobile-auth.ts on the server
 * exactly. That equality is the whole point: the server recomputes this from the
 * verifier the app sends back and compares it to the stored challenge.
 */
export async function sha256Base64Url(value: string): Promise<string> {
  const base64 = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    value,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );

  return base64ToBase64Url(base64);
}

export type AuthPair = {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
};

/** One attempt's worth of PKCE material. Held in memory only. */
export async function createAuthPair(): Promise<AuthPair> {
  const codeVerifier = await randomToken(32);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const state = await randomState();

  return { codeVerifier, codeChallenge, state };
}

export type CallbackResult = { code: string; state: string };

/**
 * Pulls code and state out of a deep link such as
 * jaynies://auth/callback?code=...&state=... .
 *
 * Returns null when the link carries no code, which is the normal case for a
 * link the browser opens that the app is not the right handler for.
 */
export function parseCallbackUrl(url: string): CallbackResult | null {
  const queryStart = url.indexOf("?");

  if (queryStart === -1) return null;

  const query = new URLSearchParams(url.slice(queryStart + 1));
  const code = query.get("code");
  const state = query.get("state");

  if (!code || !state) return null;

  return { code, state };
}