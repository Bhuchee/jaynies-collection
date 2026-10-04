import { apiJson, serverError, unauthenticated } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-auth";
import { getSavedCart } from "@/lib/cart";

/*
  FRD F14 and F17. GET /api/v1/cart

  This is the endpoint the app polls every two seconds, so it must be cheap and
  must never be cached.

  itemCount is total quantity, matching the website's badge, and subtotalKobo is
  summed from products.price_kobo read at this instant. The client never sends a
  price and never computes the total (AGENTS.md rules 14 and 15).
*/

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) return unauthenticated();

    const cart = await getSavedCart(userId);

    const itemCount = cart.lines.reduce((total, line) => total + line.quantity, 0);
    const subtotalKobo = cart.lines.reduce(
      (total, line) => total + line.unitPriceKobo * line.quantity,
      0,
    );

    return apiJson({ lines: cart.lines, itemCount, subtotalKobo });
  } catch (error) {
    return serverError("GET /api/v1/cart", error);
  }
}