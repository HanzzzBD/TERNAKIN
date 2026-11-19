import crypto from "node:crypto";
import type { RequestHandler } from "express";
import type { GalatApi } from "@ternakin/shared";

function sha256Buffer(nilai: string): Buffer {
  return crypto.createHash("sha256").update(nilai).digest();
}

/**
 * Memeriksa header X-Admin-Key menggunakan crypto.timingSafeEqual
 * agar perbandingan kunci tahan terhadap timing attack.
 */
export function requireAdminKey(expectedKey: string): RequestHandler {
  return (req, res, next) => {
    const provided = req.header("x-admin-key") ?? "";

    if (!expectedKey || !provided) {
      const galat: GalatApi = {
        kode: "TIDAK_TEROTORISASI",
        pesan: "Kunci admin diperlukan untuk mengakses rute ini.",
      };
      res.status(401).json(galat);
      return;
    }

    const expectedBuf = sha256Buffer(expectedKey);
    const providedBuf = sha256Buffer(provided);
    if (!crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      const galat: GalatApi = {
        kode: "AKSES_DITOLAK",
        pesan: "Kunci admin tidak cocok.",
      };
      res.status(403).json(galat);
      return;
    }

    next();
  };
}
