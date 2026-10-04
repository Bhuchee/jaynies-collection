import {
  apiJson,
  badRequest,
  serverError,
  unauthenticated,
} from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-auth";
import { MIN_LINE_QUANTITY } from "@/lib/validation";
import {
  addSavedCartLine,
  removeSavedCartLine,
  setSavedCartQuantity,
  type SavedCart,
} from "@/lib/cart";

/*
  FRD F14. POST, PATCH and DELETE on /api/v1/cart/items.

  All three return the WHOLE cart in the same shape as GET /api/v1/cart, so the
  client adopts the server's answer in one step instead of guessing the new
  total. That is the existing CartActionResult behaviour, kept deliberately.

  A DELETE accepts productId and size from the query string OR the body, because
  some React Native fetch versions are unhappy with a DELETE body, and this
  endpoint is called by both the app and the website.

  No route holds business logic: each validates its input, calls a lib/cart.ts
  function, and formats the result.
*/

function cartPayload(cart: SavedCart) {
  const itemCount = cart.lines.reduce((total, line) => total + line.quantity, 0);
  const subtotalKobo = cart.lines.reduce(
    (total, line) => total + line.unitPriceKobo * line.quantity,
    0,
  );

  return { lines: cart.lines, itemCount, subtotalKobo };
}

/** Reads productId, size and quantity from the body, falling back to the query. */
async function readInput(request: Request): Promise<Record<string, unknown>> {
  const url = new URL(request.url);
  let body: Record<string, unknown> = {};

  try {
    const parsed: unknown = await request.json();
    if (parsed && typeof parsed === "object") {
      body = parsed as Record<string, unknown>;
    }
  } catch {
    /* An empty body is fine; the query string carries the line. */
  }

  return {
    productId: body.productId ?? url.searchParams.get("productId"),
    size: body.size ?? url.searchParams.get("size"),
    quantity: body.quantity ?? url.searchParams.get("quantity") ?? undefined,
  };
}

/**
 * FRD F14. DELETE only needs to identify the line, so a missing quantity
 * defaults to 1 rather than failing cartLineSchema.
 *
 * Removing a line does not consume a quantity, so this is a dummy the shared
 * schema can validate; the value is never read by removeSavedCartLine.
 */
function withQuantityDefault(input: Record<string, unknown>) {
  return {
    ...input,
    quantity: input.quantity ?? MIN_LINE_QUANTITY,
  };
}

/** FRD F14. Adds to any existing quantity for the same product and size. */
export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) return unauthenticated();

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return badRequest("Send a JSON body with productId, size and quantity.");
    }

    const result = await addSavedCartLine(userId, body);

    if (!result.ok) return badRequest(result.error ?? "That piece is not valid.");

    return apiJson(cartPayload(result), 201);
  } catch (error) {
    return serverError("POST /api/v1/cart/items", error);
  }
}

/** FRD F14. Sets an exact quantity on one line. */
export async function PATCH(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) return unauthenticated();

    const result = await setSavedCartQuantity(userId, await readInput(request));

    if (!result.ok) return badRequest(result.error ?? "That piece is not valid.");

    return apiJson(cartPayload(result));
  } catch (error) {
    return serverError("PATCH /api/v1/cart/items", error);
  }
}

/** FRD F14. Removes one line. */
export async function DELETE(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) return unauthenticated();

    const result = await removeSavedCartLine(
      userId,
      withQuantityDefault(await readInput(request)),
    );

    if (!result.ok) return badRequest(result.error ?? "That piece is not valid.");

    return apiJson(cartPayload(result));
  } catch (error) {
    return serverError("DELETE /api/v1/cart/items", error);
  }
}