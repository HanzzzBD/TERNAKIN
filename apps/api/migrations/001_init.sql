-- Sepuluh tabel inti dari SDD (ID berupa UUID teks buatan klien)
CREATE TABLE IF NOT EXISTS pengguna (
  id TEXT PRIMARY KEY,
  nomor_ponsel TEXT UNIQUE,
  peran TEXT NOT NULL DEFAULT 'peternak' CHECK (peran IN ('peternak', 'admin')),
  dibuat_pada TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kandang (
  id TEXT PRIMARY KEY,
  pengguna_id TEXT REFERENCES pengguna(id) ON DELETE CASCADE,
  perangkat_id TEXT,
  nama TEXT NOT NULL,
  jenis_ayam TEXT NOT NULL DEFAULT 'petelur' CHECK (jenis_ayam IN ('petelur', 'pedaging')),
  jumlah_ekor INTEGER NOT NULL CHECK (jumlah_ekor >= 0),
  umur_minggu INTEGER,
  lokasi TEXT,
  bahan_tersedia_json TEXT NOT NULL DEFAULT '[]',
  diubah_pada TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catatan_harian (
  id TEXT PRIMARY KEY,
  kandang_id TEXT NOT NULL REFERENCES kandang(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,
  pakan_kg REAL,
  telur INTEGER,
  kematian INTEGER,
  suhu REAL,
  diubah_pada TEXT NOT NULL,
  dihapus_pada TEXT,
  UNIQUE (kandang_id, tanggal)
);

CREATE TABLE IF NOT EXISTS bahan (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  satuan TEXT NOT NULL DEFAULT 'kg',
  sinonim_json TEXT NOT NULL DEFAULT '[]',
  batas_min_persen REAL NOT NULL DEFAULT 0,
  batas_maks_persen REAL NOT NULL DEFAULT 100,
  sumber_nutrisi TEXT NOT NULL DEFAULT '',
  is_demo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS nutrisi_bahan (
  bahan_id TEXT NOT NULL REFERENCES bahan(id) ON DELETE CASCADE,
  zat_gizi TEXT NOT NULL,
  kadar REAL NOT NULL,
  sumber TEXT NOT NULL,
  PRIMARY KEY (bahan_id, zat_gizi)
);

CREATE TABLE IF NOT EXISTS kebutuhan_gizi (
  jenis_ayam TEXT NOT NULL,
  fase TEXT NOT NULL,
  zat_gizi TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  satuan TEXT NOT NULL DEFAULT '%',
  batas_min REAL,
  batas_maks REAL,
  sumber TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (jenis_ayam, fase, zat_gizi)
);

CREATE TABLE IF NOT EXISTS toko (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  area TEXT,
  status_mitra INTEGER NOT NULL DEFAULT 0,
  is_demo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS harga_toko (
  toko_id TEXT NOT NULL REFERENCES toko(id) ON DELETE CASCADE,
  bahan_id TEXT NOT NULL REFERENCES bahan(id) ON DELETE CASCADE,
  harga REAL NOT NULL,
  asal_harga TEXT NOT NULL,
  diperbarui_pada TEXT NOT NULL,
  PRIMARY KEY (toko_id, bahan_id)
);

CREATE TABLE IF NOT EXISTS dokumen_panduan (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  sumber TEXT NOT NULL,
  isi TEXT NOT NULL,
  versi TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS percakapan_kokok (
  id TEXT PRIMARY KEY,
  pengguna_id TEXT,
  perangkat_id TEXT,
  ringkasan TEXT NOT NULL,
  urgensi TEXT NOT NULL CHECK (urgensi IN ('rendah', 'sedang', 'tinggi')),
  sumber_dipakai TEXT NOT NULL,
  dibuat_pada TEXT NOT NULL
);

-- Tambahan di luar SDD (disetujui tim untuk pengendalian biaya LLM dan pelacakan lead toko)
CREATE TABLE IF NOT EXISTS lead (
  id TEXT PRIMARY KEY,
  toko_id TEXT NOT NULL REFERENCES toko(id) ON DELETE CASCADE,
  perangkat_id TEXT,
  src TEXT,
  dibuat_pada TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pemakaian_llm (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  perangkat_id TEXT,
  rute TEXT NOT NULL,
  token_masuk INTEGER,
  token_keluar INTEGER,
  dibuat_pada TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cache_llm (
  kunci TEXT PRIMARY KEY,
  nilai TEXT NOT NULL,
  kedaluwarsa_pada TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox_diproses (
  op_id TEXT PRIMARY KEY,
  perangkat_id TEXT NOT NULL,
  diproses_pada TEXT NOT NULL
);
