"use client";

import { Check, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/money";
import { MAX_QUANTITY, useCartStore } from "@/store/cart";

type AddToCartProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string | null;
    priceKobo: number;
    sizes: string[];
  };
};

/*
  FRD F4. A size is required before the item can be added, the stepper is 1 to
  10, and adding shows a toast. On mobile the stepper and the button sit in a
  sticky bar above the bottom nav.
*/
export function AddToCart({ product }: AddToCartProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(false), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const total = product.priceKobo * quantity;

  function handleAdd() {
    if (!size) return;

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      size,
      unitPriceKobo: product.priceKobo,
      quantity,
    });
    setToast(true);
  }

  const sizeSelector = (
    <div>
      <p className="text-sm font-medium text-onyx">Size</p>
      <div className="mt-3 flex gap-3">
        {product.sizes.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSize(value)}
            aria-pressed={size === value}
            className={`h-12 w-12 rounded border text-sm font-semibold transition-colors ${
              size === value
                ? "border-onyx bg-onyx text-white"
                : "border-line bg-white text-onyx hover:border-onyx"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );

  const stepper = (
    <div className="flex h-11 items-center rounded border border-line">
      <button
        type="button"
        onClick={() => setQuantity((value) => Math.max(1, value - 1))}
        disabled={quantity <= 1}
        aria-label="Decrease quantity"
        className="flex h-11 w-11 items-center justify-center text-onyx disabled:opacity-40"
      >
        <Minus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
      <span aria-live="polite" className="w-8 text-center text-sm font-semibold">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => setQuantity((value) => Math.min(MAX_QUANTITY, value + 1))}
        disabled={quantity >= MAX_QUANTITY}
        aria-label="Increase quantity"
        className="flex h-11 w-11 items-center justify-center text-onyx disabled:opacity-40"
      >
        <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div>
      {sizeSelector}

      {size ? null : (
        <p className="mt-2 text-sm text-ink-muted">
          Choose a size to continue.
        </p>
      )}

      <div className="mt-6 hidden items-center gap-4 md:flex">
        {stepper}
        <button
          type="button"
          onClick={handleAdd}
          disabled={!size}
          className="h-12 flex-1 rounded bg-onyx px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add to cart
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-white p-3 md:hidden">
        <div className="flex items-center gap-3">
          {stepper}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!size}
            className="h-12 flex-1 rounded bg-onyx px-4 text-[15px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add to cart · {formatNaira(total)}
          </button>
        </div>
      </div>

      {toast ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-32 z-50 flex items-center gap-3 rounded-lg bg-onyx px-4 py-3 text-sm text-white shadow-lg md:inset-x-auto md:bottom-6 md:right-6"
        >
          <Check className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span>Added to cart</span>
          <Link href="/cart" className="ml-auto font-semibold underline">
            View cart
          </Link>
        </div>
      ) : null}
    </div>
  );
}