import { Router } from "express";
import type { GalatApi } from "@ternakin/shared";
import type { LlmAdapter, SolverAdapter } from "../adapters/types.js";
import type { DatabaseContext } from "../db/database.js";
import { buildOpenApiSpec } from "../openapi.js";
import { createAkunRouter } from "./akun.js";
import { createCatatanRouter } from "./catatan.js";
import { createKandangRouter } from "./kandang.js";
import { createPakanRouter } from "./pakan.js";
import { createReferensiRouter } from "./referensi.js";
import { createSinkronRouter } from "./sinkron.js";

export interface V1RouterDeps {
  dbCtx: DatabaseContext;
  llmAdapter: LlmAdapter;
  solverAdapter: SolverAdapter;
  staleDays: number;
  dailyLlmLimit: number;
}

export function createV1Router(deps: V1RouterDeps): Router {
  const router = Router();
  const openApiDoc = buildOpenApiSpec();

  router.get("/openapi.json", (_req, res) => {
    res.status(200).json(openApiDoc);
  });

  router.use("/", createReferensiRouter({ dbCtx: deps.dbCtx, staleDays: deps.staleDays }));
  router.use("/kandang", createKandangRouter(deps.dbCtx));
  router.use("/catatan", createCatatanRouter(deps.dbCtx));
  router.use("/sinkron", createSinkronRouter(deps.dbCtx));
  router.use("/akun", createAkunRouter(deps.dbCtx));
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
