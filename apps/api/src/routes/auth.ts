import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  mintaOtpRequestSchema,
  normalisasiNomorPonsel,
  samarkanNomorPonsel,
  verifikasiOtpRequestSchema,
  type GalatApi,
  type MintaOtpRequest,
  type MintaOtpResponse,
  type PenggunaSaya,
  type SesiAkunResponse,
  type VerifikasiOtpRequest,
  aturPeranRequestSchema,
  masukDemoRequestSchema,
  type AturPeranRequest,
  type MasukDemoRequest,
} from "@ternakin/shared";
import type { PengirimOtp } from "../adapters/pengirimOtp.js";
import {
  batalkanOtp,
  buatKodeOtp,
  buatSesi,
  cariAtauBuatPengguna,
  detikTungguOtp,
  hapusSesi,
  hashKodeOtp,
  JEDA_KIRIM_ULANG_MS,
  pindahkanDataTamu,
  simpanOtp,
  verifikasiOtp,
  aturPeranAkun,
  cariPengguna,
} from "../db/akunRepo.js";
import { AKUN_DEMO_SERVER } from "../db/investasiRepo.js";
import type { DatabaseContext } from "../db/database.js";
import { hashSingkatUntukLog } from "../lib/llmGuard.js";
import { logger } from "../lib/logger.js";
import { ambilPenggunaSesi, bersihkanPerangkatId, type PenggunaSesi } from "../lib/pemilik.js";
import { hapusCookieSesi, setelCookieSesi, type OpsiCookieSesi } from "../middleware/sesi.js";
import { validate } from "../middleware/validate.js";

export const BERLAKU_OTP_MS = 5 * 60 * 1000;

export interface AuthRouterDeps {
  /** Akun demo bersama untuk juri (POST /v1/auth/demo). */
  akunDemoAktif: boolean;
  dbCtx: DatabaseContext;
  /** null = layanan OTP belum diatur (production tanpa token Fonnte). */
  pengirimOtp: PengirimOtp | null;
  rahasiaOtp: string;
  cookie: OpsiCookieSesi;
}

function galat(kode: string, pesan: string, rinci?: Record<string, unknown>): GalatApi {
  return rinci ? { kode, pesan, rinci } : { kode, pesan };
}

function keSaya(p: PenggunaSesi): PenggunaSaya {
  return {
    id: p.id,
    nomorTersamar: p.nomorPonsel ? samarkanNomorPonsel(p.nomorPonsel) : "",
    nama: p.nama,
    peran: p.peran,
    isDemo: p.isDemo,
  };
}

const pesanBatasOtp = galat(
  "TERLALU_BANYAK_PERMINTAAN_OTP",
  "Terlalu banyak permintaan kode dari jaringan ini. Tunggu beberapa menit lalu coba lagi.",
);

export function createAuthRouter(deps: AuthRouterDeps): Router {
  const router = Router();
  const { db } = deps.dbCtx;

  // Batas per alamat IP; batas per nomor ada di basis data (detikTungguOtp).
  const mintaLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: pesanBatasOtp,
  });
  const verifikasiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: pesanBatasOtp,
  });

  // POST /v1/auth/otp/minta — membuat kode 6 angka dan mengirimnya lewat WhatsApp.
  router.post(
    "/otp/minta",
    mintaLimiter,
    validate(mintaOtpRequestSchema),
    async (req, res, next) => {
      try {
        const body = req.body as MintaOtpRequest;
        const nomor = normalisasiNomorPonsel(body.nomorPonsel);
        if (!nomor) {
          res
            .status(400)
            .json(
              galat("NOMOR_TIDAK_VALID", "Nomor WhatsApp belum benar. Contoh: 0812 3456 7890."),
            );
          return;
        }

        if (!deps.pengirimOtp) {
          res
            .status(503)
            .json(
              galat(
                "OTP_BELUM_DIATUR",
                "Masuk dengan nomor WhatsApp belum tersedia. Anda tetap bisa memakai Ternakin tanpa akun.",
              ),
            );
          return;
        }

        const tunggu = detikTungguOtp(db, nomor);
        if (tunggu > 0) {
          res.status(429).json(
            galat("OTP_TUNGGU", `Kode baru bisa diminta lagi dalam ${tunggu} detik.`, {
              tungguDetik: tunggu,
            }),
          );
          return;
        }

        const kode = buatKodeOtp();
        const idOtp = simpanOtp(
          db,
          nomor,
          hashKodeOtp(deps.rahasiaOtp, nomor, kode),
          BERLAKU_OTP_MS,
        );
        const pesan = `Kode masuk Ternakin Anda: ${kode}\n\nBerlaku 5 menit. Jangan berikan kode ini kepada siapa pun, termasuk yang mengaku dari Ternakin.`;

        try {
          await deps.pengirimOtp.kirim(nomor, pesan);
        } catch (err) {
          // Kode yang gagal terkirim dihapus agar tidak menghabiskan jatah kirim ulang.
          batalkanOtp(db, idOtp);
          logger.warn(
            {
              rute: "/v1/auth/otp/minta",
              nomor: hashSingkatUntukLog(nomor),
              galat: err instanceof Error ? err.message : String(err),
            },
            "Pengiriman OTP gagal",
          );
          res
            .status(502)
            .json(
              galat(
                "OTP_GAGAL_TERKIRIM",
                "Kode belum berhasil dikirim ke WhatsApp. Periksa nomor Anda lalu coba lagi beberapa saat lagi.",
              ),
            );
          return;
        }

        logger.info(
          {
            rute: "/v1/auth/otp/minta",
            nomor: hashSingkatUntukLog(nomor),
            mode: deps.pengirimOtp.mode,
          },
          "Kode OTP dibuat",
        );

        const respons: MintaOtpResponse = {
          ok: true,
          nomorTersamar: samarkanNomorPonsel(nomor),
          berlakuDetik: BERLAKU_OTP_MS / 1000,
          kirimUlangDetik: JEDA_KIRIM_ULANG_MS / 1000,
          ...(deps.pengirimOtp.mode === "demo" ? { kodeDemo: kode } : {}),
        };
        res.status(200).json(respons);
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /v1/auth/otp/verifikasi — mencocokkan kode, membuat sesi, memindahkan data tamu.
  router.post(
    "/otp/verifikasi",
    verifikasiLimiter,
    validate(verifikasiOtpRequestSchema),
    (req, res) => {
      const body = req.body as VerifikasiOtpRequest;
      const nomor = normalisasiNomorPonsel(body.nomorPonsel);
      if (!nomor) {
        res.status(400).json(galat("NOMOR_TIDAK_VALID", "Nomor WhatsApp belum benar."));
        return;
      }

      const hasil = verifikasiOtp(db, deps.rahasiaOtp, nomor, body.kode);
      if (hasil !== "cocok") {
        const pesan: Record<Exclude<typeof hasil, "cocok">, [string, string]> = {
          salah: ["OTP_SALAH", "Kode belum cocok. Periksa lagi pesan WhatsApp dari Ternakin."],
          tidak_ada: ["OTP_KEDALUWARSA", "Kode sudah tidak berlaku. Minta kode baru."],
          terlalu_banyak: [
            "OTP_TERLALU_BANYAK_PERCOBAAN",
            "Terlalu banyak percobaan. Minta kode baru untuk melanjutkan.",
          ],
        };
        const [kode, teks] = pesan[hasil];
        res.status(400).json(galat(kode, teks));
        return;
      }

      const pengguna = cariAtauBuatPengguna(db, nomor, body.peran);
      const perangkatId = bersihkanPerangkatId(body.perangkatId ?? req.header("x-device-id"));
      const kandangDipindahkan = perangkatId ? pindahkanDataTamu(db, perangkatId, pengguna.id) : 0;

      // Sesi lama di perangkat ini (bila ada) diganti dengan yang baru.
      const tokenLama = res.locals.tokenSesi as string | undefined;
      if (tokenLama) hapusSesi(db, tokenLama);

      const token = buatSesi(db, pengguna.id, deps.cookie.durasiMs);
      setelCookieSesi(res, token, deps.cookie);

      logger.info(
        { rute: "/v1/auth/otp/verifikasi", pengguna: pengguna.id, kandangDipindahkan },
        "Pengguna masuk",
      );

      const respons: SesiAkunResponse = { pengguna: keSaya(pengguna), kandangDipindahkan };
      res.status(200).json(respons);
    },
  );

  // GET /v1/auth/saya — status sesi saat ini.
  router.get("/saya", (_req, res) => {
    const pengguna = ambilPenggunaSesi(res);
    if (!pengguna) {
      res.status(401).json(galat("BELUM_MASUK", "Anda belum masuk."));
      return;
    }
    const respons: SesiAkunResponse = { pengguna: keSaya(pengguna) };
    res.status(200).json(respons);
  });

  // POST /v1/auth/keluar — mengakhiri sesi di perangkat ini.
  router.post("/keluar", (_req, res) => {
    const token = res.locals.tokenSesi as string | undefined;
    if (token) hapusSesi(db, token);
    hapusCookieSesi(res, deps.cookie);
    res.status(200).json({ ok: true });
  });

  // PUT /v1/auth/peran — memilih atau mengganti peran (Peternak / Pengguna). Data tetap tersimpan.
  router.put("/peran", validate(aturPeranRequestSchema), (req, res) => {
    const pengguna = ambilPenggunaSesi(res);
    if (!pengguna) {
      res.status(401).json(galat("BELUM_MASUK", "Anda belum masuk."));
      return;
    }
    if (pengguna.isDemo) {
      res
        .status(403)
        .json(
          galat(
            "AKUN_DEMO",
            "Peran akun demo tidak bisa diganti. Pilih akun demo lain di halaman Masuk.",
          ),
        );
      return;
    }
    const body = req.body as AturPeranRequest;
    aturPeranAkun(db, pengguna.id, body.peran);
    const terbaru = cariPengguna(db, pengguna.id) ?? { ...pengguna, peran: body.peran };
    const respons: SesiAkunResponse = { pengguna: keSaya(terbaru) };
    res.status(200).json(respons);
  });

  // POST /v1/auth/demo — masuk ke akun demo bersama (untuk juri). Data tamu TIDAK dipindahkan
  // karena akun demo dipakai banyak orang.
  router.post("/demo", validate(masukDemoRequestSchema), (req, res) => {
    if (!deps.akunDemoAktif) {
      res.status(404).json(galat("AKUN_DEMO_NONAKTIF", "Akun demo tidak tersedia."));
      return;
    }
    const body = req.body as MasukDemoRequest;
    const pengguna = cariPengguna(db, AKUN_DEMO_SERVER[body.peran].id);
    if (!pengguna) {
      res.status(503).json(galat("AKUN_DEMO_BELUM_SIAP", "Akun demo belum disiapkan di server."));
      return;
    }
    const tokenLama = res.locals.tokenSesi as string | undefined;
    if (tokenLama) hapusSesi(db, tokenLama);
    setelCookieSesi(res, buatSesi(db, pengguna.id, deps.cookie.durasiMs), deps.cookie);
    const respons: SesiAkunResponse = { pengguna: keSaya(pengguna) };
    res.status(200).json(respons);
  });

  return router;
}
