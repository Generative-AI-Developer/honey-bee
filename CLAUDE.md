# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Honey Bee is a production e-commerce store for a Pakistani honey business. The app hasn't been scaffolded yet. So far the repo holds `.gitignore` and design mockups (PNG images in `design-mockups/`) that are waiting for the owner's review. The approved build plan is in `~/.claude/plans/hi-effervescent-wilkes.md`. **Don't start full development until the owner approves the design.** Update this file once real commands and code exist.

Mockups: edit `design-mockups/src/build.py` + `styles.css`, then `python3 build.py && node shoot.mjs [page-filter]` from that folder. `shoot.mjs` needs `playwright-core` resolvable (not a project dependency) and uses `/usr/bin/google-chrome`. Approved visual direction becomes the app's Tailwind theme tokens (cream `#FBF6EC`, ink `#2B1D0E`, honey `#E9A21A`, sage `#5E7A4A`; Fraunces headings + Inter body).

## Fixed decisions (agreed with the owner; don't revisit without asking)

- **Market:** Pakistan only, currency PKR, English only. Store money as integer **paisa**, never floats.
- **Stack:** Next.js (App Router, Server Actions) + TypeScript strict + Tailwind + shadcn/ui, Prisma + PostgreSQL, Better Auth (roles CUSTOMER / STAFF / ADMIN), Zod validation, Resend + React Email, Cloudinary images, Vitest + Playwright.
- **Payments:** COD, bank transfer (receipt upload + admin verification), Safepay, JazzCash, Easypaisa, Stripe. All sit behind one `PaymentProvider` interface (`src/services/payments/`), and a provider without credentials is disabled automatically. Stripe is off by default because it doesn't onboard Pakistan-registered businesses.
- **No Docker** anywhere: no docker-compose and no Dockerfile. Development uses the local PostgreSQL 16 server on `localhost:5432` (database `honeybee`). **Production uses a hosted Postgres** (Neon, Supabase or the web host's own), set through `DATABASE_URL` / `DIRECT_URL`.
- **Hosting isn't decided yet.** Keep the app host-agnostic (`output: "standalone"`, works with `npm start`/PM2). Shared cPanel plans were judged unsuitable; a VPS is the recommended target.
- **`.gitignore`:** keep it updated whenever new generated files, tools or secret locations appear. Never add a global `*.sql` rule, because Prisma `migration.sql` files must be committed.

## Planned architecture (to be built)

- `src/app/` uses route groups: `(store)` for the public storefront, `(auth)` for sign-in flows, `account/` for customers, `admin/` for the RBAC-guarded dashboard, and `api/` for the auth handler, payment webhooks, uploads and cron.
- `src/server/{actions,queries}/` holds data access per domain. Every action validates with Zod and checks the role on the server. Middleware alone isn't trusted.
- `src/services/` holds the payment, email and storage adapters.
- **Checkout rules:** the server re-prices everything from the database and never trusts client prices. Order, payment and stock reservation happen in one transaction, and stock is decremented conditionally (`stock >= qty`). Webhooks verify signatures and are idempotent. A cron route expires unpaid online orders and releases their stock.
- **Product search** uses Postgres full-text search (`tsvector` + GIN index).
- **Development email:** messages are logged to the console and written as HTML to `.emails/` instead of being sent.
