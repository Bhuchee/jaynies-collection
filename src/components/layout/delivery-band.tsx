import { Truck } from "lucide-react";
import { DELIVERY_FEES_KOBO } from "@/lib/delivery";
import { formatNaira } from "@/lib/money";

/*
  DESIGN.md section 6. A full-width yellow strip, 48px high. On narrow screens
  the text scrolls as a marquee.
*/
const ABUJA = DELIVERY_FEES_KOBO.abuja ?? 0;
const NIGERIA = DELIVERY_FEES_KOBO.nigeria ?? 0;

const MESSAGE = `Abuja delivery ${formatNaira(ABUJA)} · Nationwide ${formatNaira(NIGERIA)} · International shipping quoted on request`;

function Band() {
  return (
    <span className="flex items-center gap-2 px-4 text-sm font-semibold text-onyx">
      <Truck className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      {MESSAGE}
    </span>
  );
}

export function DeliveryBand() {
  return (
    <section aria-label="Delivery information" className="w-full bg-highlight">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-center sm:hidden">
        <div className="jc-marquee flex w-max items-center">
          <Band />
          <span aria-hidden="true">
            <Band />
          </span>
        </div>
      </div>

      <div className="hidden h-12 items-center justify-center sm:flex">
        <Band />
      </div>
    </section>
  );
}