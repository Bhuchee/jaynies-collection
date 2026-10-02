"use client";

import { useCartCount } from "@/store/cart";

/*
  DESIGN.md section 6. A gold count badge on the cart icon. It shows the total
  quantity of items and stays hidden at zero.
*/
export function CartBadge() {
  const count = useCartCount();

  if (count === 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <>
      <span
        aria-hidden="true"
        className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-semibold text-onyx"
      >
        {label}
      </span>
      <span className="sr-only">{`${count} in cart`}</span>
    </>
  );
}