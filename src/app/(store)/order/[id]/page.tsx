import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OrderDetail } from "@/components/store/order-detail";
import { getViewableOrder } from "@/server/queries/orders";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

export default function OrderPage({ params, searchParams }: PageProps<"/order/[id]">) {
  return (
    <div className="container-page max-w-5xl py-8 lg:py-12">
      <Suspense fallback={<div className="h-[520px] animate-pulse rounded-2xl bg-card" />}>
        <Order params={params} searchParams={searchParams} />
      </Suspense>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/shop">Continue shopping</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/account/orders">My orders</Link>
        </Button>
      </div>
    </div>
  );
}

async function Order({ params, searchParams }: Pick<PageProps<"/order/[id]">, "params" | "searchParams">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const token = typeof sp.t === "string" ? sp.t : undefined;
  const [order, settings] = await Promise.all([getViewableOrder(id, token), getSettings()]);
  if (!order) notFound();
  return <OrderDetail order={order} settings={settings} paymentNotice={typeof sp.payment === "string" ? sp.payment : undefined} />;
}
