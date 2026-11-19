import { z } from "zod";

export const jenisAyamSchema = z.enum(["petelur", "pedaging"]);
export type JenisAyam = z.infer<typeof jenisAyamSchema>;

export const faseAyamSchema = z.enum(["starter", "grower", "layer"]);
export type FaseAyam = z.infer<typeof faseAyamSchema>;

export const ambangReferensiSchema = z.object({
  jenisAyam: jenisAyamSchema,
  kematianPersenMaks: z.number().positive(),
  suhuMinC: z.number(),
  suhuMaksC: z.number(),
  produksiTelurMinPersen: z.number().min(0).max(100),
  sumber: z.string().min(1),
  isDemo: z.boolean().default(true),
});

export const bahanMasterSchema = z.object({
  id: z.string().min(1),
  nama: z.string().min(1),
  satuan: z.string().min(1).default("kg"),
  sinonim: z.array(z.string().min(1)).default([]),
  batasMinPersen: z.number().min(0).max(100).default(0),
  batasMaksPersen: z.number().min(0).max(100).default(100),
  nutrisi: z.record(z.string(), z.number().min(0)),
  sumberNutrisi: z.string().min(1),
  isDemo: z.boolean().default(true),
});
export type BahanMaster = z.infer<typeof bahanMasterSchema>;

export const kebutuhanGiziItemSchema = z.object({
  jenisAyam: jenisAyamSchema,
  fase: faseAyamSchema,
  zatGizi: z.string().min(1),
  label: z.string().min(1),
  satuan: z.string().min(1),
  batasMin: z.number().min(0).nullable(),
  batasMaks: z.number().min(0).nullable(),
  sumber: z.string().min(1),
  isDemo: z.boolean().default(true),
});
export type KebutuhanGiziItem = z.infer<typeof kebutuhanGiziItemSchema>;

export const dataReferensiSchema = z.object({
  versi: z.string().min(1),
  isDemo: z.boolean(),
  catatanData: z.string().min(1),
  staleDays: z.number().int().positive(),
  bahan: z.array(bahanMasterSchema),
  kebutuhanGizi: z.array(kebutuhanGiziItemSchema),
  ambangPeringatan: z.array(ambangReferensiSchema).default([]),
});
export type DataReferensi = z.infer<typeof dataReferensiSchema>;
