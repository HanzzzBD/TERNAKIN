import { Router } from "express";
import {
  sinkronRequestSchema,
  type GalatApi,
  type SinkronRequest,
  type SinkronResponse,
} from "@ternakin/shared";
import {
  isOpSudahDiproses,
  listCatatanByDevice,
  listKandangByDevice,
  pemilikKandang,
  softDeleteCatatan,
  tandaiOpDiproses,
  upsertCatatan,
  upsertKandang,
} from "../db/catatanRepo.js";
import type { DatabaseContext } from "../db/database.js";
import { insertLeadIdempotent } from "../db/tokoRepo.js";
import { logger } from "../lib/logger.js";
import { kunciPemilik } from "../lib/pemilik.js";
import { validate } from "../middleware/validate.js";

export function createSinkronRouter(dbCtx: DatabaseContext): Router {
  const router = Router();

  // Sesuai SDD: POST /v1/sinkron — idempoten per UUID outbox, perubahan terbaru menang.
  // Pemilik data = akun bila sesi valid, selain itu ID perangkat (mode tamu).
  router.post("/", validate(sinkronRequestSchema), (req, res) => {
    const body = req.body as SinkronRequest;
    const pemilik = kunciPemilik(res, body.perangkatId, req.header("x-device-id"));
    if (!pemilik) {
      const galat: GalatApi = {
        kode: "PERANGKAT_TIDAK_ADA",
        pesan: "Identitas perangkat tidak valid untuk sinkronisasi.",
      };
      res.status(400).json(galat);
      return;
    }

    const dikonfirmasiOpIds: string[] = [];
    let ditolak = 0;

    /** Kandang yang sudah ada dan dimiliki pihak lain tidak boleh diubah lewat antrean ini. */
    const milikLain = (kandangId: string): boolean => {
      const pemilikAda = pemilikKandang(dbCtx.db, kandangId);
      return pemilikAda !== undefined && pemilikAda !== null && pemilikAda !== pemilik;
    };

    const konfirmasi = (opId: string) => {
      tandaiOpDiproses(dbCtx.db, opId, pemilik);
      dikonfirmasiOpIds.push(opId);
    };

    const prosesTransaksi = dbCtx.db.transaction(() => {
      for (const item of body.itemOutbox) {
        if (isOpSudahDiproses(dbCtx.db, item.opId)) {
          dikonfirmasiOpIds.push(item.opId);
          continue;
        }

        if (item.jenis === "upsert_kandang") {
          if (!upsertKandang(dbCtx.db, pemilik, item.payload)) ditolak += 1;
          konfirmasi(item.opId);
        } else if (item.jenis === "upsert_catatan") {
          if (milikLain(item.payload.kandangId)) {
            ditolak += 1;
            konfirmasi(item.opId);
            continue;
          }
          // Bila kandang belum tersimpan, op dibiarkan di antrean dan dicoba lagi nanti.
          if (upsertCatatan(dbCtx.db, item.payload)) konfirmasi(item.opId);
        } else if (item.jenis === "hapus_catatan") {
          if (milikLain(item.payload.kandangId)) {
            ditolak += 1;
          } else {
            softDeleteCatatan(dbCtx.db, item.payload);
          }
          konfirmasi(item.opId);
        } else if (item.jenis === "catat_lead") {
          insertLeadIdempotent(dbCtx.db, {
            clientId: item.payload.clientId,
            tokoId: item.payload.tokoId,
            perangkatId: pemilik,
            src: item.payload.src ?? null,
            dibuatPada: item.payload.dibuatPada,
          });
          konfirmasi(item.opId);
        }
      }
    });

    prosesTransaksi();

    if (ditolak > 0) {
      logger.warn(
        { rute: "/v1/sinkron", ditolak },
        "Perubahan untuk kandang milik pihak lain ditolak",
      );
    }

    const respons: SinkronResponse = {
      dikonfirmasiOpIds,
      kandangTerbaru: listKandangByDevice(dbCtx.db, pemilik),
      catatanTerbaru: listCatatanByDevice(dbCtx.db, pemilik, body.terakhirSinkron),
      waktuServer: new Date().toISOString(),
    };

    res.status(200).json(respons);
  });

  return router;
}
