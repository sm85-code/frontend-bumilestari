import { defineConfig, devices } from "@playwright/test";

/**
 * Tes klik (e2e) dengan API tiruan terhadap build produksi (`vite preview`).
 * Jalankan `npm run build` dulu. Di mesin tanpa Chromium bawaan Playwright, isi PW_CHROMIUM_PATH.
 */
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined, args: ["--no-sandbox"] },
  },
  projects: [
    { name: "laptop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "hp", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 800 } } },
  ],
  webServer: {
    command: "npm run preview -- --port 4173 --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
