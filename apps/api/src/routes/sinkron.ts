import { Router } from "express";
import { sinkronRequestSchema, type SinkronRequest, type SinkronResponse } from "@ternakin/shared";
import {
  isOpSudahDiproses,
  listCatatanByDevice,
  listKandangByDevice,
  softDeleteCatatan,
  tandaiOpDiproses,
  upsertCatatan,
  upsertKandang,
} from "../db/catatanRepo.js";
import type { DatabaseContext } from "../db/database.js";
import { insertLeadIdempotent } from "../db/tokoRepo.js";
import { validate } from "../middleware/validate.js";

export function createSinkronRouter(dbCtx: DatabaseContext): Router {
  const router = Router();

  // Sesuai SDD: POST /v1/sinkron — idempoten per UUID outbox, perubahan terbaru menang.
  router.post("/", validate(sinkronRequestSchema), (req, res) => {
    const body = req.body as SinkronRequest;
    const dikonfirmasiOpIds: string[] = [];

    const prosesTransaksi = dbCtx.db.transaction(() => {
      for (const item of body.itemOutbox) {
        if (isOpSudahDiproses(dbCtx.db, item.opId)) {
          dikonfirmasiOpIds.push(item.opId);
          continue;
        }

        if (item.jenis === "upsert_kandang") {
          upsertKandang(dbCtx.db, body.perangkatId, item.payload);
          tandaiOpDiproses(dbCtx.db, item.opId, body.perangkatId);
          dikonfirmasiOpIds.push(item.opId);
        } else if (item.jenis === "upsert_catatan") {
          const tersimpan = upsertCatatan(dbCtx.db, item.payload);
          if (tersimpan) {
            tandaiOpDiproses(dbCtx.db, item.opId, body.perangkatId);
            dikonfirmasiOpIds.push(item.opId);
          }
        } else if (item.jenis === "hapus_catatan") {
          softDeleteCatatan(dbCtx.db, item.payload);
          tandaiOpDiproses(dbCtx.db, item.opId, body.perangkatId);
          dikonfirmasiOpIds.push(item.opId);
        } else if (item.jenis === "catat_lead") {
          insertLeadIdempotent(dbCtx.db, {
            clientId: item.payload.clientId,
            tokoId: item.payload.tokoId,
            perangkatId: body.perangkatId,
            src: item.payload.src ?? null,
            dibuatPada: item.payload.dibuatPada,
          });
          tandaiOpDiproses(dbCtx.db, item.opId, body.perangkatId);
          dikonfirmasiOpIds.push(item.opId);
        }
      }
    });

    prosesTransaksi();

    const respons: SinkronResponse = {
      dikonfirmasiOpIds,
      kandangTerbaru: listKandangByDevice(dbCtx.db, body.perangkatId),
      catatanTerbaru: listCatatanByDevice(dbCtx.db, body.perangkatId, body.terakhirSinkron),
      waktuServer: new Date().toISOString(),
    };

    res.status(200).json(respons);
  });

  return router;
}
