import { expect, type Page } from "@playwright/test";

/**
 * Semua fitur aplikasi wajib masuk. Tiap tes masuk sebagai akun peternak baru lewat OTP mode
 * demo (server e2e berjalan dengan NODE_ENV=test, jadi kode tampil di respons), agar data antartes
 * tidak tercampur seperti bila memakai akun demo bersama.
 *
 * Batas OTP dihitung per IP. Server mempercayai X-Forwarded-For dari loopback, jadi tiap tes
 * memakai IP tiruan sendiri agar puluhan tes tidak terkena 429.
 */
export async function masukSebagaiPeternak(page: Page): Promise<void> {
  // Pengaman: jangan pernah meminta OTP ke server yang memakai kredensial asli (mis. server lama
  // yang dipakai ulang dan membaca .env). Mode demo terlihat dari email "demo" tanpa Google.
  const konfigurasi = (await (await page.request.get("/v1/auth/konfigurasi")).json()) as {
    email?: string;
    googleClientId?: string | null;
  };
  if (konfigurasi.email !== "demo" || konfigurasi.googleClientId) {
    throw new Error(
      "Server e2e tidak dalam mode demo (kredensial asli terbaca). Hentikan server di port 4173 " +
        "lalu jalankan ulang agar playwright.config.ts mengosongkan FONNTE_TOKEN/SMTP.",
    );
  }

  const acak = () => Math.floor(Math.random() * 250) + 1;
  const headers = { "x-forwarded-for": `10.${acak()}.${acak()}.${acak()}` };
  const nomorPonsel = `0812${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;

  const minta = await page.request.post("/v1/auth/otp/minta", {
    headers,
    data: { nomorPonsel },
  });
  expect(minta.ok(), await minta.text()).toBe(true);
  const { kodeDemo } = (await minta.json()) as { kodeDemo?: string };

  const verifikasi = await page.request.post("/v1/auth/otp/verifikasi", {
    headers,
    data: { nomorPonsel, kode: kodeDemo, peran: "peternak" },
  });
  expect(verifikasi.ok(), await verifikasi.text()).toBe(true);
  const { pengguna } = (await verifikasi.json()) as { pengguna: unknown };

  // Cookie sesi sudah tersimpan di konteks browser (page.request berbagi cookie). Salinan status
  // masuk di localStorage diisi sebelum skrip aplikasi berjalan, sama seperti setelah masuk biasa.
  await page.addInitScript(([kunci, nilai]) => window.localStorage.setItem(kunci, nilai), [
    "tk.akun",
    JSON.stringify(pengguna),
  ] as const);
}
