import type {
  AksiObrolan,
  BahanMaster,
  KategoriCakupan,
  PesanRiwayat,
  ItemUraiPakan,
  PakanHitungLayak,
  PakanHitungRequest,
  PakanHitungResult,
  UrgensiKokok,
} from "@ternakin/shared";

export type SumberLlm = "llm" | "mock";

export interface ParseFeedOutput {
  item: ItemUraiPakan[];
  catatan: string[];
  tokenMasuk: number;
  tokenKeluar: number;
  /** Diisi bila hasil berasal dari cadangan (mis. Gemini gagal lalu memakai mock). */
  sumber?: SumberLlm;
}

export interface ExplainFeedOutput {
  penjelasan: string;
  tokenMasuk: number;
  tokenKeluar: number;
  sumber?: SumberLlm;
}

export interface GuidelineChunk {
  id: string;
  judul: string;
  sumber: string;
  versi: string;
  isi: string;
  ringkasanKutipan: string;
  skor: number;
}

export interface GuidelineRetriever {
  search(query: string, k: number): Promise<GuidelineChunk[]>;
}

export interface TriageKokokInput {
  gejala: string;
  sejakKapan?: string;
  peringatan7Hari: readonly string[];
}

export interface TriageKokokOutput {
  urgensi: UrgensiKokok;
  alasanUrgensi: string;
  panduanUmum: string[];
  /** Jawaban langsung yang menanggapi pertanyaan (kosong untuk jawaban bawaan/mock). */
  jawaban?: string;
  /** true bila AI menilai potongan panduan tidak membahas gejala ini. */
  diLuarPanduan?: boolean;
  tokenMasuk: number;
  tokenKeluar: number;
}

export interface LlmAdapter {
  readonly sumber: SumberLlm;
  parseFeedText(teks: string, katalogBahan: readonly BahanMaster[]): Promise<ParseFeedOutput>;
  explainFeed(hasilSolver: PakanHitungLayak): Promise<ExplainFeedOutput>;
  triageKokok(
    input: TriageKokokInput,
    guidelines: readonly GuidelineChunk[],
  ): Promise<TriageKokokOutput>;
  /** Obrolan bebas (popup & halaman Kokok): sapaan, pertanyaan aplikasi, dan keluhan ayam. */
  ngobrol(input: ObrolanInput): Promise<ObrolanOutput>;
}

export interface SolverAdapter {
  optimize(req: PakanHitungRequest): Promise<PakanHitungResult>;
}

/** Kategori pesan obrolan; "boleh" = soal ayam/aplikasi, lainnya ditangani dengan hati-hati. */
export type KategoriObrolan = KategoriCakupan | "minta_obat" | "minta_diagnosis";

export interface ObrolanInput {
  pesan: string;
  riwayat: readonly PesanRiwayat[];
  konteks: "landing" | "aplikasi";
  kategori: KategoriObrolan;
  /** Potongan panduan kesehatan yang relevan (kosong untuk sapaan/pertanyaan aplikasi). */
  panduan: readonly GuidelineChunk[];
}

export interface ObrolanOutput {
  balasan: string;
  aksi: AksiObrolan;
  urgensi: UrgensiKokok | null;
  /** "mock" bila jawaban dari cadangan tanpa AI. */
  sumber?: SumberLlm;
  tokenMasuk: number;
  tokenKeluar: number;
}
