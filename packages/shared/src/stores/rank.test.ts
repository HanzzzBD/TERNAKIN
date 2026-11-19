import { describe, expect, it } from "vitest";
import type { KomposisiRujukanItem, Toko } from "../schemas/toko.js";
import { formatUmurHarga, rankStores } from "./rank.js";

const SEKARANG = new Date("2026-11-19T12:00:00.000Z");

const TOKO_UJI: Toko[] = [
  {
    id: "toko-mitra-mahal",
    kode: "TK-01",
    nama: "Toko Mitra Mahal",
    area: "Lembang",
    statusMitra: true,
    isDemo: true,
    nomorWa: null,
    harga: [
      {
        bahanId: "jagung",
        namaBahan: "Jagung",
        harga: 7000,
        asalHarga: "Dikirim toko lewat WhatsApp",
        diperbaruiPada: "2026-11-18T12:00:00.000Z",
      },
      {
        bahanId: "konsentrat",
        namaBahan: "Konsentrat",
        harga: 12500,
        asalHarga: "Dikirim toko lewat WhatsApp",
        diperbaruiPada: "2026-11-18T12:00:00.000Z",
      },
    ],
  },
  {
    id: "toko-nonmitra-termurah",
    kode: "TK-02",
    nama: "Toko Bukan Mitra Termurah",
    area: "Soreang",
    statusMitra: false,
    isDemo: true,
    nomorWa: null,
    harga: [
      {
        bahanId: "jagung",
        namaBahan: "Jagung",
        harga: 6000,
        asalHarga: "Dicatat tim",
        diperbaruiPada: "2026-11-17T12:00:00.000Z",
      },
      {
        bahanId: "konsentrat",
        namaBahan: "Konsentrat",
        harga: 11500,
        asalHarga: "Dicatat tim",
        diperbaruiPada: "2026-11-17T12:00:00.000Z",
      },
    ],
  },
  {
    id: "toko-usang-menengah",
    kode: "TK-03",
    nama: "Toko Harga Usang",
    area: "Banjaran",
    statusMitra: true,
    isDemo: true,
    nomorWa: null,
    harga: [
      {
        bahanId: "jagung",
        namaBahan: "Jagung",
        harga: 6500,
        asalHarga: "Dicatat tim",
        diperbaruiPada: "2026-11-05T12:00:00.000Z", // 14 hari lalu (> 7 hari)
      },
      {
        bahanId: "konsentrat",
        namaBahan: "Konsentrat",
        harga: 12000,
        asalHarga: "Dicatat tim",
        diperbaruiPada: "2026-11-05T12:00:00.000Z",
      },
    ],
  },
];

const KOMPOSISI: KomposisiRujukanItem[] = [
  { bahanId: "jagung", nama: "Jagung", kgPer100Kg: 60 },
  { bahanId: "konsentrat", nama: "Konsentrat", kgPer100Kg: 40 },
];

describe("rankStores", () => {
  it("mengurutkan murni dari total biaya pakan dan tidak terpengaruh status mitra atau komisi acak", () => {
    const dasar = rankStores({
      tokoList: TOKO_UJI,
      komposisi: KOMPOSISI,
      staleDays: 7,
      sekarang: SEKARANG,
    });

    // Biaya: nonmitra (60*6000 + 40*11500 = 820.000) < usang (870.000) < mitra mahal (920.000)
    expect(dasar.map((t) => t.id)).toEqual([
      "toko-nonmitra-termurah",
      "toko-usang-menengah",
      "toko-mitra-mahal",
    ]);
    expect(dasar[0]?.totalBiayaPer100Kg).toBe(820000);
    expect(dasar[0]?.biayaPerKg).toBe(8200);

    // Uji dengan statusMitra dibalik dan properti komisi acak: urutan tidak boleh berubah!
    const denganKomisiAcak = TOKO_UJI.map((toko, idx) => ({
      ...toko,
      statusMitra: !toko.statusMitra,
      komisiAcak: (idx + 1) * 999999,
    }));
    const hasilAcak = rankStores({
      tokoList: denganKomisiAcak,
      komposisi: KOMPOSISI,
      staleDays: 7,
      sekarang: SEKARANG,
    });

    expect(hasilAcak.map((t) => t.id)).toEqual(dasar.map((t) => t.id));
  });

  it("menandai harga melewati STALE_DAYS sebagai usang namun tetap menampilkannya", () => {
    const hasil = rankStores({
      tokoList: TOKO_UJI,
      komposisi: KOMPOSISI,
      staleDays: 7,
      sekarang: SEKARANG,
    });

    const usang = hasil.find((t) => t.id === "toko-usang-menengah");
    expect(usang).toBeDefined();
    expect(usang?.hasHargaUsang).toBe(true);
    expect(usang?.umurHariTertua).toBe(14);
    expect(formatUmurHarga(usang?.umurHariTertua ?? null)).toBe("14 hari lalu");

    const segar = hasil.find((t) => t.id === "toko-nonmitra-termurah");
    expect(segar?.hasHargaUsang).toBe(false);
  });

  it("mengurutkan abjad saat belum ada komposisi terpilih", () => {
    const hasil = rankStores({
      tokoList: TOKO_UJI,
      komposisi: [],
      staleDays: 7,
      sekarang: SEKARANG,
    });

    expect(hasil.map((t) => t.nama)).toEqual([
      "Toko Bukan Mitra Termurah",
      "Toko Harga Usang",
      "Toko Mitra Mahal",
    ]);
    expect(hasil.every((t) => t.totalBiayaPer100Kg === null)).toBe(true);
  });
});
