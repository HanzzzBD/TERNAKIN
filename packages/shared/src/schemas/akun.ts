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
  /** Kosong bila akun tidak memakai email. */
  emailTersamar: z.string(),
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

/* ---------- Masuk dengan email + kata sandi, dan Google ---------- */

const emailSchema = z.email("Alamat email belum benar.").trim().toLowerCase().max(120);
const kodeEnamAngka = z
  .string()
  .trim()
  // Regex literal (bukan string) agar \d tidak hilang karena escape; panjang = PANJANG_KODE_OTP.
  .regex(/^\d{6}$/, "Kode berisi 6 angka.");
const sandiBaruSchema = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter.")
  .max(128, "Kata sandi terlalu panjang.");
const perangkatIdSchema = z.string().trim().min(1).max(128).optional();

export const daftarEmailRequestSchema = z.object({
  nama: z.string().trim().min(2, "Nama minimal 2 huruf.").max(60),
  email: emailSchema,
  sandi: sandiBaruSchema,
  peran: peranAkunSchema,
  perangkatId: perangkatIdSchema,
});
export type DaftarEmailRequest = z.infer<typeof daftarEmailRequestSchema>;

/** Respons setelah kode dikirim ke email (daftar, kirim ulang, lupa sandi). */
export const kodeEmailResponseSchema = z.object({
  ok: z.literal(true),
  emailTersamar: z.string().min(1),
  berlakuDetik: z.number().int().positive(),
  kirimUlangDetik: z.number().int().min(0),
  /** Hanya pada mode demo (SMTP belum diatur, bukan production). */
  kodeDemo: z.string().optional(),
});
export type KodeEmailResponse = z.infer<typeof kodeEmailResponseSchema>;

export const verifikasiEmailRequestSchema = z.object({
  email: emailSchema,
  kode: kodeEnamAngka,
  perangkatId: perangkatIdSchema,
});
export type VerifikasiEmailRequest = z.infer<typeof verifikasiEmailRequestSchema>;

export const emailSajaRequestSchema = z.object({ email: emailSchema });
export type EmailSajaRequest = z.infer<typeof emailSajaRequestSchema>;

export const masukEmailRequestSchema = z.object({
  email: emailSchema,
  sandi: z.string().min(1, "Isi kata sandi.").max(128),
  perangkatId: perangkatIdSchema,
});
export type MasukEmailRequest = z.infer<typeof masukEmailRequestSchema>;

export const resetSandiRequestSchema = z.object({
  email: emailSchema,
  kode: kodeEnamAngka,
  sandiBaru: sandiBaruSchema,
  perangkatId: perangkatIdSchema,
});
export type ResetSandiRequest = z.infer<typeof resetSandiRequestSchema>;

export const masukGoogleRequestSchema = z.object({
  /** ID token (JWT) dari Google Identity Services. */
  credential: z.string().min(20).max(4096),
  peran: peranAkunSchema.optional(),
  perangkatId: perangkatIdSchema,
});
export type MasukGoogleRequest = z.infer<typeof masukGoogleRequestSchema>;

/** Cara masuk yang tersedia di server ini, untuk menyusun halaman Masuk. */
export const konfigurasiAuthResponseSchema = z.object({
  googleClientId: z.string().nullable(),
  whatsapp: z.boolean(),
  email: z.enum(["smtp", "demo", "nonaktif"]),
  akunDemo: z.boolean(),
});
export type KonfigurasiAuthResponse = z.infer<typeof konfigurasiAuthResponseSchema>;
