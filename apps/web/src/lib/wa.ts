import {
  formatAngka,
  formatRupiah,
  type RingkasanKasus,
  type TokoTerurut,
  type UrgensiKokok,
} from "@ternakin/shared";

const LABEL_URGENSI: Record<UrgensiKokok, string> = {
  rendah: "Rendah",
  sedang: "Sedang",
  tinggi: "Tinggi",
};

/**
 * Menyusun tautan WhatsApp (wa.me) untuk menghubungi toko pakan.
 * Bila toko belum memiliki nomor terverifikasi (misalnya data contoh),
 * tautan dibuka tanpa nomor tujuan agar tidak pernah memakai nomor palsu.
 */
export function buatTautanWhatsAppToko(toko: TokoTerurut, src?: string): string {
  const baris: string[] = [
    `Halo ${toko.nama} (${toko.kode}), saya ingin menanyakan ketersediaan dan harga bahan pakan dari Ternakin.`,
  ];

  if (toko.lengkap && toko.totalBiayaPer100Kg !== null) {
    baris.push("", "Rencana campuran per 100 kg:");
    for (const item of toko.rincianHarga) {
      baris.push(
        `- ${item.namaBahan}: ${formatAngka(item.kgPer100Kg, 1)} kg (${formatRupiah(item.hargaPerKg)}/kg)`,
      );
    }
    baris.push(`Perkiraan total: ${formatRupiah(toko.totalBiayaPer100Kg)}`);
  }

  if (src) {
    baris.push("", `Kode rujukan: ${src}`);
  }

  const teks = encodeURIComponent(baris.join("\n"));
  const nomor = toko.nomorWa?.replace(/[^\d]/g, "");
  return nomor ? `https://wa.me/${nomor}?text=${teks}` : `https://wa.me/?text=${teks}`;
}

/**
 * Menyusun tautan WhatsApp (wa.me/?text=...) berisi ringkasan kasus kesehatan ayam
 * untuk dibagikan peternak ke dokter hewan, puskeswan, atau penyuluh setempat.
 * Sengaja tanpa nomor tujuan karena belum ada nomor rujukan resmi yang diverifikasi.
 */
export function buatTautanWhatsAppKasus(ringkasan: RingkasanKasus): string {
  const baris: string[] = [
    "Ringkasan Kasus Kandang (Ternakin - Kokok)",
    `Kandang: ${ringkasan.kandang}`,
    `Jenis ayam: ${ringkasan.jenisAyam}`,
    `Umur: ${ringkasan.umurMinggu !== null ? `${ringkasan.umurMinggu} minggu` : "Belum diisi"}`,
    `Populasi: ${ringkasan.populasiEkor !== null ? `${formatAngka(ringkasan.populasiEkor, 0)} ekor` : "Belum diisi"}`,
    `Lokasi: ${ringkasan.lokasi ?? "Belum diisi"}`,
    `Gejala: ${ringkasan.gejala}`,
    `Sejak kapan: ${ringkasan.sejakKapan}`,
    `Urgensi awal (Kokok): ${LABEL_URGENSI[ringkasan.urgensi]}`,
  ];

  if (ringkasan.peringatan7Hari.length > 0) {
    baris.push("", "Peringatan catatan 7 hari terakhir:");
    for (const p of ringkasan.peringatan7Hari) {
      baris.push(`- ${p}`);
    }
  }

  baris.push("", "Catatan: ringkasan awal dari Kokok (bukan diagnosis dan tanpa dosis obat).");

  return `https://wa.me/?text=${encodeURIComponent(baris.join("\n"))}`;
}
