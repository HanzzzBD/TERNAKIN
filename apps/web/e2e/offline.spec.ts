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

test("/dev/komponen tidak tersedia pada build produksi", async ({ page }) => {
  await page.goto("/dev/komponen");
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText(/DESIGN SYSTEM · KHUSUS PENGEMBANGAN/i)).toHaveCount(0);
});

test("halaman /app dan font Georama tetap tampil dalam mode pesawat setelah satu kunjungan", async ({
  context,
  page,
}) => {
  await page.goto("/app");

  await expect(
    page.getByRole("heading", { level: 1, name: /Ternakin siap dibuka walau sinyal hilang/i }),
  ).toBeVisible();

  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) {
      throw new Error("Service worker tidak aktif");
    }
    await document.fonts.ready;
  });

  // Muat ulang sekali saat daring agar halaman dikendalikan service worker.
  await page.reload();
  const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  expect(controlled).toBe(true);

  // Mode pesawat: muat ulang /app dan pastikan konten + font Georama tetap termuat.
  await context.setOffline(true);
  await page.reload();

  await expect(
    page.getByRole("heading", { level: 1, name: /Ternakin siap dibuka walau sinyal hilang/i }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Anda sedang tanpa sinyal");

  const fontCheck = await page.evaluate(async () => {
    await document.fonts.ready;
    const georamaLoaded = Array.from(document.fonts).some(
      (f) => f.family.replace(/['"]/g, "") === "Georama" && f.status === "loaded",
    );
    const bodyStyle = getComputedStyle(document.body);
    return {
      georamaLoaded,
      fontFamily: bodyStyle.fontFamily,
      fontStretch: bodyStyle.fontStretch,
    };
  });

  expect(fontCheck.georamaLoaded).toBe(true);
  expect(fontCheck.fontFamily).toContain("Georama");
  expect(fontCheck.fontStretch).toBe("100%");
});
