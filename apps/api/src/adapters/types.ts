import type {
  BahanMaster,
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
}

export interface SolverAdapter {
  optimize(req: PakanHitungRequest): Promise<PakanHitungResult>;
}
