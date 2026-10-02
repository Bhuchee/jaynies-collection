"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { placeOrder, type PlaceOrderResult } from "@/actions/place-order";
import { DELIVERY_FEES_KOBO } from "@/lib/delivery";
import {
  checkoutSchema,
  zodResolver,
  type CheckoutInput,
} from "@/lib/validation";
import { useCartHydrated, useCartStore } from "@/store/cart";
import { CheckoutFields } from "./checkout-fields";
import { OrderSummary } from "./order-summary";

type CheckoutFormProps = {
  defaultFullName: string;
  defaultEmail: string;
};

/*
  FRD F7. The zone, the locked country and the live delivery fee all live
  here, so the summary panel updates as the zone changes.
*/
export function CheckoutForm({ defaultFullName, defaultEmail }: CheckoutFormProps) {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const lines = useCartStore((state) => state.lines);
  const clearCart = useCartStore((state) => state.clear);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: defaultFullName,
      phone: "",
      deliveryZone: "abuja",
      addressLine: "",
      city: "",
      state: "",
      country: "Nigeria",
      note: "",
    },
  });

  /* useWatch subscribes to one field; form.watch() cannot be memoized. */
  const zone = useWatch({ control: form.control, name: "deliveryZone" });
  const deliveryFeeKobo = DELIVERY_FEES_KOBO[zone] ?? null;
  const busy = submitting || form.formState.isSubmitting;

  /* FRD F7: an empty cart goes back to /cart. */
  useEffect(() => {
    if (hydrated && lines.length === 0) {
      router.replace("/cart");
    }
  }, [hydrated, lines.length, router]);

  async function submitOrder(delivery: CheckoutInput) {
    setSubmitting(true);
    setServerError(null);

    try {
      const result: PlaceOrderResult = await placeOrder({
        lines: lines.map((line) => ({
          productId: line.productId,
          size: line.size,
          quantity: line.quantity,
        })),
        delivery,
      });

      if (!result.ok) {
        if (result.error === "unauthenticated") {
          router.push("/signin?callbackUrl=/checkout");
          return;
        }

        setServerError(result.error);

        for (const [path, issue] of Object.entries(result.fieldErrors ?? {})) {
          const name = path.startsWith("delivery.")
            ? path.slice("delivery.".length)
            : path;
          form.setError(name as Parameters<typeof form.setError>[0], {
            type: issue.type,
            message: issue.message,
          });
        }
        return;
      }

      clearCart();
      router.push(`/orders/${result.orderNumber}?placed=1`);
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return <p className="mt-6 text-ink-muted">Loading your checkout.</p>;
  }

  return (
    <div className="mt-8">
      {/* Mobile: the summary collapses into an accordion at the top. */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((open) => !open)}
          aria-expanded={summaryOpen}
          className="flex h-12 w-full items-center justify-between rounded-lg border border-line px-4 text-sm font-semibold text-onyx"
        >
          Show order summary
          <span className="text-ink-muted">{summaryOpen ? "Hide" : "Show"}</span>
        </button>
        {summaryOpen ? (
          <div className="mt-3">
            <OrderSummary lines={lines} deliveryFeeKobo={deliveryFeeKobo} />
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
        <div className="order-2 lg:order-1">
          <CheckoutFields
            form={form}
            zone={zone}
            busy={busy}
            serverError={serverError}
            defaultEmail={defaultEmail}
            onSubmit={(delivery) => submitOrder(delivery)}
          />
        </div>

        <div className="order-1 lg:order-2">
          <div className="hidden lg:sticky lg:top-24 lg:block">
            <OrderSummary lines={lines} deliveryFeeKobo={deliveryFeeKobo} />
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-ink-muted lg:text-left">
        Changed your mind?{" "}
        <Link href="/cart" className="underline">
          Back to your cart
        </Link>
        .
      </p>
    </div>
  );
}