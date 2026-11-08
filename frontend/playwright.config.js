import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5175",
    channel: "chrome",
    headless: true,
    locale: "es-CO",
    timezoneId: "America/Bogota",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    { command: "node ../backend/test/e2e-server.js", url: "http://127.0.0.1:4100/api/health", reuseExistingServer: false },
    { command: "npm run dev -- --host 127.0.0.1 --port 5175 --strictPort", url: "http://127.0.0.1:5175", env: { API_PROXY_TARGET: "http://127.0.0.1:4100" }, reuseExistingServer: false },
  ],
});
