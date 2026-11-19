import type { PakanHitungLayak } from "../schemas/pakan.js";

export interface HasilVerifikasiPenjelasan {
  terverifikasi: boolean;
  angkaMenyimpang: string[];
}

function parseAngkaIndonesia(token: string): number | null {
  const bersih = token.trim();
  if (!bersih) return null;

  // Format ribuan Indonesia: 1.234 atau 1.234.567 (opsional ,desimal)
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(bersih)) {
    const nilai = Number(bersih.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(nilai) ? nilai : null;
  }

  // Format desimal koma Indonesia: 33,3 atau 17,5
  if (/^\d+,\d+$/.test(bersih)) {
    const nilai = Number(bersih.replace(",", "."));
    return Number.isFinite(nilai) ? nilai : null;
  }

  // Bilangan biasa atau desimal titik: 100 atau 33.3
  const nilai = Number(bersih);
  return Number.isFinite(nilai) ? nilai : null;
}

function kumpulkanAngkaDiizinkan(hasil: PakanHitungLayak): number[] {
  const angka = new Set<number>([100]);

  const tambahVariasi = (nilai: number | null | undefined) => {
    if (nilai === null || nilai === undefined || !Number.isFinite(nilai)) return;
    const abs = Math.abs(nilai);
    angka.add(abs);
    angka.add(Math.round(abs));
    angka.add(Math.round(abs * 10) / 10);
    angka.add(Math.round(abs * 100) / 100);
  };

  tambahVariasi(hasil.biayaPerKg);
  tambahVariasi(hasil.totalBiayaPer100Kg);
  tambahVariasi(hasil.selisihPerKg);
  tambahVariasi(hasil.komposisi.length);

  for (const item of hasil.komposisi) {
    tambahVariasi(item.persentase);
    tambahVariasi(item.kgPer100Kg);
    tambahVariasi(item.hargaPerKg);
    tambahVariasi(item.subtotalPer100Kg);
  }

  for (const gizi of hasil.pemenuhanGizi) {
    tambahVariasi(gizi.nilai);
    tambahVariasi(gizi.batasMin);
    tambahVariasi(gizi.batasMaks);
  }

  return Array.from(angka);
}

/**
 * Memastikan penjelasan dari LLM tidak pernah menyebut angka yang berbeda dari hasil solver.
 * Bila ditemukan satu saja angka menyimpang, penjelasan wajib dibuang.
 */
export function verifyFeedExplanation(
  penjelasan: string,
  hasilSolver: PakanHitungLayak,
): HasilVerifikasiPenjelasan {
  const teks = penjelasan.trim();
  if (!teks) {
    return { terverifikasi: false, angkaMenyimpang: ["(kosong)"] };
  }

  const diizinkan = kumpulkanAngkaDiizinkan(hasilSolver);
  const cocok = teks.match(/\d+(?:[.,]\d+)*/g) ?? [];
  const angkaMenyimpang: string[] = [];

  for (const token of cocok) {
    const nilai = parseAngkaIndonesia(token);
    if (nilai === null) continue;
    const sesuai = diizinkan.some((target) => {
      const tol = Math.max(0.06, Math.abs(target) * 0.001);
      return Math.abs(target - nilai) <= tol;
    });
    if (!sesuai) {
      angkaMenyimpang.push(token);
    }
  }

  return {
    terverifikasi: angkaMenyimpang.length === 0,
    angkaMenyimpang,
  };
}
