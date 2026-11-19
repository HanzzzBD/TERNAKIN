import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "ponsel-360", width: 360, height: 800, isDesktop: false },
  { name: "ponsel-390", width: 390, height: 844, isDesktop: false },
  { name: "tablet-768", width: 768, height: 1024, isDesktop: false },
  { name: "laptop-1280", width: 1280, height: 800, isDesktop: true },
  { name: "desktop-1440", width: 1440, height: 900, isDesktop: true },
] as const;

test.describe("Landing page (/) dan Kebijakan Privasi (/privasi)", () => {
  for (const vp of VIEWPORTS) {
    test(`Landing (${vp.name}): Georama tampil, tanpa gulir horizontal, navigasi responsif tepat`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);

      await expect(
        page.getByRole("heading", { level: 1, name: /Pakan lebih hemat/i }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Buka aplikasi" })).toBeVisible();

      const fontInfo = await page.evaluate(() => {
        const cs = getComputedStyle(document.body);
        return {
          family: cs.fontFamily,
          loaded: [...document.fonts].some(
            (f) => f.family.includes("Georama") && f.status === "loaded",
          ),
        };
      });
      expect(fontInfo.family).toContain("Georama");
      expect(fontInfo.loaded).toBe(true);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `Overflow horizontal pada ${vp.name}`).toBeLessThanOrEqual(1);

      if (vp.isDesktop) {
        await expect(
          page.getByRole("navigation", { name: "Navigasi halaman utama" }),
        ).toBeVisible();
      } else {
        const tombolMenu = page.getByRole("button", { name: "Buka menu navigasi" });
        await expect(tombolMenu).toBeVisible();
        await tombolMenu.click();
        await expect(page.getByRole("navigation", { name: "Navigasi ponsel" })).toBeVisible();
      }
    });
  }

  test("FAQ terbuka, maskot Kokok interaktif, kartu Toko & Pilot sejajar kiri-kanan di desktop, tanpa Atur animasi, serta lulus axe di 360px & 1280px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Tombol Atur animasi tidak ada
    await expect(page.getByRole("button", { name: /Atur animasi/i })).toHaveCount(0);

    // Maskot Kokok tampil dan merespons klik
    const imgKokok = page.locator('img[src="/images/kokok.webp"]').first();
    await expect(imgKokok).toBeVisible();
    const lebarImg = await imgKokok.evaluate((el) => (el as HTMLImageElement).naturalWidth);
    expect(lebarImg).toBeGreaterThan(0);

    const tombolKokok = page.getByRole("button", { name: /Sapa Kokok/i }).first();
    await tombolKokok.click();
    await expect(
      page.getByText(/Hitung pakan dan catatan harian tetap jalan walau sinyal/i),
    ).toBeVisible();

    // Kartu Toko Pakan dan Pilot Bandung sejajar kiri-kanan di 1280px
    const kartuGrid = page.locator(".tk-partner-pilot-grid > *");
    await expect(kartuGrid).toHaveCount(2);
    const [boxKiri, boxKanan] = await Promise.all([
      kartuGrid.nth(0).boundingBox(),
      kartuGrid.nth(1).boundingBox(),
    ]);
    expect(boxKiri).not.toBeNull();
    expect(boxKanan).not.toBeNull();
    if (boxKiri && boxKanan) {
      expect(Math.abs(boxKiri.y - boxKanan.y)).toBeLessThanOrEqual(4);
      expect(boxKanan.x).toBeGreaterThan(boxKiri.x + 200);
    }

    // Buka salah satu FAQ berbasis <details>
    await page.getByText("Bayar berapa?").click();
    await expect(
      page.getByText("Gratis untuk peternak. Pendapatan datang dari toko pakan mitra."),
    ).toBeVisible();

    // Audit axe di ponsel (360px) dan laptop (1280px) untuk landing
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      const axeLanding = await new AxeBuilder({ page }).analyze();
      expect(axeLanding.violations, `Pelanggaran axe landing pada ${width}px`).toEqual([]);
    }

    // Cek halaman /privasi dan audit axe
    await page.getByRole("link", { name: /Baca kebijakan privasi/i }).click();
    await expect(page).toHaveURL(/\/privasi$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /Data kandang Anda milik Anda/i }),
    ).toBeVisible();

    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      const axePrivasi = await new AxeBuilder({ page }).analyze();
      expect(axePrivasi.violations, `Pelanggaran axe /privasi pada ${width}px`).toEqual([]);
    }
  });
});
