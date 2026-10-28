import type { Metadata } from "next";
import { Download } from "lucide-react";
import { BarList } from "@/components/admin/bar-list";
import { RevenueChart } from "@/components/admin/charts";
import { PageHeader, Panel, StatCard, Table, Td, Th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { requireStaff } from "@/server/auth";
import { getBestSellers, getDailySeries, getPaymentSplit, getSalesSummary, type Range } from "@/server/queries/reports";
import { PAYMENT_LABELS } from "@/services/payments";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Reports" };

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireStaff();
  const sp = await searchParams;
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
  const from = typeof sp.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? new Date(`${sp.from}T00:00:00+05:00`) : defaultFrom;
  const toDay = typeof sp.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.to) ? new Date(`${sp.to}T00:00:00+05:00`) : today;
  const range: Range = { from, to: new Date(toDay.getTime() + 86_400_000) };

  const [summary, series, best, payments, cities] = await Promise.all([
    getSalesSummary(range),
    getDailySeries(range),
    getBestSellers(range, 10),
    getPaymentSplit(range),
    db.$queryRaw<{ city: string; orders: bigint; revenue: bigint }[]>`
      SELECT initcap(lower("shippingAddress"->>'city')) AS city, count(*)::bigint AS orders, sum(total)::bigint AS revenue
      FROM "Order" WHERE "createdAt" >= ${range.from} AND "createdAt" < ${range.to} AND status NOT IN ('CANCELLED','RETURNED')
      GROUP BY 1 ORDER BY 3 DESC LIMIT 10`,
  ]);
  const fromStr = iso(range.from);
  const toStr = iso(toDay);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Sales exclude cancelled and returned orders."
        actions={
          <Button asChild variant="subtle" size="sm">
            <a href={`/api/admin/export/orders?from=${fromStr}&to=${toStr}`}>
              <Download /> Export orders CSV
            </a>
          </Button>
        }
      />
      <form className="flex flex-wrap items-end gap-3" action="/admin/reports">
        <label className="grid gap-1 text-sm">
          From
          <input type="date" name="from" defaultValue={fromStr} className="h-10 rounded-xl border-[1.5px] border-border bg-card px-3" />
        </label>
        <label className="grid gap-1 text-sm">
          To
          <input type="date" name="to" defaultValue={toStr} className="h-10 rounded-xl border-[1.5px] border-border bg-card px-3" />
        </label>
        <Button size="sm" variant="secondary">
          Update
        </Button>
      </form>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatPrice(summary.revenue)} />
        <StatCard label="Orders" value={summary.orders.toLocaleString()} hint={`${summary.unitsSold.toLocaleString()} jars`} />
        <StatCard label="Avg. order value" value={formatPrice(summary.aov)} />
        <StatCard label="Discounts given" value={formatPrice(summary.discounts)} hint={`Delivery charged: ${formatPrice(summary.shipping)}`} />
      </div>
      <Panel title="Daily revenue">
        <RevenueChart data={series} />
      </Panel>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Panel title="Best-selling products" padded={false}>
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th className="text-right">Units</Th>
                <Th className="text-right">Revenue</Th>
              </tr>
            </thead>
            <tbody>
              {best.map((b) => (
                <tr key={b.name}>
                  <Td>{b.name}</Td>
                  <Td className="text-right tabular-nums">{b.units}</Td>
                  <Td className="text-right font-semibold tabular-nums">{formatPrice(b.revenue)}</Td>
                </tr>
              ))}
              {best.length === 0 && (
                <tr>
                  <Td className="text-muted-foreground">No sales in this period.</Td>
                </tr>
              )}
            </tbody>
          </Table>
        </Panel>
        <div className="grid gap-6">
          <Panel title="Revenue by payment method">
            <BarList rows={payments.map((p) => ({ label: PAYMENT_LABELS[p.method], value: p.revenue, display: formatPrice(p.revenue) }))} />
          </Panel>
          <Panel title="Top cities">
            <BarList rows={cities.map((c) => ({ label: c.city ?? "Unknown", value: Number(c.revenue), display: `${formatPrice(Number(c.revenue))} · ${c.orders}` }))} />
          </Panel>
        </div>
      </div>
    </>
  );
}
