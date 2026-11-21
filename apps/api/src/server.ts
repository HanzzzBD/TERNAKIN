import "dotenv/config";
import { buatPenyediaLlm } from "./adapters/penyediaLlm.js";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { initDatabase } from "./db/database.js";
import { logger } from "./lib/logger.js";

const env = loadEnv();
const dbCtx = initDatabase(env.DATABASE_PATH);
const penyedia = buatPenyediaLlm(env, dbCtx.db);
const app = createApp({
  dbCtx,
  staleDays: env.STALE_DAYS,
  dailyLlmLimit: env.LLM_DAILY_LIMIT_PER_DEVICE,
  adminKey: env.ADMIN_KEY,
  llmAdapter: penyedia.llmAdapter,
  guidelineRetriever: penyedia.guidelineRetriever,
});

app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      llmProvider: penyedia.penyediaAktif,
      ...(penyedia.penyediaAktif === "gemini" ? { llmModel: env.LLM_MODEL } : {}),
    },
    "Server Ternakin berjalan",
  );
  // Indeks embedding dibangun di latar belakang; sampai siap, Kokok memakai pencarian kata kunci.
  void penyedia.siapkan();
});
