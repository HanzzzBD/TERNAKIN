import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { dataReferensiSchema, type DataReferensi } from "@ternakin/shared";
import { panggilApi } from "./api";

/**
 * Data referensi (bahan, kebutuhan gizi SNI, ambang peringatan) untuk solver pakan dan
 * peringatan dini yang berjalan di HP tanpa sinyal. Urutan sama dengan web:
 * server → simpanan lokal → berkas bawaan.
 */

const KUNCI = "tk_referensi_v1";
const STALE_BAWAAN = 7;

export type SumberReferensi = "server" | "lokal" | "bawaan";

function urai(mentah: unknown): DataReferensi | null {
  const langsung = dataReferensiSchema.safeParse(mentah);
  if (langsung.success) return langsung.data;
  if (typeof mentah === "object" && mentah !== null) {
    // Berkas bawaan tidak menyertakan staleDays dari env server.
    const denganBawaan = dataReferensiSchema.safeParse({
      staleDays: STALE_BAWAAN,
      ...(mentah as Record<string, unknown>),
    });
    if (denganBawaan.success) return denganBawaan.data;
  }
  return null;
}

async function bacaLokal(): Promise<DataReferensi | null> {
  try {
    const teks = await AsyncStorage.getItem(KUNCI);
    return teks ? urai(JSON.parse(teks)) : null;
  } catch {
    return null;
  }
}

function bacaBawaan(): DataReferensi | null {
  // Berkas yang sama dengan cadangan PWA web, ikut dibundel ke APK.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return urai(require("../../../web/public/data/referensi-bawaan.json"));
}

let cache: { data: DataReferensi; sumber: SumberReferensi } | null = null;
let permintaan: Promise<{ data: DataReferensi; sumber: SumberReferensi } | null> | null = null;

export function muatReferensi(paksa = false) {
  if (cache && !paksa) return Promise.resolve(cache);
  if (permintaan && !paksa) return permintaan;
  permintaan = (async () => {
    try {
      const dariServer = urai(await panggilApi("/v1/referensi", { batasWaktu: 8_000 }));
      if (dariServer) {
        void AsyncStorage.setItem(KUNCI, JSON.stringify(dariServer)).catch(() => {});
        cache = { data: dariServer, sumber: "server" };
        return cache;
      }
    } catch {
      // Offline: lanjut ke simpanan lokal.
    }
    const lokal = await bacaLokal();
    if (lokal) {
      cache = { data: lokal, sumber: "lokal" };
      return cache;
    }
    const bawaan = bacaBawaan();
    if (bawaan) {
      cache = { data: bawaan, sumber: "bawaan" };
      return cache;
    }
    return null;
  })().finally(() => {
    permintaan = null;
  });
  return permintaan;
}

export function useReferensi() {
  const [hasil, setHasil] = useState(cache);
  const [memuat, setMemuat] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let aktif = true;
    void muatReferensi().then((r) => {
      if (!aktif) return;
      setHasil(r);
      setMemuat(false);
    });
    return () => {
      aktif = false;
    };
  }, []);

  async function muatUlang() {
    setMemuat(true);
    const r = await muatReferensi(true);
    setHasil(r);
    setMemuat(false);
  }

  return { referensi: hasil?.data ?? null, sumber: hasil?.sumber ?? null, memuat, muatUlang };
}
