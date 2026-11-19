import rateLimit from "express-rate-limit";
import type { GalatApi } from "@ternakin/shared";

const pesanBatasLaju: GalatApi = {
  kode: "TERLALU_BANYAK_PERMINTAAN",
  pesan: "Permintaan terlalu cepat. Tunggu sebentar lalu coba lagi.",
};

const pesanBatasLajuLlm: GalatApi = {
  kode: "TERLALU_BANYAK_PERMINTAAN_AI",
  pesan: "Permintaan pembacaan teks terlalu cepat. Tunggu sebentar lalu coba lagi.",
};

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: pesanBatasLaju,
});

export const llmLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: pesanBatasLajuLlm,
});
