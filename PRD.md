# PRD — Jaynie's Collection Online Shop

**Owner:** Brian (builder) for Jaynie (shop owner)
**Context:** HNG 15. Lesson 2 built the website, which is built, deployed and tested. **Lesson 3** adds a native Android app on top of the same API.
**Deadline:** Lesson 2 was Friday 2 Oct 2026, 11:59 PM WAT (met). **Lesson 3 is Monday 5 Oct 2026, 11:59 PM WAT.**
**Status:** Agreed scope **v2.0** (Lesson 3). Changes must be recorded in the Change Log at the bottom.

**How to read this document:** sections 1 to 10 are Lesson 2 and still govern the website. Sections with an **A** suffix (`2A`, `4A`, `5A`, `6A`, `7A`, `8A`, `9A`) are Lesson 3 and govern the API and the Android app. Where an A section touches an area a numbered section also covers, the A section decides **for the app only**. No A section may weaken a numbered acceptance criterion for the website.

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

## 2A. Lesson 3 goals and requirements

Lesson 3 is judged on three things. Everything else in this document is in service of them.

| # | Requirement (verbatim) | How the product meets it |
|---|---|---|
| **R1** | "the same Google account logs in on the website and in the app" | One identity source, the existing Auth.js Google provider and the existing `users` table. The app never implements Google sign-in itself: it opens the site's own sign-in in the system browser, which sets the normal Auth.js session cookie, and the site hands a short-lived single-use code back to the app through a deep link. The app exchanges that code for a bearer session token and stores it in the device's secure keystore. Same Google account, same `users.id`, on both. See FRD F15. |
| **R2** | "a cart item added on the website appears in the app's cart almost instantly" | **One cart, one set of HTTP endpoints.** The website's cart client and the app call the *same* `/api/v1/cart` endpoints over HTTP, authenticated the same way from each side (cookie session for the website, `Authorization: Bearer` for the app). Underneath both, one shared set of `src/lib/` functions reads and writes the `cart_items` table, so there is a single implementation and a single table. The website writes on every add, quantity change and remove, and the app polls `GET /api/v1/cart` every 2 seconds while foregrounded and immediately on resume, so a website change lands in the app in about 2 seconds. See FRD F5, F14 and F17. |
| **R3** | "it must work on a physical Android phone" | The app is built with Expo and tested through Expo Go on a real handset over Expo's dev server, not a simulator and not a web browser. The deep-link schemes it registers, its secure storage, its 2-second polling and its touch targets are all verified on hardware in phase L3-5. See FRD F16. |

**Lesson 3 goals (supporting):**
4. The website keeps working exactly as it does now. Every Lesson 2 flow (sign in, cart, checkout, orders) is re-tested before each phase is merged.
5. The app reuses the website's logic rather than reimplementing it, so prices, fees, delivery rules and validation cannot drift between the two.

**Explicitly not a Lesson 3 goal:** rebuilding the shop as a store app with offline-first writes, push notifications, or a second admin channel. The app is a client of the same API the website already uses.

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
- Cart, stored in the browser so guests can build a cart before signing in, and synced to a per-user cart in Neon Postgres once signed in, so the same cart shows on every device
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

## 4A. Lesson 3 scope

### In scope (Lesson 3)

- **A public JSON API under `/api/v1`** in this same Next.js project, served by the same deployment: products, cart, orders, the signed-in shopper's profile, and mobile sign-in. No second backend, no second database, no second copy of the business rules.
- **One shared implementation, reached over HTTP by both surfaces.** The cart, product, order and validation logic lives in `src/lib/` functions that the `/api/v1` routes call, and **the website's own cart client is switched onto those same `/api/v1/cart` endpoints in phase L3-1.** The website calls them with its cookie session, the app with its bearer token, and both land on the same rows through the same functions. This is a deliberate choice over "the website keeps calling Server Actions that wrap the same functions": the requirement is the *same endpoints*, not merely the same behaviour, and only an HTTP call proves that.
- **PKCE on the mobile sign-in.** `POST /api/v1/auth/mobile/start` takes a `code_challenge` (S256) and a `state`; the challenge is stored beside the hashed one-time code; `POST /api/v1/auth/mobile/exchange` requires the matching `code_verifier` and rejects any mismatch; the app verifies the returned `state`. See FRD F15.
- **A mobile sign-in bridge** that produces an ordinary Auth.js session for the app: three endpoints under `/api/v1/auth/mobile`, one new `mobile_auth_codes` table holding only a hash of a 2-minute single-use code, and bearer tokens that are rows in the existing `sessions` table with a 30-day expiry.
- **An Android app in `mobile/`**, built with Expo (React Native, TypeScript) and expo-router, running in Expo Go on a physical Android phone.
- **App screens:** sign in, shop (with the same category and gender filters), product detail (with size, quantity, add to cart), cart (with live quantity changes and removal), my orders, order detail, and account (sign out, contact links).
- **Live cart sync both ways.** The app polls `GET /api/v1/cart` every 2 seconds while foregrounded and on resume; the website keeps refreshing on focus. Any add, quantity change or removal on either surface appears on the other within about 2 seconds.
- **App checkout is handed off, not rebuilt.** The app's cart carries the shopper to the website's `/checkout`, which already passes its Lesson 2 acceptance criteria and already sends the graded Mailgun email. The hand-off **opens the system browser**, because the website's checkout needs a real browser context. Because the website authenticates with a **cookie session, not the app's bearer token**, the browser may ask for Google sign-in again even though the shopper is already signed in to the app. **That is expected behaviour, not a bug**, and it is covered by its own acceptance criterion and by the phone test script. This is deliberate and is the single biggest reason Lesson 3 fits in one day. See the note below.
- **DESIGN.md fidelity in the app:** Onyx, highlight yellow, cream and Poppins, lucide icons, 44px minimum tap targets, no emoji, money shown in naira with thousands separators.
- **A README section for the app** and an optional EAS APK build, both in phase L3-5.

### Out of scope (Lesson 3)

- **Placing an order from inside the app.** The cart is native to the app; the final checkout, the order row and the email stay on the website. Building a second `POST /orders` would mean a second copy of the price-recalculation and email-seam logic, which is the exact place this project has to be correct (AGENTS.md rule 3).
- **A native or third-party sign-in UI inside the app.** Google sign-in happens in the system browser. No Apple sign-in, no Facebook sign-in, no email and password.
- **iOS.** The requirement is an Android app on a physical Android phone. The code stays cross-platform where it is free to do so, but iOS is not built, signed or tested.
- **Push notifications** and background sync. The app syncs when it is in the foreground. Android background execution limits make a background poller unreliable, and it is not needed to satisfy R2.
- **Offline writes.** Reads may show the last known cart if the network is down, but nothing is queued to write later.
- **Store publication.** No Play Store listing, no review process. An EAS APK for sideloading is optional and best-effort.
- **Any change to the Lesson 2 acceptance criteria**, the catalogue, the prices, the delivery fees or the email template.
- Refunds, cancellations from the app, addresses book, reorder, wishlist, reviews, coupons.

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
| Cart state | Zustand with `persist`, saved in localStorage, plus a `cart_items` table in Neon as the source of truth once signed in |
| Validation | Zod |
| Email | Mailgun HTTP API, called with `fetch` (no SDK) |
| Hosting | Vercel |
| Package manager | npm |

## 5A. Lesson 3 tech additions (locked)

Everything in section 5 still applies and is unchanged. These are additions only.

| Layer | Choice | Why |
|---|---|---|
| Mobile framework | **Expo**, React Native, TypeScript in strict mode | Runs in Expo Go on a real phone with no store account, no Android Studio and no native build step, which is what makes a one-day Android deliverable realistic. |
| Navigation | **expo-router**, file-based | Deep links resolve to screens for free, which the sign-in hand-off depends on. |
| System browser | **expo-web-browser** | Opens Google's sign-in in a real browser context. Google blocks sign-in inside embedded webviews, so this is a hard requirement, not a preference. |
| Token storage | **expo-secure-store** | Android Keystore-backed. A bearer token must not sit in plain AsyncStorage. |
| App lifecycle | **expo-linking** plus React Native `AppState` | Deep-link delivery, and the foreground/resume signal that drives live sync. |
| Icons | **lucide-react-native** | Same icon set and stroke language as the website. |
| App font | Poppins, loaded through `@expo-google-fonts/poppins` | The app uses the same typeface as the site (DESIGN.md §3). |
| API hosting | The **same Vercel project**, same origin as the website | One deploy, one database, one auth config. `EXPO_PUBLIC_API_URL` points at it. |
| Shared types | A hand-written `mobile/src/api/types.ts` that mirrors the API contract | A monorepo import between two build systems is not worth the coupling; the contract is pinned by the FRD and checked in phase L3-1. |

**New packages and why they are not on the locked stack:** `expo`, `expo-router`, `expo-web-browser`, `expo-secure-store`, `expo-linking`, `expo-status-bar`, `expo-constants`, `expo-splash-screen`, `@expo-google-fonts/poppins` and `lucide-react-native`. They are installed **only** in `mobile/package.json`. The website's `package.json` is not allowed to gain any of them, and nothing from `mobile/` may ever be imported by `src/`.

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

## 6A. Lesson 3 success criteria (definition of done)

The Lesson 2 list above stays open and must still pass at the end of Lesson 3.

### R1: one Google account, two surfaces
- [ ] Signing in on the website with a Google account, then opening the app on the same phone and signing in with the same account, shows the same `users.id` and the same saved cart, with no second account created.
- [ ] Orders placed on the website are visible in the app's My Orders, and vice versa once an order exists.
- [ ] Signing out of the app does not sign the website out, and signing out of the website does not sign the app out. Each surface owns its own session.
- [ ] The one-time code is rejected on a second use, after 2 minutes, and after a successful exchange. Only its hash is ever stored.
- [ ] The bearer token lives in the device's secure store, never in AsyncStorage, and a tampered or expired token returns 401 and sends the app back to sign in.

### R2: one cart, two surfaces
- [ ] Adding an item on the website appears in the app's cart within about 2 seconds, with the app in the foreground and showing the cart screen.
- [ ] Changing a quantity or removing a line on the website appears in the app within about 2 seconds.
- [ ] Adding, changing or removing a line in the app appears on the website after a refresh or tab focus, which is the website's existing behaviour and is enough for the website, which is not required to poll.
- [ ] Placing an order on the website empties the cart in the app within about 2 seconds.
- [ ] The app shows the cart badge from the server cart, and the total is recalculated by the server, never by the app.
- [ ] Polling stops when the app is backgrounded, and resumes immediately on return to the foreground.
- [ ] The website's own cart client calls the same `/api/v1/cart` endpoints as the app, so a change made on the website travels over HTTP through the API rather than through a separate Server Action path. Verified from the browser network panel, not just from the rendered result.

### R1b: sign-in is bound to the app that started it (PKCE)
- [ ] A code exchanged with the wrong `code_verifier` is rejected, and the rejection is proven by a direct `curl` against the exchange endpoint, not only by the happy path working.
- [ ] A code exchanged twice is rejected the second time, including when the first exchange succeeded.
- [ ] A code older than 2 minutes is rejected.
- [ ] The app discards a response whose `state` does not match the one it generated, and the one-time code is never exchanged in that case.
- [ ] The `mobile_auth_codes` table stores only a SHA-256 hash of the code and the `code_challenge`; the raw code and the verifier are never written to the database or to a log.

### R1c: app to website hand-off
- [ ] Tapping "Checkout" in the app's cart opens the website's `/checkout` in the system browser.
- [ ] If the browser is not already signed in to the website, it asks for Google sign-in once more and then shows the cart contents the app had, proving the shared cart rather than a new one.
- [ ] This second sign-in prompt is documented in the README and shown as **expected** in the phone test script, so it is not reported as a defect.

### R3: works on a physical Android phone
- [ ] The app loads in Expo Go on a physical Android phone, from a QR code, with no emulator and no desktop mirror.
- [ ] Google sign-in completes in the system browser on the phone and returns to the app.
- [ ] Every screen renders at 360px width with no horizontal clipping, and every tap target is at least 44px.
- [ ] The deep-link round trip works repeatedly on the phone, not just on the first attempt.
- [ ] Money is shown in naira with thousands separators, and no kobo value is ever displayed.
- [ ] The app contains no emoji, and its colours and type come from DESIGN.md.

### Cross-cutting
- [ ] The website's sign in, cart, checkout, orders and email all still work on production after the final merge.
- [ ] No secret is committed. `mobile/.env` is gitignored; only `EXPO_PUBLIC_API_URL`, which is a public URL, appears in the app's committed env template.
- [ ] `npm run build` passes for the website on every merge, and the build log is read rather than the exit code.
- [ ] README documents the app, and AGENTS.md's Status, Decisions and Known issues are current.

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

## 7A. Lesson 3 build phases and time boxes

Lesson 2 is done and deployed. The phases below are the only work in scope. **L3-0 was Sunday 4 Oct. L3-1 and L3-2 are Sunday 4 Oct. L3-3 to L3-5 are Monday 5 Oct, with Monday evening held as buffer against the 11:59 PM deadline.**

### L3-0: docs, Sunday 4 Oct (done)

| # | Phase | Done when |
|---|---|---|
| **L3-0** | Docs: PRD v2.0, FRD API and app sections, AGENTS.md rules and phases | These documents agree with each other and with the code that exists today. No code written. |

### L3-1 and L3-2: Sunday 4 Oct (today)

| # | Phase | Target | Done when |
|---|---|---|---|
| **L3-1** | API layer: `/api/v1` products, cart, orders, me; `getUserFromRequest` accepting cookie **or** bearer; the shared `src/lib/` functions; **switch the website's cart client onto the `/api/v1/cart` HTTP endpoints**; the `mobile_auth_codes` migration with the PKCE columns | Sun 22:00 | The website's sign in, cart, checkout, orders and email all still pass on production, the website's cart traffic is visible in the browser network panel going to `/api/v1/cart`, and every endpoint answers correctly from `curl` with a real bearer token. |
| **L3-2** | App scaffold and sign-in: Expo project in `mobile/`, expo-router, theme, secure store, browser hand-off, PKCE code exchange | Sun 23:59 | A physical Android phone signs in with Google through the system browser and lands back in the app signed in, on the same account, and a wrong verifier is rejected by `curl`. |

### L3-3 to L3-5: Monday 5 Oct

| # | Phase | Target | Done when |
|---|---|---|---|
| **L3-3** | Shop, product, cart and live sync in the app | Mon 5 Oct 19:00 | A cart change made on the website appears in the app's cart within about 2 seconds, on the phone. |
| **L3-4** | App orders (list and detail), account, sign out, checkout hand-off, polish to DESIGN.md | Mon 5 Oct 21:00 | Orders placed on the website are readable in the app, the hand-off to `/checkout` is documented as expected behaviour, and the app meets the R3 look and tap-target criteria. |
| **L3-5** | Real-phone test of the whole R1/R1b/R1c/R2/R3 script, README for the app, optional EAS APK | Mon 5 Oct 22:30 | The requirements are demonstrated on hardware with the phone script run end to end, and the website is re-verified afterwards. |
| — | **Buffer** | **Mon 5 Oct 23:00 to 23:59** | Phone-only surprises, a flaky Wi-Fi dev server, or an EAS build that takes longer than expected. Nothing new is started in this window. |

**Rules for these phases, on top of the existing ones:**
- One branch per phase: `L3-0-docs`, `L3-1-api`, `L3-2-app-auth`, `L3-3-app-shop`, `L3-4-app-orders`, `L3-5-phone-test`. Merge with `--ff-only`, never a force-push, never a rebase of a pushed branch.
- **`npm run build` must pass and the build log must be read before every merge.** Trust the log, not the exit code.
- The production website must keep working after every merge. Test sign in, cart, checkout, orders and the email before merging.
- Stop at the end of each phase and report. Do not start the next phase without confirmation.
- If a phase is late, cut L3-4 polish and the EAS APK first and spend the Monday evening buffer. Never cut L3-1 or L3-2: without the API and sign-in there is no app.

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

## 8A. Lesson 3 human-only setup (Brian)

| # | Step | Why it cannot be automated |
|---|---|---|
| 1 | **Install Expo Go on the physical Android phone** from the Play Store, and confirm the phone is on the same Wi-Fi as this laptop. | R3 is tested on hardware. Expo Go only supports one SDK major version at a time, so if the phone's Expo Go is too old the app will refuse to load and the fix is an update on the phone. |
| 2 | **Run `npm run dev` in `mobile/` and scan the QR code with the phone** at least once before L3-2 finishes. | This proves the dev server is reachable from the phone's network. Corporate or guest Wi-Fi that blocks client-to-client traffic is the most common reason a phone cannot load the app, and finding that out in L3-2 is much cheaper than in L3-5. |
| 3 | **Note the Vercel production URL** and put it in `mobile/.env` as `EXPO_PUBLIC_API_URL`. | The app talks to the deployed site, not to localhost, because AGENTS.md rule 7 forbids hard-coding localhost and because the phone cannot reach this laptop's port 3000 reliably. |
| 4 | **Add the redirect scheme to `mobile/app.json`** (`scheme: "jaynies"`), which is why the phone needs the app scheme registered before a real build. Expo Go intercepts `exp://` links itself; the custom scheme is what a standalone build needs. | A config value, and the code signing for it is outside Lesson 3's scope. |
| 5 | **Optional:** create a free Expo account and run `eas build -p android --profile preview`. | Only for a sideloadable APK. Requires an Expo login and a few minutes of remote build time, so it starts in L3-5, not earlier. |
| 6 | **No new Google OAuth client and no new Google consent screen are needed.** The app reuses the web OAuth client. | The app never talks to Google directly; the system browser signs in against the existing web client. This is why the consent screen stays as it is. |
| 7 | **Apply the L3-1 migration to Neon** with `npm run db:migrate`, and add any new env var to Vercel. | `mobile_auth_codes` must exist in the database before the sign-in bridge is deployed, or the exchange will fail on production. |

## 9A. Lesson 3 risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Google sign-in is blocked inside the app's webview.** This is the single most likely thing to break R1. | Medium | R1 fails | Sign-in happens in the **system browser** via `expo-web-browser`, never in a WebView. Verified on the phone in L3-2, and verified twice in a row so a cached session is not mistaken for a working round trip. |
| **The `exp://` deep link does not come back to the app**, because Expo Go is closed, or the phone's browser opens the link in a chooser with no default. | Medium | R1 fails | The app opens the browser with `openAuthSessionAsync` and a 5-minute timeout, which keeps the app alive to receive the return; a "sign in again" button is always visible; the code itself expires in 2 minutes, so a lost link is a retry, not a deadlock. |
| **Expo Go on the phone is a different SDK major than the app**, so the app will not load at all. | Medium | R3 fails | The SDK version is pinned in `mobile/package.json`, checked in L3-2, and stated in the README. Fix is an Expo Go update on the phone. |
| **The 2-second poll gets rate-limited or throttled** by Vercel or the phone's radio, so "almost instantly" degrades. | Low | R2 weakens | Polls stop when backgrounded and pause while a write is in flight; one poll in flight at a time, so a slow network cannot queue requests; the cart screen shows a "last updated" time so staleness is visible rather than silent. |
| **A stolen one-time code is exchanged by an attacker.** The code travels in a deep link and could be read from a browser history or a log. | Low | Account takeover | **PKCE (F15):** `start` takes a `code_challenge` (S256) and a `state`, the challenge is stored beside the hashed code, and `exchange` rejects any `code_verifier` that does not match. A stolen code alone is useless without the verifier, which never leaves the device. The `state` is echoed back and compared, the code lives 2 minutes and is single-use, and only its SHA-256 hash is stored. |
| **Switching the website's cart client to HTTP breaks it**, because a Server Action could no longer be the path a component calls. | Medium | Lesson 2 regressions | The shared `src/lib/` functions are extracted first and the Server Actions become thin wrappers over them, so there are always two working paths. The website's client is then repointed at the `/api/v1/cart` endpoints, one call site at a time, and **the browser network panel is checked to confirm the requests really are hitting the API** rather than trusting the rendered result. Reverting is one `git revert`. |
| **The website asks for Google sign-in again after the app hand-off**, because the browser has no cookie session even though the app holds a bearer token. | **High** | Confusing, but not a defect | Expected and documented. The hand-off opens the system browser, which needs its own cookie session; the app cannot inject one. It appears in the FRD, in PRD 6A (R1c), in the README and in the phone test script as a step to demonstrate, so it is never reported as a bug or "fixed" by weakening the sign-in. |
| **A leaked bearer token is a leaked account**, since it is a row in the real `sessions` table. | Low | Security | Tokens are 32 random bytes, expire in 30 days, are stored only in the Android keystore, are never logged, and `mobile_auth_codes` stores only a SHA-256 hash of the one-time code. Signing out of the app deletes its own session row and nothing else. |
| **The phone and this laptop are on networks that cannot see each other**, so Expo Go will not load the app. | Medium | R3 blocked | Test the QR scan at the start of L3-2. Fallback is `npx expo start --tunnel`, which routes the bundle over the internet. |
| **Deadline pressure.** Lesson 3 is due Monday 23:59 and the phases are tight. | High | Partial delivery | Phases are ordered so the graded requirements land early: API and sign-in in L3-1 and L3-2, live cart in L3-3. L3-4 polish and the EAS APK are the designated cuts. |
| **Two codebases drift** so the app and the website disagree on price or delivery. | Low | Data inconsistency | There is no second implementation. The app calls the API, the website calls the shared `src/lib/` functions, and both reach the same rows. The app never computes a fee or a total. |

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
- v1.2 (2 Oct 2026): The cart syncs to the account. A `cart_items` table holds a saved cart per user, the guest localStorage cart is merged into it immediately after sign-in, and a signed-in shopper sees the same cart on any device. Nothing about signing in changed: a guest still builds a cart in the browser and is only asked to sign in at checkout. See FRD F5.
- v1.3 (2 Oct 2026): Phase 7 complete. README.md documents the project, the stack, local setup, every environment variable and where its value comes from, the Vercel deploy, Google OAuth and Mailgun setup, and a six-step grader testing guide including the unverified-app screen and the chance a first email lands in spam. A secrets audit confirmed `.env.example` is the only tracked env file and no credential appears in any commit reachable from `origin`.
- v2.0 (5 Oct 2026): **Lesson 3.** An Android app for the same shop, on the same API. Adds PRD sections 2A (requirements R1 one Google account on both surfaces, R2 a website cart change visible in the app in about 2 seconds, R3 verified on a physical Android phone), 4A (scope), 5A (stack additions: Expo, expo-router, expo-web-browser, expo-secure-store, expo-linking, lucide-react-native, Poppins, all confined to `mobile/`), 6A (acceptance criteria per requirement), 7A (phases L3-0 to L3-5 with time boxes and per-phase branch names), 8A (human-only setup) and 9A (risks). Key decisions: the app is a client of a new `/api/v1` in this same Next.js project rather than a second backend; website and app call one shared set of `src/lib/` functions so prices, fees and validation cannot drift; sign-in is a browser hand-off through the existing Auth.js Google provider with a 2-minute single-use code exchanged for a 30-day bearer token that is a row in the existing `sessions` table, so there is no second identity system and no new Google OAuth client; cart sync is 2-second foreground polling on the app side and the existing focus refresh on the website side. **Checkout stays on the website.** The app's cart hands off to `/checkout`, which already passes its Lesson 2 acceptance criteria and already sends the graded Mailgun email; a second `POST /orders` would mean a second copy of the price-recalculation logic, which is the one place this project cannot be sloppy, so `POST /orders` is explicitly out of scope. Also out of scope: placing orders in the app, iOS, push notifications, background sync, offline writes and store publication. All Lesson 2 acceptance criteria remain in force and the website must pass them after every merge.