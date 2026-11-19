import { describe, expect, it } from "vitest";
import type { AmbangPeringatan, CatatanHarian, Kandang } from "../schemas/catatan.js";
import { evaluateAlerts } from "./evaluateAlerts.js";

const AMBANG_UJI: AmbangPeringatan[] = [
  {
    jenisAyam: "petelur",
    kematianPersenMaks: 0.5,
    suhuMinC: 20,
    suhuMaksC: 32,
    produksiTelurMinPersen: 60,
    sumber: "Fixture ambang uji",
    isDemo: true,
  },
];

const KANDANG_UJI: Kandang = {
  id: "11111111-1111-4111-8111-111111111111",
  nama: "Kandang Blok A",
  jenisAyam: "petelur",
  jumlahEkor: 500,
  umurMinggu: 30,
  lokasi: "Lembang, Bandung Barat",
  bahanTersedia: [],
  diubahPada: "2026-11-19T08:00:00.000Z",
};

describe("evaluateAlerts", () => {
  it("tidak memunculkan peringatan saat seluruh angka berada dalam ambang normal", () => {
    const catatan: CatatanHarian[] = [
      {
        id: "22222222-2222-4222-8222-222222222222",
        kandangId: KANDANG_UJI.id,
        tanggal: "2026-11-19",
        pakanKg: 58,
        telur: 410,
        kematian: 1,
        suhu: 27,
        diubahPada: "2026-11-19T08:00:00.000Z",
      },
    ];

    expect(evaluateAlerts(catatan, KANDANG_UJI, AMBANG_UJI)).toEqual([]);
  });

  it("memunculkan peringatan kematian tinggi, suhu panas, dan produksi rendah dari data ambang", () => {
    const catatan: CatatanHarian[] = [
      {
        id: "22222222-2222-4222-8222-222222222223",
        kandangId: KANDANG_UJI.id,
        tanggal: "2026-11-19",
        pakanKg: 50,
        telur: 220,
        kematian: 8,
        suhu: 35.5,
        diubahPada: "2026-11-19T08:00:00.000Z",
      },
    ];

    const hasil = evaluateAlerts(catatan, KANDANG_UJI, AMBANG_UJI);
    expect(hasil.map((h) => h.kode)).toEqual(["KEMATIAN_TINGGI", "SUHU_TINGGI", "PRODUKSI_RENDAH"]);
    expect(hasil[0]?.tingkat).toBe("tinggi");
    expect(hasil[0]?.sumberAmbang).toBe("Fixture ambang uji");
  });

  it("mengabaikan catatan yang sudah dihapus dan mengembalikan kosong bila ambang tidak tersedia", () => {
    const catatanDihapus: CatatanHarian[] = [
      {
        id: "22222222-2222-4222-8222-222222222224",
        kandangId: KANDANG_UJI.id,
        tanggal: "2026-11-19",
        pakanKg: 10,
        telur: 10,
        kematian: 20,
        suhu: 40,
        diubahPada: "2026-11-19T08:00:00.000Z",
        dihapusPada: "2026-11-19T09:00:00.000Z",
      },
    ];

    expect(evaluateAlerts(catatanDihapus, KANDANG_UJI, AMBANG_UJI)).toEqual([]);
    expect(evaluateAlerts([], KANDANG_UJI, [])).toEqual([]);
  });
});
