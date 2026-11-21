import { z } from "zod";
import { peranAkunSchema } from "./investasi.js";

/** Kontrak API akun: masuk dengan nomor WhatsApp dan kode OTP (PRD F5). */

export const PANJANG_KODE_OTP = 6;

export const mintaOtpRequestSchema = z.object({
  nomorPonsel: z.string().trim().min(8).max(20),
});
export type MintaOtpRequest = z.infer<typeof mintaOtpRequestSchema>;

export const mintaOtpResponseSchema = z.object({
  ok: z.literal(true),
  nomorTersamar: z.string().min(1),
  berlakuDetik: z.number().int().positive(),
  kirimUlangDetik: z.number().int().min(0),
  /** Hanya ada pada mode demo (tanpa token Fonnte, bukan production). */
  kodeDemo: z.string().optional(),
});
export type MintaOtpResponse = z.infer<typeof mintaOtpResponseSchema>;

export const verifikasiOtpRequestSchema = z.object({
  nomorPonsel: z.string().trim().min(8).max(20),
  kode: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${PANJANG_KODE_OTP}}$`), "Kode berisi 6 angka."),
  /** Perangkat yang datanya dipindahkan dari mode tamu ke akun. */
  perangkatId: z.string().trim().min(1).max(128).optional(),
  /** Peran yang dipilih saat masuk; hanya dipakai bila akun belum punya peran. */
  peran: peranAkunSchema.optional(),
});
export type VerifikasiOtpRequest = z.infer<typeof verifikasiOtpRequestSchema>;

export const penggunaSayaSchema = z.object({
  id: z.string().min(1),
  /** Kosong untuk akun demo yang tidak memakai nomor. */
  nomorTersamar: z.string(),
  nama: z.string().nullable(),
  /** null = belum memilih peran (harus memilih sebelum memakai aplikasi). */
  peran: peranAkunSchema.nullable(),
  isDemo: z.boolean(),
});
export type PenggunaSaya = z.infer<typeof penggunaSayaSchema>;

export const sesiAkunResponseSchema = z.object({
  pengguna: penggunaSayaSchema,
  /** Jumlah kandang tamu yang dipindahkan ke akun saat masuk. */
  kandangDipindahkan: z.number().int().min(0).optional(),
});
export type SesiAkunResponse = z.infer<typeof sesiAkunResponseSchema>;

export const aturPeranRequestSchema = z.object({ peran: peranAkunSchema });
export type AturPeranRequest = z.infer<typeof aturPeranRequestSchema>;

export const masukDemoRequestSchema = z.object({ peran: peranAkunSchema });
export type MasukDemoRequest = z.infer<typeof masukDemoRequestSchema>;
