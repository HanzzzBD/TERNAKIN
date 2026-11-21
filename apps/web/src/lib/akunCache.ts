import { useSyncExternalStore } from "react";
import { penggunaSayaSchema, type PenggunaSaya } from "@ternakin/shared";

/**
 * Salinan lokal status akun (bukan token). Sesi sebenarnya ada di cookie HttpOnly yang tidak bisa
 * dibaca skrip; salinan ini hanya agar status "sudah masuk" tetap tampil saat offline.
 */

const KUNCI = "tk.akun";
const EVENT = "tk:akun";

let cache: PenggunaSaya | null | undefined;

export function bacaAkunLokal(): PenggunaSaya | null {
  if (cache !== undefined) return cache;
  cache = null;
  try {
    const mentah = window.localStorage.getItem(KUNCI);
    if (mentah) {
      const hasil = penggunaSayaSchema.safeParse(JSON.parse(mentah));
      if (hasil.success) cache = hasil.data;
    }
  } catch {
    // localStorage tidak tersedia atau isi rusak: anggap belum masuk
  }
  return cache;
}

export function setelAkunLokal(pengguna: PenggunaSaya | null): void {
  cache = pengguna;
  try {
    if (pengguna) {
      window.localStorage.setItem(KUNCI, JSON.stringify(pengguna));
    } else {
      window.localStorage.removeItem(KUNCI);
    }
  } catch {
    // Abaikan
  }
  window.dispatchEvent(new Event(EVENT));
}

function langganan(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function useAkun(): PenggunaSaya | null {
  return useSyncExternalStore(langganan, bacaAkunLokal, () => null);
}
