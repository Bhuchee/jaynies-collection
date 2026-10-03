import { Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { auth, signOut } from "@/auth";
import { CartBadge } from "@/components/cart/cart-badge";
import { BrandLogo } from "@/components/ui/brand-logo";
import { AccountMenu } from "./account-menu";
import { SearchBar } from "./search-bar";

/*
  DESIGN.md section 6. Desktop: logo, nav links, a 280px search input, then the
  My Orders, account and cart icons. Mobile: logo on the left, search, account
  and cart on the right. The account button stays on mobile on purpose, because
  the bottom nav has no account item and sign-out must stay reachable.
*/
const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?gender=men", label: "Men" },
  { href: "/shop?gender=women", label: "Women" },
  { href: "/shop?category=ankara", label: "Ankara" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      {/*
        h-[72px] on mobile and h-20 on desktop, so the 48px/56px logo plus the
        44px icon buttons fit with clear air above and below and nothing clips.
      */}
      <div className="mx-auto grid h-[72px] w-full max-w-6xl grid-cols-[auto_1fr] items-center gap-2 px-4 md:h-20 md:gap-4 md:grid-cols-[auto_1fr_auto] md:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="Jaynie's Collection home"
        >
          <BrandLogo />
        </Link>

        <nav
          aria-label="Main"
          className="hidden items-center justify-center gap-6 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium uppercase tracking-[0.06em] text-onyx transition-opacity hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>

          <Link
            href="/orders"
            aria-label="My Orders"
            className="hidden h-11 w-11 items-center justify-center rounded border border-line text-onyx transition-opacity hover:opacity-85 lg:flex"
          >
            <Package className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
          </Link>

          <AccountMenu
            name={session?.user?.name ?? null}
            email={session?.user?.email ?? null}
            image={session?.user?.image ?? null}
            signOutAction={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          />

          <Link
            href="/cart"
            aria-label="Cart"
            className="relative flex h-11 w-11 items-center justify-center rounded border border-line text-onyx transition-opacity hover:opacity-85"
          >
            <ShoppingBag
              className="h-6 w-6"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <CartBadge />
          </Link>
        </div>
      </div>
    </header>
  );
}