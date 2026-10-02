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
- Current phase: 0 (scaffold) COMPLETE. Docs committed, app scaffolded, stack installed, tokens and Poppins in place, `npm run lint` and `npm run build` both pass.
- Production URL: _not deployed yet_
- Done: PRD.md, FRD.md, DESIGN.md, AGENTS.md, Next.js 16 App Router scaffold, Tailwind v4 tokens, Poppins, folder structure, `.env.example`, `.gitignore`
- Next: phase 1 (Drizzle schema, Neon connection, migrations, 21-product seed). Needs `DATABASE_URL` from Neon first.

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

## Known issues
- WhatsApp number is a placeholder (2348000000000).
- T-shirt and polo prices are placeholders for Jaynie to confirm.
- 10 product images are still to be generated (DESIGN.md §9), and the 13 provided photos plus the brand logos and hero cut-outs are not in `public/` yet, so fallbacks are in use.
- The remote was renamed from `bhuchee` to `Bhuchee`; `origin` on this machine points at the new URL. GitHub handles the redirect either way.
- The folder had no `.git` directory when phase 0 started, so the repo was initialised here and the docs were pushed as the root commit.
