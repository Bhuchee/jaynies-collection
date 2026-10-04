"use client";

import type { SavedCartLine } from "@/lib/cart";

/*
  FRD F5 and F14. The website's cart CLIENT, talking to the same /api/v1/cart
  endpoints the app uses.

  This is the piece that makes "the same endpoints" literally true rather than
  merely "the same behaviour". Before this, the website called Server Actions
  that wrapped the same lib/cart.ts functions; now it makes the same HTTP calls
  the app makes, with the same request and response shapes. The only difference
  between the two callers is how they authenticate:
    - website: the Auth.js cookie, sent automatically by fetch
    - app:     an Authorization: Bearer header

  credentials: "same-origin" is what carries the cookie. Without it the website
  would arrive at the API unauthenticated and every call would 401.

  No absolute URL is used anywhere: a relative /api/v1 path means this keeps
  working on localhost, on a preview domain and on production without a single
  hard-coded host (AGENTS.md rule 7).

  The result shape is deliberately CartActionResult-compatible, so
  cart-sync.tsx needed no behavioural change: still one-step adoption of the
  server's answer.
*/

export type CartActionResult = {
  ok: boolean;
  lines: SavedCartLine[];
  error?: string;
};

/** Turns a non-2xx response into the same ok:false shape as the actions used. */
async function toResult(response: Response): Promise<CartActionResult> {
  if (response.ok) {
    const payload = (await response.json()) as { lines: SavedCartLine[] };
    return { ok: true, lines: payload.lines };
  }

  let error = "Could not reach the shop. Please try again.";

  try {
    const payload = (await response.json()) as {
      error?: { message?: string };
    };
    if (payload?.error?.message) error = payload.error.message;
  } catch {
    /* A non-JSON error body is not worth surfacing; keep the generic message. */
  }

  return { ok: false, lines: [], error };
}

async function request(
  path: string,
  init?: RequestInit,
): Promise<CartActionResult> {
  try {
    const response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    return await toResult(response);
  } catch {
    /* Offline or a dropped request. The caller keeps its local cart, which is
       the same behaviour the Server Actions had when they threw. */
    return { ok: false, lines: [], error: "Could not reach the shop." };
  }
}

/** FRD F5. Reads the saved cart. This is the website's 2-second-equivalent: the
    website reloads on focus rather than polling (FRD F17). */
export async function fetchSavedCart(): Promise<CartActionResult> {
  return request("/api/v1/cart");
}

/**
 * FRD F5 sign-in merge.
 *
 * The merge is deliberately NOT exposed as an HTTP endpoint: it takes an array of
 * guest lines, it is a website-only concern (the app has no local cart to merge),
 * and it still runs through the Server Action so the one-time merge keeps its
 * existing, well-tested path. The shared logic underneath is the same
 * lib/cart.ts function the API's cart routes call.
 */
export async function mergeGuestCart(
  guestLines: unknown,
): Promise<CartActionResult> {
  const { mergeGuestCart: mergeAction } = await import("@/actions/cart");
  return mergeAction(guestLines);
}

export async function addSavedCartLine(input: unknown): Promise<CartActionResult> {
  return request("/api/v1/cart/items", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function setSavedCartQuantity(
  input: unknown,
): Promise<CartActionResult> {
  return request("/api/v1/cart/items", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function removeSavedCartLine(
  input: unknown,
): Promise<CartActionResult> {
  return request("/api/v1/cart/items", {
    method: "DELETE",
    body: JSON.stringify(input),
  });
}