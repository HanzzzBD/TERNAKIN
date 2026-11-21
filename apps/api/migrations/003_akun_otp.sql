-- Tambahan untuk PRD F5 (akun nomor ponsel + OTP WhatsApp).
-- Kode OTP dan token sesi hanya disimpan sebagai hash; nilai aslinya tidak pernah ada di basis data.
CREATE TABLE IF NOT EXISTS otp_permintaan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nomor_ponsel TEXT NOT NULL,
  kode_hash TEXT NOT NULL,
  percobaan INTEGER NOT NULL DEFAULT 0,
  terpakai INTEGER NOT NULL DEFAULT 0,
  kedaluwarsa_pada TEXT NOT NULL,
  dibuat_pada TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_otp_nomor ON otp_permintaan (nomor_ponsel, dibuat_pada);

CREATE TABLE IF NOT EXISTS sesi (
  token_hash TEXT PRIMARY KEY,
  pengguna_id TEXT NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  dibuat_pada TEXT NOT NULL,
  kedaluwarsa_pada TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sesi_pengguna ON sesi (pengguna_id);
