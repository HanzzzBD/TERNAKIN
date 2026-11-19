import { z } from "zod";

export const kesehatanApiSchema = z.object({
  ok: z.literal(true),
});

export type KesehatanApi = z.infer<typeof kesehatanApiSchema>;
