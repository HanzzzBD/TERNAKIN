import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { galatApiSchema, kesehatanApiSchema } from "@ternakin/shared";
import { createApp } from "./app.js";
import { validate } from "./middleware/validate.js";

describe("Express API fondasi", () => {
  let tempDistDir: string;

  beforeAll(() => {
    tempDistDir = fs.mkdtempSync(path.join(os.tmpdir(), "ternakin-dist-"));
    fs.mkdirSync(path.join(tempDistDir, "assets"), { recursive: true });
    fs.writeFileSync(
      path.join(tempDistDir, "index.html"),
      "<!doctype html><html><body>OK</body></html>",
    );
    fs.writeFileSync(path.join(tempDistDir, "sw.js"), "// sw");
    fs.writeFileSync(path.join(tempDistDir, "manifest.webmanifest"), '{"name":"Ternakin"}');
    fs.writeFileSync(path.join(tempDistDir, "assets", "main-hash.js"), "console.log('ok');");
  });

  afterAll(() => {
    fs.rmSync(tempDistDir, { recursive: true, force: true });
  });

  it("GET /health menjawab 200 dengan skema kesehatan valid", async () => {
    const app = createApp({ webDistDir: tempDistDir });
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(kesehatanApiSchema.safeParse(res.body).success).toBe(true);
    expect(res.body).toEqual({ ok: true });
  });

  it("GET /v1/jalur-tidak-ada mengembalikan 404 dalam format galat seragam", async () => {
    const app = createApp({ webDistDir: tempDistDir });
    const res = await request(app).get("/v1/jalur-tidak-ada");

    expect(res.status).toBe(404);
    expect(galatApiSchema.safeParse(res.body).success).toBe(true);
    expect(res.body.kode).toBe("TIDAK_DITEMUKAN");
  });

  it("menyajikan berkas web dengan Cache-Control dan fallback SPA yang tepat", async () => {
    const app = createApp({ webDistDir: tempDistDir });

    const rootRes = await request(app).get("/");
    expect(rootRes.status).toBe(200);
    expect(rootRes.headers["cache-control"]).toBe("no-cache");

    const spaRes = await request(app).get("/app/catatan");
    expect(spaRes.status).toBe(200);
    expect(spaRes.headers["cache-control"]).toBe("no-cache");
    expect(spaRes.text).toContain("OK");

    const swRes = await request(app).get("/sw.js");
    expect(swRes.status).toBe(200);
    expect(swRes.headers["cache-control"]).toBe("no-cache");

    const manifestRes = await request(app).get("/manifest.webmanifest");
    expect(manifestRes.status).toBe(200);
    expect(manifestRes.headers["cache-control"]).toBe("no-cache");

    const assetRes = await request(app).get("/assets/main-hash.js");
    expect(assetRes.status).toBe(200);
    expect(assetRes.headers["cache-control"]).toBe("public, max-age=31536000, immutable");
  });

  it("tidak menimpa /sw.js atau /manifest.webmanifest dengan fallback SPA bila berkas tidak ada", async () => {
    const emptyDist = fs.mkdtempSync(path.join(os.tmpdir(), "ternakin-empty-"));
    fs.writeFileSync(path.join(emptyDist, "index.html"), "<html></html>");

    try {
      const app = createApp({ webDistDir: emptyDist });
      const swRes = await request(app).get("/sw.js");
      const manifestRes = await request(app).get("/manifest.webmanifest");

      expect(swRes.status).toBe(404);
      expect(manifestRes.status).toBe(404);
    } finally {
      fs.rmSync(emptyDist, { recursive: true, force: true });
    }
  });

  it("middleware validate menolak masukan tidak valid dengan format galat seragam", async () => {
    const app = express();
    app.use(express.json());
    const contohSchema = z.object({ nama: z.string().min(2) });
    app.post("/uji", validate(contohSchema), (req, res) => {
      res.status(200).json({ ok: true, data: req.body });
    });

    const gagalRes = await request(app).post("/uji").send({ nama: "" });
    expect(gagalRes.status).toBe(400);
    expect(galatApiSchema.safeParse(gagalRes.body).success).toBe(true);
    expect(gagalRes.body.kode).toBe("INPUT_TIDAK_VALID");

    const suksesRes = await request(app).post("/uji").send({ nama: "Kandang A" });
    expect(suksesRes.status).toBe(200);
    expect(suksesRes.body).toEqual({ ok: true, data: { nama: "Kandang A" } });
  });
});
