import { formatAngka, formatRupiah, type TokoTerurut } from "@ternakin/shared";

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
