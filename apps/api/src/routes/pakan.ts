import { Router } from "express";
import {
  pakanHitungRequestSchema,
  pakanJelaskanRequestSchema,
  pakanUraiRequestSchema,
  pakanUraiResponseSchema,
  verifyFeedExplanation,
  type GalatApi,
  type PakanHitungRequest,
  type PakanJelaskanRequest,
  type PakanJelaskanResponse,
  type PakanUraiRequest,
  type PakanUraiResponse,
} from "@ternakin/shared";
import type { LlmAdapter, SolverAdapter } from "../adapters/types.js";
import { getReferensiData, type DatabaseContext } from "../db/database.js";
import {
  bacaCacheLlm,
  catatPemakaianLlm,
  hashKunci,
  hashSingkatUntukLog,
  hitungPemakaianHariIni,
  simpanCacheLlm,
} from "../lib/llmGuard.js";
import { logger } from "../lib/logger.js";
import { llmLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";

export interface PakanRouterDeps {
  dbCtx: DatabaseContext;
  llmAdapter: LlmAdapter;
  solverAdapter: SolverAdapter;
  staleDays: number;
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

export function createPakanRouter(deps: PakanRouterDeps): Router {
  const router = Router();

  // Sesuai SDD: POST /v1/pakan/urai — teks bebas menjadi daftar bahan dan harga untuk dikonfirmasi.
  router.post("/urai", llmLimiter, validate(pakanUraiRequestSchema), async (req, res, next) => {
    try {
      const body = req.body as PakanUraiRequest;
      const perangkatId = ambilPerangkatId(
        body.perangkatId,
        req.header("x-device-id"),
        req.ip ?? "lokal",
      );

      const teksNormal = body.teks.toLowerCase().replace(/\s+/g, " ").trim();
      const cacheKey = hashKunci("pakan:urai", teksNormal);

      // Jangan mencatat isi teks mentah peternak di log; catat panjang dan hash singkat saja.
      logger.info(
        {
          rute: "/v1/pakan/urai",
          panjang: body.teks.length,
          hash: hashSingkatUntukLog(teksNormal),
        },
        "Permintaan urai pakan diterima",
      );

      const dariCache = bacaCacheLlm(deps.dbCtx.db, cacheKey);
      if (dariCache) {
        const parsed = pakanUraiResponseSchema.safeParse(JSON.parse(dariCache));
        if (parsed.success) {
          res.status(200).json({ ...parsed.data, dariCache: true });
          return;
        }
      }

      const pemakaianHariIni = hitungPemakaianHariIni(deps.dbCtx.db, perangkatId);
      if (pemakaianHariIni >= deps.dailyLlmLimit) {
        const galat: GalatApi = {
          kode: "BATAS_HARIAN_LLM",
          pesan:
            "Batas pembacaan teks otomatis hari ini sudah tercapai. Anda tetap bisa memilih bahan dan mengisi harga langsung, lalu coba lagi besok.",
        };
        res.status(429).json(galat);
        return;
      }

      const ref = getReferensiData(deps.dbCtx, deps.staleDays);
      const hasil = await deps.llmAdapter.parseFeedText(body.teks, ref.bahan);

      catatPemakaianLlm(
        deps.dbCtx.db,
        perangkatId,
        "/v1/pakan/urai",
        hasil.tokenMasuk,
        hasil.tokenKeluar,
      );

      const respons: PakanUraiResponse = {
        item: hasil.item,
        catatan: hasil.catatan,
        sumber: deps.llmAdapter.sumber,
        dariCache: false,
      };

      simpanCacheLlm(deps.dbCtx.db, cacheKey, JSON.stringify(respons));
      res.status(200).json(respons);
    } catch (err) {
      next(err);
    }
  });

  // Sesuai SDD: POST /v1/pakan/hitung — murni solver LP, hasil identik dengan solver di perangkat.
  router.post("/hitung", validate(pakanHitungRequestSchema), async (req, res, next) => {
    try {
      const body = req.body as PakanHitungRequest;
      const hasil = await deps.solverAdapter.optimize(body);
      res.status(200).json(hasil);
    } catch (err) {
      next(err);
    }
  });

  // Tambahan di luar SDD (disetujui tim): POST /v1/pakan/jelaskan — penjelasan singkat dari hasil solver.
  router.post(
    "/jelaskan",
    llmLimiter,
    validate(pakanJelaskanRequestSchema),
    async (req, res, next) => {
      try {
        const body = req.body as PakanJelaskanRequest;
        const perangkatId = ambilPerangkatId(
          body.perangkatId,
          req.header("x-device-id"),
          req.ip ?? "lokal",
        );

        const cacheKey = hashKunci("pakan:jelaskan", JSON.stringify(body.hasilSolver));
        const dariCache = bacaCacheLlm(deps.dbCtx.db, cacheKey);
        if (dariCache) {
          const cached = JSON.parse(dariCache) as PakanJelaskanResponse;
          res.status(200).json({ ...cached, dariCache: true });
          return;
        }

        const pemakaianHariIni = hitungPemakaianHariIni(deps.dbCtx.db, perangkatId);
        if (pemakaianHariIni >= deps.dailyLlmLimit) {
          const galat: GalatApi = {
            kode: "BATAS_HARIAN_LLM",
            pesan:
              "Batas penjelasan otomatis hari ini sudah tercapai. Angka hitungan campuran di atas tetap berlaku dan siap dipakai.",
          };
          res.status(429).json(galat);
          return;
        }

        const keluaran = await deps.llmAdapter.explainFeed(body.hasilSolver);
        catatPemakaianLlm(
          deps.dbCtx.db,
          perangkatId,
          "/v1/pakan/jelaskan",
          keluaran.tokenMasuk,
          keluaran.tokenKeluar,
        );

        // Aturan wajib: buang penjelasan jika menyebut angka berbeda dari hasil solver.
        const cek = verifyFeedExplanation(keluaran.penjelasan, body.hasilSolver);
        if (!cek.terverifikasi) {
          logger.warn(
            { rute: "/v1/pakan/jelaskan", jumlahMenyimpang: cek.angkaMenyimpang.length },
            "Penjelasan LLM dibuang karena angka berbeda dari hasil solver",
          );
          const ditolak: PakanJelaskanResponse = {
            penjelasan: null,
            terverifikasi: false,
            ditolakAlasan:
              "Penjelasan otomatis dibuang karena menyebut angka yang tidak sesuai hasil hitungan.",
            dariCache: false,
            sumber: deps.llmAdapter.sumber,
          };
          res.status(200).json(ditolak);
          return;
        }

        const respons: PakanJelaskanResponse = {
          penjelasan: keluaran.penjelasan,
          terverifikasi: true,
          dariCache: false,
          sumber: deps.llmAdapter.sumber,
        };
        simpanCacheLlm(deps.dbCtx.db, cacheKey, JSON.stringify(respons));
        res.status(200).json(respons);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
