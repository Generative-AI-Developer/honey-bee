import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { requireStaff } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  await requireStaff();
  const posts = await db.blogPost.findMany({ orderBy: [{ isPublished: "asc" }, { publishedAt: "desc" }, { updatedAt: "desc" }], select: { id: true, title: true, slug: true, isPublished: true, publishedAt: true, updatedAt: true } });
  return (
    <>
      <PageHeader
        title="Blog"
        description="Articles shown at /blog. Helpful guides bring visitors from Google and build trust."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/blog/new">
              <Plus /> New post
            </Link>
          </Button>
        }
      />
      <Panel>
        {posts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No posts yet. Click “New post” to write the first one.</p>
        ) : (
          <ul className="divide-y divide-border">
            {posts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/blog/${p.id}`} className="font-semibold hover:text-primary-strong">
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    /blog/{p.slug} · {p.isPublished && p.publishedAt ? `published ${p.publishedAt.toLocaleDateString("en-PK", { dateStyle: "medium" })}` : `edited ${p.updatedAt.toLocaleDateString("en-PK", { dateStyle: "medium" })}`}
                  </p>
                </div>
                <Badge variant={p.isPublished ? "success" : "warning"}>{p.isPublished ? "published" : "draft"}</Badge>
                <Button asChild size="sm" variant="subtle">
                  <Link href={`/admin/blog/${p.id}`}>Edit</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
