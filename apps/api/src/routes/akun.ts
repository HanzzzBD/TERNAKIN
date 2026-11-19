import { Router } from "express";
import type { GalatApi } from "@ternakin/shared";
import { deleteAllDataByDevice } from "../db/catatanRepo.js";
import type { DatabaseContext } from "../db/database.js";
import { logger } from "../lib/logger.js";

export function createAkunRouter(dbCtx: DatabaseContext): Router {
  const router = Router();

  // Sesuai SDD: DELETE /v1/akun — menghapus seluruh data akun atau mode tamu (deviceId).
  router.delete("/", (req, res) => {
    const bodyObj =
      typeof req.body === "object" && req.body !== null
        ? (req.body as { perangkatId?: unknown })
        : {};
    const dariBody = typeof bodyObj.perangkatId === "string" ? bodyObj.perangkatId : undefined;
    const dariQuery = typeof req.query.perangkatId === "string" ? req.query.perangkatId : undefined;
    const dariHeader = req.header("x-device-id");
    const perangkatId = (dariBody ?? dariQuery ?? dariHeader)?.trim();

    if (!perangkatId) {
      const galat: GalatApi = {
        kode: "PERANGKAT_TIDAK_ADA",
        pesan: "Identitas perangkat diperlukan untuk menghapus data Anda.",
      };
      res.status(400).json(galat);
      return;
    }

    deleteAllDataByDevice(dbCtx.db, perangkatId);
    logger.info({ rute: "/v1/akun" }, "Data perangkat dihapus atas permintaan pengguna");

    res.status(200).json({
      ok: true,
      pesan: "Seluruh data Anda di server telah dihapus.",
    });
  });

  return router;
}
