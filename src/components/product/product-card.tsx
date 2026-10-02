import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/db/schema";
import { CATEGORY_SHORT_LABELS } from "@/lib/catalog";
import { formatNaira, savingKobo } from "@/lib/money";
import { ProductImage } from "./product-image";

/*
  DESIGN.md section 5. Image, then the name, then the price row with an arrow.
  A set shows its saving as a highlight pill in the top-left of the image.
*/
export function ProductCard({ product }: { product: Product }) {
  const saving = savingKobo(product.priceKobo, product.compareAtKobo);

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          categoryLabel={CATEGORY_SHORT_LABELS[product.category]}
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {saving > 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-highlight px-3 py-1 text-xs font-semibold text-onyx">
            Save {formatNaira(saving)}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-onyx">
            {product.name}
          </p>
          <p className="mt-0.5 text-base font-semibold text-onyx">
            {formatNaira(product.priceKobo)}
            {product.compareAtKobo ? (
              <span className="ml-2 font-normal text-ink-muted line-through">
                {formatNaira(product.compareAtKobo)}
              </span>
            ) : null}
          </p>
        </div>

        <ArrowRight
          className="mt-1 h-5 w-5 shrink-0 text-onyx transition-transform duration-300 group-hover:translate-x-1"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}