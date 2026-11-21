import { useCallback, useEffect, useState } from "react";
import {
  daftarPeluangResponseSchema,
  minatSayaResponseSchema,
  peluangInvestasiSchema,
  type AjuanPeluangRequest,
  type MinatSayaItem,
  type PeluangInvestasi,
} from "@ternakin/shared";
import { z } from "zod";
import { GalatAkun, keGalat } from "./akun";

/**
 * Klien API Modul 5 — Investasi ternak (SIMULASI, tanpa uang sungguhan).
 * Data selalu dari server; setelah mengubah data, semua hook memuat ulang lewat satu event.
 */

const EVENT_UBAH = "tk:investasi-berubah";
const PESAN_OFFLINE = "Data investasi butuh sinyal internet. Coba lagi saat tersambung.";

const responsPeluangSchema = z.object({ peluang: peluangInvestasiSchema });

function umumkanPerubahan(): void {
  window.dispatchEvent(new Event(EVENT_UBAH));
}

async function minta<T>(url: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new GalatAkun(PESAN_OFFLINE);
  }
  if (!res.ok) throw await keGalat(res);
  return schema.parse(await res.json());
}

function kirim<T>(url: string, method: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
  return minta(url, schema, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

interface StatusMuat<T> {
  data: T | null;
  galat: string | null;
  sedangMuat: boolean;
}

/** Memuat data dan memuat ulang otomatis saat data investasi berubah. */
function useMuat<T>(pemuat: (() => Promise<T>) | null): StatusMuat<T> {
  const [status, setStatus] = useState<StatusMuat<T>>({
    data: null,
    galat: null,
    sedangMuat: pemuat !== null,
  });

  useEffect(() => {
    if (!pemuat) return;
    let aktif = true;
    const muat = () => {
      setStatus((s) => ({ ...s, sedangMuat: true }));
      pemuat()
        .then((data) => aktif && setStatus({ data, galat: null, sedangMuat: false }))
        .catch((err: unknown) => {
          if (!aktif) return;
          const pesan = err instanceof Error ? err.message : PESAN_OFFLINE;
          setStatus((s) => ({ ...s, galat: pesan, sedangMuat: false }));
        });
    };
    muat();
    window.addEventListener(EVENT_UBAH, muat);
    return () => {
      aktif = false;
      window.removeEventListener(EVENT_UBAH, muat);
    };
  }, [pemuat]);

  return status;
}

export function useDaftarPeluang(): StatusMuat<PeluangInvestasi[]> {
  const pemuat = useCallback(
    () => minta("/v1/investasi/peluang", daftarPeluangResponseSchema).then((r) => r.peluang),
    [],
  );
  return useMuat(pemuat);
}

export function usePeluang(id: string | undefined): StatusMuat<PeluangInvestasi> {
  const pemuat = useCallback(
    () =>
      minta(`/v1/investasi/peluang/${encodeURIComponent(id ?? "")}`, responsPeluangSchema).then(
        (r) => r.peluang,
      ),
    [id],
  );
  return useMuat(id ? pemuat : null);
}

/** Minat titip milik akun Pengguna yang sedang masuk. `aktif=false` untuk peran lain. */
export function useMinatSaya(aktif: boolean): StatusMuat<MinatSayaItem[]> {
  const pemuat = useCallback(
    () => minta("/v1/investasi/minat-saya", minatSayaResponseSchema).then((r) => r.minat),
    [],
  );
  return useMuat(aktif ? pemuat : null);
}

export async function catatMinatTitip(
  peluangId: string,
  nominal: number,
): Promise<PeluangInvestasi> {
  const hasil = await kirim(
    `/v1/investasi/peluang/${encodeURIComponent(peluangId)}/minat`,
    "POST",
    { nominal },
    responsPeluangSchema,
  );
  umumkanPerubahan();
  return hasil.peluang;
}

export async function ajukanPeluang(ajuan: AjuanPeluangRequest): Promise<PeluangInvestasi> {
  const hasil = await kirim("/v1/investasi/peluang", "POST", ajuan, responsPeluangSchema);
  umumkanPerubahan();
  return hasil.peluang;
}

export async function aturIzinDataPeluang(
  peluangId: string,
  izinData: boolean,
): Promise<PeluangInvestasi> {
  const hasil = await kirim(
    `/v1/investasi/peluang/${encodeURIComponent(peluangId)}/izin`,
    "PUT",
    { izinData },
    responsPeluangSchema,
  );
  umumkanPerubahan();
  return hasil.peluang;
}
