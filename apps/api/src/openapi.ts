import { z } from "zod";
import {
  adminUpdateHargaRequestSchema,
  ajuanPeluangRequestSchema,
  daftarEmailRequestSchema,
  emailSajaRequestSchema,
  kodeEmailResponseSchema,
  konfigurasiAuthResponseSchema,
  masukEmailRequestSchema,
  masukGoogleRequestSchema,
  resetSandiRequestSchema,
  verifikasiEmailRequestSchema,
  aturPeranRequestSchema,
  daftarPeluangResponseSchema,
  izinDataRequestSchema,
  masukDemoRequestSchema,
  minatInvestasiRequestSchema,
  minatSayaResponseSchema,
  peluangInvestasiSchema,
  catatanPutRequestSchema,
  daftarTokoResponseSchema,
  dataReferensiSchema,
  galatApiSchema,
  kandangCreateRequestSchema,
  kesehatanApiSchema,
  kokokObrolanRequestSchema,
  kokokObrolanResponseSchema,
  kokokTriaseRequestSchema,
  kokokTriaseResponseSchema,
  leadCreateRequestSchema,
  mintaOtpRequestSchema,
  mintaOtpResponseSchema,
  pakanHitungRequestSchema,
  pakanHitungResultSchema,
  pakanJelaskanRequestSchema,
  pakanJelaskanResponseSchema,
  pakanUraiRequestSchema,
  pakanUraiResponseSchema,
  sesiAkunResponseSchema,
  sinkronRequestSchema,
  sinkronResponseSchema,
  verifikasiOtpRequestSchema,
} from "@ternakin/shared";

export function buildOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Ternakin API",
      version: "0.5.0",
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
      "/v1/kokok/triase": {
        post: {
          summary: "Triase gejala ayam berbasis panduan dengan tiga tingkat urgensi (SDD)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(kokokTriaseRequestSchema) } },
          },
          responses: {
            "200": {
              description: "Hasil triase terstruktur, sumber panduan, dan ringkasan kasus",
              content: {
                "application/json": { schema: z.toJSONSchema(kokokTriaseResponseSchema) },
              },
            },
            "400": {
              description: "Masukan tidak valid",
              content: { "application/json": { schema: z.toJSONSchema(galatApiSchema) } },
            },
            "429": {
              description: "Batas harian pertanyaan Kokok tercapai",
              content: { "application/json": { schema: z.toJSONSchema(galatApiSchema) } },
            },
          },
        },
      },
      "/v1/kokok/obrolan": {
        post: {
          summary:
            "Obrolan bebas dengan Kokok (popup & aplikasi); balasan ditulis AI dengan penjaga boleh/jangan",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(kokokObrolanRequestSchema) } },
          },
          responses: {
            "200": {
              description: "Balasan Kokok beserta saran aksi",
              content: {
                "application/json": { schema: z.toJSONSchema(kokokObrolanResponseSchema) },
              },
            },
            "429": { description: "Batas harian obrolan tercapai" },
          },
        },
      },
      "/v1/akun": {
        delete: {
          summary:
            "Menghapus seluruh data akun atau mode tamu (SDD). Dengan sesi: akun ikut dihapus.",
          responses: { "200": { description: "Seluruh data telah dihapus" } },
        },
      },
      "/v1/auth/otp/minta": {
        post: {
          summary: "Meminta kode OTP 6 angka lewat WhatsApp (PRD F5)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(mintaOtpRequestSchema) } },
          },
          responses: {
            "200": {
              description: "Kode dikirim (kodeDemo hanya ada pada mode demo)",
              content: { "application/json": { schema: z.toJSONSchema(mintaOtpResponseSchema) } },
            },
            "429": {
              description: "Terlalu sering; rinci.tungguDetik berisi sisa waktu tunggu",
              content: { "application/json": { schema: z.toJSONSchema(galatApiSchema) } },
            },
            "502": { description: "Pengiriman WhatsApp gagal" },
            "503": { description: "Layanan OTP belum diatur di server" },
          },
        },
      },
      "/v1/auth/otp/verifikasi": {
        post: {
          summary:
            "Mencocokkan kode, membuat sesi (cookie HttpOnly tk_sesi), dan memindahkan data tamu perangkatId ke akun",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: z.toJSONSchema(verifikasiOtpRequestSchema) },
            },
          },
          responses: {
            "200": {
              description: "Berhasil masuk",
              content: { "application/json": { schema: z.toJSONSchema(sesiAkunResponseSchema) } },
            },
            "400": {
              description: "Kode salah, kedaluwarsa, atau terlalu banyak percobaan",
              content: { "application/json": { schema: z.toJSONSchema(galatApiSchema) } },
            },
          },
        },
      },
      "/v1/auth/saya": {
        get: {
          summary: "Status sesi saat ini",
          responses: {
            "200": {
              description: "Sudah masuk",
              content: { "application/json": { schema: z.toJSONSchema(sesiAkunResponseSchema) } },
            },
            "401": { description: "Belum masuk" },
          },
        },
      },
      "/v1/auth/keluar": {
        post: {
          summary: "Mengakhiri sesi di perangkat ini",
          responses: { "200": { description: "Sesi diakhiri" } },
        },
      },
      "/v1/auth/konfigurasi": {
        get: {
          summary:
            "Cara masuk yang aktif: Google (Client ID), WhatsApp, email (smtp/demo/nonaktif), akun demo",
          responses: {
            "200": {
              description: "Berhasil",
              content: {
                "application/json": { schema: z.toJSONSchema(konfigurasiAuthResponseSchema) },
              },
            },
          },
        },
      },
      "/v1/auth/email/daftar": {
        post: {
          summary:
            "Daftar dengan nama, email, kata sandi, dan peran; kode verifikasi dikirim ke email (201)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(daftarEmailRequestSchema) } },
          },
          responses: {
            "200": {
              description: "Berhasil",
              content: { "application/json": { schema: z.toJSONSchema(kodeEmailResponseSchema) } },
            },
            "409": { description: "Email sudah terdaftar" },
            "503": { description: "Email belum diatur di server" },
          },
        },
      },
      "/v1/auth/email/verifikasi": {
        post: {
          summary: "Mencocokkan kode verifikasi email lalu langsung masuk (cookie sesi)",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: z.toJSONSchema(verifikasiEmailRequestSchema) },
            },
          },
          responses: {
            "200": {
              description: "Berhasil",
              content: { "application/json": { schema: z.toJSONSchema(sesiAkunResponseSchema) } },
            },
            "400": { description: "Kode salah, kedaluwarsa, atau terlalu banyak percobaan" },
          },
        },
      },
      "/v1/auth/email/kirim-ulang": {
        post: {
          summary: "Kirim ulang kode verifikasi (respons sama walau email tidak terdaftar)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(emailSajaRequestSchema) } },
          },
          responses: {
            "200": {
              description: "Berhasil",
              content: { "application/json": { schema: z.toJSONSchema(kodeEmailResponseSchema) } },
            },
          },
        },
      },
      "/v1/auth/email/masuk": {
        post: {
          summary: "Masuk dengan email + kata sandi",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(masukEmailRequestSchema) } },
          },
          responses: {
            "200": {
              description: "Berhasil",
              content: { "application/json": { schema: z.toJSONSchema(sesiAkunResponseSchema) } },
            },
            "401": { description: "Email atau kata sandi salah" },
            "403": { description: "Email belum diverifikasi; kode dikirim, info di rinci" },
          },
        },
      },
      "/v1/auth/email/lupa-sandi": {
        post: {
          summary: "Kirim kode atur ulang kata sandi (respons sama walau email tidak terdaftar)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(emailSajaRequestSchema) } },
          },
          responses: {
            "200": {
              description: "Berhasil",
              content: { "application/json": { schema: z.toJSONSchema(kodeEmailResponseSchema) } },
            },
          },
        },
      },
      "/v1/auth/email/reset-sandi": {
        post: {
          summary: "Kode benar: simpan kata sandi baru lalu langsung masuk",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(resetSandiRequestSchema) } },
          },
          responses: {
            "200": {
              description: "Berhasil",
              content: { "application/json": { schema: z.toJSONSchema(sesiAkunResponseSchema) } },
            },
            "400": { description: "Kode salah atau kedaluwarsa" },
          },
        },
      },
      "/v1/auth/google": {
        post: {
          summary:
            "Masuk dengan Google: ID token diperiksa server (tanda tangan, aud, iss, exp, email terverifikasi)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(masukGoogleRequestSchema) } },
          },
          responses: {
            "200": {
              description: "Berhasil",
              content: { "application/json": { schema: z.toJSONSchema(sesiAkunResponseSchema) } },
            },
            "401": { description: "Token Google tidak sah" },
            "503": { description: "GOOGLE_CLIENT_ID belum diatur" },
          },
        },
      },
      "/v1/auth/peran": {
        put: {
          summary:
            "Memilih atau mengganti peran akun: peternak atau pengguna (data tetap tersimpan)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(aturPeranRequestSchema) } },
          },
          responses: {
            "200": {
              description: "Peran diperbarui",
              content: { "application/json": { schema: z.toJSONSchema(sesiAkunResponseSchema) } },
            },
            "403": { description: "Akun demo tidak bisa mengganti peran" },
          },
        },
      },
      "/v1/auth/demo": {
        post: {
          summary:
            "Masuk ke akun demo bersama untuk juri (AKUN_DEMO_AKTIF); data tamu tidak dipindahkan",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(masukDemoRequestSchema) } },
          },
          responses: {
            "200": {
              description: "Sesi akun demo",
              content: { "application/json": { schema: z.toJSONSchema(sesiAkunResponseSchema) } },
            },
            "404": { description: "Akun demo dimatikan" },
          },
        },
      },
      "/v1/investasi/peluang": {
        get: {
          summary:
            "[SIMULASI] Daftar peluang investasi ternak; catatan disembunyikan bila izin data dimatikan",
          responses: {
            "200": {
              description: "Daftar peluang",
              content: {
                "application/json": { schema: z.toJSONSchema(daftarPeluangResponseSchema) },
              },
            },
          },
        },
        post: {
          summary:
            "[SIMULASI] Peternak mengajukan peluang (status menunggu pemeriksaan dokter hewan)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(ajuanPeluangRequestSchema) } },
          },
          responses: {
            "201": { description: "Ajuan dibuat" },
            "401": { description: "Belum masuk" },
            "403": { description: "Bukan akun berperan peternak" },
          },
        },
      },
      "/v1/investasi/peluang/{id}": {
        get: {
          summary: "[SIMULASI] Detail satu peluang",
          responses: {
            "200": {
              description: "Detail peluang",
              content: {
                "application/json": {
                  schema: z.toJSONSchema(z.object({ peluang: peluangInvestasiSchema })),
                },
              },
            },
            "404": { description: "Tidak ditemukan" },
          },
        },
      },
      "/v1/investasi/peluang/{id}/izin": {
        put: {
          summary: "[SIMULASI] Peternak pemilik mengatur izin tampil data catatan harian",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(izinDataRequestSchema) } },
          },
          responses: {
            "200": { description: "Izin diperbarui" },
            "404": { description: "Bukan milik Anda" },
          },
        },
      },
      "/v1/investasi/peluang/{id}/minat": {
        post: {
          summary: "[SIMULASI] Pengguna mencatat minat titip modal (tanpa uang sungguhan)",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: z.toJSONSchema(minatInvestasiRequestSchema) },
            },
          },
          responses: {
            "201": { description: "Minat tercatat" },
            "400": { description: "Di bawah minimal atau melebihi sisa kebutuhan" },
            "401": { description: "Belum masuk" },
            "403": { description: "Bukan akun berperan pengguna" },
            "409": { description: "Peluang tidak sedang menerima modal" },
          },
        },
      },
      "/v1/investasi/minat-saya": {
        get: {
          summary: "[SIMULASI] Daftar minat titip modal milik pengguna yang masuk",
          responses: {
            "200": {
              description: "Daftar minat",
              content: { "application/json": { schema: z.toJSONSchema(minatSayaResponseSchema) } },
            },
          },
        },
      },
      "/v1/toko": {
        get: {
          summary: "[Tambahan di luar SDD] Daftar toko beserta harga untuk cache offline",
          responses: {
            "200": {
              description: "Daftar toko beserta harga, asal harga, dan waktu pembaruan",
              content: { "application/json": { schema: z.toJSONSchema(daftarTokoResponseSchema) } },
            },
          },
        },
      },
      "/v1/toko/rujukan": {
        get: {
          summary: "Toko berurut murni berdasarkan total biaya untuk suatu campuran (SDD)",
          responses: { "200": { description: "Daftar toko berurut biaya termurah" } },
        },
      },
      "/v1/lead": {
        post: {
          summary: "[Tambahan di luar SDD] Mencatat peternak menghubungi toko secara idempoten",
          requestBody: {
            required: true,
            content: { "application/json": { schema: z.toJSONSchema(leadCreateRequestSchema) } },
          },
          responses: { "200": { description: "Lead tercatat" } },
        },
      },
      "/v1/admin/toko/{id}/harga": {
        put: {
          summary: "[Tambahan di luar SDD] Memperbarui harga mingguan toko (header X-Admin-Key)",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: z.toJSONSchema(adminUpdateHargaRequestSchema) },
            },
          },
          responses: { "200": { description: "Harga toko diperbarui" } },
        },
      },
      "/v1/admin/lead": {
        get: {
          summary: "[Tambahan di luar SDD] Rekap lead mingguan per toko dalam JSON atau CSV",
          responses: { "200": { description: "Rekap lead per toko" } },
        },
      },
    },
  };
}
