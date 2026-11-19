import { Router } from "express";
import { getReferensiData, type DatabaseContext } from "../db/database.js";

export interface ReferensiRouterDeps {
  dbCtx: DatabaseContext;
  staleDays: number;
}

export function createReferensiRouter(deps: ReferensiRouterDeps): Router {
  const router = Router();

  // Sesuai SDD: GET /v1/bahan — master bahan dan nutrisi, dapat di-cache.
  router.get("/bahan", (_req, res) => {
    const ref = getReferensiData(deps.dbCtx, deps.staleDays);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json({
      versi: ref.versi,
      isDemo: ref.isDemo,
      catatanData: ref.catatanData,
      bahan: ref.bahan,
    });
  });

  // Tambahan di luar SDD (disetujui tim): GET /v1/referensi — paket data referensi lokal untuk mode offline.
  router.get("/referensi", (_req, res) => {
    const ref = getReferensiData(deps.dbCtx, deps.staleDays);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json(ref);
  });

  return router;
}
