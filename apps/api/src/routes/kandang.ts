import crypto from "node:crypto";
import { Router } from "express";
import {
  kandangCreateRequestSchema,
  type GalatApi,
  type KandangCreateRequest,
} from "@ternakin/shared";
import { listKandangByDevice, upsertKandang } from "../db/catatanRepo.js";
import type { DatabaseContext } from "../db/database.js";
import { kunciPemilik } from "../lib/pemilik.js";
import { validate } from "../middleware/validate.js";

export function createKandangRouter(dbCtx: DatabaseContext): Router {
  const router = Router();

  // Sesuai SDD: GET /v1/kandang
  router.get("/", (req, res) => {
    const perangkatId = kunciPemilik(res, req.query.perangkatId, req.header("x-device-id"));
    if (!perangkatId) {
      const galat: GalatApi = {
        kode: "PERANGKAT_TIDAK_ADA",
        pesan: "Identitas perangkat diperlukan untuk memuat daftar kandang.",
      };
      res.status(400).json(galat);
      return;
    }

    const daftar = listKandangByDevice(dbCtx.db, perangkatId);
    res.status(200).json({ kandang: daftar });
  });

  // Sesuai SDD: POST /v1/kandang
  router.post("/", validate(kandangCreateRequestSchema), (req, res) => {
    const body = req.body as KandangCreateRequest;
    const perangkatId = kunciPemilik(res, body.perangkatId, req.header("x-device-id"));
    if (!perangkatId) {
      const galat: GalatApi = {
        kode: "PERANGKAT_TIDAK_ADA",
        pesan: "Identitas perangkat diperlukan untuk menyimpan profil kandang.",
      };
      res.status(400).json(galat);
      return;
    }

    const tersimpan = upsertKandang(dbCtx.db, perangkatId, {
      id: body.id ?? crypto.randomUUID(),
      perangkatId,
      nama: body.nama,
      jenisAyam: body.jenisAyam,
      jumlahEkor: body.jumlahEkor,
      umurMinggu: body.umurMinggu ?? null,
      lokasi: body.lokasi ?? null,
      bahanTersedia: body.bahanTersedia ?? [],
      diubahPada: body.diubahPada ?? new Date().toISOString(),
    });

    if (!tersimpan) {
      const galat: GalatApi = {
        kode: "KANDANG_BUKAN_MILIK",
        pesan: "Kandang ini tersimpan atas nama perangkat atau akun lain.",
      };
      res.status(403).json(galat);
      return;
    }

    res.status(200).json({ kandang: tersimpan });
  });

  return router;
}
