import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getActiveProductSlugs, getCategories, getPublishedPageSlugs } from "@/server/queries/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, pages] = await Promise.all([getActiveProductSlugs(), getCategories(), getPublishedPageSlugs()]);
  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: `${site.url}/category/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${site.url}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...pages.map((p) => ({ url: `${site.url}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.4 })),
    { url: `${site.url}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site.url}/track-order`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
