import crypto from "node:crypto";
import { Router } from "express";
import {
  kandangCreateRequestSchema,
  type GalatApi,
  type KandangCreateRequest,
} from "@ternakin/shared";
import { listKandangByDevice, upsertKandang } from "../db/catatanRepo.js";
import type { DatabaseContext } from "../db/database.js";
import { validate } from "../middleware/validate.js";

function ambilPerangkatId(headerVal: string | undefined, bodyVal?: string): string | null {
  const kandidat = bodyVal ?? headerVal;
  if (!kandidat || kandidat.trim().length === 0) return null;
  return kandidat.trim().slice(0, 128);
}

export function createKandangRouter(dbCtx: DatabaseContext): Router {
  const router = Router();

  // Sesuai SDD: GET /v1/kandang
  router.get("/", (req, res) => {
    const perangkatId = ambilPerangkatId(
      req.header("x-device-id"),
      typeof req.query.perangkatId === "string" ? req.query.perangkatId : undefined,
    );
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
    const perangkatId = ambilPerangkatId(req.header("x-device-id"), body.perangkatId);
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

    res.status(200).json({ kandang: tersimpan });
  });

  return router;
}
