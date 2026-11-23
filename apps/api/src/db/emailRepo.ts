import crypto from "node:crypto";
import type { Database } from "./sqlite.js";
import {
  JEDA_KIRIM_ULANG_MS,
  MAKS_OTP_PER_JAM,
  MAKS_PERCOBAAN_OTP,
  aturPeranAkun,
  cariPengguna,
  hashKodeOtp,
  type HasilVerifikasiOtp,
} from "./akunRepo.js";
import type { PenggunaSesi } from "../lib/pemilik.js";

/** Kode email (verifikasi alamat & reset sandi), mengikuti aturan yang sama dengan OTP WhatsApp. */
export type TujuanKodeEmail = "verifikasi" | "reset";

export function normalisasiEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Menyamarkan email untuk ditampilkan: budi.santoso@gmail.com → bu***@gmail.com */
export function samarkanEmail(email: string): string {
  const [nama, domain] = email.split("@");
  if (!nama || !domain) return email;
  return `${nama.slice(0, 2)}***@${domain}`;
}

function kunciKode(tujuan: TujuanKodeEmail, email: string): string {
  return `${tujuan}:${email}`;
}

export function detikTungguKodeEmail(
  db: Database,
  email: string,
  tujuan: TujuanKodeEmail,
  sekarang = Date.now(),
): number {
  const sejamLalu = new Date(sekarang - 60 * 60 * 1000).toISOString();
  const rows = db
    .prepare(
      `SELECT dibuat_pada FROM kode_email WHERE email = ? AND tujuan = ? AND dibuat_pada >= ?
       ORDER BY dibuat_pada DESC`,
    )
    .all(email, tujuan, sejamLalu) as Array<{ dibuat_pada: string }>;

  const terbaru = rows[0];
  if (terbaru) {
    const sisa = Date.parse(terbaru.dibuat_pada) + JEDA_KIRIM_ULANG_MS - sekarang;
    if (sisa > 0) return Math.ceil(sisa / 1000);
  }
  if (rows.length >= MAKS_OTP_PER_JAM) {
    const tertua = rows[rows.length - 1];
    const sisa = Date.parse(tertua?.dibuat_pada ?? "") + 60 * 60 * 1000 - sekarang;
    return Math.max(1, Math.ceil(sisa / 1000));
  }
  return 0;
}

export function simpanKodeEmail(
  db: Database,
  rahasia: string,
  email: string,
  tujuan: TujuanKodeEmail,
  kode: string,
  berlakuMs: number,
): number {
  const sekarang = Date.now();
  return db.transaction(() => {
    db.prepare(
      "UPDATE kode_email SET terpakai = 1 WHERE email = ? AND tujuan = ? AND terpakai = 0",
    ).run(email, tujuan);
    const info = db
      .prepare(
        `INSERT INTO kode_email (email, tujuan, kode_hash, kedaluwarsa_pada, dibuat_pada)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        email,
        tujuan,
        hashKodeOtp(rahasia, kunciKode(tujuan, email), kode),
        new Date(sekarang + berlakuMs).toISOString(),
        new Date(sekarang).toISOString(),
      );
    return Number(info.lastInsertRowid);
  })();
}

export function batalkanKodeEmail(db: Database, id: number): void {
  db.prepare("DELETE FROM kode_email WHERE id = ?").run(id);
}

export function verifikasiKodeEmail(
  db: Database,
  rahasia: string,
  email: string,
  tujuan: TujuanKodeEmail,
  kode: string,
): HasilVerifikasiOtp {
  const row = db
    .prepare(
      `SELECT id, kode_hash, percobaan FROM kode_email
       WHERE email = ? AND tujuan = ? AND terpakai = 0 AND kedaluwarsa_pada > ?
       ORDER BY dibuat_pada DESC LIMIT 1`,
    )
    .get(email, tujuan, new Date().toISOString()) as
    { id: number; kode_hash: string; percobaan: number } | undefined;

  if (!row) return "tidak_ada";
  if (row.percobaan >= MAKS_PERCOBAAN_OTP) return "terlalu_banyak";

  const harapan = Buffer.from(row.kode_hash, "hex");
  const masukan = Buffer.from(hashKodeOtp(rahasia, kunciKode(tujuan, email), kode), "hex");
  if (harapan.length === masukan.length && crypto.timingSafeEqual(harapan, masukan)) {
    db.prepare("UPDATE kode_email SET terpakai = 1 WHERE id = ?").run(row.id);
    return "cocok";
  }

  const percobaan = row.percobaan + 1;
  db.prepare("UPDATE kode_email SET percobaan = ?, terpakai = ? WHERE id = ?").run(
    percobaan,
    percobaan >= MAKS_PERCOBAAN_OTP ? 1 : 0,
    row.id,
  );
  return percobaan >= MAKS_PERCOBAAN_OTP ? "terlalu_banyak" : "salah";
}

export interface AkunEmail {
  id: string;
  sandiHash: string | null;
  terverifikasi: boolean;
  isDemo: boolean;
}

export function cariAkunEmail(db: Database, email: string): AkunEmail | null {
  const row = db
    .prepare("SELECT id, sandi_hash, email_terverifikasi, is_demo FROM pengguna WHERE email = ?")
    .get(email) as
    | { id: string; sandi_hash: string | null; email_terverifikasi: number; is_demo: number }
    | undefined;
  return row
    ? {
        id: row.id,
        sandiHash: row.sandi_hash,
        terverifikasi: row.email_terverifikasi === 1,
        isDemo: row.is_demo === 1,
      }
    : null;
}

/** Membuat akun email baru (belum terverifikasi), atau memperbarui akun yang belum diverifikasi. */
export function simpanPendaftaranEmail(
  db: Database,
  data: { nama: string; email: string; sandiHash: string; peran: "peternak" | "pengguna" },
): string {
  const ada = cariAkunEmail(db, data.email);
  if (ada) {
    db.prepare("UPDATE pengguna SET nama = ?, sandi_hash = ?, peran_akun = ? WHERE id = ?").run(
      data.nama,
      data.sandiHash,
      data.peran,
      ada.id,
    );
    return ada.id;
  }
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO pengguna (id, nomor_ponsel, peran, peran_akun, nama, is_demo, email, sandi_hash,
       email_terverifikasi, dibuat_pada)
     VALUES (?, NULL, 'peternak', ?, ?, 0, ?, ?, 0, ?)`,
  ).run(id, data.peran, data.nama, data.email, data.sandiHash, new Date().toISOString());
  return id;
}

export function tandaiEmailTerverifikasi(db: Database, penggunaId: string): void {
  db.prepare("UPDATE pengguna SET email_terverifikasi = 1 WHERE id = ?").run(penggunaId);
}

export function gantiSandi(db: Database, penggunaId: string, sandiHash: string): void {
  db.prepare("UPDATE pengguna SET sandi_hash = ?, email_terverifikasi = 1 WHERE id = ?").run(
    sandiHash,
    penggunaId,
  );
}

/**
 * Masuk dengan Google: cari berdasarkan google_sub, lalu tautkan ke akun email yang sama bila
 * ada (Google sudah memverifikasi email), atau buat akun baru.
 */
export function cariAtauBuatPenggunaGoogle(
  db: Database,
  profil: { sub: string; email: string; nama: string | null },
  peranDipilih?: "peternak" | "pengguna",
): PenggunaSesi {
  const lewatSub = db.prepare("SELECT id FROM pengguna WHERE google_sub = ?").get(profil.sub) as
    { id: string } | undefined;
  let id = lewatSub?.id;

  if (!id) {
    const lewatEmail = cariAkunEmail(db, profil.email);
    if (lewatEmail) {
      id = lewatEmail.id;
      // Bila akun email itu belum terverifikasi, sandinya bisa saja dibuat orang lain yang
      // mendaftar memakai email ini: sandi dihapus agar akun tidak bisa diambil alih.
      db.prepare(
        `UPDATE pengguna SET google_sub = ?,
           sandi_hash = CASE WHEN email_terverifikasi = 1 THEN sandi_hash ELSE NULL END,
           email_terverifikasi = 1, nama = COALESCE(nama, ?)
         WHERE id = ?`,
      ).run(profil.sub, profil.nama, id);
    } else {
      id = crypto.randomUUID();
      db.prepare(
        `INSERT INTO pengguna (id, nomor_ponsel, peran, peran_akun, nama, is_demo, email,
           email_terverifikasi, google_sub, dibuat_pada)
         VALUES (?, NULL, 'peternak', ?, ?, 0, ?, 1, ?, ?)`,
      ).run(
        id,
        peranDipilih ?? null,
        profil.nama,
        profil.email,
        profil.sub,
        new Date().toISOString(),
      );
    }
  }

  const pengguna = cariPengguna(db, id);
  if (!pengguna) throw new Error("Akun Google tidak ditemukan setelah disimpan.");
  if (!pengguna.peran && peranDipilih) {
    aturPeranAkun(db, pengguna.id, peranDipilih);
    return { ...pengguna, peran: peranDipilih };
  }
  return pengguna;
}
