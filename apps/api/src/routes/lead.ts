import { Router } from "express";
import { leadCreateRequestSchema, type GalatApi, type LeadCreateRequest } from "@ternakin/shared";
import type { DatabaseContext } from "../db/database.js";
import { insertLeadIdempotent } from "../db/tokoRepo.js";
import { validate } from "../middleware/validate.js";

export function createLeadRouter(dbCtx: DatabaseContext): Router {
  const router = Router();

  // Tambahan di luar SDD (disetujui tim): POST /v1/lead — idempoten lewat clientId.
  router.post("/", validate(leadCreateRequestSchema), (req, res) => {
    const body = req.body as LeadCreateRequest;
    const perangkatId = body.perangkatId ?? req.header("x-device-id") ?? null;

    const ok = insertLeadIdempotent(dbCtx.db, {
      clientId: body.clientId,
      tokoId: body.tokoId,
      perangkatId,
      src: body.src ?? null,
      dibuatPada: body.dibuatPada,
    });

    if (!ok) {
      const galat: GalatApi = {
        kode: "TOKO_TIDAK_DITEMUKAN",
        pesan: "Toko tidak ditemukan.",
      };
      res.status(404).json(galat);
      return;
    }

    res.status(200).json({ ok: true, id: body.clientId });
  });

  return router;
}
