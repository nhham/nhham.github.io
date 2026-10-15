// Browser tests: load the built site in Chrome, Firefox, and Safari's engine (WebKit).
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.js",
  timeout: 30_000,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:4173" },
  webServer: { command: "node scripts/serve.mjs", port: 4173, reuseExistingServer: !process.env.CI },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
