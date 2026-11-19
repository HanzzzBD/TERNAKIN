import { z } from "zod";
import { jenisAyamSchema } from "./referensi.js";

export const ambangPeringatanSchema = z.object({
  jenisAyam: jenisAyamSchema,
  kematianPersenMaks: z.number().positive(),
  suhuMinC: z.number(),
  suhuMaksC: z.number(),
  produksiTelurMinPersen: z.number().min(0).max(100),
  sumber: z.string().min(1),
  isDemo: z.boolean().default(true),
});
export type AmbangPeringatan = z.infer<typeof ambangPeringatanSchema>;

export const kandangSchema = z.object({
  id: z.string().uuid(),
  perangkatId: z.string().min(1).max(128).optional(),
  nama: z.string().trim().min(1, "Nama kandang wajib diisi.").max(100),
  jenisAyam: jenisAyamSchema.default("petelur"),
  jumlahEkor: z.number().int().min(0, "Jumlah ayam tidak boleh negatif."),
  umurMinggu: z.number().int().min(0).max(200).nullable().optional(),
  lokasi: z.string().trim().max(120).nullable().optional(),
  bahanTersedia: z.array(z.string().min(1)).default([]),
  diubahPada: z.string().min(1),
});
export type Kandang = z.infer<typeof kandangSchema>;

export const kandangCreateRequestSchema = kandangSchema.omit({ perangkatId: true }).extend({
  id: z.string().uuid().optional(),
  diubahPada: z.string().min(1).optional(),
  perangkatId: z.string().min(1).max(128).optional(),
  src: z.string().max(64).optional(),
});
export type KandangCreateRequest = z.infer<typeof kandangCreateRequestSchema>;

const TANGGAL_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const catatanHarianSchema = z.object({
  id: z.string().uuid(),
  kandangId: z.string().uuid(),
  tanggal: z.string().regex(TANGGAL_REGEX, "Format tanggal harus YYYY-MM-DD."),
  pakanKg: z.number().min(0).nullable(),
  telur: z.number().int().min(0).nullable(),
  kematian: z.number().int().min(0).nullable(),
  suhu: z.number().min(-10).max(60).nullable(),
  diubahPada: z.string().min(1),
  dihapusPada: z.string().min(1).nullable().optional(),
});
export type CatatanHarian = z.infer<typeof catatanHarianSchema>;

export const catatanPutRequestSchema = catatanHarianSchema.omit({ id: true }).extend({
  perangkatId: z.string().min(1).max(128).optional(),
});
export type CatatanPutRequest = z.infer<typeof catatanPutRequestSchema>;

export const itemOutboxSchema = z.discriminatedUnion("jenis", [
  z.object({
    opId: z.string().uuid(),
    jenis: z.literal("upsert_kandang"),
    payload: kandangSchema,
    dibuatPada: z.string().min(1),
  }),
  z.object({
    opId: z.string().uuid(),
    jenis: z.literal("upsert_catatan"),
    payload: catatanHarianSchema,
    dibuatPada: z.string().min(1),
  }),
  z.object({
    opId: z.string().uuid(),
    jenis: z.literal("hapus_catatan"),
    payload: z.object({
      id: z.string().uuid(),
      kandangId: z.string().uuid(),
      tanggal: z.string().regex(TANGGAL_REGEX),
      dihapusPada: z.string().min(1),
      diubahPada: z.string().min(1),
    }),
    dibuatPada: z.string().min(1),
  }),
  z.object({
    opId: z.string().uuid(),
    jenis: z.literal("catat_lead"),
    payload: z.object({
      clientId: z.string().uuid(),
      tokoId: z.string().min(1),
      src: z.string().max(64).optional(),
      dibuatPada: z.string().min(1),
    }),
    dibuatPada: z.string().min(1),
  }),
]);
export type ItemOutboxSync = z.infer<typeof itemOutboxSchema>;

export const sinkronRequestSchema = z.object({
  perangkatId: z.string().min(1).max(128),
  terakhirSinkron: z.string().min(1).nullable().optional(),
  itemOutbox: z.array(itemOutboxSchema).max(200),
});
export type SinkronRequest = z.infer<typeof sinkronRequestSchema>;

export const sinkronResponseSchema = z.object({
  dikonfirmasiOpIds: z.array(z.string().uuid()),
  kandangTerbaru: z.array(kandangSchema),
  catatanTerbaru: z.array(catatanHarianSchema),
  waktuServer: z.string().min(1),
});
export type SinkronResponse = z.infer<typeof sinkronResponseSchema>;

export const peringatanDiniSchema = z.object({
  id: z.string().min(1),
  kode: z.enum(["KEMATIAN_TINGGI", "SUHU_TINGGI", "SUHU_RENDAH", "PRODUKSI_RENDAH"]),
  tingkat: z.enum(["sedang", "tinggi"]),
  judul: z.string().min(1),
  alasan: z.string().min(1),
  tanggal: z.string().regex(TANGGAL_REGEX),
  sumberAmbang: z.string().min(1),
  ringkasanKonteks: z.string().min(1),
});
export type PeringatanDini = z.infer<typeof peringatanDiniSchema>;
