import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Kokok triase penyakit dan riwayat offline (/app/tanya)", () => {
  test("menangani urgensi tinggi, menolak permintaan dosis, tetap menampilkan riwayat saat offline, dan lulus axe", async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/tanya");

    // Pastikan service worker aktif untuk skenario offline
    await page.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.ready;
      }
    });

    await expect(page.getByText("Bukan diagnosis dan tidak memberi dosis obat.")).toBeVisible();

    // 1. Kirim gejala urgensi tinggi
    const areaGejala = page.getByLabel(/Ceritakan gejala yang Anda lihat di kandang/i);
    await areaGejala.fill("Ada 5 ekor ayam mati mendadak pagi ini dan jengger terlihat kebiruan.");
    await page.getByLabel(/Sejak kapan muncul/i).fill("Pagi ini");
    await page.getByRole("button", { name: "Tanya Kokok" }).click();

    await expect(page.getByText("Urgensi tinggi — segera hubungi dokter hewan")).toBeVisible();
    await expect(page.getByText(/Lihat sumber pedoman yang dipakai/i).first()).toBeVisible();

    // Cek tautan WhatsApp tidak berisi nomor telepon tujuan
    const tautanWa = page.getByRole("link", { name: "Kirim lewat WhatsApp" }).first();
    const href = await tautanWa.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href?.startsWith("https://wa.me/?text=")).toBe(true);
    expect(href).not.toMatch(/wa\.me\/\d+/);

    // 2. Kirim permintaan dosis obat -> harus terfilter dengan jawaban aman tanpa dosis
    await areaGejala.fill("Berapa dosis antibiotik ml per liter air minum untuk ayam ngorok?");
    await page.getByRole("button", { name: "Tanya Kokok" }).click();

    await expect(page.getByText("Jawaban aman")).toBeVisible();
    await expect(
      page.getByText(/Kokok tidak dapat menentukan penyakit secara pasti maupun memberi aturan/i),
    ).toBeVisible();

    // Audit axe dan gulir horizontal di ponsel (360px) dan laptop (1280px)
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(
        overflow,
        `Tidak boleh ada gulir horizontal pada lebar ${width}px`,
      ).toBeLessThanOrEqual(1);

      const hasilAxe = await new AxeBuilder({ page }).analyze();
      expect(hasilAxe.violations, `Pelanggaran axe pada lebar ${width}px`).toEqual([]);
    }

    // 3. Aktifkan mode pesawat: riwayat tetap tampil, tombol kirim nonaktif, draf tersimpan
    await page.setViewportSize({ width: 390, height: 844 });
    await context.setOffline(true);
    await page.reload();

    await expect(page.getByText(/Pertanyaan baru butuh sambungan/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Tanya Kokok" })).toBeDisabled();
    // Kedua riwayat sebelumnya tetap terbaca offline dari IndexedDB
    await expect(page.getByText("Urgensi tinggi — segera hubungi dokter hewan")).toBeVisible();
    await expect(page.getByText("Jawaban aman")).toBeVisible();

    // Tulis draf baru saat offline, muat ulang, pastikan draf tetap ada
    const drafBaru = "Ayam mulai bersin saat sore hari";
    await page.getByLabel(/Ceritakan gejala yang Anda lihat di kandang/i).fill(drafBaru);
    await page.waitForTimeout(150);
    await page.reload();
    await expect(page.getByLabel(/Ceritakan gejala yang Anda lihat di kandang/i)).toHaveValue(
      drafBaru,
    );

    await context.setOffline(false);
  });
});
