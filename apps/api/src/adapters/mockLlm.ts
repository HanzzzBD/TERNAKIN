import {
  formatAngka,
  formatRupiah,
  type BahanMaster,
  type ItemUraiPakan,
  type PakanHitungLayak,
  type UrgensiKokok,
} from "@ternakin/shared";
import { balasObrolanCadangan } from "./obrolanCadangan.js";
import type {
  ExplainFeedOutput,
  ObrolanInput,
  ObrolanOutput,
  GuidelineChunk,
  LlmAdapter,
  ParseFeedOutput,
  TriageKokokInput,
  TriageKokokOutput,
} from "./types.js";

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

/** Panduan yang menandakan tanda bahaya: bila paling cocok, urgensi aturan bawaan = tinggi. */
export const PANDUAN_BAHAYA_TINGGI: ReadonlySet<string> = new Set([
  "panduan_kematian_mendadak",
  "kewaspadaan_flu_burung",
  "kewaspadaan_nd_tetelo",
]);

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

  async triageKokok(
    input: TriageKokokInput,
    guidelines: readonly GuidelineChunk[],
  ): Promise<TriageKokokOutput> {
    const teks = normalisasiTeks(input.gejala);
    const peringatanGabung = normalisasiTeks(input.peringatan7Hari.join(" "));
    const utama = guidelines[0];

    const polaTinggi =
      /\b(?:mati mendadak|kematian mendadak|banyak mati|mati beberapa|leher terpuntir|kejang|lumpuh|jengger biru|kebiruan|sesak napas berat|sesak berat)\b/i;
    const polaSedang =
      /\b(?:ngorok|bersin|lendir|muka bengkak|mata berair|diare|mencret|berdarah|lesu|lemas|telur turun|nafsu makan turun|kotoran hijau|kotoran putih)\b/i;
    const polaStresPanas = /\b(?:panting|megap|panas|sayap menggantung|kepanasan)\b/i;

    let urgensi: UrgensiKokok;
    if (
      polaTinggi.test(teks) ||
      PANDUAN_BAHAYA_TINGGI.has(utama?.id ?? "") ||
      /\bkematian\b/i.test(peringatanGabung)
    ) {
      urgensi = "tinggi";
    } else if (
      polaStresPanas.test(teks) &&
      !polaSedang.test(teks) &&
      utama?.id === "panduan_stres_panas"
    ) {
      urgensi = "rendah";
    } else {
      urgensi = "sedang";
    }

    let alasanUrgensi: string;
    let panduanUmum: string[];

    if (urgensi === "tinggi") {
      alasanUrgensi =
        "Gejala yang dilaporkan mengarah pada tanda bahaya dengan risiko penularan atau kerugian tinggi. Pemeriksaan langsung oleh dokter hewan atau petugas puskeswan sangat disarankan segera.";
      panduanUmum = [
        "Segera pisahkan ayam yang tampak sakit ke area karantina terpisah dan jangan memindahkan ayam hidup atau bangkai keluar kandang.",
        "Laporkan kondisi kandang ke dokter hewan, puskeswan, atau dinas peternakan setempat dalam 24 jam dengan membawa ringkasan kasus.",
        "Batasi lalu lintas orang, peralatan, dan kendaraan masuk-keluar kandang; cuci alas kaki dan tangan setiap selesai menangani ayam.",
        "Catat jumlah kematian, jam mulai muncul gejala, serta perubahan pakan dan telur hari ini.",
      ];
    } else if (urgensi === "rendah") {
      alasanUrgensi =
        "Gejala tampak ringan dan mengarah pada ketidaknyamanan lingkungan (seperti panas berlebih) tanpa tanda bahaya berat. Tetap pantau ketat dalam 24 jam ke depan.";
      panduanUmum = [
        "Perbaiki aliran udara kandang dan buka tirai menyesuaikan arah angin agar panas tidak terperangkap.",
        "Pastikan ketersediaan air minum bersih dan sejuk selalu cukup sepanjang hari.",
        "Jadwalkan pemberian pakan pada jam yang lebih teduh (pagi dan sore) serta pantau suhu kandang secara berkala.",
        "Bila gejala tidak membaik dalam 24 jam atau muncul kematian/gejala lain, segera hubungi penyuluh atau puskeswan.",
      ];
    } else if (utama?.id === "panduan_pernapasan") {
      alasanUrgensi =
        "Gejala gangguan pernapasan dapat menular cepat antar ayam di satu kandang, sehingga perlu isolasi awal dan konsultasi dengan penyuluh atau puskeswan.";
      panduanUmum = [
        "Pisahkan ayam yang ngorok, bersin, atau matanya berair ke kandang karantina.",
        "Periksa ventilasi udara, bau amonia, dan kelembapan alas kandang agar tidak pengap.",
        "Bersihkan tempat minum dan tempat pakan setiap hari, serta rawat ayam sehat terlebih dahulu sebelum ayam sakit.",
        "Siapkan ringkasan kasus di bawah ini untuk ditunjukkan ke penyuluh peternakan atau puskeswan.",
      ];
    } else if (utama?.id === "panduan_diare") {
      alasanUrgensi =
        "Gangguan kotoran encer atau berdarah berisiko menurunkan kondisi tubuh dan produksi telur, sehingga perlu perbaikan sanitasi segera dan pemeriksaan lanjutan oleh ahli.";
      panduanUmum = [
        "Isolasi ayam yang tampak lemah dan periksa apakah ada tambahan ayam dengan gejala kotoran serupa.",
        "Periksa kualitas air minum dan pastikan penyimpanan pakan kering serta bebas jamur.",
        "Jaga alas kandang tetap kering dan bersih untuk memutus penularan lewat kotoran.",
        "Catat warna kotoran serta jumlah ekor terdampak dan bagikan ringkasan kasus ke penyuluh atau puskeswan.",
      ];
    } else {
      alasanUrgensi =
        "Penurunan kondisi atau produktivitas ayam perlu ditelusuri penyebabnya lebih lanjut agar tidak berkembang menjadi masalah kandang yang lebih luas.";
      panduanUmum = [
        "Pisahkan ayam yang tampak lesu atau menyendiri untuk pemantauan ketat.",
        "Tinjau catatan harian tujuh hari terakhir: kecukupan pakan, air minum, suhu kandang, dan perubahan bahan pakan.",
        "Jaga kebersihan peralatan pakan-minum serta batasi keluar-masuk orang ke area kandang.",
        "Hubungi penyuluh peternakan atau puskeswan bila kondisi tidak membaik dalam dua hari atau muncul gejala tambahan.",
      ];
    }

    const isiPanduan = guidelines.map((g) => g.isi).join("\n");
    return {
      urgensi,
      alasanUrgensi,
      panduanUmum,
      tokenMasuk: estimasiToken(`${input.gejala}\n${isiPanduan}`),
      tokenKeluar: estimasiToken(`${alasanUrgensi}\n${panduanUmum.join("\n")}`),
    };
  }

  async ngobrol(input: ObrolanInput): Promise<ObrolanOutput> {
    return balasObrolanCadangan(input);
  }
}
