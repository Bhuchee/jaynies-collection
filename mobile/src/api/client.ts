/*
  FRD F15. The app's API client.

  Two rules shape everything here:

    1. EXPO_PUBLIC_API_URL is a PUBLIC url, never a secret. The app holds no API
       key, no database url and no OAuth secret (AGENTS.md rule 19). The bearer
       token is deliberately NOT read from here: it lives in expo-secure-store,
       so it is never baked into the JS bundle.
    2. Money is always integer kobo across the wire. Nothing here formats a
       price (AGENTS.md rule 14).

  There is no hard-coded localhost. A physical phone cannot reach a laptop on
  :3000, and rule 7 forbids it anyway, so the url comes from the environment and
  a missing value is a loud error rather than a silent fallback.
*/

import type { SavedCartLine } from "./types";

const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!RAW_BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not set. Copy mobile/.env.example to mobile/.env and put the deployed site URL in it.",
  );
}

/* A trailing slash would produce //api/v1 in every path. */
export const API_URL = RAW_BASE_URL.replace(/\/+$/, "");

export type ApiErrorBody = { error: { code: string; message: string } };

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * One place every request goes through, so the bearer token, the timeout and the
 * error shape are handled identically everywhere.
 *
 * `token: null` means "no credentials", which is correct for the public
 * endpoints and produces a 401 from the authenticated ones.
 */
export async function apiFetch<T>(
  path: string,
  options: { token?: string | null; method?: string; body?: unknown } = {},
): Promise<T> {
  const { token = null, method = "GET", body } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (token) headers.Authorization = `Bearer ${token}`;

  /*
    A timeout matters here: the app polls the cart every two seconds, and a
    hung request with no timeout would leave a poll "in flight" forever and stall
    the live sync.
  */
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      let code = "unknown";
      let message = "Something went wrong. Please try again.";

      try {
        const payload = (await response.json()) as ApiErrorBody;
        if (payload?.error?.code) code = payload.error.code;
        if (payload?.error?.message) message = payload.error.message;
      } catch {
        /* keep the generic message */
      }

      throw new ApiError(response.status, code, message);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

/* ------------------------------------------------------------- Endpoints */

/** FRD F16. GET /api/v1/me: a 200 means signed in, a 401 means signed out. */
export function getMe(token: string | null) {
  return apiFetch<MeResponse>("/api/v1/me", { token });
}

export type MeResponse = {
  user: { id: string; name: string | null; email: string | null; image: string | null };
  deliveryZones: { zone: string; label: string; feeKobo: number | null }[];
};

/**
 * FRD F15 step 2. Asks the server where to send the shopper for Google sign-in.
 *
 * `redirect_uri` is the app's own deep link. The server checks it against an
 * allowlist, so it is safe to send: a scheme it does not recognise is rejected
 * there, not here.
 */
export async function startMobileAuth(params: {
  redirectUri: string;
  codeChallenge: string;
  state: string;
}) {
  return apiFetch<{ auth_url: string; allowed_schemes: string[] }>(
    "/api/v1/auth/mobile/start",
    {
      method: "POST",
      body: {
        redirect_uri: params.redirectUri,
        code_challenge: params.codeChallenge,
        code_challenge_method: "S256",
        state: params.state,
      },
    },
  );
}

/** FRD F15 step 8. Trades the one-time code plus the verifier for a token. */
export function exchangeCode(params: { code: string; codeVerifier: string }) {
  return apiFetch<ExchangeResponse>("/api/v1/auth/mobile/exchange", {
    method: "POST",
    body: { code: params.code, code_verifier: params.codeVerifier },
  });
}

export type ExchangeResponse = {
  token: string;
  tokenType: string;
  expiresAt: string;
  state: string;
  user: { id: string; name: string | null; email: string | null; image: string | null };
};

/** FRD F15. Sign-out deletes only this device's session row. */
export function deleteMobileSession(token: string) {
  return apiFetch<{ ok: boolean }>("/api/v1/auth/mobile/session", {
    method: "DELETE",
    token,
  });
}

/** FRD F14 and F17. The cart the app polls every two seconds. */
export function getCart(token: string) {
  return apiFetch<CartResponse>("/api/v1/cart", { token });
}

export type CartResponse = {
  lines: SavedCartLine[];
  itemCount: number;
  subtotalKobo: number;
};