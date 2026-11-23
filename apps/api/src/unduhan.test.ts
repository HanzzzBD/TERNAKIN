import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { galatApiSchema, unduhanResponseSchema } from "@ternakin/shared";
import { createApp } from "./app.js";

const folderUji: string[] = [];
function buatFolder(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ternakin-unduhan-"));
  folderUji.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of folderUji.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe("Unduhan APK Android", () => {
  it("tanpa folder unduhan: info tidak tersedia dan unduhan 404 UNDUHAN_BELUM_ADA", async () => {
    const app = createApp();
    const info = unduhanResponseSchema.parse((await request(app).get("/v1/unduhan")).body);
    expect(info.android).toEqual({
      tersedia: false,
      url: "/unduh/ternakin.apk",
      ukuranByte: null,
      diperbaruiPada: null,
    });

    const unduh = await request(app).get("/unduh/ternakin.apk");
    expect(unduh.status).toBe(404);
    expect(galatApiSchema.parse(unduh.body).kode).toBe("UNDUHAN_BELUM_ADA");
  });

  it("folder ada tetapi APK belum dipasang: tetap tidak tersedia", async () => {
    const app = createApp({ unduhanDir: buatFolder() });
    const info = unduhanResponseSchema.parse((await request(app).get("/v1/unduhan")).body);
    expect(info.android.tersedia).toBe(false);
    expect((await request(app).get("/unduh/ternakin.apk")).status).toBe(404);
  });

  it("APK terpasang: info berisi ukuran, unduhan dikirim sebagai lampiran APK utuh", async () => {
    const dir = buatFolder();
    const isi = Buffer.concat([Buffer.from("PK\u0003\u0004"), Buffer.alloc(2048, 7)]);
    fs.writeFileSync(path.join(dir, "ternakin.apk"), isi);
    const app = createApp({ unduhanDir: dir });

    const info = unduhanResponseSchema.parse((await request(app).get("/v1/unduhan")).body);
    expect(info.android.tersedia).toBe(true);
    expect(info.android.ukuranByte).toBe(isi.length);
    expect(info.android.diperbaruiPada).toBeTruthy();

    const unduh = await request(app)
      .get("/unduh/ternakin.apk")
      .buffer(true)
      .parse((res, cb) => {
        const potongan: Buffer[] = [];
        res.on("data", (c: Buffer) => potongan.push(c));
        res.on("end", () => cb(null, Buffer.concat(potongan)));
      });
    expect(unduh.status).toBe(200);
    expect(unduh.headers["content-type"]).toContain("application/vnd.android.package-archive");
    expect(unduh.headers["content-disposition"]).toMatch(/^attachment; filename="?Ternakin\.apk"?/);
    expect(unduh.headers["cache-control"]).toBe("no-cache");
    expect(Buffer.compare(unduh.body as Buffer, isi)).toBe(0);
  });

  it("tamu boleh melihat info unduhan (tidak perlu masuk)", async () => {
    const app = createApp({ unduhanDir: buatFolder() });
    expect((await request(app).get("/v1/unduhan")).status).toBe(200);
  });
});
