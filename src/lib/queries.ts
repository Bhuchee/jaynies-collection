import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { products, type Product } from "@/db/schema";
import type { ShopFilters } from "./catalog";

/*
  Every list is ordered created_at desc, name asc so the grid is stable and
  "the 8 newest" is deterministic.
*/
function listOrder() {
  return [desc(products.createdAt), asc(products.name)];
}

/** FRD F2. The three products marked is_best_seller. */
export async function getBestSellers(limit = 3): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.isBestSeller, true)))
    .orderBy(...listOrder())
    .limit(limit);
}

/** FRD F2. The newest active products, for the "Clothes For You" grid. */
export async function getLatestProducts(limit = 8): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(...listOrder())
    .limit(limit);
}

/*
  FRD F3 and F13. gender=men returns men plus unisex, and gender=women returns
  women plus unisex. The search term is passed as a bound parameter.
*/
export async function getProducts(filters: ShopFilters = {}): Promise<Product[]> {
  const conditions = [eq(products.isActive, true)];

  if (filters.category) {
    conditions.push(eq(products.category, filters.category));
  }

  if (filters.gender) {
    const genderMatch = or(
      eq(products.gender, filters.gender),
      eq(products.gender, "unisex"),
    );
    if (genderMatch) conditions.push(genderMatch);
  }

  if (filters.q) {
    const term = `%${filters.q}%`;
    const searchMatch = or(
      ilike(products.name, term),
      ilike(products.description, term),
    );
    if (searchMatch) conditions.push(searchMatch);
  }

  return db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(...listOrder());
}

/** FRD F4. An unknown or inactive slug returns null, which becomes a 404. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  return product ?? null;
}