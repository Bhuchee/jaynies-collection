"use client";

import { Home, LayoutGrid, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartCount } from "@/store/cart";

/*
  DESIGN.md section 6. Fixed, 64px high, below 768px only. The active item is
  Onyx with a 2px bar above it; the rest are Ink muted.
*/
const ITEMS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/shop", label: "Shop", Icon: LayoutGrid },
  { href: "/orders", label: "Orders", Icon: Package },
  { href: "/cart", label: "Cart", Icon: ShoppingBag },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const count = useCartCount();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white md:hidden"
    >
      <ul className="flex h-16 items-stretch">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  active ? "text-onyx" : "text-ink-muted"
                }`}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-onyx"
                  />
                ) : null}

                <span className="relative">
                  <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
                  {href === "/cart" && count > 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-onyx"
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  ) : null}
                </span>

                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}