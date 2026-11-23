import type { Response, Router } from "express";
import rateLimit from "express-rate-limit";
import {
  daftarEmailRequestSchema,
  emailSajaRequestSchema,
  masukEmailRequestSchema,
  masukGoogleRequestSchema,
  resetSandiRequestSchema,
  verifikasiEmailRequestSchema,
  type DaftarEmailRequest,
  type EmailSajaRequest,
  type GalatApi,
  type KodeEmailResponse,
  type MasukEmailRequest,
  type MasukGoogleRequest,
  type ResetSandiRequest,
  type VerifikasiEmailRequest,
} from "@ternakin/shared";
import type { PengirimEmail } from "../adapters/pengirimEmail.js";
import {
  JEDA_KIRIM_ULANG_MS,
  buatKodeOtp,
  cariPengguna,
  type HasilVerifikasiOtp,
} from "../db/akunRepo.js";
import type { DatabaseContext } from "../db/database.js";
import {
  batalkanKodeEmail,
  cariAkunEmail,
  cariAtauBuatPenggunaGoogle,
  detikTungguKodeEmail,
  gantiSandi,
  samarkanEmail,
  simpanKodeEmail,
  simpanPendaftaranEmail,
  tandaiEmailTerverifikasi,
  verifikasiKodeEmail,
  type TujuanKodeEmail,
} from "../db/emailRepo.js";
import type { VerifikasiGoogle } from "../lib/googleIdToken.js";
import { hashSingkatUntukLog } from "../lib/llmGuard.js";
import { logger } from "../lib/logger.js";
import { cocokSandi, hashSandi, hashSandiTiruan } from "../lib/sandi.js";
import { selesaikanMasuk } from "../lib/sesiMasuk.js";
import { buatEmailKode, type IsiEmail } from "../lib/templateEmail.js";
import { klienMobile, type OpsiCookieSesi } from "../middleware/sesi.js";
import { validate } from "../middleware/validate.js";

export const BERLAKU_KODE_EMAIL_MS = 15 * 60 * 1000;
const DOMAIN_DEMO = "@demo.ternakin.id";

export interface DepsEmailGoogle {
  dbCtx: DatabaseContext;
  rahasiaOtp: string;
  cookie: OpsiCookieSesi;
  /** null = masuk dengan email dimatikan (production tanpa SMTP). */
  pengirimEmail: PengirimEmail | null;
  /** null = tombol Google disembunyikan (GOOGLE_CLIENT_ID kosong). */
  verifikasiGoogle: VerifikasiGoogle | null;
  googleClientId: string | null;
}

function galat(kode: string, pesan: string, rinci?: Record<string, unknown>): GalatApi {
  return rinci ? { kode, pesan, rinci } : { kode, pesan };
}

const PESAN_KODE: Record<Exclude<HasilVerifikasiOtp, "cocok">, [string, string]> = {
  salah: ["KODE_SALAH", "Kode belum cocok. Periksa lagi email dari Ternakin."],
  tidak_ada: ["KODE_KEDALUWARSA", "Kode sudah tidak berlaku. Minta kode baru."],
  terlalu_banyak: [
    "KODE_TERLALU_BANYAK_PERCOBAAN",
    "Terlalu banyak percobaan. Minta kode baru untuk melanjutkan.",
  ],
};

const BERLAKU_MENIT = BERLAKU_KODE_EMAIL_MS / 60000;

const ISI_EMAIL: Record<TujuanKodeEmail, (kode: string) => IsiEmail> = {
  verifikasi: (kode) =>
    buatEmailKode({
      subjek: "Kode verifikasi akun Ternakin",
      judul: "Verifikasi email Anda",
      pembuka:
        "Terima kasih sudah mendaftar di Ternakin. Masukkan kode di bawah ini di halaman Masuk untuk mengaktifkan akun Anda.",
      kode,
      berlakuMenit: BERLAKU_MENIT,
      catatanKeamanan: "Bila Anda tidak merasa mendaftar di Ternakin, abaikan email ini.",
    }),
  reset: (kode) =>
    buatEmailKode({
      subjek: "Kode atur ulang kata sandi Ternakin",
      judul: "Atur ulang kata sandi",
      pembuka: "Masukkan kode di bawah ini di halaman Masuk untuk membuat kata sandi baru.",
      kode,
      berlakuMenit: BERLAKU_MENIT,
      catatanKeamanan:
        "Jangan berikan kode ini kepada siapa pun, termasuk yang mengaku dari Ternakin. Bila Anda tidak meminta atur ulang kata sandi, abaikan email ini; kata sandi Anda tidak berubah.",
    }),
};

export function pasangRuteEmailGoogle(router: Router, deps: DepsEmailGoogle): void {
  const { db } = deps.dbCtx;
  const pesanBatas = galat(
    "TERLALU_BANYAK_PERMINTAAN",
    "Terlalu banyak percobaan dari jaringan ini. Tunggu beberapa menit lalu coba lagi.",
  );
  const batasKirim = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: pesanBatas,
  });
  const batasMasuk = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: pesanBatas,
  });

  /** Membuat dan mengirim kode ke email. Mengembalikan respons siap kirim, atau null bila sudah dijawab. */
  const kirimKode = async (
    res: Response,
    email: string,
    tujuan: TujuanKodeEmail,
  ): Promise<KodeEmailResponse | null> => {
    const pengirim = deps.pengirimEmail;
    if (!pengirim) {
      res.status(503).json(galat("EMAIL_BELUM_DIATUR", "Masuk dengan email belum tersedia."));
      return null;
    }
    const tunggu = detikTungguKodeEmail(db, email, tujuan);
    if (tunggu > 0) {
      res.status(429).json(
        galat("KODE_TUNGGU", `Kode baru bisa diminta lagi dalam ${tunggu} detik.`, {
          tungguDetik: tunggu,
        }),
      );
      return null;
    }

    const kode = buatKodeOtp();
    const id = simpanKodeEmail(db, deps.rahasiaOtp, email, tujuan, kode, BERLAKU_KODE_EMAIL_MS);
    try {
      await pengirim.kirim(email, ISI_EMAIL[tujuan](kode));
    } catch (err) {
      batalkanKodeEmail(db, id);
      logger.warn(
        {
          email: hashSingkatUntukLog(email),
          tujuan,
          galat: err instanceof Error ? err.message : err,
        },
        "Pengiriman kode email gagal",
      );
      res
        .status(502)
        .json(
          galat(
            "EMAIL_GAGAL_TERKIRIM",
            "Email belum berhasil dikirim. Coba lagi beberapa saat lagi.",
          ),
        );
      return null;
    }

    return {
      ok: true,
      emailTersamar: samarkanEmail(email),
      berlakuDetik: BERLAKU_KODE_EMAIL_MS / 1000,
      kirimUlangDetik: JEDA_KIRIM_ULANG_MS / 1000,
      ...(pengirim.mode === "demo" ? { kodeDemo: kode } : {}),
    };
  };

  /** Respons seragam saat email tidak ditemukan, agar tidak bisa dipakai menebak akun terdaftar. */
  const responsSamar = (email: string): KodeEmailResponse => ({
    ok: true,
    emailTersamar: samarkanEmail(email),
    berlakuDetik: BERLAKU_KODE_EMAIL_MS / 1000,
    kirimUlangDetik: JEDA_KIRIM_ULANG_MS / 1000,
  });

  // POST /v1/auth/email/daftar — membuat akun lalu mengirim kode verifikasi ke email.
  router.post(
    "/email/daftar",
    batasKirim,
    validate(daftarEmailRequestSchema),
    async (req, res, next) => {
      try {
        const body = req.body as DaftarEmailRequest;
        if (body.email.endsWith(DOMAIN_DEMO)) {
          res.status(409).json(galat("EMAIL_TERDAFTAR", "Email ini khusus akun demo."));
          return;
        }
        const ada = cariAkunEmail(db, body.email);
        if (ada?.terverifikasi) {
          res
            .status(409)
            .json(
              galat(
                "EMAIL_TERDAFTAR",
                "Email ini sudah terdaftar. Silakan masuk, atau pakai Lupa kata sandi.",
              ),
            );
          return;
        }
        if (!deps.pengirimEmail) {
          res
            .status(503)
            .json(galat("EMAIL_BELUM_DIATUR", "Pendaftaran dengan email belum tersedia."));
          return;
        }

        simpanPendaftaranEmail(db, {
          nama: body.nama,
          email: body.email,
          sandiHash: await hashSandi(body.sandi),
          peran: body.peran,
        });
        const respons = await kirimKode(res, body.email, "verifikasi");
        if (respons) res.status(201).json(respons);
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /v1/auth/email/verifikasi — kode benar: email terverifikasi dan langsung masuk.
  router.post(
    "/email/verifikasi",
    batasMasuk,
    validate(verifikasiEmailRequestSchema),
    (req, res) => {
      const body = req.body as VerifikasiEmailRequest;
      const hasil = verifikasiKodeEmail(db, deps.rahasiaOtp, body.email, "verifikasi", body.kode);
      if (hasil !== "cocok") {
        const [kode, pesan] = PESAN_KODE[hasil];
        res.status(400).json(galat(kode, pesan));
        return;
      }
      const akun = cariAkunEmail(db, body.email);
      const pengguna = akun ? cariPengguna(db, akun.id) : null;
      if (!akun || !pengguna) {
        res.status(404).json(galat("AKUN_TIDAK_ADA", "Akun tidak ditemukan. Daftar ulang."));
        return;
      }
      tandaiEmailTerverifikasi(db, akun.id);
      selesaikanMasuk(db, res, pengguna, {
        perangkatIdMentah: body.perangkatId ?? req.header("x-device-id"),
        cookie: deps.cookie,
        mobile: klienMobile(req),
        rute: "/v1/auth/email/verifikasi",
      });
    },
  );

  // POST /v1/auth/email/kirim-ulang — kirim ulang kode verifikasi untuk akun yang belum terverifikasi.
  router.post(
    "/email/kirim-ulang",
    batasKirim,
    validate(emailSajaRequestSchema),
    async (req, res, next) => {
      try {
        const body = req.body as EmailSajaRequest;
        const akun = cariAkunEmail(db, body.email);
        if (!akun || akun.terverifikasi) {
          res.status(200).json(responsSamar(body.email));
          return;
        }
        const respons = await kirimKode(res, body.email, "verifikasi");
        if (respons) res.status(200).json(respons);
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /v1/auth/email/masuk — email + kata sandi.
  router.post(
    "/email/masuk",
    batasMasuk,
    validate(masukEmailRequestSchema),
    async (req, res, next) => {
      try {
        const body = req.body as MasukEmailRequest;
        const akun = cariAkunEmail(db, body.email);
        const cocok = akun?.sandiHash
          ? await cocokSandi(body.sandi, akun.sandiHash)
          : // Tetap hitung hash agar waktu respons tidak membocorkan apakah email terdaftar.
            (await cocokSandi(body.sandi, await hashSandiTiruan()), false);

        if (!akun || !cocok) {
          res.status(401).json(galat("EMAIL_SANDI_SALAH", "Email atau kata sandi salah."));
          return;
        }

        if (!akun.terverifikasi) {
          const respons = await kirimKode(res, body.email, "verifikasi");
          if (!respons) return;
          res
            .status(403)
            .json(
              galat(
                "EMAIL_BELUM_TERVERIFIKASI",
                "Email belum diverifikasi. Kami kirim kode verifikasi ke email Anda.",
                { ...respons },
              ),
            );
          return;
        }

        const pengguna = cariPengguna(db, akun.id);
        if (!pengguna) {
          res.status(401).json(galat("EMAIL_SANDI_SALAH", "Email atau kata sandi salah."));
          return;
        }
        selesaikanMasuk(db, res, pengguna, {
          perangkatIdMentah: body.perangkatId ?? req.header("x-device-id"),
          cookie: deps.cookie,
          mobile: klienMobile(req),
          rute: "/v1/auth/email/masuk",
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /v1/auth/email/lupa-sandi — kirim kode atur ulang sandi (respons sama walau email tidak ada).
  router.post(
    "/email/lupa-sandi",
    batasKirim,
    validate(emailSajaRequestSchema),
    async (req, res, next) => {
      try {
        const body = req.body as EmailSajaRequest;
        const akun = cariAkunEmail(db, body.email);
        if (!akun || akun.isDemo) {
          res.status(200).json(responsSamar(body.email));
          return;
        }
        const respons = await kirimKode(res, body.email, "reset");
        if (respons) res.status(200).json(respons);
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /v1/auth/email/reset-sandi — kode benar: sandi baru disimpan dan langsung masuk.
  router.post(
    "/email/reset-sandi",
    batasMasuk,
    validate(resetSandiRequestSchema),
    async (req, res, next) => {
      try {
        const body = req.body as ResetSandiRequest;
        const hasil = verifikasiKodeEmail(db, deps.rahasiaOtp, body.email, "reset", body.kode);
        if (hasil !== "cocok") {
          const [kode, pesan] = PESAN_KODE[hasil];
          res.status(400).json(galat(kode, pesan));
          return;
        }
        const akun = cariAkunEmail(db, body.email);
        const pengguna = akun ? cariPengguna(db, akun.id) : null;
        if (!akun || !pengguna || akun.isDemo) {
          res.status(404).json(galat("AKUN_TIDAK_ADA", "Akun tidak ditemukan."));
          return;
        }
        gantiSandi(db, akun.id, await hashSandi(body.sandiBaru));
        selesaikanMasuk(db, res, pengguna, {
          perangkatIdMentah: body.perangkatId ?? req.header("x-device-id"),
          cookie: deps.cookie,
          mobile: klienMobile(req),
          rute: "/v1/auth/email/reset-sandi",
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /v1/auth/google — ID token dari tombol "Masuk dengan Google".
  router.post("/google", batasMasuk, validate(masukGoogleRequestSchema), async (req, res, next) => {
    try {
      if (!deps.verifikasiGoogle) {
        res.status(503).json(galat("GOOGLE_BELUM_DIATUR", "Masuk dengan Google belum tersedia."));
        return;
      }
      const body = req.body as MasukGoogleRequest;
      let profil;
      try {
        profil = await deps.verifikasiGoogle(body.credential);
      } catch (err) {
        logger.warn(
          { galat: err instanceof Error ? err.message : String(err) },
          "Token Google ditolak",
        );
        res.status(401).json(galat("GOOGLE_TIDAK_SAH", "Masuk dengan Google gagal. Coba lagi."));
        return;
      }
      if (!profil.emailTerverifikasi || profil.email.endsWith(DOMAIN_DEMO)) {
        res
          .status(401)
          .json(
            galat("GOOGLE_TIDAK_SAH", "Email akun Google ini belum terverifikasi oleh Google."),
          );
        return;
      }

      const pengguna = cariAtauBuatPenggunaGoogle(db, profil, body.peran);
      selesaikanMasuk(db, res, pengguna, {
        perangkatIdMentah: body.perangkatId ?? req.header("x-device-id"),
        cookie: deps.cookie,
        mobile: klienMobile(req),
        rute: "/v1/auth/google",
      });
    } catch (err) {
      next(err);
    }
  });
}
