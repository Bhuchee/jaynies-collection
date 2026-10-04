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
| **F14** | **JSON API under `/api/v1`** for the mobile app | **Must (graded, R2)** |
| **F15** | **Mobile sign-in: browser hand-off, one-time code, bearer token** | **Must (graded, R1)** |
| **F16** | **Android app in `mobile/`** (Expo, expo-router), tested on a physical phone | **Must (graded, R3)** |
| **F17** | **Live cart sync between website and app** | **Must (graded, R2)** |

**Lesson 3 (F14 to F17) serves PRD requirements R1, R2 and R3.** F14 and F17 together deliver R2, F15 delivers R1, F16 delivers R3. They are additions; F1 to F13 are unchanged and still graded.

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
- **Lesson 3 (F14): the website and the app call the same HTTP endpoints.** This is the requirement, not merely a nice property: the website's cart client (the code that currently imports the cart Server Actions) is switched to call `/api/v1/cart` over `fetch`, authenticated with the normal **cookie session**, so a website cart change travels over the same HTTP surface as an app cart change. The website sends credentials so the cookie goes with the request.
  - Underneath both, all five cart functions live in `src/lib/cart.ts` as plain functions that take an explicit `userId` and return data, with no `auth()` call and no `"use server"` directive. `/api/v1/cart/*` calls them with the `userId` from `getUserFromRequest` (F15). The Server Actions remain in place as thin wrappers over the same functions, so there is always a second working path and the website can be repointed or reverted one call site at a time.
  - **The website's behaviour is unchanged by this refactor:** same localStorage merge rules, same `syncedUserId` marker, same focus reload, same focus-skip while a write is pending, same `CartActionResult` shape. Moving the code and repointing the client is the whole change; **no rule is edited**. If the network call fails or the app is offline, the website keeps its local cart and retries rather than losing it, which is the guest-cart rule above.
- **Acceptance:** a guest's cart survives repeated reloads, and a guest can fill a cart and sign in without losing anything; the same cart appears on a second device; after ordering, the cart is empty everywhere and stays empty after a refresh on any device; the website's cart flows still pass after the switch, **the website's cart requests appear in the browser network panel hitting `/api/v1/cart`**, and `GET /api/v1/cart` returns exactly what the website shows for the same account.

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
### F14 — JSON API under `/api/v1`
The API the app talks to. It lives in this Next.js project, on the same origin and the same deployment as the website, so there is one backend, one database and one auth configuration.

**Cross-cutting rules for every endpoint:**
- **Money is always integer kobo** in requests and responses. Never a formatted string, never a decimal. Only the app formats it for display.
- **The server never trusts a price from the client.** Cart endpoints return `unitPriceKobo` for display only, and the real total is recalculated from `products.price_kobo` exactly as `placeOrder` does (AGENTS.md rule 3).
- **Every user-scoped query is scoped to the resolved `userId`** (AGENTS.md rule 4). No endpoint accepts a `userId` from the client.
- **JSON in, JSON out.** Errors are `{ "error": { "code": string, "message": string } }`, and `message` is safe to show a shopper. Never leak a stack trace, a SQL error or a token.
- **Status codes:** `200` success, `201` created, `400` invalid input, `401` missing or invalid bearer token, `404` not found or not yours, `405` wrong method, `500` unexpected (logged server-side, generic message returned).
- **No caching.** Cart, orders and `me` set `Cache-Control: no-store`, because a stale cart is the one bug this project cannot have.
- **`/api/v1/auth/*` endpoints never require authentication**, since they are what creates it. Everything else under `/api/v1` requires it.

**Products** (public, no token needed)
- `GET /api/v1/products` — query: `category`, `gender`, `q`, `limit` (default 24, max 60), `offset`. Reuses `getProducts()` and the same `q` trimming as F13, so the app's filters match the website's exactly. Returns `{ products: ProductDto[], total: number }`.
- `GET /api/v1/products/[slug]` — one product, or `404`. `imageUrl` is returned as an **absolute URL** built from `NEXT_PUBLIC_SITE_URL`, because the app has no origin of its own to resolve a relative path against.
- `ProductDto`: `id`, `slug`, `name`, `description`, `category`, `gender`, `priceKobo`, `compareAtKobo`, `imageUrl` (absolute or `null`), `sizes[]`, `isBestSeller`, `categoryLabel`, `genderLabel`. The labels come from `lib/catalog.ts` so the app's chip text cannot drift from the website's.

**Cart** (authenticated; all four use `getUserFromRequest`, cookie or bearer)
- `GET /api/v1/cart` — `{ lines: CartLineDto[], itemCount, subtotalKobo }`. `itemCount` is total quantity, matching the website badge. `subtotalKobo` is summed from live `products.price_kobo`.
- `POST /api/v1/cart/items` — body `{ productId, size, quantity }`. Adds to any existing quantity for that product and size, capped at 10, exactly as `addSavedCartLine` does today.
- `PATCH /api/v1/cart/items` — body `{ productId, size, quantity }`. Sets an exact quantity.
- `DELETE /api/v1/cart/items` — body or query `{ productId, size }`. Removes one line.
- All three mutations return the **whole cart** in the same shape as `GET`, so the client adopts the server's answer in one step. This is the existing `CartActionResult` behaviour.
- `CartLineDto`: `productId`, `slug`, `name`, `imageUrl` (absolute or `null`), `size`, `unitPriceKobo`, `quantity`.

**Orders** (authenticated, always scoped to the caller)
- `GET /api/v1/orders` — summaries, newest first, via `getOrdersForUser(userId)`.
- `GET /api/v1/orders/[orderNumber]` — the full order and items, via `getOrderForUser(orderNumber, userId)`. **Another shopper's order number returns `404`**, not `403`, so the endpoint does not confirm that an order number exists.
- `createdAt` is an ISO-8601 string. Dates are formatted for display only in the app, using the same month names as `lib/dates.ts`.
- **There is no `POST /api/v1/orders`.** Ordering happens on the website (see F16).

**Profile**
- `GET /api/v1/me` — `{ id, name, email, image }`, used on app start to decide between the sign-in screen and the shop. It also reports `deliveryFeesKobo` and the delivery zone labels from `lib/delivery.ts`, so the app never hard-codes a fee.

- **Acceptance:** every endpoint answers correctly from `curl` with a real bearer token; an unauthenticated cart or order call returns `401`; the website's cart client is visibly hitting these same endpoints; and the prices, fees and labels returned match what the website renders for the same account.

### F15 — Mobile sign-in (browser hand-off, PKCE, bearer token)
The app never implements Google sign-in. It borrows the website's, then converts the resulting cookie session into a bearer token it can hold.

**Flow:**
1. The app generates a `code_verifier` (32 random bytes, base64url) and a `state` (16 random bytes, base64url), both in memory only, and computes `code_challenge = base64url(SHA-256(code_verifier))` using **S256**. It keeps `state` in memory to compare later. It never persists the verifier.
2. The app calls `POST /api/v1/auth/mobile/start` with `{ redirect_uri, code_challenge, code_challenge_method: "S256", state }` and receives `{ auth_url }`.
3. The app opens `auth_url` with `expo-web-browser`'s `openAuthSessionAsync` in the **system browser**, never a WebView, because Google refuses to sign in inside an embedded webview. The session is given a 5-minute timeout.
4. The server validates `redirect_uri` against an **allowlist** and rejects anything else with `400`. The allowlist is the app scheme `jaynies://` and `exp://` for Expo Go. This check is the defence against the endpoint being used as an open redirect that leaks an auth code to an attacker's app.
5. The server runs the **existing Auth.js Google sign-in** and the existing `users` table. No new OAuth client, no new provider, no second identity system. When the browser returns to `redirect_uri` the session is an ordinary Auth.js cookie session, and the server reads it with `auth()`.
6. The server creates a one-time code: 32 random bytes, base64url, stored **only as a SHA-256 hash** in `mobile_auth_codes` together with `code_challenge`, `state`, `user_id`, `redirect_uri`, `expires_at` (now + 2 minutes) and `used_at` (null). It then redirects to `redirect_uri?code=...&state=...`.
7. The app receives the deep link, checks the **`state` matches the one it generated**, and if it does not, discards the response and exchanges nothing.
8. The app calls `POST /api/v1/auth/mobile/exchange` with `{ code, code_verifier }`.
9. The server looks up the row by `code_hash`, then enforces, in order: the row exists; `used_at IS NULL`; `expires_at > now()`; and `base64url(SHA-256(code_verifier)) === code_challenge`. Any failure is a single `400 invalid_grant` with the same generic message, so the endpoint does not reveal which check failed. The verifier comparison is constant-time.
10. On success, in **one transaction**: mark the row `used_at = now()`, delete that user's expired sessions, and insert a new `sessions` row whose `sessionToken` is 32 random bytes with a **30-day** expiry. The response is `{ token, expiresAt, state, user: { id, name, email, image } }`, echoing `state` so the app can compare on the response as well as on the deep link.
11. The app stores the token with **`expo-secure-store`** (Android Keystore-backed), never AsyncStorage. The raw one-time code and the verifier are discarded immediately and are never written to any log.

**Why PKCE is here, not optional:** the one-time code travels in a deep link and could be read from a browser history, a screenshot or a server log. Without PKCE, a stolen code is a full account takeover within its 2-minute life. With PKCE, a stolen code is useless without the `code_verifier`, which never leaves the device. `state` is the second half of the defence: it binds the response to the request this app instance made, so a code injected from elsewhere is refused before any exchange happens.

**Bearer authentication on every later request:**
- `getUserFromRequest(request)` in `src/lib/api-auth.ts` resolves the shopper from **either** source, in this order: an `Authorization: Bearer <token>` header, then the Auth.js cookie session via `auth()`. It returns `{ id, name, email, image }` or `null`, and the route answers `401` when `null`. Cookie support is what lets the website call these same endpoints (F5); bearer support is what lets the app.
- A bearer token is validated by looking up `sessions.sessionToken`, which Auth.js stores **in plaintext** and looks up by equality, confirmed in `node_modules/@auth/core/lib/actions/session.js`. A direct equality lookup is therefore the correct check, and a mobile token is an ordinary session row rather than a parallel token system. It is never logged, never put in a query string, and never returned to another user.
- A token that is unknown or past `expires` is treated as absent: the app clears its secure-store token and returns to the sign-in screen. There is **no refresh token and no silent refresh**; a lapsed session means signing in again through the browser.
- Sign-out in the app calls `DELETE /api/v1/auth/mobile/session`, which deletes **only that one `sessions` row**. The website's cookie session and any other device are untouched, so signing out of the app does not sign the shopper out of the website, and vice versa.

- **Acceptance:** the happy path signs in on a physical phone and produces a usable bearer token; a wrong `code_verifier`, a reused code and an expired code are each rejected, and each rejection is proven by a direct `curl` rather than inferred from the UI; a mismatched `state` prevents the exchange; only the hash and the challenge are ever written to the database; and signing out of one surface leaves the other signed in.

### F16 — The Android app (`mobile/`)
An Expo app with expo-router, in `mobile/` of this repository, tested on a physical Android phone through Expo Go.

**Structure**
```
mobile/
  app/                 # expo-router routes
  src/
    api/               # fetch client, types mirroring the F14 contract
    components/        # product card, size picker, stepper, cart line, status badge, empty states
    theme/             # DESIGN.md tokens as constants, Poppins loading
    store/             # session (secure store), cart (server-authoritative)
    utils/             # money formatting, dates
  .env                 # EXPO_PUBLIC_API_URL, gitignored
  app.json             # scheme: "jaynies"
```
- **`mobile/` is a separate npm project** with its own `package.json`, `tsconfig.json` and `node_modules`. It is not a workspace of the website, and nothing under `src/` may import from `mobile/` (AGENTS.md rule 21).
- **The root `tsconfig.json` and `eslint.config.mjs` must exclude `mobile/`.** The website's `npm run build` type-checks and lints the repo, so without this the Expo sources and the React Native types break the website build. This is part of phase L3-2.

**Screens**
| Route | Contents |
|---|---|
| `/(tabs)/index` | Shop: category and gender chips, a 2-column product grid, pull to refresh. Reuses the website's filter values and labels from the API. |
| `/product/[slug]` | Image or placeholder, name, price with compare-at and the Save pill, description, S/M/L pills, 1-10 stepper, Add to cart, and the "Made to order by Jaynie" note. |
| `/cart` | Live lines with image, name, size, stepper and remove, subtotal, "Delivery calculated at checkout", and a **Checkout** button that hands off to the website (below). |
| `/orders` | The shopper's orders, newest first: order number, date, status badge, item count, total, first thumbnail. |
| `/orders/[orderNumber]` | Full order: items, subtotal, delivery ("To be confirmed" for international), total, delivery details, status. |
| `/signin` | Logo, one **Continue with Google** button, and the privacy line from the website's sign-in page. |
| `/account` | Name and email, sign out, WhatsApp and Instagram links, the delivery fee summary, and the app version. |

**Behaviour**
- **Sign-in and the store:** on cold start the app reads the token from secure store and calls `GET /api/v1/me`. A `200` goes to the shop; a `401` clears the token and goes to `/signin`.
- **The cart is server-authoritative.** There is no local cart in the app. Every add, quantity change and remove calls the API and replaces local state with the response, the same one-step adoption the website uses. No offline write queue.
- **Checkout is a hand-off, and it opens the system browser.** The Checkout button opens `${SITE_URL}/checkout` with `expo-web-browser`.
  - **The website authenticates with a cookie session, not with the app's bearer token, so the browser may ask for Google sign-in again even though the shopper is already signed in to the app. This is expected behaviour, not a defect.** The app cannot inject a cookie into the system browser, and the two sessions are deliberately independent (F15). It is documented in the README and demonstrated as a step in the L3-5 phone script, so it is never treated as a bug to be "fixed" by weakening sign-in.
  - The cart is already server-side, so whatever the shopper built in the app is exactly what the website's checkout shows after that sign-in. That is the proof that the cart is genuinely shared.
- **Look:** Onyx `#0A0A0A`, highlight `#EAD86B`, cream `#FBF9EE`, mist `#F1F2F1`, photo `#D3D3D3`, line `#E4E4E4`, ink-muted `#5C5C5C`, gold `#C9A44C`, success `#2F6B3B`, danger `#B3261E`; Poppins 400/500/600/800/900; `lucide-react-native` icons at 1.5px stroke; 4px radii and 48px primary buttons; tap targets at least 44px; **no emoji anywhere**; money always as `₦47,000`, following the same rule as `lib/money.ts`.
- **Offline and errors:** a failed read keeps the last known data and shows a quiet "Could not refresh" line with the time; a failed write reverts to the server's cart from the next read. No crash, no silent empty cart.

- **Acceptance:** every screen renders at 360px with no horizontal clipping; all tap targets are at least 44px; the app loads in Expo Go on a physical phone from a QR code; sign-in returns into the app; money, colours, type and icons follow DESIGN.md; and the hand-off to `/checkout` behaves exactly as described, including the possible second sign-in.

### F17 — Live cart sync between website and app
The graded "almost instantly" requirement (R2). One cart table, one set of endpoints, two refresh strategies.

- **Website to app: 2-second polling.** While the app is foregrounded and the shopper is signed in, the app calls `GET /api/v1/cart` every **2 seconds**, so a change made on the website is visible in the app in about 2 seconds.
- **App to website: the website's existing focus refresh.** The website reloads the saved cart on page load and on tab focus, which is FRD F5's current behaviour and is deliberately **not** changed into polling. A change made in the app is visible on the website at the next focus or refresh. The stated requirement is one-directional ("a cart item added on the website appears in the app"), so the website does not need to poll and the app carries the polling load.
- **Poll discipline**, so that 2 seconds means something:
  - Only one poll is in flight at a time; a slow response never queues a second request.
  - Polling **pauses while a write is in flight**, so a read cannot overwrite a change that has not been saved yet. This is the same guard the website already has via `pending`.
  - Polling **stops when the app is backgrounded** (`AppState !== "active"`) and **resumes immediately on return to the foreground**, plus one poll on every screen focus.
  - A poll failure backs off rather than hammering: 4s, then 8s, returning to 2s on the first success.
  - The cart screen shows an "Updated HH:MM:SS" line, so staleness is visible rather than silent.
- **Ordering on the website empties the cart everywhere.** `placeOrder` deletes the `cart_items` rows in the same transaction that writes the order (FRD F8 step 8), so the app's next poll, within about 2 seconds, shows an empty cart. **The app must treat that empty response as a real answer and clear its own copy, not as an error.**
- **Both sides keep their existing local cart rules.** The website's guest localStorage cart and its `syncedUserId` merge marker are untouched (F5). The app has no local cart, so there is nothing for it to re-merge.

- **Acceptance:** an item added on the website appears in the app's cart within about 2 seconds, measured on the phone; a quantity change and a removal propagate the same way; an order placed on the website empties the app's cart within about 2 seconds; a change made in the app shows on the website after a tab focus; polling stops when the app is backgrounded and resumes on return; and `GET /api/v1/cart` polled twice with no change returns an identical payload.
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

### `mobile_auth_codes` (Lesson 3, F15)

One row per in-flight app sign-in. It exists only for the 2 minutes between the browser hand-off and the code exchange, and rows are never read after `used_at` is set or `expires_at` passes.

| Column | Type | Notes |
|---|---|---|
| id | uuid pk default random | |
| code_hash | text unique not null | **SHA-256 of the one-time code, hex or base64url. Never the code itself.** |
| code_challenge | text not null | **PKCE S256 challenge** (base64url of SHA-256 of the verifier) |
| state | text not null | Echoed back to the app so it can bind the response to its own request |
| user_id | text fk → users.id on delete cascade | Indexed |
| redirect_uri | text not null | The already-allowlisted URI, stored so a code is only ever returned to the URI that asked for it |
| expires_at | timestamptz not null | Now + 2 minutes |
| used_at | timestamptz null | Set to now() in the same transaction that mints the session token |
| created_at | timestamptz default now() | |

- `code_hash` is unique so a code can be looked up by equality, the same way `sessions.sessionToken` is. The raw code and the `code_verifier` are never stored.
- `user_id` cascades, so deleting a user removes their outstanding codes.
- Expired and used rows can be swept with a plain `DELETE ... WHERE expires_at < now()`; nothing in the app depends on them afterwards.

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
| F5 Cart | `app/cart/page.tsx`, `store/cart.ts`, `components/cart/cart-sync.tsx` | **Lesson 3:** `lib/cart.ts` shared functions, reached by both `actions/cart.ts` (thin wrappers) and `/api/v1/cart/*`; the website client calls `/api/v1/cart` with the cookie session | cart_items, products | `DATABASE_URL` |
| F6 Auth | `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/signin/page.tsx` | Auth.js | users, accounts, sessions, verification_tokens | `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| F7 Checkout | `app/checkout/page.tsx`, `components/checkout/*`, `lib/validation.ts` | `auth()` guard | none (reads session) | none |
| F8 Place order | `actions/place-order.ts`, `lib/delivery.ts`, `lib/order-number.ts`, `lib/money.ts` | Server Action plus `db.batch` | orders, order_items, products | `DATABASE_URL` |
| F9 Email | `lib/mailgun.ts`, `emails/order-confirmation.ts` | Called from F8 | orders.email_sent_at | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_API_BASE`, `MAIL_FROM`, `NEXT_PUBLIC_SITE_URL` |
| F10 Orders | `app/orders/page.tsx`, `app/orders/[orderNumber]/page.tsx` | `getOrdersForUser`, `getOrderForUser` | orders, order_items | `DATABASE_URL` |
| F11 Contact | `app/contact/page.tsx` | none | none | `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| F12 Seed | `db/seed.ts` | script | products | `DATABASE_URL` |
| F13 Search | `components/layout/search-bar.tsx`, `app/shop/page.tsx` | `getProducts({q, category, gender})` | products | `DATABASE_URL` |
| **F14 API** | `app/api/v1/products/route.ts`, `app/api/v1/products/[slug]/route.ts`, `app/api/v1/cart/route.ts`, `app/api/v1/cart/items/route.ts`, `app/api/v1/orders/route.ts`, `app/api/v1/orders/[orderNumber]/route.ts`, `app/api/v1/me/route.ts`, `lib/api-auth.ts`, `lib/api-response.ts` | `lib/cart.ts`, `lib/queries.ts`, `lib/catalog.ts`, `lib/delivery.ts` | products, cart_items, orders, order_items, users | `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL` |
| **F15 Mobile auth** | `app/api/v1/auth/mobile/start/route.ts`, `app/api/v1/auth/mobile/callback/route.ts`, `app/api/v1/auth/mobile/exchange/route.ts`, `app/api/v1/auth/mobile/session/route.ts`, `lib/mobile-auth.ts`, `lib/api-auth.ts` | `getUserFromRequest`, PKCE verify, one-transaction code-burn plus session insert | mobile_auth_codes, sessions, users | `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL` |
| **F16 App** | `mobile/app/**`, `mobile/src/api/**`, `mobile/src/store/**`, `mobile/src/theme/**`, `mobile/src/utils/**`, `mobile/app.json` | none in the app; all logic is server-side | none (reads via API) | `EXPO_PUBLIC_API_URL` (in `mobile/.env`, gitignored) |
| **F17 Sync** | `mobile/src/store/cart.ts` (2s poll, `AppState`), `components/cart/cart-sync.tsx` (website focus refresh, unchanged) | `GET /api/v1/cart` | cart_items | `DATABASE_URL` |

**Note on the API routes:** `lib/api-response.ts` owns the error envelope and the `Cache-Control: no-store` header, and `lib/api-auth.ts` owns cookie-or-bearer resolution. No route file contains business logic; each one validates its input, calls a `src/lib/` function, and formats the result.

---

## 6. User flows

**Guest to order:**
Home → Product → choose size → Add to cart → Cart → Checkout → redirected to `/signin?callbackUrl=/checkout` → Google → back at Checkout (the cart is still there) → fill in details → Place order → `/orders/JC-…?placed=1` → email arrives.

**HNG persistence test:**
Sign in → place an order → My Orders shows it → Sign out → close the tab → reopen the site → Sign in → My Orders still shows it.

**Lesson 3, app sign-in (F15):**
App → Sign in → Continue with Google → the system browser opens the site's Google sign-in → Google asks to choose an account → back to the site → the site redirects to `jaynies://auth?code=…&state=…` → the app checks `state`, exchanges the code with its `code_verifier` → a bearer token is stored in the secure keystore → the shop opens.

**Lesson 3, app to website (F16):**
App → Cart → Checkout → the **system browser** opens the website's `/checkout` → the browser may ask for Google sign-in again, because the website uses a cookie session and the app's bearer token does not travel with it → **this is expected** → after signing in, the website's checkout shows the same cart the app had → place the order on the website → the app's cart empties within about 2 seconds.

**Lesson 3, live cart (F17):**
Website → add a hoodie in size M → within about 2 seconds the app's cart shows it → change the quantity to 2 on the website → the app's stepper follows → place the order on the website → the app's cart is empty within about 2 seconds → reopen the website tab → the cart is still empty.

**Lesson 3, phone test script (L3-5).** Run in this order on a physical Android phone, with the website open in a desktop browser as the same account:
1. Open Expo Go and load the app. The shop appears without signing in.
2. Sign in with the same Google account as the website. Confirm the app shows that account's name on the Account screen. (**R1**)
3. Add an item in the app. On the website, focus the tab. The same item is in the website cart. (**R2, app to website**)
4. Add a different item on the website. Within about 2 seconds, the app's cart shows it without any interaction. (**R2, the graded direction**)
5. Change that item's quantity on the website. The app's stepper follows within about 2 seconds. (**R2**)
6. Remove a line on the website. It disappears from the app within about 2 seconds. (**R2**)
7. Background the app for a minute, return to it, and confirm the cart reloads immediately rather than after a delay. (**R2, `AppState`**)
8. Tap Checkout in the app. The system browser opens the website. Sign in again if asked — **expected, not a defect** — and confirm the website's checkout shows the app's cart. Place the order and confirm the email arrives. (**R1c, F9**)
9. Within about 2 seconds the app's cart is empty. Open the app's My Orders: the new order is there with its status badge. (**R2, R1**)
10. Sign out of the app. The website is still signed in. Sign in to the app again with the same Google account and confirm the orders are still there. (**R1**)
11. Walk every screen at 360px width and confirm nothing clips horizontally and every button is at least 44px. (**R3**)
12. Re-verify the website end to end: sign in, add to cart, checkout, order, email, My Orders.

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

**Lesson 3 adds no new server environment variables.** The mobile sign-in reuses the existing `AUTH_SECRET`, `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, and the API reuses `DATABASE_URL` and `NEXT_PUBLIC_SITE_URL` (for absolute image URLs). The redirect-scheme allowlist is a code constant in `lib/mobile-auth.ts`, not a secret and not an env var, so it is reviewable in the diff.

**The app's own env (`mobile/.env`, gitignored, with `mobile/.env.example` committed):**
```
# The deployed site. This is a public URL, not a secret. Never localhost:
# a physical phone cannot reach this laptop's port 3000.
EXPO_PUBLIC_API_URL=https://<your-vercel-domain>
```

Only one variable. The app holds **no secrets at all**: no API key, no database URL, no OAuth client secret. Its bearer token lives in `expo-secure-store`, not in an env var, so it is never baked into the JS bundle.
