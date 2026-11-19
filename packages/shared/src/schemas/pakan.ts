import { z } from "zod";
import { faseAyamSchema, jenisAyamSchema } from "./referensi.js";

export const pilihanBahanHargaSchema = z.object({
  bahanId: z.string().min(1),
  hargaPerKg: z.number().positive("Harga per kg harus lebih dari 0."),
});
export type PilihanBahanHarga = z.infer<typeof pilihanBahanHargaSchema>;

export const pakanUraiRequestSchema = z.object({
  teks: z
    .string()
    .trim()
    .min(2, "Tulis minimal satu bahan dan harganya.")
    .max(1000, "Teks terlalu panjang (maksimal 1.000 karakter)."),
  perangkatId: z.string().min(1).max(128).optional(),
});
export type PakanUraiRequest = z.infer<typeof pakanUraiRequestSchema>;

export const itemUraiPakanSchema = z.object({
  bahanId: z.string().min(1).nullable(),
  namaMentah: z.string().min(1),
  namaBahan: z.string().min(1),
  hargaPerKg: z.number().positive(),
  satuan: z.string().min(1).default("kg"),
});
export type ItemUraiPakan = z.infer<typeof itemUraiPakanSchema>;

export const pakanUraiResponseSchema = z.object({
  item: z.array(itemUraiPakanSchema),
  catatan: z.array(z.string()),
  sumber: z.enum(["llm", "mock"]),
  dariCache: z.boolean(),
});
export type PakanUraiResponse = z.infer<typeof pakanUraiResponseSchema>;

export const pakanHitungRequestSchema = z.object({
  jenisAyam: jenisAyamSchema.default("petelur"),
  fase: faseAyamSchema,
  bahan: z
    .array(pilihanBahanHargaSchema)
    .min(1, "Pilih minimal satu bahan pakan.")
    .max(30, "Maksimal 30 bahan dalam satu hitungan."),
  biayaSekarangPerKg: z.number().positive().optional(),
});
export type PakanHitungRequest = z.infer<typeof pakanHitungRequestSchema>;

export const komposisiItemSchema = z.object({
  bahanId: z.string().min(1),
  nama: z.string().min(1),
  persentase: z.number().min(0).max(100),
  kgPer100Kg: z.number().min(0).max(100),
  hargaPerKg: z.number().positive(),
  subtotalPer100Kg: z.number().min(0),
});
export type KomposisiItem = z.infer<typeof komposisiItemSchema>;

export const pemenuhanGiziItemSchema = z.object({
  zatGizi: z.string().min(1),
  label: z.string().min(1),
  satuan: z.string().min(1),
  nilai: z.number().min(0),
  batasMin: z.number().min(0).nullable(),
  batasMaks: z.number().min(0).nullable(),
  terpenuhi: z.boolean(),
  sumber: z.string().min(1),
});
export type PemenuhanGiziItem = z.infer<typeof pemenuhanGiziItemSchema>;

export const kekuranganGiziSchema = z.object({
  zatGizi: z.string().min(1),
  label: z.string().min(1),
  satuan: z.string().min(1),
  alasan: z.enum(["kurang", "berlebih", "bentrok"]),
  batasTarget: z.number().min(0),
  nilaiTercapai: z.number().min(0).optional(),
});
export type KekuranganGizi = z.infer<typeof kekuranganGiziSchema>;

export const saranBahanTambahanSchema = z.object({
  bahanId: z.string().min(1),
  nama: z.string().min(1),
  membantuZat: z.array(z.string().min(1)),
});
export type SaranBahanTambahan = z.infer<typeof saranBahanTambahanSchema>;

export const pakanHitungLayakSchema = z.object({
  status: z.literal("layak"),
  jenisAyam: jenisAyamSchema,
  fase: faseAyamSchema,
  komposisi: z.array(komposisiItemSchema),
  totalBiayaPer100Kg: z.number().min(0),
  biayaPerKg: z.number().min(0),
  selisihPerKg: z.number().optional(),
  pemenuhanGizi: z.array(pemenuhanGiziItemSchema),
  statusSolver: z.literal("optimal"),
  catatanData: z.string().min(1),
  isDemo: z.boolean(),
});
export type PakanHitungLayak = z.infer<typeof pakanHitungLayakSchema>;

export const pakanHitungTakLayakSchema = z.object({
  status: z.literal("tak_layak"),
  jenisAyam: jenisAyamSchema,
  fase: faseAyamSchema,
  pesan: z.string().min(1),
  zatBermasalah: z.array(kekuranganGiziSchema),
  saranBahan: z.array(saranBahanTambahanSchema),
  statusSolver: z.literal("tak_layak"),
  catatanData: z.string().min(1),
  isDemo: z.boolean(),
});
export type PakanHitungTakLayak = z.infer<typeof pakanHitungTakLayakSchema>;

export const pakanHitungResultSchema = z.discriminatedUnion("status", [
  pakanHitungLayakSchema,
  pakanHitungTakLayakSchema,
]);
export type PakanHitungResult = z.infer<typeof pakanHitungResultSchema>;

export const pakanJelaskanRequestSchema = z.object({
  hasilSolver: pakanHitungLayakSchema,
  perangkatId: z.string().min(1).max(128).optional(),
});
export type PakanJelaskanRequest = z.infer<typeof pakanJelaskanRequestSchema>;

export const pakanJelaskanResponseSchema = z.object({
  penjelasan: z.string().nullable(),
  terverifikasi: z.boolean(),
  ditolakAlasan: z.string().optional(),
  dariCache: z.boolean(),
  sumber: z.enum(["llm", "mock"]),
});
export type PakanJelaskanResponse = z.infer<typeof pakanJelaskanResponseSchema>;
