import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { ReviewActions } from "@/components/admin/forms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/store/stars";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import type { ReviewStatus } from "@/generated/prisma/client";
import { requireStaff } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Reviews" };

const TABS: { key: ReviewStatus; label: string }[] = [
  { key: "PENDING", label: "Waiting for approval" },
  { key: "APPROVED", label: "Published" },
  { key: "REJECTED", label: "Hidden" },
];

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const status = TABS.find((t) => t.key === sp.status)?.key ?? "PENDING";
  const [reviews, counts] = await Promise.all([
    db.review.findMany({ where: { status }, orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } } } }),
    db.review.groupBy({ by: ["status"], _count: true }),
  ]);
  return (
    <>
      <PageHeader title="Reviews" description="New reviews appear in the store only after you approve them." />
      <nav className="flex flex-wrap gap-2" aria-label="Review status">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/reviews?status=${t.key}`} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", status === t.key ? "border-ink bg-ink text-white" : "border-border bg-card")}>
            {t.label} ({counts.find((c) => c.status === t.key)?._count ?? 0})
          </Link>
        ))}
      </nav>
      <Panel>
        {reviews.length === 0 && <p className="py-6 text-center text-muted-foreground">No reviews here.</p>}
        <ul className="divide-y divide-border">
          {reviews.map((r) => (
            <li key={r.id} className="grid gap-2 py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Stars rating={r.rating} />
                <Link href={`/products/${r.product.slug}`} target="_blank" className="font-semibold hover:text-honey-dark">
                  {r.product.name}
                </Link>
                {r.verifiedPurchase && (
                  <Badge variant="success">
                    <BadgeCheck /> Verified buyer
                  </Badge>
                )}
                <span className="ml-auto text-muted-foreground">{r.createdAt.toLocaleDateString("en-PK", { dateStyle: "medium" })}</span>
              </div>
              {r.title && <b>{r.title}</b>}
              <p className="text-ink-2">{r.body}</p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {r.user.name} · {r.user.email}
                </span>
                <ReviewActions id={r.id} status={r.status} canDelete={staff.role === "ADMIN"} />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
