import { OrderList } from "@/components/account/order-list";
import { requireUser } from "@/server/auth";
import { getMyOrders } from "@/server/queries/orders";

export default async function MyOrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await getMyOrders(user.id);
  return (
    <section className="card-surface p-5 sm:p-6">
      <h2 className="mb-2 text-xl">Order history</h2>
      <OrderList orders={orders} />
    </section>
  );
}
