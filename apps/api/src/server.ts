import "dotenv/config";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { initDatabase } from "./db/database.js";
import { logger } from "./lib/logger.js";

const env = loadEnv();
const dbCtx = initDatabase(env.DATABASE_PATH);
const app = createApp({
  dbCtx,
  staleDays: env.STALE_DAYS,
  dailyLlmLimit: env.LLM_DAILY_LIMIT_PER_DEVICE,
});

app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, llmProvider: env.LLM_PROVIDER },
    "Server Ternakin berjalan",
  );
});
