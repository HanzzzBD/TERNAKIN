import { expect, test } from "@playwright/test";

interface WebManifest {
  id?: string;
  name?: string;
  short_name?: string;
  start_url?: string;
  display?: string;
  orientation?: string;
  background_color?: string;
  theme_color?: string;
  icons?: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
}

test("manifest PWA valid tanpa orientasi terkunci dan ikon dapat diakses", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.status()).toBe(200);

  const manifest = (await res.json()) as WebManifest;
  expect(manifest.orientation).toBe("any");
  expect(manifest.background_color).toBe("#FFFFFF");
  expect(manifest.theme_color).toBe("#F97316");
  expect(manifest.start_url).toBe("/app?source=pwa");
  expect(manifest.display).toBe("standalone");
  expect(manifest.id).toBe("/app?source=pwa");
  expect(manifest.icons?.length).toBeGreaterThanOrEqual(3);

  for (const icon of manifest.icons ?? []) {
    const iconRes = await request.get(icon.src);
    expect(iconRes.status()).toBe(200);
  }
});

test("halaman /app tetap terbuka dalam mode offline setelah satu kunjungan", async ({
  context,
  page,
}) => {
  await page.goto("/app");

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

  // Muat ulang sekali saat online agar halaman dikendalikan service worker.
  await page.reload();
  const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  expect(controlled).toBe(true);

  // Matikan jaringan (mode pesawat) lalu muat ulang /app.
  await context.setOffline(true);
  await page.reload();

  await expect(
    page.getByRole("heading", { level: 1, name: /Ternakin siap dibuka walau sinyal hilang/i }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Anda sedang tanpa sinyal");
});
