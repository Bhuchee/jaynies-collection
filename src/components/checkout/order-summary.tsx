import { ProductImage } from "@/components/product/product-image";
import { formatNaira } from "@/lib/money";
import type { CartLine } from "@/store/cart";

type OrderSummaryProps = {
  lines: CartLine[];
  deliveryFeeKobo: number | null;
};

/*
  FRD F7. The totals shown here are a preview only: placeOrder recalculates
  them from the database before anything is written.
*/
export function OrderSummary({ lines, deliveryFeeKobo }: OrderSummaryProps) {
  const subtotalKobo = lines.reduce(
    (total, line) => total + line.unitPriceKobo * line.quantity,
    0,
  );
  const totalKobo = subtotalKobo + (deliveryFeeKobo ?? 0);
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-sm font-semibold text-onyx">
        Order summary{itemCount > 0 ? ` (${itemCount})` : ""}
      </p>

      <ul className="mt-4 divide-y divide-line">
        {lines.map((line) => (
          <li
            key={`${line.productId}-${line.size}`}
            className="flex items-start gap-3 py-3"
          >
            <div className="w-14 shrink-0">
              <ProductImage src={line.imageUrl} alt={line.name} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-onyx">{line.name}</p>
              <p className="text-xs text-ink-muted">
                Size {line.size} · Qty {line.quantity}
              </p>
            </div>
            <p className="text-sm font-semibold text-onyx">
              {formatNaira(line.unitPriceKobo * line.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd className="font-medium text-onyx">{formatNaira(subtotalKobo)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-ink-muted">Delivery</dt>
          <dd className="font-medium text-onyx">
            {deliveryFeeKobo === null
              ? "To be confirmed"
              : formatNaira(deliveryFeeKobo)}
          </dd>
        </div>
        <div className="flex items-center justify-between border-t border-line pt-3 text-base">
          <dt className="font-semibold text-onyx">Total</dt>
          <dd className="font-semibold text-onyx">{formatNaira(totalKobo)}</dd>
        </div>
      </dl>

      {deliveryFeeKobo === null ? (
        <p className="mt-3 text-xs text-ink-muted">
          Your shipping fee will be quoted by Jaynie before the order is
          confirmed.
        </p>
      ) : null}

      <p className="mt-4 rounded-lg bg-mist p-3 text-xs text-ink-muted">
        No payment online. Jaynie will contact you on WhatsApp within 24 hours to
        confirm payment (transfer or pay on delivery) and delivery date.
      </p>
    </div>
  );
}