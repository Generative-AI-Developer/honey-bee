import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { BlogCard, BlogCover, formatPostDate } from "@/components/store/blog-card";
import { Markdown } from "@/lib/markdown";
import { site } from "@/lib/site";
import { getPost, getPublishedPosts, getPublishedPostSlugs, readingMinutes } from "@/server/queries/blog";

export async function generateStaticParams() {
  const posts = await getPublishedPostSlugs();
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.seoDescription ?? post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { type: "article", title: post.title, description: post.seoDescription ?? post.excerpt, publishedTime: post.publishedAt?.toISOString(), images: post.coverImage ? [post.coverImage] : undefined },
  };
}

export default function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<div className="container-page max-w-3xl py-16"><div className="h-96 animate-pulse rounded-2xl bg-card" /></div>}>
      <Post params={params} />
    </Suspense>
  );
}

async function Post({ params }: Pick<PageProps<"/blog/[slug]">, "params">) {
  const { slug } = await params;
  const [post, all] = await Promise.all([getPost(slug), getPublishedPosts()]);
  if (!post) notFound();
  const more = all.filter((p) => p.slug !== post.slug).slice(0, 3);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.publishedAt?.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          image: post.coverImage ? (post.coverImage.startsWith("http") ? post.coverImage : `${site.url}${post.coverImage}`) : undefined,
          author: { "@type": "Organization", name: site.name },
          publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/logo-mark.png` } },
          mainEntityOfPage: `${site.url}/blog/${post.slug}`,
        }}
      />
      <article className="container-page max-w-3xl pb-14">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-6 pb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <Link href="/blog" className="hover:text-foreground">Blog</Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="truncate font-medium text-foreground" aria-current="page">{post.title}</span>
        </nav>
        <h1 className="text-3xl leading-tight lg:text-5xl">{post.title}</h1>
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          {formatPostDate(post.publishedAt)}
          <span aria-hidden>·</span>
          <Clock className="size-4" aria-hidden /> {readingMinutes(post.body)} min read
        </p>
        <div className="relative mt-7 aspect-[16/9] overflow-hidden rounded-3xl bg-muted">
          <BlogCover src={post.coverImage} alt="" sizes="(max-width: 768px) 100vw, 768px" priority />
        </div>
        <p className="mt-8 text-lg text-foreground-soft">{post.excerpt}</p>
        <div className="prose-honey mt-6 text-[1.0625rem]">
          <Markdown source={post.body} />
        </div>
        <aside className="mt-12 flex flex-col items-start gap-4 rounded-3xl bg-chrome p-6 text-chrome-foreground sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-2xl text-chrome-foreground">Taste the difference</h2>
            <p className="mt-1 text-chrome-muted">Raw, lab-tested honey with Cash on Delivery across Pakistan.</p>
          </div>
          <Button asChild size="lg">
            <Link href="/shop">Shop all products</Link>
          </Button>
        </aside>
      </article>
      {more.length > 0 && (
        <section className="bg-muted py-14" aria-labelledby="more-posts">
          <div className="container-page">
            <h2 id="more-posts" className="mb-6 text-2xl lg:text-3xl">More from the journal</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
