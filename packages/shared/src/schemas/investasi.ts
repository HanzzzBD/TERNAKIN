import { z } from "zod";

/**
 * Kontrak API Modul 5 — Investasi ternak (SIMULASI).
 * Tidak ada uang yang berpindah: pengguna mencatat minat, peternak mengajukan peluang.
 * Dokumen Risk Analysis menunda investasi sungguhan sampai ada mitra berizin OJK.
 */

export const peranAkunSchema = z.enum(["peternak", "pengguna"]);
export type PeranAkun = z.infer<typeof peranAkunSchema>;

export const statusPeluangSchema = z.enum(["dibuka", "menunggu-pemeriksaan", "dipelihara"]);
export type StatusPeluang = z.infer<typeof statusPeluangSchema>;

export const titikCatatanSchema = z.object({
  hari: z.number().int().min(0),
  bobotGram: z.number().min(0),
  mortalitasPersen: z.number().min(0),
  pakanKg: z.number().min(0),
});
export type TitikCatatan = z.infer<typeof titikCatatanSchema>;

export const pemeriksaanDokterSchema = z.object({
  dokter: z.string().min(1),
  klinik: z.string().min(1),
  tanggal: z.string().min(1),
  hasil: z.enum(["layak", "layak-dengan-catatan"]),
  poin: z.array(z.string().min(1)),
});
export type PemeriksaanDokter = z.infer<typeof pemeriksaanDokterSchema>;

export const siklusLaluSchema = z.object({
  mortalitasPersen: z.number().min(0),
  bobotPanenKg: z.number().min(0),
  fcr: z.number().min(0),
  hariPanen: z.number().int().min(0),
});

export const peluangInvestasiSchema = z.object({
  id: z.string().min(1),
  peternak: z.string().min(1),
  namaKandang: z.string().min(1),
  kecamatan: z.string().min(1),
  wilayah: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  pengalamanTahun: z.number().int().min(0),
  jumlahEkor: z.number().int().positive(),
  siklusHari: z.number().int().positive(),
  status: statusPeluangSchema,
  /** Hari pemeliharaan berjalan, hanya untuk status "dipelihara". */
  hariBerjalan: z.number().int().min(0).nullable(),
  kebutuhanModal: z.number().int().positive(),
  /** Modal awal contoh + jumlah minat yang tercatat (simulasi). */
  modalTerkumpul: z.number().int().min(0),
  minimalTitip: z.number().int().positive(),
  porsiPemodalPersen: z.number().min(0).max(100),
  rencanaMulai: z.string().nullable(),
  pemeriksaan: pemeriksaanDokterSchema.nullable(),
  /** Ringkasan siklus sebelumnya; null untuk peternak yang baru mengajukan. */
  siklusLalu: siklusLaluSchema.nullable(),
  /** Kosong bila peternak belum mengizinkan data catatan harian ditampilkan. */
  catatan: z.array(titikCatatanSchema),
  izinData: z.boolean(),
  /** true bila peluang ini milik akun peternak yang sedang masuk. */
  milikSaya: z.boolean(),
  /** Total minat yang dicatat akun pengguna yang sedang masuk pada peluang ini. */
  minatSaya: z.number().int().min(0),
  isDemo: z.boolean(),
});
export type PeluangInvestasi = z.infer<typeof peluangInvestasiSchema>;

export const daftarPeluangResponseSchema = z.object({
  peluang: z.array(peluangInvestasiSchema),
});

export const ajuanPeluangRequestSchema = z.object({
  /** Nama yang tampil ke pengguna, mis. "Pak Dedi S." (bukan nama lengkap). */
  namaPeternak: z.string().trim().min(2).max(60),
  namaKandang: z.string().trim().min(3).max(80),
  kecamatan: z.string().trim().min(3).max(60),
  wilayah: z.string().trim().min(3).max(60),
  lat: z.number().min(-7.6).max(-6.4),
  lng: z.number().min(107.0).max(108.3),
  pengalamanTahun: z.number().int().min(0).max(60),
  jumlahEkor: z.number().int().min(100).max(100_000),
  kebutuhanModal: z.number().int().min(1_000_000).max(5_000_000_000),
  porsiPemodalPersen: z.number().int().min(30).max(80),
  rencanaMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD."),
});
export type AjuanPeluangRequest = z.infer<typeof ajuanPeluangRequestSchema>;

export const izinDataRequestSchema = z.object({ izinData: z.boolean() });
export type IzinDataRequest = z.infer<typeof izinDataRequestSchema>;

export const minatInvestasiRequestSchema = z.object({
  nominal: z.number().int().positive().max(5_000_000_000),
});
export type MinatInvestasiRequest = z.infer<typeof minatInvestasiRequestSchema>;

export const minatSayaItemSchema = z.object({
  id: z.string().min(1),
  peluangId: z.string().min(1),
  namaKandang: z.string().min(1),
  nominal: z.number().int().positive(),
  dibuatPada: z.string().min(1),
});
export type MinatSayaItem = z.infer<typeof minatSayaItemSchema>;

export const minatSayaResponseSchema = z.object({ minat: z.array(minatSayaItemSchema) });
