# Honey Bee 🐝: Online Honey Store

A complete e-commerce website for selling honey in Pakistan: storefront, customer accounts, checkout with Pakistani payment methods, and an admin dashboard for running the business.

Built with **Next.js 16** (App Router, Cache Components), **TypeScript**, **Tailwind CSS 4 + shadcn/ui**, **PostgreSQL + Prisma 7** and **Better Auth**.

## Features

| Area | What's included |
|---|---|
| Storefront | Home page with banners, shop with search/filters/sorting, category pages, product pages with size variants, gallery, reviews, related products |
| Cart & checkout | Guest and member carts (merged on login), delivery options priced by city & weight, discount codes, COD fee, saved addresses |
| Payments | Cash on Delivery, bank transfer (receipt upload + staff verification), JazzCash, Easypaisa, Safepay (cards), Stripe (optional) |
| Customers | Sign-up with email verification, Google sign-in (optional), password reset, order history & tracking, cancellation, return requests, address book |
| Admin | Sales dashboard, orders (status flow, courier tracking, invoices, CSV export), products & images, categories, inventory with audit log, customers & roles, review moderation, discount codes, banners & pages, shipping zones, returns, reports, settings |
| Emails | Verification, password reset, order confirmation, status updates (with tracking), returns, new-order alerts to the owner |
| SEO | Clean URLs, per-page metadata, Product/Breadcrumb/Organization structured data, sitemap.xml, robots.txt |
| Security | Server-side validation (Zod) and role checks on every action, atomic stock reservation, signed payment callbacks, rate limiting, CSP and security headers, open-redirect protection |

## Quick start (development)

Requirements: **Node.js 22+** and **PostgreSQL 16** (local or hosted).

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env        # then edit DATABASE_URL and BETTER_AUTH_SECRET (openssl rand -base64 32)

# 3. Create the database tables and sample data
npm run db:migrate          # applies prisma/migrations
npm run db:seed             # sample honey catalogue + admin account from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD

# 4. Run
npm run dev                 # http://localhost:3000  ·  admin at /admin
```

In development, without `RESEND_API_KEY`, emails are not sent. They're printed in the terminal (including the verification link) and saved as HTML files in `.emails/`.

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build / run the production server |
| `npm run typecheck` · `npm run lint` | Type and lint checks |
| `npm test` | Unit tests (Vitest); `npx vitest run tests/unit/pricing.test.ts` runs one file |
| `npm run test:e2e` | End-to-end tests (Playwright) against a running server |
| `npm run db:migrate` | Create/apply migrations in development |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Load sample data (safe to re-run) |
| `npm run db:studio` | Browse the database |

## What you need to provide

| Service | Needed for | Where to get it |
|---|---|---|
| PostgreSQL (required) | Everything | Your VPS, Neon, or Supabase |
| Resend | Sending emails | resend.com (verify your domain) |
| Cloudinary | Product photo & receipt uploads in production | cloudinary.com |
| JazzCash / Easypaisa / Safepay | Online payments | Merchant accounts with each provider (test in sandbox first) |
| Stripe (optional) | International cards | Only for a business registered in a Stripe-supported country |
| Google OAuth (optional) | "Continue with Google" | Google Cloud console |

Every key is documented in [`.env.example`](.env.example). Features whose keys are missing switch themselves off; COD and bank transfer always work.

> **Payment gateways:** the JazzCash, Safepay and Stripe integrations verify signatures before marking orders paid, and are covered by unit tests, but they **must be tested end-to-end in each provider's sandbox with your merchant credentials before going live**. Easypaisa success redirects are not signed by Easypay, so those payments are marked "awaiting verification" for you to confirm in the admin (like bank transfers).

## Project structure

```
src/app/(store)      storefront, cart, checkout, account, auth pages
src/app/admin        admin dashboard
src/app/api          auth, payment returns/webhooks, cron, CSV export
src/server           data access, business logic (orders, pricing, cart), server actions
src/services         payment gateways, email, image storage
src/emails           email templates
prisma               schema, migrations, seed data
tests                unit (Vitest) and e2e (Playwright) tests
docs/DEPLOYMENT.md   production deployment guide
```

## Deployment

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for VPS and managed-database setups, the scheduled job, backups and the go-live checklist.
