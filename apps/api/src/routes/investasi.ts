import { Router } from "express";
import {
  ajuanPeluangRequestSchema,
  formatRupiah,
  izinDataRequestSchema,
  minatInvestasiRequestSchema,
  type AjuanPeluangRequest,
  type GalatApi,
  type IzinDataRequest,
  type MinatInvestasiRequest,
} from "@ternakin/shared";
import type { DatabaseContext } from "../db/database.js";
import {
  aturIzinData,
  buatAjuanPeluang,
  catatMinat,
  getPeluang,
  listMinatSaya,
  listPeluang,
} from "../db/investasiRepo.js";
import { logger } from "../lib/logger.js";
import { ambilPenggunaSesi, type PenggunaSesi } from "../lib/pemilik.js";
import { wajibPeran } from "../middleware/peran.js";
import { validate } from "../middleware/validate.js";

/**
 * Modul 5 — Investasi ternak (SIMULASI, tanpa uang sungguhan).
 * Daftar peluang terbuka untuk dilihat siapa saja; mencatat minat hanya untuk Pengguna,
 * mengajukan peluang dan mengatur izin data hanya untuk Peternak pemiliknya.
 */
export function createInvestasiRouter(dbCtx: DatabaseContext): Router {
  const router = Router();
  const { db } = dbCtx;

  const galat = (kode: string, pesan: string): GalatApi => ({ kode, pesan });

  router.get("/peluang", (_req, res) => {
    const pengguna = ambilPenggunaSesi(res);
    res.status(200).json({ peluang: listPeluang(db, pengguna?.id ?? null) });
  });

  router.get("/peluang/:id", (req, res) => {
    const pengguna = ambilPenggunaSesi(res);
    const peluang = getPeluang(db, String(req.params.id), pengguna?.id ?? null);
    if (!peluang) {
      res.status(404).json(galat("TIDAK_DITEMUKAN", "Peluang tidak ditemukan."));
      return;
    }
    res.status(200).json({ peluang });
  });

  router.post(
    "/peluang",
    wajibPeran("peternak"),
    validate(ajuanPeluangRequestSchema),
    (req, res) => {
      const pengguna = ambilPenggunaSesi(res) as PenggunaSesi;
      const body = req.body as AjuanPeluangRequest;
      if (!pengguna.nama) {
        db.prepare("UPDATE pengguna SET nama = ? WHERE id = ?").run(body.namaPeternak, pengguna.id);
      }
      const id = buatAjuanPeluang(db, pengguna.id, body.namaPeternak, body);
      logger.info({ rute: "/v1/investasi/peluang", pengguna: pengguna.id }, "Ajuan peluang dibuat");
      res.status(201).json({ peluang: getPeluang(db, id, pengguna.id) });
    },
  );

  router.put(
    "/peluang/:id/izin",
    wajibPeran("peternak"),
    validate(izinDataRequestSchema),
    (req, res) => {
      const pengguna = ambilPenggunaSesi(res) as PenggunaSesi;
      const body = req.body as IzinDataRequest;
      if (!aturIzinData(db, String(req.params.id), pengguna.id, body.izinData)) {
        res
          .status(404)
          .json(galat("TIDAK_DITEMUKAN", "Peluang tidak ditemukan atau bukan milik Anda."));
        return;
      }
      res.status(200).json({ peluang: getPeluang(db, String(req.params.id), pengguna.id) });
    },
  );

  router.post(
    "/peluang/:id/minat",
    wajibPeran("pengguna"),
    validate(minatInvestasiRequestSchema),
    (req, res) => {
      const pengguna = ambilPenggunaSesi(res) as PenggunaSesi;
      const body = req.body as MinatInvestasiRequest;
      const hasil = catatMinat(db, String(req.params.id), pengguna.id, body.nominal);

      if (!hasil.ok) {
        const pesan: Record<typeof hasil.kode, [number, string]> = {
          TIDAK_DITEMUKAN: [404, "Peluang tidak ditemukan."],
          BELUM_DIBUKA: [409, "Peluang ini sedang tidak menerima modal."],
          MILIK_SENDIRI: [409, "Anda tidak bisa menitipkan modal ke kandang sendiri."],
          DI_BAWAH_MINIMAL: [400, `Minimal titip ${formatRupiah(hasil.minimal ?? 0)}.`],
          MELEBIHI_SISA: [400, `Melebihi sisa kebutuhan modal (${formatRupiah(hasil.sisa ?? 0)}).`],
        };
        const [status, teks] = pesan[hasil.kode];
        res.status(status).json(galat(hasil.kode, teks));
        return;
      }

      res.status(201).json({ peluang: hasil.peluang });
    },
  );

  router.get("/minat-saya", wajibPeran("pengguna"), (_req, res) => {
    const pengguna = ambilPenggunaSesi(res) as PenggunaSesi;
    res.status(200).json({ minat: listMinatSaya(db, pengguna.id) });
  });

  return router;
}
