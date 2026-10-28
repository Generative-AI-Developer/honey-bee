import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/store/order-detail";
import { requireUser } from "@/server/auth";
import { getViewableOrder } from "@/server/queries/orders";
import { getSettings } from "@/server/settings";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export default async function MyOrderPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);
  const [order, settings] = await Promise.all([getViewableOrder(id), getSettings()]);
  if (!order || order.userId !== user.id) notFound();
  return <OrderDetail order={order} settings={settings} canRequestReturn />;
}
