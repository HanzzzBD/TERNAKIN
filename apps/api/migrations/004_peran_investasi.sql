-- Modul 5 — Investasi ternak (SIMULASI, tanpa uang sungguhan) dan peran akun.
-- Kolom peran_akun, nama, dan is_demo pada pengguna ditambahkan lewat ensureColumn di database.ts.
CREATE TABLE IF NOT EXISTS peluang_investasi (
  id TEXT PRIMARY KEY,
  pengguna_id TEXT NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  peternak TEXT NOT NULL,
  nama_kandang TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  wilayah TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  pengalaman_tahun INTEGER NOT NULL DEFAULT 0,
  jumlah_ekor INTEGER NOT NULL CHECK (jumlah_ekor > 0),
  siklus_hari INTEGER NOT NULL DEFAULT 32,
  status TEXT NOT NULL CHECK (status IN ('dibuka', 'menunggu-pemeriksaan', 'dipelihara')),
  hari_berjalan INTEGER,
  kebutuhan_modal INTEGER NOT NULL CHECK (kebutuhan_modal > 0),
  modal_awal INTEGER NOT NULL DEFAULT 0,
  minimal_titip INTEGER NOT NULL DEFAULT 100000,
  porsi_pemodal_persen REAL NOT NULL,
  rencana_mulai TEXT,
  pemeriksaan_json TEXT,
  siklus_lalu_json TEXT,
  catatan_json TEXT NOT NULL DEFAULT '[]',
  izin_data INTEGER NOT NULL DEFAULT 1,
  is_demo INTEGER NOT NULL DEFAULT 0,
  dibuat_pada TEXT NOT NULL,
  diubah_pada TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_peluang_pengguna ON peluang_investasi (pengguna_id);

CREATE TABLE IF NOT EXISTS minat_investasi (
  id TEXT PRIMARY KEY,
  peluang_id TEXT NOT NULL REFERENCES peluang_investasi(id) ON DELETE CASCADE,
  pengguna_id TEXT NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  nominal INTEGER NOT NULL CHECK (nominal > 0),
  dibuat_pada TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_minat_peluang ON minat_investasi (peluang_id);
CREATE INDEX IF NOT EXISTS idx_minat_pengguna ON minat_investasi (pengguna_id);
