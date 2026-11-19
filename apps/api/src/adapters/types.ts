import type {
  BahanMaster,
  ItemUraiPakan,
  PakanHitungLayak,
  PakanHitungRequest,
  PakanHitungResult,
} from "@ternakin/shared";

export interface ParseFeedOutput {
  item: ItemUraiPakan[];
  catatan: string[];
  tokenMasuk: number;
  tokenKeluar: number;
}

export interface ExplainFeedOutput {
  penjelasan: string;
  tokenMasuk: number;
  tokenKeluar: number;
}

export interface LlmAdapter {
  readonly sumber: "llm" | "mock";
  parseFeedText(teks: string, katalogBahan: readonly BahanMaster[]): Promise<ParseFeedOutput>;
  explainFeed(hasilSolver: PakanHitungLayak): Promise<ExplainFeedOutput>;
}

export interface SolverAdapter {
  optimize(req: PakanHitungRequest): Promise<PakanHitungResult>;
}
