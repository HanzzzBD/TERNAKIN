import fs from "node:fs";
import path from "node:path";
import { Router, type Express } from "express";
import { URL_UNDUH_ANDROID, type GalatApi, type UnduhanResponse } from "@ternakin/shared";

/**
 * Unduhan APK Android dari server sendiri. Berkas disimpan di luar folder aplikasi
 * (bawaan: <folder database>/unduhan/ternakin.apk) agar tidak terhapus saat deploy, dan dipasang
 * lewat deploy/pasang-apk.sh. Nama berkas tetap; tidak ada path dari klien yang dipakai.
 */
const NAMA_BERKAS_APK = "ternakin.apk";

function lokasiApk(unduhanDir: string | null): string | null {
  return unduhanDir ? path.join(unduhanDir, NAMA_BERKAS_APK) : null;
}

function statApk(unduhanDir: string | null): fs.Stats | null {
  const lokasi = lokasiApk(unduhanDir);
  if (!lokasi) return null;
  try {
    const info = fs.statSync(lokasi);
    return info.isFile() && info.size > 0 ? info : null;
  } catch {
    return null;
  }
}

/** GET /v1/unduhan — apakah APK tersedia, untuk menampilkan tombol unduh di web. */
export function createUnduhanRouter(unduhanDir: string | null): Router {
  const router = Router();
  router.get("/", (_req, res) => {
    const info = statApk(unduhanDir);
    const body: UnduhanResponse = {
      android: {
        tersedia: info !== null,
        url: URL_UNDUH_ANDROID,
        ukuranByte: info?.size ?? null,
        diperbaruiPada: info ? info.mtime.toISOString() : null,
      },
    };
    res.setHeader("Cache-Control", "no-cache");
    res.status(200).json(body);
  });
  return router;
}

/** GET /unduh/ternakin.apk — mengirim APK sebagai lampiran. Dipasang sebelum fallback SPA. */
export function pasangRuteUnduhApk(app: Express, unduhanDir: string | null): void {
  app.get(URL_UNDUH_ANDROID, (_req, res, next) => {
    const lokasi = lokasiApk(unduhanDir);
    if (!lokasi || !statApk(unduhanDir)) {
      const galat: GalatApi = {
        kode: "UNDUHAN_BELUM_ADA",
        pesan: "Aplikasi Android belum tersedia untuk diunduh. Coba lagi nanti.",
      };
      res.status(404).json(galat);
      return;
    }
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    // APK diganti di tempat yang sama setiap rilis: jangan disimpan lama di cache.
    res.setHeader("Cache-Control", "no-cache");
    res.download(lokasi, "Ternakin.apk", (err) => {
      if (err && !res.headersSent) next(err);
    });
  });
}
