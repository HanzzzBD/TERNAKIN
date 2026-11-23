import {
  kokokObrolanResponseSchema,
  type KokokObrolanResponse,
  type PesanRiwayat,
} from "@ternakin/shared";
import { getOrCreateDeviceId } from "../db/db";
import { setelAkunLokal } from "./akunCache";

/** Berapa pesan terakhir yang dikirim agar Kokok paham konteks (batas server: 10). */
const MAKS_RIWAYAT = 8;

/**
 * Kirim pesan ke Kokok (POST /v1/kokok/obrolan). Balasan ditulis AI di server dengan penjaga
 * boleh/jangan. Melempar galat bila offline atau server tidak bisa dihubungi, agar pemanggil
 * bisa memakai balasan cadangan.
 */
export async function kirimPesanKokok(
  pesan: string,
  riwayat: readonly PesanRiwayat[],
  konteks: "landing" | "aplikasi",
): Promise<KokokObrolanResponse> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("offline");
  }
  const perangkatId = await getOrCreateDeviceId();
  const res = await fetch("/v1/kokok/obrolan", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-device-id": perangkatId },
    body: JSON.stringify({
      pesan,
      konteks,
      perangkatId,
      riwayat: riwayat
        .slice(-MAKS_RIWAYAT)
        .map((r) => ({ dari: r.dari, teks: r.teks.slice(0, 800) })),
    }),
  });
  // Kokok khusus akun: sesi berakhir di server, jadi status masuk lokal ikut dihapus.
  if (res.status === 401) setelAkunLokal(null);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return kokokObrolanResponseSchema.parse(await res.json());
}
