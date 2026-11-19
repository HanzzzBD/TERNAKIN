import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  projects: [
    {
      name: "preview",
      testMatch: /(offline|appshell|pakan-offline|catatan-offline|toko-offline)\.spec\.ts/,
      use: {
        baseURL: "http://127.0.0.1:4173",
      },
    },
    {
      name: "dev",
      testMatch: /dev-komponen\.spec\.ts/,
      use: {
        baseURL: "http://127.0.0.1:5174",
      },
    },
  ],
  webServer: [
    {
      command: "node ../api/dist/server.js",
      env: {
        PORT: "4173",
        DATABASE_PATH: ":memory:",
        NODE_ENV: "test",
        ADMIN_KEY: "kunci-admin-e2e",
      },
      url: "http://127.0.0.1:4173/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "npx vite --host 127.0.0.1 --port 5174 --strictPort",
      url: "http://127.0.0.1:5174",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
