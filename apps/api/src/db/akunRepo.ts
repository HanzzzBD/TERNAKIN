import crypto from "node:crypto";
import type Database from "better-sqlite3";
import { kunciAkun, type PenggunaSesi } from "../lib/pemilik.js";
import { deleteAllDataByDevice } from "./catatanRepo.js";

/** Batas permintaan OTP per nomor agar kuota Fonnte tidak habis dan nomor orang tidak dibanjiri. */
export const JEDA_KIRIM_ULANG_MS = 60 * 1000;
export const MAKS_OTP_PER_JAM = 5;
export const MAKS_PERCOBAAN_OTP = 5;

export function hashKodeOtp(rahasia: string, nomor: string, kode: string): string {
  return crypto.createHmac("sha256", rahasia).update(`${nomor}:${kode}`).digest("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function samaAman(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export function buatKodeOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Mengembalikan 0 bila boleh mengirim, atau jumlah detik yang harus ditunggu. */
export function detikTungguOtp(
  db: Database.Database,
  nomor: string,
  sekarang = Date.now(),
): number {
  const sejamLalu = new Date(sekarang - 60 * 60 * 1000).toISOString();
  const rows = db
    .prepare(
      `SELECT dibuat_pada FROM otp_permintaan
       WHERE nomor_ponsel = ? AND dibuat_pada >= ?
       ORDER BY dibuat_pada DESC`,
    )
    .all(nomor, sejamLalu) as Array<{ dibuat_pada: string }>;

  const terbaru = rows[0];
  if (terbaru) {
    const sisaJeda = Date.parse(terbaru.dibuat_pada) + JEDA_KIRIM_ULANG_MS - sekarang;
    if (sisaJeda > 0) return Math.ceil(sisaJeda / 1000);
  }

  if (rows.length >= MAKS_OTP_PER_JAM) {
    const tertua = rows[rows.length - 1];
    const sisa = Date.parse(tertua?.dibuat_pada ?? "") + 60 * 60 * 1000 - sekarang;
    return Math.max(1, Math.ceil(sisa / 1000));
  }

  return 0;
}

export function simpanOtp(
  db: Database.Database,
  nomor: string,
  kodeHash: string,
  berlakuMs: number,
  sekarang = Date.now(),
): number {
  const tx = db.transaction(() => {
    // Kode lama untuk nomor yang sama tidak berlaku lagi setelah kode baru dibuat.
    db.prepare(
      "UPDATE otp_permintaan SET terpakai = 1 WHERE nomor_ponsel = ? AND terpakai = 0",
    ).run(nomor);
    const info = db
      .prepare(
        `INSERT INTO otp_permintaan (nomor_ponsel, kode_hash, kedaluwarsa_pada, dibuat_pada)
         VALUES (?, ?, ?, ?)`,
      )
      .run(
        nomor,
        kodeHash,
        new Date(sekarang + berlakuMs).toISOString(),
        new Date(sekarang).toISOString(),
      );
    return Number(info.lastInsertRowid);
  });
  return tx();
}

export function batalkanOtp(db: Database.Database, id: number): void {
  db.prepare("DELETE FROM otp_permintaan WHERE id = ?").run(id);
}

export type HasilVerifikasiOtp = "cocok" | "salah" | "tidak_ada" | "terlalu_banyak";

export function verifikasiOtp(
  db: Database.Database,
  rahasia: string,
  nomor: string,
  kode: string,
  sekarang = Date.now(),
): HasilVerifikasiOtp {
  const row = db
    .prepare(
      `SELECT id, kode_hash, percobaan FROM otp_permintaan
       WHERE nomor_ponsel = ? AND terpakai = 0 AND kedaluwarsa_pada > ?
       ORDER BY dibuat_pada DESC LIMIT 1`,
    )
    .get(nomor, new Date(sekarang).toISOString()) as
    { id: number; kode_hash: string; percobaan: number } | undefined;

  if (!row) return "tidak_ada";
  if (row.percobaan >= MAKS_PERCOBAAN_OTP) return "terlalu_banyak";

  if (samaAman(row.kode_hash, hashKodeOtp(rahasia, nomor, kode))) {
    db.prepare("UPDATE otp_permintaan SET terpakai = 1 WHERE id = ?").run(row.id);
    return "cocok";
  }

  const percobaanBaru = row.percobaan + 1;
  db.prepare("UPDATE otp_permintaan SET percobaan = ?, terpakai = ? WHERE id = ?").run(
    percobaanBaru,
    percobaanBaru >= MAKS_PERCOBAAN_OTP ? 1 : 0,
    row.id,
  );
  return percobaanBaru >= MAKS_PERCOBAAN_OTP ? "terlalu_banyak" : "salah";
}

interface PenggunaRow {
  id: string;
  nomor_ponsel: string | null;
  peran_akun: string | null;
  nama: string | null;
  is_demo: number;
  email: string | null;
}

const KOLOM_PENGGUNA = "p.id, p.nomor_ponsel, p.peran_akun, p.nama, p.is_demo, p.email";

function petakanPengguna(row: PenggunaRow): PenggunaSesi {
  const peran =
    row.peran_akun === "peternak" || row.peran_akun === "pengguna" ? row.peran_akun : null;
  return {
    id: row.id,
    nomorPonsel: row.nomor_ponsel,
    peran,
    nama: row.nama,
    email: row.email,
    isDemo: row.is_demo === 1,
  };
}

export function cariPengguna(db: Database.Database, id: string): PenggunaSesi | null {
  const row = db.prepare(`SELECT ${KOLOM_PENGGUNA} FROM pengguna p WHERE p.id = ?`).get(id) as
    PenggunaRow | undefined;
  return row ? petakanPengguna(row) : null;
}

/** Menetapkan peran aplikasi akun (dipilih saat masuk atau diganti dari Profil). */
export function aturPeranAkun(
  db: Database.Database,
  penggunaId: string,
  peran: "peternak" | "pengguna",
): void {
  db.prepare("UPDATE pengguna SET peran_akun = ? WHERE id = ?").run(peran, penggunaId);
}

/**
 * Mencari akun berdasarkan nomor, atau membuatnya. Peran yang dipilih saat masuk hanya diterapkan
 * bila akun belum punya peran (peran yang sudah ada diganti lewat Profil, bukan lewat login).
 */
export function cariAtauBuatPengguna(
  db: Database.Database,
  nomor: string,
  peranDipilih?: "peternak" | "pengguna",
): PenggunaSesi {
  const ada = db
    .prepare(`SELECT ${KOLOM_PENGGUNA} FROM pengguna p WHERE p.nomor_ponsel = ?`)
    .get(nomor) as PenggunaRow | undefined;
  if (ada) {
    const pengguna = petakanPengguna(ada);
    if (!pengguna.peran && peranDipilih) {
      aturPeranAkun(db, pengguna.id, peranDipilih);
      return { ...pengguna, peran: peranDipilih };
    }
    return pengguna;
  }

  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO pengguna (id, nomor_ponsel, peran, peran_akun, is_demo, dibuat_pada) VALUES (?, ?, 'peternak', ?, 0, ?)",
  ).run(id, nomor, peranDipilih ?? null, new Date().toISOString());
  return {
    id,
    nomorPonsel: nomor,
    peran: peranDipilih ?? null,
    nama: null,
    email: null,
    isDemo: false,
  };
}

export function buatSesi(
  db: Database.Database,
  penggunaId: string,
  durasiMs: number,
  sekarang = Date.now(),
): string {
  const token = crypto.randomBytes(32).toString("base64url");
  db.prepare(
    "INSERT INTO sesi (token_hash, pengguna_id, dibuat_pada, kedaluwarsa_pada) VALUES (?, ?, ?, ?)",
  ).run(
    hashToken(token),
    penggunaId,
    new Date(sekarang).toISOString(),
    new Date(sekarang + durasiMs).toISOString(),
  );
  return token;
}

export function cariPenggunaDariToken(
  db: Database.Database,
  token: string,
  sekarang = Date.now(),
): PenggunaSesi | null {
  const row = db
    .prepare(
      `SELECT ${KOLOM_PENGGUNA}, s.kedaluwarsa_pada FROM sesi s
       INNER JOIN pengguna p ON p.id = s.pengguna_id
       WHERE s.token_hash = ?`,
    )
    .get(hashToken(token)) as (PenggunaRow & { kedaluwarsa_pada: string }) | undefined;

  if (!row) return null;
  if (row.kedaluwarsa_pada <= new Date(sekarang).toISOString()) {
    hapusSesi(db, token);
    return null;
  }
  return petakanPengguna(row);
}

export function hapusSesi(db: Database.Database, token: string): void {
  db.prepare("DELETE FROM sesi WHERE token_hash = ?").run(hashToken(token));
}

/**
 * Memindahkan seluruh data mode tamu (per perangkat) ke akun. Riwayat pemakaian LLM ikut
 * dipindah agar batas harian tidak bisa dilewati dengan cara masuk akun.
 */
export function pindahkanDataTamu(
  db: Database.Database,
  perangkatId: string,
  penggunaId: string,
): number {
  const kunci = kunciAkun(penggunaId);
  const tx = db.transaction(() => {
    const kandang = db
      .prepare("UPDATE kandang SET perangkat_id = ?, pengguna_id = ? WHERE perangkat_id = ?")
      .run(kunci, penggunaId, perangkatId);
    db.prepare(
      "UPDATE percakapan_kokok SET perangkat_id = ?, pengguna_id = ? WHERE perangkat_id = ?",
    ).run(kunci, penggunaId, perangkatId);
    for (const tabel of ["lead", "pemakaian_llm", "outbox_diproses"]) {
      db.prepare(`UPDATE ${tabel} SET perangkat_id = ? WHERE perangkat_id = ?`).run(
        kunci,
        perangkatId,
      );
    }
    return kandang.changes;
  });
  return tx();
}

/** Menghapus akun beserta seluruh datanya (DELETE /v1/akun saat sudah masuk). */
export function hapusAkun(db: Database.Database, penggunaId: string): void {
  const tx = db.transaction(() => {
    deleteAllDataByDevice(db, kunciAkun(penggunaId));
    db.prepare("DELETE FROM kandang WHERE pengguna_id = ?").run(penggunaId);
    db.prepare("DELETE FROM percakapan_kokok WHERE pengguna_id = ?").run(penggunaId);
    db.prepare(
      "DELETE FROM otp_permintaan WHERE nomor_ponsel IN (SELECT nomor_ponsel FROM pengguna WHERE id = ?)",
    ).run(penggunaId);
    db.prepare(
      "DELETE FROM kode_email WHERE email IN (SELECT email FROM pengguna WHERE id = ? AND email IS NOT NULL)",
    ).run(penggunaId);
    db.prepare("DELETE FROM pengguna WHERE id = ?").run(penggunaId);
  });
  tx();
}
