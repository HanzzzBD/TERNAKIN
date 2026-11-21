import { Router } from "express";
import { z } from "zod";
import { catatanPutRequestSchema, type CatatanPutRequest, type GalatApi } from "@ternakin/shared";
import { pemilikKandang, upsertCatatan } from "../db/catatanRepo.js";
import type { DatabaseContext } from "../db/database.js";
import { kunciPemilik } from "../lib/pemilik.js";
import { validate } from "../middleware/validate.js";

const uuidParamSchema = z.string().uuid();

export function createCatatanRouter(dbCtx: DatabaseContext): Router {
  const router = Router();

  // Sesuai SDD: PUT /v1/catatan/{id} — idempoten, satu catatan per kandang per tanggal.
  router.put("/:id", validate(catatanPutRequestSchema), (req, res) => {
    const idParam = uuidParamSchema.safeParse(req.params.id);
    if (!idParam.success) {
      const galat: GalatApi = {
        kode: "ID_TIDAK_VALID",
        pesan: "ID catatan harus berupa UUID yang valid.",
      };
      res.status(400).json(galat);
      return;
    }

    const body = req.body as CatatanPutRequest;

    // Catatan hanya boleh ditulis oleh pemilik kandangnya (akun atau perangkat x-device-id).
    const pemilik = kunciPemilik(res, req.header("x-device-id"));
    const pemilikAda = pemilikKandang(dbCtx.db, body.kandangId);
    if (pemilikAda && pemilikAda !== pemilik) {
      const galat: GalatApi = {
        kode: "KANDANG_BUKAN_MILIK",
        pesan: "Kandang ini tersimpan atas nama perangkat atau akun lain.",
      };
      res.status(403).json(galat);
      return;
    }

    const tersimpan = upsertCatatan(dbCtx.db, {
      id: idParam.data,
      kandangId: body.kandangId,
      tanggal: body.tanggal,
      pakanKg: body.pakanKg,
      telur: body.telur,
      kematian: body.kematian,
      suhu: body.suhu,
      diubahPada: body.diubahPada,
      dihapusPada: body.dihapusPada ?? null,
    });

    if (!tersimpan) {
      const galat: GalatApi = {
        kode: "KANDANG_TIDAK_DITEMUKAN",
        pesan: "Kandang belum tersimpan di server. Sinkronkan profil kandang lebih dulu.",
      };
      res.status(404).json(galat);
      return;
    }

    res.status(200).json({ catatan: tersimpan });
  });

  return router;
}
