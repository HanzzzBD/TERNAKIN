import { Router } from "express";
import { z } from "zod";
import {
  komposisiRujukanItemSchema,
  rankStores,
  type KomposisiRujukanItem,
} from "@ternakin/shared";
import type { DatabaseContext } from "../db/database.js";
import { listTokoWithPrices } from "../db/tokoRepo.js";

function parseKomposisiQuery(rawKomposisi: unknown, rawBahan: unknown): KomposisiRujukanItem[] {
  if (typeof rawKomposisi === "string" && rawKomposisi.trim().length > 0) {
    try {
      const parsed = z.array(komposisiRujukanItemSchema).safeParse(JSON.parse(rawKomposisi));
      if (parsed.success) return parsed.data;
    } catch {
      // Abaikan JSON rusak dan lanjut coba parameter bahan
    }
  }

  // Format ringkas: ?bahan=jagung_kuning:50,dedak_padi:20,konsentrat_petelur:30
  if (typeof rawBahan === "string" && rawBahan.trim().length > 0) {
    const hasil: KomposisiRujukanItem[] = [];
    for (const seg of rawBahan.split(",")) {
      const [id, kgStr] = seg.split(":");
      const kg = Number(kgStr);
      if (id && id.trim() && Number.isFinite(kg) && kg > 0 && kg <= 100) {
        hasil.push({ bahanId: id.trim(), kgPer100Kg: kg });
      }
    }
    return hasil;
  }

  return [];
}

export interface TokoRouterDeps {
  dbCtx: DatabaseContext;
  staleDays: number;
}

export function createTokoRouter(deps: TokoRouterDeps): Router {
  const router = Router();

  // Tambahan di luar SDD (disetujui tim): GET /v1/toko — daftar toko + harga untuk cache offline.
  router.get("/", (_req, res) => {
    const toko = listTokoWithPrices(deps.dbCtx.db);
    res.setHeader("Cache-Control", "public, max-age=120");
    res.status(200).json({
      staleDays: deps.staleDays,
      diambilPada: new Date().toISOString(),
      toko,
    });
  });

  // Sesuai SDD: GET /v1/toko/rujukan — toko berurut murni menurut total biaya untuk suatu campuran.
  router.get("/rujukan", (req, res) => {
    const komposisi = parseKomposisiQuery(req.query.komposisi, req.query.bahan);
    const tokoList = listTokoWithPrices(deps.dbCtx.db);
    const terurut = rankStores({
      tokoList,
      komposisi,
      staleDays: deps.staleDays,
    });

    res.status(200).json({
      staleDays: deps.staleDays,
      diambilPada: new Date().toISOString(),
      toko: terurut,
    });
  });

  return router;
}
