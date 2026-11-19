import express from "express";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { GalatApi, KesehatanApi } from "@ternakin/shared";
import { generalLimiter } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { v1Router } from "./routes/v1.js";

const DEFAULT_WEB_DIST = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../web/dist",
);

const NO_CACHE_FILE_PATTERN = /[\\/](index\.html|sw\.js|manifest\.webmanifest)$/;
const SPA_FALLBACK_PATTERN = /^\/(?!v1(?:\/|$)|health$|sw\.js$|manifest\.webmanifest$).*/;

export interface CreateAppOptions {
  webDistDir?: string;
}

export function createApp(options: CreateAppOptions = {}): express.Express {
  const app = express();
  const webDistDir = options.webDistDir ?? DEFAULT_WEB_DIST;
  const indexHtmlPath = path.join(webDistDir, "index.html");

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    const body: KesehatanApi = { ok: true };
    res.status(200).json(body);
  });

  app.use("/v1", generalLimiter, v1Router);

  app.use(
    express.static(webDistDir, {
      setHeaders: (res, filePath) => {
        if (NO_CACHE_FILE_PATTERN.test(filePath)) {
          res.setHeader("Cache-Control", "no-cache");
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );

  // Fallback SPA: jangan menimpa /v1, /health, /sw.js, dan /manifest.webmanifest
  app.get(SPA_FALLBACK_PATTERN, (_req, res) => {
    if (!fs.existsSync(indexHtmlPath)) {
      const galat: GalatApi = {
        kode: "WEB_BELUM_DIBANGUN",
        pesan: "Berkas web belum tersedia. Jalankan npm run build terlebih dahulu.",
      };
      res.status(404).json(galat);
      return;
    }

    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(indexHtmlPath);
  });

  app.use(errorHandler);

  return app;
}
