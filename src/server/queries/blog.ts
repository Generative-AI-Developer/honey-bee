import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { tags } from "@/server/queries/catalog";

const listSelect = { slug: true, title: true, excerpt: true, coverImage: true, publishedAt: true, body: true } as const;

/** Rough reading time for a Markdown article (about 200 words a minute). */
export function readingMinutes(body: string) {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));
}

export type BlogCard = { slug: string; title: string; excerpt: string; coverImage: string | null; publishedAt: Date | null; minutes: number };

/** Published posts, newest first. */
export async function getPublishedPosts(limit?: number): Promise<BlogCard[]> {
  "use cache";
  cacheTag(tags.blog);
  cacheLife("hours");
  const rows = await db.blogPost.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" }, take: limit, select: listSelect });
  return rows.map(({ body, ...r }) => ({ ...r, minutes: readingMinutes(body) }));
}

export async function getPost(slug: string) {
  "use cache";
  cacheTag(tags.blog);
  cacheLife("hours");
  return db.blogPost.findFirst({ where: { slug, isPublished: true } });
}

export async function getPublishedPostSlugs() {
  "use cache";
  cacheTag(tags.blog);
  cacheLife("hours");
  return db.blogPost.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } });
}
