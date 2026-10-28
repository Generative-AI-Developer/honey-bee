import Link from "next/link";
import { AlertTriangle, ChevronRight, Plus } from "lucide-react";
import { BarList } from "@/components/admin/bar-list";
import { RevenueChart } from "@/components/admin/charts";
import { EmptyRow, PageHeader, Panel, StatCard, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/store/product-image";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/order-status";
import { cn, orderNumber } from "@/lib/utils";
import { requireStaff } from "@/server/auth";
import { getBestSellers, getDailySeries, getLowStock, getOrdersByStatus, getPaymentSplit, getSalesSummary, pctChange, previousRange, rangeFromDays } from "@/server/queries/reports";
import { PAYMENT_LABELS } from "@/services/payments";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

const RANGES = [7, 30, 90] as const;

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  await requireStaff();
  const sp = await searchParams;
  const days = RANGES.find((d) => String(d) === sp.days) ?? 30;
  const range = rangeFromDays(days);
  const [now, before, series, statuses, payments, best, lowStock, recent] = await Promise.all([
    getSalesSummary(range),
    getSalesSummary(previousRange(range)),
    getDailySeries(range),
    getOrdersByStatus(range),
    getPaymentSplit(range),
    getBestSellers(range),
    getLowStock(),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const delta = (a: number, b: number) => {
    const p = pctChange(a, b);
    return p == null ? { hint: "new this period", tone: "up" as const } : { hint: `${p >= 0 ? "+" : ""}${p}% vs previous ${days} days`, tone: p >= 0 ? ("up" as const) : ("down" as const) };
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Last ${days} days · ${new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
        actions={
          <>
            <nav className="flex rounded-full border border-border bg-card p-1 text-sm" aria-label="Date range">
              {RANGES.map((d) => (
                <Link key={d} href={`/admin?days=${d}`} aria-current={d === days ? "true" : undefined} className={cn("rounded-full px-3.5 py-1.5 font-medium", d === days ? "bg-inverse text-inverse-foreground" : "hover:bg-muted")}>
                  {d}d
                </Link>
              ))}
            </nav>
            <Button asChild size="sm">
              <Link href="/admin/products/new">
                <Plus /> Add product
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatPrice(now.revenue)} {...delta(now.revenue, before.revenue)} />
        <StatCard label="Orders" value={now.orders.toLocaleString()} {...delta(now.orders, before.orders)} />
        <StatCard label="Avg. order value" value={formatPrice(now.aov)} {...delta(now.aov, before.aov)} />
        <StatCard label="New customers" value={now.newCustomers.toLocaleString()} hint={`${now.unitsSold.toLocaleString()} jars sold`} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.75fr_1fr]">
        <Panel title="Revenue" description="Daily, excluding cancelled and returned orders">
          <RevenueChart data={series} />
        </Panel>
        <Panel title="Orders by status" description={`${statuses.reduce((s, x) => s + x.count, 0)} orders placed`}>
          <BarList rows={statuses.filter((s) => s.count > 0).map((s) => ({ label: ORDER_STATUS[s.status].label, value: s.count }))} />
          {statuses.every((s) => s.count === 0) && <p className="text-sm text-muted-foreground">No orders in this period yet.</p>}
          <h3 className="mt-6 mb-3 font-sans text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">Payment methods</h3>
          <BarList rows={payments.map((p) => ({ label: PAYMENT_LABELS[p.method], value: p.orders }))} />
        </Panel>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.75fr_1fr]">
        <Panel
          title="Recent orders"
          padded={false}
          actions={
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-strong">
              View all <ChevronRight className="size-4" />
            </Link>
          }
        >
          <Table>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Payment</Th>
                <Th className="text-right">Total</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && <EmptyRow colSpan={5}>No orders yet.</EmptyRow>}
              {recent.map((o) => (
                <tr key={o.id} className="hover:bg-muted/60">
                  <Td>
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-primary-strong">
                      {orderNumber(o.number)}
                    </Link>
                  </Td>
                  <Td>
                    {o.customerName}
                    <span className="block text-xs text-muted-foreground">{(o.shippingAddress as { city?: string }).city}</span>
                  </Td>
                  <Td>
                    <span className="block text-xs">{PAYMENT_LABELS[o.paymentMethod]}</span>
                    <Badge variant={PAYMENT_STATUS[o.paymentStatus].tone}>{PAYMENT_STATUS[o.paymentStatus].label}</Badge>
                  </Td>
                  <Td className="text-right font-semibold tabular-nums">{formatPrice(o.total)}</Td>
                  <Td>
                    <Badge variant={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>

        <div className="grid gap-6">
          <Panel title="Best sellers" description={`Last ${days} days`}>
            {best.length === 0 && <p className="text-sm text-muted-foreground">No sales yet.</p>}
            <ul className="grid gap-3">
              {best.map((b) => (
                <li key={b.name} className="flex items-center gap-3 text-sm">
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-muted">
                    <ProductImage src={b.image} alt="" sizes="44px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate">{b.name}</b>
                    <span className="text-muted-foreground">{b.units} sold</span>
                  </div>
                  <b className="tabular-nums">{formatPrice(b.revenue)}</b>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel
            title="Low stock"
            actions={lowStock.length > 0 && <Badge variant="destructive">{lowStock.length} alerts</Badge>}
          >
            {lowStock.length === 0 && <p className="text-sm text-muted-foreground">All products are well stocked.</p>}
            <ul className="grid gap-2.5">
              {lowStock.map((v) => (
                <li key={v.id} className="flex items-center gap-3 text-sm">
                  <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">
                    {v.productName} · {v.name}
                  </span>
                  <b className="text-destructive tabular-nums">{v.stock} left</b>
                  <Link href={`/admin/inventory?q=${encodeURIComponent(v.sku)}`} className="text-xs font-semibold text-primary-strong">
                    Restock
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
