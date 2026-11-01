"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { action, ok, UserError } from "@/server/action";
import { assertStaff } from "@/server/auth";
import { tags } from "@/server/queries/catalog";
import { refreshStore } from "@/server/revalidate";
import { deleteImage, storeImage } from "@/services/storage";

const postSchema = z.object({
  id: z.string().max(40).optional(),
  slug: z.string().trim().max(80).optional(),
  title: z.string().trim().min(3, "Add a title.").max(140),
  excerpt: z.string().trim().min(10, "Add a short summary (shown on the blog page).").max(300),
  body: z.string().trim().min(20, "Write the article.").max(100_000),
  seoDescription: z.string().trim().max(170).optional(),
  coverImage: z.string().max(500).nullable().optional(),
  coverPublicId: z.string().max(200).nullable().optional(),
  isPublished: z.boolean(),
});

export const saveBlogPost = action(postSchema, async ({ id, ...d }) => {
  await assertStaff();
  const slug = slugify(d.slug || d.title);
  if (!slug) throw new UserError("Add a title.");
  const clash = await db.blogPost.findFirst({ where: { slug, NOT: id ? { id } : undefined }, select: { id: true } });
  if (clash) throw new UserError(`Another post already uses /blog/${slug}. Change the URL.`);
  const previous = id ? await db.blogPost.findUnique({ where: { id }, select: { publishedAt: true, coverPublicId: true } }) : null;
  if (id && !previous) throw new UserError("That post no longer exists.");
  const data = {
    ...d,
    slug,
    seoDescription: d.seoDescription || null,
    coverImage: d.coverImage || null,
    coverPublicId: d.coverPublicId || null,
    // first publish sets the date; it stays when the post is edited later
    publishedAt: d.isPublished ? (previous?.publishedAt ?? new Date()) : (previous?.publishedAt ?? null),
  };
  const post = id ? await db.blogPost.update({ where: { id }, data }) : await db.blogPost.create({ data });
  if (previous?.coverPublicId && previous.coverPublicId !== data.coverPublicId) await deleteImage(previous.coverPublicId);
  refreshStore(tags.blog);
  refresh();
  return ok({ id: post.id, slug: post.slug }, d.isPublished ? "Post published" : "Draft saved");
});

export const deleteBlogPost = action(z.object({ id: z.string().max(40) }), async ({ id }) => {
  await assertStaff();
  const post = await db.blogPost.delete({ where: { id } }).catch(() => null);
  if (!post) throw new UserError("That post no longer exists.");
  await deleteImage(post.coverPublicId);
  refreshStore(tags.blog);
  refresh();
  return ok(undefined, "Post deleted");
});

/** Uploads a cover image (FormData field "image"); the editor saves it with the post. */
export async function uploadBlogCover(formData: FormData) {
  try {
    await assertStaff();
    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) return { ok: false as const, error: "Choose an image." };
    const stored = await storeImage(file, "blog");
    return { ok: true as const, url: stored.url, publicId: stored.publicId };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Upload failed." };
  }
}
