import { daftarTokoResponseSchema, type Toko } from "@ternakin/shared";
import { db } from "../db/db";

const DEFAULT_STALE_DAYS = 7;

export interface HasilMuatToko {
  toko: Toko[];
  staleDays: number;
  fetchedAt: string | null;
  dariCache: boolean;
}

export async function muatDaftarToko(isOnline: boolean): Promise<HasilMuatToko> {
  let lokalToko: Toko[] = [];
  let lokalFetchedAt: string | null = null;
  let lokalStaleDays = DEFAULT_STALE_DAYS;

  try {
    const tersimpan = await db.toko.toArray();
    if (tersimpan.length > 0) {
      lokalToko = tersimpan.map((row) => row.toko);
      lokalFetchedAt = tersimpan[0]?.fetchedAt ?? null;
      lokalStaleDays = tersimpan[0]?.staleDays ?? DEFAULT_STALE_DAYS;
    }
  } catch {
    // Abaikan bila IndexedDB tidak tersedia
  }

  if (isOnline) {
    try {
      const res = await fetch("/v1/toko");
      if (res.ok) {
        const json: unknown = await res.json();
        const parsed = daftarTokoResponseSchema.safeParse(json);
        if (parsed.success) {
          try {
            await db.transaction("rw", db.toko, async () => {
              await db.toko.clear();
              for (const t of parsed.data.toko) {
                await db.toko.put({
                  id: t.id,
                  toko: t,
                  fetchedAt: parsed.data.diambilPada,
                  staleDays: parsed.data.staleDays,
                });
              }
            });
          } catch {
            // Abaikan
          }
          return {
            toko: parsed.data.toko,
            staleDays: parsed.data.staleDays,
            fetchedAt: parsed.data.diambilPada,
            dariCache: false,
          };
        }
      }
    } catch {
      // Lanjut pakai cache lokal
    }
  }

  return {
    toko: lokalToko,
    staleDays: lokalStaleDays,
    fetchedAt: lokalFetchedAt,
    dariCache: true,
  };
}
