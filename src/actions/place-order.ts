"use server";

import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { sendOrderConfirmation } from "@/emails/order-confirmation";
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
  const googleName = session?.user?.name ?? null;

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

  /*
    FRD F7: no delivery field is required, and none is derived from the zone.
    The shopper's own words are stored exactly as entered, and an empty field
    becomes null so "not provided" is never confused with real content.
  */
  const orderNumber = await createUniqueOrderNumber();
  const orderId = crypto.randomUUID();

  const optional = (value: string) => (value.trim() === "" ? null : value.trim());

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
        recipientName: optional(delivery.fullName),
        phone: optional(delivery.phone),
        addressLine: optional(delivery.addressLine),
        city: optional(delivery.city),
        state: optional(delivery.state),
        country: optional(delivery.country),
        note: optional(delivery.note),
        customerEmail,
      })
      .returning({ id: orders.id, orderNumber: orders.orderNumber }),
    db.insert(orderItems).values(items.map((item) => ({ ...item, orderId }))),
  ]);

  /*
    Step 9: the confirmation email is best effort. The order is already
    committed, so anything that goes wrong here is logged and swallowed: a
    failed email can never fail an order, and email_sent_at stays null.
  */
  try {
    const [storedOrder] = await db
      .select({
        orderNumber: orders.orderNumber,
        createdAt: orders.createdAt,
        customerEmail: orders.customerEmail,
        recipientName: orders.recipientName,
        phone: orders.phone,
        addressLine: orders.addressLine,
        city: orders.city,
        state: orders.state,
        country: orders.country,
        note: orders.note,
        subtotalKobo: orders.subtotalKobo,
        deliveryFeeKobo: orders.deliveryFeeKobo,
        totalKobo: orders.totalKobo,
        deliveryZone: orders.deliveryZone,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const storedItems = await db
      .select({
        name: orderItems.productName,
        size: orderItems.size,
        quantity: orderItems.quantity,
        lineTotalKobo: orderItems.lineTotalKobo,
        imageUrl: orderItems.imageUrl,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const email = await sendOrderConfirmation({
      orderNumber: storedOrder.orderNumber,
      recipientName: storedOrder.recipientName,
      fallbackName: googleName,
      recipientEmail: storedOrder.customerEmail,
      createdAt: storedOrder.createdAt,
      items: storedItems,
      subtotalKobo: storedOrder.subtotalKobo,
      deliveryFeeKobo: storedOrder.deliveryFeeKobo,
      totalKobo: storedOrder.totalKobo,
      deliveryZone: storedOrder.deliveryZone,
      phone: storedOrder.phone,
      addressLine: storedOrder.addressLine,
      city: storedOrder.city,
      state: storedOrder.state,
      country: storedOrder.country,
      note: storedOrder.note,
    });

    if (email.ok) {
      await db
        .update(orders)
        .set({ emailSentAt: new Date() })
        .where(eq(orders.id, orderId));
    } else {
      console.error(
        `Confirmation email for ${storedOrder.orderNumber} failed: ${email.error}`,
      );
    }
  } catch (error) {
    console.error(
      "Confirmation email error, the order is still saved:",
      error,
    );
  }

  /* Step 10: the client clears the cart and redirects to the order page. */
  return { ok: true, orderNumber: insertedOrder[0].orderNumber };
}