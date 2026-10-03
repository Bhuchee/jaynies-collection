"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { cartItems, products } from "@/db/schema";
import { MAX_LINE_QUANTITY, cartLineSchema } from "@/lib/validation";

/*
  FRD F5. Every action here scopes by session.user.id and validates the product,
  size and quantity against the products table, because the browser is not
  trusted. Each mutating action returns the authoritative saved cart, so the
  client can replace its local copy with the server's answer in one step.
*/

export type SavedCartLine = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  size: string;
  unitPriceKobo: number;
  quantity: number;
};

export type CartActionResult = {
  ok: boolean;
  lines: SavedCartLine[];
  error?: string;
};

/** The signed-in shopper's id, or null when there is no session. */
async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * FRD F5. Reads the saved cart joined to the catalogue, so the client always
 * displays the current name, image and price rather than a stale snapshot.
 * Inactive products are left out, because they can no longer be ordered.
 */
export async function fetchSavedCart(): Promise<CartActionResult> {
  const userId = await currentUserId();

  if (!userId) return { ok: false, lines: [], error: "unauthenticated" };

  const rows = await db
    .select({
      productId: cartItems.productId,
      size: cartItems.size,
      quantity: cartItems.quantity,
      slug: products.slug,
      name: products.name,
      imageUrl: products.imageUrl,
      priceKobo: products.priceKobo,
    })
    .from(cartItems)
    .innerJoin(products, eq(products.id, cartItems.productId))
    .where(and(eq(cartItems.userId, userId), eq(products.isActive, true)))
    .orderBy(cartItems.updatedAt);

  return {
    ok: true,
    lines: rows.map((row) => ({
      productId: row.productId,
      slug: row.slug,
      name: row.name,
      imageUrl: row.imageUrl,
      size: row.size,
      unitPriceKobo: row.priceKobo,
      quantity: row.quantity,
    })),
  };
}

type LineKey = { productId: string; size: string; quantity: number };

/**
 * FRD F5. Collapses guest lines by product and size, summing the quantities and
 * clamping to 1-10, so a repeated local entry cannot exceed the maximum.
 */
function groupGuestLines(lines: LineKey[]): Map<string, LineKey> {
  const byKey = new Map<string, LineKey>();

  for (const line of lines) {
    const key = `${line.productId}|${line.size}`;
    const existing = byKey.get(key);
    const quantity = Math.min(
      (existing?.quantity ?? 0) + line.quantity,
      MAX_LINE_QUANTITY,
    );

    byKey.set(key, { productId: line.productId, size: line.size, quantity });
  }

  return byKey;
}

/** FRD F5. Loads the products a set of lines refers to, keyed by product id. */
async function loadAvailableProducts(
  productIds: string[],
): Promise<Map<string, { id: string; sizes: string[] }>> {
  if (productIds.length === 0) return new Map();

  const available = await db
    .select({ id: products.id, sizes: products.sizes })
    .from(products)
    .where(and(eq(products.isActive, true), inArray(products.id, productIds)));

  return new Map(available.map((product) => [product.id, product]));
}
/**
 * FRD F5 sign-in merge. For each product and size the higher quantity wins,
 * capped at 10, and a line present on only one side is kept. The write is one
 * transaction, so a failure leaves the saved cart untouched.
 */
export async function mergeGuestCart(
  guestLines: unknown,
): Promise<CartActionResult> {
  const userId = await currentUserId();

  if (!userId) return { ok: false, lines: [], error: "unauthenticated" };

  const parsed = Array.isArray(guestLines)
    ? guestLines
        .map((line) => cartLineSchema.safeParse(line))
        .filter((result) => result.success)
        .map((result) => result.data as LineKey)
    : [];

  const wanted = groupGuestLines(parsed);
  const available = await loadAvailableProducts(
    [...new Set([...wanted.values()].map((line) => line.productId))],
  );

  for (const [key, line] of wanted) {
    const product = available.get(line.productId);

    if (!product || !product.sizes.includes(line.size)) {
      wanted.delete(key);
    }
  }

  const current = await db
    .select({
      productId: cartItems.productId,
      size: cartItems.size,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .where(eq(cartItems.userId, userId));

  const merged = new Map(
    current.map((row) => [`${row.productId}|${row.size}`, row]),
  );

  for (const [key, line] of wanted) {
    const existing = merged.get(key);

    merged.set(key, {
      productId: line.productId,
      size: line.size,
      quantity: Math.min(
        Math.max(existing?.quantity ?? 0, line.quantity),
        MAX_LINE_QUANTITY,
      ),
    });
  }

  await db.batch([
    db.delete(cartItems).where(eq(cartItems.userId, userId)),
    ...[...merged.values()].map((line) =>
      db.insert(cartItems).values({
        userId,
        productId: line.productId,
        size: line.size,
        quantity: line.quantity,
      }),
    ),
  ]);

  return fetchSavedCart();
}

/** FRD F5. Adds to any existing quantity for the same product and size. */
export async function addSavedCartLine(input: unknown): Promise<CartActionResult> {
  const userId = await currentUserId();

  if (!userId) return { ok: false, lines: [], error: "unauthenticated" };

  const parsed = cartLineSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, lines: [], error: "That piece or size is not valid." };
  }

  const available = await loadAvailableProducts([parsed.data.productId]);
  const product = available.get(parsed.data.productId);

  if (!product || !product.sizes.includes(parsed.data.size)) {
    return {
      ok: false,
      lines: [],
      error: "That piece is no longer available in this size.",
    };
  }

  await db
    .insert(cartItems)
    .values({
      userId,
      productId: parsed.data.productId,
      size: parsed.data.size,
      quantity: parsed.data.quantity,
    })
    .onConflictDoUpdate({
      target: [cartItems.userId, cartItems.productId, cartItems.size],
      set: {
        quantity: sql`least(${cartItems.quantity} + ${parsed.data.quantity}, ${MAX_LINE_QUANTITY})`,
        updatedAt: new Date(),
      },
    });

  return fetchSavedCart();
}

/** FRD F5. Sets an exact quantity on one saved line. */
export async function setSavedCartQuantity(
  input: unknown,
): Promise<CartActionResult> {
  const userId = await currentUserId();

  if (!userId) return { ok: false, lines: [], error: "unauthenticated" };

  const parsed = cartLineSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, lines: [], error: "That piece or size is not valid." };
  }

  const updated = await db
    .update(cartItems)
    .set({ quantity: parsed.data.quantity, updatedAt: new Date() })
    .where(
      and(
        eq(cartItems.userId, userId),
        eq(cartItems.productId, parsed.data.productId),
        eq(cartItems.size, parsed.data.size),
      ),
    )
    .returning({ id: cartItems.id });

  if (updated.length === 0) {
    return {
      ok: false,
      lines: [],
      error: "That piece is not in your saved cart.",
    };
  }

  return fetchSavedCart();
}

/** FRD F5. Removes one saved line. */
export async function removeSavedCartLine(
  input: unknown,
): Promise<CartActionResult> {
  const userId = await currentUserId();

  if (!userId) return { ok: false, lines: [], error: "unauthenticated" };

  const parsed = cartLineSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, lines: [], error: "That piece or size is not valid." };
  }

  await db
    .delete(cartItems)
    .where(
      and(
        eq(cartItems.userId, userId),
        eq(cartItems.productId, parsed.data.productId),
        eq(cartItems.size, parsed.data.size),
      ),
    );

  return fetchSavedCart();
}