import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_PATH: z.string().min(1).default("./data/ternakin.sqlite"),
  ADMIN_KEY: z.string().default(""),
  SESSION_SECRET: z.string().default(""),
  // Token perangkat Fonnte untuk mengirim OTP WhatsApp. Kosong + bukan production = mode demo.
  FONNTE_TOKEN: z.string().trim().default(""),
  // Akun demo bersama (Rani/Pak Dedi) untuk juri; matikan saat pilot sungguhan.
  AKUN_DEMO_AKTIF: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  // Gmail SMTP untuk kode verifikasi email & reset sandi (App Password, bukan sandi Gmail biasa).
  SMTP_HOST: z.string().trim().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(465),
  SMTP_USER: z.string().trim().default(""),
  SMTP_PASS: z.string().trim().default(""),
  SMTP_DARI: z.string().trim().default(""),
  // OAuth Client ID tipe Web untuk tombol "Masuk dengan Google"; kosong = tombol disembunyikan.
  GOOGLE_CLIENT_ID: z.string().trim().default(""),
  // Proxy tepercaya (Express "trust proxy"): loopback = Cloudflare Tunnel di mesin yang sama,
  // uniquelocal = nginx di jaringan Docker.
  TRUST_PROXY: z.string().trim().min(1).default("loopback"),
  SESI_BERLAKU_HARI: z.coerce.number().int().min(1).max(365).default(30),
  LLM_PROVIDER: z.enum(["mock", "gemini"]).default("mock"),
  LLM_API_KEY: z.string().trim().default(""),
  LLM_MODEL: z.string().trim().min(1).default("gemini-3.5-flash-lite"),
  LLM_EMBEDDING_MODEL: z.string().trim().min(1).default("gemini-embedding-2"),
  LLM_EMBEDDING_DIMENSI: z.coerce.number().int().min(128).max(3072).default(768),
  // Kosong = ikuti bawaan model. gemini-3.8-flash tidak mendukung "minimal".
  LLM_THINKING_LEVEL: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.enum(["minimal", "low", "medium", "high"]).optional(),
  ),
  LLM_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(15000),
  LLM_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(600),
  // Ambang kemiripan kosinus agar panduan dianggap relevan untuk Kokok (kalibrasi setelah ada kunci).
  RAG_AMBANG_KEMIRIPAN: z.coerce.number().min(0).max(1).default(0.6),
  LLM_DAILY_LIMIT_PER_DEVICE: z.coerce.number().int().positive().default(20),
  STALE_DAYS: z.coerce.number().int().positive().default(7),
  // Folder berisi ternakin.apk untuk tombol "Unduh untuk Android". Kosong = <folder database>/unduhan.
  UNDUHAN_DIR: z.string().trim().default(""),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}
