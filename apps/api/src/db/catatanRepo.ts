import type Database from "better-sqlite3";
import { z } from "zod";
import type { CatatanHarian, Kandang } from "@ternakin/shared";

interface KandangRow {
  id: string;
  perangkat_id: string | null;
  nama: string;
  jenis_ayam: "petelur" | "pedaging";
  jumlah_ekor: number;
  umur_minggu: number | null;
  lokasi: string | null;
  bahan_tersedia_json: string;
  diubah_pada: string;
}

interface CatatanRow {
  id: string;
  kandang_id: string;
  tanggal: string;
  pakan_kg: number | null;
  telur: number | null;
  kematian: number | null;
  suhu: number | null;
  diubah_pada: string;
  dihapus_pada: string | null;
}

function mapKandang(row: KandangRow): Kandang {
  const bahanParsed = z
    .array(z.string())
    .catch([])
    .parse(JSON.parse(row.bahan_tersedia_json || "[]"));
  return {
    id: row.id,
    perangkatId: row.perangkat_id ?? undefined,
    nama: row.nama,
    jenisAyam: row.jenis_ayam,
    jumlahEkor: row.jumlah_ekor,
    umurMinggu: row.umur_minggu,
    lokasi: row.lokasi,
    bahanTersedia: bahanParsed,
    diubahPada: row.diubah_pada,
  };
}

function mapCatatan(row: CatatanRow): CatatanHarian {
  return {
    id: row.id,
    kandangId: row.kandang_id,
    tanggal: row.tanggal,
    pakanKg: row.pakan_kg,
    telur: row.telur,
    kematian: row.kematian,
    suhu: row.suhu,
    diubahPada: row.diubah_pada,
    dihapusPada: row.dihapus_pada,
  };
}

export function listKandangByDevice(db: Database.Database, perangkatId: string): Kandang[] {
  const rows = db
    .prepare("SELECT * FROM kandang WHERE perangkat_id = ? ORDER BY diubah_pada DESC")
    .all(perangkatId) as KandangRow[];
  return rows.map(mapKandang);
}

export function upsertKandang(
  db: Database.Database,
  perangkatId: string,
  kandang: Kandang,
): Kandang {
  const existing = db.prepare("SELECT * FROM kandang WHERE id = ?").get(kandang.id) as
    KandangRow | undefined;

  if (existing && existing.diubah_pada > kandang.diubahPada) {
    return mapKandang(existing);
  }

  db.prepare(
    `INSERT INTO kandang
      (id, perangkat_id, nama, jenis_ayam, jumlah_ekor, umur_minggu, lokasi, bahan_tersedia_json, diubah_pada)
     VALUES (@id, @perangkatId, @nama, @jenisAyam, @jumlahEkor, @umurMinggu, @lokasi, @bahanJson, @diubahPada)
     ON CONFLICT(id) DO UPDATE SET
       perangkat_id = excluded.perangkat_id,
       nama = excluded.nama,
       jenis_ayam = excluded.jenis_ayam,
       jumlah_ekor = excluded.jumlah_ekor,
       umur_minggu = excluded.umur_minggu,
       lokasi = excluded.lokasi,
       bahan_tersedia_json = excluded.bahan_tersedia_json,
       diubah_pada = excluded.diubah_pada`,
  ).run({
    id: kandang.id,
    perangkatId,
    nama: kandang.nama,
    jenisAyam: kandang.jenisAyam,
    jumlahEkor: kandang.jumlahEkor,
    umurMinggu: kandang.umurMinggu ?? null,
    lokasi: kandang.lokasi ?? null,
    bahanJson: JSON.stringify(kandang.bahanTersedia ?? []),
    diubahPada: kandang.diubahPada,
  });

  const saved = db.prepare("SELECT * FROM kandang WHERE id = ?").get(kandang.id) as KandangRow;
  return mapKandang(saved);
}

/**
 * Menyimpan atau memperbarui satu catatan per (kandang_id, tanggal) dengan aturan
 * perubahan terbaru menang (Last-Write-Wins) menurut stempel waktu diubah_pada.
 */
export function upsertCatatan(db: Database.Database, catatan: CatatanHarian): CatatanHarian | null {
  const kandangAda = db.prepare("SELECT id FROM kandang WHERE id = ?").get(catatan.kandangId);
  if (!kandangAda) {
    return null;
  }

  const byDate = db
    .prepare("SELECT * FROM catatan_harian WHERE kandang_id = ? AND tanggal = ?")
    .get(catatan.kandangId, catatan.tanggal) as CatatanRow | undefined;

  const byId = db.prepare("SELECT * FROM catatan_harian WHERE id = ?").get(catatan.id) as
    CatatanRow | undefined;

  const existing = byDate ?? byId;

  if (existing && existing.diubah_pada > catatan.diubahPada) {
    return mapCatatan(existing);
  }

  if (existing) {
    // Bila ada catatan lain pada id berbeda untuk (kandang_id, tanggal), perbarui baris yang menang.
    db.prepare(
      `UPDATE catatan_harian SET
        tanggal = @tanggal,
        pakan_kg = @pakanKg,
        telur = @telur,
        kematian = @kematian,
        suhu = @suhu,
        diubah_pada = @diubahPada,
        dihapus_pada = @dihapusPada
       WHERE id = @targetId`,
    ).run({
      targetId: existing.id,
      tanggal: catatan.tanggal,
      pakanKg: catatan.pakanKg,
      telur: catatan.telur,
      kematian: catatan.kematian,
      suhu: catatan.suhu,
      diubahPada: catatan.diubahPada,
      dihapusPada: catatan.dihapusPada ?? null,
    });
    const updated = db
      .prepare("SELECT * FROM catatan_harian WHERE id = ?")
      .get(existing.id) as CatatanRow;
    return mapCatatan(updated);
  }

  db.prepare(
    `INSERT INTO catatan_harian
      (id, kandang_id, tanggal, pakan_kg, telur, kematian, suhu, diubah_pada, dihapus_pada)
     VALUES (@id, @kandangId, @tanggal, @pakanKg, @telur, @kematian, @suhu, @diubahPada, @dihapusPada)`,
  ).run({
    id: catatan.id,
    kandangId: catatan.kandangId,
    tanggal: catatan.tanggal,
    pakanKg: catatan.pakanKg,
    telur: catatan.telur,
    kematian: catatan.kematian,
    suhu: catatan.suhu,
    diubahPada: catatan.diubahPada,
    dihapusPada: catatan.dihapusPada ?? null,
  });

  const inserted = db
    .prepare("SELECT * FROM catatan_harian WHERE id = ?")
    .get(catatan.id) as CatatanRow;
  return mapCatatan(inserted);
}

export function softDeleteCatatan(
  db: Database.Database,
  input: {
    id: string;
    kandangId: string;
    tanggal: string;
    dihapusPada: string;
    diubahPada: string;
  },
): void {
  const existing = db
    .prepare("SELECT * FROM catatan_harian WHERE id = ? OR (kandang_id = ? AND tanggal = ?)")
    .get(input.id, input.kandangId, input.tanggal) as CatatanRow | undefined;

  if (!existing) return;
  if (existing.diubah_pada > input.diubahPada) return;

  db.prepare("UPDATE catatan_harian SET dihapus_pada = ?, diubah_pada = ? WHERE id = ?").run(
    input.dihapusPada,
    input.diubahPada,
    existing.id,
  );
}

export function listCatatanByDevice(
  db: Database.Database,
  perangkatId: string,
  sejak?: string | null,
): CatatanHarian[] {
  if (sejak) {
    const rows = db
      .prepare(
        `SELECT c.* FROM catatan_harian c
         INNER JOIN kandang k ON k.id = c.kandang_id
         WHERE k.perangkat_id = ? AND c.diubah_pada >= ?
         ORDER BY c.tanggal DESC`,
      )
      .all(perangkatId, sejak) as CatatanRow[];
    return rows.map(mapCatatan);
  }

  const rows = db
    .prepare(
      `SELECT c.* FROM catatan_harian c
       INNER JOIN kandang k ON k.id = c.kandang_id
       WHERE k.perangkat_id = ?
       ORDER BY c.tanggal DESC`,
    )
    .all(perangkatId) as CatatanRow[];
  return rows.map(mapCatatan);
}

export function isOpSudahDiproses(db: Database.Database, opId: string): boolean {
  const row = db.prepare("SELECT op_id FROM outbox_diproses WHERE op_id = ?").get(opId);
  return Boolean(row);
}

export function tandaiOpDiproses(db: Database.Database, opId: string, perangkatId: string): void {
  db.prepare(
    "INSERT OR IGNORE INTO outbox_diproses (op_id, perangkat_id, diproses_pada) VALUES (?, ?, ?)",
  ).run(opId, perangkatId, new Date().toISOString());
}

export function deleteAllDataByDevice(db: Database.Database, perangkatId: string): void {
  const hapus = db.transaction(() => {
    db.prepare("DELETE FROM kandang WHERE perangkat_id = ?").run(perangkatId);
    db.prepare("DELETE FROM percakapan_kokok WHERE perangkat_id = ?").run(perangkatId);
    db.prepare("DELETE FROM lead WHERE perangkat_id = ?").run(perangkatId);
    db.prepare("DELETE FROM pemakaian_llm WHERE perangkat_id = ?").run(perangkatId);
    db.prepare("DELETE FROM outbox_diproses WHERE perangkat_id = ?").run(perangkatId);
  });
  hapus();
}
