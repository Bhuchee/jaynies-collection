# FRD — Jaynie's Collection (Functional Requirements)

This document lists every feature, how it behaves, and exactly which routes, code, tables, and environment variables it touches. Read it together with PRD.md (scope), DESIGN.md (look), and AGENTS.md (coding rules).

---

## 1. Feature list

| ID | Feature | Priority |
|---|---|---|
| F1 | Site layout: header, mobile bottom nav, footer, delivery info band | Must |
| F2 | Home page | Must |
| F3 | Shop page with category and gender filters | Must |
| F4 | Product detail page | Must |
| F5 | Cart (localStorage) | Must |
| F6 | Google sign-in and sign-out | Must (graded) |
| F7 | Checkout | Must (graded) |
| F8 | Place order and save it | Must (graded) |
| F9 | Confirmation email (Mailgun) | Must (graded) |
| F10 | My Orders list and detail | Must (graded) |
| F11 | Contact page | Should |
| F12 | Product seed script | Must |
| F13 | Product search | Should |

---

## 2. Feature specifications

### F1 — Site layout
- **Header (desktop):**
  - Logo on the left, linking to `/`.
  - Nav: Shop, Men, Women, Ankara, Contact.
  - On the right: My Orders, an account button (avatar when signed in, "Sign in" when not), and a cart icon with a count badge.
- **Header (mobile):** logo on the left; cart icon with badge on the right.
- **Mobile bottom nav** (below 768px): Home, Shop, Orders, Cart (with badge). Fixed, 64px high, and page content gets bottom padding so nothing is hidden behind it.
- **Delivery band:** a full-width yellow strip under the hero that reads "Abuja delivery ₦5,000 · Nationwide ₦10,000 · International shipping quoted on request" on desktop, and the shortened "Abuja ₦5,000 · Nigeria ₦10,000 · International on request" below `sm`, where it wraps to at most two lines and never clips its text.
- **Footer:** black background, short brand line, links (Shop, Contact, My Orders), and social squares for Instagram and WhatsApp.
- **Acceptance:** no horizontal scroll at 360px width, and every nav item works.

### F2 — Home page (`/`)
Sections, in order:
1. **Hero:** follows Brian's design (see DESIGN.md §6).
2. **Delivery band** (F1).
3. **Shop by category:** chips for Shirts, Hoodie Sets, T-Shirts & Polos, Cargo & Bottoms, Ankara. Each links to `/shop?category=…`.
4. **Best Selling:** 3 products where `is_best_seller = true`.
5. **Clothes For You:** grid of the 8 newest active products, with a "View all" link to `/shop`.
6. **How ordering works:** 3 steps with icons:
   - Pick your fit
   - Place your order
   - Jaynie confirms on WhatsApp and delivers
7. **Instagram call-to-action:** "Follow @jayniescollection".

- **Data:** read from `products` in a Server Component.
- **Acceptance:** loads with seeded data, and the layout matches DESIGN.md.

### F3 — Shop (`/shop`)
- Grid of all active products: 2 columns on mobile, 3 on tablet, 4 on desktop.
- Filters through query parameters:
  - `category`: shirts | hoodie-sets | tees-polos | bottoms | ankara
  - `gender`: men | women
  - Filters are shown as chips; the active chip is filled black.
- Empty state: "No pieces here yet" plus a link to clear the filters.
- **Acceptance:** filtering changes the URL and the results, and the page can be shared by URL.

### F4 — Product detail (`/product/[slug]`)
- Image (or a placeholder), name, price, and a compare-at price with strikethrough plus a "Save ₦X" badge when `compare_at_kobo` is set.
- Description, category, and gender label.
- **Size selector:** S, M, L. A size is required, and Add to cart stays disabled until one is selected.
- **Quantity stepper:** 1 to 10.
- **Add to cart:** adds the item, or increases the quantity if the same product and size is already in the cart, then shows a toast: "Added to cart" with a View cart link.
- **Mobile:** sticky bottom bar with the stepper and an "Add to cart · ₦total" button, following the burger app reference.
- Note under the sizes: "Made to order by Jaynie. Please allow 3–5 working days."
- A 404 page is shown for an unknown or inactive slug.
- **Acceptance:** you can't add without a size, and the cart badge updates immediately.

### F5 — Cart (`/cart`)
- **Guests (signed out):** the cart lives in Zustand `persist`, localStorage key `jc-cart`. Nobody has to sign in to add to cart.
- **Signed in:** the same cart is saved in the `cart_items` table, and the server becomes the source of truth.
- **Line item fields:** `productId`, `slug`, `name`, `imageUrl`, `size`, `unitPriceKobo` (display only), `quantity`.
- **Features:**
  - Change quantity (1–10) and remove a line.
  - Subtotal.
  - "Delivery calculated at checkout".
  - "Proceed to checkout" button.
  - Empty state with a link to the shop.
- **Checkout gate:** a signed-out shopper who presses "Proceed to checkout" is sent to `/signin?callbackUrl=/checkout` (see F6/F7). Signing in is never required to browse or to add to cart.
- **Sync on sign-in:** immediately after sign-in the guest localStorage cart is merged into the saved cart. The rule is per product and size: **the higher quantity wins, capped at 10**. A line that exists only on one side is kept. After the merge the server cart is authoritative and the local copy is replaced by it.
- **The merge happens only once, for a guest-built cart.** The client keeps a persisted marker, `syncedUserId`, in the same localStorage entry as the cart lines. If `syncedUserId` equals the current user id, the merge is **never** run again and local lines are never pushed back to the server. The marker is written only after the server has actually answered, so a failed merge is retried rather than skipped forever.
- **For an already-synced shopper**, page load and tab focus load the saved cart, and that server cart **replaces** the local cart completely. An empty server cart is a real answer, so the local cart is emptied too. Otherwise a stale local cart could re-add items after another device placed an order and emptied the saved cart.
- **Checkout must wait for that first load or merge** to finish before it renders or decides the cart is empty, so a returning shopper is never redirected to `/cart` by mistake.
- **While signed in,** every add, quantity change and remove is written to the server as well as to localStorage.
- **After a successful order** the saved cart is cleared in the same transaction that writes the order (F8 step 8), and the device that placed it clears its local cart too, **keeping** the `syncedUserId` marker so it cannot re-merge.
- **On sign-out** the local cart is cleared **and the marker is forgotten**, so the next person on a shared device never sees it and a later sign-in is treated as a fresh merge. The saved server cart is not touched, so the shopper gets it back when they sign in again. This only happens when `syncedUserId` is set; see the guest rule below.
- **Guest carts are never cleared automatically.** A signed-out visitor's local cart must survive any number of page reloads. The signed-out branch therefore clears the cart **only when `syncedUserId` is set**, which means this device had previously merged a guest cart for some account. A true guest has a null marker and their cart is left alone.
- Prices shown in the cart are never trusted by the server (see F8).
- **Acceptance:** a guest's cart survives repeated reloads, and a guest can fill a cart and sign in without losing anything; the same cart appears on a second device; after ordering, the cart is empty everywhere and stays empty after a refresh on any device.

### F6 — Authentication
- **Sign-in page:** `/signin` with the logo, one "Continue with Google" button, and a `callbackUrl` so the user returns to the page they came from.
- **Setup:**
  - Auth.js v5 in `src/auth.ts`, using `GoogleProvider`, `DrizzleAdapter(db)`, and `session.strategy = "database"`.
  - Route handler at `src/app/api/auth/[...nextauth]/route.ts`.
- **Sign-out:** in the account menu. It deletes the session row, then redirects to `/`. It also clears the local cart so the next person on the device does not see it (F5).
- **Protected pages:** `/checkout`, `/orders`, and `/orders/[orderNumber]`. Each one calls `auth()` and redirects to `/signin?callbackUrl=…` if there is no session. Do not use middleware.
- **Tables:** `users`, `accounts`, `sessions`, `verification_tokens` (standard Auth.js schema).
- **Environment variables:** `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`. `AUTH_TRUST_HOST=true` if needed.
- **Acceptance:** sign in and out works on production, and the session survives closing the browser.

### F7 — Checkout (`/checkout`, requires sign-in)
- **Form (react-hook-form and Zod):**

| Field | Rule |
|---|---|
| Full name | Optional. Prefilled from the Google name, which the shopper may clear. |
| Phone / WhatsApp | Optional, free text. |
| Delivery zone | Required radio: `abuja` (₦5,000), `nigeria` (₦10,000), `international` (fee to be confirmed). **Abuja is preselected** so the fee always calculates. |
| Address | Optional, free text. |
| City | Optional, free text. |
| State / Region | Optional, free text. Never overwritten by the zone. |
| Country | Optional, free text. Never overwritten by the zone. |
| Order note | Optional. |

Every field above is **optional**. A shopper can place an order with nothing
  filled in except the delivery zone. There are no minimum lengths, no phone
  format rule, and no field is locked, forced or rejected based on the zone.

  The **only** validation rule left on the text fields is a maximum length of
  **300 characters each**, enforced in the shared Zod schema (`lib/validation.ts`)
  so it applies identically in the browser and in `placeOrder`. An empty value is
  valid everywhere and is stored as `null`, never as an empty string. Labels carry
  no asterisk and no "required" marker, and no inline error appears for an empty
  field; only an over-length value is reported.
- **Summary panel:** line items, subtotal, delivery (shows "To be confirmed" for international), and total.
- **Payment note:** "No payment online. Jaynie will contact you on WhatsApp within 24 hours to confirm payment (transfer or pay on delivery) and delivery date."
- **Place order button:** shows a loading state and can't be double-submitted.
- If the cart is empty, redirect to `/cart`.
- **Acceptance:** an order is placed successfully with every delivery field blank; the delivery fee still updates live when the zone changes; a value over 300 characters is rejected with an inline message.

### F8 — Place order (Server Action `placeOrder`)
Located at `src/actions/place-order.ts`.

1. `auth()` returns a session, or the action fails with an "unauthenticated" error.
2. Validate the input with Zod: cart lines (`productId`, `size`, `quantity`) and the delivery fields. Delivery text fields are optional and capped at 300 characters each; the delivery zone must be one of the three valid values. An empty string passes validation.
3. Load the products from the DB by ID. Reject a line if the product is inactive or missing, the size isn't in `product.sizes`, or the quantity isn't between 1 and 10.
4. **Recalculate prices on the server** from `products.price_kobo`. Never use client prices.
5. Delivery fee from `lib/delivery.ts`:
   - abuja: 500000 kobo
   - nigeria: 1000000 kobo
   - international: `null`
6. `status` is `awaiting_quote` for international and `placed` otherwise.
7. Generate an `order_number` in the format `JC-YYMMDD-XXXX` (4 random uppercase alphanumeric characters) and retry if it already exists.
8. Insert `orders` and `order_items` in one `db.batch([...])`, which runs as a transaction. Generate the order UUID in the app with `crypto.randomUUID()`. Every delivery value is written exactly as the shopper entered it, except that a trimmed-empty string is stored as `null`; the action never rewrites `state` or `country` based on the zone. The same batch also deletes the shopper's `cart_items` rows, so the saved cart is emptied in the same transaction that saves the order.
9. After the batch commits, call `sendOrderConfirmation(order)`:
   - On success, set `email_sent_at = now()`.
   - On failure, log the error but **do not** fail the order.
10. Return `{ orderNumber }`. The client then clears the cart and redirects to `/orders/[orderNumber]?placed=1`.

- **Acceptance:** tampering with the price in localStorage has no effect on the saved total.

### F9 — Confirmation email
- **Files:**
  - `src/lib/mailgun.ts`: `sendEmail({ to, subject, html, text, bcc? })`. It sends a POST to `${MAILGUN_API_BASE}/v3/${MAILGUN_DOMAIN}/messages` with Basic auth `api:${MAILGUN_API_KEY}` and a form-encoded body.
  - `src/emails/order-confirmation.ts`: builds `{ subject, html, text }`.
- **Subject:** "Your Jaynie's Collection order JC-XXXX is confirmed" (uses the full order number).
- **HTML content** (table-based, inline CSS, 600px wide, no web fonts beyond the fallback stack, no emoji):
  - Black header with the logo, loaded from an absolute URL: `${NEXT_PUBLIC_SITE_URL}/brand/logo-dark-bg.png` (the gold logo on black; `logo-email.png` was dropped because that file does not exist)
  - "Thank you, {firstName}" plus the order number and date
  - Items table: thumbnail, name, size, quantity, line total
  - Subtotal, delivery ("To be confirmed" for international), and total
  - Delivery address
  - **What happens next:** Jaynie will WhatsApp you within 24 hours to confirm payment and delivery. International customers: your shipping fee will be quoted then.
  - Gold button: "View your order", linking to `${NEXT_PUBLIC_SITE_URL}/orders/{orderNumber}`
  - Footer: Instagram @jayniescollection and the WhatsApp number
- A plain-text version is always included.
- **Acceptance:** the email arrives in the inbox and renders properly in Gmail on web and mobile.

### F10 — My Orders
- **`/orders`:**
  - Shows the signed-in user's orders, newest first.
  - Each card: order number, date, status badge, item count, total, and a first-item thumbnail.
  - Empty state: "No orders yet" with a link to the shop.
- **`/orders/[orderNumber]`:**
  - Shows the full order: items, amounts, delivery details, and status.
  - When `?placed=1`, a success banner reads "Order placed. A confirmation email is on its way to {email}."
- **Security:** always query `WHERE user_id = session.user.id`. Another user's order number returns 404.
- **Status badges:**

| Status | Badge |
|---|---|
| placed | Placed |
| awaiting_quote | Awaiting shipping quote |
| confirmed | Confirmed |
| shipped | Shipped |
| delivered | Delivered |
| cancelled | Cancelled |

- **Acceptance:** the HNG persistence test passes (logout, close, reopen, sign in, orders still there).

### F11 — Contact (`/contact`)
- WhatsApp button linking to `https://wa.me/${NEXT_PUBLIC_WHATSAPP_NUMBER}` (placeholder `2348000000000`).
- Instagram link to `https://instagram.com/jayniescollection`.
- Delivery fee summary.

### F12 — Seed (`npm run db:seed`)
- `src/db/seed.ts` upserts the catalog in §4 by `slug`, so it can safely be run more than once.

### F13 — Product search
- **Desktop:** a search input in the header with a lucide `Search` icon and the placeholder "Search hoodies, shirts, Ankara…".
- **Mobile:** a `Search` icon in the header opens a full-width input under the header.
- Submitting goes to `/shop?q=<term>`. The shop page combines `q` with the `category` and `gender` filters.
- **Query:** active products where `name ILIKE '%term%' OR description ILIKE '%term%'`. The term is trimmed to 1–50 characters and passed as a bound parameter.
- The results header reads "Results for '{term}' (N)" and has a clear (X) button. When nothing matches: "No pieces match '{term}'" plus links to browse each category.
- **Acceptance:** searching "hoodie" returns all hoodie sets and the Classic Hoodie, and searching "ankara" returns the 4 Ankara items.

---

## 3. Data model (Drizzle, `src/db/schema.ts`)

Money is always stored as **integer kobo** (₦1 = 100 kobo). Format it only for display.

### Auth.js tables (standard Drizzle adapter schema)
- `users` (id text pk, name, email unique, emailVerified, image)
- `accounts`
- `sessions`
- `verification_tokens`

### `products`

| Column | Type | Notes |
|---|---|---|
| id | uuid pk default random | |
| slug | text unique not null | |
| name | text not null | |
| description | text not null | |
| category | enum `shirts`, `hoodie-sets`, `tees-polos`, `bottoms`, `ankara` | |
| gender | enum `men`, `women`, `unisex` | |
| price_kobo | integer not null | |
| compare_at_kobo | integer null | For set savings |
| image_url | text null | `/products/<file>.webp`. Null means placeholder. |
| sizes | text[] not null default `{S,M,L}` | |
| is_best_seller | boolean default false | |
| is_active | boolean default true | |
| created_at | timestamptz default now() | |

### `orders`

| Column | Type | Notes |
|---|---|---|
| id | uuid pk | Generated in the app |
| order_number | text unique not null | `JC-YYMMDD-XXXX` |
| user_id | text fk → users.id not null | Indexed |
| status | enum `placed`, `awaiting_quote`, `confirmed`, `shipped`, `delivered`, `cancelled` | |
| delivery_zone | enum `abuja`, `nigeria`, `international` | |
| subtotal_kobo | integer not null | |
| delivery_fee_kobo | integer null | Null for international |
| total_kobo | integer not null | Subtotal plus fee (or plus 0 for international) |
| recipient_name, phone, address_line, city, state, country | text null | All optional. Null when the shopper left the field empty. |
| note | text null | |
| customer_email | text not null | Snapshot of the session email |
| email_sent_at | timestamptz null | |
| created_at | timestamptz default now() | |

### `order_items`

| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| order_id | uuid fk → orders.id on delete cascade | Indexed |
| product_id | uuid fk → products.id | |
| product_name | text not null | Snapshot |
| image_url | text null | Snapshot |
| size | text not null | |
| unit_price_kobo | integer not null | Snapshot |
| quantity | integer not null check 1–10 | |
| line_total_kobo | integer not null | |

---

### `cart_items`

A saved cart per signed-in shopper. One row per product and size.

| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| user_id | text fk → users.id on delete cascade | Indexed |
| product_id | uuid fk → products.id | |
| size | text not null | Must be one of the product's `sizes` |
| quantity | integer not null check 1–10 | |
| updated_at | timestamptz default now() | |

Unique on `(user_id, product_id, size)`.

---

## 4. Seed catalog

Every item uses sizes S/M/L. Items with a ✱ have no photo yet. Generate them using DESIGN.md §9, and they'll show a placeholder until then.

| Slug | Name | Category | Gender | Price | Compare-at | Image file | Best seller |
|---|---|---|---|---|---|---|---|
| mosaic-print-shirt | Mosaic Print Shirt | shirts | men | ₦17,000 | | shirt-mosaic.webp | |
| gold-lattice-shirt | Gold Lattice Shirt | shirts | unisex | ₦17,000 | | shirt-gold-lattice.webp | yes |
| ember-camp-collar-shirt | Ember Camp-Collar Shirt | shirts | men | ₦17,000 | | shirt-ember-camp.webp | |
| rust-brushstroke-shirt | Rust Brushstroke Shirt | shirts | unisex | ₦17,000 | | shirt-rust.webp | |
| ember-shirt-trouser-set | Ember Long-Sleeve Shirt & Trouser Set | shirts | unisex | ₦42,000 | ₦47,000 | set-ember-longsleeve.webp | |
| burgundy-hoodie-set | Burgundy Hoodie & Joggers | hoodie-sets | unisex | ₦47,000 | ₦54,000 | set-burgundy.webp | |
| olive-hoodie-set | Olive Hoodie & Joggers | hoodie-sets | unisex | ₦46,000 | ₦54,000 | set-olive.webp | |
| ash-hoodie-set | Ash Hoodie & Joggers | hoodie-sets | unisex | ₦45,000 | ₦54,000 | set-ash.webp | yes |
| monochrome-hoodie-set | Monochrome Hoodie & Joggers | hoodie-sets | unisex | ₦48,000 | ₦54,000 | set-monochrome.webp | |
| lilac-cream-hoodie-set | Lilac & Cream Hoodie Set | hoodie-sets | women | ₦49,000 | ₦54,000 | set-lilac-cream.webp | yes |
| sky-onyx-hoodie-set | Sky & Onyx Hoodie Set | hoodie-sets | unisex | ₦48,000 | ₦54,000 | set-sky-onyx.webp | |
| classic-hoodie | Classic Hoodie ✱ | hoodie-sets | unisex | ₦27,000 | | null | |
| classic-joggers | Classic Joggers ✱ | bottoms | unisex | ₦27,000 | | null | |
| classic-shorts | Classic Shorts ✱ | bottoms | unisex | ₦27,000 | | null | |
| utility-cargo-pants | Utility Cargo Pants ✱ | bottoms | unisex | ₦35,000 | | null | |
| essential-tee | Essential T-Shirt ✱ | tees-polos | unisex | ₦12,000 | | null | |
| signature-polo | Signature Polo ✱ | tees-polos | unisex | ₦15,000 | | null | |
| ankara-bubu-gown | Ankara Bubu Gown ✱ | ankara | women | ₦45,000 | | null | |
| ankara-two-piece-shorts | Ankara Two-Piece Shorts Set ✱ | ankara | women | ₦25,000 | | null | |
| ankara-wrap-skirt | Ankara Wrap Skirt ✱ | ankara | women | ₦20,000 | | null | |
| ankara-statement-gown | Ankara Statement Gown ✱ | ankara | women | ₦70,000 | | null | |

**Pricing rules agreed:**
- A hoodie and joggers each cost ₦27,000 alone (₦54,000 combined). Sets are discounted by roughly ₦7,000, and each colourway has its own price.
- Cargo pants: ₦35,000. Shirts: ₦17,000.
- The shirt and trouser set price was chosen by the builder.
- T-shirt and polo prices are placeholders for Jaynie to confirm.
- Ankara prices range from ₦20,000 to ₦70,000 depending on style.

---

## 5. Feature-to-implementation map

| Feature | Routes / files | Server logic | Tables | Env vars |
|---|---|---|---|---|
| F1 Layout | `app/layout.tsx`, `components/layout/*` | none | none | `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_INSTAGRAM_HANDLE` |
| F2 Home | `app/page.tsx`, `components/home/*` | `lib/queries.ts` → `getBestSellers`, `getLatestProducts` | products | `DATABASE_URL` |
| F3 Shop | `app/shop/page.tsx` | `getProducts({category, gender})` | products | `DATABASE_URL` |
| F4 Product | `app/product/[slug]/page.tsx`, `components/product/*` | `getProductBySlug` | products | `DATABASE_URL` |
| F5 Cart | `app/cart/page.tsx`, `store/cart.ts` | none (client side) | none | none |
| F6 Auth | `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/signin/page.tsx` | Auth.js | users, accounts, sessions, verification_tokens | `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| F7 Checkout | `app/checkout/page.tsx`, `components/checkout/*`, `lib/validation.ts` | `auth()` guard | none (reads session) | none |
| F8 Place order | `actions/place-order.ts`, `lib/delivery.ts`, `lib/order-number.ts`, `lib/money.ts` | Server Action plus `db.batch` | orders, order_items, products | `DATABASE_URL` |
| F9 Email | `lib/mailgun.ts`, `emails/order-confirmation.ts` | Called from F8 | orders.email_sent_at | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_API_BASE`, `MAIL_FROM`, `NEXT_PUBLIC_SITE_URL` |
| F10 Orders | `app/orders/page.tsx`, `app/orders/[orderNumber]/page.tsx` | `getOrdersForUser`, `getOrderForUser` | orders, order_items | `DATABASE_URL` |
| F11 Contact | `app/contact/page.tsx` | none | none | `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| F12 Seed | `db/seed.ts` | script | products | `DATABASE_URL` |
| F13 Search | `components/layout/search-bar.tsx`, `app/shop/page.tsx` | `getProducts({q, category, gender})` | products | `DATABASE_URL` |

---

## 6. User flows

**Guest to order:**
Home → Product → choose size → Add to cart → Cart → Checkout → redirected to `/signin?callbackUrl=/checkout` → Google → back at Checkout (the cart is still there) → fill in details → Place order → `/orders/JC-…?placed=1` → email arrives.

**HNG persistence test:**
Sign in → place an order → My Orders shows it → Sign out → close the tab → reopen the site → Sign in → My Orders still shows it.

---

## 7. Environment variables (`.env.example`)

```
DATABASE_URL=
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
MAILGUN_API_BASE=https://api.mailgun.net
MAIL_FROM="Jaynie's Collection <orders@YOUR_MAILGUN_DOMAIN>"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=2348000000000
NEXT_PUBLIC_INSTAGRAM_HANDLE=jayniescollection
```
