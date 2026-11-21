import type { Response } from "express";
import type Database from "better-sqlite3";
import { samarkanNomorPonsel, type PenggunaSaya, type SesiAkunResponse } from "@ternakin/shared";
import { buatSesi, hapusSesi, pindahkanDataTamu } from "../db/akunRepo.js";
import { samarkanEmail } from "../db/emailRepo.js";
import { setelCookieSesi, type OpsiCookieSesi } from "../middleware/sesi.js";
import { logger } from "./logger.js";
import { bersihkanPerangkatId, type PenggunaSesi } from "./pemilik.js";

export function keSaya(p: PenggunaSesi): PenggunaSaya {
  return {
    id: p.id,
    nomorTersamar: p.nomorPonsel ? samarkanNomorPonsel(p.nomorPonsel) : "",
    nama: p.nama,
    emailTersamar: p.email ? samarkanEmail(p.email) : "",
    peran: p.peran,
    isDemo: p.isDemo,
  };
}

/**
 * Langkah akhir semua cara masuk (WhatsApp, email, Google, demo): pindahkan data tamu
 * perangkat ke akun (kecuali akun demo bersama), ganti sesi lama, pasang cookie, kirim respons.
 */
export function selesaikanMasuk(
  db: Database.Database,
  res: Response,
  pengguna: PenggunaSesi,
  opsi: { perangkatIdMentah?: unknown; cookie: OpsiCookieSesi; rute: string },
): void {
  const perangkatId = bersihkanPerangkatId(opsi.perangkatIdMentah);
  const kandangDipindahkan =
    perangkatId && !pengguna.isDemo ? pindahkanDataTamu(db, perangkatId, pengguna.id) : 0;

  const tokenLama = res.locals.tokenSesi as string | undefined;
  if (tokenLama) hapusSesi(db, tokenLama);
  setelCookieSesi(res, buatSesi(db, pengguna.id, opsi.cookie.durasiMs), opsi.cookie);

  logger.info({ rute: opsi.rute, pengguna: pengguna.id, kandangDipindahkan }, "Pengguna masuk");
  const respons: SesiAkunResponse = { pengguna: keSaya(pengguna), kandangDipindahkan };
  res.status(200).json(respons);
}
