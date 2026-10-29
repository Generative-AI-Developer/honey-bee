import type { Metadata } from "next";
import Link from "next/link";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "@/components/admin/store-forms";
import { TestWhatsAppButton } from "@/components/admin/test-whatsapp-button";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { requireStaff } from "@/server/auth";
import { getSettings } from "@/server/settings";
import { configuredGateways } from "@/services/payments";
import { whatsAppProvider } from "@/services/whatsapp";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireStaff("ADMIN");
  const s = await getSettings();
  const gw = configuredGateways();
  const wa = whatsAppProvider();
  const integrations = [
    { name: "JazzCash", on: gw.JAZZCASH, env: "JAZZCASH_*" },
    { name: "Easypaisa", on: gw.EASYPAISA, env: "EASYPAISA_*" },
    { name: "Safepay (cards)", on: gw.SAFEPAY, env: "SAFEPAY_*" },
    { name: "Stripe", on: gw.STRIPE, env: "STRIPE_*" },
    { name: wa === "callmebot" ? "WhatsApp alerts (CallMeBot)" : "WhatsApp alerts (Cloud API)", on: wa !== null, env: wa === "callmebot" ? "CALLMEBOT_API_KEY" : "WHATSAPP_*" },
    { name: "Email (Resend)", on: Boolean(process.env.RESEND_API_KEY), env: "RESEND_API_KEY" },
    { name: "Image storage (Cloudinary)", on: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY), env: "CLOUDINARY_*" },
    { name: "Google sign-in", on: Boolean(process.env.GOOGLE_CLIENT_ID), env: "GOOGLE_CLIENT_*" },
  ];
  return (
    <>
      <PageHeader
        title="Settings"
        description="Business details used across the store, emails and invoices."
        actions={
          <Button asChild variant="subtle" size="sm">
            <Link href="/admin/appearance">
              <Palette /> Theme &amp; dark mode
            </Link>
          </Button>
        }
      />
      <SettingsSection
        settingsKey="store"
        title="Store"
        values={s.store}
        fields={[
          { key: "name", label: "Store name" },
          { key: "email", label: "Contact email" },
          { key: "phone", label: "Phone" },
          { key: "whatsapp", label: "WhatsApp number" },
          { key: "address", label: "Address", type: "textarea" },
          { key: "announcement", label: "Announcement bar", type: "textarea", hint: "Shown at the very top of every page. Leave empty to hide." },
        ]}
      />
      <SettingsSection
        settingsKey="cod"
        title="Cash on Delivery"
        values={s.cod}
        fields={[
          { key: "enabled", label: "Offer Cash on Delivery", type: "bool" },
          { key: "fee", label: "COD fee (Rs)", type: "money" },
          { key: "maxOrderTotal", label: "Maximum order for COD (Rs)", type: "money-nullable", hint: "Leave empty for no limit." },
        ]}
      />
      <SettingsSection
        settingsKey="bankTransfer"
        title="Bank transfer"
        values={s.bankTransfer}
        fields={[
          { key: "enabled", label: "Offer bank transfer", type: "bool" },
          { key: "bankName", label: "Bank" },
          { key: "accountTitle", label: "Account title" },
          { key: "accountNumber", label: "Account number" },
          { key: "iban", label: "IBAN" },
          { key: "instructions", label: "Instructions for customers", type: "textarea" },
        ]}
      />
      <SettingsSection
        settingsKey="whatsappAlerts"
        title="WhatsApp order alerts"
        description={`Sends you a WhatsApp message with the customer's name whenever a new order is placed.${wa ? "" : " WhatsApp isn't connected yet (see Integrations below), so alerts only appear in the server log."}`}
        values={s.whatsappAlerts}
        fields={[
          { key: "enabled", label: "Send me a WhatsApp message for every new order", type: "bool" },
          { key: "to", label: "Admin WhatsApp number", hint: `With country code, e.g. +92 300 1234567. Leave empty to use the store's WhatsApp number (${s.store.whatsapp || "not set"}).` },
        ]}
        saveLabel="Save WhatsApp alerts"
        extra={<TestWhatsAppButton />}
      />
      <SettingsSection
        settingsKey="orders"
        title="Orders"
        values={s.orders}
        fields={[
          { key: "paymentWindowMinutes", label: "Online payment window (minutes)", type: "number", hint: "Unpaid JazzCash/Easypaisa/card orders are cancelled after this." },
          { key: "returnWindowDays", label: "Return window (days)", type: "number" },
        ]}
      />
      <SettingsSection
        settingsKey="social"
        title="Social links"
        values={s.social}
        fields={[
          { key: "facebook", label: "Facebook URL" },
          { key: "instagram", label: "Instagram URL" },
          { key: "youtube", label: "YouTube URL" },
        ]}
      />
      <Panel title="Integrations" description="Keys are set as environment variables on the server (see .env.example), never here.">
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {integrations.map((i) => (
            <li key={i.name} className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
              <span>
                {i.name} <code className="text-xs text-muted-foreground">{i.env}</code>
              </span>
              <Badge variant={i.on ? "success" : "outline"}>{i.on ? "connected" : "not set"}</Badge>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
