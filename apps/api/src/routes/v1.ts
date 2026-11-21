import { Router } from "express";
import type { GalatApi } from "@ternakin/shared";
import type { GuidelineRetriever, LlmAdapter, SolverAdapter } from "../adapters/types.js";
import type { PengirimOtp } from "../adapters/pengirimOtp.js";
import type { DatabaseContext } from "../db/database.js";
import type { OpsiCookieSesi } from "../middleware/sesi.js";
import { buildOpenApiSpec } from "../openapi.js";
import { createAdminRouter } from "./admin.js";
import { createAkunRouter } from "./akun.js";
import { createAuthRouter } from "./auth.js";
import { createInvestasiRouter } from "./investasi.js";
import { tolakPeranPengguna } from "../middleware/peran.js";
import { createCatatanRouter } from "./catatan.js";
import { createKandangRouter } from "./kandang.js";
import { createKokokRouter } from "./kokok.js";
import { createLeadRouter } from "./lead.js";
import { createPakanRouter } from "./pakan.js";
import { createReferensiRouter } from "./referensi.js";
import { createSinkronRouter } from "./sinkron.js";
import { createTokoRouter } from "./toko.js";

export interface V1RouterDeps {
  dbCtx: DatabaseContext;
  llmAdapter: LlmAdapter;
  solverAdapter: SolverAdapter;
  guidelineRetriever: GuidelineRetriever;
  staleDays: number;
  dailyLlmLimit: number;
  adminKey: string;
  pengirimOtp: PengirimOtp | null;
  rahasiaOtp: string;
  cookieSesi: OpsiCookieSesi;
  akunDemoAktif: boolean;
}

export function createV1Router(deps: V1RouterDeps): Router {
  const router = Router();
  const openApiDoc = buildOpenApiSpec();

  router.get("/openapi.json", (_req, res) => {
    res.status(200).json(openApiDoc);
  });

  // Fitur khusus peternak (dan tamu): ditolak untuk akun berperan Pengguna.
  // Harus dipasang sebelum router fitur tersebut.
  router.use(
    ["/kandang", "/catatan", "/sinkron", "/pakan", "/lead", "/toko/rujukan"],
    tolakPeranPengguna,
  );
  router.use("/", createReferensiRouter({ dbCtx: deps.dbCtx, staleDays: deps.staleDays }));
  router.use("/kandang", createKandangRouter(deps.dbCtx));
  router.use("/catatan", createCatatanRouter(deps.dbCtx));
  router.use("/sinkron", createSinkronRouter(deps.dbCtx));
  router.use(
    "/auth",
    createAuthRouter({
      dbCtx: deps.dbCtx,
      pengirimOtp: deps.pengirimOtp,
      rahasiaOtp: deps.rahasiaOtp,
      cookie: deps.cookieSesi,
      akunDemoAktif: deps.akunDemoAktif,
    }),
  );
  router.use("/investasi", createInvestasiRouter(deps.dbCtx));

  router.use("/akun", createAkunRouter({ dbCtx: deps.dbCtx, cookie: deps.cookieSesi }));
  router.use("/toko", createTokoRouter({ dbCtx: deps.dbCtx, staleDays: deps.staleDays }));
  router.use("/lead", createLeadRouter(deps.dbCtx));
  router.use("/admin", createAdminRouter({ dbCtx: deps.dbCtx, adminKey: deps.adminKey }));
  router.use(
    "/kokok",
    createKokokRouter({
      dbCtx: deps.dbCtx,
      llmAdapter: deps.llmAdapter,
      guidelineRetriever: deps.guidelineRetriever,
      dailyLlmLimit: deps.dailyLlmLimit,
    }),
  );
  router.use(
    "/pakan",
    createPakanRouter({
      dbCtx: deps.dbCtx,
      llmAdapter: deps.llmAdapter,
      solverAdapter: deps.solverAdapter,
      staleDays: deps.staleDays,
      dailyLlmLimit: deps.dailyLlmLimit,
    }),
  );

  router.use((_req, res) => {
    const galat: GalatApi = {
      kode: "TIDAK_DITEMUKAN",
      pesan: "Jalur API tidak ditemukan.",
    };
    res.status(404).json(galat);
  });

  return router;
}
