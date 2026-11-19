import {
  formatAngka,
  formatRupiah,
  type BahanMaster,
  type ItemUraiPakan,
  type PakanHitungLayak,
} from "@ternakin/shared";
import type { ExplainFeedOutput, LlmAdapter, ParseFeedOutput } from "./types.js";

function normalisasiTeks(teks: string): string {
  return teks.toLowerCase().replace(/\s+/g, " ").trim();
}

function parseHargaToken(angkaMentah: string, adaRibu: boolean): number | null {
  const bersih = angkaMentah.trim();
  if (!bersih) return null;

  if (adaRibu) {
    const nilai = Number(bersih.replace(",", "."));
    return Number.isFinite(nilai) && nilai > 0 ? Math.round(nilai * 1000) : null;
  }

  // Format ribuan Indonesia: 6.500 atau 12.000
  if (/^\d{1,3}(\.\d{3})+$/.test(bersih)) {
    const nilai = Number(bersih.replace(/\./g, ""));
    return Number.isFinite(nilai) && nilai > 0 ? nilai : null;
  }

  const nilai = Number(bersih.replace(",", "."));
  return Number.isFinite(nilai) && nilai > 0 ? Math.round(nilai) : null;
}

function cariBahanCocok(namaMentah: string, katalog: readonly BahanMaster[]): BahanMaster | null {
  const target = normalisasiTeks(namaMentah);
  if (!target) return null;

  let terbaik: { bahan: BahanMaster; skor: number } | null = null;

  for (const bahan of katalog) {
    const kandidat = [bahan.nama, ...bahan.sinonim].map(normalisasiTeks);
    for (const k of kandidat) {
      if (target === k) {
        return bahan;
      }
      if (target.includes(k) || k.includes(target)) {
        const skor = Math.min(k.length, target.length);
        if (!terbaik || skor > terbaik.skor) {
          terbaik = { bahan, skor };
        }
      }
    }
  }

  return terbaik?.bahan ?? null;
}

function estimasiToken(teks: string): number {
  return Math.max(1, Math.ceil(teks.length / 4));
}

export class MockLlmAdapter implements LlmAdapter {
  readonly sumber = "mock" as const;

  async parseFeedText(
    teks: string,
    katalogBahan: readonly BahanMaster[],
  ): Promise<ParseFeedOutput> {
    const potongan = teks
      .split(/[,;\n]+|\bdan\b/i)
      .map((s) => s.trim())
      .filter(Boolean);

    const item: ItemUraiPakan[] = [];
    const catatan: string[] = [];

    for (const baris of potongan) {
      const cocok = baris.match(
        /^([a-zA-Z\s()/-]+?)\s*(?:harga|rp\.?)?\s*(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)(?:\s*(rb|ribu|k))?(?:\s*(?:\/|per)\s*(kg|kilogram))?/i,
      );

      if (!cocok) {
        catatan.push(`Bagian "${baris}" tidak terbaca sebagai pasangan bahan dan harga.`);
        continue;
      }

      const namaMentah = (cocok[1] ?? "").replace(/[:=-]+$/g, "").trim();
      const angkaMentah = cocok[2] ?? "";
      const adaRibu = Boolean(cocok[3]);
      const hargaPerKg = parseHargaToken(angkaMentah, adaRibu);

      if (!namaMentah || hargaPerKg === null) {
        catatan.push(`Harga pada "${baris}" belum dapat dipastikan.`);
        continue;
      }

      const bahanCocok = cariBahanCocok(namaMentah, katalogBahan);
      if (!bahanCocok) {
        catatan.push(
          `Bahan "${namaMentah}" belum ada di daftar bahan baku. Pilih padanannya atau hapus baris ini.`,
        );
      }

      item.push({
        bahanId: bahanCocok?.id ?? null,
        namaMentah,
        namaBahan: bahanCocok?.nama ?? namaMentah,
        hargaPerKg,
        satuan: bahanCocok?.satuan ?? "kg",
      });
    }

    if (item.length === 0 && catatan.length === 0) {
      catatan.push("Belum ditemukan bahan dan harga. Contoh format: Jagung 6.500, dedak 4.000.");
    }

    return {
      item,
      catatan,
      tokenMasuk: estimasiToken(teks),
      tokenKeluar: estimasiToken(JSON.stringify(item)),
    };
  }

  async explainFeed(hasilSolver: PakanHitungLayak): Promise<ExplainFeedOutput> {
    const utama = hasilSolver.komposisi.slice(0, 2);
    const ringkasBahan = utama
      .map((item) => `${item.nama} (${formatAngka(item.kgPer100Kg, 1)} kg)`)
      .join(" dan ");

    const kalimatUtama = `Untuk 100 kg pakan fase ${hasilSolver.fase}, campuran termurah berada di ${formatRupiah(hasilSolver.biayaPerKg)} per kg (total ${formatRupiah(hasilSolver.totalBiayaPer100Kg)}).`;
    const kalimatBahan = ringkasBahan
      ? ` Porsi terbesar memakai ${ringkasBahan} agar kebutuhan gizi tetap terpenuhi.`
      : "";

    let kalimatSelisih = "";
    if (hasilSolver.selisihPerKg !== undefined && hasilSolver.selisihPerKg > 0) {
      kalimatSelisih = ` Dibanding biaya ransum Anda sekarang, campuran ini lebih rendah ${formatRupiah(hasilSolver.selisihPerKg)} per kg.`;
    } else if (hasilSolver.selisihPerKg !== undefined && hasilSolver.selisihPerKg < 0) {
      kalimatSelisih = ` Biaya campuran ini ${formatRupiah(Math.abs(hasilSolver.selisihPerKg))} per kg di atas ransum Anda sekarang, namun seluruh target gizi terpenuhi.`;
    }

    const penjelasan = `${kalimatUtama}${kalimatBahan}${kalimatSelisih}`;

    return {
      penjelasan,
      tokenMasuk: estimasiToken(JSON.stringify(hasilSolver.komposisi)),
      tokenKeluar: estimasiToken(penjelasan),
    };
  }
}
