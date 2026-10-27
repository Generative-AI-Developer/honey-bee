import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { cancelExpiredOrders } from "@/server/orders";

// Cancels unpaid online orders after the payment window and puts their stock back.
// Call every 10–15 minutes from your host's cron (see docs/DEPLOYMENT.md):
//   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://your-site/api/cron/expire-orders
export async function GET(req: Request) {
  if (!env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cancelled = await cancelExpiredOrders();
  return NextResponse.json({ cancelled });
}
