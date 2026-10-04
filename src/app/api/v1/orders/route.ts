import { apiJson, serverError, unauthenticated } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-auth";
import { getOrdersForUser } from "@/lib/queries";

/*
  FRD F14. GET /api/v1/orders

  Scoped to the caller's id by getOrdersForUser (AGENTS.md rule 16), so this can
  only ever return the signed-in shopper's own orders. createdAt goes out as an
  ISO-8601 string; the app formats it for display using the same month names as
  lib/dates.ts rather than trusting the device locale.
*/

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) return unauthenticated();

    const orders = await getOrdersForUser(userId);

    return apiJson({
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        totalKobo: order.totalKobo,
        itemCount: order.itemCount,
        firstImageUrl: order.firstImageUrl,
      })),
    });
  } catch (error) {
    return serverError("GET /api/v1/orders", error);
  }
}