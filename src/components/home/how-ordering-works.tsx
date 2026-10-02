import { ClipboardCheck, Shirt, Truck } from "lucide-react";
import { SectionTitle } from "@/components/ui/section-title";

/*
  FRD F2 section 6 and DESIGN.md section 6: three columns, each icon inside a
  56px highlight circle.
*/
const STEPS = [
  { Icon: Shirt, title: "Pick your fit", body: "Choose your size and add the piece to your cart." },
  { Icon: ClipboardCheck, title: "Place your order", body: "Sign in with Google and fill in your delivery details." },
  { Icon: Truck, title: "Jaynie confirms on WhatsApp", body: "Payment and the delivery date are arranged with you directly." },
];

export function HowOrderingWorks() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4">
      <SectionTitle>How ordering works</SectionTitle>

      <div className="mt-10 grid gap-10 md:grid-cols-3">
        {STEPS.map(({ Icon, title, body }) => (
          <div key={title}>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-highlight">
              <Icon
                className="h-6 w-6 text-onyx"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </span>
            <h3 className="mt-5 text-base font-semibold text-onyx">{title}</h3>
            <p className="mt-2 text-sm text-ink-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}