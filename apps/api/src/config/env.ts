import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_PATH: z.string().min(1).default("./data/ternakin.sqlite"),
  ADMIN_KEY: z.string().default(""),
  SESSION_SECRET: z.string().default(""),
  LLM_PROVIDER: z.enum(["mock"]).default("mock"),
  LLM_API_KEY: z.string().default(""),
  LLM_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(600),
  LLM_DAILY_LIMIT_PER_DEVICE: z.coerce.number().int().positive().default(20),
  STALE_DAYS: z.coerce.number().int().positive().default(7),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}
