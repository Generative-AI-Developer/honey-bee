import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orderNumber } from "@/lib/utils";
import { getCurrentUser, isStaff } from "@/server/auth";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";

// GET /api/admin/export/orders?from=YYYY-MM-DD&to=YYYY-MM-DD&status=… → CSV download (staff only)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!isStaff(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const where: Prisma.OrderWhereInput = {};
  const from = sp.get("from");
  const to = sp.get("to");
  if (from || to) where.createdAt = { gte: from ? new Date(from) : undefined, lt: to ? new Date(new Date(to).getTime() + 86_400_000) : undefined };
  const status = sp.get("status");
  if (status) where.status = status as OrderStatus;

  const orders = await db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 10_000, include: { items: true } });
  // Prefix cells that start with formula characters so spreadsheets don't execute them.
  const cell = (v: unknown) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["Order", "Date", "Status", "Payment method", "Payment status", "Customer", "Email", "Phone", "City", "Items", "Subtotal (Rs)", "Discount (Rs)", "Delivery (Rs)", "COD fee (Rs)", "Total (Rs)", "Discount code", "Courier", "Tracking"];
  const rows = orders.map((o) =>
    [
      orderNumber(o.number),
      o.createdAt.toISOString(),
      o.status,
      o.paymentMethod,
      o.paymentStatus,
      o.customerName,
      o.email,
      o.phone,
      (o.shippingAddress as { city?: string }).city,
      o.items.map((i) => `${i.productName} ${i.variantName} x${i.quantity}`).join("; "),
      o.subtotal / 100,
      o.discountTotal / 100,
      o.shippingTotal / 100,
      o.codFee / 100,
      o.total / 100,
      o.discountCode,
      o.courier,
      o.trackingNumber,
    ]
      .map(cell)
      .join(","),
  );
  const csv = "﻿" + [header.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="honeybee-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
