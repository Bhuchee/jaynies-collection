import {
  PRODUCT_CATEGORIES,
  PRODUCT_GENDERS,
  type ProductCategory,
  type ProductGender,
} from "@/db/schema";

/* The chip labels used by the home category strip, the shop filters and the
   product page. The hoodie-sets slug keeps its FRD name while the chip reads
   "Hoodies & Sets". */
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  shirts: "Shirts",
  "hoodie-sets": "Hoodies & Sets",
  "tees-polos": "T-Shirts & Polos",
  bottoms: "Cargo & Bottoms",
  ankara: "Ankara",
};

/* Shorter wording for the placeholder card, where space is tight. */
export const CATEGORY_SHORT_LABELS: Record<ProductCategory, string> = {
  shirts: "Shirts",
  "hoodie-sets": "Hoodie Sets",
  "tees-polos": "Tees & Polos",
  bottoms: "Bottoms",
  ankara: "Ankara",
};

export const GENDER_LABELS: Record<ProductGender, string> = {
  men: "Men",
  women: "Women",
  unisex: "Unisex",
};

export type ShopFilters = {
  q?: string;
  category?: ProductCategory;
  gender?: ProductGender;
};

export type ShopSearchParams = {
  q?: string | string[];
  category?: string | string[];
  gender?: string | string[];
};

function firstValue(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
}

/*
  FRD F3 and F13. Unknown values are ignored rather than erroring, and the
  search term is trimmed and capped at 50 characters.
*/
export function parseShopFilters(params: ShopSearchParams): ShopFilters {
  const filters: ShopFilters = {};

  const q = firstValue(params.q);
  if (q) filters.q = q.slice(0, 50);

  const category = firstValue(params.category);
  if (category && (PRODUCT_CATEGORIES as readonly string[]).includes(category)) {
    filters.category = category as ProductCategory;
  }

  const gender = firstValue(params.gender);
  if (gender && (PRODUCT_GENDERS as readonly string[]).includes(gender)) {
    filters.gender = gender as ProductGender;
  }

  return filters;
}

/*
  Builds a /shop link that keeps the filters that are not being changed, so
  every filtered view is shareable by URL (FRD F3).
*/
export function buildShopHref(
  current: ShopFilters,
  patch: { q?: string; category?: ProductCategory; gender?: ProductGender },
): string {
  const merged = { ...current, ...patch };
  const search = new URLSearchParams();

  if (merged.q) search.set("q", merged.q);
  if (merged.category) search.set("category", merged.category);
  if (merged.gender) search.set("gender", merged.gender);

  const query = search.toString();
  return query ? `/shop?${query}` : "/shop";
}