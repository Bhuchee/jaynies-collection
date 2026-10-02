import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import {
  orderItems,
  orders,
  products,
  type Order,
  type OrderItem,
  type Product,
} from "@/db/schema";
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

/*
  FRD F10 and AGENTS.md rule 4. Every order query is scoped to the signed-in
  user's id, so one shopper can never see another shopper's order.
*/
export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: Order["status"];
  createdAt: Date;
  totalKobo: number;
  itemCount: number;
  firstImageUrl: string | null;
};

/** The signed-in shopper's orders, newest first, with a first-item thumbnail. */
export async function getOrdersForUser(userId: string): Promise<OrderSummary[]> {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      createdAt: orders.createdAt,
      totalKobo: orders.totalKobo,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  if (rows.length === 0) return [];

  const items = await db
    .select({
      orderId: orderItems.orderId,
      imageUrl: orderItems.imageUrl,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((row) => row.id),
      ),
    );

  const byOrder = new Map<
    string,
    { itemCount: number; firstImageUrl: string | null }
  >();

  for (const item of items) {
    const current = byOrder.get(item.orderId);
    if (!current) {
      byOrder.set(item.orderId, {
        itemCount: item.quantity,
        firstImageUrl: item.imageUrl,
      });
      continue;
    }
    current.itemCount += item.quantity;
  }

  return rows.map((row) => {
    const summary = byOrder.get(row.id);
    return {
      ...row,
      itemCount: summary?.itemCount ?? 0,
      firstImageUrl: summary?.firstImageUrl ?? null,
    };
  });
}

/**
  FRD F10. The order number is looked up together with the user id, so another
  shopper's order number resolves to null and the page becomes a 404.
*/
export async function getOrderForUser(
  orderNumber: string,
  userId: string,
): Promise<{ order: Order; items: OrderItem[] } | null> {
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.orderNumber, orderNumber),
        eq(orders.userId, userId),
      ),
    )
    .limit(1);

  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return { order, items };
}