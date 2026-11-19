import { describe, expect, it } from "vitest";
import type { PakanHitungLayak } from "../schemas/pakan.js";
import { verifyFeedExplanation } from "./verifyExplanation.js";

const HASIL_CONTOH: PakanHitungLayak = {
  status: "layak",
  jenisAyam: "petelur",
  fase: "layer",
  komposisi: [
    {
      bahanId: "jagung",
      nama: "Jagung kuning",
      persentase: 66.67,
      kgPer100Kg: 66.67,
      hargaPerKg: 6000,
      subtotalPer100Kg: 400020,
    },
    {
      bahanId: "konsentrat",
      nama: "Konsentrat petelur",
      persentase: 33.33,
      kgPer100Kg: 33.33,
      hargaPerKg: 12000,
      subtotalPer100Kg: 399960,
    },
  ],
  totalBiayaPer100Kg: 800000,
  biayaPerKg: 8000,
  selisihPerKg: 500,
  pemenuhanGizi: [
    {
      zatGizi: "protein_kasar",
      label: "Protein kasar",
      satuan: "%",
      nilai: 18,
      batasMin: 18,
      batasMaks: null,
      terpenuhi: true,
      sumber: "Uji",
    },
  ],
  statusSolver: "optimal",
  catatanData: "Data contoh",
  isDemo: true,
};

describe("verifyFeedExplanation", () => {
  it("menerima penjelasan yang seluruh angkanya cocok dengan hasil solver", () => {
    const teks =
      "Campuran 100 kg ini memakai 66,7 kg Jagung kuning dan 33,3 kg Konsentrat petelur dengan biaya Rp 8.000 per kg (total Rp 800.000). Protein kasar tercapai 18%, lebih hemat Rp 500 per kg.";
    const cek = verifyFeedExplanation(teks, HASIL_CONTOH);

    expect(cek.terverifikasi).toBe(true);
    expect(cek.angkaMenyimpang).toEqual([]);
  });

  it("menolak penjelasan yang menyebut angka biaya berbeda dari solver", () => {
    const teksPalsu = "Campuran 100 kg ini biayanya hanya Rp 6.950 per kg dengan protein 18%.";
    const cek = verifyFeedExplanation(teksPalsu, HASIL_CONTOH);

    expect(cek.terverifikasi).toBe(false);
    expect(cek.angkaMenyimpang).toContain("6.950");
  });

  it("menolak penjelasan yang mengarang persentase bahan berbeda dari solver", () => {
    const teksPalsu = "Gunakan 55% Jagung kuning dan 45% Konsentrat petelur.";
    const cek = verifyFeedExplanation(teksPalsu, HASIL_CONTOH);

    expect(cek.terverifikasi).toBe(false);
    expect(cek.angkaMenyimpang).toEqual(["55", "45"]);
  });
});
