import { describe, expect, it } from "vitest";
import { pakanUraiResponseSchema, type BahanMaster, type PakanHitungLayak } from "@ternakin/shared";
import {
  EmbeddingGuidelineRetriever,
  kemiripanKosinus,
} from "./adapters/embeddingGuidelineRetriever.js";
import { GeminiClient, GeminiError } from "./adapters/geminiClient.js";
import { GeminiLlmAdapter, hargaTertulisDiTeks } from "./adapters/geminiLlm.js";
import { MockLlmAdapter } from "./adapters/mockLlm.js";
import { buatPenyediaLlm, type EnvLlm } from "./adapters/penyediaLlm.js";
import { SqliteGuidelineRetriever } from "./adapters/sqliteGuidelineRetriever.js";
import type { GuidelineChunk } from "./adapters/types.js";
import { createApp } from "./app.js";
import { sebagaiAkun } from "./uji/masuk.js";
import { loadEnv } from "./config/env.js";
import { initDatabase } from "./db/database.js";

// ---------------------------------------------------------------------------
// Fetch palsu: tidak ada panggilan jaringan sungguhan di pengujian ini.
// ---------------------------------------------------------------------------

interface PanggilanTercatat {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

type PenanganGenerate = (body: Record<string, unknown>) => unknown;

const KATA_DIMENSI: readonly (readonly string[])[] = [
  ["mati", "kematian", "mendadak", "bangkai"],
  ["napas", "ngorok", "pernapasan", "bersin"],
  ["diare", "kotoran", "mencret", "encer"],
  ["panas", "panting", "megap"],
  ["lesu", "telur", "nafsu"],
  ["biosekuriti", "desinfeksi", "tamu"],
];

/** Embedding tiruan: hitungan kata kunci per dimensi + satu dimensi konstan kecil. */
function vektorTiruan(teks: string): number[] {
  const kecil = teks.toLowerCase();
  return [
    ...KATA_DIMENSI.map((kata) => kata.reduce((n, k) => n + (kecil.split(k).length - 1), 0)),
    0.3,
  ];
}

function buatFetchPalsu(opsi: {
  generate?: PenanganGenerate;
  gagalEmbed?: boolean;
  status?: number;
}) {
  const panggilan: PanggilanTercatat[] = [];
  const fetchFn = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
    panggilan.push({ url, headers: init?.headers as Record<string, string>, body });

    if (opsi.status && opsi.status >= 400) {
      return new Response(
        JSON.stringify({ error: { status: "PERMISSION_DENIED", message: "API key not valid" } }),
        { status: opsi.status, headers: { "content-type": "application/json" } },
      );
    }

    if (url.includes(":batchEmbedContents")) {
      if (opsi.gagalEmbed) throw new TypeError("fetch failed");
      const requests = body.requests as Array<{ content: { parts: Array<{ text: string }> } }>;
      return Response.json({
        embeddings: requests.map((r) => ({ values: vektorTiruan(r.content.parts[0]?.text ?? "") })),
      });
    }

    if (url.includes(":generateContent")) {
      const data = opsi.generate ? opsi.generate(body) : {};
      return Response.json({
        candidates: [
          {
            content: {
              parts: [{ text: "memikirkan...", thought: true }, { text: JSON.stringify(data) }],
            },
            finishReason: "STOP",
          },
        ],
        usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 40, thoughtsTokenCount: 5 },
      });
    }

    return new Response("tidak dikenal", { status: 404 });
  }) as typeof fetch;

  return { fetchFn, panggilan };
}

function buatClient(fetchFn: typeof fetch, embeddingModel = "gemini-embedding-2") {
  return new GeminiClient({
    apiKey: "kunci-uji",
    model: "gemini-uji-flash",
    embeddingModel,
    embeddingDimensi: 768,
    timeoutMs: 2000,
    fetchFn,
  });
}

const KATALOG: BahanMaster[] = [
  {
    id: "jagung_kuning",
    nama: "Jagung kuning giling",
    satuan: "kg",
    sinonim: ["jagung"],
    batasMinPersen: 0,
    batasMaksPersen: 65,
    nutrisi: { protein_kasar: 8.8 },
    sumberNutrisi: "uji",
    isDemo: true,
  },
  {
    id: "dedak_padi",
    nama: "Dedak padi halus",
    satuan: "kg",
    sinonim: ["dedak", "bekatul"],
    batasMinPersen: 0,
    batasMaksPersen: 20,
    nutrisi: { protein_kasar: 12 },
    sumberNutrisi: "uji",
    isDemo: true,
  },
];

const HASIL_SOLVER: PakanHitungLayak = {
  status: "layak",
  jenisAyam: "petelur",
  fase: "layer",
  komposisi: [
    {
      bahanId: "jagung_kuning",
      nama: "Jagung kuning giling",
      persentase: 60,
      kgPer100Kg: 60,
      hargaPerKg: 5500,
      subtotalPer100Kg: 330000,
    },
    {
      bahanId: "dedak_padi",
      nama: "Dedak padi halus",
      persentase: 40,
      kgPer100Kg: 40,
      hargaPerKg: 3500,
      subtotalPer100Kg: 140000,
    },
  ],
  totalBiayaPer100Kg: 470000,
  biayaPerKg: 4700,
  pemenuhanGizi: [],
  statusSolver: "optimal",
  catatanData: "uji",
  isDemo: true,
};

const PANDUAN_UJI: GuidelineChunk[] = [
  {
    id: "panduan_kematian_mendadak",
    judul: "Kematian mendadak",
    sumber: "Panduan uji",
    versi: "1",
    isi: "Pisahkan ayam sakit dan hubungi dokter hewan.",
    ringkasanKutipan: "Pisahkan ayam sakit.",
    skor: 1,
  },
];

// ---------------------------------------------------------------------------

describe("hargaTertulisDiTeks — LLM tidak boleh mengarang harga", () => {
  it.each([
    [3500, "jagung 3,5rb"],
    [6500, "jagung 6.500, dedak 4.000"],
    [4000, "jagung 6.500, dedak 4.000"],
    [12000, "konsentrat 12 ribu"],
    [2800, "dedak 2800"],
  ])("menerima %d dari %s", (harga, teks) => {
    expect(hargaTertulisDiTeks(harga, teks)).toBe(true);
  });

  it.each([
    [4200, "dedak 4000"],
    [5000, "jagung murah"],
    [0, "jagung 0"],
  ])("menolak %d dari %s", (harga, teks) => {
    expect(hargaTertulisDiTeks(harga, teks)).toBe(false);
  });
});

describe("GeminiClient", () => {
  it("mengirim kunci lewat header, meminta JSON terstruktur, dan mengabaikan bagian thought", async () => {
    const { fetchFn, panggilan } = buatFetchPalsu({ generate: () => ({ penjelasan: "ok" }) });
    const client = buatClient(fetchFn);

    const hasil = await client.generateJson({
      sistem: "sistem",
      pesan: "pesan",
      skema: { type: "object" },
      maksTokenKeluar: 600,
    });

    expect(hasil.data).toEqual({ penjelasan: "ok" });
    expect(hasil.tokenMasuk).toBe(120);
    expect(hasil.tokenKeluar).toBe(45);

    const p = panggilan[0]!;
    expect(p.url).toContain("/models/gemini-uji-flash:generateContent");
    expect(p.url).not.toContain("kunci-uji");
    expect(p.headers["x-goog-api-key"]).toBe("kunci-uji");
    const config = p.body.generationConfig as Record<string, unknown>;
    expect(config.responseMimeType).toBe("application/json");
    expect(config.maxOutputTokens).toBe(600);
    expect(config.thinkingConfig).toBeUndefined();
  });

  it("melempar GeminiError dengan pesan singkat saat HTTP gagal", async () => {
    const { fetchFn } = buatFetchPalsu({ status: 403 });
    const client = buatClient(fetchFn);
    await expect(
      client.generateJson({ sistem: "s", pesan: "p", skema: {}, maksTokenKeluar: 10 }),
    ).rejects.toThrow(GeminiError);
  });

  it("gemini-embedding-2 memakai awalan teks, model lama memakai taskType", async () => {
    const baru = buatFetchPalsu({});
    await buatClient(baru.fetchFn).embed(["ayam ngorok"], "kueri");
    const reqBaru = (baru.panggilan[0]!.body.requests as Array<Record<string, unknown>>)[0]!;
    expect(reqBaru.taskType).toBeUndefined();
    expect(JSON.stringify(reqBaru.content)).toContain("task: search result | query: ayam ngorok");

    const lama = buatFetchPalsu({});
    await buatClient(lama.fetchFn, "gemini-embedding-001").embed(["Judul\nIsi"], "dokumen");
    const reqLama = (lama.panggilan[0]!.body.requests as Array<Record<string, unknown>>)[0]!;
    expect(reqLama.taskType).toBe("RETRIEVAL_DOCUMENT");
    expect(JSON.stringify(reqLama.content)).toContain("Judul\\nIsi");
  });
});

describe("GeminiLlmAdapter", () => {
  const mock = new MockLlmAdapter();

  it("urai pakan: memetakan katalog, membuang harga karangan, menandai bahan asing", async () => {
    const { fetchFn } = buatFetchPalsu({
      generate: () => ({
        item: [
          { namaMentah: "jagung", bahanId: "jagung_kuning", hargaPerKg: 3500 },
          { namaMentah: "bekatul", bahanId: "dedak_padi", hargaPerKg: 9999 },
          { namaMentah: "ampas tahu", bahanId: "ampas_tahu", hargaPerKg: 1500 },
        ],
        catatan: [],
      }),
    });
    const adapter = new GeminiLlmAdapter(buatClient(fetchFn), mock, { maksTokenKeluar: 600 });

    const hasil = await adapter.parseFeedText(
      "jagung 3,5rb, bekatul 2800, ampas tahu 1.500",
      KATALOG,
    );

    expect(hasil.sumber).toBe("llm");
    expect(hasil.item).toEqual([
      {
        bahanId: "jagung_kuning",
        namaMentah: "jagung",
        namaBahan: "Jagung kuning giling",
        hargaPerKg: 3500,
        satuan: "kg",
      },
      {
        bahanId: null,
        namaMentah: "ampas tahu",
        namaBahan: "ampas tahu",
        hargaPerKg: 1500,
        satuan: "kg",
      },
    ]);
    expect(hasil.catatan.join(" ")).toContain('Harga untuk "bekatul" belum dapat dipastikan');
    expect(hasil.catatan.join(" ")).toContain('Bahan "ampas tahu" belum ada');
  });

  it("urai pakan: keluaran tidak valid jatuh ke mock", async () => {
    const { fetchFn } = buatFetchPalsu({ generate: () => ({ salah: true }) });
    const adapter = new GeminiLlmAdapter(buatClient(fetchFn), mock, { maksTokenKeluar: 600 });

    const hasil = await adapter.parseFeedText("jagung 6.500", KATALOG);
    expect(hasil.sumber).toBe("mock");
    expect(hasil.item[0]?.bahanId).toBe("jagung_kuning");
  });

  it("jelaskan pakan: penjelasan dengan angka karangan diganti penjelasan mock", async () => {
    const { fetchFn } = buatFetchPalsu({
      generate: () => ({ penjelasan: "Biaya campuran hanya Rp 3.000 per kg." }),
    });
    const adapter = new GeminiLlmAdapter(buatClient(fetchFn), mock, { maksTokenKeluar: 600 });

    const hasil = await adapter.explainFeed(HASIL_SOLVER);
    expect(hasil.sumber).toBe("mock");
    expect(hasil.penjelasan).not.toContain("3.000");
  });

  it("jelaskan pakan: penjelasan yang angkanya cocok dipakai", async () => {
    const { fetchFn } = buatFetchPalsu({
      generate: () => ({
        penjelasan: "Campuran ini Rp 4.700 per kg dengan jagung 60 kg dan dedak 40 kg.",
      }),
    });
    const adapter = new GeminiLlmAdapter(buatClient(fetchFn), mock, { maksTokenKeluar: 600 });

    const hasil = await adapter.explainFeed(HASIL_SOLVER);
    expect(hasil.sumber).toBe("llm");
    expect(hasil.penjelasan).toContain("Rp 4.700");
  });

  it("triase: LLM tidak boleh menurunkan tanda bahaya tinggi", async () => {
    const { fetchFn } = buatFetchPalsu({
      generate: () => ({
        diLuarPanduan: false,
        jawaban: "Tidak apa-apa, Bapak/Ibu.",
        urgensi: "rendah",
        alasanUrgensi: "Tidak apa-apa.",
        panduanUmum: ["Tunggu saja."],
      }),
    });
    const adapter = new GeminiLlmAdapter(buatClient(fetchFn), mock, { maksTokenKeluar: 600 });

    const hasil = await adapter.triageKokok(
      { gejala: "Banyak ayam mati mendadak pagi ini", peringatan7Hari: [] },
      PANDUAN_UJI,
    );
    expect(hasil.urgensi).toBe("tinggi");
    expect(hasil.panduanUmum.join(" ")).not.toContain("Tunggu saja");
  });

  it("triase: jawaban LLM yang valid dipakai dan panduan + gejala dikirim sebagai data", async () => {
    const { fetchFn, panggilan } = buatFetchPalsu({
      generate: () => ({
        diLuarPanduan: false,
        jawaban: "Bapak/Ibu, ngorok pada ayam perlu diwaspadai karena mudah menular.",
        urgensi: "sedang",
        alasanUrgensi: "Gejala pernapasan perlu isolasi.",
        panduanUmum: ["Pisahkan ayam yang ngorok.", "Perbaiki ventilasi."],
      }),
    });
    const adapter = new GeminiLlmAdapter(buatClient(fetchFn), mock, { maksTokenKeluar: 600 });

    const panduanPernapasan: GuidelineChunk = {
      ...PANDUAN_UJI[0]!,
      id: "panduan_pernapasan",
      judul: "Gangguan pernapasan",
    };
    const hasil = await adapter.triageKokok({ gejala: "Ayam ngorok", peringatan7Hari: [] }, [
      panduanPernapasan,
    ]);
    expect(hasil).toMatchObject({
      urgensi: "sedang",
      jawaban: "Bapak/Ibu, ngorok pada ayam perlu diwaspadai karena mudah menular.",
      diLuarPanduan: false,
      tokenMasuk: 120,
      tokenKeluar: 45,
    });

    const teksPesan = JSON.stringify(panggilan[0]!.body.contents);
    expect(teksPesan).toContain("<gejala>");
    expect(teksPesan).toContain("Gangguan pernapasan");
    // Instruksi sistem memuat daftar boleh/jangan sesuai tujuan proyek.
    const sistem = JSON.stringify(panggilan[0]!.body.systemInstruction);
    expect(sistem).toContain("YANG JANGAN");
    expect(sistem).toContain("saran keuangan");
  });

  it("triase: galat jaringan jatuh ke aturan bawaan", async () => {
    const fetchGagal = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    const adapter = new GeminiLlmAdapter(buatClient(fetchGagal), mock, { maksTokenKeluar: 600 });

    const hasil = await adapter.triageKokok({ gejala: "Ayam lesu", peringatan7Hari: [] }, []);
    expect(["rendah", "sedang", "tinggi"]).toContain(hasil.urgensi);
    expect(hasil.panduanUmum.length).toBeGreaterThan(0);
  });
});

describe("EmbeddingGuidelineRetriever", () => {
  it("kemiripanKosinus menghitung arah vektor", () => {
    expect(kemiripanKosinus([1, 0], [1, 0])).toBeCloseTo(1);
    expect(kemiripanKosinus([1, 0], [0, 1])).toBeCloseTo(0);
    expect(kemiripanKosinus([1, 0], [1])).toBe(0);
  });

  it("membangun indeks sekali, lalu hanya memperbarui panduan yang berubah", async () => {
    const dbCtx = initDatabase(":memory:");
    const { fetchFn, panggilan } = buatFetchPalsu({});
    const retriever = new EmbeddingGuidelineRetriever(
      dbCtx.db,
      buatClient(fetchFn),
      new SqliteGuidelineRetriever(dbCtx.db),
      { ambangKemiripan: 0.6 },
    );

    await retriever.sinkronkanIndeks();
    const jumlahPanduan = (
      dbCtx.db.prepare("SELECT COUNT(*) AS n FROM dokumen_panduan").get() as { n: number }
    ).n;
    expect(retriever.jumlahTerindeks).toBe(jumlahPanduan);
    expect(panggilan).toHaveLength(1);

    await retriever.sinkronkanIndeks();
    expect(panggilan).toHaveLength(1);

    dbCtx.db
      .prepare("UPDATE dokumen_panduan SET isi = isi || ' Tambahan.' WHERE id = ?")
      .run("panduan_diare");
    await retriever.sinkronkanIndeks();
    expect(panggilan).toHaveLength(2);
    expect((panggilan[1]!.body.requests as unknown[]).length).toBe(1);
    dbCtx.close();
  });

  it("mengurutkan panduan menurut makna dan jatuh ke kata kunci bila tidak ada yang relevan", async () => {
    const dbCtx = initDatabase(":memory:");
    // Embedding tiruan hanya menghitung kata kunci triase; dokumen pengetahuan tanpa kata kunci itu
    // akan bervektor sama dengan kueri apa pun. Uji ini memakai 6 panduan triase saja.
    dbCtx.db.prepare("DELETE FROM dokumen_panduan WHERE id NOT LIKE 'panduan%'").run();
    const { fetchFn } = buatFetchPalsu({});
    const retriever = new EmbeddingGuidelineRetriever(
      dbCtx.db,
      buatClient(fetchFn),
      new SqliteGuidelineRetriever(dbCtx.db),
      { ambangKemiripan: 0.6 },
    );
    await retriever.sinkronkanIndeks();

    const diare = await retriever.search("kotoran encer, mencret sejak kemarin", 3);
    // Dokumen pengetahuan lain (mis. alas basah musim hujan) bisa ikut relevan; panduan diare
    // tetap harus masuk hasil teratas.
    expect(diare.map((d) => d.id)).toContain("panduan_diare");
    expect(diare[0]?.ringkasanKutipan.length).toBeGreaterThan(0);

    const diLuar = await retriever.search("harga motor bekas di pasar", 3);
    expect(diLuar).toEqual([]);
    dbCtx.close();
  });

  it("memakai pencarian kata kunci bila embedding gagal", async () => {
    const dbCtx = initDatabase(":memory:");
    const sehat = buatFetchPalsu({});
    const retriever = new EmbeddingGuidelineRetriever(
      dbCtx.db,
      buatClient(sehat.fetchFn),
      new SqliteGuidelineRetriever(dbCtx.db),
      { ambangKemiripan: 0.6 },
    );
    await retriever.sinkronkanIndeks();

    const gagal = new EmbeddingGuidelineRetriever(
      dbCtx.db,
      buatClient(buatFetchPalsu({ gagalEmbed: true }).fetchFn),
      new SqliteGuidelineRetriever(dbCtx.db),
      { ambangKemiripan: 0.6 },
    );
    // Indeks belum dimuat → langsung kata kunci.
    const hasil = await gagal.search("ayam ngorok dan bersin", 3);
    expect(hasil[0]?.id).toBe("panduan_pernapasan");
    dbCtx.close();
  });
});

describe("Pemilihan penyedia LLM dari env", () => {
  const envDasar: EnvLlm = {
    LLM_PROVIDER: "gemini",
    LLM_API_KEY: "",
    LLM_MODEL: "gemini-uji-flash",
    LLM_EMBEDDING_MODEL: "gemini-embedding-2",
    LLM_EMBEDDING_DIMENSI: 768,
    LLM_THINKING_LEVEL: undefined,
    LLM_TIMEOUT_MS: 2000,
    LLM_MAX_OUTPUT_TOKENS: 600,
    RAG_AMBANG_KEMIRIPAN: 0.6,
  };

  it("env menerima gemini dan mengosongkan LLM_THINKING_LEVEL yang kosong", () => {
    const env = loadEnv({ LLM_PROVIDER: "gemini", LLM_THINKING_LEVEL: "" });
    expect(env.LLM_PROVIDER).toBe("gemini");
    expect(env.LLM_THINKING_LEVEL).toBeUndefined();
    expect(env.LLM_MODEL.length).toBeGreaterThan(0);
  });

  it("gemini tanpa kunci tetap jalan dengan mock", () => {
    const dbCtx = initDatabase(":memory:");
    const penyedia = buatPenyediaLlm(envDasar, dbCtx.db);
    expect(penyedia.penyediaAktif).toBe("mock");
    expect(penyedia.llmAdapter.sumber).toBe("mock");
    dbCtx.close();
  });

  it("gemini dengan kunci memakai adapter LLM dan siapkan() tidak pernah melempar", async () => {
    const dbCtx = initDatabase(":memory:");
    const { fetchFn } = buatFetchPalsu({ gagalEmbed: true });
    const penyedia = buatPenyediaLlm({ ...envDasar, LLM_API_KEY: "kunci-uji" }, dbCtx.db, fetchFn);
    expect(penyedia.penyediaAktif).toBe("gemini");
    expect(penyedia.llmAdapter.sumber).toBe("llm");
    await expect(penyedia.siapkan()).resolves.toBeUndefined();
    dbCtx.close();
  });
});

describe("Rute /v1/pakan/urai dengan Gemini", () => {
  it("menandai sumber llm, dan hasil cadangan saat Gemini gagal tidak disimpan di cache", async () => {
    let geminiSehat = false;
    const fetchFn = (async (input: string | URL | Request, init?: RequestInit) => {
      if (!geminiSehat) throw new TypeError("fetch failed");
      return buatFetchPalsu({
        generate: () => ({
          item: [{ namaMentah: "jagung", bahanId: "jagung_kuning", hargaPerKg: 6500 }],
          catatan: [],
        }),
      }).fetchFn(input, init);
    }) as typeof fetch;

    const dbCtx = initDatabase(":memory:");
    const llmAdapter = new GeminiLlmAdapter(buatClient(fetchFn), new MockLlmAdapter(), {
      maksTokenKeluar: 600,
    });
    const app = createApp({ dbCtx, llmAdapter });
    const agen = await sebagaiAkun(app);
    const kirim = () =>
      agen
        .post("/v1/pakan/urai")
        .send({ teks: "jagung 6.500", perangkatId: "perangkat-uji-gemini" });

    const pertama = await kirim();
    expect(pertama.status).toBe(200);
    expect(pakanUraiResponseSchema.parse(pertama.body)).toMatchObject({
      sumber: "mock",
      dariCache: false,
    });

    geminiSehat = true;
    const kedua = await kirim();
    expect(kedua.body).toMatchObject({ sumber: "llm", dariCache: false });

    const ketiga = await kirim();
    expect(ketiga.body).toMatchObject({ sumber: "llm", dariCache: true });
    dbCtx.close();
  });
});

describe("GeminiLlmAdapter — obrolan Kokok", () => {
  const mock = new MockLlmAdapter();

  it("mengirim riwayat, arahan kategori, dan fakta Ternakin; memetakan urgensi tidak_ada → null", async () => {
    const { fetchFn, panggilan } = buatFetchPalsu({
      generate: () => ({
        balasan: "Kokok tidak bisa menyebut obat, Bapak/Ibu. Yuk cek gejalanya dulu.",
        aksi: "cek_gejala",
        urgensi: "tidak_ada",
      }),
    });
    const adapter = new GeminiLlmAdapter(buatClient(fetchFn), mock, { maksTokenKeluar: 600 });

    const hasil = await adapter.ngobrol({
      pesan: "obat apa ya?",
      riwayat: [{ dari: "anda", teks: "ayam saya ngorok" }],
      konteks: "landing",
      kategori: "minta_obat",
      panduan: [],
    });

    expect(hasil).toMatchObject({ aksi: "cek_gejala", urgensi: null, sumber: "llm" });
    const isi = JSON.stringify(panggilan[0]!.body.contents);
    expect(isi).toContain("Pengguna: ayam saya ngorok");
    expect(isi).toContain("Arahan khusus");
    expect(isi).toContain("<pesan>");
    expect(JSON.stringify(panggilan[0]!.body.systemInstruction)).toContain("Gratis untuk peternak");
  });

  it("galat Gemini jatuh ke balasan cadangan yang tetap menanggapi pesan", async () => {
    const fetchGagal = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    const adapter = new GeminiLlmAdapter(buatClient(fetchGagal), mock, { maksTokenKeluar: 600 });
    const hasil = await adapter.ngobrol({
      pesan: "halo",
      riwayat: [],
      konteks: "landing",
      kategori: "di_luar_topik",
      panduan: [],
    });
    expect(hasil.sumber).toBe("mock");
    expect(hasil.balasan).toContain("Saya Kokok");
  });
});
