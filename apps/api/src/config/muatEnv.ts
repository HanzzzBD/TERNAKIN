import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

/**
 * Memuat variabel lingkungan dari dua tempat agar tidak ada lagi kasus "sudah diisi tapi tidak
 * terbaca": apps/api/.env (dibaca saat npm run dev) dan .env di akar repo (dipakai docker-compose).
 *
 * Urutan prioritas:
 * 1. Variabel lingkungan sungguhan (mis. dari Docker) selalu menang.
 * 2. Nilai TIDAK kosong di apps/api/.env.
 * 3. Nilai di .env akar repo.
 */
const API_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function baca(file: string): Record<string, string> {
  return fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {};
}

export function muatEnv(): { sumber: string[] } {
  const fileApi = path.join(API_ROOT, ".env");
  const fileAkar = path.resolve(API_ROOT, "../../.env");
  const api = baca(fileApi);
  const akar = baca(fileAkar);

  for (const kunci of new Set([...Object.keys(akar), ...Object.keys(api)])) {
    if (process.env[kunci] !== undefined) continue;
    const nilaiApi = api[kunci];
    const nilai = nilaiApi !== undefined && nilaiApi.trim() !== "" ? nilaiApi : akar[kunci];
    if (nilai !== undefined) process.env[kunci] = nilai;
  }

  return {
    sumber: [fileApi, fileAkar]
      .filter((f) => fs.existsSync(f))
      .map((f) => path.basename(path.dirname(f))),
  };
}
