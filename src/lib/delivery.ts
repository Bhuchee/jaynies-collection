import type { DeliveryZone } from "@/db/schema";

/*
  FRD F8. Every delivery fee lives here, in kobo, so the delivery band, the
  contact page and checkout cannot drift apart. International has no fee yet:
  the order is saved as awaiting a shipping quote.
*/
export const DELIVERY_FEES_KOBO: Record<DeliveryZone, number | null> = {
  abuja: 500_000,
  nigeria: 1_000_000,
  international: null,
};

export const DELIVERY_ZONE_LABELS: Record<DeliveryZone, string> = {
  abuja: "Abuja",
  nigeria: "Rest of Nigeria",
  international: "International",
};

export function getDeliveryFeeKobo(zone: DeliveryZone): number | null {
  return DELIVERY_FEES_KOBO[zone];
}