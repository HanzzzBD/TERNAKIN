import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "ponsel-360", width: 360, height: 800, isDesktop: false },
  { name: "ponsel-390", width: 390, height: 844, isDesktop: false },
  { name: "tablet-768", width: 768, height: 1024, isDesktop: false },
  { name: "laptop-1280", width: 1280, height: 800, isDesktop: true },
  { name: "desktop-1440", width: 1440, height: 900, isDesktop: true },
] as const;

for (const vp of VIEWPORTS) {
  test(`AppShell (${vp.name}): Georama tampil, responsif tepat, tanpa gulir horizontal`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/app");

    await expect(
      page.getByRole("heading", { level: 1, name: /Ternakin siap dibuka walau sinyal hilang/i }),
    ).toBeVisible();

    const layout = await page.evaluate(async () => {
      await document.fonts.ready;
      const georamaLoaded = Array.from(document.fonts).some(
        (f) => f.family.replace(/['"]/g, "") === "Georama" && f.status === "loaded",
      );
      const bodyStyle = getComputedStyle(document.body);

      const clipped: string[] = [];
      const vw = window.innerWidth;
      for (const el of document.querySelectorAll("button, a, h1, h2, input")) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (el.classList.contains("skip-link")) continue;
        if (rect.right > vw + 1 || rect.left < -1) {
          clipped.push(`${el.tagName}:${el.textContent?.trim() ?? ""}`);
        }
      }

      const smallTargets: string[] = [];
      for (const el of document.querySelectorAll("button, nav a")) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.height < 48 || rect.width < 48) {
          smallTargets.push(
            `${el.tagName}:${el.textContent?.trim() ?? ""}(${Math.round(rect.width)}x${Math.round(rect.height)})`,
          );
        }
      }

      return {
        georamaLoaded,
        fontStretch: bodyStyle.fontStretch,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        clipped,
        smallTargets,
      };
    });

    expect(layout.georamaLoaded).toBe(true);
    expect(layout.fontStretch).toBe("100%");
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth);
    expect(layout.clipped).toEqual([]);
    expect(layout.smallTargets).toEqual([]);

    const bottomNav = page.locator('nav[aria-label="Navigasi bawah"]');
    const railNav = page.locator('nav[aria-label="Navigasi samping"]');
    if (vp.isDesktop) {
      await expect(railNav).toBeVisible();
      await expect(bottomNav).toBeHidden();
    } else {
      await expect(bottomNav).toBeVisible();
      await expect(railNav).toBeHidden();
    }

    // Fokus papan ketik pertama harus tautan Lewati ke konten.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Lewati ke konten" })).toBeFocused();
  });
}

test("AppShell desktop: icon rail dapat mengecil/membuka dan menampilkan nama menu saat hover", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/app");

  const rail = page.locator('aside[aria-label="Bilah navigasi samping"]');
  await expect(rail).toHaveAttribute("data-collapsed", "true");

  const lebarKecil = await rail.evaluate((el) => el.getBoundingClientRect().width);
  expect(lebarKecil).toBeLessThanOrEqual(90);

  // Saat mengecil, hover item menu memunculkan tooltip nama menu
  const linkPakan = rail.getByRole("link", { name: "Pakan" });
  const labelPakan = linkPakan.locator(".tk-nav__label");
  expect(await labelPakan.evaluate((el) => getComputedStyle(el).visibility)).toBe("hidden");

  await linkPakan.hover();
  await expect(labelPakan).toBeVisible();
  await expect(labelPakan).toHaveCSS("opacity", "1");

  // Klik tombol buka -> rail melebar dan label tampil permanen
  await page.getByRole("button", { name: "Buka bilah navigasi" }).click();
  await expect(rail).toHaveAttribute("data-collapsed", "false");
  await expect
    .poll(() => rail.evaluate((el) => el.getBoundingClientRect().width))
    .toBeGreaterThanOrEqual(220);
  await expect(labelPakan).toBeVisible();

  // Audit axe saat rail terbuka
  const hasilAxeBuka = await new AxeBuilder({ page }).analyze();
  expect(hasilAxeBuka.violations).toEqual([]);

  // Klik kecilkan kembali -> kembali ke icon rail
  await page.getByRole("button", { name: "Kecilkan bilah navigasi" }).click();
  await expect(rail).toHaveAttribute("data-collapsed", "true");
});

test("AppShell lulus audit axe tanpa pelanggaran di ponsel (360px) dan laptop (1280px)", async ({
  page,
}) => {
  for (const vp of [
    { width: 360, height: 800 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(vp);
    await page.goto("/app");
    await page.evaluate(() => document.fonts.ready);

    const hasil = await new AxeBuilder({ page }).analyze();
    expect(hasil.violations).toEqual([]);
  }
});
