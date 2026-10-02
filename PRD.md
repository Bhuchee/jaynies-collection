# PRD — Jaynie's Collection Online Shop

**Owner:** Brian (builder) for Jaynie (shop owner)
**Context:** HNG 15, Lesson 2, individual task
**Deadline:** Friday 2 Oct 2026, 11:59 PM WAT
**Status:** Agreed scope v1. Changes must be recorded in the Change Log at the bottom.

---

## 1. Product summary

Jaynie's Collection is a fashion brand. Jaynie sews every piece herself. She sells:

- **Ready-to-wear** for men and women: hoodies, joggers, shorts, cargo pants, shirts, T-shirts, and polos
- **Hoodie and jogger sets** in several colourways
- **Ankara and native wear** for women only

Today, customers order through Instagram (@jayniescollection) and WhatsApp. This website gives her a proper storefront. A customer can browse, add items to a cart, sign in with Google, place an order, get a confirmation email, and see their order history at any time.

## 2. Goals

1. Pass every HNG Lesson 2 test:
   - Google sign-in works.
   - Orders are visible.
   - Logout works.
   - After closing and reopening the page and signing in again, previous orders are still there.
   - Checkout sends a real, well-formatted confirmation email.
2. Look and feel like a real premium fashion brand on both mobile and desktop.
3. Be something Jaynie could actually use after HNG.

## 3. Users

| User | Needs |
|---|---|
| Shopper (men and women, Nigeria and abroad) | Browse styles, choose size S/M/L, see the delivery cost up front, order quickly, get proof of the order |
| Returning shopper | Sign in and see past orders and their status |
| Jaynie (owner) | Receive orders with full delivery details (from the database for v1) |
| HNG grader | Run the test flow end to end on the production URL |

## 4. Scope

### In scope (v1)

- Home page based on Brian's hero design, plus best sellers, a category strip, and a product grid
- Shop page with category and gender (Men/Women) filters
- Product search by name and description, from the header
- Product page with an image, S/M/L size selector, quantity stepper, and add to cart
- Cart, stored in the browser so guests can build a cart before signing in
- Google sign-in only, through Auth.js and a Google Cloud OAuth client
- Checkout, which requires sign-in: delivery details, delivery zone and fee, order summary, and place order
- Orders saved in Neon Postgres
- An "My Orders" list and an order detail page
- A Mailgun confirmation email after an order is placed
- Delivery fees:
  - Abuja: ₦5,000
  - Rest of Nigeria: ₦10,000
  - International: the fee is confirmed later by Jaynie, so the order is saved as *awaiting shipping quote*
- No online payment. Jaynie contacts the customer on WhatsApp to arrange a transfer or payment on delivery.
- Contact page with WhatsApp (placeholder number) and Instagram
- Mobile-first responsive layout
- Deployed on Vercel with production environment variables

### Out of scope (v1)

- Bespoke tailoring and custom measurements. This is removed for now. The site uses S/M/L only.
- Online payments (Paystack, Flutterwave, or Stripe)
- An admin dashboard. Products are seeded by script.
- Stock tracking. Every item is made to order.
- Wishlists, reviews, newsletter, and coupon codes
- The "Download app" section from the design reference
- Automatic international shipping rates

## 5. Tech stack (locked)

| Layer | Choice |
|---|---|
| Language | TypeScript, used for frontend and backend |
| Framework | Next.js (latest stable, App Router), using Server Components and Server Actions for the backend |
| Styling | Tailwind CSS |
| Icons | lucide-react. Brand icons such as Instagram and WhatsApp use inline SVG. No emoji anywhere. |
| Database | Neon Postgres |
| ORM | Drizzle ORM with `@neondatabase/serverless` and drizzle-kit for migrations |
| Auth | Auth.js (`next-auth` v5) with the Google provider, the Drizzle adapter, and database sessions |
| Cart state | Zustand with `persist`, saved in localStorage |
| Validation | Zod |
| Email | Mailgun HTTP API, called with `fetch` (no SDK) |
| Hosting | Vercel |
| Package manager | npm |

## 6. Success criteria (definition of done)

- [ ] The production URL loads on mobile and desktop.
- [ ] Google sign-in works on production, not just on localhost.
- [ ] Guest flow: add to cart, go to checkout, get asked to sign in, and find the cart still there afterwards.
- [ ] Placing an order saves `orders` and `order_items` rows in Neon.
- [ ] A confirmation email arrives in the customer's inbox, branded and readable on mobile.
- [ ] The order shows up in My Orders.
- [ ] Logging out, closing the tab, reopening, and signing in again shows the same orders.
- [ ] No secrets in the GitHub repo. `.env.example` is committed and `.env.local` is gitignored.
- [ ] README explains setup. AGENTS.md has an up-to-date status log.
- [ ] Submission form sent.

## 7. Build phases and time boxes (Friday)

| # | Phase | Target finish |
|---|---|---|
| 0 | Scaffold Next.js, Tailwind, and lint; commit the docs; create the GitHub repo | 17:15 |
| 1 | Drizzle schema, Neon connection, migrations, product seed | 17:45 |
| 2 | Auth.js with Google, sign in and out, **first Vercel deploy** with Google OAuth tested on production | 18:30 |
| 3 | Shop UI: layout, home, shop, product page, responsive | 20:00 |
| 4 | Cart and checkout, plus the place-order Server Action that saves the order | 21:00 |
| 5 | Mailgun confirmation email | 21:45 |
| 6 | My Orders list and detail, plus the persistence test | 22:15 |
| 7 | Production environment variables, full end-to-end test on production, fixes, README, submission form | 23:15 |
| 8 | Buffer | 23:59 |

**Rule:** deploy early (phase 2) so production-only problems with OAuth redirects, environment variables, and Mailgun show up before 23:00.

**Update (2 Oct 2026):** the build is run as 8 phases (0 to 7). PRD phase 8 (buffer, README, submission form) is folded into phase 7 (see the Decisions log in AGENTS.md and PRD section 10).

## 8. Human-only setup (Brian, can run in parallel)

1. **Neon:** create the project and copy the pooled `DATABASE_URL`.
2. **Google Cloud Console:**
   - Create an OAuth client of type Web.
   - Authorized JavaScript origins: `http://localhost:3000` and `https://<vercel-domain>`.
   - Redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://<vercel-domain>/api/auth/callback/google`.
   - **Publish the OAuth consent screen ("In production").** In Testing mode, only listed test users can sign in, which means graders would be blocked.
3. **Mailgun:**
   - Create an API key and choose a sending domain.
   - **Sandbox domains only deliver to authorized recipients.** Either verify a real domain or add the grader and test emails as authorized recipients.
   - Note your region. EU accounts use `https://api.eu.mailgun.net`.
4. **Vercel:** import the repo and add every environment variable from `.env.example` to the Production environment.
5. **Images:** generate the missing product images. Prompts are in DESIGN.md §9.

## 9. Risks

| Risk | Mitigation |
|---|---|
| The Mailgun sandbox blocks grader emails | Verify a domain, or authorize recipients ahead of time. If sending fails, the order is still saved and `email_sent_at` stays null. |
| Google OAuth works locally but fails on production | Add the production redirect URI and publish the consent screen in phase 2 |
| Images not ready | A branded placeholder card is used automatically when an image is missing |
| Not enough time | Phases 3 and 6 can be simplified. The integrations (2, 4, 5) come first. |

## 10. Change log

- v1 (2 Oct 2026): Initial agreed scope. Bespoke removed. No payment step. Brand and UI follow Brian's hero design.
- v1.1 (2 Oct 2026): The build runs as 8 phases (0 to 7). PRD phase 8 (buffer, README, submission form) is folded into phase 7. Product search is IN scope (F13), so "Search" was removed from the out-of-scope list. Removed the leftover SHOP_NOTIFY_EMAIL references; the owner order-copy email was cut.
