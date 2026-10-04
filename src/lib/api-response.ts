import { NextResponse } from "next/server";

/*
  FRD F14. The API's response contract, in ONE place so every route returns the
  same shape.

  Errors are always { "error": { "code", "message" } } and the message is safe to
  show a shopper: a route must never put a stack trace, a SQL error or a token
  in it. Unexpected errors are logged server-side and replaced with a generic
  message, so a bug cannot leak the shape of the database.

  Cache-Control: no-store is on every authenticated response. A stale cart is
  the one bug this project cannot have, and the app polls this endpoint every two
  seconds.
*/

export type ApiErrorBody = {
  error: { code: string; message: string };
};

export function apiJson<T>(data: T, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data as object, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } } as ApiErrorBody, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** 400: the request body or query did not pass validation. */
export function badRequest(message: string) {
  return apiError("invalid_request", message, 400);
}

/**
 * 401: no session, or an expired or unknown bearer token. The message never
 * says which, so the endpoint cannot be used to probe for valid tokens.
 */
export function unauthenticated() {
  return apiError("unauthenticated", "Please sign in again.", 401);
}

/**
 * 404: genuinely missing, or someone else's. A shopper asking for an order that
 * is not theirs gets this, never a 403, so the endpoint does not confirm that the
 * order number exists (FRD F14).
 */
export function notFound(message = "Not found.") {
  return apiError("not_found", message, 404);
}

/**
 * 500: something unexpected. The real error is logged for us and the shopper
 * gets a message that reveals nothing.
 */
export function serverError(context: string, error: unknown) {
  console.error(`${context}:`, error);
  return apiError("server_error", "Something went wrong. Please try again.", 500);
}