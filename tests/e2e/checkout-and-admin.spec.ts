import { expect, test } from "@playwright/test";
import { ADMIN, addFirstProductToCart, fillCheckoutAddress, latestEmailLink, login } from "./helpers";

test.describe.configure({ mode: "serial" });

// Production servers don't write emails to disk; set E2E_NO_EMAIL=1 when testing `next start`.
const noEmail = process.env.E2E_NO_EMAIL === "1";

let orderPath = "";
let orderNo = "";

test("guest checkout with Cash on Delivery", async ({ page }) => {
  const since = Date.now();
  await addFirstProductToCart(page);
  await page.goto("/checkout");
  await fillCheckoutAddress(page, { email: `guest${Date.now()}@example.com`, name: "Guest Buyer" });
  await expect(page.getByRole("radio", { name: /Standard · TCS/ })).toBeVisible();
  await page.getByRole("radio", { name: /Cash on Delivery/ }).click();
  await expect(page.getByText("COD fee", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Place order/ }).click();

  await page.waitForURL(/\/order\//);
  await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();
  orderNo = (await page.locator("p.eyebrow").first().innerText()).match(/HB-\d+/i)?.[0]?.toUpperCase() ?? "";
  orderPath = new URL(page.url()).pathname + new URL(page.url()).search;
  expect(orderNo).toMatch(/^HB-\d+/i);

  if (!noEmail) {
    const link = await latestEmailLink("/order/", since);
    expect(link).toContain(new URL(page.url()).pathname);
  }
});

test("discount codes are validated at checkout", async ({ page }) => {
  await addFirstProductToCart(page, "sidr-beri-honey");
  await page.goto("/checkout");
  await fillCheckoutAddress(page, { email: `disc${Date.now()}@example.com` });
  await page.getByLabel("Discount code").fill("NOTACODE");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("That discount code doesn't exist.")).toBeVisible();
  await page.getByLabel("Discount code").fill("HONEY15");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText(/HONEY15.*applied/)).toBeVisible();
  await expect(page.getByText("Discount", { exact: true })).toBeVisible();
});

test("bank transfer orders show payment instructions", async ({ page }) => {
  await addFirstProductToCart(page, "orange-blossom-honey");
  await page.goto("/checkout");
  await fillCheckoutAddress(page, { email: `bank${Date.now()}@example.com`, city: "Multan" });
  await page.getByRole("radio", { name: /Bank transfer/ }).click();
  await page.getByRole("button", { name: /Place order/ }).click();
  await page.waitForURL(/\/order\//);
  await expect(page.getByRole("heading", { name: "Bank transfer details" })).toBeVisible();
  await expect(page.getByLabel("Upload your payment receipt")).toBeVisible();
});

test("customers can't open the admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("admin moves the order through to delivered and the customer sees it", async ({ page, browser }) => {
  await login(page, ADMIN.email, ADMIN.password, "/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.goto(`/admin/orders?q=${encodeURIComponent(orderNo)}`);
  await page.getByRole("link", { name: orderNo }).click();
  await expect(page.getByRole("heading", { name: `Order ${orderNo}` })).toBeVisible();

  for (const [button, confirm] of [
    ["Confirm order", "Confirm order"],
    ["Mark as packed", "Mark as packed"],
  ] as const) {
    await page.getByRole("button", { name: button }).first().click();
    await page.getByRole("button", { name: confirm }).last().click();
    await expect(page.getByText(/Order marked as/)).toBeVisible();
  }
  await page.getByRole("button", { name: "Mark as shipped" }).first().click();
  await page.getByLabel("Courier").fill("TCS");
  await page.getByLabel("Tracking number").fill("7734129055");
  await page.getByRole("button", { name: "Mark as shipped" }).last().click();
  await expect(page.getByText("Order marked as shipped")).toBeVisible();
  await page.getByRole("button", { name: "Mark as delivered" }).first().click();
  await page.getByRole("button", { name: "Mark as delivered" }).last().click();
  await expect(page.getByText("Order marked as delivered")).toBeVisible();

  const guest = await browser.newPage();
  await guest.goto(orderPath);
  await expect(guest.getByRole("heading", { name: "Delivered. Enjoy!" })).toBeVisible();
  await expect(guest.getByText("Paid", { exact: true })).toBeVisible(); // COD is marked paid on delivery
  await guest.close();
});

test("public order tracking needs the right email", async ({ page }) => {
  await page.goto("/track-order");
  await page.getByLabel("Order number").fill(orderNo);
  await page.getByLabel(/Email or mobile/).fill("wrong@example.com");
  await page.getByRole("button", { name: "Track order" }).click();
  await expect(page.getByText(/couldn't find an order/)).toBeVisible();
  await page.getByLabel(/Email or mobile/).fill("0300 1234567");
  await page.getByRole("button", { name: "Track order" }).click();
  await page.waitForURL(/\/order\//);
  await expect(page.getByText(`Order ${orderNo}`)).toBeVisible();
});

test("sign-up requires email verification, then the account works", async ({ page }) => {
  test.skip(noEmail, "needs development email files (.emails/)");
  const email = `new${Date.now()}@example.com`;
  const since = Date.now();
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Ayesha Khan");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("honey12345");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Check your inbox")).toBeVisible();

  // can't log in before verifying
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("honey12345");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText(/confirm your email first/)).toBeVisible();

  await page.goto(await latestEmailLink("verify-email", since));
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: /Assalam-o-Alaikum, Ayesha/ })).toBeVisible();
});

test("admin can create a product with sizes", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password, "/admin");
  await page.goto("/admin/products/new");
  await expect(page.getByRole("heading", { name: "New product" })).toBeVisible();
  const name = `Test Honey ${Date.now()}`;
  await page.getByLabel("Product name").fill(name);
  await page.getByLabel("Short description").fill("A test honey created by the end-to-end suite.");
  await page.getByLabel("Full description").fill("This product exists only to check that the product editor saves correctly.");
  const skus = page.getByLabel("SKU");
  const prices = page.getByLabel("Price (Rs)");
  for (let i = 0; i < 3; i++) {
    await skus.nth(i).fill(`E2E-${Date.now()}-${i}`);
    await prices.nth(i).fill(String(1000 + i * 500));
  }
  await page.getByRole("button", { name: "Create product" }).click();
  await page.waitForURL(/\/admin\/products\/(?!new)[^/]+$/);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Images" })).toBeVisible();
});
