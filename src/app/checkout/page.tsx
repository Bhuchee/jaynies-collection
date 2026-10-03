import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout | Jaynie's Collection",
  description: "Your delivery details and order summary.",
};

/*
  FRD F6 and F7. Checkout requires a session, so this page calls auth() and
  redirects. No middleware is used.

  The Google name prefills the name field as a convenience. FRD F7 makes every
  delivery field optional, so the shopper is free to clear it or leave it alone.
*/
export default async function CheckoutPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin?callbackUrl=/checkout");
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-black uppercase tracking-[-0.01em] text-onyx">
        Checkout
      </h1>
      <p className="mt-2 text-ink-muted">
        Choose a delivery zone, then place the order. Every other field is
        optional.
      </p>

      <CheckoutForm
        defaultFullName={session.user.name ?? ""}
        defaultEmail={session.user.email ?? ""}
      />
    </main>
  );
}