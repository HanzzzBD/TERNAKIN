import { describe, expect, it } from "vitest";
import {
  checkKokokOutputSafety,
  detectUnsafeUserAsk,
  jawabanCadanganAman,
  tujuanRujukanUntukUrgensi,
} from "./safetyFilter.js";

describe("Filter keselamatan Kokok", () => {
  it("menolak keluaran yang mengandung dosis atau takaran obat", () => {
    const cek1 = checkKokokOutputSafety("Gejala pernapasan sedang.", [
      "Berikan obat 2 ml per liter air minum selama 5 hari.",
    ]);
    expect(cek1.aman).toBe(false);

    const cek2 = checkKokokOutputSafety("Perlu perhatian.", [
      "Gunakan dosis antibiotik amoksisilin sesuai petunjuk.",
    ]);
    expect(cek2.aman).toBe(false);
  });

  it("menolak keluaran yang menyatakan diagnosis pasti", () => {
    const cek = checkKokokOutputSafety("Ayam Anda pasti terkena flu burung (AI).", [
      "Pisahkan ayam sakit.",
    ]);
    expect(cek.aman).toBe(false);
  });

  it("meloloskan panduan umum aman tanpa dosis dan tanpa diagnosis pasti", () => {
    const cek = checkKokokOutputSafety(
      "Gejala pernapasan dan kematian mendadak membutuhkan pemeriksaan segera oleh ahli.",
      [
        "Pisahkan ayam yang menunjukkan gejala ke kandang terpisah.",
        "Bersihkan tempat minum dan catat jumlah kematian harian.",
      ],
    );
    expect(cek.aman).toBe(true);
  });

  it("mendeteksi permintaan dosis obat dan diagnosis pasti dari pertanyaan pengguna", () => {
    expect(
      detectUnsafeUserAsk("Berapa dosis antibiotik ml per liter air untuk ayam ngorok?").mintaDosis,
    ).toBe(true);
    expect(
      detectUnsafeUserAsk("Pastikan penyakit ayam saya, apakah ini pasti tetelo?").mintaDiagnosis,
    ).toBe(true);
    expect(detectUnsafeUserAsk("Ayam lesu dan nafsu makan turun sejak kemarin").mintaDosis).toBe(
      false,
    );
  });

  it("memetakan urgensi ke tujuan rujukan dan menyusun jawaban cadangan aman", () => {
    expect(tujuanRujukanUntukUrgensi("rendah")).toBeNull();
    expect(tujuanRujukanUntukUrgensi("sedang")).toContain("penyuluh");
    expect(tujuanRujukanUntukUrgensi("tinggi")).toContain("dokter hewan");

    const cadangan = jawabanCadanganAman("tinggi", "Permintaan dosis ditolak.");
    expect(cadangan.urgensi).toBe("tinggi");
    expect(checkKokokOutputSafety(cadangan.alasanUrgensi, cadangan.panduanUmum).aman).toBe(true);
  });
});
