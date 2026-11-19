import { z } from "zod";

export const hargaTokoItemSchema = z.object({
  bahanId: z.string().min(1),
  namaBahan: z.string().min(1).optional(),
  harga: z.number().positive(),
  asalHarga: z.string().min(1),
  diperbaruiPada: z.string().min(1),
});
export type HargaTokoItem = z.infer<typeof hargaTokoItemSchema>;

export const tokoSchema = z.object({
  id: z.string().min(1),
  kode: z.string().min(1),
  nama: z.string().min(1),
  area: z.string().min(1),
  statusMitra: z.boolean(),
  isDemo: z.boolean().default(true),
  nomorWa: z.string().nullable().optional(),
  harga: z.array(hargaTokoItemSchema),
});
export type Toko = z.infer<typeof tokoSchema>;

export const daftarTokoResponseSchema = z.object({
  staleDays: z.number().int().positive(),
  diambilPada: z.string().min(1),
  toko: z.array(tokoSchema),
});
export type DaftarTokoResponse = z.infer<typeof daftarTokoResponseSchema>;

export const komposisiRujukanItemSchema = z.object({
  bahanId: z.string().min(1),
  nama: z.string().min(1).optional(),
  kgPer100Kg: z.number().positive().max(100),
});
export type KomposisiRujukanItem = z.infer<typeof komposisiRujukanItemSchema>;

export const rincianHargaRujukanSchema = z.object({
  bahanId: z.string().min(1),
  namaBahan: z.string().min(1),
  kgPer100Kg: z.number().min(0),
  hargaPerKg: z.number().positive(),
  subtotalPer100Kg: z.number().min(0),
  asalHarga: z.string().min(1),
  diperbaruiPada: z.string().min(1),
  umurHari: z.number().int().min(0),
  isUsang: z.boolean(),
});
export type RincianHargaRujukan = z.infer<typeof rincianHargaRujukanSchema>;

export const tokoTerurutSchema = z.object({
  id: z.string().min(1),
  kode: z.string().min(1),
  nama: z.string().min(1),
  area: z.string().min(1),
  statusMitra: z.boolean(),
  isDemo: z.boolean(),
  nomorWa: z.string().nullable().optional(),
  lengkap: z.boolean(),
  bahanKurang: z.array(z.string()),
  totalBiayaPer100Kg: z.number().min(0).nullable(),
  biayaPerKg: z.number().min(0).nullable(),
  rincianHarga: z.array(rincianHargaRujukanSchema),
  asalHargaRingkas: z.string(),
  diperbaruiTertuaPada: z.string().nullable(),
  umurHariTertua: z.number().int().min(0).nullable(),
  hasHargaUsang: z.boolean(),
});
export type TokoTerurut = z.infer<typeof tokoTerurutSchema>;

export const leadCreateRequestSchema = z.object({
  clientId: z.string().uuid(),
  tokoId: z.string().min(1),
  perangkatId: z.string().min(1).max(128).optional(),
  src: z.string().max(64).optional(),
  komposisiId: z.string().max(128).optional(),
  dibuatPada: z.string().min(1).optional(),
});
export type LeadCreateRequest = z.infer<typeof leadCreateRequestSchema>;

export const adminUpdateHargaRequestSchema = z.object({
  harga: z
    .array(
      z.object({
        bahanId: z.string().min(1),
        harga: z.number().positive("Harga bahan harus lebih dari 0."),
        asalHarga: z.string().trim().min(2, "Asal harga wajib diisi.").max(120),
        diperbaruiPada: z.string().min(1).optional(),
      }),
    )
    .min(1, "Minimal satu harga bahan harus diisi."),
});
export type AdminUpdateHargaRequest = z.infer<typeof adminUpdateHargaRequestSchema>;
