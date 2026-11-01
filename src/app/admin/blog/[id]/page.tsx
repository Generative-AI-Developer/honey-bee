import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireStaff } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Edit blog post" };

export default async function EditBlogPostPage({ params }: PageProps<"/admin/blog/[id]">) {
  await requireStaff();
  const { id } = await params;
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) notFound();
  return (
    <>
      <PageHeader back={{ href: "/admin/blog", label: "Blog" }} title={post.title} />
      <BlogPostForm
        initial={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          body: post.body,
          seoDescription: post.seoDescription ?? "",
          coverImage: post.coverImage,
          coverPublicId: post.coverPublicId,
          isPublished: post.isPublished,
        }}
      />
    </>
  );
}
