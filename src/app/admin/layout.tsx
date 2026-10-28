import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminSidebar, AdminTopbar } from "@/components/admin/admin-shell";
import { db } from "@/lib/db";
import { requireStaff } from "@/server/auth";

// Private, session-gated area: navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-cream" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const [pendingOrders, pendingReviews, openReturns] = await Promise.all([
    db.order.count({ where: { OR: [{ status: "PENDING" }, { paymentStatus: "PENDING", paymentMethod: { in: ["BANK_TRANSFER", "EASYPAISA"] }, status: { not: "CANCELLED" } }] } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.returnRequest.count({ where: { status: { in: ["REQUESTED", "APPROVED"] } } }),
  ]);
  const counts = { orders: pendingOrders, reviews: pendingReviews, returns: openReturns };
  return (
    <div className="grid min-h-screen lg:grid-cols-[252px_1fr]">
      <div className="hidden bg-ink lg:block print:hidden">
        <AdminSidebar role={user.role} counts={counts} className="flex" />
      </div>
      <div className="min-w-0">
        <AdminTopbar user={{ name: user.name, role: user.role }} counts={counts} />
        <main className="mx-auto grid max-w-[1400px] gap-6 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
