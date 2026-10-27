import Link from "next/link";
import { MapPin, Package, Wallet } from "lucide-react";
import { OrderList } from "@/components/account/order-list";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getMyOrders } from "@/server/queries/orders";

export default async function AccountOverviewPage() {
  const user = await requireUser("/account");
  const [orders, addressCount, spent] = await Promise.all([
    getMyOrders(user.id),
    db.address.count({ where: { userId: user.id } }),
    db.order.aggregate({ where: { userId: user.id, status: { notIn: ["CANCELLED", "RETURNED"] } }, _sum: { total: true } }),
  ]);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Package} label="Orders" value={String(orders.length)} href="/account/orders" />
        <Stat icon={Wallet} label="Total spent" value={formatPrice(spent._sum.total ?? 0)} />
        <Stat icon={MapPin} label="Saved addresses" value={String(addressCount)} href="/account/addresses" />
      </div>
      <section className="card-surface p-5 sm:p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xl">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-semibold text-honey-dark">
            View all
          </Link>
        </div>
        <OrderList orders={orders.slice(0, 5)} />
      </section>
    </>
  );
}

function Stat({ icon: Icon, label, value, href }: { icon: typeof Package; label: string; value: string; href?: string }) {
  const inner = (
    <>
      <Icon className="size-10 rounded-xl bg-honey-light p-2.5 text-honey-dark" />
      <div>
        <span className="text-sm text-muted-foreground">{label}</span>
        <b className="block font-heading text-2xl">{value}</b>
      </div>
    </>
  );
  return href ? (
    <Link href={href} className="card-surface flex items-center gap-4 p-5 hover:border-ink-2">
      {inner}
    </Link>
  ) : (
    <div className="card-surface flex items-center gap-4 p-5">{inner}</div>
  );
}
