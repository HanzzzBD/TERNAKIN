import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  dataReferensiSchema,
  galatApiSchema,
  pakanHitungResultSchema,
  pakanJelaskanResponseSchema,
  pakanUraiResponseSchema,
  type PakanHitungLayak,
} from "@ternakin/shared";
import { MockLlmAdapter } from "./adapters/mockLlm.js";
import type { LlmAdapter } from "./adapters/types.js";
import { createApp } from "./app.js";

describe("API Fase 2: Referensi & Penyusun Pakan", () => {
  it("GET /v1/bahan dan GET /v1/referensi mengembalikan data referensi valid berlabel contoh", async () => {
    const app = createApp();

    const bahanRes = await request(app).get("/v1/bahan");
    expect(bahanRes.status).toBe(200);
    expect(bahanRes.body.isDemo).toBe(true);
    expect(bahanRes.body.bahan.length).toBeGreaterThanOrEqual(4);

    const refRes = await request(app).get("/v1/referensi");
    expect(refRes.status).toBe(200);
    const parsed = dataReferensiSchema.safeParse(refRes.body);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.kebutuhanGizi.some((k) => k.fase === "layer")).toBe(true);
  });

  it("GET /v1/openapi.json mengembalikan spesifikasi OpenAPI 3.1", async () => {
    const app = createApp();
    const res = await request(app).get("/v1/openapi.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.1.0");
    expect(res.body.paths["/v1/pakan/hitung"]).toBeDefined();
    expect(res.body.paths["/v1/pakan/urai"]).toBeDefined();
    expect(res.body.paths["/v1/pakan/jelaskan"]).toBeDefined();
    expect(res.body.paths["/v1/referensi"]).toBeDefined();
  });

  it("POST /v1/pakan/urai mengurai teks bebas, memakai cache pada permintaan sama, dan menolak masukan tidak valid", async () => {
    const app = createApp();

    const gagal = await request(app).post("/v1/pakan/urai").send({ teks: "" });
    expect(gagal.status).toBe(400);
    expect(galatApiSchema.safeParse(gagal.body).success).toBe(true);

    const pertama = await request(app).post("/v1/pakan/urai").send({
      teks: "Jagung 6.500 per kg, dedak 4.000, konsentrat 12.000 per kg",
      perangkatId: "dev-test-1",
    });
    expect(pertama.status).toBe(200);
    const parsed = pakanUraiResponseSchema.safeParse(pertama.body);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.dariCache).toBe(false);
    expect(parsed.data.item).toHaveLength(3);
    expect(parsed.data.item[0]?.bahanId).toBe("jagung_kuning");
    expect(parsed.data.item[0]?.hargaPerKg).toBe(6500);
    expect(parsed.data.item[1]?.bahanId).toBe("dedak_padi");
    expect(parsed.data.item[1]?.hargaPerKg).toBe(4000);
    expect(parsed.data.item[2]?.bahanId).toBe("konsentrat_petelur");
    expect(parsed.data.item[2]?.hargaPerKg).toBe(12000);

    const kedua = await request(app).post("/v1/pakan/urai").send({
      teks: "  jagung 6.500 per kg, dedak 4.000, konsentrat 12.000 per kg ",
      perangkatId: "dev-test-1",
    });
    expect(kedua.status).toBe(200);
    expect(kedua.body.dariCache).toBe(true);
  });

  it("POST /v1/pakan/hitung mengembalikan campuran layak dan kasus tak layak dengan zat kurang", async () => {
    const app = createApp();

    const layakRes = await request(app)
      .post("/v1/pakan/hitung")
      .send({
        jenisAyam: "petelur",
        fase: "layer",
        bahan: [
          { bahanId: "jagung_kuning", hargaPerKg: 6500 },
          { bahanId: "dedak_padi", hargaPerKg: 4000 },
          { bahanId: "konsentrat_petelur", hargaPerKg: 12000 },
          { bahanId: "tepung_batu_kapur", hargaPerKg: 1500 },
        ],
        biayaSekarangPerKg: 8200,
      });

    expect(layakRes.status).toBe(200);
    const layak = pakanHitungResultSchema.parse(layakRes.body);
    expect(layak.status).toBe("layak");
    if (layak.status === "layak") {
      expect(layak.pemenuhanGizi.every((g) => g.terpenuhi)).toBe(true);
      expect(layak.biayaPerKg).toBeGreaterThan(0);
    }

    const takLayakRes = await request(app)
      .post("/v1/pakan/hitung")
      .send({
        jenisAyam: "petelur",
        fase: "layer",
        bahan: [
          { bahanId: "jagung_kuning", hargaPerKg: 6500 },
          { bahanId: "dedak_padi", hargaPerKg: 4000 },
        ],
      });

    expect(takLayakRes.status).toBe(200);
    const takLayak = pakanHitungResultSchema.parse(takLayakRes.body);
    expect(takLayak.status).toBe("tak_layak");
    if (takLayak.status === "tak_layak") {
      expect(takLayak.zatBermasalah.length).toBeGreaterThan(0);
      expect(takLayak.saranBahan.length).toBeGreaterThan(0);
    }
  });

  it("POST /v1/pakan/jelaskan menerima penjelasan sesuai solver dan membuang LLM yang mengubah angka", async () => {
    const appNormal = createApp();
    const hitungRes = await request(appNormal)
      .post("/v1/pakan/hitung")
      .send({
        jenisAyam: "petelur",
        fase: "layer",
        bahan: [
          { bahanId: "jagung_kuning", hargaPerKg: 6500 },
          { bahanId: "dedak_padi", hargaPerKg: 4000 },
          { bahanId: "konsentrat_petelur", hargaPerKg: 12000 },
          { bahanId: "tepung_batu_kapur", hargaPerKg: 1500 },
        ],
      });
    const hasilLayak = hitungRes.body as PakanHitungLayak;

    const okRes = await request(appNormal)
      .post("/v1/pakan/jelaskan")
      .send({ hasilSolver: hasilLayak, perangkatId: "dev-normal" });
    expect(okRes.status).toBe(200);
    const parsedOk = pakanJelaskanResponseSchema.parse(okRes.body);
    expect(parsedOk.terverifikasi).toBe(true);
    expect(parsedOk.penjelasan).toBeTruthy();

    // LLM tiruan yang sengaja mengubah angka biaya harus ditolak dan dibuang.
    const mockCurang: LlmAdapter = {
      sumber: "mock",
      parseFeedText: (teks, katalog) => new MockLlmAdapter().parseFeedText(teks, katalog),
      explainFeed: async () => ({
        penjelasan: "Campuran ini sangat murah hanya Rp 4.123 per kg untuk 100 kg pakan.",
        tokenMasuk: 10,
        tokenKeluar: 15,
      }),
      triageKokok: (input, guidelines) => new MockLlmAdapter().triageKokok(input, guidelines),
    };

    const appCurang = createApp({ llmAdapter: mockCurang });
    const tolakRes = await request(appCurang)
      .post("/v1/pakan/jelaskan")
      .send({ hasilSolver: hasilLayak, perangkatId: "dev-curang" });

    expect(tolakRes.status).toBe(200);
    const parsedTolak = pakanJelaskanResponseSchema.parse(tolakRes.body);
    expect(parsedTolak.terverifikasi).toBe(false);
    expect(parsedTolak.penjelasan).toBeNull();
    expect(parsedTolak.ditolakAlasan).toBeTruthy();
  });

  it("membatasi kuota harian LLM per perangkat dengan pesan ramah 429", async () => {
    const app = createApp({ dailyLlmLimit: 1 });

    const kesatu = await request(app)
      .post("/v1/pakan/urai")
      .send({ teks: "Jagung 6500", perangkatId: "perangkat-kuota" });
    expect(kesatu.status).toBe(200);

    const kedua = await request(app)
      .post("/v1/pakan/urai")
      .send({ teks: "Dedak 4000", perangkatId: "perangkat-kuota" });
    expect(kedua.status).toBe(429);
    expect(galatApiSchema.safeParse(kedua.body).success).toBe(true);
    expect(kedua.body.kode).toBe("BATAS_HARIAN_LLM");
  });
});
