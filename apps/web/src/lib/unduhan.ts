import { unduhanResponseSchema, type InfoUnduhanAndroid } from "@ternakin/shared";

let permintaan: Promise<InfoUnduhanAndroid | null> | null = null;

/** Info APK Android dari server, diminta sekali per halaman. null = tidak tersedia atau gagal. */
export function muatInfoAndroid(): Promise<InfoUnduhanAndroid | null> {
  permintaan ??= fetch("/v1/unduhan")
    .then(async (res) => (res.ok ? unduhanResponseSchema.parse(await res.json()).android : null))
    .catch(() => null);
  return permintaan;
}

/** Hanya untuk pengujian: lupakan info yang sudah dimuat. */
export function resetInfoUnduhan(): void {
  permintaan = null;
}

export function formatUkuranMb(byte: number | null): string | null {
  if (byte === null || byte <= 0) return null;
  return `${Math.max(1, Math.round(byte / (1024 * 1024)))} MB`;
}
