import type Database from "better-sqlite3";
import type { GuidelineChunk, GuidelineRetriever } from "./types.js";

interface DokumenPanduanRow {
  id: string;
  judul: string;
  sumber: string;
  isi: string;
  versi: string;
}

const STOPWORDS_ID = new Set([
  "yang",
  "dan",
  "di",
  "ke",
  "dari",
  "ini",
  "itu",
  "untuk",
  "atau",
  "dengan",
  "pada",
  "adalah",
  "ada",
  "saya",
  "kami",
  "anda",
  "ayam",
  "petelur",
  "unggas",
  "kandang",
  "apakah",
  "bagaimana",
  "kenapa",
  "kapan",
  "berapa",
  "bisa",
  "hari",
  "minggu",
  "bulan",
  "tahun",
  "sudah",
  "belum",
  "sangat",
  "agak",
  "sedikit",
  "beberapa",
  "ekor",
  "tapi",
  "kalau",
  "jika",
  "bila",
  "mau",
  "minta",
  "kasih",
  "tolong",
  "cara",
  "apa",
  "seperti",
  "juga",
  "saja",
  "harus",
  "perlu",
  "akan",
  "bukan",
  "tidak",
  "tampak",
  "terlihat",
  "mulai",
  "sejak",
  "depan",
  "kemarin",
  "tadi",
  "pakan",
  "harga",
  "agar",
  "cepat",
  "merawat",
  "rawat",
  "lebih",
  "lanjut",
  "tanpa",
  "hanya",
  "karena",
  "sehingga",
  "dalam",
  "waktu",
  "sering",
  "banyak",
  "semua",
  "setiap",
  "tetap",
  "segera",
  "periksa",
  "catat",
  "jaga",
  "turun",
  "naik",
  "baik",
  "baru",
  "lama",
]);

const SINONIM_GEJALA: Record<string, readonly string[]> = {
  mati: ["kematian", "mendadak", "bangkai"],
  kematian: ["mati", "mendadak"],
  ngorok: ["pernapasan", "bersin", "sesak", "napas", "lendir"],
  bersin: ["ngorok", "pernapasan", "lendir"],
  pilek: ["lendir", "hidung", "pernapasan", "mata"],
  snot: ["bengkak", "mata", "wajah", "pernapasan", "sinus"],
  tetelo: ["terpuntir", "kejang", "saraf", "kematian", "mendadak"],
  ceker: ["lumpuh", "saraf"],
  mencret: ["diare", "kotoran", "encer", "berdarah"],
  berak: ["diare", "kotoran", "encer", "berdarah"],
  diare: ["kotoran", "encer", "berdarah"],
  darah: ["berdarah", "kotoran", "diare"],
  panas: ["panting", "megap", "suhu", "sayap", "ventilasi"],
  panting: ["panas", "megap", "sayap", "suhu"],
  megap: ["panting", "panas", "sesak"],
  lemas: ["lesu", "nafsu", "makan", "menyendiri"],
  lesu: ["nafsu", "makan", "menyendiri", "kusam"],
  telur: ["produksi", "turun", "merosot"],
  biru: ["kebiruan", "jengger", "pial"],
  jengger: ["kebiruan", "bengkak", "pial"],
  leher: ["terpuntir", "kejang", "saraf"],
};

function tokenisasi(teks: string): string[] {
  return teks
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS_ID.has(token));
}

function perluasToken(tokens: readonly string[]): Set<string> {
  const hasil = new Set<string>(tokens);
  for (const token of tokens) {
    const sinonim = SINONIM_GEJALA[token];
    if (sinonim) {
      for (const s of sinonim) {
        hasil.add(s);
      }
    }
  }
  return hasil;
}

export function buatRingkasanKutipan(isi: string): string {
  const kalimat = isi
    .split(/(?<=[.!?])\s+/)
    .map((k) => k.trim())
    .filter(Boolean);
  const gabungan = kalimat.slice(0, 2).join(" ");
  if (gabungan.length <= 240) {
    return gabungan;
  }
  return `${gabungan.slice(0, 237).trimEnd()}...`;
}

function hitungSkorDokumen(
  queryTokensAsli: readonly string[],
  queryTokensPerluas: ReadonlySet<string>,
  dok: DokumenPanduanRow,
): number {
  const judulTokens = new Set(tokenisasi(dok.judul));
  const isiTokens = new Set(tokenisasi(dok.isi));

  let skor = 0;
  let cocokAsli = 0;

  for (const token of queryTokensAsli) {
    const cocokJudul =
      judulTokens.has(token) ||
      [...judulTokens].some(
        (t) => token.length >= 5 && t.length >= 5 && (t.startsWith(token) || token.startsWith(t)),
      );
    const cocokIsi =
      isiTokens.has(token) ||
      [...isiTokens].some(
        (t) => token.length >= 5 && t.length >= 5 && (t.startsWith(token) || token.startsWith(t)),
      );

    if (cocokJudul) {
      skor += 3;
      cocokAsli += 1;
    } else if (cocokIsi) {
      skor += 2;
      cocokAsli += 1;
    }
  }

  // Bonus kecil dari sinonim gejala agar istilah peternak tetap menemukan panduan resmi
  for (const token of queryTokensPerluas) {
    if (queryTokensAsli.includes(token)) continue;
    if (judulTokens.has(token)) {
      skor += 1.5;
    } else if (isiTokens.has(token)) {
      skor += 1;
    }
  }

  // Syarat minimal: harus ada kecocokan langsung atau minimal dua sinonim gejala yang cocok
  if (cocokAsli === 0 && skor < 2) {
    return 0;
  }

  return skor;
}

export class SqliteGuidelineRetriever implements GuidelineRetriever {
  constructor(private readonly db: Database.Database) {}

  async search(query: string, k: number): Promise<GuidelineChunk[]> {
    const tokensAsli = [...new Set(tokenisasi(query))];
    if (tokensAsli.length === 0) {
      return [];
    }

    const tokensPerluas = perluasToken(tokensAsli);
    const rows = this.db
      .prepare("SELECT id, judul, sumber, isi, versi FROM dokumen_panduan ORDER BY id ASC")
      .all() as DokumenPanduanRow[];

    const hasil: GuidelineChunk[] = [];
    for (const row of rows) {
      const skor = hitungSkorDokumen(tokensAsli, tokensPerluas, row);
      if (skor >= 2) {
        hasil.push({
          id: row.id,
          judul: row.judul,
          sumber: row.sumber,
          versi: row.versi,
          isi: row.isi,
          ringkasanKutipan: buatRingkasanKutipan(row.isi),
          skor,
        });
      }
    }

    return hasil.sort((a, b) => b.skor - a.skor || a.id.localeCompare(b.id)).slice(0, k);
  }
}
