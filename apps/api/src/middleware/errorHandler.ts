import type { ErrorRequestHandler } from "express";
import type { GalatApi } from "@ternakin/shared";
import { logger } from "../lib/logger.js";

interface HttpErrorLike {
  status?: number;
  type?: string;
  message?: string;
}

export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  const errObj = (typeof err === "object" && err !== null ? err : {}) as HttpErrorLike;

  if (errObj.type === "entity.parse.failed" || errObj.status === 400) {
    const galat: GalatApi = {
      kode: "JSON_TIDAK_VALID",
      pesan: "Format data yang dikirim tidak dapat dibaca.",
    };
    res.status(400).json(galat);
    return;
  }

  if (errObj.type === "entity.too.large" || errObj.status === 413) {
    const galat: GalatApi = {
      kode: "MUATAN_TERLALU_BESAR",
      pesan: "Ukuran data yang dikirim melebihi batas.",
    };
    res.status(413).json(galat);
    return;
  }

  // Jangan mencatat isi tubuh permintaan peternak di log; cukup metode dan jalur.
  logger.error({ method: req.method, path: req.path }, "Galat tak terduga di server");

  const galat: GalatApi = {
    kode: "GALAT_SERVER",
    pesan: "Terjadi gangguan di server. Coba lagi sebentar lagi.",
  };
  res.status(500).json(galat);
};
