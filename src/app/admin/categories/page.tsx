import type { Metadata } from "next";
import { CategoryRow, NewCategory } from "@/components/admin/forms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireStaff } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireStaff();
  const categories = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
  return (
    <>
      <PageHeader title="Categories" description="Group products for the shop menu and filters." actions={<NewCategory />} />
      <Panel>
        <div className="divide-y divide-border">
          {categories.map((c) => (
            <CategoryRow
              key={c.id}
              productCount={c._count.products}
              category={{ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", sortOrder: c.sortOrder, isActive: c.isActive, seoTitle: c.seoTitle ?? "", seoDescription: c.seoDescription ?? "" }}
            />
          ))}
          {categories.length === 0 && <p className="py-6 text-muted-foreground">No categories yet.</p>}
        </div>
      </Panel>
    </>
  );
}
