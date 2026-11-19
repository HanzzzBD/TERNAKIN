import { z } from "zod";
import {
  catatanPutRequestSchema,
  dataReferensiSchema,
  galatApiSchema,
  kandangCreateRequestSchema,
  kesehatanApiSchema,
  pakanHitungRequestSchema,
  pakanHitungResultSchema,
  pakanJelaskanRequestSchema,
  pakanJelaskanResponseSchema,
  pakanUraiRequestSchema,
  pakanUraiResponseSchema,
  sinkronRequestSchema,
  sinkronResponseSchema,
} from "@ternakin/shared";

export function buildOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Ternakin API",
      version: "0.3.0",
      description:
        "Kontrak API REST JSON /v1 bersama untuk aplikasi web PWA dan aplikasi mobile Ternakin.",
    },
    paths: {
      "/health": {
        get: {
          summary: "Cek hidup server",
          responses: {
            "200": {
              description: "Server aktif",
              content: { "application/json": { schema: z.toJSONSchema(kesehatanApiSchema) } },
            },
          },
        },
      },
      "/v1/bahan": {
        get: {
          summary: "Master bahan pakan dan nutrisi (SDD)",
          responses: {
            "200": {
              description: "Daftar master bahan beserta kandungan nutrisi",
            },
          },
        },
      },
      "/v1/referensi": {
        get: {
          summary: "[Tambahan di luar SDD] Paket data referensi untuk cache offline",
          responses: {
            "200": {
              description: "Data referensi bahan, kebutuhan gizi, versi, dan STALE_DAYS",
              content: { "application/json": { schema: z.toJSONSchema(dataReferensiSchema) } },
            },
          },
        },
      },
      "/v1/pakan/urai": {
        post: {
          summary: "Mengurai teks bebas bahan dan harga untuk dikonfirmasi (SDD)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(pakanUraiRequestSchema) } },
          },
          responses: {
            "200": {
              description: "Daftar bahan dan harga hasil bacaan untuk dikonfirmasi peternak",
              content: { "application/json": { schema: z.toJSONSchema(pakanUraiResponseSchema) } },
            },
            "400": {
              description: "Masukan tidak valid",
              content: { "application/json": { schema: z.toJSONSchema(galatApiSchema) } },
            },
          },
        },
      },
      "/v1/pakan/hitung": {
        post: {
          summary: "Menghitung campuran pakan termurah dengan solver LP (SDD)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(pakanHitungRequestSchema) } },
          },
          responses: {
            "200": {
              description: "Hasil campuran layak atau status tak layak dengan zat bermasalah",
              content: { "application/json": { schema: z.toJSONSchema(pakanHitungResultSchema) } },
            },
            "400": {
              description: "Masukan tidak valid",
              content: { "application/json": { schema: z.toJSONSchema(galatApiSchema) } },
            },
          },
        },
      },
      "/v1/pakan/jelaskan": {
        post: {
          summary: "[Tambahan di luar SDD] Penjelasan singkat hasil solver (diverifikasi angkanya)",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: z.toJSONSchema(pakanJelaskanRequestSchema) },
            },
          },
          responses: {
            "200": {
              description: "Penjelasan singkat yang terverifikasi, atau null jika angka menyimpang",
              content: {
                "application/json": { schema: z.toJSONSchema(pakanJelaskanResponseSchema) },
              },
            },
          },
        },
      },
      "/v1/kandang": {
        get: {
          summary: "Daftar profil kandang untuk perangkat/akun (SDD)",
          responses: { "200": { description: "Daftar kandang" } },
        },
        post: {
          summary: "Membuat atau memperbarui profil kandang (SDD)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(kandangCreateRequestSchema) } },
          },
          responses: { "200": { description: "Kandang tersimpan" } },
        },
      },
      "/v1/catatan/{id}": {
        put: {
          summary: "Membuat atau memperbarui catatan harian secara idempoten (SDD)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(catatanPutRequestSchema) } },
          },
          responses: { "200": { description: "Catatan tersimpan" } },
        },
      },
      "/v1/sinkron": {
        post: {
          summary: "Sinkronisasi outbox idempoten dan ambil perubahan terbaru (SDD)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(sinkronRequestSchema) } },
          },
          responses: {
            "200": {
              description: "Daftar opId terkonfirmasi dan data pemenang terbaru",
              content: { "application/json": { schema: z.toJSONSchema(sinkronResponseSchema) } },
            },
          },
        },
      },
      "/v1/akun": {
        delete: {
          summary: "Menghapus seluruh data akun atau mode tamu (SDD)",
          responses: { "200": { description: "Seluruh data telah dihapus" } },
        },
      },
    },
  };
}
