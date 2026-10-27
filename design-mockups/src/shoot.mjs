// Renders every mockup page to desktop + mobile PNGs in design-mockups/.
// Usage: node shoot.mjs   (needs playwright-core resolvable and Google Chrome installed)
import { chromium } from "playwright-core";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const src = dirname(fileURLToPath(import.meta.url));
const out = join(src, "..");
const pages = readdirSync(src).filter((f) => f.endsWith(".html")).sort();
const only = process.argv[2];

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
for (const [label, opts] of [
  ["desktop", { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
  ["mobile", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
]) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  for (const f of pages) {
    if (only && !f.includes(only)) continue;
    await page.goto(pathToFileURL(join(src, f)).href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const file = join(out, f.replace(".html", `-${label}.png`));
    await page.screenshot({ path: file, fullPage: true });
    console.log("saved", file);
  }
  await ctx.close();
}
await browser.close();
