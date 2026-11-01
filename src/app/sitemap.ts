import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getPublishedPostSlugs } from "@/server/queries/blog";
import { getActiveProductSlugs, getCategories, getPublishedPageSlugs } from "@/server/queries/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, pages, posts] = await Promise.all([getActiveProductSlugs(), getCategories(), getPublishedPageSlugs(), getPublishedPostSlugs()]);
  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: `${site.url}/category/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${site.url}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...pages.map((p) => ({ url: `${site.url}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.4 })),
    { url: `${site.url}/blog`, changeFrequency: "weekly", priority: 0.6 },
    ...posts.map((p) => ({ url: `${site.url}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
    { url: `${site.url}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site.url}/track-order`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
