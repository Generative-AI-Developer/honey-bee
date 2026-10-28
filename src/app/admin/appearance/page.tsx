import type { Metadata } from "next";
import { AdminThemeSettings } from "@/components/admin/theme-settings";
import { PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/server/auth";
import { getSettings } from "@/server/settings";

// Private, session-gated page: navigation may wait for the server.
export const instant = false;

export const metadata: Metadata = { title: "Appearance" };

export default async function AppearancePage() {
  await requireStaff("ADMIN");
  const { appearance } = await getSettings();
  return (
    <>
      <PageHeader
        title="Appearance"
        description="Choose the colour scheme and light or dark mode for the entire website: storefront, customer accounts and this admin. Changes apply to every visitor."
      />
      <AdminThemeSettings key={`${appearance.theme}-${appearance.mode}`} saved={appearance} />
    </>
  );
}
