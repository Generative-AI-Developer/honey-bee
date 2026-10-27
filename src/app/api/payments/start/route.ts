import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth";
import { orderUrl, verifyOrderAccessToken } from "@/server/order-access";
import { isOnlineMethod } from "@/services/payments";
import { autoPostResponse, startOnlinePayment } from "@/services/payments/start";

// GET /api/payments/start?order=<id>&t=<token> → hands the customer over to the payment gateway.
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("order") ?? "";
  const token = req.nextUrl.searchParams.get("t");
  const order = orderId ? await db.order.findUnique({ where: { id: orderId } }) : null;
  if (!order) return NextResponse.redirect(new URL("/", req.url));

  const user = await getCurrentUser();
  if (!verifyOrderAccessToken(order.id, token) && order.userId !== user?.id) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const back = new URL(orderUrl(order.id), req.url);

  const payable =
    isOnlineMethod(order.paymentMethod) &&
    order.status === "PENDING" &&
    (order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED") &&
    (!order.expiresAt || order.expiresAt > new Date());
  if (!payable) return NextResponse.redirect(back);

  try {
    const start = await startOnlinePayment(order);
    if (start.kind === "redirect") return NextResponse.redirect(start.url, 303);
    return autoPostResponse(start.action, start.fields);
  } catch (e) {
    console.error("[payments] start failed", order.id, e);
    back.searchParams.set("payment", "error");
    return NextResponse.redirect(back, 303);
  }
}
