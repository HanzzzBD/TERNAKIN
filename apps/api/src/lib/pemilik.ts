import type { Response } from "express";

/**
 * Kunci pemilik data. Data lama disimpan per `perangkat_id`; agar kode penyimpanan tetap sama,
 * pengguna yang sudah masuk memakai kunci khusus `akun:<penggunaId>` di kolom yang sama.
 *
 * Penting: kunci berawalan `akun:` hanya boleh berasal dari sesi yang terverifikasi,
 * tidak pernah dari header atau body kiriman klien.
 */

export const AWALAN_AKUN = "akun:";

export interface PenggunaSesi {
  id: string;
  /** null untuk akun demo bersama. */
  nomorPonsel: string | null;
  /** Peran aplikasi; null = belum memilih. */
  peran: "peternak" | "pengguna" | null;
  nama: string | null;
  isDemo: boolean;
}

export function kunciAkun(penggunaId: string): string {
  return `${AWALAN_AKUN}${penggunaId}`;
}

/** Membersihkan ID perangkat kiriman klien; menolak awalan yang dicadangkan server. */
export function bersihkanPerangkatId(nilai: unknown): string | null {
  if (typeof nilai !== "string") return null;
  const bersih = nilai.trim().slice(0, 128);
  if (!bersih) return null;
  if (bersih.startsWith(AWALAN_AKUN) || bersih.startsWith("ip:")) return null;
  return bersih;
}

export function ambilPenggunaSesi(res: Response): PenggunaSesi | null {
  const pengguna = res.locals.pengguna as PenggunaSesi | undefined;
  return pengguna ?? null;
}

/**
 * Menentukan pemilik data permintaan ini: akun bila sesi valid, selain itu ID perangkat
 * pertama yang valid dari kandidat (body, header, atau query).
 */
export function kunciPemilik(res: Response, ...kandidatPerangkat: unknown[]): string | null {
  const pengguna = ambilPenggunaSesi(res);
  if (pengguna) return kunciAkun(pengguna.id);
  for (const kandidat of kandidatPerangkat) {
    const bersih = bersihkanPerangkatId(kandidat);
    if (bersih) return bersih;
  }
  return null;
}
