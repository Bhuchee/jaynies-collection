"use server";

import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { DELIVERY_FEES_KOBO } from "@/lib/delivery";
import { createUniqueOrderNumber } from "@/lib/order-number";
import {
  MAX_LINE_QUANTITY,
  MIN_LINE_QUANTITY,
  fieldErrorsFromIssues,
  placeOrderSchema,
} from "@/lib/validation";

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, { type: string; message: string }>;
    };

/*
  FRD F8. The client sends product ids, sizes, quantities and the delivery
  fields. Every price, fee and total in this file is recalculated from the
  database: nothing from the browser is trusted.
*/
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  /* Step 1: the action is graded, so it refuses to run without a session. */
  const session = await auth();
  const userId = session?.user?.id;
  const customerEmail = session?.user?.email;

  if (!userId || !customerEmail) {
    return { ok: false, error: "unauthenticated" };
  }

  /* Step 2: validate the whole payload on the server. */
  const parsed = placeOrderSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check your details.",
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }

  const { lines, delivery } = parsed.data;

  /* Step 3: load the products ourselves. A missing id means the piece was
     removed or deactivated, because the query only returns active rows. */
  const productIds = [...new Set(lines.map((line) => line.productId))];

  const foundProducts = await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), inArray(products.id, productIds)));

  const productsById = new Map(foundProducts.map((product) => [product.id, product]));

  const items: (typeof orderItems.$inferInsert)[] = [];

  for (const line of lines) {
    const product = productsById.get(line.productId);

    if (!product) {
      return {
        ok: false,
        error: "A piece in your cart is no longer available. Please review your cart.",
      };
    }

    if (!product.sizes.includes(line.size)) {
      return {
        ok: false,
        error: `${product.name} is not available in size ${line.size}.`,
      };
    }

    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < MIN_LINE_QUANTITY ||
      line.quantity > MAX_LINE_QUANTITY
    ) {
      return {
        ok: false,
        error: `Choose between 1 and ${MAX_LINE_QUANTITY} of ${product.name}.`,
      };
    }

    /* Step 4: the unit price comes from products.price_kobo. */
    items.push({
      orderId: "",
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      size: line.size,
      unitPriceKobo: product.priceKobo,
      quantity: line.quantity,
      lineTotalKobo: product.priceKobo * line.quantity,
    });
  }

  const subtotalKobo = items.reduce((total, item) => total + item.lineTotalKobo, 0);
  const deliveryFeeKobo = DELIVERY_FEES_KOBO[delivery.deliveryZone];

  /* An international order is saved without a fee and waits for a quote. */
  const totalKobo = subtotalKobo + (deliveryFeeKobo ?? 0);
  const isInternational = delivery.deliveryZone === "international";

  const orderNumber = await createUniqueOrderNumber();
  const orderId = crypto.randomUUID();

  /* Nigeria is locked for the Nigerian zones and FCT is forced for Abuja. */
  const state = delivery.deliveryZone === "abuja" ? "FCT" : delivery.state;
  const country = isInternational ? delivery.country : "Nigeria";

  /* Step 8: both inserts land in one transaction. */
  const [insertedOrder] = await db.batch([
    db
      .insert(orders)
      .values({
        id: orderId,
        orderNumber,
        userId,
        status: isInternational ? "awaiting_quote" : "placed",
        deliveryZone: delivery.deliveryZone,
        subtotalKobo,
        deliveryFeeKobo,
        totalKobo,
        recipientName: delivery.fullName,
        phone: delivery.phone,
        addressLine: delivery.addressLine,
        city: delivery.city,
        state,
        country,
        note: delivery.note ? delivery.note : null,
        customerEmail,
      })
      .returning({ id: orders.id, orderNumber: orders.orderNumber }),
    db.insert(orderItems).values(items.map((item) => ({ ...item, orderId }))),
  ]);

  /*
    Step 9: phase 5 calls sendOrderConfirmation here, stamps email_sent_at on
    success and leaves it null on failure. The order is already committed, so
    an email failure can never fail an order.
  */

  /* Step 10: the client clears the cart and redirects to the order page. */
  return { ok: true, orderNumber: insertedOrder[0].orderNumber };
}