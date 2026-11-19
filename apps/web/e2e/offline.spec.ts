import { expect, test } from "@playwright/test";

test("halaman fondasi tetap terbuka dalam mode offline setelah satu kunjungan", async ({
  context,
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: /Ternakin siap dibuka walau sinyal hilang/i }),
  ).toBeVisible();

  // Tunggu service worker aktif dan selesai precache aset.
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) {
      throw new Error("Service worker tidak aktif");
    }
  });

  // Muat ulang sekali saat online agar halaman sudah dikendalikan oleh service worker.
  await page.reload();
  const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  expect(controlled).toBe(true);

  // Matikan jaringan (simulasi mode pesawat) lalu muat ulang dan buka /app.
  await context.setOffline(true);
  await page.reload();

  await expect(
    page.getByRole("heading", { level: 1, name: /Ternakin siap dibuka walau sinyal hilang/i }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Anda sedang tanpa sinyal");

  await page.goto("/app");
  await expect(
    page.getByRole("heading", { level: 1, name: /Ternakin siap dibuka walau sinyal hilang/i }),
  ).toBeVisible();
});
