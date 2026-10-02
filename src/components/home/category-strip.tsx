import Link from "next/link";
import { PRODUCT_CATEGORIES } from "@/db/schema";
import { CATEGORY_LABELS } from "@/lib/catalog";
import { SectionTitle } from "@/components/ui/section-title";

/* FRD F2 section 3. Each chip links to /shop with that category applied. */
export function CategoryStrip() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4">
      <SectionTitle>Shop by category</SectionTitle>

      <div className="mt-8 flex gap-3 overflow-x-auto pb-1">
        {PRODUCT_CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/shop?category=${category}`}
            className="flex h-11 shrink-0 items-center rounded-full border border-line bg-white px-5 text-sm font-medium text-onyx transition-colors hover:border-onyx"
          >
            {CATEGORY_LABELS[category]}
          </Link>
        ))}
      </div>
    </section>
  );
}