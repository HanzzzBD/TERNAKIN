import { formatAngka } from "../lib/format.js";
import type {
  AmbangPeringatan,
  CatatanHarian,
  Kandang,
  PeringatanDini,
} from "../schemas/catatan.js";

/**
 * Fungsi murni evaluasi peringatan dini dari ambang umum pada data referensi.
 * Semua nilai ambang berasal dari parameter data (bukan konstanta di kode),
 * sehingga berjalan identik secara offline di perangkat dan di server.
 */
export function evaluateAlerts(
  catatanList: readonly CatatanHarian[],
  kandang: Pick<Kandang, "nama" | "jenisAyam" | "jumlahEkor" | "umurMinggu">,
  daftarAmbang: readonly AmbangPeringatan[],
): PeringatanDini[] {
  const ambang = daftarAmbang.find((item) => item.jenisAyam === kandang.jenisAyam);
  if (!ambang) {
    return [];
  }

  const aktif = catatanList
    .filter((c) => !c.dihapusPada)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const terbaru = aktif[0];
  if (!terbaru) {
    return [];
  }

  const peringatan: PeringatanDini[] = [];

  if (terbaru.kematian !== null && terbaru.kematian > 0 && kandang.jumlahEkor > 0) {
    const persenMati = (terbaru.kematian / kandang.jumlahEkor) * 100;
    if (persenMati >= ambang.kematianPersenMaks) {
      const tingkat = persenMati >= ambang.kematianPersenMaks * 2 ? "tinggi" : "sedang";
      const alasan = `Kematian ${terbaru.kematian} ekor (${formatAngka(persenMati, 2)}% dari ${kandang.jumlahEkor} ekor) melebihi ambang umum ${formatAngka(ambang.kematianPersenMaks, 2)}%.`;
      peringatan.push({
        id: `${terbaru.id}:KEMATIAN_TINGGI`,
        kode: "KEMATIAN_TINGGI",
        tingkat,
        judul: "Kematian harian di atas ambang",
        alasan,
        tanggal: terbaru.tanggal,
        sumberAmbang: ambang.sumber,
        ringkasanKonteks: `Kandang ${kandang.nama} (${terbaru.tanggal}): ${alasan}`,
      });
    }
  }

  if (terbaru.suhu !== null && terbaru.suhu > ambang.suhuMaksC) {
    const alasan = `Suhu kandang ${formatAngka(terbaru.suhu, 1)} °C melebihi batas atas ${formatAngka(ambang.suhuMaksC, 1)} °C.`;
    peringatan.push({
      id: `${terbaru.id}:SUHU_TINGGI`,
      kode: "SUHU_TINGGI",
      tingkat: "sedang",
      judul: "Suhu kandang terlalu panas",
      alasan,
      tanggal: terbaru.tanggal,
      sumberAmbang: ambang.sumber,
      ringkasanKonteks: `Kandang ${kandang.nama} (${terbaru.tanggal}): ${alasan}`,
    });
  } else if (terbaru.suhu !== null && terbaru.suhu < ambang.suhuMinC) {
    const alasan = `Suhu kandang ${formatAngka(terbaru.suhu, 1)} °C di bawah batas bawah ${formatAngka(ambang.suhuMinC, 1)} °C.`;
    peringatan.push({
      id: `${terbaru.id}:SUHU_RENDAH`,
      kode: "SUHU_RENDAH",
      tingkat: "sedang",
      judul: "Suhu kandang terlalu dingin",
      alasan,
      tanggal: terbaru.tanggal,
      sumberAmbang: ambang.sumber,
      ringkasanKonteks: `Kandang ${kandang.nama} (${terbaru.tanggal}): ${alasan}`,
    });
  }

  const dalamMasaBertelur =
    kandang.umurMinggu === null || kandang.umurMinggu === undefined || kandang.umurMinggu >= 18;
  if (
    kandang.jenisAyam === "petelur" &&
    dalamMasaBertelur &&
    terbaru.telur !== null &&
    kandang.jumlahEkor > 0
  ) {
    const persenTelur = (terbaru.telur / kandang.jumlahEkor) * 100;
    if (persenTelur < ambang.produksiTelurMinPersen) {
      const alasan = `Produksi telur ${terbaru.telur} butir (${formatAngka(persenTelur, 1)}%) di bawah ambang umum ${formatAngka(ambang.produksiTelurMinPersen, 0)}%.`;
      peringatan.push({
        id: `${terbaru.id}:PRODUKSI_RENDAH`,
        kode: "PRODUKSI_RENDAH",
        tingkat: "sedang",
        judul: "Produksi telur di bawah ambang umum",
        alasan,
        tanggal: terbaru.tanggal,
        sumberAmbang: ambang.sumber,
        ringkasanKonteks: `Kandang ${kandang.nama} (${terbaru.tanggal}): ${alasan}`,
      });
    }
  }

  return peringatan.sort((a, b) => {
    if (a.tingkat === b.tingkat) return 0;
    return a.tingkat === "tinggi" ? -1 : 1;
  });
}
