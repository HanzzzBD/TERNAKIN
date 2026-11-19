export interface BuktiLapanganItem {
  id: string;
  namaAtauInisial: string;
  wilayah: string;
  peran: "peternak" | "toko";
  ringkasanHasil: string;
  kutipan: string;
  tanggalVerifikasi: string;
}

/**
 * Daftar bukti nyata dari pilot lapangan.
 * Dibiarkan kosong sampai ada wawancara dan hasil uji pilot yang terverifikasi;
 * tidak boleh diisi testimoni atau angka buatan.
 */
export const BUKTI_LAPANGAN: readonly BuktiLapanganItem[] = [];
