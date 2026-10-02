import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { auth } from "@/auth";
import { StatusBadge } from "@/components/orders/status-badge";
import { ProductImage } from "@/components/product/product-image";
import { DELIVERY_ZONE_LABELS } from "@/lib/delivery";
import { formatOrderDate } from "@/lib/dates";
import { formatNaira } from "@/lib/money";
import { getOrderForUser } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Order | Jaynie's Collection",
  description: "The items, amounts and delivery details for one order.",
};

/*
  FRD F10. The order number is looked up together with session.user.id, so an
  order number belonging to another shopper returns null and this becomes a
  404, exactly as an unknown order number would.
*/
export default async function OrderPage({
  params,
  searchParams,
}: PageProps<"/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  const query = await searchParams;

  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/orders/${orderNumber}`);
  }

  const result = await getOrderForUser(orderNumber, session.user.id);

  if (!result) notFound();

  const { order, items } = result;
  const justPlaced = query.placed === "1";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      {justPlaced ? (
        <p
          role="status"
          className="mb-8 flex items-start gap-3 rounded-lg border border-success/40 bg-success/12 p-4 text-sm text-success"
        >
          <Check
            className="mt-0.5 h-5 w-5 shrink-0"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span>
            Order placed. A confirmation email is on its way to{" "}
            {order.customerEmail}.
          </span>
        </p>
      ) : null}

      <Link
        href="/orders"
        className="inline-flex h-11 items-center gap-2 text-sm font-medium text-ink-muted hover:text-onyx"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-black uppercase tracking-[-0.01em] text-onyx">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Placed on {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <section className="mt-8 rounded-xl border border-line">
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-4 p-4">
              <div className="w-16 shrink-0">
                <ProductImage
                  src={item.imageUrl}
                  alt=""
                  className="rounded-lg"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-onyx">
                  {item.productName}
                </p>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Size {item.size} · Qty {item.quantity} ·{" "}
                  {formatNaira(item.unitPriceKobo)} each
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-onyx">
                {formatNaira(item.lineTotalKobo)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-line p-4 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="font-medium text-onyx">
              {formatNaira(order.subtotalKobo)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-ink-muted">
              Delivery ({DELIVERY_ZONE_LABELS[order.deliveryZone]})
            </dt>
            <dd className="font-medium text-onyx">
              {order.deliveryFeeKobo === null
                ? "To be confirmed"
                : formatNaira(order.deliveryFeeKobo)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-2 text-base">
            <dt className="font-semibold text-onyx">Total</dt>
            <dd className="font-semibold text-onyx">
              {formatNaira(order.totalKobo)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-xl border border-line p-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-onyx">
          Delivery address
        </h2>
        <address className="mt-2 text-sm not-italic leading-relaxed text-ink-muted">
          {order.recipientName}
          <br />
          {order.addressLine}
          <br />
          {order.city}, {order.state}
          <br />
          {order.country}
          <br />
          {order.phone}
        </address>

        {order.note ? (
          <>
            <h2 className="mt-4 text-xs font-semibold uppercase tracking-[0.06em] text-onyx">
              Your note
            </h2>
            <p className="mt-2 text-sm text-ink-muted">{order.note}</p>
          </>
        ) : null}
      </section>

      {order.deliveryFeeKobo === null ? (
        <p className="mt-6 rounded-lg bg-mist p-4 text-sm text-ink-muted">
          This is an international order, so it is saved as awaiting a shipping
          quote. Jaynie will send your shipping fee on WhatsApp before the
          order is confirmed.
        </p>
      ) : (
        <p className="mt-6 rounded-lg bg-mist p-4 text-sm text-ink-muted">
          Jaynie will WhatsApp you within 24 hours to confirm payment and the
          delivery date.
        </p>
      )}
    </main>
  );
}