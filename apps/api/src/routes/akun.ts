import { Router } from "express";
import type { GalatApi } from "@ternakin/shared";
import { hapusAkun } from "../db/akunRepo.js";
import { deleteAllDataByDevice } from "../db/catatanRepo.js";
import type { DatabaseContext } from "../db/database.js";
import { logger } from "../lib/logger.js";
import { ambilPenggunaSesi, bersihkanPerangkatId } from "../lib/pemilik.js";
import { hapusCookieSesi, type OpsiCookieSesi } from "../middleware/sesi.js";

export interface AkunRouterDeps {
  dbCtx: DatabaseContext;
  cookie: OpsiCookieSesi;
}

export function createAkunRouter(deps: AkunRouterDeps): Router {
  const router = Router();

  // Sesuai SDD: DELETE /v1/akun — menghapus seluruh data akun atau mode tamu (deviceId).
  router.delete("/", (req, res) => {
    const bodyObj =
      typeof req.body === "object" && req.body !== null
        ? (req.body as { perangkatId?: unknown })
        : {};
    const perangkatId =
      bersihkanPerangkatId(bodyObj.perangkatId) ??
      bersihkanPerangkatId(req.query.perangkatId) ??
      bersihkanPerangkatId(req.header("x-device-id"));

    const pengguna = ambilPenggunaSesi(res);
    if (pengguna?.isDemo) {
      const galat: GalatApi = {
        kode: "AKUN_DEMO",
        pesan:
          "Akun demo dipakai bersama dan tidak bisa dihapus. Keluar dari akun demo lebih dulu.",
      };
      res.status(403).json(galat);
      return;
    }
    if (pengguna) {
      hapusAkun(deps.dbCtx.db, pengguna.id);
      // Data tamu perangkat ini (bila masih ada sisa) ikut dihapus.
      if (perangkatId) deleteAllDataByDevice(deps.dbCtx.db, perangkatId);
      hapusCookieSesi(res, deps.cookie);
      logger.info(
        { rute: "/v1/akun" },
        "Akun dan seluruh datanya dihapus atas permintaan pengguna",
      );
      res
        .status(200)
        .json({ ok: true, pesan: "Akun dan seluruh data Anda di server telah dihapus." });
      return;
    }

    if (!perangkatId) {
      const galat: GalatApi = {
        kode: "PERANGKAT_TIDAK_ADA",
        pesan: "Identitas perangkat diperlukan untuk menghapus data Anda.",
      };
      res.status(400).json(galat);
      return;
    }

    deleteAllDataByDevice(deps.dbCtx.db, perangkatId);
    logger.info({ rute: "/v1/akun" }, "Data perangkat dihapus atas permintaan pengguna");

    res.status(200).json({
      ok: true,
      pesan: "Seluruh data Anda di server telah dihapus.",
    });
  });

  return router;
}
