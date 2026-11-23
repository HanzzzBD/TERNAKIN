import { defineConfig } from "@playwright/test";

// Port server e2e (API + web hasil build). Bisa diganti bila 4173 dipakai aplikasi lain, mis.
// E2E_PORT=4183 npx playwright test.
const PORT_E2E = process.env.E2E_PORT ?? "4173";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  projects: [
    {
      name: "preview",
      testMatch:
        /(offline|appshell|pakan-offline|catatan-offline|toko-offline|kokok|landing)\.spec\.ts/,
      use: {
        baseURL: `http://127.0.0.1:${PORT_E2E}`,
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
        PORT: PORT_E2E,
        DATABASE_PATH: ":memory:",
        NODE_ENV: "test",
        ADMIN_KEY: "kunci-admin-e2e",
        // Server membaca .env lokal (bisa berisi kredensial asli). Nilai kosong di sini menang atas
        // .env, sehingga OTP & email memakai mode demo (tidak ada WhatsApp/email sungguhan yang
        // terkirim), Kokok memakai mock, dan tombol Google disembunyikan.
        FONNTE_TOKEN: "",
        SMTP_USER: "",
        SMTP_PASS: "",
        GOOGLE_CLIENT_ID: "",
        LLM_PROVIDER: "mock",
        LLM_API_KEY: "",
      },
      url: `http://127.0.0.1:${PORT_E2E}/health`,
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
