import crypto from "node:crypto";
import type { Database } from "../db/sqlite.js";
import { logger } from "../lib/logger.js";
import type { GeminiClient } from "./geminiClient.js";
import { buatRingkasanKutipan } from "./sqliteGuidelineRetriever.js";
import type { GuidelineChunk, GuidelineRetriever } from "./types.js";

/**
 * Pencarian panduan Kokok berbasis makna (embedding Gemini), vektor disimpan di SQLite.
 *
 * - Indeks dibangun ulang hanya untuk panduan yang baru atau isinya berubah (dibandingkan lewat hash).
 * - Panduan dianggap relevan bila kemiripan kosinus >= ambang.
 * - Bila tidak ada yang melewati ambang, embedding gagal, atau indeks belum siap, pencarian
 *   kata kunci yang lama dipakai; bila itu pun kosong, Kokok berkata "tidak tahu" sesuai SDD.
 */

interface DokumenRow {
  id: string;
  judul: string;
  sumber: string;
  isi: string;
  versi: string;
}

interface EmbeddingRow {
  dokumen_id: string;
  model: string;
  hash_isi: string;
  vektor: Uint8Array;
}

interface EntriIndeks {
  dokumen: DokumenRow;
  vektor: Float32Array;
}

const MAKS_CACHE_KUERI = 200;
const UKURAN_BATCH_EMBED = 50;

export interface EmbeddingGuidelineRetrieverOptions {
  /** Ambang kemiripan kosinus minimum (0..1) agar panduan dianggap relevan. */
  ambangKemiripan: number;
}

function teksDokumen(d: DokumenRow): string {
  return `${d.judul}\n${d.isi}`;
}

function hashDokumen(d: DokumenRow, model: string): string {
  return crypto
    .createHash("sha256")
    .update(`${model}\u0000${d.judul}\u0000${d.isi}\u0000${d.versi}`)
    .digest("hex");
}

function keBlob(vektor: readonly number[]): Buffer {
  const f32 = Float32Array.from(vektor);
  return Buffer.from(f32.buffer, f32.byteOffset, f32.byteLength);
}

function dariBlob(blob: Uint8Array): Float32Array {
  // Salin ke buffer baru agar perataan (alignment) Float32 selalu benar.
  const salinan = new Uint8Array(blob.byteLength);
  salinan.set(blob);
  return new Float32Array(salinan.buffer);
}

export function kemiripanKosinus(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let titik = 0;
  let normaA = 0;
  let normaB = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    titik += x * y;
    normaA += x * x;
    normaB += y * y;
  }
  if (normaA === 0 || normaB === 0) return 0;
  return titik / (Math.sqrt(normaA) * Math.sqrt(normaB));
}

export class EmbeddingGuidelineRetriever implements GuidelineRetriever {
  private indeks: EntriIndeks[] = [];
  private readonly cacheKueri = new Map<string, Float32Array>();

  constructor(
    private readonly db: Database,
    private readonly client: GeminiClient,
    private readonly cadangan: GuidelineRetriever,
    private readonly opsi: EmbeddingGuidelineRetrieverOptions,
  ) {}

  /** Jumlah panduan yang sudah punya vektor dan siap dicari. */
  get jumlahTerindeks(): number {
    return this.indeks.length;
  }

  /**
   * Menyelaraskan tabel panduan_embedding dengan dokumen_panduan.
   * Aman dipanggil berulang; hanya panduan baru/berubah yang dikirim ke Gemini.
   */
  async sinkronkanIndeks(): Promise<void> {
    const model = this.client.embeddingModel;
    const dokumen = this.db
      .prepare("SELECT id, judul, sumber, isi, versi FROM dokumen_panduan ORDER BY id ASC")
      .all() as DokumenRow[];
    const tersimpan = new Map(
      (
        this.db
          .prepare("SELECT dokumen_id, model, hash_isi, vektor FROM panduan_embedding")
          .all() as EmbeddingRow[]
      ).map((r) => [r.dokumen_id, r]),
    );

    const perluDiperbarui = dokumen.filter((d) => {
      const lama = tersimpan.get(d.id);
      return !lama || lama.model !== model || lama.hash_isi !== hashDokumen(d, model);
    });

    if (perluDiperbarui.length > 0) {
      const simpan = this.db.prepare(
        `INSERT OR REPLACE INTO panduan_embedding
           (dokumen_id, model, hash_isi, dimensi, vektor, diperbarui_pada)
         VALUES (?, ?, ?, ?, ?, ?)`,
      );

      for (let i = 0; i < perluDiperbarui.length; i += UKURAN_BATCH_EMBED) {
        const batch = perluDiperbarui.slice(i, i + UKURAN_BATCH_EMBED);
        const vektor = await this.client.embed(batch.map(teksDokumen), "dokumen");
        const sekarang = new Date().toISOString();
        this.db.transaction(() => {
          batch.forEach((d, j) => {
            const v = vektor[j] ?? [];
            simpan.run(d.id, model, hashDokumen(d, model), v.length, keBlob(v), sekarang);
          });
        })();
      }

      logger.info(
        { jumlah: perluDiperbarui.length, model },
        "Indeks embedding panduan Kokok diperbarui",
      );
    }

    // Muat ulang indeks ke memori hanya dari baris yang cocok dengan model dan isi saat ini.
    const baris = this.db
      .prepare("SELECT dokumen_id, model, hash_isi, vektor FROM panduan_embedding WHERE model = ?")
      .all(model) as EmbeddingRow[];
    const barisPerId = new Map(baris.map((r) => [r.dokumen_id, r]));

    this.indeks = dokumen.flatMap((d) => {
      const r = barisPerId.get(d.id);
      if (!r || r.hash_isi !== hashDokumen(d, model)) return [];
      return [{ dokumen: d, vektor: dariBlob(r.vektor) }];
    });
    this.cacheKueri.clear();
  }

  async search(query: string, k: number): Promise<GuidelineChunk[]> {
    const kueri = query.trim();
    if (!kueri) return [];

    if (this.indeks.length === 0) {
      return this.cadangan.search(query, k);
    }

    try {
      const vektorKueri = await this.vektorKueri(kueri);
      const hasil: GuidelineChunk[] = [];

      for (const { dokumen, vektor } of this.indeks) {
        const skor = kemiripanKosinus(vektorKueri, vektor);
        if (skor >= this.opsi.ambangKemiripan) {
          hasil.push({
            id: dokumen.id,
            judul: dokumen.judul,
            sumber: dokumen.sumber,
            versi: dokumen.versi,
            isi: dokumen.isi,
            ringkasanKutipan: buatRingkasanKutipan(dokumen.isi),
            skor,
          });
        }
      }

      if (hasil.length === 0) {
        // Istilah lokal peternak kadang lolos dari embedding; kata kunci + sinonim punya ambang sendiri.
        return this.cadangan.search(query, k);
      }

      return hasil.sort((a, b) => b.skor - a.skor || a.id.localeCompare(b.id)).slice(0, k);
    } catch (err) {
      logger.warn(
        { galat: err instanceof Error ? err.message : String(err) },
        "Embedding kueri gagal, memakai pencarian kata kunci",
      );
      return this.cadangan.search(query, k);
    }
  }

  private async vektorKueri(kueri: string): Promise<Float32Array> {
    const kunci = kueri.toLowerCase().replace(/\s+/g, " ");
    const tersimpan = this.cacheKueri.get(kunci);
    if (tersimpan) return tersimpan;

    const [vektor] = await this.client.embed([kueri], "kueri");
    const hasil = Float32Array.from(vektor ?? []);

    if (this.cacheKueri.size >= MAKS_CACHE_KUERI) {
      const tertua = this.cacheKueri.keys().next().value;
      if (tertua !== undefined) this.cacheKueri.delete(tertua);
    }
    this.cacheKueri.set(kunci, hasil);
    return hasil;
  }
}
