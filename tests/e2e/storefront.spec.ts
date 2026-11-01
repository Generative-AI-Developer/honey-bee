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
  await expect(categories.getByRole("link", { name: /All Categories/ })).toHaveAttribute("aria-current", "page");
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

test("WhatsApp button, announcement bar and the Shop menu", async ({ page }, info) => {
  await page.goto("/shop");
  await expect(page.getByRole("link", { name: "Chat with us on WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+\?text=/);

  // the announcement bar is always shown (no close button) and stays at the top while scrolling
  const bar = page.getByRole("region", { name: "Announcement" });
  await expect(bar).toBeVisible();
  await expect(bar.getByRole("button")).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 1200));
  await expect.poll(() => bar.evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBe(0);
  await expect(bar).toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, 0));

  if (info.project.name !== "mobile") {
    await page.getByRole("button", { name: /^Shop/ }).click();
    const menu = page.getByRole("menu");
    // category names are the owner's to change, so just follow the first one listed
    await expect(menu.getByRole("menuitem", { name: /All Categories/ })).toBeVisible();
    await expect(menu.getByText("Categories", { exact: true })).toHaveCount(0); // heading removed at the owner's request
    const first = menu.getByRole("menuitem").nth(1);
    const name = ((await first.textContent()) ?? "").replace(/\d+$/, "").trim();
    await first.click();
    await expect(page).toHaveURL(/\/category\/[a-z0-9-]+/);
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  }
});

test("guests are asked to log in to save to the wishlist", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("button", { name: /Save Sidr \(Beri\) Honey to wishlist/ }).first().click();
  await expect(page).toHaveURL(/\/login\?next=%2Fshop/);
});

test("every header link opens a real page", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "the desktop header shows these links");
  await page.goto("/");
  const links = page.getByRole("navigation", { name: "Main" }).getByRole("link");
  const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
  expect(hrefs.length).toBeGreaterThan(1);
  for (const href of hrefs) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/couldn.t find|not found/i)).toHaveCount(0);
  }
});

test("blog lists articles and opens one", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1, name: "The honey journal" })).toBeVisible();
  const first = page.getByRole("article").first();
  const title = (await first.getByRole("heading").textContent())!.trim();
  await first.getByRole("link", { name: title, exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByRole("link", { name: "Shop all products" })).toBeVisible();
});

test("contact form checks the details and sends the message", async ({ page }) => {
  await page.goto("/contact");
  const form = page.getByRole("region", { name: "Send us a message" });
  await form.getByRole("button", { name: "Send message" }).click();
  await expect(form.getByText("Please tell us your name.")).toBeVisible();
  await form.getByLabel("Your name").fill("Test Visitor");
  await form.getByLabel("Email", { exact: true }).fill("visitor@example.com");
  await form.getByLabel("What is it about?").selectOption("Wholesale or corporate gifting");
  await form.getByLabel("Message").fill("Could you send a quote for 50 gift boxes for Eid?");
  await form.getByRole("button", { name: "Send message" }).click();
  await expect(form.getByText(/Your message has been sent/)).toBeVisible();
});
