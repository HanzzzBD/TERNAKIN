import type { RequestHandler } from "express";
import type { GalatApi } from "@ternakin/shared";
import { ambilPenggunaSesi } from "../lib/pemilik.js";

/**
 * Pembagian peran:
 * - Peternak (dan tamu, sesuai PRD mode tamu) memakai pakan, catatan, dan toko.
 * - Kokok wajib masuk (peternak maupun pengguna); tamu tidak bisa bertanya ke Kokok.
 * - Pengguna hanya memakai Kokok dan investasi.
 */

/** Menolak akun berperan "pengguna" dari fitur khusus peternak. Tamu tetap boleh. */
export const tolakPeranPengguna: RequestHandler = (_req, res, next) => {
  if (ambilPenggunaSesi(res)?.peran === "pengguna") {
    const galat: GalatApi = {
      kode: "KHUSUS_PETERNAK",
      pesan:
        "Fitur ini khusus peternak. Bila Anda juga beternak, ganti peran ke Peternak di halaman Profil.",
    };
    res.status(403).json(galat);
    return;
  }
  next();
};

/** Mewajibkan sudah masuk (peran apa pun, termasuk akun demo). Tamu mendapat 401 BELUM_MASUK. */
export function wajibMasuk(pesan: string): RequestHandler {
  return (_req, res, next) => {
    if (!ambilPenggunaSesi(res)) {
      const galat: GalatApi = { kode: "BELUM_MASUK", pesan };
      res.status(401).json(galat);
      return;
    }
    next();
  };
}

/** Mewajibkan sudah masuk dengan peran tertentu. */
export function wajibPeran(peran: "peternak" | "pengguna"): RequestHandler {
  return (_req, res, next) => {
    const pengguna = ambilPenggunaSesi(res);
    if (!pengguna) {
      const galat: GalatApi = {
        kode: "BELUM_MASUK",
        pesan:
          peran === "pengguna"
            ? "Masuk sebagai Pengguna untuk mencatat minat titip modal."
            : "Masuk sebagai Peternak untuk mengelola peluang kandang Anda.",
      };
      res.status(401).json(galat);
      return;
    }
    if (pengguna.peran !== peran) {
      const galat: GalatApi = {
        kode: "PERAN_TIDAK_SESUAI",
        pesan:
          peran === "pengguna"
            ? "Titip modal hanya untuk akun berperan Pengguna. Ganti peran di halaman Profil."
            : "Fitur ini hanya untuk akun berperan Peternak. Ganti peran di halaman Profil.",
      };
      res.status(403).json(galat);
      return;
    }
    next();
  };
}
