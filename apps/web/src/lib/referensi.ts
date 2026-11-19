import { dataReferensiSchema, type DataReferensi } from "@ternakin/shared";
import { db } from "../db/db";

const KUNCI_REFERENSI = "utama";
const DEFAULT_STALE_DAYS = 7;

function parseDataReferensi(raw: unknown): DataReferensi | null {
  const langsung = dataReferensiSchema.safeParse(raw);
  if (langsung.success) return langsung.data;

  // Berkas seed bawaan tidak selalu menyertakan staleDays dari env server.
  if (typeof raw === "object" && raw !== null) {
    const denganDefault = dataReferensiSchema.safeParse({
      staleDays: DEFAULT_STALE_DAYS,
      ...(raw as Record<string, unknown>),
    });
    if (denganDefault.success) return denganDefault.data;
  }

  return null;
}

export async function muatReferensiPakan(isOnline: boolean): Promise<{
  data: DataReferensi | null;
  sumber: "server" | "lokal" | "bawaan" | "kosong";
}> {
  // 1. Cek simpanan lokal Dexie dulu agar langsung tersedia saat offline.
  let lokal: DataReferensi | null = null;
  try {
    const tersimpan = await db.referensi.get(KUNCI_REFERENSI);
    if (tersimpan) {
      const valid = parseDataReferensi(tersimpan.data);
      if (valid) lokal = valid;
    }
  } catch {
    // Abaikan bila IndexedDB tidak tersedia (misalnya di jsdom tanpa fake-indexeddb)
  }

  // 2. Bila daring, ambil versi terbaru dari /v1/referensi lalu simpan ke Dexie.
  if (isOnline) {
    try {
      const res = await fetch("/v1/referensi");
      if (res.ok) {
        const json: unknown = await res.json();
        const valid = parseDataReferensi(json);
        if (valid) {
          try {
            await db.referensi.put({
              kunci: KUNCI_REFERENSI,
              data: valid,
              diambilPada: new Date().toISOString(),
            });
          } catch {
            // Abaikan bila penyimpanan lokal tidak tersedia
          }
          return { data: valid, sumber: "server" };
        }
      }
    } catch {
      // Lanjut ke cache lokal atau berkas bawaan
    }
  }

  if (lokal) {
    return { data: lokal, sumber: "lokal" };
  }

  // 3. Cadangan berkas JSON bawaan (di-precache Workbox) bila server belum pernah terhubung.
  try {
    const res = await fetch("/data/referensi-bawaan.json");
    if (res.ok) {
      const json: unknown = await res.json();
      const valid = parseDataReferensi(json);
      if (valid) {
        try {
          await db.referensi.put({
            kunci: KUNCI_REFERENSI,
            data: valid,
            diambilPada: new Date().toISOString(),
          });
        } catch {
          // Abaikan
        }
        return { data: valid, sumber: "bawaan" };
      }
    }
  } catch {
    // Tetap kembalikan kosong agar layar menampilkan kondisi galat/kosong dengan jelas
  }

  return { data: null, sumber: "kosong" };
}
