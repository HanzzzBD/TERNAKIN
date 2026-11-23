import type { CookieOptions, Request, RequestHandler, Response } from "express";
import type { Database } from "../db/sqlite.js";
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

/** Token sesi dari header Authorization: Bearer (dipakai aplikasi mobile). */
export function bacaBearer(req: Request): string | null {
  const nilai = req.header("authorization");
  const cocok = nilai ? /^Bearer\s+([A-Za-z0-9_-]{20,200})$/.exec(nilai.trim()) : null;
  return cocok?.[1] ?? null;
}

/** Aplikasi mobile menandai dirinya agar token sesi dikembalikan di body respons masuk. */
export function klienMobile(req: Request): boolean {
  return req.header("x-ternakin-klien") === "mobile";
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
export function muatSesi(db: Database): RequestHandler {
  return (req, res, next) => {
    // Web memakai cookie HttpOnly; aplikasi mobile (native) mengirim token sebagai Bearer.
    const token = bacaCookie(req, NAMA_COOKIE_SESI) ?? bacaBearer(req);
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
