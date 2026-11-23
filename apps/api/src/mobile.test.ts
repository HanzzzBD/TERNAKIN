import request from "supertest";
import { describe, expect, it } from "vitest";
import { sesiAkunResponseSchema } from "@ternakin/shared";
import { createApp } from "./app.js";
import { initDatabase } from "./db/database.js";

function buatApp() {
  const dbCtx = initDatabase(":memory:");
  return createApp({ dbCtx, rahasiaOtp: "rahasia-uji" });
}

describe("Sesi untuk aplikasi mobile (Bearer token)", () => {
  it("web tidak menerima token di body; cookie tetap dipakai", async () => {
    const res = await request(buatApp()).post("/v1/auth/demo").send({ peran: "peternak" });
    expect(res.status).toBe(200);
    expect(sesiAkunResponseSchema.parse(res.body).token).toBeUndefined();
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^tk_sesi=/);
  });

  it("klien mobile menerima token dan bisa memakainya sebagai Bearer", async () => {
    const app = buatApp();
    const masuk = await request(app)
      .post("/v1/auth/demo")
      .set("X-Ternakin-Klien", "mobile")
      .send({ peran: "peternak" });
    const { token, pengguna } = sesiAkunResponseSchema.parse(masuk.body);
    expect(token).toMatch(/^[A-Za-z0-9_-]{20,}$/);

    const saya = await request(app).get("/v1/auth/saya").set("Authorization", `Bearer ${token}`);
    expect(saya.status).toBe(200);
    expect(sesiAkunResponseSchema.parse(saya.body).pengguna.id).toBe(pengguna.id);

    const keluar = await request(app)
      .post("/v1/auth/keluar")
      .set("Authorization", `Bearer ${token}`);
    expect(keluar.status).toBe(200);
    const setelah = await request(app).get("/v1/auth/saya").set("Authorization", `Bearer ${token}`);
    expect(setelah.status).toBe(401);
  });

  it("Bearer yang salah bentuk atau tidak dikenal diperlakukan sebagai tamu", async () => {
    const app = buatApp();
    for (const nilai of [
      "Bearer ",
      "Bearer abc",
      "Basic xxxxxxxxxxxxxxxxxxxxxxxx",
      `Bearer ${"a".repeat(40)}`,
    ]) {
      const res = await request(app).get("/v1/auth/saya").set("Authorization", nilai);
      expect(res.status).toBe(401);
    }
  });
});
