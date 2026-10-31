import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { ADMIN, login } from "./helpers";

test.describe.configure({ mode: "serial" });

let admin: BrowserContext;
// the owner's saved choices, restored after the tests that change them
let saved = { speed: "0.5", layout: "full" };
// These tests need the banner to be showing the video. When the owner has chosen the image slider
// or switched the video off, they are skipped rather than changing the owner's setup.
let videoShown = true;
test.beforeAll(async ({ browser }) => {
  admin = await browser.newContext();
  const page = await admin.newPage();
  await login(page, ADMIN.email, ADMIN.password, "/admin/content");
  saved = { speed: await page.getByLabel("Playback speed").inputValue(), layout: await page.getByLabel("Layout").inputValue() };
  const sliderChosen = (await page.getByRole("radiogroup", { name: "Banner shows" }).getByRole("radio", { checked: true }).textContent())?.trim() === "Image slider";
  const sliderImages = await page.getByRole("button", { name: /^Remove image/ }).count();
  videoShown = (await page.getByRole("switch", { name: "Show video on the home page" }).isChecked()) && !(sliderChosen && sliderImages > 0);
  await page.close();
});
test.afterAll(async () => admin?.close());

async function videoPanel() {
  const page = await admin.newPage();
  await page.goto("/admin/content");
  await expect(page.getByRole("heading", { name: "Home page video" })).toBeVisible();
  return page;
}

const heroVideo = (page: Page) => page.locator("main video");
// Banner height is the admin's choice (short 50% / medium 65% / full screen): smallest share of the screen to expect
const minShare = async (page: Page) => ({ short: 0.45, medium: 0.6, full: 0.8 })[(await page.locator("[data-hero-height]").getAttribute("data-hero-height")) as "short" | "medium" | "full"] ?? 0.45;
const box = (page: Page) =>
  heroVideo(page).evaluate((v: HTMLVideoElement) => {
    const r = v.getBoundingClientRect();
    return { left: r.left, width: r.width, height: r.height, vw: innerWidth, vh: innerHeight, rate: v.playbackRate, muted: v.muted };
  });

test("computers: slow-motion video fills the banner, headline and button over it", async ({ browser }) => {
  test.skip(!videoShown, "the home page banner is showing the image slider (or the video is off)");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("/");
  await expect.poll(() => heroVideo(page).evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 15_000 }).toBeGreaterThan(0.3);
  const b = await box(page);
  expect(b.rate).toBe(Number(saved.speed));
  expect(b.muted).toBe(true);
  expect(b.left).toBe(0);
  expect(b.width).toBe(b.vw);
  expect(b.height).toBeGreaterThanOrEqual(b.vh * (await minShare(page)));
  // the headline and main button sit on the video, on the first screen
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  await expect(page.getByRole("link", { name: /Shop all (honey|products)/i })).toBeInViewport();
  await page.getByRole("button", { name: "Turn sound on" }).click();
  expect(await heroVideo(page).evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
  await page.getByRole("button", { name: "Pause video" }).click();
  expect(await heroVideo(page).evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await page.close();
});

test("phones: video fills the banner with the headline and button over it", async ({ browser }) => {
  test.skip(!videoShown, "the home page banner is showing the image slider (or the video is off)");
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/");
  await expect.poll(() => heroVideo(page).evaluate((v: HTMLVideoElement) => v.playbackRate)).toBe(Number(saved.speed));
  const b = await box(page);
  expect(b.width).toBe(b.vw);
  expect(b.height).toBeGreaterThanOrEqual(b.vh * (await minShare(page)));
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  await expect(page.getByRole("link", { name: /Shop all (honey|products)/i })).toBeInViewport();
  await context.close();
});

test("admin changes to speed and layout reach shoppers", async ({ browser }) => {
  test.skip(!videoShown, "the home page banner is showing the image slider (or the video is off)");
  const page = await videoPanel();
  await page.getByLabel("Playback speed").selectOption("0.25");
  await expect(page.getByText("Playback speed saved").first()).toBeVisible();
  await page.getByLabel("Layout").selectOption("frame");
  await expect(page.getByText("Layout saved").first()).toBeVisible();

  const guest = await browser.newPage();
  await guest.goto("/");
  await expect.poll(() => heroVideo(guest).evaluate((v: HTMLVideoElement) => v.playbackRate)).toBe(0.25);
  await expect(guest.locator('[data-hero-layout="frame"]')).toHaveCount(1);

  // back to the owner's choices
  await page.getByLabel("Playback speed").selectOption(saved.speed);
  await expect(page.getByText("Playback speed saved").first()).toBeVisible();
  await page.getByLabel("Layout").selectOption(saved.layout);
  await expect(page.getByText("Layout saved").first()).toBeVisible();
  await guest.goto("/");
  await expect(guest.locator(`[data-hero-layout="${saved.layout}"]`)).toHaveCount(1);
  await guest.close();
});

test("admin can hide and show the video", async ({ browser }) => {
  test.skip(!videoShown, "the home page banner is showing the image slider (or the video is off)");
  const page = await videoPanel();
  const toggle = page.getByRole("switch", { name: "Show video on the home page" });
  await toggle.click();
  await expect(page.getByText("Video hidden from the home page").first()).toBeVisible();
  const guest = await browser.newPage();
  await guest.goto("/");
  await expect(heroVideo(guest)).toHaveCount(0);
  await toggle.click();
  await expect(page.getByText("Video shown on the home page").first()).toBeVisible();
  await guest.goto("/");
  await expect(heroVideo(guest)).toHaveCount(1);
  await guest.close();
});

// Replaces the live home page video with an uploaded copy, so it only runs when explicitly enabled:
//   E2E_ALLOW_VIDEO_UPLOAD=1 npm run test:e2e
test("admin can upload a replacement video and caption", async ({ browser }) => {
  test.skip(process.env.E2E_ALLOW_VIDEO_UPLOAD !== "1", "changes the live home page video");
  const page = await videoPanel();
  await page.locator('input[type="file"][accept^="video"]').setInputFiles("public/videos/home-page-video.mp4");
  await expect(page.getByText("New video is live on the home page").first()).toBeVisible({ timeout: 60_000 });
  await page.getByLabel(/Caption/).fill("Our shop in Lahore");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Caption saved").first()).toBeVisible();
  const guest = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await guest.goto("/");
  await expect(heroVideo(guest)).toHaveAttribute("src", /\/uploads\/videos\/.+\.mp4$/);
  await expect(guest.getByText("Our shop in Lahore")).toBeVisible();
  await guest.close();
});
