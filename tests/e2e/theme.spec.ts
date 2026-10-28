import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { ADMIN, login } from "./helpers";

test.describe.configure({ mode: "serial" });

const htmlTheme = (page: Page) => page.evaluate(() => [document.documentElement.dataset.theme, document.documentElement.dataset.mode]);
const bodyBackground = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

// One admin session for the whole file (sign-in is rate-limited to 5 per minute).
let adminContext: BrowserContext;
test.beforeAll(async ({ browser }) => {
  adminContext = await browser.newContext();
  const page = await adminContext.newPage();
  await login(page, ADMIN.email, ADMIN.password, "/admin/appearance");
  await page.close();
});
test.afterAll(async () => {
  await adminContext?.close();
});

async function openAppearance() {
  const page = await adminContext.newPage();
  await page.goto("/admin/appearance");
  await expect(page.getByRole("heading", { name: "Appearance" })).toBeVisible();
  return page;
}

test("exactly three colour schemes and a light/dark toggle are offered", async () => {
  const page = await openAppearance();
  const schemes = page.getByRole("radiogroup", { name: "Colour scheme" }).getByRole("radio");
  await expect(schemes).toHaveCount(3);
  await expect(schemes.nth(0)).toHaveAccessibleName(/Golden \/ Champagne/);
  await expect(schemes.nth(1)).toHaveAccessibleName(/Indigo \/ Violet/);
  await expect(schemes.nth(2)).toHaveAccessibleName(/Midnight \/ Electric Blue/);
  await expect(page.getByRole("radiogroup", { name: "Colour mode" }).getByRole("radio")).toHaveCount(2);
});

test("previewing changes only the admin's page until applied", async ({ browser }) => {
  const page = await openAppearance();
  const reset = page.getByRole("button", { name: "Reset to default" });
  if (await reset.isEnabled()) {
    await reset.click();
    await expect(page.getByText(/Reset to Golden/).first()).toBeVisible();
    await expect(page.getByText("Active on the website").locator("..")).toContainText("Golden / Champagne");
  }
  await page.getByRole("radio", { name: /^Indigo/ }).click();
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect.poll(() => htmlTheme(page)).toEqual(["indigo", "dark"]);
  await expect(page.getByText(/Previewing Indigo/)).toBeVisible();

  const guest = await browser.newPage();
  await guest.goto("/");
  expect(await htmlTheme(guest)).toEqual(["golden", "light"]); // not applied yet
  await guest.close();

  await page.getByRole("button", { name: "Discard preview" }).click();
  await expect.poll(() => htmlTheme(page)).toEqual(["golden", "light"]);
});

test("applying a theme updates the whole site for every visitor and persists", async ({ browser }) => {
  const page = await openAppearance();
  await page.getByRole("radio", { name: /^Midnight/ }).click();
  await page.getByRole("radio", { name: "Dark" }).click();
  await page.getByRole("button", { name: "Apply theme" }).click();
  await expect(page.getByText("Theme applied").first()).toBeVisible();
  await expect(page.getByText("Active on the website").locator("..")).toContainText("Midnight / Electric Blue");

  const guest = await browser.newPage();
  for (const path of ["/", "/shop", "/products/sidr-beri-honey", "/login", "/track-order"]) {
    await guest.goto(path);
    expect(await htmlTheme(guest), path).toEqual(["midnight", "dark"]);
  }
  expect(await bodyBackground(guest)).toBe("rgb(11, 18, 32)"); // #0B1220 midnight dark background
  // client-side navigation keeps the theme
  await guest.goto("/");
  await guest.getByRole("link", { name: "Shop", exact: true }).first().click();
  await guest.waitForURL(/\/shop/);
  expect(await htmlTheme(guest)).toEqual(["midnight", "dark"]);
  await guest.close();

  await page.reload();
  expect(await htmlTheme(page)).toEqual(["midnight", "dark"]);
  await page.goto("/admin/orders");
  expect(await htmlTheme(page)).toEqual(["midnight", "dark"]);
});

test("customers cannot open the theme settings", async ({ page }) => {
  await page.goto("/admin/appearance");
  await expect(page).toHaveURL(/\/login/);
});

test("reset to default restores Golden light everywhere", async ({ browser }) => {
  const page = await openAppearance();
  await page.getByRole("button", { name: "Reset to default" }).click();
  await expect(page.getByText(/Reset to Golden/).first()).toBeVisible();
  await expect.poll(() => htmlTheme(page)).toEqual(["golden", "light"]);
  const guest = await browser.newPage();
  await guest.goto("/");
  expect(await htmlTheme(guest)).toEqual(["golden", "light"]);
  expect(await bodyBackground(guest)).toBe("rgb(250, 248, 241)"); // #FAF8F1
  await guest.close();
});
