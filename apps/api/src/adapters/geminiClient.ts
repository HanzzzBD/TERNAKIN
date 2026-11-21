/**
 * Klien REST minimal untuk Gemini API (generateContent dan embedding).
 * Sengaja tanpa SDK agar dependensi tetap kecil; `fetch` dapat diganti saat pengujian.
 * Kunci API hanya hidup di server dan tidak pernah dicatat di log.
 */

const BASIS_URL_BAWAAN = "https://generativelanguage.googleapis.com/v1beta";

export type TingkatBerpikir = "minimal" | "low" | "medium" | "high";

export interface GeminiClientOptions {
  apiKey: string;
  model: string;
  embeddingModel: string;
  timeoutMs: number;
  thinkingLevel?: TingkatBerpikir;
  embeddingDimensi?: number;
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

export interface GenerateJsonInput {
  sistem: string;
  pesan: string;
  /** Skema JSON (subset OpenAPI) untuk keluaran terstruktur. */
  skema: Record<string, unknown>;
  maksTokenKeluar: number;
  suhu?: number;
}

export interface GenerateJsonOutput {
  data: unknown;
  tokenMasuk: number;
  tokenKeluar: number;
}

export type JenisEmbedding = "kueri" | "dokumen";

/** gemini-embedding-001 dan model lama memakai taskType; generasi baru memakai awalan teks. */
function pakaiAwalanTugas(model: string): boolean {
  return !/embedding-001|text-embedding-/i.test(model);
}

function beriAwalanTugas(teks: string, jenis: JenisEmbedding): string {
  if (jenis === "kueri") {
    return `task: search result | query: ${teks}`;
  }
  // Dokumen panduan dikirim sebagai "judul\nisi"; baris pertama dipakai sebagai judul.
  const [judul, ...sisa] = teks.split("\n");
  const isi = sisa.join("\n").trim();
  return isi ? `title: ${judul} | text: ${isi}` : `title: none | text: ${teks}`;
}

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

interface GeminiPart {
  text?: string;
  thought?: boolean;
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  };
}

interface GeminiEmbeddingValues {
  values?: number[];
}

interface GeminiEmbedResponse {
  embedding?: GeminiEmbeddingValues;
  embeddings?: GeminiEmbeddingValues[];
}

export class GeminiClient {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(private readonly opsi: GeminiClientOptions) {
    if (!opsi.apiKey) {
      throw new GeminiError("Kunci API Gemini kosong.");
    }
    this.baseUrl = (opsi.baseUrl ?? BASIS_URL_BAWAAN).replace(/\/+$/, "");
    this.fetchFn = opsi.fetchFn ?? fetch;
  }

  get model(): string {
    return this.opsi.model;
  }

  get embeddingModel(): string {
    return this.opsi.embeddingModel;
  }

  async generateJson(input: GenerateJsonInput): Promise<GenerateJsonOutput> {
    const generationConfig: Record<string, unknown> = {
      responseMimeType: "application/json",
      responseSchema: input.skema,
      maxOutputTokens: input.maksTokenKeluar,
      temperature: input.suhu ?? 0.2,
    };
    if (this.opsi.thinkingLevel) {
      generationConfig.thinkingConfig = { thinkingLevel: this.opsi.thinkingLevel };
    }

    const body = {
      systemInstruction: { parts: [{ text: input.sistem }] },
      contents: [{ role: "user", parts: [{ text: input.pesan }] }],
      generationConfig,
    };

    const json = (await this.kirim(
      `models/${encodeURIComponent(this.opsi.model)}:generateContent`,
      body,
    )) as GeminiGenerateResponse;

    if (json.promptFeedback?.blockReason) {
      throw new GeminiError(`Permintaan diblokir Gemini (${json.promptFeedback.blockReason}).`);
    }

    const kandidat = json.candidates?.[0];
    const teks = (kandidat?.content?.parts ?? [])
      .filter((p) => !p.thought && typeof p.text === "string")
      .map((p) => p.text)
      .join("")
      .trim();

    if (!teks) {
      throw new GeminiError(
        `Gemini tidak mengembalikan teks (finishReason: ${kandidat?.finishReason ?? "tidak ada"}).`,
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(teks);
    } catch {
      throw new GeminiError(
        `Keluaran Gemini bukan JSON yang valid (finishReason: ${kandidat?.finishReason ?? "tidak ada"}).`,
      );
    }

    const usage = json.usageMetadata ?? {};
    return {
      data,
      tokenMasuk: usage.promptTokenCount ?? 0,
      tokenKeluar: (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0),
    };
  }

  /**
   * Menghasilkan vektor embedding untuk beberapa teks sekaligus, urutan sama dengan masukan.
   * gemini-embedding-2 tidak menerima taskType, jadi jenis tugas ditulis sebagai awalan teks;
   * model lama (mis. gemini-embedding-001) memakai taskType.
   */
  async embed(teks: readonly string[], jenis: JenisEmbedding): Promise<number[][]> {
    if (teks.length === 0) return [];

    const modelPath = `models/${this.opsi.embeddingModel}`;
    const dimensi = this.opsi.embeddingDimensi;
    const pakaiAwalan = pakaiAwalanTugas(this.opsi.embeddingModel);
    const requests = teks.map((t) => ({
      model: modelPath,
      content: { parts: [{ text: pakaiAwalan ? beriAwalanTugas(t, jenis) : t }] },
      ...(pakaiAwalan
        ? {}
        : { taskType: jenis === "kueri" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT" }),
      ...(dimensi ? { outputDimensionality: dimensi } : {}),
    }));

    const json = (await this.kirim(
      `models/${encodeURIComponent(this.opsi.embeddingModel)}:batchEmbedContents`,
      { requests },
    )) as GeminiEmbedResponse;

    const daftar = json.embeddings ?? (json.embedding ? [json.embedding] : []);
    if (daftar.length !== teks.length) {
      throw new GeminiError(
        `Jumlah embedding (${daftar.length}) tidak sama dengan jumlah teks (${teks.length}).`,
      );
    }

    return daftar.map((e, i) => {
      if (!Array.isArray(e.values) || e.values.length === 0) {
        throw new GeminiError(`Embedding ke-${i + 1} kosong.`);
      }
      return e.values;
    });
  }

  private async kirim(jalur: string, body: unknown): Promise<unknown> {
    let res: Response;
    try {
      res = await this.fetchFn(`${this.baseUrl}/${jalur}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.opsi.apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.opsi.timeoutMs),
      });
    } catch (err) {
      const nama = err instanceof Error ? err.name : "Error";
      throw new GeminiError(
        nama === "TimeoutError" || nama === "AbortError"
          ? `Gemini tidak merespons dalam ${this.opsi.timeoutMs} ms.`
          : "Gagal menghubungi Gemini.",
      );
    }

    if (!res.ok) {
      // Isi galat dari server bisa memuat detail permintaan; cukup ambil pesan singkatnya.
      let pesan = `HTTP ${res.status}`;
      try {
        const galat = (await res.json()) as { error?: { message?: string; status?: string } };
        if (galat.error?.status) pesan += ` ${galat.error.status}`;
        if (galat.error?.message) pesan += `: ${galat.error.message.slice(0, 200)}`;
      } catch {
        // abaikan isi yang bukan JSON
      }
      throw new GeminiError(`Gemini menolak permintaan (${pesan}).`, res.status);
    }

    return res.json();
  }
}
