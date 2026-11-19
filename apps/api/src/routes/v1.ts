import { Router } from "express";
import type { GalatApi } from "@ternakin/shared";

export const v1Router = Router();

// Endpoint modul /v1 akan ditambahkan bertahap mulai Fase 2 sampai Fase 5.
v1Router.use((_req, res) => {
  const galat: GalatApi = {
    kode: "TIDAK_DITEMUKAN",
    pesan: "Jalur API tidak ditemukan.",
  };
  res.status(404).json(galat);
});
