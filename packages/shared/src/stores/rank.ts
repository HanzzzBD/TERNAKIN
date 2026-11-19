import type {
  KomposisiRujukanItem,
  RincianHargaRujukan,
  Toko,
  TokoTerurut,
} from "../schemas/toko.js";

const MS_PER_HARI = 24 * 60 * 60 * 1000;

export function hitungUmurHari(diperbaruiPada: string, sekarang: Date = new Date()): number {
  const waktu = Date.parse(diperbaruiPada);
  if (!Number.isFinite(waktu)) {
    return 0;
  }
  const selisihMs = Math.max(0, sekarang.getTime() - waktu);
  return Math.floor(selisihMs / MS_PER_HARI);
}

export function formatUmurHarga(umurHari: number | null): string {
  if (umurHari === null) return "Belum ada pembaruan";
  if (umurHari === 0) return "Hari ini";
  if (umurHari === 1) return "1 hari lalu";
  return `${umurHari} hari lalu`;
}

export interface RankStoresOptions {
  tokoList: readonly Toko[];
  komposisi: readonly KomposisiRujukanItem[];
  staleDays: number;
  sekarang?: Date;
}

/**
 * Fungsi murni pengurutan toko rujukan.
 * Aturan produk mutlak: urutan HANYA berdasarkan total biaya pakan (menaik),
 * tidak pernah dipengaruhi status mitra atau komisi.
 * Harga yang melewati staleDays tetap tampil dengan penanda isUsang / hasHargaUsang.
 */
export function rankStores(options: RankStoresOptions): TokoTerurut[] {
  const { tokoList, komposisi, staleDays, sekarang = new Date() } = options;
  const adaKomposisi = komposisi.length > 0;

  const hasil: TokoTerurut[] = tokoList.map((toko) => {
    const petaHarga = new Map(toko.harga.map((h) => [h.bahanId, h]));
    const rincianHarga: RincianHargaRujukan[] = [];
    const bahanKurang: string[] = [];
    let totalBiaya = 0;

    if (adaKomposisi) {
      for (const item of komposisi) {
        const h = petaHarga.get(item.bahanId);
        if (!h) {
          bahanKurang.push(item.nama ?? item.bahanId);
          continue;
        }
        const umurHari = hitungUmurHari(h.diperbaruiPada, sekarang);
        const subtotal = Math.round(item.kgPer100Kg * h.harga);
        totalBiaya += item.kgPer100Kg * h.harga;
        rincianHarga.push({
          bahanId: h.bahanId,
          namaBahan: item.nama ?? h.namaBahan ?? h.bahanId,
          kgPer100Kg: item.kgPer100Kg,
          hargaPerKg: h.harga,
          subtotalPer100Kg: subtotal,
          asalHarga: h.asalHarga,
          diperbaruiPada: h.diperbaruiPada,
          umurHari,
          isUsang: umurHari > staleDays,
        });
      }
    } else {
      for (const h of toko.harga) {
        const umurHari = hitungUmurHari(h.diperbaruiPada, sekarang);
        rincianHarga.push({
          bahanId: h.bahanId,
          namaBahan: h.namaBahan ?? h.bahanId,
          kgPer100Kg: 0,
          hargaPerKg: h.harga,
          subtotalPer100Kg: 0,
          asalHarga: h.asalHarga,
          diperbaruiPada: h.diperbaruiPada,
          umurHari,
          isUsang: umurHari > staleDays,
        });
      }
    }

    const lengkap = adaKomposisi ? bahanKurang.length === 0 : false;
    const asalUnik = Array.from(new Set(rincianHarga.map((r) => r.asalHarga)));

    let diperbaruiTertuaPada: string | null = null;
    let umurHariTertua: number | null = null;
    for (const r of rincianHarga) {
      if (umurHariTertua === null || r.umurHari > umurHariTertua) {
        umurHariTertua = r.umurHari;
        diperbaruiTertuaPada = r.diperbaruiPada;
      }
    }

    return {
      id: toko.id,
      kode: toko.kode,
      nama: toko.nama,
      area: toko.area,
      statusMitra: toko.statusMitra,
      isDemo: toko.isDemo,
      nomorWa: toko.nomorWa ?? null,
      lengkap,
      bahanKurang,
      totalBiayaPer100Kg: lengkap ? Math.round(totalBiaya) : null,
      biayaPerKg: lengkap ? Math.round(totalBiaya / 100) : null,
      rincianHarga,
      asalHargaRingkas: asalUnik.join(", ") || "Belum tercatat",
      diperbaruiTertuaPada,
      umurHariTertua,
      hasHargaUsang: rincianHarga.some((r) => r.isUsang),
    };
  });

  if (!adaKomposisi) {
    return hasil.sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  }

  return hasil.sort((a, b) => {
    if (a.lengkap !== b.lengkap) {
      return a.lengkap ? -1 : 1;
    }
    if (a.totalBiayaPer100Kg !== null && b.totalBiayaPer100Kg !== null) {
      if (a.totalBiayaPer100Kg !== b.totalBiayaPer100Kg) {
        return a.totalBiayaPer100Kg - b.totalBiayaPer100Kg;
      }
    }
    return a.nama.localeCompare(b.nama, "id");
  });
}
