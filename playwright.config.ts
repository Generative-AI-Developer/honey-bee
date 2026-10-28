import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Artifacts live outside the project: the dev server watches the project folder and would
// recompile/reload pages whenever a screenshot or trace is written.
const artifacts = path.join(os.tmpdir(), "honeybee-e2e");

// End-to-end tests run against an already-running server with a seeded database:
//   npm run dev   (or npm run build && npm start)
//   E2E_BASE_URL=http://localhost:3000 npm run test:e2e
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: path.join(artifacts, "results"),
  reporter: [["list"], ["html", { open: "never", outputFolder: path.join(artifacts, "report") }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...(process.env.E2E_CHROME_PATH && { launchOptions: { executablePath: process.env.E2E_CHROME_PATH } }),
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /storefront\.spec\.ts/ },
  ],
});
