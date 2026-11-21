-- Tambahan di luar SDD: indeks vektor untuk pencarian panduan Kokok berbasis makna (RAG).
-- Vektor disimpan sebagai BLOB Float32; hash_isi dipakai untuk mendeteksi panduan yang berubah.
CREATE TABLE IF NOT EXISTS panduan_embedding (
  dokumen_id TEXT PRIMARY KEY REFERENCES dokumen_panduan(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  hash_isi TEXT NOT NULL,
  dimensi INTEGER NOT NULL,
  vektor BLOB NOT NULL,
  diperbarui_pada TEXT NOT NULL
);
