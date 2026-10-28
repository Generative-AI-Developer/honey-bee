import type { Metadata } from "next";
import { DiscountRowActions, NewDiscount } from "@/components/admin/store-forms";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { requireStaff } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Discounts" };

const d = (v: Date | null) => (v ? v.toISOString().slice(0, 10) : "");

export default async function DiscountsPage() {
  await requireStaff();
  const discounts = await db.discount.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "desc" }], include: { _count: { select: { redemptions: true } }, redemptions: { select: { amount: true } } } });
  const now = new Date();
  return (
    <>
      <PageHeader title="Discount codes" description="Customers enter codes at checkout. Every rule is checked on the server." />
      <NewDiscount />
      <Panel padded={false}>
        <ul className="divide-y divide-border">
          {discounts.length === 0 && <li className="p-6 text-muted-foreground">No discount codes yet.</li>}
          {discounts.map((x) => {
            const expired = x.endsAt && x.endsAt < now;
            const used = x.usageLimit != null && x.usedCount >= x.usageLimit;
            const saved = x.redemptions.reduce((s, r) => s + r.amount, 0);
            return (
              <li key={x.id} className="grid items-center gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:px-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="font-mono text-base">{x.code}</b>
                    <Badge variant={!x.isActive ? "outline" : expired || used ? "destructive" : "success"}>{!x.isActive ? "paused" : expired ? "expired" : used ? "used up" : "active"}</Badge>
                    {x.firstOrderOnly && <Badge variant="info">first order</Badge>}
                  </div>
                  <p className="text-sm text-foreground-soft">
                    {x.type === "PERCENT" ? `${x.value}% off` : x.type === "FIXED" ? `${formatPrice(x.value)} off` : "Free delivery"}
                    {x.minSubtotal > 0 && ` · min ${formatPrice(x.minSubtotal)}`}
                    {x.maxDiscount && ` · max ${formatPrice(x.maxDiscount)}`}
                    {x.endsAt && ` · until ${x.endsAt.toLocaleDateString("en-PK", { dateStyle: "medium" })}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Used {x.usedCount}
                    {x.usageLimit ? `/${x.usageLimit}` : ""} times · {formatPrice(saved)} given in discounts{x.description ? ` · ${x.description}` : ""}
                  </p>
                </div>
                <DiscountRowActions
                  discount={{
                    id: x.id,
                    code: x.code,
                    description: x.description ?? "",
                    type: x.type,
                    value: String(x.type === "FIXED" ? x.value / 100 : x.value),
                    minSubtotal: String(x.minSubtotal / 100),
                    maxDiscount: x.maxDiscount ? String(x.maxDiscount / 100) : "",
                    usageLimit: x.usageLimit ? String(x.usageLimit) : "",
                    perUserLimit: x.perUserLimit ? String(x.perUserLimit) : "",
                    firstOrderOnly: x.firstOrderOnly,
                    startsAt: d(x.startsAt),
                    endsAt: d(x.endsAt),
                    isActive: x.isActive,
                  }}
                />
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
