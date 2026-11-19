import { Router } from "express";
import {
  adminUpdateHargaRequestSchema,
  type AdminUpdateHargaRequest,
  type GalatApi,
} from "@ternakin/shared";
import type { DatabaseContext } from "../db/database.js";
import { getWeeklyLeadSummary, updateTokoPrices } from "../db/tokoRepo.js";
import { requireAdminKey } from "../middleware/requireAdminKey.js";
import { validate } from "../middleware/validate.js";

export interface AdminRouterDeps {
  dbCtx: DatabaseContext;
  adminKey: string;
}

function escapeCsv(val: string | number | boolean): string {
  const teks = String(val);
  if (/[",\n]/.test(teks)) {
    return `"${teks.replace(/"/g, '""')}"`;
  }
  return teks;
}

export function createAdminRouter(deps: AdminRouterDeps): Router {
  const router = Router();
  router.use(requireAdminKey(deps.adminKey));

  // Tambahan di luar SDD (disetujui tim): PUT /v1/admin/toko/{id}/harga
  router.put("/toko/:id/harga", validate(adminUpdateHargaRequestSchema), (req, res) => {
    const tokoId = req.params.id;
    if (typeof tokoId !== "string" || !tokoId) {
      const galat: GalatApi = {
        kode: "INPUT_TIDAK_VALID",
        pesan: "ID toko tidak valid.",
      };
      res.status(400).json(galat);
      return;
    }

    const body = req.body as AdminUpdateHargaRequest;
    const updated = updateTokoPrices(deps.dbCtx.db, tokoId, body.harga);

    if (!updated) {
      const galat: GalatApi = {
        kode: "TOKO_TIDAK_DITEMUKAN",
        pesan: "Toko tidak ditemukan.",
      };
      res.status(404).json(galat);
      return;
    }

    res.status(200).json({ toko: updated });
  });

  // Tambahan di luar SDD (disetujui tim): GET /v1/admin/lead?minggu=YYYY-Www(&format=csv)
  router.get("/lead", (req, res) => {
    const minggu = typeof req.query.minggu === "string" ? req.query.minggu : undefined;
    const hasil = getWeeklyLeadSummary(deps.dbCtx.db, minggu);

    const inginCsv =
      req.query.format === "csv" || (req.header("accept") ?? "").includes("text/csv");

    if (inginCsv) {
      const header = "toko_id,kode,nama_toko,status_mitra,total_lead,perangkat_unik";
      const baris = hasil.rekap.map((r) =>
        [
          escapeCsv(r.tokoId),
          escapeCsv(r.kode),
          escapeCsv(r.namaToko),
          escapeCsv(r.statusMitra ? "mitra" : "bukan_mitra"),
          escapeCsv(r.totalLead),
          escapeCsv(r.perangkatUnik),
        ].join(","),
      );
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.status(200).send([header, ...baris].join("\n"));
      return;
    }

    res.status(200).json(hasil);
  });

  return router;
}
