# AGENTS.md — Jaynie's Collection

Persistent context for any coding agent (Claude Code, Codex, Cline, and others). **Read this file first, then PRD.md, FRD.md, and DESIGN.md before writing code.** If anything conflicts, the order of precedence is PRD.md for scope, FRD.md for behaviour and data, and DESIGN.md for the look.

## Project
An online shop for Jaynie's Collection, a handmade fashion brand. It was the HNG 15 Lesson 2 individual task (due Friday 2 Oct 2026, graded parts: Google sign-in, orders saved in Neon, orders still visible after logging out and back in, and a Mailgun confirmation email), and **Lesson 3** adds an Android app, due **Monday 5 Oct 2026, 11:59 PM WAT**.

The Lesson 3 graded parts are **R1** the same Google account logs in on the website and in the app, **R2** a cart item added on the website appears in the app's cart almost instantly (2 seconds), and **R3** it works on a physical Android phone. See PRD §2A.

Lesson 2 is complete and deployed. **Lesson 3 is the only work in scope.**

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

### Lesson 3 additions (mobile only, `mobile/package.json`)
- Expo (React Native) and expo-router
- expo-web-browser for the Google sign-in hand-off (system browser, never a WebView)
- expo-secure-store for the bearer token
- expo-linking plus React Native `AppState` for deep links and foreground/resume
- lucide-react-native for icons
- @expo-google-fonts/poppins for the type

**These are installed only in `mobile/`. The website's `package.json` must not gain any of them, and nothing in `src/` may import from `mobile/`.**

## Commands
```
npm run dev          # local dev on :3000
npm run build        # must pass before every push. READ THE LOG, not the exit code.
npm run lint
npm run db:generate  # drizzle-kit generate
npm run db:migrate   # drizzle-kit migrate
npm run db:seed      # tsx src/db/seed.ts

cd mobile
npm install          # separate node_modules from the website
npm run dev          # Expo dev server; scan the QR code with the physical phone
npm run android      # same, targeting Android directly
npx expo start --tunnel   # fallback when the phone cannot reach this laptop
npx tsc --noEmit    # type-check the app
```

## Folder structure
```
src/
  app/            # routes (see FRD §5), including api/v1/** (FRD F14, F15)
  actions/        # Server Actions (place-order.ts, cart.ts as thin wrappers)
  auth.ts         # Auth.js config
  components/     # layout/, home/, product/, cart/, checkout/, orders/, ui/, icons/
  db/             # schema.ts, index.ts, seed.ts
  emails/         # order-confirmation.ts (HTML + text builders)
  lib/            # money.ts, delivery.ts, order-number.ts, mailgun.ts, queries.ts,
                  # validation.ts, cart.ts (F14), api-auth.ts, api-response.ts,
                  # mobile-auth.ts (F15)
  store/          # cart.ts (Zustand)
mobile/           # Expo app, a SEPARATE npm project (FRD F16)
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

### Lesson 3 rules (mobile, API and shared code)

13. **The website and the app use the same HTTP endpoints.** The website's cart client calls `/api/v1/cart` with its cookie session, exactly as the app does with its bearer token. Business logic lives in `src/lib/` functions called by the API routes; no route file holds logic, and the Server Actions remain as thin wrappers so there is always a second working path.
14. **Money stays integer kobo across the API and the app.** Only `lib/money.ts` on the website and its one equivalent in the app may format it. No endpoint returns a formatted price, and no endpoint accepts one.
15. **The server recalculates every price**, on the website and in every API route, from `products.price_kobo`. Prices from the client, the app or localStorage are display-only.
16. **Every user-scoped API query is scoped to the `userId` from `getUserFromRequest`.** No endpoint may take a `userId` from the request. Another shopper's order number returns `404`, not `403`.
17. **`getUserFromRequest` accepts a bearer token or the Auth.js cookie session, in that order.** Every authenticated route uses it. A token is never logged, never placed in a query string, and never returned to another user.
18. **PKCE is required on the mobile sign-in.** Store a SHA-256 hash of the one-time code plus the S256 `code_challenge`; verify the verifier with a constant-time comparison; compare `state` in the app; allowlist the redirect scheme. The raw code and the verifier are never stored or logged.
19. **The app holds no secrets.** No API key, database URL or OAuth secret goes into `mobile/`. The bearer token goes in `expo-secure-store`, never AsyncStorage and never an env var. `mobile/.env` is gitignored; only `EXPO_PUBLIC_API_URL` is committed, in `mobile/.env.example`.
20. **The production website must keep working after every merge.** Re-test sign in, cart, checkout, orders and the email before each merge. `npm run build` must pass and **its log must be read**, because the exit code can lie.
21. **`mobile/` is a separate npm project.** Its own `package.json`, `tsconfig.json` and `node_modules`. Nothing in `src/` imports from `mobile/`, and `mobile/` must be excluded from the root `tsconfig.json` and `eslint.config.mjs` or the website build breaks.

## Git workflow
- Repo: `bhuchee/jaynies-collection`. Keep `main` deployable.
- One branch per phase. Lesson 2 used `phase-N-*`; Lesson 3 uses `L3-0-docs`, `L3-1-api`, `L3-2-app-auth`, `L3-3-app-shop`, `L3-4-app-orders`, `L3-5-phone-test`.
- Merge with **`git merge --ff-only`**. **Never force-push**, and never rebase a branch that has been pushed.
- Use conventional commits: `feat(checkout): add delivery zone selector`, `feat(api): add cart endpoints`.

## Lesson 3 phases (see PRD §7A for time boxes)
| Phase | Branch | Scope |
|---|---|---|
| L3-0 | `L3-0-docs` | PRD v2.0, FRD F14 to F17, AGENTS.md rules and phases. Docs only, no code. |
| L3-1 | `L3-1-api` | `/api/v1` products, cart, orders, me; `getUserFromRequest`; shared `src/lib/cart.ts`; **switch the website's cart client to the HTTP endpoints**; the `mobile_auth_codes` migration. |
| L3-2 | `L3-2-app-auth` | Expo project in `mobile/`, expo-router, theme, secure store, browser hand-off, PKCE exchange. |
| L3-3 | `L3-3-app-shop` | Shop, product, cart and the 2-second live sync. |
| L3-4 | `L3-4-app-orders` | Orders list and detail, account, sign out, checkout hand-off, polish. |
| L3-5 | `L3-5-phone-test` | The real-phone script in FRD §6, README for the app, optional EAS APK. |

**Work on the current phase only, and stop at the end of it with a report. Do not start the next phase without Brian's go-ahead.**

## Workflow for each session
1. Read the **Status** section below.
2. Work on the current phase only (PRD §7).
3. Before ending, update **Status**, **Decisions**, and **Known issues** below. Another model may pick up the work next.

---

## Status
- Current phase: **L3-3 (shop, product, cart and live sync), in progress.** Lesson 3 is under way; Lesson 2 is complete, deployed and tested on production.
- Lesson 3 deadline: **Monday 5 Oct 2026, 11:59 PM WAT.** Schedule: L3-0 was Sunday 4 Oct; L3-1 and L3-2 are Sunday 4 Oct; L3-3 to L3-5 are Monday 5 Oct, with Monday 23:00 to 23:59 kept as buffer. Full time boxes in PRD §7A.
- **L3-0 (this phase):** PRD bumped to v2.0 with the Lesson 3 sections (2A, 4A, 5A, 6A, 7A, 8A, 9A). FRD gained F14 (API), F15 (mobile sign-in with PKCE), F16 (the app) and F17 (live sync), the `mobile_auth_codes` table, the feature-to-implementation rows, the Lesson 3 user flows and a 12-step phone test script. AGENTS.md gained the mobile stack, the mobile commands, rules 13 to 21, the L3 branch names and the phase table. **No code has been written yet.**
- Brian's review of v2.0 (5 Oct 2026) asked for four changes, all now applied: (1) the website's cart client calls the same `/api/v1/cart` HTTP endpoints as the app, not merely the same underlying functions; (2) PKCE on the mobile sign-in; (3) the app's hand-off to `/checkout` opens the system browser and may ask for Google sign-in again because the website uses cookies, documented as expected behaviour in the FRD and the phone script; (4) the schedule pulled forward, with L3-0 now and Monday evening as buffer.
- **L3-3 (this phase):** the app has a shop screen (category, gender and search, all server-filtered), a product screen (S/M/L required, quantity 1 to 10, add through `POST /api/v1/cart/items`), a cart screen (quantity and remove through the API, server-calculated subtotal, last-updated time) and a **2-second poll** of `GET /api/v1/cart`. The app is now a `(tabs)` group so the cart badge is live on every tab.
- **R2 was proven end to end against the running site, not just asserted.** A write made with an Auth.js **cookie** was read back by the app's **bearer** poll: `APP sees the WEBSITE item: true`. Setting the quantity to 4 on the website appeared as 4 on the next poll, an app write was immediately visible to the website's cookie read with **byte-identical payloads**, two idle polls returned identical payloads (which is what the 2-second sync depends on), and a dead token returned 401 so the app signs out rather than polling forever.
- **The polling hook carries five guards, each of which exists for a stated reason:** foreground only (Android throttles background work anyway), one request in flight (a slow network cannot queue a backlog), paused during a write (a read must not clobber an unsaved change), 2s then 4s then 8s backoff, and one immediate poll on resume. It uses a self-rescheduling `setTimeout` rather than `setInterval` precisely so the backoff can change the delay.
- **Two design decisions worth keeping.** The tab badge is total quantity, not line count, matching the website. And **useLiveCart is mounted once in the tab layout**, not inside the cart screen: the badge has to be live while the shopper is looking at the shop, or "appears in the app's cart" would only work on one screen.
- **Checkout in the app is a hand-off and says so on the screen.** The cart screen carries a note explaining that checkout opens the website in the browser and that a second Google sign-in there is expected, because the app and the website keep separate sessions. Writing it in the UI means the shopper is not left thinking something is broken.
- L3-3 verification actually performed: the website's `npm run build` passes with the log read in full (all 11 `/api/v1` routes and every page), `npm run lint` clean, `npx tsc --noEmit` inside `mobile/` clean, and the app bundles for Android via `npx expo export --platform android` (5.1MB Hermes bundle). A scan of all 22 app source files found **zero emoji**, and no `localhost` string appears in the app.
- **Structure change in L3-3:** `account.tsx` moved from `app/` into `app/(tabs)/`, and `app/index.tsx` now routes into the tab group rather than straight to sign-in. Reason: browsing never needs an account, so a signed-out shopper should still see the shop, and the cart tab prompts for sign-in by itself.
- **AGENTS rule 21 proven, not assumed.** `mobile/` was added to the root `tsconfig.json` `exclude` and to the eslint `globalIgnores`, then a file with a deliberate type error was placed inside `mobile/` and the website build was run: it still reported "Compiled successfully" with a clean TypeScript pass. The probe was then deleted. Without the exclusion that file would have failed the website build.
- L3-2 verification actually performed: the website's `npm run build` passes with the log read in full (11 `/api/v1` routes, all pages), `npm run lint` clean, and `npx tsc --noEmit` inside `mobile/` clean. The app **bundles for Android**: `npx expo export --platform android` produced a 5.1MB Hermes bytecode bundle from 3282 modules. `npx expo install --check` reports "Dependencies are up to date".
- **The app's PKCE maths was proven to match the server's**, because a silent mismatch would break every sign-in with no obvious cause. The app converts expo-crypto's padded BASE64 to base64url by hand (React Native has no Buffer and expo-crypto offers only BASE64/HEX), and that conversion was checked against the server's `node:crypto` base64url digest: all SHA-256 sample paths matched, the byte encoder matched node's base64url for every length from 1 to 33 bytes, 200 random 32-byte verifiers all came out 43 characters (the server's minimum), and a challenge recomputed server-side matched.
- L3-2 findings fixed during verification, all caught before the phone: `node:crypto` does not exist in React Native, so randomness and SHA-256 come from **expo-crypto** instead; `expo-web-browser` in SDK 57 **removed both `preferLocalSession` and `timeoutInMs`**, so the 5-minute timeout is now a `Promise.race` in `use-sign-in.ts`; and `zustand` was missing from the app, which the Android bundle build caught (`Unable to resolve module zustand`). The Expo SDK package majors are all 57.x, not the 15.x/8.x/14.x the older docs suggest.
- **Node version caveat, unresolved:** Expo SDK 57 requires Node 22.13.x and this machine runs **22.12.0**, so `npm install` in `mobile/` prints `EBADENGINE` warnings for react-native and metro. Install and bundling both succeed, but if the dev server misbehaves on the phone, upgrading Node to 22.13+ is the first thing to try.
- L3-1 verification actually performed: `npm run build` passed with the log read in full (all 11 `/api/v1` routes registered), `npm run lint` clean, `npx tsc --noEmit` clean. Proven by direct HTTP call: the products list and by-slug endpoints, filter and search parity with the website, a 404 for an unknown slug, 401 for every authenticated route with no credentials or a bad token, and 400 for a disallowed redirect_uri and a non-S256 challenge. Proven with a **real bearer token** issued through the actual exchange path: `/me`, cart GET/POST/PATCH/DELETE, the quantity cap at 10, rejection of an unknown size and of quantity 99, the orders list and detail, and 404 (never 403) for another shopper's order number. **All five PKCE rejection paths were proven individually**, not just the happy path: wrong verifier, code burnt by the failed attempt, expired code, unknown code, and replay after a successful exchange. Sign-out deleted exactly one session row (3 to 2) and the token then returned 401. The cookie proof: a real Auth.js cookie session and a bearer token hit `/api/v1/cart` and returned **byte-identical payloads**, and a line written with the cookie was immediately readable with the bearer token.
- L3-1 finding fixed during verification: `DELETE /api/v1/cart/items` rejected a request with only `productId` and `size`, because `cartLineSchema` requires a `quantity`. Removal does not consume a quantity, so the route now defaults it to `MIN_LINE_QUANTITY`. Caught by the harness, not by the happy path.
- L3-1 note on the merge: the guest merge (`mergeGuestCart`) deliberately stays a Server Action and is **not** exposed as an HTTP endpoint. The app has no local cart to merge, and keeping it on the action preserves the one-time-merge path that took real work to get right (the `syncedUserId` marker). The shared `lib/cart.ts` function underneath is the same one the API's cart routes call, so the logic is still shared.
- Lesson 2 state, unchanged: phases 0 to 7 built, plus change request A (optional delivery fields) and change request B (cart syncs to the account). Every graded Lesson 2 flow has been exercised on production. Docs: PRD.md, FRD.md, DESIGN.md, AGENTS.md, CLAUDE.md, README.md.
- Lesson 2 schema: 3 migrations applied and committed, `0001_useful_bishop.sql` and `0002_closed_the_fury.sql`. Lesson 3 adds one migration for `mobile_auth_codes` in L3-1.
- **Row counts on Neon (checked 4 Oct 2026, during L3-1):** products 21, orders 7, order_items 9, users 4, cart_items 0, sessions 5, mobile_auth_codes 0. The orders grew from the 2 phase-6 test rows to 7 because Brian has been placing real test orders, so the "delete the two test orders" note below now refers to `JC-260929-BBBB` and `JC-260930-AAAA` specifically rather than "the only orders".
- Secrets audit passed for Lesson 2: `.env.example` is the only tracked env file, `.env.local` is gitignored, and no credential appears in any commit reachable from `origin`. Lesson 3 adds no server env var, and the app holds no secrets at all.
- Next: **L3-1**, on Brian's go-ahead. Branch `L3-1-api`.
- Production URL: **deployed and tested by Brian.** Every graded flow (Google sign-in, order saved in Neon, orders visible after logout and back in, Mailgun confirmation email) has been exercised on production.
- Docs: PRD.md, FRD.md, DESIGN.md, AGENTS.md, CLAUDE.md and README.md are all current. README.md is the grader-facing guide: stack, local setup, every environment variable and where its value comes from, Vercel deploy, Google OAuth, Mailgun, and a six-step testing guide. It mentions the unverified-app screen (Advanced, then Go to Jaynie's Collection) and that a first email may land in spam.
- Row counts on Neon: products 21, orders 2, order_items 2, users 4, cart_items 0, sessions 0. The 2 orders are the phase 6 cross-shopper test rows (`JC-260929-BBBB`, `JC-260930-AAAA`) and **should be deleted from the Neon SQL editor before submission.**
- Schema: 3 migrations applied and committed. `0001_useful_bishop.sql` (change request A, nullable delivery columns), `0002_closed_the_fury.sql` (change request B, `cart_items`).
- Secrets audit passed: `.env.example` is the only env file tracked, `.env.local` is gitignored, and no Neon connection string, Mailgun key, Google client secret or `AUTH_SECRET` appears in any commit reachable from `origin`.
- Next: none. If work resumes, start from the Known issues below: delete the two test orders, and optionally finish the image work.

## Decisions

### Lesson 3 (2026-10-05)

- **The app is a client of a new `/api/v1` in this same Next.js project.** One deployment, one database, one Auth.js config. A second backend would have doubled the places a price or a delivery fee could be wrong.
- **The website's cart client was switched onto the `/api/v1/cart` HTTP endpoints**, authenticated with its cookie session, so "the same endpoints" is literally true rather than merely "the same behaviour". Brian chose this over keeping the website on Server Actions that wrap the same `src/lib/` functions, on the grounds that only an HTTP call proves the requirement. The Server Actions stay in place as thin wrappers, so there is always a second working path and the switch can be reverted one call site at a time.
- **PKCE (S256) on the mobile sign-in, plus `state`.** The one-time code travels in a deep link and could be read from a browser history or a log. Without PKCE a stolen code is a full account takeover inside its 2-minute life; with it, a stolen code is useless without the verifier, which never leaves the device. `code_challenge` sits beside `code_hash` in `mobile_auth_codes`, the comparison is constant-time, and every failure returns the same generic `400 invalid_grant` so the endpoint does not say which check failed.
- **The website's second sign-in prompt after the app hand-off is expected, not a defect.** The website authenticates with a cookie session and the app holds a bearer token, so the system browser has no session of its own. The app cannot inject one, and the two sessions are deliberately independent so signing out of one surface leaves the other signed in. It is written into FRD F16, PRD 6A (R1c), the 9A risk table, the README and step 8 of the phone script, precisely so nobody later "fixes" it by weakening sign-in.
- **Checkout stays on the website.** A second `POST /orders` would mean a second copy of the price-recalculation and email logic, which is the one place this project cannot be sloppy (rule 3).
- **A mobile bearer token is an ordinary `sessions` row.** Auth.js stores `sessions.sessionToken` in plaintext and looks it up by equality, confirmed by reading `node_modules/@auth/core/lib/actions/session.js`, so a direct lookup is the correct check. This avoids inventing a parallel token system. 32 random bytes, 30-day expiry, no refresh token: a lapsed session means signing in again through the browser.
- **The 2-second poll is one-directional.** The app polls `GET /api/v1/cart`; the website keeps its existing focus refresh and is deliberately not changed into polling, because the graded direction is website to app. Polling pauses during a write, stops when backgrounded, resumes on foreground, and backs off 4s then 8s on failure.
- **No new server environment variables and no new Google OAuth client.** The redirect-scheme allowlist is a code constant in `lib/mobile-auth.ts` rather than an env var, so it is reviewable in the diff.
- **`mobile/` is excluded from the root `tsconfig.json` and `eslint.config.mjs`.** The website's `npm run build` type-checks and lints the repo, so without this the Expo sources and React Native types would break the website build. Found while reading the root configs in L3-0, before `mobile/` existed.

- 2026-10-04: **`mobile_auth_codes` stores a SHA-256 hash of the code, not the code.** Confirmed against the live table: `isSha256OfTheCode: true`, `rawCodeStored: false`, `verifierStoredAnywhere: false`. A stolen database row therefore cannot be replayed as a code.
- 2026-10-04: **The one-time code is burnt by the UPDATE that reads it, not by a separate step.** `consumeMobileAuthCode` marks `used_at` in the same statement that returns the row, so two concurrent exchanges of one code cannot both win. Proven: a wrong verifier returned 400, and the *correct* verifier against that same code then also returned 400.
- 2026-10-04: **A bearer token that is present but stale must NOT fall back to the cookie.** `getUserFromRequest` returns null when an `Authorization: Bearer` header is present but does not resolve, rather than continuing on to `auth()`. Otherwise the app would keep polling with a dead token while appearing signed in, and would never learn to ask for a new one.
- 2026-10-04: **`DELETE /api/v1/cart/items` defaults `quantity` to 1.** `cartLineSchema` requires a quantity, but removing a line does not consume one, so a request carrying only `productId` and `size` was being rejected. Found by the verification harness, not by the happy path.
- 2026-10-04: **The guest merge stays a Server Action and is not an API endpoint.** The app has no local cart, and the merge depends on the persisted `syncedUserId` marker, which is a website-only concern. The shared `lib/cart.ts` function underneath is the same one the API calls, so the logic is still shared; only the transport differs.
- 2026-10-04: **`getSavedCart` takes an explicit `userId` instead of calling `auth()`.** This is what lets the same function serve the Server Actions (which pass `auth().user.id`) and the API routes (which pass the id from `getUserFromRequest`), with no second implementation and no duplication of the merge rules.
- 2026-10-04: **The website's cart client uses relative URLs plus `credentials: "same-origin"`.** No host is hard-coded, so it works on localhost, a preview domain and production unchanged, and the Auth.js cookie travels with the request without the client ever handling it (AGENTS.md rule 7).

### Lesson 2 (2026-10-02 and 2026-10-03)
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
- 2026-10-03: Compare-at prices are styled by one exported constant, `COMPARE_AT_CLASS` in `lib/money.ts`, holding `text-ink-muted/55 line-through`. It is imported by the product card and the product page, the only two places a compare-at is rendered. The cart, the checkout summary and both order pages show only the live `unitPriceKobo` and never had a compare-at, so nothing needed changing there. The Save pill is untouched and stays at full contrast.
- 2026-10-03: `text-ink-muted/55` resolves through the `@theme inline` token to `color-mix(in oklab, var(--ink-muted) 55%, transparent)`, which was confirmed present in the built CSS rather than assumed. It sits below the 4.5:1 WCAG AA threshold for body text; that is an accepted trade-off for a decorative "was" price that always sits beside a fully legible live price, and it is recorded on the constant so it is not mistaken for an oversight.
- 2026-10-03: The header logo is 48px tall on mobile and 56px on desktop (`h-12 md:h-14`), and the header bar grew from `h-16` to `h-[72px] md:h-20` so nothing clips. Both leave 12px of air above and below the logo.
- 2026-10-03: `logo.png` was trimmed to its alpha bounding box, 500x500 -> 426x256, with a 4px transparent pad. It had 41px of transparent padding left and right and 120px top, 132px bottom, so an `h-12` box only showed 24px of actual lettering. The same `h-12` now shows 46.5px. Verified lossless: visible pixel count and total alpha coverage are identical.
- 2026-10-03: `sharp.trim()` is UNSAFE for this job and was rejected by the lossless check. Measured against a manual alpha scan it dropped a column that does have alpha > 0, silently losing 2 visible pixels from logo.png. The bounding box must be computed from the raw alpha channel and applied with `extract()`. Never use `trim()` on a brand cut-out here without verifying visible pixel count and alpha sum before and after.
- 2026-10-03: `logo-dark-bg.png` is deliberately left alone. It has no alpha channel at all (1024x1024, 100% opaque), so there is no transparent border to trim and its apparent background may be baked in.
- 2026-10-03: The header row at 360px measures 330px signed out (the widest case, since the Sign in button is wider than an avatar), so logo, search, account and cart fit with 30px to spare. The mobile gap dropped from `gap-4` to `gap-2` to pay for the larger logo.
- 2026-10-03: The two hero cut-outs were trimmed to their alpha bounding box: `hero-woman-lilac.png` 427x585 -> 279x413, `hero-man-ember.png` 854x1170 -> 293x918, plus a 2px transparent pad. Verified lossless: visible pixel count and total alpha coverage are identical before and after. This was necessary, not cosmetic. The untrimmed files carried large asymmetric transparent margins (the man's right margin alone was 464px, over half his canvas), so `object-bottom` aligned a transparent edge rather than his feet, and any negative margin overlapped empty pixels instead of the two models. The originals are still in git history, so this is fully reversible.
- 2026-10-03: The hero models are sized by HEIGHT (`h-[12.5rem] sm:h-[19rem] lg:h-[28rem]` with `w-auto`), not by width. The two figures have very different aspect ratios after trimming, 0.676 and 0.319 w/h, so equal widths would render the man more than twice the woman's height. Height is the constraint that satisfies "the same rendered height".
- 2026-10-03: The hero overlap is `-ml-6 lg:-ml-10`, which is 1.5rem and 2.5rem, inside the requested range. The pair measured 175px, 278px and 406px wide at 360px, 640px and 1280px viewports, so it fits its column at every breakpoint, and the woman is 48% of the available width on mobile.
- 2026-10-03: Neither hero file needed `mix-blend-mode: multiply`. The woman's file has 0 near-white opaque pixels and the man's has 882, which is 0.09% of the canvas and reads as specular highlight on the garment rather than a white backdrop. Both are true 4-channel RGBA with real alpha, so no stopgap was applied and no re-export is needed.
- 2026-10-03: The delivery band no longer uses a marquee. The `w-max` track was always wider than a 360px viewport, so the yellow strip overflowed and the text was pushed out of it. The mobile band is now `overflow-hidden` with `min-h-12` plus vertical padding, centred 13px text that wraps to two lines, and the `jc-marquee` keyframes were deleted from `globals.css`. The `prefers-reduced-motion` override went with them, since it only existed for that animation.
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
- 2026-10-02: Cart resurrect bug fix. The one-time-merge guard is `syncedUserId`, a PERSISTED store field, not a `useRef`. A ref is reset on every page load, so after the phone merged its guest cart and the laptop placed an order (emptying `cart_items`), refreshing the phone re-ran the merge and pushed the stale local cart back onto the server. `syncedUserId` survives the refresh, so the second load takes the "load" path and an empty server cart correctly empties the local cart.
- 2026-10-02: `markSynced(userId)` is called only after the server has answered the merge successfully. If the merge fails, the marker stays null so the next page load retries instead of silently skipping the merge forever.
- 2026-10-02: The store now has two clears. `clear()` empties the lines and KEEPS the marker; it is used after a successful `placeOrder` on the device that ordered, so that device cannot re-merge. `clearAndResetSync()` empties the lines AND forgets the marker; it is used on sign-out, so the next person on the device starts clean and a later sign-in is a fresh merge.
- 2026-10-02: `persist`'s `partialize` now stores `lines` AND `syncedUserId`. `userId` and `syncState` are still deliberately not persisted, because they describe the live session and restoring them would leak a stale signed-in flag.
- 2026-10-02: The focus-reload listener is only attached when `syncedUserId === userId`. Before the marker is set there is nothing authoritative to pull yet, and the merge path owns that window.
- 2026-10-02: Guest-cart bug fix. The signed-out branch of `CartSync` used to guard on `syncState === "unknown"`, which never fires for a guest because `setIdentity(null)` has already moved them to `"guest"`. Every guest page load therefore ran `clearAndResetSync()` and wiped the cart. The guard is now `syncedUserId` being non-null: only a device that previously merged for an account clears on sign-out. A true guest has a null marker and is left alone.
- 2026-10-02: The explicit sign-out click still clears through `clearLocalCart()` in the account menu, so the shared-device wipe happens on the actual sign-out even when the page does not reload. The layout effect is the backstop for a session that expires on its own.
- 2026-10-02: Phase 7. README.md replaces the create-next-app boilerplate and is written for a grader who has never seen the repo. It documents every environment variable with the console each value comes from, never the value itself.
- 2026-10-02: Phase 7 secrets audit. `git ls-files | grep env` returns only `.env.example`, and a `git grep` across all 12 revisions reachable from `origin` found no Neon connection string, Mailgun key, Google client secret, or non-empty `AUTH_SECRET`, `AUTH_GOOGLE_SECRET` or `MAILGUN_API_KEY`. `.env.local` is covered by the `.env*` rule in `.gitignore`. This entry is the only reason a secret-pattern scan still matches this file: it names the patterns it looked for, not any value.
- 2026-10-02: The only `localhost:3000` strings in the repo are in `.env.example` (the template default), PRD.md and FRD.md (documentation of the local setup). There are none in `src/`, which is what AGENTS.md rule 7 requires.
- 2026-10-02: `refs/cline/checkpoints/*` are local-only refs created by the agent tooling. They are not on `origin` and hold no secrets, but they do keep some deleted blobs alive in the local object store. They can be deleted with `git update-ref -d` if a clean local history is ever wanted.
- 2026-10-02: In PowerShell, `cmd /c "npm run build > log 2>&1 & echo BUILD=%ERRORLEVEL%"` can report a false `0` because the `&` chain captures the wrong exit code. This hid a real TypeScript failure in phase 7 until the log file was read. Always read the log, never trust that echo.

## Known issues

### Lesson 3 (open)

- **`mobile/` does not exist yet.** Nothing in the Lesson 3 design is built or verified. Every claim in F14 to F17 is a specification, not an observation. In particular, the following are UNVERIFIED until the relevant phase reports them: the `exp://` deep-link round trip on hardware; the 2-second sync measured on a phone; PKCE rejection paths (each needs a `curl` proof, not just a happy path); and whether the phone can load the Expo dev server over this network.
- **The Expo SDK version is not pinned yet.** It gets pinned in `mobile/package.json` in L3-2 and must be stated in the README. If the phone's Expo Go is a different SDK major the app will not load at all, and the fix is an Expo Go update on the phone.
- **The website asking for Google sign-in again after the app hand-off will look like a bug to a first-time reader.** It is expected (see the Decisions log). It must be called out in the README, not left for someone to discover.
- **`mobile_auth_codes` rows are never swept automatically.** The design notes that a plain `DELETE ... WHERE expires_at < now()` is safe; nothing runs it yet. At the current volume it does not matter, and no code path depends on old rows.
- **Two day-blocks (Sunday and Monday) carry five phases.** If L3-1 or L3-2 slips, cut L3-4 polish and the EAS APK and spend the Monday 23:00 to 23:59 buffer. Do not cut the API or the sign-in.

### Lesson 2 (carried forward, still open)

- **Do this before submitting Lesson 2:** delete the two phase 6 test orders, `JC-260929-BBBB` and `JC-260930-AAAA`, from the Neon SQL editor. They belong to the test users `p6a@test.local` and `p6b@test.local`, so graders would otherwise see orders from "Ada Buyer" and "Ben Buyer". The four test users can go with them.
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
- Change request B is verified by 15 checks on the merge rule (max, not sum, capped at 10, one-sided lines kept, invalid lines dropped) run against the real catalogue, 11 checks on the `cart_items` table itself in Neon (unique constraint, quantity check, upsert capping, per-user scoping, cascade on user delete), and 24 checks on the one-time-merge logic, including a replay of the resurrect bug. The two behaviours NOT verified in a real browser are the sign-in merge moment and cross-device reload: to test, build a cart as a guest, sign in, then confirm the cart is still there and that opening the site in a second browser profile with the same Google account shows the same cart.
- The root layout calling `auth()` makes every route dynamic, so there are no longer any statically generated pages. That is expected and not a problem for a small shop.
- 10 products have `image_url` null (the FRD "no photo yet" rows), so they show the DESIGN.md placeholder card.
- WhatsApp number is a placeholder (2348000000000).
- T-shirt and polo prices are placeholders for Jaynie to confirm.
- 10 product images are still to be generated (DESIGN.md §9), and the 13 provided photos plus the brand logos and hero cut-outs are not in `public/` yet, so fallbacks are in use.
- `npm audit` reports 4 moderate advisories from drizzle-kit's bundled esbuild (dev-only, no runtime exposure).
- Node 22.12 prints an EBADENGINE warning for `eslint-visitor-keys`, which wants 22.13 or newer. Nothing fails.
- The remote was renamed from `bhuchee` to `Bhuchee`; `origin` on this machine points at the new URL. GitHub handles the redirect either way.
- The folder had no `.git` directory when phase 0 started, so the repo was initialised here and the docs were pushed as the root commit.
