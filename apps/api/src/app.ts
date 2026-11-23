import crypto from "node:crypto";
import express from "express";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { GalatApi, KesehatanApi } from "@ternakin/shared";
import { MockLlmAdapter } from "./adapters/mockLlm.js";
import { DemoPengirimEmail, type PengirimEmail } from "./adapters/pengirimEmail.js";
import { DemoPengirimOtp, type PengirimOtp } from "./adapters/pengirimOtp.js";
import type { VerifikasiGoogle } from "./lib/googleIdToken.js";
import { SharedSolverAdapter } from "./adapters/solverAdapter.js";
import { SqliteGuidelineRetriever } from "./adapters/sqliteGuidelineRetriever.js";
import type { GuidelineRetriever, LlmAdapter, SolverAdapter } from "./adapters/types.js";
import { initDatabase, type DatabaseContext } from "./db/database.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { muatSesi, type OpsiCookieSesi } from "./middleware/sesi.js";
import { createV1Router } from "./routes/v1.js";

const DEFAULT_WEB_DIST = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../web/dist",
);

const NO_CACHE_FILE_PATTERN = /[\\/](index\.html|sw\.js|manifest\.webmanifest)$/;
const SPA_FALLBACK_PATTERN = /^\/(?!v1(?:\/|$)|health$|sw\.js$|manifest\.webmanifest$).*/;

export interface CreateAppOptions {
  webDistDir?: string;
  databasePath?: string;
  dbCtx?: DatabaseContext;
  llmAdapter?: LlmAdapter;
  solverAdapter?: SolverAdapter;
  guidelineRetriever?: GuidelineRetriever;
  staleDays?: number;
  dailyLlmLimit?: number;
  adminKey?: string;
  /** null = OTP belum diatur. Bawaan: mode demo (untuk pengujian dan pengembangan). */
  pengirimOtp?: PengirimOtp | null;
  /** Rahasia HMAC kode OTP; bawaan SESSION_SECRET atau acak per proses. */
  rahasiaOtp?: string;
  cookieSesi?: OpsiCookieSesi;
  /** Akun demo bersama untuk juri. Bawaan: aktif. */
  akunDemoAktif?: boolean;
  /** null = masuk dengan email dimatikan. Bawaan: mode demo (kode tampil di layar). */
  pengirimEmail?: PengirimEmail | null;
  /** Pemeriksa ID token Google; null = tombol Google disembunyikan. */
  verifikasiGoogle?: VerifikasiGoogle | null;
  googleClientId?: string | null;
  /**
   * Proxy tepercaya untuk membaca IP asli (X-Forwarded-For): "loopback" untuk Cloudflare Tunnel
   * di mesin yang sama, "uniquelocal" untuk nginx di jaringan Docker. Bawaan: loopback.
   */
  trustProxy?: string;
}

export function createApp(options: CreateAppOptions = {}): express.Express {
  const app = express();
  const webDistDir = options.webDistDir ?? DEFAULT_WEB_DIST;
  const indexHtmlPath = path.join(webDistDir, "index.html");
  const staleDays = options.staleDays ?? 7;
  const dailyLlmLimit = options.dailyLlmLimit ?? 20;
  const adminKey = options.adminKey ?? process.env.ADMIN_KEY ?? "";

  const dbCtx = options.dbCtx ?? initDatabase(options.databasePath ?? ":memory:");
  const llmAdapter = options.llmAdapter ?? new MockLlmAdapter();
  const solverAdapter = options.solverAdapter ?? new SharedSolverAdapter(dbCtx, staleDays);
  const guidelineRetriever = options.guidelineRetriever ?? new SqliteGuidelineRetriever(dbCtx.db);
  const pengirimOtp =
    options.pengirimOtp === undefined ? new DemoPengirimOtp() : options.pengirimOtp;
  const rahasiaOtp =
    options.rahasiaOtp || process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
  const cookieSesi = options.cookieSesi ?? { aman: false, durasiMs: 30 * 24 * 60 * 60 * 1000 };

  app.disable("x-powered-by");
  // Tanpa ini, semua permintaan lewat tunnel/nginx tampak dari satu IP dan batas laju menyatu.
  app.set("trust proxy", options.trustProxy ?? "loopback");
  // Tombol "Masuk dengan Google" memuat skrip dan jendela dari accounts.google.com, dan
  // memakai popup: CSP dan Cross-Origin-Opener-Policy disesuaikan seperlunya saja.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'", "https://accounts.google.com/gsi/client"],
          "style-src": [
            "'self'",
            "https:",
            "'unsafe-inline'",
            "https://accounts.google.com/gsi/style",
          ],
          "frame-src": ["'self'", "https://accounts.google.com/gsi/"],
          "connect-src": ["'self'", "https://accounts.google.com/gsi/"],
        },
      },
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    }),
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    const body: KesehatanApi = { ok: true };
    res.status(200).json(body);
  });

  app.use(
    "/v1",
    generalLimiter,
    muatSesi(dbCtx.db),
    createV1Router({
      dbCtx,
      llmAdapter,
      solverAdapter,
      guidelineRetriever,
      staleDays,
      dailyLlmLimit,
      adminKey,
      pengirimOtp,
      rahasiaOtp,
      cookieSesi,
      akunDemoAktif: options.akunDemoAktif ?? true,
      pengirimEmail:
        options.pengirimEmail === undefined ? new DemoPengirimEmail() : options.pengirimEmail,
      verifikasiGoogle: options.verifikasiGoogle ?? null,
      googleClientId: options.googleClientId ?? null,
    }),
  );

  app.use(
    express.static(webDistDir, {
      setHeaders: (res, filePath) => {
        if (NO_CACHE_FILE_PATTERN.test(filePath)) {
          res.setHeader("Cache-Control", "no-cache");
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );

  // Fallback SPA: jangan menimpa /v1, /health, /sw.js, dan /manifest.webmanifest
  app.get(SPA_FALLBACK_PATTERN, (_req, res) => {
    if (!fs.existsSync(indexHtmlPath)) {
      const galat: GalatApi = {
        kode: "WEB_BELUM_DIBANGUN",
        pesan: "Berkas web belum tersedia. Jalankan npm run build terlebih dahulu.",
      };
      res.status(404).json(galat);
      return;
    }

    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(indexHtmlPath);
  });

  app.use(errorHandler);

  return app;
}
