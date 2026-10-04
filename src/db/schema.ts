import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/*
  FRD section 3. Money is always an integer number of kobo (NGN 1 = 100 kobo).
  Our own tables use camelCase keys mapped to snake_case columns; the Auth.js
  tables keep the canonical adapter column names so the adapter needs no patches.
*/

export const productCategoryEnum = pgEnum("product_category", [
  "shirts",
  "hoodie-sets",
  "tees-polos",
  "bottoms",
  "ankara",
]);

export const productGenderEnum = pgEnum("product_gender", [
  "men",
  "women",
  "unisex",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "placed",
  "awaiting_quote",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const deliveryZoneEnum = pgEnum("delivery_zone", [
  "abuja",
  "nigeria",
  "international",
]);

/* ---------------------------------------------------------------- Auth.js */

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

/* -------------------------------------------------------------- Catalogue */

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: productCategoryEnum("category").notNull(),
  gender: productGenderEnum("gender").notNull(),
  priceKobo: integer("price_kobo").notNull(),
  compareAtKobo: integer("compare_at_kobo"),
  imageUrl: text("image_url"),
  sizes: text("sizes").array().notNull().default(sql`'{S,M,L}'`),
  isBestSeller: boolean("is_best_seller").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ----------------------------------------------------------------- Orders */

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    status: orderStatusEnum("status").notNull().default("placed"),
    deliveryZone: deliveryZoneEnum("delivery_zone").notNull(),
    subtotalKobo: integer("subtotal_kobo").notNull(),
    deliveryFeeKobo: integer("delivery_fee_kobo"),
    totalKobo: integer("total_kobo").notNull(),
    /* FRD F7: every delivery field is optional, so all six are nullable. An
       empty value is stored as null rather than an empty string, which keeps
       "not provided" distinguishable from "typed nothing". */
    recipientName: text("recipient_name"),
    phone: text("phone"),
    addressLine: text("address_line"),
    city: text("city"),
    state: text("state"),
    country: text("country"),
    note: text("note"),
    customerEmail: text("customer_email").notNull(),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (order) => [index("orders_user_id_idx").on(order.userId)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    productName: text("product_name").notNull(),
    imageUrl: text("image_url"),
    size: text("size").notNull(),
    unitPriceKobo: integer("unit_price_kobo").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalKobo: integer("line_total_kobo").notNull(),
  },
  (item) => [
    index("order_items_order_id_idx").on(item.orderId),
    check("order_items_quantity_range", sql`${item.quantity} between 1 and 10`),
  ],
);

/* ---------------------------------------------------------------- Saved cart */

/*
  FRD F5. One row per product and size for a signed-in shopper. The guest cart in
  localStorage is merged into this table on sign-in, and from then on this is the
  source of truth. product_id does not cascade: deleting a product from the
  catalogue should not silently destroy a shopper's saved cart, and products are
  deactivated rather than deleted.
*/
export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    size: text("size").notNull(),
    quantity: integer("quantity").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (item) => [
    index("cart_items_user_id_idx").on(item.userId),
    unique("cart_items_user_product_size_unique").on(
      item.userId,
      item.productId,
      item.size,
    ),
    check("cart_items_quantity_range", sql`${item.quantity} between 1 and 10`),
  ],
);

/* ------------------------------------------------- Mobile sign-in codes */

/*
  FRD F15. One row per in-flight app sign-in, living for the 2 minutes between
  the browser hand-off and the code exchange.

  Only a SHA-256 HASH of the one-time code is stored: a stolen database row
  cannot be replayed as a code. code_challenge holds the PKCE S256 challenge
  (base64url of SHA-256 of the verifier), which is what binds the exchange to
  the app that started it, so a leaked code is useless without the verifier.

  user_id cascades, so deleting a user removes their outstanding codes. Expired
  and used rows are inert and can be swept with a plain DELETE.
*/
export const mobileAuthCodes = pgTable(
  "mobile_auth_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    codeHash: text("code_hash").notNull().unique(),
    codeChallenge: text("code_challenge").notNull(),
    state: text("state").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    redirectUri: text("redirect_uri").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (code) => [
    index("mobile_auth_codes_user_id_idx").on(code.userId),
    index("mobile_auth_codes_expires_at_idx").on(code.expiresAt),
  ],
);

/* ------------------------------------------------------------------ Types */

export const PRODUCT_CATEGORIES = productCategoryEnum.enumValues;
export const PRODUCT_GENDERS = productGenderEnum.enumValues;
export const ORDER_STATUSES = orderStatusEnum.enumValues;
export const DELIVERY_ZONES = deliveryZoneEnum.enumValues;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
export type MobileAuthCode = typeof mobileAuthCodes.$inferSelect;
export type NewMobileAuthCode = typeof mobileAuthCodes.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ProductGender = (typeof PRODUCT_GENDERS)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type DeliveryZone = (typeof DELIVERY_ZONES)[number];