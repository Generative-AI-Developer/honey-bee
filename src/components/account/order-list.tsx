import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/store/product-image";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS } from "@/lib/order-status";
import { orderNumber, pluralize } from "@/lib/utils";
import type { getMyOrders } from "@/server/queries/orders";

export function OrderList({ orders }: { orders: Awaited<ReturnType<typeof getMyOrders>> }) {
  if (orders.length === 0) {
    return (
      <div className="grid justify-items-center gap-3 py-8 text-center">
        <p className="text-foreground-soft">You haven&apos;t placed any orders yet.</p>
        <Button asChild>
          <Link href="/shop">Start shopping</Link>
        </Button>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {orders.map((o) => {
        const s = ORDER_STATUS[o.status];
        return (
          <li key={o.id} className="flex flex-wrap items-center gap-3 py-4 sm:flex-nowrap sm:gap-4">
            <div className="flex">
              {o.items.slice(0, 3).map((i, idx) => (
                <div key={idx} className="relative -ml-2.5 size-11 overflow-hidden rounded-xl border-2 border-card bg-muted first:ml-0">
                  <ProductImage src={i.imageUrl} alt="" sizes="44px" />
                </div>
              ))}
            </div>
            <div className="min-w-[140px] flex-1">
              <b className="block">{orderNumber(o.number)}</b>
              <span className="text-sm text-muted-foreground">
                {o.createdAt.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })} · {pluralize(o._count.items, "item")}
              </span>
            </div>
            <Badge variant={s.tone}>{s.label}</Badge>
            <b className="w-24 text-right">{formatPrice(o.total)}</b>
            <Button asChild variant="outline" size="sm">
              <Link href={`/account/orders/${o.id}`}>View</Link>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
