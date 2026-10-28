# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Honey Bee is a production e-commerce store for a Pakistani honey business (PKR, English only). See `README.md` for features and `docs/DEPLOYMENT.md` for hosting. **Next.js 16 differs from older versions; read `node_modules/next/dist/docs/` before using an unfamiliar API** (see `AGENTS.md`).

## Commands

```bash
npm run dev                 # dev server (needs DATABASE_URL in .env)
npm run typecheck           # tsc --noEmit (run `npx next typegen` first if route types are stale)
npm run lint
npm test                    # Vitest unit tests; one file: npx vitest run tests/unit/pricing.test.ts
npm run test:e2e            # Playwright, against a running server
npm run db:migrate          # prisma migrate dev; npm run db:seed loads sample data + admin
npm run build               # requires a reachable database; don't run during routine development (owner's preference), only before deploying
E2E_BASE_URL=http://localhost:3001 E2E_CHROME_PATH=/usr/bin/google-chrome npx playwright test   # e2e vs dev server
```

## Fixed decisions (agreed with the owner; don't revisit without asking)

- **Market:** Pakistan only, PKR, English only. **Money is integer paisa everywhere** (`src/lib/money.ts`). Admin forms take rupees and convert with `rupees()`.
- **No Docker** anywhere. Dev DB: a private PostgreSQL 16 started with `npm run db:dev` on `localhost:5433` (db/user/password `honeybee`, data in `~/.local/share/honeybee-pg`; no sudo needed). Dev server runs on **port 3001** (`npx next dev -p 3001`) because another app uses 3000; `.env` URLs match. Production: hosted Postgres via `DATABASE_URL` (pooled) + `DIRECT_URL` (migrations).
- **Hosting undecided:** stay host-agnostic (`output: "standalone"`, PM2 config `ecosystem.config.cjs`). Shared cPanel was judged unsuitable; a VPS is recommended.
- **Payments:** COD, bank transfer, JazzCash, Easypaisa, Safepay, Stripe (off by default; Stripe doesn't onboard Pakistan-registered businesses).
- Keep `.gitignore` updated when adding generated files/tools; never add a global `*.sql` ignore (migrations are committed).

## Architecture

- **Rendering model: Cache Components + Partial Prefetching are ON** (`next.config.ts`). Shared catalogue reads (`src/server/queries/catalog.ts`, `shipping.ts`, `src/server/settings.ts`) use `"use cache"` + `cacheTag`; admin mutations call `updateTag(tags.…)` with the same tags. Anything reading cookies, the session, searchParams or uncached DB data must sit inside `<Suspense>`: the `/account` and `/admin` layouts wrap children, and pages pass `searchParams` promises down. (`middleware` is called `proxy` in Next 16; none is used.)
- **Auth / authorisation:** Better Auth (`src/lib/auth.ts`, route `src/app/api/auth/[...all]`). The only session reader is `src/server/auth.ts` (`getCurrentUser`, `requireUser`, `requireStaff`, `assertUser`, `assertStaff`). Every page, Server Action and route handler re-checks there. Roles: CUSTOMER / STAFF / ADMIN (`user.role`, `input: false` so sign-up can't set it).
- **Server Actions** are wrapped with `action(zodSchema, handler)` from `src/server/action.ts` and return `ActionResult`. Throw `UserError` for messages that are safe to show users. File-upload actions take `FormData` directly.
- **Orders** (`src/server/orders.ts`):
  - `placeOrder` re-prices from the DB and reserves stock in one transaction with a conditional `updateMany(stock >= qty)`.
  - `changeOrderStatus` enforces `STATUS_FLOW`, restocks on cancel/return and releases discount usage.
  - `applyPaymentResult` is idempotent and checks amounts.
  - Pure pricing rules are in `src/server/pricing.ts` (unit-tested).
- **Payments** (`src/services/payments/`): COD and bank transfer are offline methods. Gateways enable themselves when their env keys exist (`configuredGateways`).
  - Flow: checkout → `/api/payments/start` (redirect or auto-POST) → `/api/payments/[provider]/[step]` (verify) and `/api/webhooks/*`.
  - Easypaisa redirects are unsigned, so they set `needsReview` and staff confirm the payment in admin.
  - Guests reach their orders via HMAC tokens (`src/server/order-access.ts`).
- **Cart:** the guest cart lives in an httpOnly `hb_cart` cookie. `getCart()` (render) shows guest and user carts combined; `resolveCartForWrite()` (actions only) persists the merge.
- **Email:** `src/services/email` sends via Resend, or in dev logs and writes `.emails/*.html`. Templates are in `src/emails`. `src/server/notifications.ts` never throws and is called via `after()`.
- **Images:** `src/services/storage` uses Cloudinary, or `public/uploads` in dev. File type is sniffed from the bytes.
- **Business settings** (store info, COD fee, bank details, payment window) are DB rows edited in Admin → Settings and merged over defaults in `src/server/settings.ts`. Secrets stay in env (validated by `src/lib/env.ts`).
- **UI:** design tokens (cream/ink/honey/sage/clay) are in `src/app/globals.css`; the approved mockups are in `design-mockups/` (regenerate with `python3 build.py && node shoot.mjs` in `design-mockups/src`). The shadcn components in `src/components/ui` were restyled: pill buttons, taller inputs and extra badge variants.
