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

import type { ProductDto, SavedCartLine } from "./types";

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
 * The server could not be reached at all: DNS, no network, wrong host, or the
 * request timed out.
 *
 * This is deliberately a DIFFERENT class from ApiError, because "we never got an
 * answer" and "the server said no" need different fixes from the shopper and
 * different words on screen. Folding a network failure into a generic 500 is
 * what made a wrong API host look like a broken server.
 */
export class NetworkError extends Error {
  readonly host: string;

  constructor(host: string, cause: unknown) {
    super(`Could not reach ${host}.`);
    this.name = "NetworkError";
    this.host = host;
    /* Keep the underlying reason for the console, never for the UI. */
    this.cause = cause;
  }
}

/** The host the app is talking to, for error messages. */
export function apiHost(): string {
  try {
    return new URL(API_URL).host;
  } catch {
    return API_URL;
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
      /*
        A 404 in particular is worth naming out loud. A wrong API host resolves and
        answers, but with a 404 that looks identical to "the server is broken"
        unless we say what actually happened.
      */
      let code = `http_${response.status}`;
      let message =
        response.status === 404
          ? `Not found on ${apiHost()}. Check the address in mobile/.env.`
          : `The server returned ${response.status}.`;

      try {
        const payload = (await response.json()) as ApiErrorBody;
        if (payload?.error?.code) code = payload.error.code;
        /* The server's own message wins when it sent one, because it is written
           for a shopper ("That piece is not available"). */
        if (payload?.error?.message) message = payload.error.message;
      } catch {
        /* keep the status-based message */
      }

      console.warn(`[api] ${method} ${path} -> ${response.status} (${code})`);
      throw new ApiError(response.status, code, message);
    }

    return (await response.json()) as T;
  } catch (error) {
    /*
      fetch only rejects when there was no usable response: bad host, no network,
      or the abort above. Anything that got a status already threw an ApiError
      above and must not be relabelled as a network problem.
    */
    if (error instanceof ApiError) throw error;

    const aborted = error instanceof Error && error.name === "AbortError";
    console.warn(
      `[api] ${method} ${path} never reached ${apiHost()} (${aborted ? "timed out" : String(error)})`,
    );

    throw new NetworkError(apiHost(), error);
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

/**
 * Resolves an image path from the API into something fetchable.
 *
 * The API already returns ABSOLUTE urls, built from NEXT_PUBLIC_SITE_URL on the
 * server. This is the defensive path for the other case: a relative
 * "/products/x.webp" has no meaning to the app, because the app has no origin of
 * its own to resolve it against, so it is resolved against the API base here.
 */
export function resolveImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;

  /* Already absolute (http, https or exp): nothing to do. */
  if (/^[a-z][a-z0-9+.-]*:/i.test(imageUrl)) return imageUrl;

  return `${API_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
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

/* ------------------------------------------------------------- Catalogue */

/*
  FRD F16. The shop's filters, matching the website's exactly: the same category
  slugs, the same gender values, and the same `q` search. The server reuses
  parseShopFilters, so the app cannot drift from the website here.
*/
export type ProductFilters = {
  category?: string;
  gender?: string;
  q?: string;
};

export function getProducts(filters: ProductFilters = {}) {
  const query = new URLSearchParams();

  if (filters.category) query.set("category", filters.category);
  if (filters.gender) query.set("gender", filters.gender);
  if (filters.q) query.set("q", filters.q);

  const suffix = query.toString();

  return apiFetch<{ products: ProductDto[]; total: number }>(
    `/api/v1/products${suffix ? `?${suffix}` : ""}`,
  );
}

export function getProductBySlug(slug: string) {
  return apiFetch<{ product: ProductDto }>(
    `/api/v1/products/${encodeURIComponent(slug)}`,
  );
}

/* ------------------------------------------------------- Cart mutations */

/*
  Every cart mutation returns the WHOLE cart, so the client replaces its state
  with the server's answer in one step and never has to guess the new total
  (FRD F14). Totals are always recalculated by the server.
*/
export type CartLineInput = {
  productId: string;
  size: string;
  quantity: number;
};

export function addCartItem(token: string, input: CartLineInput) {
  return apiFetch<CartResponse>("/api/v1/cart/items", {
    method: "POST",
    token,
    body: input,
  });
}

export function setCartItemQuantity(token: string, input: CartLineInput) {
  return apiFetch<CartResponse>("/api/v1/cart/items", {
    method: "PATCH",
    token,
    body: input,
  });
}

export function removeCartItem(
  token: string,
  input: { productId: string; size: string },
) {
  return apiFetch<CartResponse>("/api/v1/cart/items", {
    method: "DELETE",
    token,
    body: input,
  });
}

/**
 * FRD F16. The website's checkout, opened in the system browser.
 *
 * The app hands off rather than rebuilding checkout, so there is one place that
 * calculates an order total and one place that sends the email.
 */
export function checkoutUrl(): string {
  return `${API_URL}/checkout`;
}