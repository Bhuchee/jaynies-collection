"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { pushCartChange } from "@/components/cart/cart-sync";
import { ProductImage } from "@/components/product/product-image";
import { formatNaira } from "@/lib/money";
import {
  MAX_QUANTITY,
  useCartReady,
  useCartStore,
  type CartLine,
} from "@/store/cart";

/*
  FRD F5. The unit price stored on each line is for display only: placeOrder
  recalculates every price from the database.
*/
function LineRow({ line }: { line: CartLine }) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  function changeQuantity(quantity: number) {
    setQuantity(line.productId, line.size, quantity);
    void pushCartChange({
      kind: "setQuantity",
      productId: line.productId,
      size: line.size,
      quantity,
    });
  }

  function handleRemove() {
    removeItem(line.productId, line.size);
    void pushCartChange({
      kind: "remove",
      productId: line.productId,
      size: line.size,
    });
  }

  return (
    <li className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <Link
        href={`/product/${line.slug}`}
        className="w-20 shrink-0"
        aria-label={line.name}
      >
        <ProductImage src={line.imageUrl} alt={line.name} />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/product/${line.slug}`}
          className="font-medium text-onyx hover:underline"
        >
          {line.name}
        </Link>
        <p className="mt-0.5 text-sm text-ink-muted">Size {line.size}</p>
        <p className="mt-0.5 text-sm font-semibold text-onyx">
          {formatNaira(line.unitPriceKobo)} each
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="flex h-11 items-center rounded border border-line">
          <button
            type="button"
            onClick={() => changeQuantity(line.quantity - 1)}
            disabled={line.quantity <= 1}
            aria-label={`Decrease the quantity of ${line.name}`}
            className="flex h-11 w-11 items-center justify-center text-onyx disabled:opacity-40"
          >
            <Minus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <span
            aria-live="polite"
            className="w-8 text-center text-sm font-semibold"
          >
            {line.quantity}
          </span>
          <button
            type="button"
            onClick={() => changeQuantity(line.quantity + 1)}
            disabled={line.quantity >= MAX_QUANTITY}
            aria-label={`Increase the quantity of ${line.name}`}
            className="flex h-11 w-11 items-center justify-center text-onyx disabled:opacity-40"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <p className="w-24 text-right text-base font-semibold text-onyx">
          {formatNaira(line.unitPriceKobo * line.quantity)}
        </p>

        <button
          type="button"
          onClick={handleRemove}
          aria-label={`Remove ${line.name} from your cart`}
          className="flex h-11 w-11 items-center justify-center rounded border border-line text-ink-muted transition-colors hover:border-onyx hover:text-onyx"
        >
          <Trash2 className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

export function CartView() {
  const ready = useCartReady();
  const lines = useCartStore((state) => state.lines);

  /* FRD F5: wait for the saved cart to arrive, so a signed-in shopper never
     sees an empty cart that is really a cart still loading. */
  if (!ready) {
    return <p className="mt-6 text-ink-muted">Loading your cart.</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-lg font-medium text-onyx">Your cart is empty</p>
        <p className="mt-2 text-ink-muted">
          Pick a size on any piece and it will show up here.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-12 items-center rounded bg-onyx px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-85"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  const subtotalKobo = lines.reduce(
    (total, line) => total + line.unitPriceKobo * line.quantity,
    0,
  );

  return (
    <div className="mt-8">
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {lines.map((line) => (
          <LineRow key={`${line.productId}-${line.size}`} line={line} />
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-4 border-t border-line pt-6">
        <div className="flex items-center justify-between text-base font-semibold text-onyx">
          <span>Subtotal</span>
          <span>{formatNaira(subtotalKobo)}</span>
        </div>
        <p className="text-sm text-ink-muted">Delivery calculated at checkout</p>

        <Link
          href="/checkout"
          className="flex h-12 w-full items-center justify-center rounded bg-onyx px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-85 sm:w-auto sm:self-end"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}