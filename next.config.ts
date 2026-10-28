import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Static CSP (no per-request nonce) so pages keep their prerendered static shell.
// Payment gateways that use form-POST redirects must be listed in form-action.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "font-src 'self' data:",
  "media-src 'self' blob: https://res.cloudinary.com",
  "connect-src 'self'",
  "frame-src 'self' https://*.getsafepay.com https://checkout.stripe.com",
  "form-action 'self' https://*.jazzcash.com.pk https://*.easypaisa.com.pk https://*.getsafepay.com https://checkout.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  output: "standalone",
  poweredByHeader: false,
  turbopack: {
    // Pin the project root: a stray package-lock.json in a parent folder otherwise makes
    // Turbopack watch too widely (it then reacts to its own dev log and reload-loops).
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    formats: ["image/avif", "image/webp"],
  },
  serverExternalPackages: ["pg"],
  experimental: {
    serverActions: { bodySizeLimit: "6mb" }, // product images & payment receipts
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
