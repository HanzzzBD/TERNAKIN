import { describe, expect, it } from "vitest";
import type { BahanMaster, KebutuhanGiziItem } from "../schemas/referensi.js";
import { optimizeFeed } from "./solver.js";

const KATALOG_UJI: BahanMaster[] = [
  {
    id: "jagung",
    nama: "Jagung kuning",
    satuan: "kg",
    sinonim: ["jagung"],
    batasMinPersen: 0,
    batasMaksPersen: 70,
    nutrisi: {
      protein_kasar: 9,
      energi_metabolis: 3350,
      kalsium: 0.02,
      fosfor: 0.28,
    },
    sumberNutrisi: "Fixture uji tangan",
    isDemo: true,
  },
  {
    id: "dedak",
    nama: "Dedak padi",
    satuan: "kg",
    sinonim: ["dedak", "bekatul"],
    batasMinPersen: 0,
    batasMaksPersen: 20,
    nutrisi: {
      protein_kasar: 12,
      energi_metabolis: 2400,
      kalsium: 0.08,
      fosfor: 1.4,
    },
    sumberNutrisi: "Fixture uji tangan",
    isDemo: true,
  },
  {
    id: "konsentrat",
    nama: "Konsentrat petelur",
    satuan: "kg",
    sinonim: ["konsentrat"],
    batasMinPersen: 0,
    batasMaksPersen: 50,
    nutrisi: {
      protein_kasar: 36,
      energi_metabolis: 2700,
      kalsium: 5.5,
      fosfor: 1.2,
    },
    sumberNutrisi: "Fixture uji tangan",
    isDemo: true,
  },
  {
    id: "kapur",
    nama: "Tepung batu kapur",
    satuan: "kg",
    sinonim: ["kapur", "kalsium"],
    batasMinPersen: 0,
    batasMaksPersen: 10,
    nutrisi: {
      protein_kasar: 0,
      energi_metabolis: 0,
      kalsium: 38,
      fosfor: 0,
    },
    sumberNutrisi: "Fixture uji tangan",
    isDemo: true,
  },
];

const TARGET_SEDERHANA: KebutuhanGiziItem[] = [
  {
    jenisAyam: "petelur",
    fase: "grower",
    zatGizi: "protein_kasar",
    label: "Protein kasar",
    satuan: "%",
    batasMin: 18,
    batasMaks: null,
    sumber: "Fixture uji tangan",
    isDemo: true,
  },
  {
    jenisAyam: "petelur",
    fase: "grower",
    zatGizi: "energi_metabolis",
    label: "Energi metabolis",
    satuan: "kkal/kg",
    batasMin: 2800,
    batasMaks: null,
    sumber: "Fixture uji tangan",
    isDemo: true,
  },
];

const TARGET_LAYER_LENGKAP: KebutuhanGiziItem[] = [
  {
    jenisAyam: "petelur",
    fase: "layer",
    zatGizi: "protein_kasar",
    label: "Protein kasar",
    satuan: "%",
    batasMin: 17,
    batasMaks: 22,
    sumber: "Fixture uji tangan",
    isDemo: true,
  },
  {
    jenisAyam: "petelur",
    fase: "layer",
    zatGizi: "energi_metabolis",
    label: "Energi metabolis",
    satuan: "kkal/kg",
    batasMin: 2700,
    batasMaks: 3100,
    sumber: "Fixture uji tangan",
    isDemo: true,
  },
  {
    jenisAyam: "petelur",
    fase: "layer",
    zatGizi: "kalsium",
    label: "Kalsium",
    satuan: "%",
    batasMin: 3.5,
    batasMaks: 4.5,
    sumber: "Fixture uji tangan",
    isDemo: true,
  },
  {
    jenisAyam: "petelur",
    fase: "layer",
    zatGizi: "fosfor",
    label: "Fosfor",
    satuan: "%",
    batasMin: 0.45,
    batasMaks: 1.2,
    sumber: "Fixture uji tangan",
    isDemo: true,
  },
];

describe("Solver LP penyusun pakan", () => {
  it("Contoh 1 (diperiksa tangan): 2 bahan tepat 66,67% jagung dan 33,33% konsentrat, Rp 8.000/kg", () => {
    const hasil = optimizeFeed({
      request: {
        jenisAyam: "petelur",
        fase: "grower",
        bahan: [
          { bahanId: "jagung", hargaPerKg: 6000 },
          { bahanId: "konsentrat", hargaPerKg: 12000 },
        ],
        biayaSekarangPerKg: 8500,
      },
      katalogBahan: KATALOG_UJI,
      kebutuhanGizi: TARGET_SEDERHANA,
      catatanData: "Data uji",
      isDemo: true,
    });

    expect(hasil.status).toBe("layak");
    if (hasil.status !== "layak") return;

    const jagung = hasil.komposisi.find((k) => k.bahanId === "jagung");
    const konsentrat = hasil.komposisi.find((k) => k.bahanId === "konsentrat");
    expect(jagung?.kgPer100Kg).toBeCloseTo(66.67, 1);
    expect(konsentrat?.kgPer100Kg).toBeCloseTo(33.33, 1);
    expect(hasil.totalBiayaPer100Kg).toBe(800000);
    expect(hasil.biayaPerKg).toBe(8000);
    expect(hasil.selisihPerKg).toBe(500);
    expect(hasil.pemenuhanGizi.every((g) => g.terpenuhi)).toBe(true);
  });

  it("Contoh 2 (diperiksa tangan): 3 bahan dengan batas dedak 20%, biaya Rp 7.711/kg", () => {
    const hasil = optimizeFeed({
      request: {
        jenisAyam: "petelur",
        fase: "grower",
        bahan: [
          { bahanId: "jagung", hargaPerKg: 6500 },
          { bahanId: "dedak", hargaPerKg: 4000 },
          { bahanId: "konsentrat", hargaPerKg: 12000 },
        ],
      },
      katalogBahan: KATALOG_UJI,
      kebutuhanGizi: TARGET_SEDERHANA,
      catatanData: "Data uji",
      isDemo: true,
    });

    expect(hasil.status).toBe("layak");
    if (hasil.status !== "layak") return;

    const jagung = hasil.komposisi.find((k) => k.bahanId === "jagung");
    const dedak = hasil.komposisi.find((k) => k.bahanId === "dedak");
    const konsentrat = hasil.komposisi.find((k) => k.bahanId === "konsentrat");

    // Hitungan tangan: dedak 20 kg, jagung 440/9 = 48.89 kg, konsentrat 280/9 = 31.11 kg
    expect(dedak?.kgPer100Kg).toBeCloseTo(20, 1);
    expect(jagung?.kgPer100Kg).toBeCloseTo(48.89, 1);
    expect(konsentrat?.kgPer100Kg).toBeCloseTo(31.11, 1);
    expect(hasil.totalBiayaPer100Kg).toBe(771111);
    expect(hasil.biayaPerKg).toBe(7711);
  });

  it("Contoh 3 (diperiksa tangan): 4 bahan ransum layer memenuhi PK, EM, Ca, dan P dengan biaya optimal", () => {
    const hasil = optimizeFeed({
      request: {
        jenisAyam: "petelur",
        fase: "layer",
        bahan: [
          { bahanId: "jagung", hargaPerKg: 6500 },
          { bahanId: "dedak", hargaPerKg: 4000 },
          { bahanId: "konsentrat", hargaPerKg: 12000 },
          { bahanId: "kapur", hargaPerKg: 1500 },
        ],
      },
      katalogBahan: KATALOG_UJI,
      kebutuhanGizi: TARGET_LAYER_LENGKAP,
      catatanData: "Data uji",
      isDemo: true,
    });

    expect(hasil.status).toBe("layak");
    if (hasil.status !== "layak") return;

    const totalKg = hasil.komposisi.reduce((sum, item) => sum + item.kgPer100Kg, 0);
    expect(totalKg).toBeCloseTo(100, 1);
    expect(hasil.pemenuhanGizi.every((g) => g.terpenuhi)).toBe(true);

    // Hitungan tangan sistem linear (d=20, PK=17%, Ca=4,5% maks karena kapur murah Rp 1.500):
    // j=42,66 kg, d=20,00 kg, k=29,89 kg, c=7,45 kg => EM=2716,09, P=0,76, biaya=Rp 7.271/kg
    const jagung = hasil.komposisi.find((k) => k.bahanId === "jagung");
    const dedak = hasil.komposisi.find((k) => k.bahanId === "dedak");
    const konsentrat = hasil.komposisi.find((k) => k.bahanId === "konsentrat");
    const kapur = hasil.komposisi.find((k) => k.bahanId === "kapur");
    expect(jagung?.kgPer100Kg).toBeCloseTo(42.66, 1);
    expect(dedak?.kgPer100Kg).toBeCloseTo(20, 1);
    expect(konsentrat?.kgPer100Kg).toBeCloseTo(29.89, 1);
    expect(kapur?.kgPer100Kg).toBeCloseTo(7.45, 1);
    expect(hasil.biayaPerKg).toBe(7271);
  });

  it("Kasus tak layak: menyebut zat yang kurang dan menyarankan bahan tambahan dari katalog", () => {
    const hasil = optimizeFeed({
      request: {
        jenisAyam: "petelur",
        fase: "layer",
        bahan: [
          { bahanId: "jagung", hargaPerKg: 6500 },
          { bahanId: "dedak", hargaPerKg: 4000 },
        ],
      },
      katalogBahan: KATALOG_UJI,
      kebutuhanGizi: TARGET_LAYER_LENGKAP,
      catatanData: "Data uji",
      isDemo: true,
    });

    expect(hasil.status).toBe("tak_layak");
    if (hasil.status !== "tak_layak") return;

    const zatKurang = hasil.zatBermasalah.map((z) => z.zatGizi);
    expect(zatKurang).toContain("protein_kasar");
    expect(zatKurang).toContain("kalsium");

    const idSaran = hasil.saranBahan.map((s) => s.bahanId);
    expect(idSaran).toContain("konsentrat");
    expect(idSaran).toContain("kapur");
  });
});
