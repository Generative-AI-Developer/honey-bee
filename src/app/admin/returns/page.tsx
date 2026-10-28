import type { Metadata } from "next";
import Link from "next/link";
import { ReturnControls } from "@/components/admin/order-controls";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { orderNumber } from "@/lib/utils";
import { requireStaff } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Returns" };

export default async function ReturnsPage() {
  await requireStaff();
  const returns = await db.returnRequest.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100, include: { order: { select: { id: true, number: true, total: true, customerName: true, paymentMethod: true } } } });
  return (
    <>
      <PageHeader title="Returns" description="Approve a request, then mark the item received to restock it automatically." />
      <Panel>
        {returns.length === 0 && <p className="py-6 text-center text-muted-foreground">No return requests.</p>}
        <ul className="divide-y divide-border">
          {returns.map((r) => (
            <li key={r.id} className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={r.status === "REQUESTED" ? "warning" : r.status === "REJECTED" ? "destructive" : "info"}>{r.status.toLowerCase()}</Badge>
                  <Link href={`/admin/orders/${r.order.id}`} className="font-semibold hover:text-primary-strong">
                    {orderNumber(r.order.number)}
                  </Link>
                  <span className="text-muted-foreground">
                    {r.order.customerName} · {formatPrice(r.order.total)} · {r.createdAt.toLocaleDateString("en-PK", { dateStyle: "medium" })}
                  </span>
                </div>
                <p className="mt-1">
                  <b>{r.reason}</b>
                  {r.details && <span className="text-foreground-soft">: {r.details}</span>}
                </p>
              </div>
              <div className="sm:w-80">
                <ReturnControls returnId={r.id} status={r.status} />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
