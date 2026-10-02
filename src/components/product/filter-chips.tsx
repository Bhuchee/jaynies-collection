import Link from "next/link";
import { PRODUCT_CATEGORIES, PRODUCT_GENDERS } from "@/db/schema";
import {
  CATEGORY_LABELS,
  GENDER_LABELS,
  buildShopHref,
  type ShopFilters,
} from "@/lib/catalog";

/*
  DESIGN.md section 5. Pill-shaped chips, 1px line border, the active chip
  filled Onyx. On mobile the rows scroll horizontally.
*/
function Chip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
        active
          ? "border-onyx bg-onyx text-white"
          : "border-line bg-white text-onyx hover:border-onyx"
      }`}
    >
      {label}
    </Link>
  );
}

export function FilterChips({ filters }: { filters: ShopFilters }) {
  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label="Filter by category"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        <Chip
          href={buildShopHref(filters, { category: undefined })}
          label="All"
          active={!filters.category}
        />
        {PRODUCT_CATEGORIES.map((category) => (
          <Chip
            key={category}
            href={buildShopHref(filters, { category })}
            label={CATEGORY_LABELS[category]}
            active={filters.category === category}
          />
        ))}
      </div>

      <div
        role="group"
        aria-label="Filter by gender"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        <Chip
          href={buildShopHref(filters, { gender: undefined })}
          label="Everyone"
          active={!filters.gender}
        />
        {PRODUCT_GENDERS.filter((gender) => gender !== "unisex").map(
          (gender) => (
            <Chip
              key={gender}
              href={buildShopHref(filters, { gender })}
              label={GENDER_LABELS[gender]}
              active={filters.gender === gender}
            />
          ),
        )}
      </div>
    </div>
  );
}