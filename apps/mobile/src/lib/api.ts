import type { z } from "zod";
import { ambilPerangkatId, ambilToken } from "./penyimpanan";

/**
 * Diisi saat build (eas.json), oleh scripts/update.mjs saat EAS Update, atau oleh scripts/dev.mjs
 * (tunnel laptop) saat pengembangan. Bawaan = server produksi, agar build/update yang lupa mengisi
 * variabel ini tidak pernah mengarah ke tunnel laptop.
 */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "https://ternakin.code-xpert.my.id"
).replace(/\/+$/, "");

export class GalatApi extends Error {
  constructor(
    readonly status: number,
    readonly kode: string,
    pesan: string,
    /** Data tambahan dari server, misalnya tungguDetik atau info kode verifikasi email. */
    readonly rinci?: Record<string, unknown>,
  ) {
    super(pesan);
    this.name = "GalatApi";
  }
}

interface OpsiPermintaan<T> {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Skema zod dari @ternakin/shared untuk memvalidasi respons. */
  skema?: z.ZodType<T>;
  /** Batas waktu (ms). Kokok memakai AI sehingga butuh lebih lama. */
  batasWaktu?: number;
}

/**
 * Memanggil API Ternakin dengan header aplikasi mobile:
 * - X-Ternakin-Klien: mobile → server mengembalikan token sesi di body saat masuk.
 * - Authorization: Bearer <token> → sesi akun (pengganti cookie di web).
 * - X-Device-Id → pemilik data mode tamu.
 */
export async function panggilApi<T = unknown>(
  path: string,
  opsi: OpsiPermintaan<T> = {},
): Promise<T> {
  const [token, perangkatId] = await Promise.all([ambilToken(), ambilPerangkatId()]);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Ternakin-Klien": "mobile",
    "X-Device-Id": perangkatId,
  };
  if (opsi.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const pengendali = new AbortController();
  const pewaktu = setTimeout(() => pengendali.abort(), opsi.batasWaktu ?? 20_000);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opsi.method ?? (opsi.body !== undefined ? "POST" : "GET"),
      headers,
      body: opsi.body !== undefined ? JSON.stringify(opsi.body) : undefined,
      signal: pengendali.signal,
    });
  } catch {
    throw new GalatApi(
      0,
      "JARINGAN",
      "Tidak tersambung ke server Ternakin. Periksa sinyal lalu coba lagi.",
    );
  } finally {
    clearTimeout(pewaktu);
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const galat = (data ?? {}) as { kode?: string; pesan?: string; rinci?: Record<string, unknown> };
    throw new GalatApi(
      res.status,
      galat.kode ?? "GALAT_SERVER",
      galat.pesan ?? "Server sedang bermasalah. Coba lagi beberapa saat lagi.",
      galat.rinci && typeof galat.rinci === "object" ? galat.rinci : undefined,
    );
  }
  return opsi.skema ? opsi.skema.parse(data) : (data as T);
}

export function pesanGalat(err: unknown): string {
  if (err instanceof GalatApi) return err.message;
  return "Terjadi kesalahan. Coba lagi.";
}
