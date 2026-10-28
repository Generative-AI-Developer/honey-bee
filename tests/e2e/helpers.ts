import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

export const ADMIN = { email: process.env.SEED_ADMIN_EMAIL ?? "admin@honeybee.pk", password: process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!" };

/** In development emails are written to .emails/. Returns the newest link containing `contains` sent after `since`. */
export async function latestEmailLink(contains: string, since: number): Promise<string> {
  const dir = path.join(process.cwd(), ".emails");
  for (let attempt = 0; attempt < 30; attempt++) {
    const files = await readdir(dir).catch(() => [] as string[]);
    const fresh: { file: string; mtime: number }[] = [];
    for (const f of files) {
      const s = await stat(path.join(dir, f));
      if (s.mtimeMs >= since) fresh.push({ file: f, mtime: s.mtimeMs });
    }
    for (const { file } of fresh.sort((a, b) => b.mtime - a.mtime)) {
      const html = await readFile(path.join(dir, file), "utf8");
      const link = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!.replace(/&amp;/g, "&")).find((l) => l.includes(contains));
      if (link) return link;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No email link containing "${contains}" found`);
}

export async function login(page: Page, email: string, password: string, next = "/account") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((u) => u.pathname.startsWith(next));
}

export async function addFirstProductToCart(page: Page, slug = "acacia-phulai-honey") {
  await page.goto(`/products/${slug}`);
  await page.getByRole("button", { name: /Add to cart/ }).click();
  await expect(page.getByText(/added to cart/i)).toBeVisible();
}

export async function fillCheckoutAddress(page: Page, opts: { email?: string; name?: string; city?: string } = {}) {
  if (opts.email) await page.getByLabel("Email", { exact: true }).fill(opts.email);
  await page.getByLabel("Full name").fill(opts.name ?? "Test Customer");
  await page.getByLabel("Mobile number").fill("0300 1234567");
  await page.getByLabel("Address", { exact: true }).fill("House 24, Street 7, DHA Phase 5");
  await page.getByLabel("City").fill(opts.city ?? "Lahore");
  await page.getByLabel("Province").selectOption("Punjab");
}
