import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import type { BlogCard as Card } from "@/server/queries/blog";

export function formatPostDate(d: Date | null) {
  return d ? d.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) : "";
}

/** Cover photo, or a branded honeycomb panel when the post has none. */
export function BlogCover({ src, alt, sizes, priority }: { src: string | null; alt: string; sizes: string; priority?: boolean }) {
  if (src) return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />;
  return (
    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-hero-from to-hero-to">
      <div className="comb-pattern absolute inset-0 opacity-30" aria-hidden />
      <LogoMark className="relative size-20 shadow-card" />
    </div>
  );
}

export function BlogCard({ post, priority }: { post: Card; priority?: boolean }) {
  return (
    <article className="group card-surface flex flex-col overflow-hidden">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-muted" tabIndex={-1} aria-hidden>
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
          <BlogCover src={post.coverImage} alt="" sizes="(max-width: 768px) 100vw, 33vw" priority={priority} />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          {formatPostDate(post.publishedAt)}
          <span aria-hidden>·</span>
          <Clock className="size-3.5" aria-hidden /> {post.minutes} min read
        </p>
        <h2 className="text-xl leading-snug">
          <Link href={`/blog/${post.slug}`} className="hover:text-primary-strong">
            {post.title}
          </Link>
        </h2>
        <p className="text-sm text-foreground-soft">{post.excerpt}</p>
        <Link href={`/blog/${post.slug}`} className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-primary-strong" aria-label={`Read: ${post.title}`}>
          Read article <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
