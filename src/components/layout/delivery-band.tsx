import { Truck } from "lucide-react";
import { DELIVERY_FEES_KOBO } from "@/lib/delivery";
import { formatNaira } from "@/lib/money";

/*
  DESIGN.md section 6. A full-width yellow strip, 48px high on desktop.

  Below `sm` the band used to scroll the text as a marquee. That could not work
  at 360px: the track was `w-max`, so it was always wider than the viewport and
  the strip's own overflow pushed the text out of the yellow. The marquee is
  gone. The mobile band now wraps to at most two short lines and grows past
  48px when it needs to, so nothing is ever clipped.
*/
const ABUJA = DELIVERY_FEES_KOBO.abuja ?? 0;
const NIGERIA = DELIVERY_FEES_KOBO.nigeria ?? 0;

const MESSAGE = `Abuja delivery ${formatNaira(ABUJA)} · Nationwide ${formatNaira(NIGERIA)} · International shipping quoted on request`;

/* The mobile copy is much shorter: at 360px the full sentence needs four lines. */
const MESSAGE_SHORT = `Abuja ${formatNaira(ABUJA)} · Nigeria ${formatNaira(NIGERIA)} · International on request`;

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
    <section
      aria-label="Delivery information"
      className="w-full overflow-hidden bg-highlight"
    >
      {/*
        Mobile: overflow-hidden on the section, auto height with a 48px floor and
        vertical padding, centred 13px text that wraps to two lines.
      */}
      <div className="flex min-h-12 w-full items-center justify-center overflow-hidden px-2 py-3 sm:hidden">
        <p className="flex items-start justify-center gap-1.5 text-center text-[13px] font-semibold leading-snug text-onyx">
          <Truck
            className="mt-0.5 h-4 w-4 shrink-0"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span>{MESSAGE_SHORT}</span>
        </p>
      </div>

      {/* Desktop is unchanged: one centred line at 14px in a fixed 48px strip. */}
      <div className="hidden h-12 items-center justify-center sm:flex">
        <Band />
      </div>
    </section>
  );
}