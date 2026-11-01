import type { Metadata } from "next";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "New blog post" };

export default async function NewBlogPostPage() {
  await requireStaff();
  return (
    <>
      <PageHeader back={{ href: "/admin/blog", label: "Blog" }} title="New blog post" description="Write the article, add a cover photo, then publish. Turn “Published” off to keep it as a draft." />
      <BlogPostForm initial={{ slug: "", title: "", excerpt: "", body: "", seoDescription: "", coverImage: null, coverPublicId: null, isPublished: true }} />
    </>
  );
}
