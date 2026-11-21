-- Masuk dengan email + kata sandi dan Google. Kolom email, sandi_hash, email_terverifikasi,
-- dan google_sub pada pengguna ditambahkan lewat ensureColumn di database.ts.
-- Kode verifikasi email dan reset sandi hanya disimpan sebagai HMAC.
CREATE TABLE IF NOT EXISTS kode_email (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  tujuan TEXT NOT NULL CHECK (tujuan IN ('verifikasi', 'reset')),
  kode_hash TEXT NOT NULL,
  percobaan INTEGER NOT NULL DEFAULT 0,
  terpakai INTEGER NOT NULL DEFAULT 0,
  kedaluwarsa_pada TEXT NOT NULL,
  dibuat_pada TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kode_email ON kode_email (email, tujuan, dibuat_pada);
