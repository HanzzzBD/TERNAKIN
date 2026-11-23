import type { Database } from "../db/sqlite.js";
import type { AppEnv } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { EmbeddingGuidelineRetriever } from "./embeddingGuidelineRetriever.js";
import { GeminiClient } from "./geminiClient.js";
import { GeminiLlmAdapter } from "./geminiLlm.js";
import { MockLlmAdapter } from "./mockLlm.js";
import { SqliteGuidelineRetriever } from "./sqliteGuidelineRetriever.js";
import type { GuidelineRetriever, LlmAdapter } from "./types.js";

export type EnvLlm = Pick<
  AppEnv,
  | "LLM_PROVIDER"
  | "LLM_API_KEY"
  | "LLM_MODEL"
  | "LLM_EMBEDDING_MODEL"
  | "LLM_EMBEDDING_DIMENSI"
  | "LLM_THINKING_LEVEL"
  | "LLM_TIMEOUT_MS"
  | "LLM_MAX_OUTPUT_TOKENS"
  | "RAG_AMBANG_KEMIRIPAN"
>;

export interface PenyediaLlm {
  /** Penyedia yang benar-benar aktif (bisa "mock" walau diminta "gemini" tetapi kunci kosong). */
  penyediaAktif: "mock" | "gemini";
  llmAdapter: LlmAdapter;
  guidelineRetriever: GuidelineRetriever;
  /** Menyiapkan indeks embedding panduan. Tidak pernah melempar galat. */
  siapkan: () => Promise<void>;
}

export function buatPenyediaLlm(
  env: EnvLlm,
  db: Database,
  fetchFn?: typeof fetch,
): PenyediaLlm {
  const mock = new MockLlmAdapter();
  const kataKunci = new SqliteGuidelineRetriever(db);

  if (env.LLM_PROVIDER !== "gemini") {
    return {
      penyediaAktif: "mock",
      llmAdapter: mock,
      guidelineRetriever: kataKunci,
      siapkan: async () => {},
    };
  }

  if (!env.LLM_API_KEY) {
    logger.warn(
      "LLM_PROVIDER=gemini tetapi LLM_API_KEY kosong; server memakai jawaban bawaan (mock) dan pencarian kata kunci",
    );
    return {
      penyediaAktif: "mock",
      llmAdapter: mock,
      guidelineRetriever: kataKunci,
      siapkan: async () => {},
    };
  }

  const client = new GeminiClient({
    apiKey: env.LLM_API_KEY,
    model: env.LLM_MODEL,
    embeddingModel: env.LLM_EMBEDDING_MODEL,
    embeddingDimensi: env.LLM_EMBEDDING_DIMENSI,
    thinkingLevel: env.LLM_THINKING_LEVEL,
    timeoutMs: env.LLM_TIMEOUT_MS,
    fetchFn,
  });

  const retriever = new EmbeddingGuidelineRetriever(db, client, kataKunci, {
    ambangKemiripan: env.RAG_AMBANG_KEMIRIPAN,
  });

  return {
    penyediaAktif: "gemini",
    llmAdapter: new GeminiLlmAdapter(client, mock, {
      maksTokenKeluar: env.LLM_MAX_OUTPUT_TOKENS,
    }),
    guidelineRetriever: retriever,
    siapkan: async () => {
      try {
        await retriever.sinkronkanIndeks();
        logger.info(
          { terindeks: retriever.jumlahTerindeks, model: env.LLM_EMBEDDING_MODEL },
          "Pencarian panduan Kokok berbasis embedding siap",
        );
      } catch (err) {
        logger.warn(
          { galat: err instanceof Error ? err.message : String(err) },
          "Gagal membangun indeks embedding; Kokok memakai pencarian kata kunci",
        );
      }
    },
  };
}
