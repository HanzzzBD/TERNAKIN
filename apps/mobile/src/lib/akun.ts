import { useEffect, useState } from "react";
import { Platform, TurboModuleRegistry } from "react-native";
import {
  konfigurasiAuthResponseSchema,
  type KonfigurasiAuthResponse,
  type PeranAkun,
} from "@ternakin/shared";
import { panggilApi } from "./api";

/** Info tampilan akun demo bersama (sama dengan web: apps/web/src/lib/akunDemo.ts). */
export const AKUN_DEMO_TAMPIL: Record<PeranAkun, { nama: string; email: string; sandi: string }> = {
  pengguna: { nama: "Rani", email: "pengguna@demo.ternakin.id", sandi: "demo1234" },
  peternak: { nama: "Pak Dedi S.", email: "peternak@demo.ternakin.id", sandi: "demo1234" },
};

export const DOMAIN_DEMO = "@demo.ternakin.id";

export const LABEL_PERAN: Record<PeranAkun, string> = { peternak: "Peternak", pengguna: "Pengguna" };

/** Bila server tak terjangkau: tampilkan email dan WhatsApp tanpa Google (sama dengan web). */
const KONFIGURASI_CADANGAN: KonfigurasiAuthResponse = {
  googleClientId: null,
  whatsapp: true,
  email: "smtp",
  akunDemo: true,
};

let cache: Promise<KonfigurasiAuthResponse> | null = null;

/** Cara masuk yang aktif di server (Google, WhatsApp, email, akun demo). */
export function useKonfigurasiAuth(): KonfigurasiAuthResponse | null {
  const [nilai, setNilai] = useState<KonfigurasiAuthResponse | null>(null);
  useEffect(() => {
    let aktif = true;
    cache ??= panggilApi("/v1/auth/konfigurasi", {
      skema: konfigurasiAuthResponseSchema,
      batasWaktu: 8_000,
    }).catch((err: unknown) => {
      cache = null;
      throw err;
    });
    cache
      .then((k) => aktif && setNilai(k))
      .catch(() => aktif && setNilai(KONFIGURASI_CADANGAN));
    return () => {
      aktif = false;
    };
  }, []);
  return nilai;
}

/* ---------- Masuk dengan Google (native) ---------- */

/**
 * Modul native Google Sign-In baru ada setelah APK dibangun ulang. APK lama tidak memilikinya,
 * dan paket ini melempar galat saat diimpor bila modulnya tidak ada, jadi dicek dulu.
 */
export function googleTersedia(): boolean {
  if (Platform.OS !== "android") return false;
  try {
    return TurboModuleRegistry.get("RNGoogleSignin") != null;
  } catch {
    return false;
  }
}

export type HasilGoogle = { status: "ok"; idToken: string } | { status: "batal" };

/**
 * Membuka pemilih akun Google dan mengembalikan ID token.
 * `webClientId` = GOOGLE_CLIENT_ID server, sehingga audiens token sama dengan tombol Google di web
 * dan server tidak perlu diubah.
 */
export async function ambilTokenGoogle(webClientId: string): Promise<HasilGoogle> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const modul = require("@react-native-google-signin/google-signin") as typeof import("@react-native-google-signin/google-signin");
  const { GoogleSignin, isCancelledResponse, isErrorWithCode, statusCodes } = modul;

  GoogleSignin.configure({ webClientId });
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Keluar dulu agar pemilih akun selalu muncul (HP bisa berisi beberapa akun Google).
    await GoogleSignin.signOut().catch(() => null);
    const res = await GoogleSignin.signIn();
    if (isCancelledResponse(res)) return { status: "batal" };
    const idToken = res.data.idToken;
    if (!idToken) throw new Error("Google tidak mengirim token.");
    return { status: "ok", idToken };
  } catch (err) {
    if (isErrorWithCode(err)) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) return { status: "batal" };
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error("Layanan Google Play di HP ini belum tersedia atau perlu diperbarui.", {
          cause: err,
        });
      }
      if (err.code === statusCodes.IN_PROGRESS) {
        throw new Error("Proses masuk Google sedang berjalan.", { cause: err });
      }
    }
    throw new Error("Masuk dengan Google gagal. Coba lagi atau pakai email.", { cause: err });
  }
}
