import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Cart | Jaynie's Collection",
  description: "Review the pieces in your cart before checkout.",
};

/*
  FRD F5. Guests reach this page too, because the cart is built before sign-in.
*/
export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-black uppercase tracking-[-0.01em] text-onyx">
        Your cart
      </h1>
      <CartView />
    </main>
  );
}