import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/api/", "/cart", "/checkout", "/order/", "/login", "/register", "/reset-password", "/forgot-password"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
