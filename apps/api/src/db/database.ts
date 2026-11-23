import { Database } from "./sqlite.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { seedInvestasi } from "./investasiRepo.js";
import {
  ambangPeringatanSchema,
  bahanMasterSchema,
  dataReferensiSchema,
  kebutuhanGiziItemSchema,
  type AmbangPeringatan,
  type BahanMaster,
  type DataReferensi,
  type KebutuhanGiziItem,
} from "@ternakin/shared";

const API_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MIGRATION_001 = path.join(API_ROOT, "migrations", "001_init.sql");
const MIGRATION_002 = path.join(API_ROOT, "migrations", "002_panduan_embedding.sql");
const MIGRATION_003 = path.join(API_ROOT, "migrations", "003_akun_otp.sql");
const MIGRATION_004 = path.join(API_ROOT, "migrations", "004_peran_investasi.sql");
const MIGRATION_005 = path.join(API_ROOT, "migrations", "005_email_google.sql");
const DEFAULT_SEED_PELUANG = path.join(API_ROOT, "seed", "peluang_investasi.json");
const DEFAULT_SEED_REFERENSI = path.join(API_ROOT, "seed", "referensi.json");
const DEFAULT_SEED_TOKO = path.join(API_ROOT, "seed", "toko.json");
const DEFAULT_SEED_PANDUAN = path.join(API_ROOT, "seed", "panduan.json");
const DEFAULT_SEED_PENGETAHUAN = path.join(API_ROOT, "seed", "pengetahuan_peternakan.json");

const seedPanduanItemSchema = z.object({
  id: z.string().min(1),
  judul: z.string().min(1),
  sumber: z.string().min(1),
  versi: z.string().min(1),
  isi: z.string().min(1),
});

type SeedPanduanItem = z.infer<typeof seedPanduanItemSchema>;

const seedTokoItemSchema = z.object({
  id: z.string().min(1),
  kode: z.string().min(1),
  nama: z.string().min(1),
  area: z.string().min(1),
  statusMitra: z.boolean(),
  isDemo: z.boolean().default(true),
  nomorWa: z.string().nullable().optional(),
  umurHariContoh: z.number().int().min(0).default(1),
  asalHarga: z.string().min(1),
  harga: z.record(z.string(), z.number().positive()),
});

type SeedTokoItem = z.infer<typeof seedTokoItemSchema>;

const seedReferensiFileSchema = z.object({
  versi: z.string().min(1),
  isDemo: z.boolean(),
  catatanData: z.string().min(1),
  bahan: z.array(bahanMasterSchema),
  kebutuhanGizi: z.array(kebutuhanGiziItemSchema),
  ambangPeringatan: z.array(ambangPeringatanSchema).default([]),
  gejalaAwalKokok: z.array(z.string().min(1)).default([]),
});

type SeedReferensiFile = z.infer<typeof seedReferensiFileSchema>;

export interface DatabaseContext {
  db: Database;
  referensiMeta: {
    versi: string;
    isDemo: boolean;
    catatanData: string;
    ambangPeringatan: AmbangPeringatan[];
    gejalaAwalKokok: string[];
  };
  close: () => void;
}

export function initDatabase(
  databasePath: string,
  seedReferensiPath: string = DEFAULT_SEED_REFERENSI,
): DatabaseContext {
  if (databasePath !== ":memory:") {
    const dir = path.dirname(databasePath);
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  if (databasePath !== ":memory:") {
    db.pragma("journal_mode = WAL");
  }

  const sql = fs.readFileSync(MIGRATION_001, "utf-8");
  db.exec(sql);
  db.exec(fs.readFileSync(MIGRATION_002, "utf-8"));
  db.exec(fs.readFileSync(MIGRATION_003, "utf-8"));
  db.exec(fs.readFileSync(MIGRATION_004, "utf-8"));
  // Peran aplikasi (peternak/pengguna); kolom lama "peran" tetap untuk peran sistem.
  ensureColumn(db, "pengguna", "peran_akun", "TEXT");
  ensureColumn(db, "pengguna", "nama", "TEXT");
  ensureColumn(db, "pengguna", "is_demo", "INTEGER NOT NULL DEFAULT 0");
  db.exec(fs.readFileSync(MIGRATION_005, "utf-8"));
  ensureColumn(db, "pengguna", "email", "TEXT");
  ensureColumn(db, "pengguna", "sandi_hash", "TEXT");
  ensureColumn(db, "pengguna", "email_terverifikasi", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "pengguna", "google_sub", "TEXT");
  db.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_pengguna_email ON pengguna (email) WHERE email IS NOT NULL;" +
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_pengguna_google ON pengguna (google_sub) WHERE google_sub IS NOT NULL;",
  );
  ensureColumn(db, "kandang", "bahan_tersedia_json", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "catatan_harian", "dihapus_pada", "TEXT");
  ensureColumn(db, "toko", "kode", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "toko", "nomor_wa", "TEXT");

  const rawSeed: unknown = JSON.parse(fs.readFileSync(seedReferensiPath, "utf-8"));
  const seed = seedReferensiFileSchema.parse(rawSeed);
  seedReferensi(db, seed);

  if (fs.existsSync(DEFAULT_SEED_TOKO)) {
    const rawToko: unknown = JSON.parse(fs.readFileSync(DEFAULT_SEED_TOKO, "utf-8"));
    const seedTokoList = z.array(seedTokoItemSchema).parse(rawToko);
    seedToko(db, seedTokoList);
  }

  // Panduan triase awal + dokumen pengetahuan peternakan (pakan, kesehatan, manajemen kandang).
  // Keduanya masuk ke dokumen_panduan sehingga ikut diindeks embedding dan dicari Kokok.
  for (const berkas of [DEFAULT_SEED_PANDUAN, DEFAULT_SEED_PENGETAHUAN]) {
    if (!fs.existsSync(berkas)) continue;
    const mentah: unknown = JSON.parse(fs.readFileSync(berkas, "utf-8"));
    seedPanduan(db, z.array(seedPanduanItemSchema).parse(mentah));
  }

  seedInvestasi(db, DEFAULT_SEED_PELUANG);

  return {
    db,
    referensiMeta: {
      versi: seed.versi,
      isDemo: seed.isDemo,
      catatanData: seed.catatanData,
      ambangPeringatan: seed.ambangPeringatan,
      gejalaAwalKokok: seed.gejalaAwalKokok,
    },
    close: () => db.close(),
  };
}

function ensureColumn(
  db: Database,
  table: string,
  column: string,
  definition: string,
): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function seedReferensi(db: Database, seed: SeedReferensiFile): void {
  const upsertBahan = db.prepare(`
    INSERT OR REPLACE INTO bahan
      (id, nama, satuan, sinonim_json, batas_min_persen, batas_maks_persen, sumber_nutrisi, is_demo)
    VALUES (@id, @nama, @satuan, @sinonimJson, @batasMinPersen, @batasMaksPersen, @sumberNutrisi, @isDemo)
  `);

  const upsertNutrisi = db.prepare(`
    INSERT OR REPLACE INTO nutrisi_bahan (bahan_id, zat_gizi, kadar, sumber)
    VALUES (@bahanId, @zatGizi, @kadar, @sumber)
  `);

  const upsertGizi = db.prepare(`
    INSERT OR REPLACE INTO kebutuhan_gizi
      (jenis_ayam, fase, zat_gizi, label, satuan, batas_min, batas_maks, sumber, is_demo)
    VALUES (@jenisAyam, @fase, @zatGizi, @label, @satuan, @batasMin, @batasMaks, @sumber, @isDemo)
  `);

  const runSeed = db.transaction(() => {
    for (const b of seed.bahan) {
      upsertBahan.run({
        id: b.id,
        nama: b.nama,
        satuan: b.satuan,
        sinonimJson: JSON.stringify(b.sinonim),
        batasMinPersen: b.batasMinPersen,
        batasMaksPersen: b.batasMaksPersen,
        sumberNutrisi: b.sumberNutrisi,
        isDemo: b.isDemo ? 1 : 0,
      });

      for (const [zatGizi, kadar] of Object.entries(b.nutrisi)) {
        upsertNutrisi.run({
          bahanId: b.id,
          zatGizi,
          kadar,
          sumber: b.sumberNutrisi,
        });
      }
    }

    for (const k of seed.kebutuhanGizi) {
      upsertGizi.run({
        jenisAyam: k.jenisAyam,
        fase: k.fase,
        zatGizi: k.zatGizi,
        label: k.label,
        satuan: k.satuan,
        batasMin: k.batasMin,
        batasMaks: k.batasMaks,
        sumber: k.sumber,
        isDemo: k.isDemo ? 1 : 0,
      });
    }
  });

  runSeed();
}

function seedToko(db: Database, list: readonly SeedTokoItem[]): void {
  const insertToko = db.prepare(`
    INSERT OR IGNORE INTO toko (id, kode, nama, area, status_mitra, is_demo, nomor_wa)
    VALUES (@id, @kode, @nama, @area, @statusMitra, @isDemo, @nomorWa)
  `);

  const insertHarga = db.prepare(`
    INSERT OR IGNORE INTO harga_toko (toko_id, bahan_id, harga, asal_harga, diperbarui_pada)
    VALUES (@tokoId, @bahanId, @harga, @asalHarga, @diperbaruiPada)
  `);

  const msPerHari = 24 * 60 * 60 * 1000;
  const run = db.transaction(() => {
    for (const t of list) {
      insertToko.run({
        id: t.id,
        kode: t.kode,
        nama: t.nama,
        area: t.area,
        statusMitra: t.statusMitra ? 1 : 0,
        isDemo: t.isDemo ? 1 : 0,
        nomorWa: t.nomorWa ?? null,
      });

      const diperbaruiPada = new Date(Date.now() - t.umurHariContoh * msPerHari).toISOString();
      for (const [bahanId, harga] of Object.entries(t.harga)) {
        insertHarga.run({
          tokoId: t.id,
          bahanId,
          harga,
          asalHarga: t.asalHarga,
          diperbaruiPada,
        });
      }
    }
  });

  run();
}

function seedPanduan(db: Database, list: readonly SeedPanduanItem[]): void {
  const upsertPanduan = db.prepare(`
    INSERT OR REPLACE INTO dokumen_panduan (id, judul, sumber, isi, versi)
    VALUES (@id, @judul, @sumber, @isi, @versi)
  `);

  const run = db.transaction(() => {
    for (const p of list) {
      upsertPanduan.run(p);
    }
  });

  run();
}

interface BahanRow {
  id: string;
  nama: string;
  satuan: string;
  sinonim_json: string;
  batas_min_persen: number;
  batas_maks_persen: number;
  sumber_nutrisi: string;
  is_demo: number;
}

interface NutrisiRow {
  bahan_id: string;
  zat_gizi: string;
  kadar: number;
}

interface KebutuhanGiziRow {
  jenis_ayam: "petelur" | "pedaging";
  fase: "starter" | "grower" | "layer";
  zat_gizi: string;
  label: string;
  satuan: string;
  batas_min: number | null;
  batas_maks: number | null;
  sumber: string;
  is_demo: number;
}

export function getReferensiData(ctx: DatabaseContext, staleDays: number): DataReferensi {
  const bahanRows = ctx.db.prepare("SELECT * FROM bahan ORDER BY nama ASC").all() as BahanRow[];

  const nutrisiRows = ctx.db
    .prepare("SELECT bahan_id, zat_gizi, kadar FROM nutrisi_bahan")
    .all() as NutrisiRow[];

  const nutrisiMap = new Map<string, Record<string, number>>();
  for (const row of nutrisiRows) {
    const existing = nutrisiMap.get(row.bahan_id) ?? {};
    existing[row.zat_gizi] = row.kadar;
    nutrisiMap.set(row.bahan_id, existing);
  }

  const bahan: BahanMaster[] = bahanRows.map((row) => {
    const parsedSinonim: unknown = JSON.parse(row.sinonim_json || "[]");
    const sinonim = z.array(z.string()).catch([]).parse(parsedSinonim);
    return {
      id: row.id,
      nama: row.nama,
      satuan: row.satuan,
      sinonim,
      batasMinPersen: row.batas_min_persen,
      batasMaksPersen: row.batas_maks_persen,
      nutrisi: nutrisiMap.get(row.id) ?? {},
      sumberNutrisi: row.sumber_nutrisi,
      isDemo: row.is_demo === 1,
    };
  });

  const giziRows = ctx.db
    .prepare("SELECT * FROM kebutuhan_gizi ORDER BY jenis_ayam, fase, zat_gizi")
    .all() as KebutuhanGiziRow[];

  const kebutuhanGizi: KebutuhanGiziItem[] = giziRows.map((row) => ({
    jenisAyam: row.jenis_ayam,
    fase: row.fase,
    zatGizi: row.zat_gizi,
    label: row.label,
    satuan: row.satuan,
    batasMin: row.batas_min,
    batasMaks: row.batas_maks,
    sumber: row.sumber,
    isDemo: row.is_demo === 1,
  }));

  return dataReferensiSchema.parse({
    versi: ctx.referensiMeta.versi,
    isDemo: ctx.referensiMeta.isDemo,
    catatanData: ctx.referensiMeta.catatanData,
    staleDays,
    bahan,
    kebutuhanGizi,
    ambangPeringatan: ctx.referensiMeta.ambangPeringatan,
    gejalaAwalKokok: ctx.referensiMeta.gejalaAwalKokok,
  });
}
