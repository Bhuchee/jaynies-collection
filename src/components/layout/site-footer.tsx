import Link from "next/link";
import { InstagramIcon } from "@/components/icons/instagram";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { BrandLogo } from "@/components/ui/brand-logo";
import { INSTAGRAM_URL, WHATSAPP_URL } from "@/lib/site";

/*
  DESIGN.md section 6. Onyx background, the brand line on the left, links in
  the middle and 36px highlight social squares on the right.
*/
const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/contact", label: "Contact" },
  { href: "/orders", label: "My Orders" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-onyx text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <BrandLogo variant="dark" />
          <p className="mt-4 max-w-xs text-sm text-white/70">
            Complete your style with pieces made by hand.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col items-start gap-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-11 items-center text-sm font-medium text-white transition-opacity hover:opacity-85"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-start gap-3 md:justify-end">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Jaynie's Collection on Instagram"
            className="flex h-9 w-9 items-center justify-center rounded bg-highlight text-onyx transition-opacity hover:opacity-85"
          >
            <InstagramIcon />
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat with Jaynie's Collection on WhatsApp"
            className="flex h-9 w-9 items-center justify-center rounded bg-highlight text-onyx transition-opacity hover:opacity-85"
          >
            <WhatsAppIcon />
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        {/* White at 70% over Onyx is about 9.5:1, which clears AA. */}
        <p className="mx-auto w-full max-w-6xl px-4 pb-20 pt-5 text-sm text-white/70 md:pb-5">
          © 2026 Jaynie&apos;s Collection. All rights reserved.
        </p>
      </div>
    </footer>
  );
}