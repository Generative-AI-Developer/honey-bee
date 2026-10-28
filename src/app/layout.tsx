import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { site } from "@/lib/site";
import { THEME_CSS, THEMES } from "@/lib/themes";
import { getSettings } from "@/server/settings";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap", axes: ["opsz"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | Pure Raw Honey in Pakistan`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: "website", siteName: site.name, locale: site.locale, url: site.url },
  twitter: { card: "summary_large_image" },
};

export async function generateViewport(): Promise<Viewport> {
  const { appearance } = await getSettings();
  return {
    // browser UI (mobile address bar) matches the site's header band
    themeColor: THEMES[appearance.theme][appearance.mode].chrome,
    colorScheme: appearance.mode,
    width: "device-width",
    initialScale: 1,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Global theme chosen in Admin → Appearance. getSettings() is cached and tagged "settings",
  // so this adds no database query per request and is part of each page's static shell:
  // the very first paint already has the right colours (no flash, nothing to hydrate).
  const { appearance } = await getSettings();
  return (
    <html lang="en" data-theme={appearance.theme} data-mode={appearance.mode} className={`${inter.variable} ${fraunces.variable} h-full`}>
      <head>
        {/* All six palettes (3 themes × light/dark) as CSS variables; see src/lib/themes.ts */}
        <style id="theme-tokens" dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
      </head>
      {/* Browser extensions (e.g. ColorZilla, Grammarly) add attributes to <body> before React loads;
          this ignores those attribute differences on <body> only. Mismatches inside the page still show. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
        <Toaster position="top-center" richColors theme={appearance.mode} />
      </body>
    </html>
  );
}
