import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import type { GalatApi } from "@ternakin/shared";

export function validate<T>(schema: ZodType<T>): RequestHandler {
  return (req, res, next) => {
    const hasil = schema.safeParse(req.body);
    if (!hasil.success) {
      const galat: GalatApi = {
        kode: "INPUT_TIDAK_VALID",
        pesan: "Isian belum benar.",
        rinci: {
          masalah: hasil.error.issues.map((issue) => ({
            jalur: issue.path.join("."),
            pesan: issue.message,
          })),
        },
      };
      res.status(400).json(galat);
      return;
    }

    req.body = hasil.data;
    next();
  };
}
