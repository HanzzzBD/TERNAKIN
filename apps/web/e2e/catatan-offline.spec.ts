import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { masukSebagaiPeternak } from "./masuk";

// Semua fitur aplikasi wajib masuk: tiap tes memakai akun peternak baru.
test.beforeEach(async ({ page }) => {
  await masukSebagaiPeternak(page);
});

test("catatan harian tersimpan offline, memperbarui tanggal sama, memunculkan peringatan, lalu tersinkron saat online dan bisa dihapus lewat DELETE /v1/akun", async ({
  context,
  page,
}) => {
  await page.goto("/app/catatan");
  await expect(page.getByRole("heading", { level: 1, name: /Catatan harian/i })).toBeVisible();

  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) {
      throw new Error("Service worker tidak aktif");
    }
  });
  await page.reload();

  // Buat profil kandang dulu
  await page.getByLabel(/Nama kandang/i).fill("Kandang Ciwidey");
  await page.getByLabel(/Jumlah ayam/i).fill("500");
  await page.getByRole("button", { name: "Mulai mencatat" }).click();
  await expect(page.getByText(/Isi catatan untuk Kandang Ciwidey/i)).toBeVisible();

  // Matikan jaringan (mode pesawat)
  await context.setOffline(true);

  await page.getByLabel("Tanggal catatan").fill("2026-11-19");
  await page.getByLabel("Pakan terpakai").fill("58");
  await page.getByLabel("Produksi telur").fill("390");
  await page.getByLabel("Ayam mati").fill("5");
  await page.getByLabel("Suhu kandang").fill("35");
  await page.getByRole("button", { name: "Simpan catatan" }).click();

  await expect(page.getByText("Tersimpan di ponsel. Dikirim saat ada sinyal.")).toBeVisible();
  await expect(page.getByText("Menunggu dikirim")).toBeVisible();
  await expect(page.getByText("Kematian harian di atas ambang")).toBeVisible();
  await expect(page.getByText("Suhu kandang terlalu panas")).toBeVisible();

  // Simpan ulang tanggal sama: harus memperbarui, bukan menggandakan
  await page.getByLabel("Produksi telur").fill("420");
  await page.getByRole("button", { name: "Simpan catatan" }).click();
  await expect(page.locator("article.tk-riwayat-item")).toHaveCount(1);
  await expect(page.locator("article.tk-riwayat-item").getByText("420 butir")).toBeVisible();

  // Nyalakan jaringan kembali: outbox otomatis flush ke POST /v1/sinkron dan status menjadi Tersinkron
  await context.setOffline(false);
  await expect(page.locator("article.tk-riwayat-item").getByText("Tersinkron")).toBeVisible({
    timeout: 10_000,
  });

  // Uji hapus akun & seluruh data via /app/profil (DELETE /v1/akun)
  await page.goto("/app/profil");
  await page.getByRole("button", { name: "Hapus data saya" }).click();
  await page.getByRole("button", { name: "Ya, hapus semua data saya" }).click();
  // Akun ikut terhapus sehingga sesi berakhir: aplikasi pindah ke halaman Masuk dengan pesan.
  await expect(page).toHaveURL(/\/app\/masuk/);
  await expect(
    page.getByText(
      /Akun Anda beserta seluruh data kandang dan catatan di perangkat dan server telah dihapus/i,
    ),
  ).toBeVisible();
});

test("/app/catatan dan /app/profil lulus audit axe tanpa pelanggaran di ponsel (360px) dan laptop (1280px)", async ({
  page,
}) => {
  for (const rute of ["/app/catatan", "/app/profil"]) {
    for (const vp of [
      { width: 360, height: 800 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(vp);
      await page.goto(rute);
      await page.evaluate(() => document.fonts.ready);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow).toBe(false);

      const hasil = await new AxeBuilder({ page }).analyze();
      expect(hasil.violations).toEqual([]);
    }
  }
});
