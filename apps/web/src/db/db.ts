import Dexie, { type Table } from "dexie";
import type { DataReferensi, PakanHitungLayak } from "@ternakin/shared";

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

export class TernakinDB extends Dexie {
  referensi!: Table<ReferensiLokal, string>;
  draf!: Table<DrafTeks, string>;
  komposisi!: Table<KomposisiTersimpan, string>;
  meta!: Table<MetaLokal, string>;

  constructor() {
    super("ternakin");
    this.version(1).stores({
      referensi: "kunci",
      draf: "kunci",
      komposisi: "kunci",
      meta: "kunci",
    });
  }
}

export const db = new TernakinDB();

export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const tersimpan = await db.meta.get("deviceId");
    if (tersimpan?.nilai) {
      return tersimpan.nilai;
    }
    const baru =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    await db.meta.put({ kunci: "deviceId", nilai: baru });
    return baru;
  } catch {
    return "dev-tamu";
  }
}
