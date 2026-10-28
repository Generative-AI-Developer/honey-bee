import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Markdown } from "@/lib/markdown";
import { getPage, getPublishedPageSlugs } from "@/server/queries/catalog";

// Content pages managed in Admin → Banners & pages: /about, /shipping, /returns, /faq, /privacy, /terms…
export async function generateStaticParams() {
  const pages = await getPublishedPageSlugs();
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  return { title: page.title, description: page.seoDescription ?? undefined, alternates: { canonical: `/${slug}` } };
}

export default function ContentPage({ params }: PageProps<"/[slug]">) {
  return (
    <Suspense fallback={<div className="container-page max-w-3xl py-16"><div className="h-96 animate-pulse rounded-2xl bg-card" /></div>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/[slug]">, "params">) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <article className="container-page max-w-3xl py-10 lg:py-16">
      <h1 className="mb-6 text-4xl lg:text-5xl">{page.title}</h1>
      <div className="prose-honey text-[1.0625rem]">
        <Markdown source={page.body} />
      </div>
      <p className="mt-10 text-sm text-muted-foreground">Last updated {page.updatedAt.toLocaleDateString("en-PK", { dateStyle: "long" })}</p>
    </article>
  );
}
