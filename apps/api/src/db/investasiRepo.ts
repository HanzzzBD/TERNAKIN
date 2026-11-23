import crypto from "node:crypto";
import fs from "node:fs";
import type { Database } from "./sqlite.js";
import { z } from "zod";
import {
  pemeriksaanDokterSchema,
  siklusLaluSchema,
  statusPeluangSchema,
  titikCatatanSchema,
  type AjuanPeluangRequest,
  type MinatSayaItem,
  type PeluangInvestasi,
} from "@ternakin/shared";
import { hashSandiSync } from "../lib/sandi.js";

/**
 * Modul 5 — Investasi ternak (SIMULASI). Tidak ada uang yang berpindah; minat hanya dicatat.
 * Modal terkumpul = modal awal contoh + jumlah seluruh minat yang tercatat.
 */

const seedPeluangSchema = z.object({
  id: z.string().min(1),
  pemilikDemo: z.string().min(1),
  peternak: z.string().min(1),
  namaKandang: z.string().min(1),
  kecamatan: z.string().min(1),
  wilayah: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  pengalamanTahun: z.number().int().min(0),
  jumlahEkor: z.number().int().positive(),
  siklusHari: z.number().int().positive(),
  status: statusPeluangSchema,
  hariBerjalan: z.number().int().nullable(),
  kebutuhanModal: z.number().int().positive(),
  modalAwal: z.number().int().min(0),
  minimalTitip: z.number().int().positive(),
  porsiPemodalPersen: z.number(),
  pemeriksaan: pemeriksaanDokterSchema.nullable(),
  siklusLalu: siklusLaluSchema.nullable(),
  catatan: z.array(titikCatatanSchema),
});

/** Akun demo bersama untuk juri: tidak punya nomor ponsel dan tidak bisa dihapus. */
export const AKUN_DEMO_SERVER = {
  pengguna: {
    id: "demo-pengguna",
    nama: "Rani",
    peran: "pengguna" as const,
    email: "pengguna@demo.ternakin.id",
  },
  peternak: {
    id: "demo-peternak",
    nama: "Pak Dedi S.",
    peran: "peternak" as const,
    email: "peternak@demo.ternakin.id",
  },
};

/** Kata sandi akun demo bersama, sengaja ditampilkan di halaman Masuk untuk juri. */
export const SANDI_AKUN_DEMO = "demo1234";

export function seedInvestasi(db: Database, seedPath: string): void {
  if (!fs.existsSync(seedPath)) return;
  const daftar = z.array(seedPeluangSchema).parse(JSON.parse(fs.readFileSync(seedPath, "utf-8")));
  const sekarang = new Date().toISOString();

  const tambahPengguna = db.prepare(
    `INSERT OR IGNORE INTO pengguna (id, nomor_ponsel, peran, peran_akun, nama, is_demo, dibuat_pada)
     VALUES (?, NULL, 'peternak', ?, ?, 1, ?)`,
  );
  const tambahPeluang = db.prepare(
    `INSERT OR IGNORE INTO peluang_investasi
       (id, pengguna_id, peternak, nama_kandang, kecamatan, wilayah, lat, lng, pengalaman_tahun,
        jumlah_ekor, siklus_hari, status, hari_berjalan, kebutuhan_modal, modal_awal, minimal_titip,
        porsi_pemodal_persen, rencana_mulai, pemeriksaan_json, siklus_lalu_json, catatan_json,
        izin_data, is_demo, dibuat_pada, diubah_pada)
     VALUES (@id, @pemilik, @peternak, @namaKandang, @kecamatan, @wilayah, @lat, @lng,
        @pengalamanTahun, @jumlahEkor, @siklusHari, @status, @hariBerjalan, @kebutuhanModal,
        @modalAwal, @minimalTitip, @porsiPemodalPersen, NULL, @pemeriksaan, @siklusLalu, @catatan,
        1, 1, @sekarang, @sekarang)`,
  );

  db.transaction(() => {
    for (const akun of Object.values(AKUN_DEMO_SERVER)) {
      tambahPengguna.run(akun.id, akun.peran, akun.nama, sekarang);
      // Email + sandi demo agar juri bisa mengetik di form Masuk; hash dibuat sekali saja.
      const punyaSandi = db
        .prepare("SELECT 1 FROM pengguna WHERE id = ? AND sandi_hash IS NOT NULL")
        .get(akun.id);
      if (!punyaSandi) {
        db.prepare(
          "UPDATE pengguna SET email = ?, sandi_hash = ?, email_terverifikasi = 1 WHERE id = ?",
        ).run(akun.email, hashSandiSync(SANDI_AKUN_DEMO), akun.id);
      }
    }
    for (const p of daftar) {
      tambahPengguna.run(p.pemilikDemo, "peternak", p.peternak, sekarang);
      tambahPeluang.run({
        ...p,
        pemilik: p.pemilikDemo,
        pemeriksaan: p.pemeriksaan ? JSON.stringify(p.pemeriksaan) : null,
        siklusLalu: p.siklusLalu ? JSON.stringify(p.siklusLalu) : null,
        catatan: JSON.stringify(p.catatan),
        sekarang,
      });
    }
  })();
}

interface PeluangRow {
  id: string;
  pengguna_id: string;
  peternak: string;
  nama_kandang: string;
  kecamatan: string;
  wilayah: string;
  lat: number;
  lng: number;
  pengalaman_tahun: number;
  jumlah_ekor: number;
  siklus_hari: number;
  status: PeluangInvestasi["status"];
  hari_berjalan: number | null;
  kebutuhan_modal: number;
  modal_awal: number;
  minimal_titip: number;
  porsi_pemodal_persen: number;
  rencana_mulai: string | null;
  pemeriksaan_json: string | null;
  siklus_lalu_json: string | null;
  catatan_json: string;
  izin_data: number;
  is_demo: number;
  total_minat: number;
  minat_saya: number;
}

function jsonAtauNull<T>(mentah: string | null, schema: z.ZodType<T>): T | null {
  if (!mentah) return null;
  const hasil = schema.safeParse(JSON.parse(mentah));
  return hasil.success ? hasil.data : null;
}

function petakan(row: PeluangRow, penggunaId: string | null): PeluangInvestasi {
  const milikSaya = penggunaId !== null && row.pengguna_id === penggunaId;
  const izinData = row.izin_data === 1;
  return {
    id: row.id,
    peternak: row.peternak,
    namaKandang: row.nama_kandang,
    kecamatan: row.kecamatan,
    wilayah: row.wilayah,
    lat: row.lat,
    lng: row.lng,
    pengalamanTahun: row.pengalaman_tahun,
    jumlahEkor: row.jumlah_ekor,
    siklusHari: row.siklus_hari,
    status: row.status,
    hariBerjalan: row.hari_berjalan,
    kebutuhanModal: row.kebutuhan_modal,
    modalTerkumpul: Math.min(row.kebutuhan_modal, row.modal_awal + row.total_minat),
    minimalTitip: row.minimal_titip,
    porsiPemodalPersen: row.porsi_pemodal_persen,
    rencanaMulai: row.rencana_mulai,
    pemeriksaan: jsonAtauNull(row.pemeriksaan_json, pemeriksaanDokterSchema),
    siklusLalu: jsonAtauNull(row.siklus_lalu_json, siklusLaluSchema),
    // Data catatan hanya dikirim bila diizinkan, atau kepada pemiliknya sendiri.
    catatan:
      izinData || milikSaya
        ? (jsonAtauNull(row.catatan_json, z.array(titikCatatanSchema)) ?? [])
        : [],
    izinData,
    milikSaya,
    minatSaya: row.minat_saya,
    isDemo: row.is_demo === 1,
  };
}

const SELECT_PELUANG = `
  SELECT p.*,
    COALESCE((SELECT SUM(m.nominal) FROM minat_investasi m WHERE m.peluang_id = p.id), 0) AS total_minat,
    COALESCE((SELECT SUM(m.nominal) FROM minat_investasi m
              WHERE m.peluang_id = p.id AND m.pengguna_id = @penggunaId), 0) AS minat_saya
  FROM peluang_investasi p`;

export function listPeluang(db: Database, penggunaId: string | null): PeluangInvestasi[] {
  const rows = db
    .prepare(`${SELECT_PELUANG} ORDER BY p.rowid ASC`)
    .all({ penggunaId: penggunaId ?? "" }) as PeluangRow[];
  return rows.map((r) => petakan(r, penggunaId));
}

export function getPeluang(
  db: Database,
  id: string,
  penggunaId: string | null,
): PeluangInvestasi | null {
  const row = db
    .prepare(`${SELECT_PELUANG} WHERE p.id = @id`)
    .get({ id, penggunaId: penggunaId ?? "" }) as PeluangRow | undefined;
  return row ? petakan(row, penggunaId) : null;
}

/** Peternak mengajukan peluang baru; selalu mulai dari "menunggu-pemeriksaan" dokter hewan. */
export function buatAjuanPeluang(
  db: Database,
  penggunaId: string,
  namaPeternak: string,
  ajuan: AjuanPeluangRequest,
): string {
  const id = `pl-${crypto.randomUUID()}`;
  const sekarang = new Date().toISOString();
  db.prepare(
    `INSERT INTO peluang_investasi
       (id, pengguna_id, peternak, nama_kandang, kecamatan, wilayah, lat, lng, pengalaman_tahun,
        jumlah_ekor, siklus_hari, status, hari_berjalan, kebutuhan_modal, modal_awal, minimal_titip,
        porsi_pemodal_persen, rencana_mulai, pemeriksaan_json, siklus_lalu_json, catatan_json,
        izin_data, is_demo, dibuat_pada, diubah_pada)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 32, 'menunggu-pemeriksaan', NULL, ?, 0, 100000, ?, ?,
        NULL, NULL, '[]', 1, 0, ?, ?)`,
  ).run(
    id,
    penggunaId,
    namaPeternak,
    ajuan.namaKandang,
    ajuan.kecamatan,
    ajuan.wilayah,
    ajuan.lat,
    ajuan.lng,
    ajuan.pengalamanTahun,
    ajuan.jumlahEkor,
    ajuan.kebutuhanModal,
    ajuan.porsiPemodalPersen,
    ajuan.rencanaMulai,
    sekarang,
    sekarang,
  );
  return id;
}

/** Mengubah izin tampil data catatan. Mengembalikan false bila peluang bukan milik pengguna. */
export function aturIzinData(
  db: Database,
  peluangId: string,
  penggunaId: string,
  izin: boolean,
): boolean {
  const info = db
    .prepare(
      "UPDATE peluang_investasi SET izin_data = ?, diubah_pada = ? WHERE id = ? AND pengguna_id = ?",
    )
    .run(izin ? 1 : 0, new Date().toISOString(), peluangId, penggunaId);
  return info.changes > 0;
}

export type HasilMinat =
  | { ok: true; peluang: PeluangInvestasi }
  | {
      ok: false;
      kode:
        "TIDAK_DITEMUKAN" | "BELUM_DIBUKA" | "DI_BAWAH_MINIMAL" | "MELEBIHI_SISA" | "MILIK_SENDIRI";
      sisa?: number;
      minimal?: number;
    };

export function catatMinat(
  db: Database,
  peluangId: string,
  penggunaId: string,
  nominal: number,
): HasilMinat {
  const tx = db.transaction((): HasilMinat => {
    const peluang = getPeluang(db, peluangId, penggunaId);
    if (!peluang) return { ok: false, kode: "TIDAK_DITEMUKAN" };
    if (peluang.milikSaya) return { ok: false, kode: "MILIK_SENDIRI" };
    if (peluang.status !== "dibuka") return { ok: false, kode: "BELUM_DIBUKA" };

    const sisa = Math.max(0, peluang.kebutuhanModal - peluang.modalTerkumpul);
    if (sisa === 0) return { ok: false, kode: "BELUM_DIBUKA" };
    if (nominal < peluang.minimalTitip) {
      return { ok: false, kode: "DI_BAWAH_MINIMAL", minimal: peluang.minimalTitip };
    }
    if (nominal > sisa) return { ok: false, kode: "MELEBIHI_SISA", sisa };

    db.prepare(
      "INSERT INTO minat_investasi (id, peluang_id, pengguna_id, nominal, dibuat_pada) VALUES (?, ?, ?, ?, ?)",
    ).run(crypto.randomUUID(), peluangId, penggunaId, nominal, new Date().toISOString());

    const terbaru = getPeluang(db, peluangId, penggunaId);
    return terbaru ? { ok: true, peluang: terbaru } : { ok: false, kode: "TIDAK_DITEMUKAN" };
  });
  return tx();
}

export function listMinatSaya(db: Database, penggunaId: string): MinatSayaItem[] {
  const rows = db
    .prepare(
      `SELECT m.id, m.peluang_id, p.nama_kandang, m.nominal, m.dibuat_pada
       FROM minat_investasi m INNER JOIN peluang_investasi p ON p.id = m.peluang_id
       WHERE m.pengguna_id = ? ORDER BY m.dibuat_pada DESC`,
    )
    .all(penggunaId) as Array<{
    id: string;
    peluang_id: string;
    nama_kandang: string;
    nominal: number;
    dibuat_pada: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    peluangId: r.peluang_id,
    namaKandang: r.nama_kandang,
    nominal: r.nominal,
    dibuatPada: r.dibuat_pada,
  }));
}
