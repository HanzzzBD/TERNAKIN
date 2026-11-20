import { useSyncExternalStore } from "react";

/**
 * Akun demo untuk prototipe Modul 5. Bukan autentikasi sungguhan:
 * sesi hanya disimpan di localStorage perangkat ini.
 */
export type PeranAkun = "pengguna" | "peternak";

export interface AkunDemo {
  peran: PeranAkun;
  nama: string;
  email: string;
  sandi: string;
  /** Untuk peternak: id peluang miliknya di data contoh. */
  peluangMilikId?: string;
}

export const AKUN_DEMO: Record<PeranAkun, AkunDemo> = {
  pengguna: {
    peran: "pengguna",
    nama: "Rani",
    email: "pengguna@demo.ternakin.id",
    sandi: "demo1234",
  },
  peternak: {
    peran: "peternak",
    nama: "Pak Dedi",
    email: "peternak@demo.ternakin.id",
    sandi: "demo1234",
    peluangMilikId: "pl-ciparay",
  },
};

export const LABEL_PERAN: Record<PeranAkun, string> = {
  pengguna: "Pengguna",
  peternak: "Peternak",
};

export const BERANDA_PERAN: Record<PeranAkun, string> = {
  pengguna: "/app/investasi",
  peternak: "/app/peternak",
};

const KUNCI_SESI = "tk.akunDemo";
const EVENT_SESI = "tk:akun-demo";

function bacaSesi(): PeranAkun | null {
  try {
    const nilai = window.localStorage.getItem(KUNCI_SESI);
    return nilai === "pengguna" || nilai === "peternak" ? nilai : null;
  } catch {
    return null;
  }
}

function langganan(cb: () => void): () => void {
  window.addEventListener(EVENT_SESI, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT_SESI, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Mencocokkan email dan sandi dengan akun demo. Mengembalikan peran bila cocok. */
export function cocokkanAkunDemo(email: string, sandi: string): PeranAkun | null {
  const e = email.trim().toLowerCase();
  for (const akun of Object.values(AKUN_DEMO)) {
    if (akun.email === e && akun.sandi === sandi) return akun.peran;
  }
  return null;
}

export function masukDemo(peran: PeranAkun): void {
  try {
    window.localStorage.setItem(KUNCI_SESI, peran);
  } catch {
    // Abaikan bila localStorage tidak tersedia
  }
  window.dispatchEvent(new Event(EVENT_SESI));
}

export function keluarDemo(): void {
  try {
    window.localStorage.removeItem(KUNCI_SESI);
  } catch {
    // Abaikan bila localStorage tidak tersedia
  }
  window.dispatchEvent(new Event(EVENT_SESI));
}

export function useAkunDemo(): AkunDemo | null {
  const peran = useSyncExternalStore(langganan, bacaSesi, () => null);
  return peran ? AKUN_DEMO[peran] : null;
}

/* ---------- Minat titip modal (pengguna) dan ajuan peluang (peternak) ---------- */

export interface MinatTitip {
  peluangId: string;
  nominal: number;
  dibuatPada: string;
}

export interface AjuanPeluang {
  id: string;
  jumlahEkor: number;
  kebutuhanModal: number;
  porsiPemodalPersen: number;
  rencanaMulai: string;
  dibuatPada: string;
}

const KUNCI_MINAT = "tk.investasi.minat";
const KUNCI_AJUAN = "tk.investasi.ajuan";
const KUNCI_IZIN = "tk.investasi.izinData";
const EVENT_DATA = "tk:investasi-data";

function bacaJson<T>(kunci: string, cadangan: T): T {
  try {
    const mentah = window.localStorage.getItem(kunci);
    return mentah ? (JSON.parse(mentah) as T) : cadangan;
  } catch {
    return cadangan;
  }
}

function tulisJson(kunci: string, nilai: unknown): void {
  try {
    window.localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch {
    // Abaikan bila localStorage tidak tersedia
  }
  window.dispatchEvent(new Event(EVENT_DATA));
}

function langgananData(cb: () => void): () => void {
  window.addEventListener(EVENT_DATA, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT_DATA, cb);
    window.removeEventListener("storage", cb);
  };
}

// useSyncExternalStore butuh snapshot stabil: simpan string mentah, parse di luar.
function snapshotMentah(kunci: string): () => string {
  return () => {
    try {
      return window.localStorage.getItem(kunci) ?? "";
    } catch {
      return "";
    }
  };
}

function parseAman<T>(mentah: string, cadangan: T): T {
  if (!mentah) return cadangan;
  try {
    return JSON.parse(mentah) as T;
  } catch {
    return cadangan;
  }
}

export function useMinatTitip(): MinatTitip[] {
  const mentah = useSyncExternalStore(langgananData, snapshotMentah(KUNCI_MINAT), () => "");
  return parseAman<MinatTitip[]>(mentah, []);
}

export function tambahMinatTitip(minat: Omit<MinatTitip, "dibuatPada">): void {
  const daftar = bacaJson<MinatTitip[]>(KUNCI_MINAT, []);
  tulisJson(KUNCI_MINAT, [...daftar, { ...minat, dibuatPada: new Date().toISOString() }]);
}

export function useAjuanPeluang(): AjuanPeluang[] {
  const mentah = useSyncExternalStore(langgananData, snapshotMentah(KUNCI_AJUAN), () => "");
  return parseAman<AjuanPeluang[]>(mentah, []);
}

export function tambahAjuanPeluang(ajuan: Omit<AjuanPeluang, "id" | "dibuatPada">): void {
  const daftar = bacaJson<AjuanPeluang[]>(KUNCI_AJUAN, []);
  tulisJson(KUNCI_AJUAN, [
    ...daftar,
    { ...ajuan, id: `ajuan-${Date.now()}`, dibuatPada: new Date().toISOString() },
  ]);
}

/** Izin peternak agar data catatan harian ditampilkan ke pengguna. Bawaan: diizinkan. */
export function useIzinDataPeternak(): boolean {
  const mentah = useSyncExternalStore(langgananData, snapshotMentah(KUNCI_IZIN), () => "");
  return mentah !== "false";
}

export function aturIzinDataPeternak(izin: boolean): void {
  tulisJson(KUNCI_IZIN, izin);
}

/** Jarak garis lurus (km) antara dua titik koordinat, rumus haversine. */
export function hitungJarakKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
