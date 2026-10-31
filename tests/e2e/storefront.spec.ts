import { expect, test } from "@playwright/test";

test("home page shows the catalogue and links work", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/honey/i);
  await expect(page.getByRole("heading", { name: "Bestselling honey" })).toBeVisible();
  await page.getByRole("link", { name: /Sidr \(Beri\) Honey/ }).first().click();
  await expect(page).toHaveURL(/\/products\/sidr-beri-honey/);
  await expect(page.getByRole("heading", { level: 1, name: "Sidr (Beri) Honey" })).toBeVisible();
});

test("search and filters narrow the shop", async ({ page }) => {
  await page.goto("/shop?q=kalonji");
  await expect(page.getByText(/result.*for/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Black Seed \(Kalonji\) Honey/ }).first()).toBeVisible();
  await page.goto("/shop?q=zzzznotahoney");
  await expect(page.getByText("No honey matches that")).toBeVisible();
  await page.goto("/category/gift-boxes");
  await expect(page.getByRole("heading", { level: 1, name: "Gift Boxes" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Harvest Gift Box/ }).first()).toBeVisible();
});

test("centred category badges switch category and keep the sort", async ({ page }) => {
  await page.goto("/shop?sort=price-asc");
  const categories = page.getByRole("navigation", { name: "Categories" });
  await expect(categories.getByRole("link", { name: /All honey/ })).toHaveAttribute("aria-current", "page");
  await categories.getByRole("link", { name: /Gift Boxes/ }).click();
  await expect(page).toHaveURL(/\/category\/gift-boxes\?sort=price-asc/);
  await expect(categories.getByRole("link", { name: /Gift Boxes/ })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("button", { name: /Jar size|Filters/ })).toHaveCount(0);
});

test("product page lets you pick a size and add it to the cart", async ({ page }) => {
  await page.goto("/products/wild-forest-honey");
  await page.getByRole("button", { name: /^1kg/ }).click();
  await expect(page.getByRole("button", { name: /Add to cart · Rs 5,300/ })).toBeVisible();
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.getByRole("button", { name: /Add to cart · Rs 10,600/ })).toBeVisible();
  await page.getByRole("button", { name: /Add to cart/ }).click();
  await expect(page.getByText(/added to cart/i)).toBeVisible();
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Wild Forest Honey" })).toBeVisible();
  await expect(page.getByText("Size: 1kg")).toBeVisible();
});

test("unknown pages show the not-found page", async ({ page }) => {
  await page.goto("/products/not-a-real-honey");
  await expect(page.getByText("This jar is empty")).toBeVisible();
});

test("WhatsApp button, closable announcement and the Shop menu", async ({ page }, info) => {
  await page.goto("/shop");
  await expect(page.getByRole("link", { name: "Chat with us on WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+\?text=/);

  const bar = page.getByRole("region", { name: "Announcement" });
  await expect(bar).toBeVisible();
  await bar.getByRole("button", { name: "Close announcement" }).click();
  await expect(bar).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Announcement" })).toHaveCount(0);

  if (info.project.name !== "mobile") {
    await page.getByRole("button", { name: /^Shop/ }).click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: /Gift Boxes/ })).toBeVisible();
    await menu.getByRole("menuitem", { name: /Sidr & Beri/ }).click();
    await expect(page).toHaveURL(/\/category\/sidr-beri/);
  }
});

test("guests are asked to log in to save to the wishlist", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("button", { name: /Save Sidr \(Beri\) Honey to wishlist/ }).first().click();
  await expect(page).toHaveURL(/\/login\?next=%2Fshop/);
});
