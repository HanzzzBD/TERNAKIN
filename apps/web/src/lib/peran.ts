import type { PenggunaSaya, PeranAkun } from "@ternakin/shared";
import { useAkun } from "./akunCache";

/**
 * Peran aktif di aplikasi:
 * - "tamu": belum masuk. Sesuai PRD, tamu memakai fitur peternak (tanpa akun & offline).
 * - "peternak": hitung pakan, catatan harian, toko, Kokok, dan peluang kandang sendiri.
 * - "pengguna": hanya Kokok dan investasi (titip modal ke peternak).
 */
export type PeranAktif = "tamu" | PeranAkun;

export const LABEL_PERAN: Record<PeranAkun, string> = {
  peternak: "Peternak",
  pengguna: "Pengguna",
};

export const BERANDA_PERAN: Record<PeranAktif, string> = {
  tamu: "/app",
  peternak: "/app",
  pengguna: "/app/investasi",
};

export interface InfoPeran {
  peran: PeranAktif;
  akun: PenggunaSaya | null;
  /** Sudah masuk tetapi belum memilih peran; akses sementara seperti tamu. */
  perluPilihPeran: boolean;
  /** Boleh memakai pakan, catatan, toko, dan profil kandang. */
  bolehFiturPeternak: boolean;
}

export function infoPeran(akun: PenggunaSaya | null): InfoPeran {
  const peran: PeranAktif = akun?.peran ?? "tamu";
  return {
    peran,
    akun,
    perluPilihPeran: Boolean(akun && !akun.peran),
    bolehFiturPeternak: peran !== "pengguna",
  };
}

export function usePeranAktif(): InfoPeran {
  return infoPeran(useAkun());
}

/** Nama untuk ditampilkan di menu: nama (akun demo / sudah diisi) atau nomor tersamar. */
export function namaTampil(akun: PenggunaSaya): string {
  return akun.nama?.trim() || akun.nomorTersamar || "Akun Ternakin";
}
