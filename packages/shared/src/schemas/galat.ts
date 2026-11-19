import { z } from "zod";

export const galatApiSchema = z.object({
  kode: z.string().min(1),
  pesan: z.string().min(1),
  rinci: z.record(z.string(), z.unknown()).optional(),
});

export type GalatApi = z.infer<typeof galatApiSchema>;
