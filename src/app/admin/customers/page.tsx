import type { Metadata } from "next";
import Link from "next/link";
import { RoleSelect } from "@/components/admin/store-forms";
import { EmptyRow, PageHeader, Pager, Panel, Table, Td, Th, withParams } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import type { Prisma } from "@/generated/prisma/client";
import { requireStaff } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Customers" };
const PER_PAGE = 30;

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.UserWhereInput = q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {};
  const [users, total, subscribers] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE, include: { _count: { select: { orders: true } } } }),
    db.user.count({ where }),
    db.newsletterSubscriber.count(),
  ]);
  const spent = await db.order.groupBy({ by: ["userId"], where: { userId: { in: users.map((u) => u.id) }, status: { notIn: ["CANCELLED", "RETURNED"] } }, _sum: { total: true } });

  return (
    <>
      <PageHeader title="Customers" description={`${total.toLocaleString()} accounts · ${subscribers.toLocaleString()} newsletter subscribers`} />
      <form className="flex gap-2" action="/admin/customers">
        <label htmlFor="cq" className="sr-only">
          Search customers
        </label>
        <input id="cq" name="q" defaultValue={q} placeholder="Name, email or phone…" className="h-9 w-72 rounded-full border-[1.5px] border-border bg-card px-4 text-sm outline-none focus:border-ring" />
        <Button size="sm" variant="secondary">
          Search
        </Button>
      </form>
      <Panel padded={false}>
        <Table>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th>Joined</Th>
              <Th className="text-right">Orders</Th>
              <Th className="text-right">Spent</Th>
              <Th>Role</Th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && <EmptyRow colSpan={5}>No customers found.</EmptyRow>}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/60">
                <Td>
                  <b>{u.name}</b> {!u.emailVerified && <Badge variant="warning">unverified</Badge>}
                  <span className="block text-xs text-muted-foreground">
                    {u.email}
                    {u.phone && ` · ${u.phone}`}
                  </span>
                </Td>
                <Td className="text-muted-foreground">{u.createdAt.toLocaleDateString("en-PK", { dateStyle: "medium" })}</Td>
                <Td className="text-right tabular-nums">
                  {u._count.orders > 0 ? (
                    <Link href={`/admin/orders?q=${encodeURIComponent(u.email)}`} className="font-semibold text-primary-strong">
                      {u._count.orders}
                    </Link>
                  ) : (
                    0
                  )}
                </Td>
                <Td className="text-right tabular-nums">{formatPrice(spent.find((s) => s.userId === u.id)?._sum.total ?? 0)}</Td>
                <Td>{staff.role === "ADMIN" ? <RoleSelect userId={u.id} role={u.role} disabled={u.id === staff.id} /> : <Badge variant="outline">{u.role.toLowerCase()}</Badge>}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pager page={page} pageCount={Math.ceil(total / PER_PAGE)} href={(p) => withParams("/admin/customers", sp, { page: p })} />
      </Panel>
    </>
  );
}
