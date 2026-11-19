import crypto from "node:crypto";
import { Router } from "express";
import {
  checkKokokOutputSafety,
  detectUnsafeUserAsk,
  jawabanCadanganAman,
  kokokTriaseRequestSchema,
  kokokTriaseResponseSchema,
  tujuanRujukanUntukUrgensi,
  type GalatApi,
  type KokokTriaseRequest,
  type KokokTriaseResponse,
  type RingkasanKasus,
  type SumberPanduan,
  type UrgensiKokok,
} from "@ternakin/shared";
import type { GuidelineChunk, GuidelineRetriever, LlmAdapter } from "../adapters/types.js";
import type { DatabaseContext } from "../db/database.js";
import { catatPemakaianLlm, hashSingkatUntukLog, hitungPemakaianHariIni } from "../lib/llmGuard.js";
import { logger } from "../lib/logger.js";
import { llmLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";

const PENAFIAN_KOKOK =
  "Bukan diagnosis medis dan tidak memberi dosis obat. Untuk pemeriksaan langsung dan pengobatan, konsultasikan dengan dokter hewan, puskeswan, atau penyuluh peternakan.";

export interface KokokRouterDeps {
  dbCtx: DatabaseContext;
  llmAdapter: LlmAdapter;
  guidelineRetriever: GuidelineRetriever;
  dailyLlmLimit: number;
}

function ambilPerangkatId(
  bodyPerangkatId: string | undefined,
  headerVal: string | undefined,
  ip: string,
): string {
  const kandidat = bodyPerangkatId ?? headerVal;
  if (kandidat && kandidat.trim().length > 0) {
    return kandidat.trim().slice(0, 128);
  }
  return `ip:${ip}`;
}

function petakanSumber(guidelines: readonly GuidelineChunk[]): SumberPanduan[] {
  return guidelines.map((g) => ({
    id: g.id,
    judul: g.judul,
    sumber: g.sumber,
    versi: g.versi,
    ringkasanKutipan: g.ringkasanKutipan,
  }));
}

function susunRingkasanKasus(body: KokokTriaseRequest, urgensi: UrgensiKokok): RingkasanKasus {
  const ctx = body.konteksKandang;
  return {
    kandang: ctx?.namaKandang?.trim() || "Kandang petelur",
    jenisAyam: ctx?.jenisAyam ?? "petelur",
    umurMinggu: ctx?.umurMinggu ?? null,
    populasiEkor: ctx?.jumlahEkor ?? null,
    lokasi: ctx?.lokasi?.trim() || null,
    gejala: body.gejala,
    sejakKapan: body.sejakKapan?.trim() || "Belum disebutkan",
    peringatan7Hari: ctx?.peringatan7Hari ?? [],
    urgensi,
  };
}

function deteksiUrgensiBahayaAwal(
  gejala: string,
  guidelines: readonly GuidelineChunk[],
): UrgensiKokok {
  const polaTinggi =
    /\b(?:mati mendadak|kematian mendadak|banyak mati|leher terpuntir|kejang|lumpuh|jengger biru|kebiruan|sesak berat)\b/i;
  if (polaTinggi.test(gejala) || guidelines[0]?.id === "panduan_kematian_mendadak") {
    return "tinggi";
  }
  return "sedang";
}

function simpanRiwayatRingkas(
  dbCtx: DatabaseContext,
  perangkatId: string,
  respons: KokokTriaseResponse,
): void {
  const ringkasanTersimpan = `${respons.ringkasanKasus.kandang} (${respons.ringkasanKasus.jenisAyam}) — urgensi ${respons.urgensi}${respons.tidakTahu ? " [di luar panduan]" : ""}${respons.terfilter ? " [terfilter]" : ""}`;
  const sumberDipakai = JSON.stringify(respons.sumber.map((s) => s.id));

  dbCtx.db
    .prepare(
      `INSERT INTO percakapan_kokok
         (id, pengguna_id, perangkat_id, ringkasan, urgensi, sumber_dipakai, dibuat_pada)
       VALUES (?, NULL, ?, ?, ?, ?, ?)`,
    )
    .run(
      respons.id,
      perangkatId,
      ringkasanTersimpan,
      respons.urgensi,
      sumberDipakai,
      respons.dibuatPada,
    );
}

export function createKokokRouter(deps: KokokRouterDeps): Router {
  const router = Router();

  // Sesuai SDD: POST /v1/kokok/triase — triase gejala unggas berbasis panduan (RAG) dan filter keselamatan.
  router.post("/triase", llmLimiter, validate(kokokTriaseRequestSchema), async (req, res, next) => {
    try {
      const body = req.body as KokokTriaseRequest;
      const perangkatId = ambilPerangkatId(
        body.perangkatId,
        req.header("x-device-id"),
        req.ip ?? "lokal",
      );

      // Jangan mencatat isi teks mentah peternak di log; catat panjang dan hash singkat saja.
      logger.info(
        {
          rute: "/v1/kokok/triase",
          panjang: body.gejala.length,
          hash: hashSingkatUntukLog(body.gejala.toLowerCase()),
        },
        "Permintaan triase Kokok diterima",
      );

      const pemakaianHariIni = hitungPemakaianHariIni(deps.dbCtx.db, perangkatId);
      if (pemakaianHariIni >= deps.dailyLlmLimit) {
        const galat: GalatApi = {
          kode: "BATAS_HARIAN_LLM",
          pesan:
            "Batas pertanyaan ke Kokok hari ini sudah tercapai. Anda masih bisa membaca riwayat tanya sebelumnya, lalu coba lagi besok atau langsung hubungi penyuluh/dokter hewan.",
        };
        res.status(429).json(galat);
        return;
      }

      const id = crypto.randomUUID();
      const dibuatPada = new Date().toISOString();
      const guidelines = await deps.guidelineRetriever.search(body.gejala, 3);
      const sumber = petakanSumber(guidelines);
      const deteksi = detectUnsafeUserAsk(body.gejala);

      // 1. Jika pengguna meminta dosis obat atau diagnosis pasti, tolak dengan jawaban cadangan aman.
      if (deteksi.mintaDosis || deteksi.mintaDiagnosis) {
        const alasanTolak = deteksi.mintaDosis
          ? "Permintaan dosis atau takaran obat ditolak sesuai aturan keselamatan Kokok."
          : "Permintaan diagnosis pasti ditolak sesuai aturan keselamatan Kokok.";
        const urgensiAwal = deteksiUrgensiBahayaAwal(body.gejala, guidelines);
        const cadangan = jawabanCadanganAman(urgensiAwal, alasanTolak);

        const respons: KokokTriaseResponse = kokokTriaseResponseSchema.parse({
          id,
          urgensi: cadangan.urgensi,
          alasanUrgensi: cadangan.alasanUrgensi,
          tujuanRujukan: cadangan.tujuanRujukan,
          panduanUmum: cadangan.panduanUmum,
          sumber,
          ringkasanKasus: susunRingkasanKasus(body, cadangan.urgensi),
          tidakTahu: false,
          terfilter: true,
          catatanFilter: cadangan.catatanFilter,
          penafian: PENAFIAN_KOKOK,
          isUjiCoba: true,
          dibuatPada,
        });

        catatPemakaianLlm(deps.dbCtx.db, perangkatId, "/v1/kokok/triase", 0, 0);
        simpanRiwayatRingkas(deps.dbCtx, perangkatId, respons);
        res.status(200).json(respons);
        return;
      }

      // 2. Jika tidak ada panduan relevan di basis data, katakan tidak tahu dengan urgensi sedang.
      if (guidelines.length === 0) {
        const urgensi: UrgensiKokok = "sedang";
        const respons: KokokTriaseResponse = kokokTriaseResponseSchema.parse({
          id,
          urgensi,
          alasanUrgensi:
            "Pedoman kami belum mencakup ini. Karena kondisi tidak tercakup di pedoman yang tersedia, sebaiknya konsultasikan langsung kepada penyuluh peternakan, puskeswan, atau dokter hewan.",
          tujuanRujukan: tujuanRujukanUntukUrgensi(urgensi),
          panduanUmum: [
            "Jika ada ayam yang tampak sakit atau berubah perilaku, pisahkan sementara ke area terpisah untuk diamati.",
            "Catat gejala yang terlihat, jumlah ekor terdampak, perubahan pakan/telur, serta kapan gejala mulai muncul.",
            "Kirimkan ringkasan kasus di bawah ini ke penyuluh peternakan, puskeswan, atau dokter hewan setempat untuk arahan yang tepat.",
          ],
          sumber: [],
          ringkasanKasus: susunRingkasanKasus(body, urgensi),
          tidakTahu: true,
          terfilter: false,
          penafian: PENAFIAN_KOKOK,
          isUjiCoba: true,
          dibuatPada,
        });

        catatPemakaianLlm(deps.dbCtx.db, perangkatId, "/v1/kokok/triase", 0, 0);
        simpanRiwayatRingkas(deps.dbCtx, perangkatId, respons);
        res.status(200).json(respons);
        return;
      }

      // 3. Panggil adapter LLM hanya berdasarkan potongan panduan, lalu saring keluarannya.
      const hasilLlm = await deps.llmAdapter.triageKokok(
        {
          gejala: body.gejala,
          sejakKapan: body.sejakKapan,
          peringatan7Hari: body.konteksKandang?.peringatan7Hari ?? [],
        },
        guidelines,
      );

      catatPemakaianLlm(
        deps.dbCtx.db,
        perangkatId,
        "/v1/kokok/triase",
        hasilLlm.tokenMasuk,
        hasilLlm.tokenKeluar,
      );

      const hasilFilter = checkKokokOutputSafety(hasilLlm.alasanUrgensi, hasilLlm.panduanUmum);

      if (!hasilFilter.aman) {
        logger.warn(
          { rute: "/v1/kokok/triase", alasan: hasilFilter.alasan },
          "Keluaran LLM Kokok ditolak filter keselamatan",
        );
        const cadangan = jawabanCadanganAman(
          hasilLlm.urgensi,
          hasilFilter.alasan ?? "Keluaran mengandung konten yang tidak aman.",
        );
        const respons: KokokTriaseResponse = kokokTriaseResponseSchema.parse({
          id,
          urgensi: cadangan.urgensi,
          alasanUrgensi: cadangan.alasanUrgensi,
          tujuanRujukan: cadangan.tujuanRujukan,
          panduanUmum: cadangan.panduanUmum,
          sumber,
          ringkasanKasus: susunRingkasanKasus(body, cadangan.urgensi),
          tidakTahu: false,
          terfilter: true,
          catatanFilter: cadangan.catatanFilter,
          penafian: PENAFIAN_KOKOK,
          isUjiCoba: true,
          dibuatPada,
        });

        simpanRiwayatRingkas(deps.dbCtx, perangkatId, respons);
        res.status(200).json(respons);
        return;
      }

      const respons: KokokTriaseResponse = kokokTriaseResponseSchema.parse({
        id,
        urgensi: hasilLlm.urgensi,
        alasanUrgensi: hasilLlm.alasanUrgensi,
        tujuanRujukan: tujuanRujukanUntukUrgensi(hasilLlm.urgensi),
        panduanUmum: hasilLlm.panduanUmum,
        sumber,
        ringkasanKasus: susunRingkasanKasus(body, hasilLlm.urgensi),
        tidakTahu: false,
        terfilter: false,
        penafian: PENAFIAN_KOKOK,
        isUjiCoba: true,
        dibuatPada,
      });

      simpanRiwayatRingkas(deps.dbCtx, perangkatId, respons);
      res.status(200).json(respons);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
