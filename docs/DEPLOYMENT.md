# Deploying Honey Bee

The app is a standard Node.js server (`next build` with `output: "standalone"`) plus a PostgreSQL database. It runs on any host that can run Node.js 22. No Docker is required.

## Choosing hosting

| Option | Good for | Notes |
|---|---|---|
| **VPS (recommended)**, e.g. a local Pakistani VPS with 2–4 GB RAM | Full control, low latency for Pakistani customers | You run Node + PostgreSQL (or use a hosted database) |
| **Node host + hosted PostgreSQL** (Neon / Supabase, Singapore or Mumbai region) | Less server maintenance | Use the pooled URL for `DATABASE_URL` and the direct URL for `DIRECT_URL` |
| Shared cPanel hosting | Not recommended | Usually only MySQL and ~1 GB RAM; too small to build and run the store reliably |

## 1. Prepare the database

**Hosted (Neon / Supabase):** create a project and copy two connection strings:
- `DATABASE_URL` → the *pooled* string (add `?sslmode=require` if missing)
- `DIRECT_URL` → the *direct* string (used only for migrations)

**On your VPS:**
```bash
sudo apt install postgresql
sudo -u postgres psql -c "CREATE ROLE honeybee WITH LOGIN PASSWORD 'a-strong-password';"
sudo -u postgres createdb -O honeybee honeybee
# DATABASE_URL=postgresql://honeybee:a-strong-password@localhost:5432/honeybee
```

## 2. Install the app (VPS)

```bash
# Node 22 (via nvm or NodeSource), then:
git clone <your-repo> honey-bee && cd honey-bee
cp .env.example .env    # fill in production values (see below)
npm ci
npm run db:deploy       # create tables
npm run db:seed         # optional: sample catalogue + first admin (change the password!)
npm run build           # needs the database to be reachable: catalog pages are prerendered
```

Run it with **PM2** so it restarts on crashes and reboots:
```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup
```

## 3. HTTPS with a reverse proxy

Put Nginx (or Caddy) in front of the app on port 3000. Example Nginx site:
```nginx
server {
  server_name honeybee.pk www.honeybee.pk;
  client_max_body_size 8m;          # product images & receipts
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```
Then `sudo certbot --nginx -d honeybee.pk -d www.honeybee.pk` for a free SSL certificate.

## 4. Production environment variables

Required: `NEXT_PUBLIC_SITE_URL` (your https domain), `DATABASE_URL`, `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `BETTER_AUTH_URL` (same as the site URL), `CRON_SECRET`.

Strongly recommended: `RESEND_API_KEY` + `EMAIL_FROM` (on a verified domain), `ADMIN_NOTIFY_EMAIL`, and Cloudinary keys. Without Cloudinary, image uploads are disabled in production.

WhatsApp new-order alerts: set either the Meta Cloud API keys (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, plus an approved `WHATSAPP_TEMPLATE`) or a free `CALLMEBOT_API_KEY`. See `.env.example` for setup. Then enter the admin's number in Admin → Settings → WhatsApp order alerts and press **Send test message**.

Payments: add each gateway's keys when your merchant account is approved; the checkout shows a method only when its keys are present. Keep the `*_ENV` values on `sandbox` until you have tested a full payment.

## 5. Scheduled job: release unpaid orders

Online-payment orders reserve stock. This job cancels the ones that weren't paid in time and puts their stock back. Run it every 10 minutes:
```bash
crontab -e
*/10 * * * * curl -fsS -H "Authorization: Bearer YOUR_CRON_SECRET" https://honeybee.pk/api/cron/expire-orders > /dev/null
```

## 6. Payment gateway callback URLs

Give these to each provider (replace the domain):

| Provider | Setting | URL |
|---|---|---|
| JazzCash | Return URL (sent automatically per transaction) | `https://honeybee.pk/api/payments/jazzcash/return` |
| Easypaisa | Post-back URL (sent per transaction) | `https://honeybee.pk/api/payments/easypaisa/return` |
| Safepay | Webhook | `https://honeybee.pk/api/webhooks/safepay` |
| Stripe | Webhook (events `checkout.session.*`) | `https://honeybee.pk/api/webhooks/stripe` |

## 7. Backups

Hosted databases include automatic backups. On a VPS, back up nightly:
```bash
# /etc/cron.d/honeybee-backup
0 3 * * * postgres pg_dump -Fc honeybee > /var/backups/honeybee-$(date +\%F).dump && find /var/backups -name 'honeybee-*.dump' -mtime +14 -delete
```
Restore with `pg_restore -d honeybee /var/backups/honeybee-YYYY-MM-DD.dump`. Copy backups off the server too.

## 8. Updating the site

```bash
git pull && npm ci && npm run db:deploy && npm run build && pm2 reload honeybee
```

## Go-live checklist

- [ ] `NEXT_PUBLIC_SITE_URL` / `BETTER_AUTH_URL` set to the real https domain
- [ ] Seeded admin password changed (or a new admin created and the seed one demoted)
- [ ] Sample products replaced with real products, prices, stock and photos
- [ ] Store details, bank account and COD settings filled in (Admin → Settings)
- [ ] Shipping zones and fees match your courier contracts
- [ ] Policies (About, Shipping, Returns, Privacy, Terms) reviewed
- [ ] Email domain verified in Resend; test order emails received
- [ ] Each online gateway tested end-to-end in sandbox, then switched to production
- [ ] Cron job and database backups running
- [ ] Place one real COD order and walk it through to Delivered
