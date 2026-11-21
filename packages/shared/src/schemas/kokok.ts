import { z } from "zod";
import { jenisAyamSchema } from "./referensi.js";

export const urgensiKokokSchema = z.enum(["rendah", "sedang", "tinggi"]);
export type UrgensiKokok = z.infer<typeof urgensiKokokSchema>;

export const konteksKandangKokokSchema = z.object({
  namaKandang: z.string().max(100).optional(),
  jenisAyam: jenisAyamSchema.default("petelur"),
  umurMinggu: z.number().int().min(0).max(200).nullable().optional(),
  jumlahEkor: z.number().int().min(0).nullable().optional(),
  lokasi: z.string().max(120).nullable().optional(),
  peringatan7Hari: z.array(z.string().max(240)).max(10).default([]),
});
export type KonteksKandangKokok = z.infer<typeof konteksKandangKokokSchema>;

export const kokokTriaseRequestSchema = z.object({
  gejala: z
    .string()
    .trim()
    .min(3, "Ceritakan gejala ayam minimal 3 karakter.")
    .max(1000, "Deskripsi gejala terlalu panjang (maksimal 1.000 karakter)."),
  sejakKapan: z.string().trim().max(100).optional(),
  perangkatId: z.string().min(1).max(128).optional(),
  konteksKandang: konteksKandangKokokSchema.optional(),
});
export type KokokTriaseRequest = z.infer<typeof kokokTriaseRequestSchema>;

export const sumberPanduanSchema = z.object({
  id: z.string().min(1),
  judul: z.string().min(1),
  sumber: z.string().min(1),
  versi: z.string().min(1),
  ringkasanKutipan: z.string().min(1),
});
export type SumberPanduan = z.infer<typeof sumberPanduanSchema>;

export const ringkasanKasusSchema = z.object({
  kandang: z.string().min(1),
  jenisAyam: jenisAyamSchema,
  umurMinggu: z.number().int().min(0).nullable(),
  populasiEkor: z.number().int().min(0).nullable(),
  lokasi: z.string().nullable(),
  gejala: z.string().min(1),
  sejakKapan: z.string().min(1),
  peringatan7Hari: z.array(z.string()),
  urgensi: urgensiKokokSchema,
});
export type RingkasanKasus = z.infer<typeof ringkasanKasusSchema>;

export const kokokTriaseResponseSchema = z.object({
  id: z.string().uuid(),
  urgensi: urgensiKokokSchema,
  alasanUrgensi: z.string().min(1),
  /** Jawaban langsung dalam bahasa sehari-hari (opsional: riwayat lama belum punya). */
  jawaban: z.string().optional(),
  tujuanRujukan: z.string().nullable(),
  panduanUmum: z.array(z.string().min(1)).min(1),
  sumber: z.array(sumberPanduanSchema),
  ringkasanKasus: ringkasanKasusSchema,
  tidakTahu: z.boolean(),
  terfilter: z.boolean(),
  catatanFilter: z.string().optional(),
  penafian: z.string().min(1),
  isUjiCoba: z.boolean().default(true),
  dibuatPada: z.string().min(1),
});
export type KokokTriaseResponse = z.infer<typeof kokokTriaseResponseSchema>;

export const percakapanKokokLokalSchema = z.object({
  id: z.string().uuid(),
  pertanyaan: z.string().min(1),
  sejakKapan: z.string().optional(),
  jawaban: kokokTriaseResponseSchema,
  dibuatPada: z.string().min(1),
});
export type PercakapanKokokLokal = z.infer<typeof percakapanKokokLokalSchema>;

/* ---------- Obrolan bebas dengan Kokok (popup & halaman) ---------- */

export const aksiObrolanSchema = z.enum([
  "cek_gejala",
  "hitung_pakan",
  "lihat_investasi",
  "hubungi_tim",
  "tidak_ada",
]);
export type AksiObrolan = z.infer<typeof aksiObrolanSchema>;

export const pesanRiwayatSchema = z.object({
  dari: z.enum(["anda", "kokok"]),
  teks: z.string().trim().min(1).max(800),
});
export type PesanRiwayat = z.infer<typeof pesanRiwayatSchema>;

export const kokokObrolanRequestSchema = z.object({
  pesan: z
    .string()
    .trim()
    .min(1, "Tulis pesan untuk Kokok.")
    .max(500, "Pesan terlalu panjang (maksimal 500 karakter)."),
  /** Beberapa pesan terakhir agar Kokok paham konteks; paling banyak 10. */
  riwayat: z.array(pesanRiwayatSchema).max(10).default([]),
  konteks: z.enum(["landing", "aplikasi"]).default("landing"),
  perangkatId: z.string().min(1).max(128).optional(),
});
export type KokokObrolanRequest = z.infer<typeof kokokObrolanRequestSchema>;

export const kokokObrolanResponseSchema = z.object({
  balasan: z.string().min(1),
  aksi: aksiObrolanSchema,
  /** Diisi bila pesan berisi keluhan ayam; null untuk sapaan atau pertanyaan aplikasi. */
  urgensi: urgensiKokokSchema.nullable(),
  sumber: z.array(sumberPanduanSchema),
  /** "llm" = ditulis AI; "cadangan" = AI tidak tersedia/ditolak filter. */
  sumberJawaban: z.enum(["llm", "cadangan"]),
  terfilter: z.boolean(),
});
export type KokokObrolanResponse = z.infer<typeof kokokObrolanResponseSchema>;
