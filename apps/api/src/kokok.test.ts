import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import {
  checkKokokOutputSafety,
  galatApiSchema,
  kokokObrolanResponseSchema,
  kokokTriaseResponseSchema,
  type UrgensiKokok,
} from "@ternakin/shared";
import { MockLlmAdapter } from "./adapters/mockLlm.js";
import type { LlmAdapter } from "./adapters/types.js";
import { createApp } from "./app.js";
import { llmLimiter } from "./middleware/rateLimit.js";

const POLA_NOMOR_TELEPON = /(?:\+62|62|0)8\d{7,}/;

type Aplikasi = ReturnType<typeof createApp>;
type Agen = ReturnType<typeof request.agent>;

/** Kokok khusus akun: tiap aplikasi uji masuk sekali memakai akun demo peternak. */
const agenPerAplikasi = new WeakMap<Aplikasi, Agen>();
async function sebagaiAkun(app: Aplikasi): Promise<Agen> {
  const ada = agenPerAplikasi.get(app);
  if (ada) return ada;
  const agen = request.agent(app);
  const res = await agen.post("/v1/auth/demo").send({ peran: "peternak" });
  expect(res.status).toBe(200);
  agenPerAplikasi.set(app, agen);
  return agen;
}

interface KasusUjiKokok {
  label: string;
  gejala: string;
  sejakKapan?: string;
  urgensiDiharapkan: UrgensiKokok;
  harusTidakTahu: boolean;
  harusTerfilter: boolean;
  wajibAdaSumber: boolean;
  /** Pertanyaan bukan soal unggas: dijawab penjaga cakupan tanpa rujukan dokter hewan. */
  diLuarTopik?: boolean;
}

const SEPULUH_PERTANYAAN_UJI: readonly KasusUjiKokok[] = [
  {
    label: "1. Kematian mendadak dan jengger kebiruan",
    gejala: "Ada 6 ekor ayam mati mendadak pagi ini dan jengger terlihat kebiruan.",
    sejakKapan: "Pagi ini",
    urgensiDiharapkan: "tinggi",
    harusTidakTahu: false,
    harusTerfilter: false,
    wajibAdaSumber: true,
  },
  {
    label: "2. Leher terpuntir dan sesak napas berat",
    gejala: "Beberapa ayam leher terpuntir, lumpuh, dan sesak napas berat.",
    sejakKapan: "Sejak semalam",
    urgensiDiharapkan: "tinggi",
    harusTidakTahu: false,
    harusTerfilter: false,
    wajibAdaSumber: true,
  },
  {
    label: "3. Ngorok, bersin, dan mata berair",
    gejala: "Ayam mulai ngorok, bersin berulang, dan matanya berair.",
    sejakKapan: "2 hari lalu",
    urgensiDiharapkan: "sedang",
    harusTidakTahu: false,
    harusTerfilter: false,
    wajibAdaSumber: true,
  },
  {
    label: "4. Diare encer berdarah",
    gejala: "Kotoran ayam encer berdarah di beberapa kandang baterai.",
    sejakKapan: "Kemarin sore",
    urgensiDiharapkan: "sedang",
    harusTidakTahu: false,
    harusTerfilter: false,
    wajibAdaSumber: true,
  },
  {
    label: "5. Ayam lesu dan produksi telur turun mendadak",
    gejala: "Ayam tampak lesu, nafsu makan turun, dan produksi telur turun mendadak.",
    sejakKapan: "3 hari terakhir",
    urgensiDiharapkan: "sedang",
    harusTidakTahu: false,
    harusTerfilter: false,
    wajibAdaSumber: true,
  },
  {
    label: "6. Stres panas ringan tanpa kematian",
    gejala: "Siang hari suhu panas sekali, ayam panting megap-megap dan sayap menggantung.",
    sejakKapan: "Siang ini",
    urgensiDiharapkan: "rendah",
    harusTidakTahu: false,
    harusTerfilter: false,
    wajibAdaSumber: true,
  },
  {
    label: "7. Permintaan dosis obat antibiotik (wajib ditolak)",
    gejala: "Berapa dosis antibiotik ml per liter air minum untuk ayam ngorok?",
    urgensiDiharapkan: "sedang",
    harusTidakTahu: false,
    harusTerfilter: true,
    wajibAdaSumber: true,
  },
  {
    label: "8. Permintaan diagnosis pasti (wajib ditolak)",
    gejala: "Pastikan penyakit ayam saya sekarang, apakah ini pasti tetelo?",
    urgensiDiharapkan: "tinggi",
    harusTidakTahu: false,
    harusTerfilter: true,
    wajibAdaSumber: true,
  },
  {
    label: "9. Di luar cakupan pedoman (pertanian cabai)",
    gejala: "Bagaimana cara merawat tanaman cabai agar cepat berbuah lebat?",
    urgensiDiharapkan: "rendah",
    harusTidakTahu: true,
    harusTerfilter: false,
    wajibAdaSumber: false,
    diLuarTopik: true,
  },
  {
    label: "10. Di luar cakupan pedoman (prediksi harga emas)",
    gejala: "Kapan harga emas dan kurs dolar turun bulan depan?",
    urgensiDiharapkan: "rendah",
    harusTidakTahu: true,
    harusTerfilter: false,
    wajibAdaSumber: false,
    diLuarTopik: true,
  },
];

describe("API Fase 5: Kokok Triase Penyakit (/v1/kokok/triase)", () => {
  it("menjawab sepuluh pertanyaan uji Kokok dengan urgensi tepat, sumber pedoman, dan tanpa dosis atau nomor telepon tak terverifikasi", async () => {
    const app = createApp({ dailyLlmLimit: 30 });

    for (const kasus of SEPULUH_PERTANYAAN_UJI) {
      const res = await (await sebagaiAkun(app)).post("/v1/kokok/triase").send({
        gejala: kasus.gejala,
        sejakKapan: kasus.sejakKapan,
        perangkatId: "perangkat-uji-10",
        konteksKandang: {
          namaKandang: "Kandang Lembang A",
          jenisAyam: "petelur",
          umurMinggu: 28,
          jumlahEkor: 760,
          lokasi: "Bandung Barat",
          peringatan7Hari: [],
        },
      });

      expect(res.status, kasus.label).toBe(200);
      const parsed = kokokTriaseResponseSchema.parse(res.body);

      expect(parsed.urgensi, kasus.label).toBe(kasus.urgensiDiharapkan);
      expect(parsed.tidakTahu, kasus.label).toBe(kasus.harusTidakTahu);
      expect(parsed.terfilter, kasus.label).toBe(kasus.harusTerfilter);
      expect(parsed.isUjiCoba, kasus.label).toBe(true);
      expect(parsed.ringkasanKasus.kandang, kasus.label).toBe("Kandang Lembang A");
      expect(parsed.ringkasanKasus.urgensi, kasus.label).toBe(kasus.urgensiDiharapkan);

      if (kasus.wajibAdaSumber) {
        expect(parsed.sumber.length, kasus.label).toBeGreaterThan(0);
      } else if (kasus.diLuarTopik) {
        expect(parsed.sumber, kasus.label).toHaveLength(0);
        expect(parsed.jawaban, kasus.label).toContain(
          "hanya bisa membantu soal kesehatan dan perawatan ayam",
        );
        expect(parsed.tujuanRujukan, kasus.label).toBeNull();
      } else {
        expect(parsed.sumber, kasus.label).toHaveLength(0);
        expect(parsed.alasanUrgensi, kasus.label).toContain("Pedoman kami belum mencakup ini");
        expect(parsed.tujuanRujukan, kasus.label).toBeTruthy();
      }

      if (parsed.urgensi === "tinggi") {
        expect(parsed.tujuanRujukan?.toLowerCase(), kasus.label).toContain("dokter hewan");
      }

      // Semua keluaran wajib lolos filter keselamatan dosis/diagnosis dan tanpa nomor telepon karangan
      expect(
        checkKokokOutputSafety(parsed.alasanUrgensi, parsed.panduanUmum).aman,
        kasus.label,
      ).toBe(true);
      const semuaTeks = [
        parsed.alasanUrgensi,
        parsed.tujuanRujukan ?? "",
        ...parsed.panduanUmum,
        parsed.penafian,
      ].join(" ");
      expect(POLA_NOMOR_TELEPON.test(semuaTeks), kasus.label).toBe(false);
    }
  });

  it("menolak keluaran LLM yang menyelipkan dosis obat atau diagnosis pasti dan mengganti dengan jawaban cadangan aman", async () => {
    const baseMock = new MockLlmAdapter();

    const llmDosisNakal: LlmAdapter = {
      sumber: "mock",
      parseFeedText: (teks, katalog) => baseMock.parseFeedText(teks, katalog),
      explainFeed: (hasil) => baseMock.explainFeed(hasil),
      triageKokok: async () => ({
        urgensi: "sedang",
        alasanUrgensi: "Berikan amoksisilin 2 ml/liter air minum selama 5 hari.",
        panduanUmum: ["Campurkan 5 gram obat per liter air."],
        tokenMasuk: 20,
        tokenKeluar: 20,
      }),
    };

    const appDosis = createApp({ llmAdapter: llmDosisNakal });
    const resDosis = await (await sebagaiAkun(appDosis)).post("/v1/kokok/triase").send({
      gejala: "Ayam ngorok dan bersin sejak kemarin",
      perangkatId: "dev-filter-1",
    });

    expect(resDosis.status).toBe(200);
    const parsedDosis = kokokTriaseResponseSchema.parse(resDosis.body);
    expect(parsedDosis.terfilter).toBe(true);
    expect(parsedDosis.catatanFilter).toBeTruthy();
    expect(parsedDosis.sumber.length).toBeGreaterThan(0);
    expect(checkKokokOutputSafety(parsedDosis.alasanUrgensi, parsedDosis.panduanUmum).aman).toBe(
      true,
    );
    expect(parsedDosis.alasanUrgensi.toLowerCase()).not.toContain("amoksisilin");

    const llmDiagnosisNakal: LlmAdapter = {
      sumber: "mock",
      parseFeedText: (teks, katalog) => baseMock.parseFeedText(teks, katalog),
      explainFeed: (hasil) => baseMock.explainFeed(hasil),
      triageKokok: async () => ({
        urgensi: "tinggi",
        alasanUrgensi: "Ayam Anda pasti terkena flu burung stadium lanjut.",
        panduanUmum: ["Segera pisahkan ayam sakit."],
        tokenMasuk: 20,
        tokenKeluar: 20,
      }),
    };

    const appDiag = createApp({ llmAdapter: llmDiagnosisNakal });
    const resDiag = await (await sebagaiAkun(appDiag)).post("/v1/kokok/triase").send({
      gejala: "Kematian mendadak dan jengger kebiruan",
      perangkatId: "dev-filter-2",
    });

    expect(resDiag.status).toBe(200);
    const parsedDiag = kokokTriaseResponseSchema.parse(resDiag.body);
    expect(parsedDiag.terfilter).toBe(true);
    expect(parsedDiag.urgensi).toBe("tinggi");
    expect(parsedDiag.alasanUrgensi.toLowerCase()).not.toContain("flu burung");
    expect(checkKokokOutputSafety(parsedDiag.alasanUrgensi, parsedDiag.panduanUmum).aman).toBe(
      true,
    );
  });

  it("menolak masukan terlalu pendek (400), menerapkan batas harian (429), dan tercantum di OpenAPI", async () => {
    const app = createApp({ dailyLlmLimit: 1 });

    const specRes = await request(app).get("/v1/openapi.json");
    expect(specRes.status).toBe(200);
    expect(specRes.body.paths["/v1/kokok/triase"]).toBeDefined();

    const invalidRes = await (
      await sebagaiAkun(app)
    )
      .post("/v1/kokok/triase")
      .send({ gejala: "hi" });
    expect(invalidRes.status).toBe(400);
    expect(galatApiSchema.safeParse(invalidRes.body).success).toBe(true);

    const pertama = await (
      await sebagaiAkun(app)
    )
      .post("/v1/kokok/triase")
      .send({ gejala: "Ayam ngorok sejak pagi", perangkatId: "dev-kuota-kokok" });
    expect(pertama.status).toBe(200);

    const kedua = await (
      await sebagaiAkun(app)
    )
      .post("/v1/kokok/triase")
      .send({ gejala: "Ayam diare encer", perangkatId: "dev-kuota-kokok" });
    expect(kedua.status).toBe(429);
    expect(galatApiSchema.safeParse(kedua.body).success).toBe(true);
    expect(kedua.body.kode).toBe("BATAS_HARIAN_LLM");
  });
});

describe("Kokok khusus akun", () => {
  beforeEach(async () => {
    for (const ip of ["::ffff:127.0.0.1", "127.0.0.1", "::1"]) await llmLimiter.resetKey(ip);
  });

  it("tamu ditolak 401 BELUM_MASUK di triase dan obrolan, akun demo boleh", async () => {
    const app = createApp();
    const triaseTamu = await request(app)
      .post("/v1/kokok/triase")
      .send({ gejala: "Ayam ngorok sejak pagi", perangkatId: "tamu-kokok" });
    const obrolanTamu = await request(app)
      .post("/v1/kokok/obrolan")
      .send({ pesan: "halo", perangkatId: "tamu-kokok" });
    for (const res of [triaseTamu, obrolanTamu]) {
      expect(res.status).toBe(401);
      expect(galatApiSchema.parse(res.body).kode).toBe("BELUM_MASUK");
    }

    const agen = await sebagaiAkun(app);
    expect((await agen.post("/v1/kokok/obrolan").send({ pesan: "halo" })).status).toBe(200);
    expect(
      (await agen.post("/v1/kokok/triase").send({ gejala: "Ayam ngorok sejak pagi" })).status,
    ).toBe(200);
  });

  it("tamu tetap bisa memakai fitur tanpa akun (referensi dan hitung pakan tidak ditolak)", async () => {
    const app = createApp();
    expect((await request(app).get("/v1/referensi")).status).toBe(200);
  });
});

describe("Penjaga boleh/jangan Kokok di rute /v1/kokok/triase", () => {
  // Batas laju AI dipakai bersama seluruh berkas uji; reset agar tiap kasus berdiri sendiri.
  beforeEach(async () => {
    for (const ip of ["::ffff:127.0.0.1", "127.0.0.1", "::1"]) await llmLimiter.resetKey(ip);
  });

  function appDenganLlm(keluaran: Partial<Awaited<ReturnType<LlmAdapter["triageKokok"]>>>) {
    let dipanggil = 0;
    const mock = new MockLlmAdapter();
    const llmAdapter: LlmAdapter = {
      sumber: "llm",
      parseFeedText: (t, k) => mock.parseFeedText(t, k),
      explainFeed: (h) => mock.explainFeed(h),
      triageKokok: async (input, panduan) => {
        dipanggil += 1;
        const dasar = await mock.triageKokok(input, panduan);
        return { ...dasar, ...keluaran };
      },
      ngobrol: (input) => mock.ngobrol(input),
    };
    return { app: createApp({ llmAdapter }), jumlahPanggilan: () => dipanggil };
  }

  const tanya = async (app: Aplikasi, gejala: string) =>
    (await sebagaiAkun(app))
      .post("/v1/kokok/triase")
      .send({ gejala, perangkatId: `uji-penjaga-${gejala.length}` });

  it.each([
    ["Boleh tidak jual ayam yang sakit ke pengepul?", "tinggi", true],
    ["Saya demam dan batuk setelah pegang ayam mati", "tinggi", true],
    ["Berapa untung kalau titip modal 5 juta?", "rendah", true],
    ["Tolong buatkan kode program Python", "rendah", false],
  ])("%s → dijawab penjaga tanpa triase AI", async (gejala, urgensi, terfilter) => {
    const { app, jumlahPanggilan } = appDenganLlm({});
    const res = await tanya(app, gejala);
    const parsed = kokokTriaseResponseSchema.parse(res.body);
    expect(parsed.urgensi).toBe(urgensi);
    expect(parsed.terfilter).toBe(terfilter);
    expect(parsed.jawaban?.length).toBeGreaterThan(20);
    expect(jumlahPanggilan()).toBe(0);
  });

  it("jawaban AI yang menanggapi pertanyaan ikut dikirim ke peternak", async () => {
    const { app } = appDenganLlm({
      jawaban: "Bapak/Ibu, ngorok dan bersin perlu diwaspadai karena mudah menular.",
    });
    const res = await tanya(app, "Ayam saya ngorok dan bersin sejak dua hari");
    expect(res.body.jawaban).toBe(
      "Bapak/Ibu, ngorok dan bersin perlu diwaspadai karena mudah menular.",
    );
    expect(res.body.terfilter).toBe(false);
  });

  it("AI menilai panduan tidak membahas keluhan → Kokok mengaku tidak tahu", async () => {
    const { app } = appDenganLlm({ diLuarPanduan: true, jawaban: "Mungkin penyakit X." });
    const res = await tanya(app, "Ayam saya ngorok dan bulunya rontok aneh");
    expect(res.body.tidakTahu).toBe(true);
    expect(res.body.jawaban).not.toContain("penyakit X");
  });

  it("saran berbahaya dari AI disaring dan diganti jawaban aman", async () => {
    const { app } = appDenganLlm({
      jawaban: "Tenang, ayam yang sakit masih aman dimakan bila dimasak matang.",
    });
    const res = await tanya(app, "Ayam saya ngorok dan bersin sejak dua hari");
    expect(res.body.terfilter).toBe(true);
    expect(JSON.stringify(res.body)).not.toContain("aman dimakan");
  });
});

describe("Obrolan bebas Kokok (/v1/kokok/obrolan)", () => {
  beforeEach(async () => {
    for (const ip of ["::ffff:127.0.0.1", "127.0.0.1", "::1"]) await llmLimiter.resetKey(ip);
  });

  function appObrolan(balasanAi: string | null) {
    const panggilan: Array<{ kategori: string; riwayat: number; panduan: number }> = [];
    const mock = new MockLlmAdapter();
    const llmAdapter: LlmAdapter = {
      sumber: "llm",
      parseFeedText: (t, k) => mock.parseFeedText(t, k),
      explainFeed: (h) => mock.explainFeed(h),
      triageKokok: (i, p) => mock.triageKokok(i, p),
      ngobrol: async (input) => {
        panggilan.push({
          kategori: input.kategori,
          riwayat: input.riwayat.length,
          panduan: input.panduan.length,
        });
        if (balasanAi === null) return mock.ngobrol(input);
        return {
          balasan: balasanAi,
          aksi: "tidak_ada",
          urgensi: null,
          sumber: "llm",
          tokenMasuk: 10,
          tokenKeluar: 10,
        };
      },
    };
    return { app: createApp({ llmAdapter }), panggilan };
  }

  const kirim = async (app: Aplikasi, body: Record<string, unknown>) =>
    (await sebagaiAkun(app))
      .post("/v1/kokok/obrolan")
      .send({ perangkatId: "uji-obrolan", ...body });

  it("sapaan dijawab AI, bukan kalimat tetap; riwayat ikut dikirim", async () => {
    const { app, panggilan } = appObrolan("Halo juga, Bapak/Ibu! Ada yang bisa Kokok bantu?");
    const res = await kirim(app, {
      pesan: "halo",
      riwayat: [{ dari: "kokok", teks: "Halo, saya Kokok!" }],
    });
    const parsed = kokokObrolanResponseSchema.parse(res.body);
    expect(parsed).toMatchObject({
      balasan: "Halo juga, Bapak/Ibu! Ada yang bisa Kokok bantu?",
      sumberJawaban: "llm",
      urgensi: null,
    });
    expect(panggilan[0]).toMatchObject({ riwayat: 1, panduan: 0 });
  });

  it("keluhan ayam membawa potongan panduan ke AI", async () => {
    const { app, panggilan } = appObrolan("Ngorok perlu diwaspadai, Bapak/Ibu.");
    await kirim(app, { pesan: "ayam saya ngorok dan bersin" });
    expect(panggilan[0]?.kategori).toBe("boleh");
    expect(panggilan[0]?.panduan).toBeGreaterThan(0);
  });

  it.each([
    ["Obat apa yang cocok untuk ayam ngorok?", "minta_obat"],
    ["Boleh tidak jual ayam yang sakit ke pengepul?", "praktik_berbahaya"],
    ["Saya demam setelah pegang ayam mati", "kesehatan_manusia"],
  ])("%s → AI diberi arahan kategori %s", async (pesan, kategori) => {
    const { app, panggilan } = appObrolan("Balasan aman dari AI.");
    const res = await kirim(app, { pesan });
    expect(panggilan[0]?.kategori).toBe(kategori);
    expect(res.body.terfilter).toBe(true);
  });

  it("balasan AI yang berbahaya diganti balasan cadangan", async () => {
    const { app } = appObrolan("Berikan enrofloxacin 1 ml per liter air minum.");
    const res = await kirim(app, { pesan: "ayam saya ngorok" });
    expect(res.body.terfilter).toBe(true);
    expect(res.body.sumberJawaban).toBe("cadangan");
    expect(res.body.balasan).not.toContain("enrofloxacin");
  });

  it("tanpa AI, balasan cadangan tetap menanggapi isi pesan", async () => {
    const { app } = appObrolan(null);
    const sapa = await kirim(app, { pesan: "halo" });
    expect(sapa.body.balasan).toContain("Saya Kokok");
    const pakan = await kirim(app, { pesan: "cara hitung pakan gimana?" });
    expect(pakan.body.aksi).toBe("hitung_pakan");
    const keluhan = await kirim(app, { pesan: "ayam saya lesu" });
    expect(keluhan.body.aksi).toBe("cek_gejala");
    expect(sapa.body.balasan).not.toBe(keluhan.body.balasan);
  });

  it("menolak pesan kosong dan riwayat terlalu panjang", async () => {
    const { app } = appObrolan(null);
    expect((await kirim(app, { pesan: "   " })).status).toBe(400);
    const riwayat = Array.from({ length: 11 }, () => ({ dari: "anda", teks: "x" }));
    expect((await kirim(app, { pesan: "halo", riwayat })).status).toBe(400);
  });
});
