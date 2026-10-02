import { X } from "lucide-react";
import Link from "next/link";
import { PRODUCT_CATEGORIES } from "@/db/schema";
import { FilterChips } from "@/components/product/filter-chips";
import { ProductGrid } from "@/components/product/product-grid";
import { CATEGORY_LABELS, buildShopHref, parseShopFilters } from "@/lib/catalog";
import { getProducts } from "@/lib/queries";

/*
  FRD F3 and F13. Filters live in the URL so any view can be shared. The
  heading changes to a result count when a search term is present.
*/
export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const params = await searchParams;
  const filters = parseShopFilters(params);
  const products = await getProducts(filters);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-black uppercase tracking-[-0.01em] text-onyx">
          {filters.q
            ? `Results for '${filters.q}' (${products.length})`
            : "Shop"}
        </h1>

        {filters.q ? (
          <Link
            href={buildShopHref(filters, { q: undefined })}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium text-onyx transition-colors hover:border-onyx"
          >
            <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            Clear search
          </Link>
        ) : null}
      </div>

      <div className="mt-6">
        <FilterChips filters={filters} />
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products} className="mt-8" />
      ) : filters.q ? (
        <div className="mt-12">
          <p className="text-lg font-medium text-onyx">
            No pieces match &apos;{filters.q}&apos;
          </p>
          <p className="mt-2 text-ink-muted">
            Try one of these instead:
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {PRODUCT_CATEGORIES.map((category) => (
              <Link
                key={category}
                href={`/shop?category=${category}`}
                className="flex h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-medium text-onyx transition-colors hover:border-onyx"
              >
                {CATEGORY_LABELS[category]}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-12">
          <p className="text-lg font-medium text-onyx">No pieces here yet</p>
          <Link
            href="/shop"
            className="mt-4 inline-flex h-12 items-center rounded border border-onyx bg-white px-6 text-[15px] font-semibold text-onyx transition-opacity hover:opacity-85"
          >
            Clear the filters
          </Link>
        </div>
      )}
    </main>
  );
}