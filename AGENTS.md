# AGENTS.md — Jaynie's Collection

Persistent context for any coding agent (Claude Code, Codex, Cline, and others). **Read this file first, then PRD.md, FRD.md, and DESIGN.md before writing code.** If anything conflicts, the order of precedence is PRD.md for scope, FRD.md for behaviour and data, and DESIGN.md for the look.

## Project
An online shop for Jaynie's Collection, a handmade fashion brand. It is the HNG 15 Lesson 2 individual task, due Friday 2 Oct 2026 at 11:59 PM WAT. The graded parts are Google sign-in, orders saved in Neon, orders still visible after logging out and back in, and a Mailgun confirmation email.

## Stack (do not change without updating PRD.md)
- Next.js (App Router) and TypeScript in strict mode
- Tailwind CSS
- lucide-react
- Neon Postgres with Drizzle ORM (`@neondatabase/serverless`, `drizzle-orm/neon-http`) and drizzle-kit
- Auth.js v5 (`next-auth@beta`) with the Google provider, `@auth/drizzle-adapter`, and database sessions
- Zustand (persisted cart)
- Zod and react-hook-form
- Mailgun over the HTTP API using `fetch`
- Vercel
- npm

## Commands
```
npm run dev          # local dev on :3000
npm run build        # must pass before every push
npm run lint
npm run db:generate  # drizzle-kit generate
npm run db:migrate   # drizzle-kit migrate
npm run db:seed      # tsx src/db/seed.ts
```

## Folder structure
```
src/
  app/            # routes (see FRD §5)
  actions/        # Server Actions (place-order.ts)
  auth.ts         # Auth.js config
  components/     # layout/, home/, product/, cart/, checkout/, orders/, ui/, icons/
  db/             # schema.ts, index.ts, seed.ts
  emails/         # order-confirmation.ts (HTML + text builders)
  lib/            # money.ts, delivery.ts, order-number.ts, mailgun.ts, queries.ts, validation.ts
  store/          # cart.ts (Zustand)
public/brand/, public/products/
```

## Non-negotiable rules
1. **No emoji** anywhere: UI, emails, seed data, code comments, or commits. Use lucide icons.
2. **Money is integer kobo** throughout the code and database. Only `lib/money.ts` `formatNaira()` converts it for display.
3. **The server recalculates every price** in `placeOrder`. Never trust prices from the client or cart.
4. Every orders query is scoped to `session.user.id`.
5. Protected pages (`/checkout`, `/orders`, `/orders/[orderNumber]`) call `auth()` and redirect to `/signin?callbackUrl=…`. Don't use auth middleware.
6. **Secrets live only in `.env.local` and Vercel.** Never commit them. Keep `.env.example` up to date whenever a variable is added.
7. Never hard-code `localhost` URLs. Use `NEXT_PUBLIC_SITE_URL` for absolute links, such as those in emails.
8. A failed email must never fail an order. Log the error and leave `email_sent_at` null.
9. Use Server Components by default. Add `"use client"` only for interactive pieces (cart, stepper, forms, toasts).
10. Colours come only from the DESIGN.md tokens. The font is Poppins via `next/font`.
11. Don't add features from the PRD's out-of-scope list (payments, bespoke, admin, wishlist, reviews, stock, owner order-copy email).
12. Don't add new dependencies beyond the stack above without a one-line reason in the Decisions log.

## Git workflow
- Repo: `bhuchee/jaynies-collection`. Keep `main` deployable.
- One branch per phase (`phase-2-auth`, and so on). Merge to `main` when `npm run build` passes.
- Use conventional commits: `feat(checkout): add delivery zone selector`.

## Workflow for each session
1. Read the **Status** section below.
2. Work on the current phase only (PRD §7).
3. Before ending, update **Status**, **Decisions**, and **Known issues** below. Another model may pick up the work next.

---

## Status
- Current phase: 7 (production). ALL PHASES COMPLETE. Phases 0 to 6 are built, plus change request A (optional delivery fields), change request B (cart syncs to the account), and the phase 7 README and secrets audit.
- Production URL: **deployed and tested by Brian.** Every graded flow (Google sign-in, order saved in Neon, orders visible after logout and back in, Mailgun confirmation email) has been exercised on production.
- Docs: PRD.md, FRD.md, DESIGN.md, AGENTS.md, CLAUDE.md and README.md are all current. README.md is the grader-facing guide: stack, local setup, every environment variable and where its value comes from, Vercel deploy, Google OAuth, Mailgun, and a six-step testing guide. It mentions the unverified-app screen (Advanced, then Go to Jaynie's Collection) and that a first email may land in spam.
- Row counts on Neon: products 21, orders 2, order_items 2, users 4, cart_items 0, sessions 0. The 2 orders are the phase 6 cross-shopper test rows (`JC-260929-BBBB`, `JC-260930-AAAA`) and **should be deleted from the Neon SQL editor before submission.**
- Schema: 3 migrations applied and committed. `0001_useful_bishop.sql` (change request A, nullable delivery columns), `0002_closed_the_fury.sql` (change request B, `cart_items`).
- Secrets audit passed: `.env.example` is the only env file tracked, `.env.local` is gitignored, and no Neon connection string, Mailgun key, Google client secret or `AUTH_SECRET` appears in any commit reachable from `origin`.
- Next: none. If work resumes, start from the Known issues below: delete the two test orders, and optionally finish the image work.

## Decisions
- 2026-10-02: Neon instead of Supabase, which HNG explicitly allows.
- 2026-10-02: No payment step. Jaynie confirms payment on WhatsApp.
- 2026-10-02: The cart lives in localStorage. Orders live in the DB.
- 2026-10-02: Bespoke and custom measurements are removed for v1. Sizes are S/M/L only.
- 2026-10-02: Tailwind v4 (installed by create-next-app). DESIGN.md tokens are CSS variables in `globals.css` and are mapped to Tailwind through `@theme inline`, so there is no `tailwind.config.ts`.
- 2026-10-02: The build runs as 8 phases (0 to 7). PRD phase 8 (buffer, README, submission form) folds into phase 7.
- 2026-10-02: Product search is IN scope (F13) despite the PRD out-of-scope list. The word "Search" was removed from that list.
- 2026-10-02: `verification_tokens` keeps the FRD plural name, so `DrizzleAdapter` gets explicit table mappings.
- 2026-10-02: Brand and product images are code-only fallbacks until Brian drops the real files in `public/brand/` and `public/products/`. Components read the exact DESIGN.md paths and switch over automatically. No integration is mocked.
- 2026-10-02: `gender=men` returns men plus unisex, and `gender=women` returns women plus unisex.
- 2026-10-02: The `hoodie-sets` filter chip is labelled "Hoodies & Sets" in the UI. The slug stays `hoodie-sets`.
- 2026-10-02: The cart badge shows the total quantity of items, not the number of lines.
- 2026-10-02: Lists order by `created_at desc, name asc` for a stable grid.
- 2026-10-02: The Auth.js tables keep the canonical adapter column names (`userId`, `sessionToken`, `emailVerified`) with the FRD plural table names, so `DrizzleAdapter` gets explicit mappings. Our own tables use camelCase keys over snake_case columns.
- 2026-10-02: `orders.user_id` does not cascade on delete, so order history cannot be removed by deleting a user. `accounts`, `sessions` and `order_items.order_id` do cascade, as FRD section 3 and the Auth.js schema require.
- 2026-10-02: The seed staggers `products.created_at` from a fixed base date, so "the 8 newest" is deterministic and re-seeding is idempotent.
- 2026-10-02: `drizzle.config.ts` and `src/db/seed.ts` read `.env.local` with Node's built-in `process.loadEnvFile`, so no `dotenv` dependency was added.
- 2026-10-02: Product descriptions were written by the builder because FRD section 4 supplies none and the column is NOT NULL. Jaynie should review the wording.
- 2026-10-02: Auth.js runs with `trustHost: true` in `src/auth.ts` instead of the `AUTH_TRUST_HOST` env var, because the app sits behind the Vercel proxy and a missing trust flag is a production-only failure.
- 2026-10-02: The Google brand mark is an inline SVG in `components/icons/google.tsx` and keeps Google's own four brand colours. DESIGN.md section 1 rule 2 requires brand marks as inline SVGs, and a brand mark's colours are intrinsic to it, so this is the only hex outside `globals.css`.
- 2026-10-02: The `/signin` page only accepts a relative `callbackUrl` (it must start with a single `/`), so the page cannot be abused as an open redirect.
- 2026-10-02: The header shipped in phase 2 is deliberately minimal (brand mark plus account menu). Phase 3 replaces it with the full DESIGN.md section 6 header and the mobile bottom nav.
- 2026-10-02: `components/ui/brand-logo.tsx` is a client component so a missing brand file can fall back to a text wordmark through `onError`. An `fs.existsSync` check was rejected because `public/` is served from the CDN and is not guaranteed to exist in the serverless filesystem.
- 2026-10-02: `src/lib/catalog.ts` (category and gender labels plus the shop URL helpers) and `src/lib/site.ts` (public contact links) are new modules beyond the folder list. They exist so the chip labels in F2, F3 and the placeholder card all read from one place, and so no URL is built twice.
- 2026-10-02: The Zustand cart store and `lib/delivery.ts` were pulled into phase 3 because F1's cart badge, F4's add-to-cart and F11's fee summary all depend on them. The `/cart` page, `/checkout` and `placeOrder` remain phase 4.
- 2026-10-02: The account button stays in the mobile header even though DESIGN.md section 6 lists only Search and ShoppingBag there. The bottom nav has no account item, so hiding it would leave sign-out unreachable on a phone, which the graded logout test needs.
- 2026-10-02: Category chips and the quantity stepper are 44px tall. DESIGN.md section 5 says 40px, but section 1 rule 6 requires tap targets of at least 44px, and the hard rule wins.
- 2026-10-02: The cart badge count reads the store through `useSyncExternalStore`, so the server and the first client render agree and there is no hydration mismatch.
- 2026-10-02: The delivery band marquee is a CSS keyframe in `globals.css`, switched off under `prefers-reduced-motion` so the text simply stops.
- 2026-10-02: The best sellers are the three rows flagged in FRD section 4, and the "Save" pill is computed per product rather than hard-coded to the "Save ₦7,000" example in DESIGN.md section 5.
- 2026-10-02: The footer copyright line now uses `text-white/70` on Onyx, about 9.5:1, which clears AA. `--ink-muted` (section 5C5C5C on 0A0A0A) was roughly 2.5:1 and failed.
- 2026-10-02: react-hook-form uses a small `zodResolver` adapter in `lib/validation.ts`, because `@hookform/resolvers` is not on the locked stack. The same Zod schema runs in the browser and again in the Server Action.
- 2026-10-02: `useCartHydrated()` uses `useSyncExternalStore` with no-op subscriptions. The cart lives in localStorage, so the server cannot read it, and `/cart` and `/checkout` render a short loading line until hydration before showing the real cart or redirecting to `/cart`.
- 2026-10-02: `placeOrder` normalises instead of rejecting: the country is forced to Nigeria for the Nigerian zones and the state is forced to FCT for Abuja, because FRD F7 says those fields are "set" rather than "entered". A tampered country for a Nigerian zone is still rejected by the schema.
- 2026-10-02: Step 9 of FRD F8 (calling `sendOrderConfirmation`) is a marked seam in `actions/place-order.ts`. Phase 5 fills it in and stamps `email_sent_at`, which stays null until then.
- 2026-10-02: Brian's images were dragged into `public/` with mangled names (`publicbrandlogo.png`, `publicproductsshirt-mosaic .webp`, and so on). They were renamed to the exact DESIGN.md section 4 and 9 paths so the components pick them up with no code change.
- 2026-10-02: `sendEmail` never throws. It returns `{ ok, id }` or `{ ok: false, status, error }`, and the step 9 seam wraps the whole email block in try/catch, so a mail failure cannot fail an order (AGENTS.md rule 8).
- 2026-10-02: The seam re-reads the committed `orders` and `order_items` rows before building the email, so the email shows exactly what was saved rather than the values the client sent.
- 2026-10-02: `emails/order-confirmation.ts` repeats the DESIGN.md tokens as literal hex values in a `PALETTE` const, because email clients cannot read CSS custom properties from globals.css.
- 2026-10-02: `getSiteUrl()` reads `NEXT_PUBLIC_SITE_URL` and throws if it is unset, so email links can never fall back to a hard-coded localhost. The throw is caught by the seam.
- 2026-10-02: The email header logo uses `logo-dark-bg.png`, because `logo-email.png` does not exist. FRD F9 and DESIGN.md section 4 were updated to say so.
- 2026-10-02: `lib/dates.ts` holds `formatOrderDate`, shared by the order pages and the email template, so dates are formatted identically in both and never drift between server and client.
- 2026-10-02: `getOrderForUser` looks up the order number together with the user id in one `and(...)`, so another shopper's order number returns null and the page calls `notFound()`. There is no separate ownership check to forget.
- 2026-10-02: Change request A. Every checkout delivery field is optional: no minimum lengths, no phone format rule, and no field is derived from the zone. The only rule left on the text fields is a 300-character maximum, enforced by one `optionalText()` helper in `lib/validation.ts` that the form and `placeOrder` share. FRD F7, F8 and section 3 were updated to match.
- 2026-10-02: The six delivery columns on `orders` are NULLABLE, via migration `0001_useful_bishop.sql`. An empty field is stored as `null` rather than an empty string, so "not provided" stays distinguishable from "typed nothing". `customer_email` stays NOT NULL because it is the session snapshot.
- 2026-10-02: `placeOrder` no longer forces FCT for Abuja or Nigeria for the Nigerian zones. That normalisation was removed with change request A; the shopper's own words are stored as entered.
- 2026-10-02: The email greeting is `firstNameOf(recipientName, fallbackName)`, where `fallbackName` is the session's Google name. It falls back to "there" if both are empty. The Google name is never printed anywhere else in the email.
- 2026-10-02: The order page and the email both build the address from only the non-empty values (`addressLines()` in the email, an inline filter on the page). A fully empty address renders one honest sentence rather than blank lines or the word "null".
- 2026-10-02: Change request B. `cart_items` holds a saved cart per user, unique on (user_id, product_id, size), with a 1-10 check. `user_id` cascades on delete; `product_id` does not, because products are deactivated rather than deleted and a catalogue change should not silently wipe someone's saved cart.
- 2026-10-02: `src/actions/cart.ts` holds the five cart actions (`fetchSavedCart`, `mergeGuestCart`, `addSavedCartLine`, `setSavedCartQuantity`, `removeSavedCartLine`). Each scopes by `session.user.id`, validates the product and size against `products`, and returns the authoritative cart so the client can adopt the server's answer in one step.
- 2026-10-02: `components/cart/cart-sync.tsx` is the client brain: it runs the sign-in merge, mirrors every change to the server, and reloads on focus and on page load. `pushCartChange` is the one function the UI calls. It returns false for guests, so guest behaviour is unchanged.
- 2026-10-02: The sign-in merge rule is MAX, not SUM: same product and size takes the higher quantity, capped at 10. Lines on only one side are kept, and guest lines naming an unknown, inactive or wrong-sized product are dropped.
- 2026-10-02: `syncState` in the Zustand store (`unknown` -> `guest`/`syncing` -> `ready`) is what `/checkout` and `/cart` wait on via `useCartReady()`. That is what stops a returning shopper being redirected to `/cart` before their saved cart has loaded.
- 2026-10-02: Zustand `persist` uses `partialize` to store only `lines`. Persisting `userId` or `syncState` would let a stale signed-in flag leak back out of localStorage on the next visit.
- 2026-10-02: The root layout now calls `auth()` and passes `userId` to `<CartSync>`. This makes every page dynamic, which is the cost of knowing the shopper in the layout.
- 2026-10-02: A focus reload is skipped while `pending > 0`, so reloading from the server can never overwrite a change that has not been written yet.
- 2026-10-02: Phase 7. README.md replaces the create-next-app boilerplate and is written for a grader who has never seen the repo. It documents every environment variable with the console each value comes from, never the value itself.
- 2026-10-02: Phase 7 secrets audit. `git ls-files | grep env` returns only `.env.example`, and `git grep` across all 12 revisions reachable from `origin` finds no Neon connection string, `neon.tech`, Mailgun `key-<32 hex>`, Google `GOCSPX-` secret, or non-empty `AUTH_SECRET`, `AUTH_GOOGLE_SECRET` or `MAILGUN_API_KEY`. `.env.local` is covered by the `.env*` rule in `.gitignore`.
- 2026-10-02: The only `localhost:3000` strings in the repo are in `.env.example` (the template default), PRD.md and FRD.md (documentation of the local setup). There are none in `src/`, which is what AGENTS.md rule 7 requires.
- 2026-10-02: `refs/cline/checkpoints/*` are local-only refs created by the agent tooling. They are not on `origin` and hold no secrets, but they do keep some deleted blobs alive in the local object store. They can be deleted with `git update-ref -d` if a clean local history is ever wanted.
- 2026-10-02: In PowerShell, `cmd /c "npm run build > log 2>&1 & echo BUILD=%ERRORLEVEL%"` can report a false `0` because the `&` chain captures the wrong exit code. This hid a real TypeScript failure in phase 7 until the log file was read. Always read the log, never trust that echo.

## Known issues
- **Do this before submitting:** delete the two phase 6 test orders, `JC-260929-BBBB` and `JC-260930-AAAA`, from the Neon SQL editor. They belong to the test users `p6a@test.local` and `p6b@test.local`, so graders would otherwise see orders from "Ada Buyer" and "Ben Buyer". The four test users can go with them.
- The Google OAuth consent screen is not verified, so first-time sign-in shows Google's unverified-app screen. This is expected and the README explains the workaround. Verifying the app removes the warning but is not required.
- The Mailgun sending domain was still verifying at the time of writing. If the first confirmation email does not arrive, check that the domain is verified and that the recipient is authorised, rather than assuming the send code is broken. The order is saved either way.
- `public/brand/logo-email.png` is not used; the email header uses `logo-dark-bg.png`. The unused file can be ignored or deleted.
- `public/brand/logo-dark-bg.png` is really a JPEG that was renamed, because the drag-and-drop gave it a `.jpg` name. It renders, but it should be re-exported as a true PNG.
- Three stray files `public/products/image (9).png`, `image (14).png` and `image (16).png` are not identified and are not committed. Two of them match the byte size of already-imported photos, so they are probably duplicates.
- 10 products still have `image_url` null, so they show the DESIGN.md placeholder card. The prompts are in DESIGN.md §9.
- The 360px acceptance in FRD F1 (no horizontal scroll) was not checked in a real browser. Worth a glance at the chips, the sticky add-to-cart bar and the bottom nav.
- The 21 product descriptions are builder-written copy awaiting Jaynie's review.
- T-shirt and polo prices are placeholders for Jaynie to confirm. The WhatsApp number `2348000000000` is a placeholder.
- Change request A is verified by 26 automated checks on the shared Zod schema and the email builder, plus a live render of an order whose six delivery columns are all NULL. What is NOT verified in a real browser is the checkout form submitting with every field blank: click **Place order** with an empty form to confirm the redirect to `/orders/JC-...?placed=1`. The redirect target page is proven by the same live render.
- Change request A is verified by 26 automated checks on the shared Zod schema and the email builder, plus a live render of an order whose six delivery columns are all NULL. What is NOT yet verified in a real browser is the checkout form submitting with every field blank: click **Place order** with an empty form to confirm the redirect to `/orders/JC-...?placed=1`. The redirect target page is proven by the same live render.
- Change request B is verified by 15 checks on the merge rule (max, not sum, capped at 10, one-sided lines kept, invalid lines dropped) run against the real catalogue, and 11 checks on the `cart_items` table itself in Neon (unique constraint, quantity check, upsert capping, per-user scoping, cascade on user delete). The two behaviours NOT verified in a real browser are the sign-in merge moment and cross-device reload: to test, build a cart as a guest, sign in, then confirm the cart is still there and that opening the site in a second browser profile with the same Google account shows the same cart.
- The root layout calling `auth()` makes every route dynamic, so there are no longer any statically generated pages. That is expected and not a problem for a small shop.
- 10 products have `image_url` null (the FRD "no photo yet" rows), so they show the DESIGN.md placeholder card.
- WhatsApp number is a placeholder (2348000000000).
- T-shirt and polo prices are placeholders for Jaynie to confirm.
- 10 product images are still to be generated (DESIGN.md §9), and the 13 provided photos plus the brand logos and hero cut-outs are not in `public/` yet, so fallbacks are in use.
- `npm audit` reports 4 moderate advisories from drizzle-kit's bundled esbuild (dev-only, no runtime exposure).
- Node 22.12 prints an EBADENGINE warning for `eslint-visitor-keys`, which wants 22.13 or newer. Nothing fails.
- The remote was renamed from `bhuchee` to `Bhuchee`; `origin` on this machine points at the new URL. GitHub handles the redirect either way.
- The folder had no `.git` directory when phase 0 started, so the repo was initialised here and the docs were pushed as the root commit.
