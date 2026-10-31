import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { ADMIN, login } from "./helpers";

// Banner image slider and product slider, each with its own custom timing (Admin → Banners & pages).
// The owner's saved choices are read first and put back at the end.
test.describe.configure({ mode: "serial" });

let admin: BrowserContext;
let page: Page;
let original: { media: string; bannerN: string; bannerUnit: string; autoSlide: boolean; productN: string; productUnit: string; images: number };

const panel = (title: string) => page.locator("section", { has: page.getByRole("heading", { name: title, exact: true }) });
const toast = (text: string | RegExp) => page.getByText(text).first();

async function setInterval(panelTitle: string, label: string, n: string, unit: "Seconds" | "Minutes") {
  const p = panel(panelTitle);
  // Save stays disabled while the previous save finishes; pressing Enter then would do nothing
  await expect(p.getByRole("button", { name: "Save", exact: true })).toBeEnabled();
  await p.getByLabel(label, { exact: true }).fill(n);
  await p.getByLabel(`${label}: unit`).selectOption({ label: unit });
  await p.getByLabel(label, { exact: true }).press("Enter");
}

test.beforeAll(async ({ browser }) => {
  admin = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  page = await admin.newPage();
  await login(page, ADMIN.email, ADMIN.password, "/admin/content");
  const banner = panel("Home page banner");
  const products = panel("Product slider");
  await expect(banner.getByRole("radiogroup", { name: "Banner shows" })).toBeVisible();
  original = {
    media: (await banner.getByRole("radio", { checked: true }).textContent()) ?? "Video",
    bannerN: await banner.getByLabel("Change image every", { exact: true }).inputValue(),
    bannerUnit: await banner.getByLabel("Change image every: unit").inputValue(),
    autoSlide: await products.getByRole("switch", { name: "Slide products automatically", exact: true }).isChecked(),
    productN: await products.getByLabel("Slide products every", { exact: true }).inputValue(),
    productUnit: await products.getByLabel("Slide products every: unit").inputValue(),
    images: await banner.getByRole("button", { name: /^Remove image/ }).count(),
  };
});

test.afterAll(async () => {
  // restore the owner's settings and delete the test images
  if (!original) return void (await admin?.close());
  const banner = panel("Home page banner");
  const removable = (await banner.getByRole("button", { name: /^Remove image/ }).count()) - original.images;
  for (let i = 0; i < removable; i++) {
    await banner.getByRole("button", { name: /^Remove image/ }).last().click();
    await expect(toast("Image removed")).toBeVisible();
    await page.waitForTimeout(500);
  }
  await banner.getByRole("radio", { name: original.media.trim() }).click();
  const unit = (u: string) => (u === "minutes" ? "Minutes" : "Seconds");
  await setInterval("Home page banner", "Change image every", original.bannerN, unit(original.bannerUnit));
  const products = panel("Product slider");
  const sw = products.getByRole("switch", { name: "Slide products automatically", exact: true });
  if ((await sw.isChecked()) !== original.autoSlide) await sw.click();
  if (original.autoSlide) await setInterval("Product slider", "Slide products every", original.productN, unit(original.productUnit));
  await page.waitForTimeout(1000);
  await admin.close();
});

test("admin uploads images; the banner slides at the chosen interval", async ({ browser }) => {
  test.skip(original.images > 3, "the owner's slider already has more than 3 images (6 is the limit)");
  const banner = panel("Home page banner");
  await banner.locator('input[type="file"][multiple]').setInputFiles(["tests/e2e/fixtures/honey-photo.jpg", "tests/e2e/fixtures/honey-photo.jpg", "tests/e2e/fixtures/honey-photo.jpg"]);
  await expect(toast("3 images added to the slider")).toBeVisible({ timeout: 30_000 });
  await expect(banner.getByRole("button", { name: /^Remove image/ })).toHaveCount(original.images + 3);

  await setInterval("Home page banner", "Change image every", "3", "Seconds");
  await expect(toast("Banner timing saved")).toBeVisible();
  if ((await banner.getByRole("radio", { checked: true }).textContent())?.trim() !== "Image slider") {
    await banner.getByRole("radio", { name: "Image slider" }).click();
    await expect(toast("Banner now shows the image slider")).toBeVisible();
  }

  const guest = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await guest.goto("/");
  const slider = guest.getByRole("region", { name: "Banner images" });
  await expect(slider).toBeVisible();
  await expect(guest.getByRole("heading", { level: 1 })).toBeInViewport();
  await expect(slider).toHaveAttribute("data-slide-index", "0");
  await guest.waitForTimeout(1500);
  await expect(slider).toHaveAttribute("data-slide-index", "0"); // not before the interval
  await expect(slider).toHaveAttribute("data-slide-index", "1", { timeout: 6_000 });
  // arrows work too
  await slider.getByRole("button", { name: "Next image" }).click();
  await expect(slider).toHaveAttribute("data-slide-index", "2");
  await guest.close();
});

test("product slider moves at its own interval; minutes are accepted", async ({ browser }) => {
  const products = panel("Product slider");
  const sw = products.getByRole("switch", { name: "Slide products automatically", exact: true });
  if (!(await sw.isChecked())) {
    await sw.click();
    await expect(toast("Products will slide automatically")).toBeVisible();
  }
  await setInterval("Product slider", "Slide products every", "4", "Seconds");
  await expect(toast("Product slider timing saved")).toBeVisible();

  const guest = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await guest.goto("/");
  const track = guest.locator("[data-product-track]");
  await expect(track).toBeAttached();
  await guest.waitForTimeout(2000);
  expect(await track.evaluate((el) => el.scrollLeft)).toBe(0); // not before the interval
  await expect.poll(() => track.evaluate((el) => el.scrollLeft), { timeout: 8_000 }).toBeGreaterThan(50);
  await guest.close();

  // "1 minute" is saved as 60 seconds and shown back as 1 minute
  await setInterval("Product slider", "Slide products every", "1", "Minutes");
  await expect(products.getByText("Currently every 1 minute.", { exact: false })).toBeVisible();
  // out-of-range values are refused with a clear message
  await setInterval("Product slider", "Slide products every", "1", "Seconds");
  await expect(products.getByText("The shortest interval is 2 seconds.")).toBeVisible();
});
