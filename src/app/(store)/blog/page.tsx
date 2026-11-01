import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, NotebookPen } from "lucide-react";
import { BlogCard } from "@/components/store/blog-card";
import { getPublishedPosts } from "@/server/queries/blog";

export const metadata: Metadata = {
  title: "Blog: honey guides and tips",
  description: "Guides to choosing pure raw honey, how to store it, honey varieties of Pakistan and tips for enjoying it every day.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  return (
    <div className="container-page pb-20">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-6 pb-3 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground" aria-current="page">Blog</span>
      </nav>
      <header className="mb-10 max-w-2xl">
        <span className="eyebrow mb-2">From our honey shop</span>
        <h1 className="text-3xl lg:text-5xl">The honey journal</h1>
        <p className="mt-3 text-lg text-foreground-soft">Practical guides to choosing, storing and enjoying pure honey, and the stories behind Pakistan&apos;s favourite varieties.</p>
      </header>
      {posts.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <BlogCard key={p.slug} post={p} priority={i < 3} />
          ))}
        </div>
      ) : (
        <div className="grid place-items-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <NotebookPen className="mb-3 size-10 text-muted-foreground" aria-hidden />
          <h2 className="text-2xl">New articles are on the way</h2>
          <p className="mt-2 max-w-sm text-foreground-soft">In the meantime, browse our honey or ask us anything on WhatsApp.</p>
          <Link href="/shop" className="mt-5 font-semibold text-primary-strong">Shop all products</Link>
        </div>
      )}
    </div>
  );
}
