import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("rujukan toko urut murni dari biaya, harga usang bertanda, dan lead offline terkirim saat online", async ({
  context,
  page,
  request,
}) => {
  // 1. Hitung campuran pakan dulu agar komposisi tersimpan untuk rujukan toko
  await page.goto("/app/pakan");
  await expect(page.getByText("Jagung kuning giling")).toBeVisible();

  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) throw new Error("Service worker tidak aktif");
  });

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

  // 2. Pindah ke /app/toko lewat tombol Lihat toko yang menjual
  await page.getByRole("button", { name: "Lihat toko yang menjual" }).click();
  await expect(page).toHaveURL(/\/app\/toko$/);

  const kartuToko = page.locator("article.tk-toko-card");
  await expect(kartuToko).toHaveCount(5);

  // Urutan #1 harus toko termurah (Kios Pakan Tani Soreang — bukan mitra!)
  await expect(kartuToko.nth(0)).toContainText("Kios Pakan Tani Soreang (Contoh)");
  await expect(kartuToko.nth(0)).toContainText("Bukan mitra");

  // Harga usang (11 hari lalu) tetap tampil dengan badge Usang
  const tokoUsang = page.locator("article.tk-toko-card", {
    hasText: "UD Pakan Makmur Cicalengka (Contoh)",
  });
  await expect(tokoUsang).toContainText("Usang");

  // 3. Mode pesawat: muat ulang /app/toko (tetap tampil dari cache lokal!) lalu klik Hubungi WhatsApp
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("article.tk-toko-card")).toHaveCount(5);

  // Cegah pembukaan tab eksternal wa.me saat menguji antrean lead offline
  const firstWaLink = page
    .locator("article.tk-toko-card")
    .nth(0)
    .getByRole("link", { name: /Hubungi lewat WhatsApp/i });
  await firstWaLink.evaluate((el) => {
    el.addEventListener("click", (e) => e.preventDefault());
  });
  await firstWaLink.click();

  await expect(page.getByText(/masuk antrean offline/i)).toBeVisible();

  // 4. Nyalakan jaringan kembali -> lead dari kondisi offline terkirim ke server via /v1/sinkron
  await context.setOffline(false);
  await expect(page.getByText("Tersinkron")).toBeVisible({ timeout: 10_000 });

  const adminRes = await request.get("/v1/admin/lead", {
    headers: { "x-admin-key": "kunci-admin-e2e" },
  });
  expect(adminRes.status()).toBe(200);
  const adminJson = (await adminRes.json()) as {
    rekap: Array<{ tokoId: string; totalLead: number }>;
  };
  const soreang = adminJson.rekap.find((r) => r.tokoId === "toko-tani-soreang");
  expect(soreang?.totalLead).toBeGreaterThanOrEqual(1);
});

test("/app/toko lulus audit axe tanpa pelanggaran di ponsel (360px) dan laptop (1280px)", async ({
  page,
}) => {
  for (const vp of [
    { width: 360, height: 800 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(vp);
    await page.goto("/app/toko");
    await expect(page.locator("article.tk-toko-card")).toHaveCount(5);
    await page.evaluate(() => document.fonts.ready);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);

    const hasil = await new AxeBuilder({ page }).analyze();
    expect(hasil.violations).toEqual([]);
  }
});
