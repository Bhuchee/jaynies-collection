import type { Metadata } from "next";
import { InstagramIcon } from "@/components/icons/instagram";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { DELIVERY_FEES_KOBO } from "@/lib/delivery";
import { formatNaira } from "@/lib/money";
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  WHATSAPP_NUMBER,
  WHATSAPP_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact | Jaynie's Collection",
  description:
    "Message Jaynie on WhatsApp or Instagram about a piece, a size or a delivery.",
};

/* FRD F11. WhatsApp, Instagram and the delivery fee summary. */
export default function ContactPage() {
  const abuja = DELIVERY_FEES_KOBO.abuja ?? 0;
  const nigeria = DELIVERY_FEES_KOBO.nigeria ?? 0;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-black uppercase tracking-[-0.01em] text-onyx">
        Contact
      </h1>
      <p className="mt-4 text-ink-muted">
        Questions about a piece, a size or a delivery? Message Jaynie directly
        and she will reply within 24 hours.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center justify-center gap-3 rounded bg-onyx px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-85"
        >
          <WhatsAppIcon className="h-5 w-5" />
          Chat on WhatsApp
        </a>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center justify-center gap-3 rounded border border-onyx bg-white px-6 text-[15px] font-semibold text-onyx transition-opacity hover:opacity-85"
        >
          <InstagramIcon className="h-5 w-5" />@{INSTAGRAM_HANDLE}
        </a>
      </div>

      <p className="mt-4 text-sm text-ink-muted">
        WhatsApp {WHATSAPP_NUMBER}
      </p>

      <section className="mt-12">
        <h2 className="text-base font-semibold text-onyx">Delivery fees</h2>
        <dl className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line">
          <div className="flex items-center justify-between gap-4 px-4 py-4">
            <dt className="text-onyx">Abuja</dt>
            <dd className="font-semibold text-onyx">{formatNaira(abuja)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-4">
            <dt className="text-onyx">Rest of Nigeria</dt>
            <dd className="font-semibold text-onyx">{formatNaira(nigeria)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-4">
            <dt className="text-onyx">International</dt>
            <dd className="text-ink-muted">Quoted on request</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-ink-muted">
          There is no online payment. Jaynie confirms payment and the delivery
          date with you on WhatsApp.
        </p>
      </section>
    </main>
  );
}