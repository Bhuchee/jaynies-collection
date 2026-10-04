import { notFound, serverError, unauthenticated } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-auth";
import { getOrderForUser } from "@/lib/queries";

/*
  FRD F14. GET /api/v1/orders/[orderNumber]

  getOrderForUser looks the order number up TOGETHER WITH the caller's id, so
  another shopper's order number simply does not resolve and this returns 404.
  There is no separate ownership check that could be forgotten, and the endpoint
  never confirms that an order number exists (AGENTS.md rule 16).

  Money stays integer kobo. The six delivery fields are nullable (change request
  A), so they pass through as null rather than as empty strings, which is what
  lets the app tell "not provided" from "typed nothing".
*/

export async function GET(
  request: Request,
  context: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) return unauthenticated();

    const { orderNumber } = await context.params;

    const found = await getOrderForUser(orderNumber, userId);

    if (!found) return notFound("We could not find that order.");

    const { order, items } = found;

    return Response.json(
      {
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
          deliveryZone: order.deliveryZone,
          subtotalKobo: order.subtotalKobo,
          deliveryFeeKobo: order.deliveryFeeKobo,
          totalKobo: order.totalKobo,
          recipientName: order.recipientName,
          phone: order.phone,
          addressLine: order.addressLine,
          city: order.city,
          state: order.state,
          country: order.country,
          note: order.note,
          emailSentAt: order.emailSentAt ? order.emailSentAt.toISOString() : null,
        },
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          imageUrl: item.imageUrl,
          size: item.size,
          unitPriceKobo: item.unitPriceKobo,
          quantity: item.quantity,
          lineTotalKobo: item.lineTotalKobo,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return serverError("GET /api/v1/orders/[orderNumber]", error);
  }
}