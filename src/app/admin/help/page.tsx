import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/ui";
import { requireStaff } from "@/server/auth";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Setup guide" };

const STEPS = [
  { title: "Add your business details", text: "Store name, phone, WhatsApp and address appear in emails and invoices.", href: "/admin/settings" },
  { title: "Set up payments", text: "Turn Cash on Delivery and bank transfer on/off and enter your bank account. Online gateways switch on automatically when their keys are added to the server.", href: "/admin/settings" },
  { title: "Check delivery charges", text: "Review shipping zones, fees and free-delivery thresholds for your couriers.", href: "/admin/shipping" },
  { title: "Add your products and photos", text: "Replace the sample honey with your real products, prices, sizes and photos. Archive anything you don't sell.", href: "/admin/products" },
  { title: "Write your policies", text: "Edit About, Shipping, Returns, Privacy and Terms so they match how you work.", href: "/admin/content" },
  { title: "Create a launch discount", text: "A first-order code is a great way to get your first customers.", href: "/admin/discounts" },
  { title: "Place a test order", text: "Order something with Cash on Delivery, then move it through Confirm → Packed → Shipped → Delivered here to see the emails customers receive.", href: "/" },
];

export default async function HelpPage() {
  await requireStaff();
  return (
    <>
      <PageHeader title="Setup guide" description="Everything to check before you start selling." />
      <Panel>
        <ol className="grid gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground">{i + 1}</span>
              <div>
                <Link href={s.href} className="font-semibold hover:text-primary-strong">
                  {s.title} →
                </Link>
                <p className="text-sm text-foreground-soft">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
      <Panel title="Daily routine">
        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground-soft">
          <li>Open Orders → <b>Needs action</b>: confirm new orders and verify bank-transfer receipts.</li>
          <li>When a parcel is handed to the courier, mark it <b>Shipped</b> and add the tracking number. The customer is emailed automatically.</li>
          <li>Approve new reviews and handle return requests.</li>
          <li>Restock anything in the Dashboard&apos;s low-stock list through Inventory.</li>
        </ul>
      </Panel>
    </>
  );
}
