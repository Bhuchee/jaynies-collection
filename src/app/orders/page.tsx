import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { auth } from "@/auth";
import { StatusBadge } from "@/components/orders/status-badge";
import { ProductImage } from "@/components/product/product-image";
import { formatOrderDate } from "@/lib/dates";
import { formatNaira } from "@/lib/money";
import { getOrdersForUser } from "@/lib/queries";

export const metadata: Metadata = {
  title: "My Orders | Jaynie's Collection",
  description: "Every order you have placed, and where it has got to.",
};

/*
  FRD F10 and F6. auth() guards the page, and every query is scoped to
  session.user.id, so this only ever lists the signed-in shopper's orders.
*/
export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/orders");
  }

  const summaries = await getOrdersForUser(session.user.id);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-black uppercase tracking-[-0.01em] text-onyx">
        My orders
      </h1>

      {summaries.length === 0 ? (
        <div className="mt-10 rounded-xl border border-line p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mist">
            <Package
              className="h-6 w-6 text-ink-muted"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </span>
          <p className="mt-5 text-lg font-medium text-onyx">No orders yet</p>
          <p className="mt-2 text-ink-muted">
            When you place an order it will appear here with its status.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex h-12 items-center rounded bg-onyx px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-85"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {summaries.map((summary) => (
            <li key={summary.id}>
              <Link
                href={`/orders/${summary.orderNumber}`}
                className="flex items-center gap-4 rounded-xl border border-line p-4 transition-colors hover:border-onyx"
              >
                <div className="w-16 shrink-0">
                  <ProductImage
                    src={summary.firstImageUrl}
                    alt=""
                    className="rounded-lg"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-onyx">
                    {summary.orderNumber}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {formatOrderDate(summary.createdAt)} · {summary.itemCount}{" "}
                    {summary.itemCount === 1 ? "item" : "items"}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={summary.status} />
                  </div>
                </div>

                <p className="shrink-0 text-base font-semibold text-onyx">
                  {formatNaira(summary.totalKobo)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}