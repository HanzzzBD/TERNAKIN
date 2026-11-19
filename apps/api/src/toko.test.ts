import crypto from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { daftarTokoResponseSchema, galatApiSchema, tokoTerurutSchema } from "@ternakin/shared";
import { z } from "zod";
import { createApp } from "./app.js";

describe("API Fase 4: Toko Mitra, Rujukan Biaya, Lead, dan Rute Admin", () => {
  it("GET /v1/toko mengembalikan 5 toko contoh tanpa nomor telepon tak terverifikasi", async () => {
    const app = createApp();
    const res = await request(app).get("/v1/toko");

    expect(res.status).toBe(200);
    const parsed = daftarTokoResponseSchema.parse(res.body);
    expect(parsed.toko).toHaveLength(5);
    expect(parsed.toko.every((t) => t.isDemo)).toBe(true);
    expect(parsed.toko.every((t) => t.nomorWa === null)).toBe(true);
  });

  it("GET /v1/toko/rujukan mengurutkan murni dari total biaya dan menandai harga usang", async () => {
    const app = createApp({ staleDays: 7 });
    const res = await request(app)
      .get("/v1/toko/rujukan")
      .query({ bahan: "jagung_kuning:50,dedak_padi:20,konsentrat_petelur:25,tepung_batu_kapur:5" });

    expect(res.status).toBe(200);
    const toko = z.array(tokoTerurutSchema).parse(res.body.toko);
    expect(toko).toHaveLength(5);

    // Toko termurah di seed adalah toko-tani-soreang (bukan mitra) -> harus urutan #1!
    expect(toko[0]?.id).toBe("toko-tani-soreang");
    expect(toko[0]?.statusMitra).toBe(false);

    // Pastikan biaya tersusun menaik secara ketat
    for (let i = 1; i < toko.length; i++) {
      const prev = toko[i - 1]?.totalBiayaPer100Kg ?? 0;
      const curr = toko[i]?.totalBiayaPer100Kg ?? 0;
      expect(curr).toBeGreaterThanOrEqual(prev);
    }

    // Toko dengan harga 11 hari lalu tetap tampil dengan hasHargaUsang = true
    const usang = toko.find((t) => t.id === "toko-makmur-cicalengka");
    expect(usang?.hasHargaUsang).toBe(true);
  });

  it("POST /v1/lead idempoten dan rute admin memeriksa X-Admin-Key dengan ketat", async () => {
    const adminKey = "kunci-admin-uji-sangat-panjang-2026";
    const app = createApp({ adminKey });
    const clientId = crypto.randomUUID();

    // Catat lead dua kali dengan clientId sama -> tetap terhitung 1 lead
    const l1 = await request(app)
      .post("/v1/lead")
      .set("x-device-id", "dev-lead-1")
      .send({ clientId, tokoId: "toko-berkah-banjaran", src: "qr-banjaran" });
    expect(l1.status).toBe(200);

    const l2 = await request(app)
      .post("/v1/lead")
      .set("x-device-id", "dev-lead-1")
      .send({ clientId, tokoId: "toko-berkah-banjaran", src: "qr-banjaran" });
    expect(l2.status).toBe(200);

    // Tanpa kunci admin -> 401
    const noKey = await request(app).get("/v1/admin/lead");
    expect(noKey.status).toBe(401);
    expect(galatApiSchema.safeParse(noKey.body).success).toBe(true);

    // Kunci admin salah -> 403
    const wrongKey = await request(app).get("/v1/admin/lead").set("x-admin-key", "kunci-salah");
    expect(wrongKey.status).toBe(403);

    // Kunci admin benar -> rekap JSON (totalLead === 1) dan CSV
    const jsonLead = await request(app).get("/v1/admin/lead").set("x-admin-key", adminKey);
    expect(jsonLead.status).toBe(200);
    const berkah = jsonLead.body.rekap.find(
      (r: { tokoId: string }) => r.tokoId === "toko-berkah-banjaran",
    );
    expect(berkah.totalLead).toBe(1);

    const csvLead = await request(app)
      .get("/v1/admin/lead?format=csv")
      .set("x-admin-key", adminKey);
    expect(csvLead.status).toBe(200);
    expect(csvLead.headers["content-type"]).toContain("text/csv");
    expect(csvLead.text).toContain("toko-berkah-banjaran");

    // Admin perbarui harga toko usang -> kini menjadi segar
    const updateHarga = await request(app)
      .put("/v1/admin/toko/toko-makmur-cicalengka/harga")
      .set("x-admin-key", adminKey)
      .send({
        harga: [
          {
            bahanId: "jagung_kuning",
            harga: 6100,
            asalHarga: "Dikirim toko lewat WhatsApp",
          },
        ],
      });
    expect(updateHarga.status).toBe(200);
    const jagung = updateHarga.body.toko.harga.find(
      (h: { bahanId: string }) => h.bahanId === "jagung_kuning",
    );
    expect(jagung.harga).toBe(6100);
  });

  it("POST /v1/sinkron memproses catat_lead dari antrean offline", async () => {
    const adminKey = "kunci-admin-uji-2";
    const app = createApp({ adminKey });
    const opId = crypto.randomUUID();
    const clientId = crypto.randomUUID();

    const syncRes = await request(app)
      .post("/v1/sinkron")
      .send({
        perangkatId: "dev-offline-lead",
        itemOutbox: [
          {
            opId,
            jenis: "catat_lead",
            dibuatPada: new Date().toISOString(),
            payload: {
              clientId,
              tokoId: "toko-sari-lembang",
              src: "qr-lembang",
              dibuatPada: new Date().toISOString(),
            },
          },
        ],
      });

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.dikonfirmasiOpIds).toEqual([opId]);

    const leadRes = await request(app).get("/v1/admin/lead").set("x-admin-key", adminKey);
    const sari = leadRes.body.rekap.find(
      (r: { tokoId: string }) => r.tokoId === "toko-sari-lembang",
    );
    expect(sari.totalLead).toBe(1);
  });
});
