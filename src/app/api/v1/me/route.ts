import { apiJson, serverError, unauthenticated } from "@/lib/api-response";
import { getUserFromRequest } from "@/lib/api-auth";
import { DELIVERY_ZONES } from "@/db/schema";
import {
  DELIVERY_FEES_KOBO,
  DELIVERY_ZONE_LABELS,
} from "@/lib/delivery";

/*
  FRD F14. GET /api/v1/me

  The app's bootstrap call: a 200 means signed in and it can show the shop, a 401
  means the stored token is dead and it should clear it and show /signin.

  The delivery fees and zone labels are sent from lib/delivery.ts so the app NEVER
  hard-codes a fee. If a fee changes on the server the app follows automatically,
  which is the same rule that stops the two surfaces disagreeing on money.
*/

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) return unauthenticated();

    return apiJson({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      deliveryZones: DELIVERY_ZONES.map((zone) => ({
        zone,
        label: DELIVERY_ZONE_LABELS[zone],
        /* null for international, which is quoted later rather than priced. */
        feeKobo: DELIVERY_FEES_KOBO[zone],
      })),
    });
  } catch (error) {
    return serverError("GET /api/v1/me", error);
  }
}