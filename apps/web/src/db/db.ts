import Dexie, { type Table } from "dexie";
import type {
  CatatanHarian,
  DataReferensi,
  ItemOutboxSync,
  Kandang,
  PakanHitungLayak,
  Toko,
} from "@ternakin/shared";

export type SyncState = "pending" | "synced";

export type KandangLokal = Kandang & { syncState: SyncState };
export type CatatanLokal = CatatanHarian & { syncState: SyncState };

export interface TokoLokal {
  id: string;
  toko: Toko;
  fetchedAt: string;
  staleDays: number;
}

export interface ReferensiLokal {
  kunci: string;
  data: DataReferensi;
  diambilPada: string;
}

export interface DrafTeks {
  kunci: string;
  teks: string;
  diubahPada: string;
}

export interface KomposisiTersimpan {
  kunci: string;
  hasil: PakanHitungLayak;
  disimpanPada: string;
}

export interface MetaLokal {
  kunci: string;
  nilai: string;
}

export type ItemOutboxLokal = ItemOutboxSync & { seq?: number };

export class TernakinDB extends Dexie {
  kandang!: Table<KandangLokal, string>;
  catatan!: Table<CatatanLokal, string>;
  referensi!: Table<ReferensiLokal, string>;
  toko!: Table<TokoLokal, string>;
  draf!: Table<DrafTeks, string>;
  komposisi!: Table<KomposisiTersimpan, string>;
  meta!: Table<MetaLokal, string>;
  outbox!: Table<ItemOutboxLokal, number>;

  constructor() {
    super("ternakin");
    this.version(1).stores({
      referensi: "kunci",
      draf: "kunci",
      komposisi: "kunci",
      meta: "kunci",
    });
    this.version(2).stores({
      kandang: "id",
      catatan: "id, kandangId, tanggal, syncState",
      referensi: "kunci",
      draf: "kunci",
      komposisi: "kunci",
      meta: "kunci",
      outbox: "++seq, opId, jenis",
    });
    this.version(3).stores({
      kandang: "id",
      catatan: "id, kandangId, tanggal, syncState",
      referensi: "kunci",
      toko: "id, fetchedAt",
      draf: "kunci",
      komposisi: "kunci",
      meta: "kunci",
      outbox: "++seq, opId, jenis",
    });
  }
}

export const db = new TernakinDB();

export function createClientUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 deterministik jika randomUUID tidak tersedia
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const tersimpan = await db.meta.get("deviceId");
    if (tersimpan?.nilai) {
      return tersimpan.nilai;
    }
    const baru = createClientUuid();
    await db.meta.put({ kunci: "deviceId", nilai: baru });
    return baru;
  } catch {
    return "00000000-0000-4000-8000-000000000000";
  }
}

const SRC_STORAGE_KEY = "tk.src";

export function captureSrcParam(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const src = params.get("src")?.trim();
    if (src) {
      window.localStorage.setItem(SRC_STORAGE_KEY, src.slice(0, 64));
    }
  } catch {
    // Abaikan jika localStorage dibatasi
  }
}

export function getSavedSrcParam(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(SRC_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}
