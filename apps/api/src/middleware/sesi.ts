import type { CookieOptions, Request, RequestHandler, Response } from "express";
import type Database from "better-sqlite3";
import { cariPenggunaDariToken } from "../db/akunRepo.js";

export const NAMA_COOKIE_SESI = "tk_sesi";

/** Membaca satu cookie dari header tanpa dependensi tambahan. */
export function bacaCookie(req: Request, nama: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const bagian of header.split(";")) {
    const idx = bagian.indexOf("=");
    if (idx < 0) continue;
    if (bagian.slice(0, idx).trim() !== nama) continue;
    const nilai = bagian.slice(idx + 1).trim();
    try {
      return decodeURIComponent(nilai) || null;
    } catch {
      return null;
    }
  }
  return null;
}

export interface OpsiCookieSesi {
  aman: boolean;
  durasiMs: number;
}

function opsiCookie(opsi: OpsiCookieSesi): CookieOptions {
  return {
    httpOnly: true,
    secure: opsi.aman,
    sameSite: "lax",
    path: "/",
  };
}

export function setelCookieSesi(res: Response, token: string, opsi: OpsiCookieSesi): void {
  res.cookie(NAMA_COOKIE_SESI, token, { ...opsiCookie(opsi), maxAge: opsi.durasiMs });
}

export function hapusCookieSesi(res: Response, opsi: OpsiCookieSesi): void {
  res.clearCookie(NAMA_COOKIE_SESI, opsiCookie(opsi));
}

/**
 * Memuat pengguna dari cookie sesi bila ada dan masih berlaku. Tidak pernah menolak permintaan:
 * tanpa sesi, permintaan diperlakukan sebagai mode tamu.
 */
export function muatSesi(db: Database.Database): RequestHandler {
  return (req, res, next) => {
    const token = bacaCookie(req, NAMA_COOKIE_SESI);
    if (token) {
      const pengguna = cariPenggunaDariToken(db, token);
      if (pengguna) {
        res.locals.pengguna = pengguna;
        res.locals.tokenSesi = token;
      }
    }
    next();
  };
}
