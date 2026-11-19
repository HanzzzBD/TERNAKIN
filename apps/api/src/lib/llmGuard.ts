import crypto from "node:crypto";
import type Database from "better-sqlite3";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function hashKunci(prefix: string, isi: string): string {
  const digest = crypto.createHash("sha256").update(isi).digest("hex");
  return `${prefix}:${digest}`;
}

export function hashSingkatUntukLog(isi: string): string {
  return crypto.createHash("sha256").update(isi).digest("hex").slice(0, 12);
}

export function bacaCacheLlm(db: Database.Database, kunci: string): string | null {
  const sekarang = new Date().toISOString();
  const row = db
    .prepare("SELECT nilai, kedaluwarsa_pada FROM cache_llm WHERE kunci = ?")
    .get(kunci) as { nilai: string; kedaluwarsa_pada: string } | undefined;

  if (!row) return null;
  if (row.kedaluwarsa_pada <= sekarang) {
    db.prepare("DELETE FROM cache_llm WHERE kunci = ?").run(kunci);
    return null;
  }
  return row.nilai;
}

export function simpanCacheLlm(db: Database.Database, kunci: string, nilai: string): void {
  const kedaluwarsa = new Date(Date.now() + CACHE_TTL_MS).toISOString();
  db.prepare(
    "INSERT OR REPLACE INTO cache_llm (kunci, nilai, kedaluwarsa_pada) VALUES (?, ?, ?)",
  ).run(kunci, nilai, kedaluwarsa);
}

export function hitungPemakaianHariIni(db: Database.Database, perangkatId: string): number {
  const awalHari = new Date();
  awalHari.setHours(0, 0, 0, 0);
  const row = db
    .prepare(
      "SELECT COUNT(*) AS jumlah FROM pemakaian_llm WHERE perangkat_id = ? AND dibuat_pada >= ?",
    )
    .get(perangkatId, awalHari.toISOString()) as { jumlah: number } | undefined;
  return row?.jumlah ?? 0;
}

export function catatPemakaianLlm(
  db: Database.Database,
  perangkatId: string,
  rute: string,
  tokenMasuk: number,
  tokenKeluar: number,
): void {
  db.prepare(
    `INSERT INTO pemakaian_llm (perangkat_id, rute, token_masuk, token_keluar, dibuat_pada)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(perangkatId, rute, tokenMasuk, tokenKeluar, new Date().toISOString());
}
