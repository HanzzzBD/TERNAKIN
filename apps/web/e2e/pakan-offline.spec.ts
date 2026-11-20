import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("hitung pakan berjalan penuh dalam mode pesawat setelah satu kunjungan", async ({
  context,
  page,
}) => {
  await page.goto("/app/pakan");
  await expect(page.getByText("Jagung kuning giling")).toBeVisible();

  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) {
      throw new Error("Service worker tidak aktif");
    }
  });

  await page.reload();
  await expect(page.getByText("Jagung kuning giling")).toBeVisible();

  // Mode pesawat aktif sepenuhnya
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("Jagung kuning giling")).toBeVisible();

  // Baris "Lainnya" butuh sinyal: tombol Tambahkan nonaktif saat offline
  await page.getByRole("checkbox", { name: /Lainnya/ }).check();
  await expect(page.getByRole("button", { name: "Tambahkan", exact: true })).toBeDisabled();
  await page.getByRole("checkbox", { name: /Lainnya/ }).uncheck();

  const pilihan: Array<[string, string]> = [
    ["Jagung kuning giling", "6500"],
    ["Dedak padi halus", "4000"],
    ["Konsentrat ayam petelur", "12000"],
    ["Tepung batu kapur (CaCO3)", "1500"],
  ];

  for (const [nama, harga] of pilihan) {
    const pola = new RegExp(nama.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    await page.getByRole("checkbox", { name: pola }).check();
    await page.getByLabel(`Harga ${nama} per kg`).fill(harga);
  }

  await page.getByRole("button", { name: "Hitung campuran" }).click();

  await expect(page.getByText("Dihitung solver")).toBeVisible();
  await expect(page.getByText("Komposisi per 100 kg pakan")).toBeVisible();
  await expect(page.getByText(/Anda sedang tanpa sinyal/i).first()).toBeVisible();
});

test("/app/pakan lulus audit axe dan tanpa gulir horizontal di ponsel (360px) dan laptop (1280px)", async ({
  page,
}) => {
  for (const vp of [
    { width: 360, height: 800 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(vp);
    await page.goto("/app/pakan");
    await expect(page.getByText("Jagung kuning giling")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);

    const hasil = await new AxeBuilder({ page }).analyze();
    expect(hasil.violations).toEqual([]);
  }
});
