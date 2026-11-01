"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/components/admin/forms";
import { slugify } from "@/lib/utils";
import { deleteBlogPost, saveBlogPost, uploadBlogCover } from "@/server/actions/admin/blog";

export type BlogPostValues = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  seoDescription: string;
  coverImage: string | null;
  coverPublicId: string | null;
  isPublished: boolean;
};

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">{label}</span>
        {children}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Admin → Blog: write or edit an article. Body is Markdown (same as information pages). */
export function BlogPostForm({ initial }: { initial: BlogPostValues }) {
  const [p, setP] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { pending, run } = useAction();
  const router = useRouter();
  const slug = p.slug || slugify(p.title);

  const save = (isPublished: boolean) =>
    run(
      () => saveBlogPost({ ...p, isPublished }),
      (data) => {
        setP({ ...p, isPublished, slug: data.slug, id: data.id });
        if (!p.id) router.replace(`/admin/blog/${data.id}`);
      },
    );

  return (
    <form
      className="grid gap-6 lg:grid-cols-[1fr_320px]"
      onSubmit={(e) => {
        e.preventDefault();
        save(p.isPublished);
      }}
    >
      <div className="grid content-start gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <Field label="Title">
          <Input value={p.title} maxLength={140} onChange={(e) => setP({ ...p, title: e.target.value })} required placeholder="e.g. How to tell pure honey from fake" />
        </Field>
        <Field label="Summary" hint="One or two sentences. Shown on the blog page and at the top of the article.">
          <Textarea rows={3} maxLength={300} value={p.excerpt} onChange={(e) => setP({ ...p, excerpt: e.target.value })} required />
        </Field>
        <Field label="Article" hint="Markdown: ## Heading, ### Smaller heading, **bold**, *italic*, - list item, [link text](/shop)">
          <Textarea rows={22} className="font-mono text-sm" value={p.body} onChange={(e) => setP({ ...p, body: e.target.value })} required />
        </Field>
      </div>

      <div className="grid content-start gap-4">
        <div className="grid gap-4 rounded-2xl border border-border bg-card p-5">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              <b className="block">Published</b>
              <span className="text-muted-foreground">{p.isPublished ? "Visible on the blog" : "Draft: only admins can see it"}</span>
            </span>
            <Switch checked={p.isPublished} onCheckedChange={(v) => setP({ ...p, isPublished: v })} aria-label="Published" />
          </label>
          <Button disabled={pending || uploading}>
            {pending && <Loader2 className="animate-spin" />} {p.id ? "Save post" : p.isPublished ? "Publish post" : "Save draft"}
          </Button>
          {p.id && p.isPublished && (
            <Link href={`/blog/${slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-strong">
              View on the store <ExternalLink className="size-3.5" />
            </Link>
          )}
        </div>

        <div className="grid gap-3 rounded-2xl border border-border bg-card p-5">
          <span className="text-sm font-medium">Cover image</span>
          {p.coverImage ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
              <Image src={p.coverImage} alt="" fill sizes="320px" className="object-cover" />
              <button
                type="button"
                onClick={() => setP({ ...p, coverImage: null, coverPublicId: null })}
                aria-label="Remove cover image"
                className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground focus-within:ring-3 focus-within:ring-ring/50 hover:border-foreground-soft">
              {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
              {uploading ? "Uploading…" : "Add a landscape photo (1600×900 works well)"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setUploading(true);
                  const form = new FormData();
                  form.set("image", file);
                  const res = await uploadBlogCover(form);
                  setUploading(false);
                  if (!res.ok) return void toast.error(res.error);
                  setP((cur) => ({ ...cur, coverImage: res.url, coverPublicId: res.publicId }));
                  toast.success("Cover added. Save the post to keep it.");
                }}
              />
            </label>
          )}
          <p className="text-xs text-muted-foreground">Without a cover, the post shows a honeycomb panel with your logo.</p>
        </div>

        <div className="grid gap-4 rounded-2xl border border-border bg-card p-5">
          <Field label="URL" hint={`/blog/${slug || "…"}`}>
            <Input value={p.slug} placeholder={slugify(p.title) || "made from the title"} onChange={(e) => setP({ ...p, slug: e.target.value })} />
          </Field>
          <Field label="Search engine description" hint="Optional; the summary is used when empty.">
            <Textarea rows={3} maxLength={170} value={p.seoDescription} onChange={(e) => setP({ ...p, seoDescription: e.target.value })} />
          </Field>
        </div>

        {p.id && (
          <div className="rounded-2xl border border-border bg-card p-5">
            {confirmDelete ? (
              <div className="grid gap-2">
                <p className="text-sm">Delete this post for good?</p>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => run(() => deleteBlogPost({ id: p.id! }), () => router.push("/admin/blog"))}>
                    Yes, delete
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 /> Delete post
              </Button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
