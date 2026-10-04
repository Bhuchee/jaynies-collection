# Jaynie's Collection

An online shop for Jaynie's Collection, a handmade fashion brand. Jaynie sews every
piece herself, so the site is a catalogue and an ordering flow rather than a
stocked storefront: browse, add to cart, sign in with Google, place an order, get
a confirmation email, and see your order history at any time.

There is no online payment. Jaynie contacts each customer on WhatsApp to arrange a
transfer or payment on delivery.

Built as the HNG 15 Lesson 2 individual task.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript in strict mode |
| Styling | Tailwind CSS v4, design tokens as CSS variables in `globals.css` |
| Icons | lucide-react |
| Database | Neon Postgres, via `@neondatabase/serverless` |
| ORM | Drizzle ORM with `drizzle-orm/neon-http`, migrations via drizzle-kit |
| Auth | Auth.js v5 (`next-auth@beta`), Google provider, Drizzle adapter, database sessions |
| Cart | Zustand with `persist` in localStorage, mirrored to a `cart_items` table in Neon |
| API | JSON API under `/api/v1` in this same Next.js project, used by the website's cart client and by the Android app alike |
| Validation | Zod, with a small react-hook-form resolver adapter |
| Email | Mailgun HTTP API over `fetch`, no SDK |
| Hosting | Vercel |

The font is Poppins, loaded through `next/font`. There is no emoji anywhere in the
code, the UI or the emails; icons are lucide or inline SVG.

### One note on the guest cart (website only)

The website lets a visitor build a cart **before** signing in: the lines sit in
`localStorage` on that device, and on sign-in they are merged into the account's
saved cart in Neon. The merge is **website-only**.

The Android app has **no guest cart**. Its cart is server-authoritative from the
start, because an app session is established through the browser hand-off before
any cart is built, so there is never a local cart to merge up. Both surfaces
still share the same saved cart and the same `cart_items` rows; only the
website has a merge step.

## Running it locally

### The Android app (mobile/)

The app is a **separate npm project**. It has its own `package.json`,
`node_modules` and `tsconfig.json`, and the website never imports from it.

**Requirements:** Node 20.19+ or 22.13+ (Expo SDK 57 asks for this; Node 22.12
works with warnings), the **Expo Go** app from the Play Store on your phone, and
your phone on the same Wi-Fi as this computer.

```bash
cd mobile
npm install
cp .env.example .env          # then put your Vercel URL in EXPO_PUBLIC_API_URL
npm start                     # shows a QR code: scan it with Expo Go on the phone
```

**What to scan:** the QR code in the terminal, using the Expo Go app's built-in
scanner (open Expo Go, tap **Scan QR code**, point the phone at the screen).
It will then connect over your Wi-Fi and load the app.

- **Phone cannot reach the computer?** Try `npm run tunnel`. That routes the
  bundle over the internet instead of the local network.
- **App will not load at all?** Expo Go only supports one SDK major. This app
  pins **Expo SDK 57** (`expo@~57.0.26`, React Native 0.86.3). If the app fails
  to load, update Expo Go on the phone.
- **Type-check the app:** `npx tsc --noEmit` inside `mobile/`.

`mobile/.env` is gitignored and holds **only** `EXPO_PUBLIC_API_URL`, which is a
public URL, not a secret. The app holds no API key, no database URL and no OAuth
secret; its bearer token is kept in the Android keystore via
`expo-secure-store`, never in an env var.

### The website

Requires Node 22.13 or newer and npm.

```bash
npm install
cp .env.example .env.local     # then fill in the values, see below
npm run db:migrate             # create the tables
npm run db:seed                # load the 21-piece catalogue (safe to re-run)
npm run dev                    # http://localhost:3000
```

Other commands:

```bash
npm run lint          # eslint
npm run build         # next build, must pass before every push
npm run db:generate   # write a migration from a schema change
```

`drizzle.config.ts` and `src/db/seed.ts` read `.env.local` themselves using Node's
built-in `process.loadEnvFile`, so the database commands work without extra setup.

## Environment variables

Every value goes in `.env.local`, which is gitignored, and in the Vercel project
settings. No real value appears anywhere in this repository. `.env.example` is the
template.

| Variable | Required | Where the value comes from |
|---|---|---|
| `DATABASE_URL` | yes | Neon dashboard, **Connection string** → **Pooled connection**. It contains your database password, so never commit it. |
| `AUTH_SECRET` | yes | Your own random value. Generate one with `openssl rand -base64 33`. Changing it later signs everyone out. |
| `AUTH_GOOGLE_ID` | yes | Google Cloud Console → the OAuth client's **Client ID**. |
| `AUTH_GOOGLE_SECRET` | yes | Google Cloud Console → the OAuth client's **Client secret**. |
| `MAILGUN_API_KEY` | yes | Mailgun → **Sending** → API keys → **Create key**. |
| `MAILGUN_DOMAIN` | yes | Mailgun → **Sending** → **Domains**, your sending domain. |
| `MAILGUN_API_BASE` | no | `https://api.mailgun.net` for US accounts, `https://api.eu.mailgun.net` for EU accounts. Already set in `.env.example`. |
| `MAIL_FROM` | yes | The sender shown on the confirmation email, as `Jaynie's Collection <orders@YOUR_MAILGUN_DOMAIN>`. |
| `NEXT_PUBLIC_SITE_URL` | yes | Your deployed site URL on Vercel, with no trailing slash. The localhost default is fine locally, but **set it to the real domain on Vercel or every link in the confirmation email will point at localhost.** |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | yes | Jaynie's WhatsApp number in international format, digits only, for example `2348000000000`. |
| `NEXT_PUBLIC_INSTAGRAM_HANDLE` | yes | The Instagram handle, without the `@`. |
| `AUTH_TRUST_HOST` | no | Not needed. `src/auth.ts` sets `trustHost: true` because the app runs behind the Vercel proxy. |
## Deploying on Vercel

1. Go to `vercel.com/new` and import `Bhuchee/jaynies-collection`. The framework
   preset should detect Next.js; leave the build and output settings alone.
2. Deploy. Note the domain it gives you, for example
   `https://jaynies-collection.vercel.app`.
3. **Add the production URL to Google** (below) before testing sign-in.
4. In Vercel, open **Settings → Environment Variables** and add every value from
   the table above for the **Production** environment.
5. Redeploy the latest deployment. `NEXT_PUBLIC_*` values are baked in at build
   time, so changing them does nothing until the project is rebuilt.
6. Confirm **Settings → Deployment Protection** is off. If Vercel's own login is
   enabled, a grader sees a password wall instead of the shop.

## Google OAuth

1. In Google Cloud Console, create a project and enable the OAuth consent
   configuration as required.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**, of
   type **Web application**.
3. Add your origins and redirects:

   | | Local | Production |
   |---|---|---|
   | Authorized JavaScript origins | `http://localhost:3000` | `https://YOUR-DOMAIN` |
   | Authorized redirect URIs | `http://localhost:3000/api/auth/callback/google` | `https://YOUR-DOMAIN/api/auth/callback/google` |

   The redirect URI must match exactly, with no trailing slash.
4. Copy the client ID and client secret into `AUTH_GOOGLE_ID` and
   `AUTH_GOOGLE_SECRET`.
5. **Publish the OAuth consent screen** to **In production**. While it is in
   Testing mode only listed test users can sign in, which would block anyone
   grading the site. This is the most common reason sign-in fails on a deployed
   build.

Sessions are stored in the database, not in a cookie, so signing out really does
revoke the session.

## Mailgun

1. In Mailgun, add and verify a sending domain, and point its DNS records at
   Mailgun. Verification can take a few minutes to a few hours.
2. Create an API key and set `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` and `MAIL_FROM`.
3. Set `MAILGUN_API_BASE` to `https://api.eu.mailgun.net` if your Mailgun account
   is in the EU region.

While the domain is still verifying, or if you use a Mailgun **sandbox** domain,
Mailgun only delivers to addresses you have listed as authorised recipients. Add
the addresses you want to test with, otherwise the mail is silently dropped.

## Testing guide for graders

Use the production URL. A private or incognito window is best.

**1. Sign in**

- Open `/signin` and choose **Continue with Google**.
- **Google may show an "unverified app" warning**, because a new OAuth consent
  screen is not verified. Click **Advanced**, then **Go to Jaynie's Collection** to
  continue. This is expected for any app in its first days.
- You should land back on the site with your name and picture in the header.

**2. Shop and cart**

- Browse the home page, filter the shop by category or gender, or search for
  "hoodie" or "ankara".
- Open a product, pick a size (S/M/L) and add it to the cart. The gold badge in
  the header shows the total quantity.
- You can build a cart while signed out. Signing in merges that cart into your
  saved cart rather than clearing it, and your cart then follows you between
  devices.

**3. Place an order**

- Go to the cart and press **Proceed to checkout**. If you are signed out you are
  sent to sign in first, then returned to checkout.
- Choose a delivery zone. Abuja is preselected; Rest of Nigeria is ₦10,000;
  International is quoted later by Jaynie.
- Every delivery field is optional, including the name, phone and address.
- Press **Place order**. You land on the order page with a green "Order placed"
  banner and your order number, shown as `JC-YYMMDD-XXXX`.

**4. Check the confirmation email**

- A confirmation email is on its way to the address you signed in with.
- **The first email may land in spam or Promotions**, especially if your mail
  provider has not seen this domain before. Check there before assuming it failed.
- The email shows the items, the subtotal, the delivery fee, the total, and a
  **View your order** button linking back to the order page.

**5. Order history (the persistence test)**

- Go to **My Orders**. Your order is listed with its status.
- Sign out using the account menu. Sign in again, and the order is still there.
  Orders live in the database, not in the browser.
- Open the order page and check the items and totals match what you ordered.

**6. Optional: another shopper cannot see your order**

- Sign out, sign in with a **different** Google account, and go to **My Orders**.
  That account sees none of your orders.
- Paste your order number into `/orders/YOUR-ORDER-NUMBER`. You get a 404 page,
  the same as an order number that does not exist.

## Project layout

```
src/
  app/          routes and the root layout
  actions/      Server Actions: place-order.ts, cart.ts
  auth.ts       Auth.js configuration
  components/   layout, home, product, cart, checkout, orders, ui, icons
  db/           schema.ts, index.ts, seed.ts
  emails/       order-confirmation.ts, HTML and plain text
  lib/          money, delivery, dates, order-number, mailgun, queries, validation
  store/        cart.ts, the Zustand store
drizzle/        generated SQL migrations
public/         brand and product images
```

The design specification is in `DESIGN.md`, the scope in `PRD.md`, and the
feature-by-feature behaviour in `FRD.md`.
