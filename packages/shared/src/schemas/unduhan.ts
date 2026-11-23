import { z } from "zod";

/** Alamat unduhan APK Android di server Ternakin (satu origin dengan web). */
export const URL_UNDUH_ANDROID = "/unduh/ternakin.apk";

export const infoUnduhanAndroidSchema = z.object({
  /** false bila APK belum dipasang di server (tombol unduh disembunyikan). */
  tersedia: z.boolean(),
  url: z.string().min(1),
  ukuranByte: z.number().int().nonnegative().nullable(),
  /** Waktu APK terakhir diganti (ISO 8601). */
  diperbaruiPada: z.string().nullable(),
});
export type InfoUnduhanAndroid = z.infer<typeof infoUnduhanAndroidSchema>;

/** GET /v1/unduhan */
export const unduhanResponseSchema = z.object({
  android: infoUnduhanAndroidSchema,
});
export type UnduhanResponse = z.infer<typeof unduhanResponseSchema>;
