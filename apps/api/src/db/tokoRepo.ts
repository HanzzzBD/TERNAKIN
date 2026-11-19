import type Database from "better-sqlite3";
import type { AdminUpdateHargaRequest, HargaTokoItem, Toko } from "@ternakin/shared";

interface TokoRow {
  id: string;
  kode: string;
  nama: string;
  area: string | null;
  status_mitra: number;
  is_demo: number;
  nomor_wa: string | null;
}

interface HargaTokoJoinRow {
  toko_id: string;
  bahan_id: string;
  nama_bahan: string;
  harga: number;
  asal_harga: string;
  diperbarui_pada: string;
}

export function listTokoWithPrices(db: Database.Database): Toko[] {
  const tokoRows = db.prepare("SELECT * FROM toko ORDER BY nama ASC").all() as TokoRow[];
  const hargaRows = db
    .prepare(
      `SELECT h.toko_id, h.bahan_id, b.nama AS nama_bahan, h.harga, h.asal_harga, h.diperbarui_pada
       FROM harga_toko h
       INNER JOIN bahan b ON b.id = h.bahan_id
       ORDER BY b.nama ASC`,
    )
    .all() as HargaTokoJoinRow[];

  const hargaMap = new Map<string, HargaTokoItem[]>();
  for (const row of hargaRows) {
    const list = hargaMap.get(row.toko_id) ?? [];
    list.push({
      bahanId: row.bahan_id,
      namaBahan: row.nama_bahan,
      harga: row.harga,
      asalHarga: row.asal_harga,
      diperbaruiPada: row.diperbarui_pada,
    });
    hargaMap.set(row.toko_id, list);
  }

  return tokoRows.map((row) => ({
    id: row.id,
    kode: row.kode || row.id,
    nama: row.nama,
    area: row.area ?? "Bandung Raya",
    statusMitra: row.status_mitra === 1,
    isDemo: row.is_demo === 1,
    nomorWa: row.nomor_wa,
    harga: hargaMap.get(row.id) ?? [],
  }));
}

export function updateTokoPrices(
  db: Database.Database,
  tokoId: string,
  items: AdminUpdateHargaRequest["harga"],
): Toko | null {
  const adaToko = db.prepare("SELECT id FROM toko WHERE id = ?").get(tokoId);
  if (!adaToko) return null;

  const upsert = db.prepare(`
    INSERT INTO harga_toko (toko_id, bahan_id, harga, asal_harga, diperbarui_pada)
    VALUES (@tokoId, @bahanId, @harga, @asalHarga, @diperbaruiPada)
    ON CONFLICT(toko_id, bahan_id) DO UPDATE SET
      harga = excluded.harga,
      asal_harga = excluded.asal_harga,
      diperbarui_pada = excluded.diperbarui_pada
  `);

  const cekBahan = db.prepare("SELECT id FROM bahan WHERE id = ?");
  const sekarang = new Date().toISOString();

  const run = db.transaction(() => {
    for (const item of items) {
      if (!cekBahan.get(item.bahanId)) {
        continue;
      }
      upsert.run({
        tokoId,
        bahanId: item.bahanId,
        harga: item.harga,
        asalHarga: item.asalHarga,
        diperbaruiPada: item.diperbaruiPada ?? sekarang,
      });
    }
  });
  run();

  return listTokoWithPrices(db).find((t) => t.id === tokoId) ?? null;
}

export function insertLeadIdempotent(
  db: Database.Database,
  lead: {
    clientId: string;
    tokoId: string;
    perangkatId?: string | null;
    src?: string | null;
    dibuatPada?: string;
  },
): boolean {
  const adaToko = db.prepare("SELECT id FROM toko WHERE id = ?").get(lead.tokoId);
  if (!adaToko) return false;

  db.prepare(
    `INSERT OR IGNORE INTO lead (id, toko_id, perangkat_id, src, dibuat_pada)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    lead.clientId,
    lead.tokoId,
    lead.perangkatId ?? null,
    lead.src ?? null,
    lead.dibuatPada ?? new Date().toISOString(),
  );
  return true;
}

export interface LeadRekapRow {
  tokoId: string;
  kode: string;
  namaToko: string;
  statusMitra: boolean;
  totalLead: number;
  perangkatUnik: number;
}

function rentangMingguIso(minggu: string): { mulai: string; selesai: string } | null {
  const match = minggu.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const tahun = Number(match[1]);
  const nomorMinggu = Number(match[2]);
  if (nomorMinggu < 1 || nomorMinggu > 53) return null;

  // 4 Januari selalu berada di minggu ISO pertama.
  const jan4 = new Date(Date.UTC(tahun, 0, 4));
  const hariJan4 = jan4.getUTCDay() || 7;
  const seninMinggu1 = new Date(jan4.getTime() - (hariJan4 - 1) * 86_400_000);
  const mulai = new Date(seninMinggu1.getTime() + (nomorMinggu - 1) * 7 * 86_400_000);
  const selesai = new Date(mulai.getTime() + 7 * 86_400_000);
  return { mulai: mulai.toISOString(), selesai: selesai.toISOString() };
}

export function getWeeklyLeadSummary(
  db: Database.Database,
  minggu?: string,
): { minggu: string; rekap: LeadRekapRow[] } {
  const rentang = minggu ? rentangMingguIso(minggu) : null;

  const rows = rentang
    ? (db
        .prepare(
          `SELECT t.id AS tokoId, t.kode AS kode, t.nama AS namaToko, t.status_mitra AS statusMitra,
                  COUNT(l.id) AS totalLead, COUNT(DISTINCT l.perangkat_id) AS perangkatUnik
           FROM toko t
           LEFT JOIN lead l ON l.toko_id = t.id AND l.dibuat_pada >= ? AND l.dibuat_pada < ?
           GROUP BY t.id
           ORDER BY totalLead DESC, t.nama ASC`,
        )
        .all(rentang.mulai, rentang.selesai) as Array<{
        tokoId: string;
        kode: string;
        namaToko: string;
        statusMitra: number;
        totalLead: number;
        perangkatUnik: number;
      }>)
    : (db
        .prepare(
          `SELECT t.id AS tokoId, t.kode AS kode, t.nama AS namaToko, t.status_mitra AS statusMitra,
                  COUNT(l.id) AS totalLead, COUNT(DISTINCT l.perangkat_id) AS perangkatUnik
           FROM toko t
           LEFT JOIN lead l ON l.toko_id = t.id
           GROUP BY t.id
           ORDER BY totalLead DESC, t.nama ASC`,
        )
        .all() as Array<{
        tokoId: string;
        kode: string;
        namaToko: string;
        statusMitra: number;
        totalLead: number;
        perangkatUnik: number;
      }>);

  return {
    minggu: rentang ? (minggu ?? "semua") : "semua",
    rekap: rows.map((r) => ({
      tokoId: r.tokoId,
      kode: r.kode || r.tokoId,
      namaToko: r.namaToko,
      statusMitra: r.statusMitra === 1,
      totalLead: r.totalLead,
      perangkatUnik: r.perangkatUnik,
    })),
  };
}
