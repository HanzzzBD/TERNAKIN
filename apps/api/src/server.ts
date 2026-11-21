import "dotenv/config";
import crypto from "node:crypto";
import { buatPenyediaLlm } from "./adapters/penyediaLlm.js";
import { DemoPengirimOtp, FonntePengirimOtp, type PengirimOtp } from "./adapters/pengirimOtp.js";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { initDatabase } from "./db/database.js";
import { logger } from "./lib/logger.js";

const env = loadEnv();
const produksi = env.NODE_ENV === "production";
const dbCtx = initDatabase(env.DATABASE_PATH);
const penyedia = buatPenyediaLlm(env, dbCtx.db);

let pengirimOtp: PengirimOtp | null;
if (env.FONNTE_TOKEN) {
  pengirimOtp = new FonntePengirimOtp({ token: env.FONNTE_TOKEN, timeoutMs: 15000 });
} else if (!produksi) {
  pengirimOtp = new DemoPengirimOtp();
} else {
  pengirimOtp = null;
  logger.warn("FONNTE_TOKEN kosong di production; masuk dengan nomor WhatsApp dinonaktifkan");
}

let rahasiaOtp = env.SESSION_SECRET;
if (!rahasiaOtp) {
  rahasiaOtp = crypto.randomBytes(32).toString("hex");
  logger.warn(
    "SESSION_SECRET kosong; memakai rahasia acak (kode OTP batal bila server dimulai ulang)",
  );
}

const app = createApp({
  dbCtx,
  staleDays: env.STALE_DAYS,
  dailyLlmLimit: env.LLM_DAILY_LIMIT_PER_DEVICE,
  adminKey: env.ADMIN_KEY,
  llmAdapter: penyedia.llmAdapter,
  guidelineRetriever: penyedia.guidelineRetriever,
  pengirimOtp,
  rahasiaOtp,
  akunDemoAktif: env.AKUN_DEMO_AKTIF,
  cookieSesi: { aman: produksi, durasiMs: env.SESI_BERLAKU_HARI * 24 * 60 * 60 * 1000 },
});

app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      llmProvider: penyedia.penyediaAktif,
      ...(penyedia.penyediaAktif === "gemini" ? { llmModel: env.LLM_MODEL } : {}),
      otp: pengirimOtp?.mode ?? "nonaktif",
    },
    "Server Ternakin berjalan",
  );
  // Indeks embedding dibangun di latar belakang; sampai siap, Kokok memakai pencarian kata kunci.
  void penyedia.siapkan();
});
