import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { sinkronResponseSchema } from "@ternakin/shared";
import { createApp } from "./app.js";
import { agenDemo, agenOtp } from "./uji/masuk.js";

describe("API Fase 3: Kandang, Catatan Harian, Sinkron, dan Hapus Akun", () => {
  it("membuat kandang, memperbarui catatan tanggal sama tanpa menggandakan, dan menerapkan perubahan terbaru menang", async () => {
    const app = createApp();
    const agen = await agenDemo(app);
    const deviceId = "perangkat-uji-1";
    const kandangId = crypto.randomUUID();
    const catatanId1 = crypto.randomUUID();
    const catatanId2 = crypto.randomUUID();

    const buatKandang = await agen.post("/v1/kandang").set("x-device-id", deviceId).send({
      id: kandangId,
      nama: "Kandang Lembang",
      jenisAyam: "petelur",
      jumlahEkor: 760,
      umurMinggu: 28,
      lokasi: "Lembang, Bandung Barat",
    });
    expect(buatKandang.status).toBe(200);
    expect(buatKandang.body.kandang.nama).toBe("Kandang Lembang");

    const simpan1 = await agen.put(`/v1/catatan/${catatanId1}`).set("x-device-id", deviceId).send({
      kandangId,
      tanggal: "2026-11-19",
      pakanKg: 82,
      telur: 610,
      kematian: 1,
      suhu: 27.5,
      diubahPada: "2026-11-19T08:00:00.000Z",
    });
    expect(simpan1.status).toBe(200);
    expect(simpan1.body.catatan.telur).toBe(610);

    // Menyimpan ulang tanggal yang sama dengan stempel waktu lebih baru memperbarui baris yang sama.
    const simpan2 = await agen.put(`/v1/catatan/${catatanId2}`).set("x-device-id", deviceId).send({
      kandangId,
      tanggal: "2026-11-19",
      pakanKg: 85,
      telur: 630,
      kematian: 0,
      suhu: 28,
      diubahPada: "2026-11-19T09:00:00.000Z",
    });
    expect(simpan2.status).toBe(200);
    expect(simpan2.body.catatan.id).toBe(catatanId1);
    expect(simpan2.body.catatan.telur).toBe(630);

    // Kiriman dengan stempel waktu lebih lama kalah (Last-Write-Wins).
    const simpanLama = await agen
      .put(`/v1/catatan/${catatanId1}`)
      .set("x-device-id", deviceId)
      .send({
        kandangId,
        tanggal: "2026-11-19",
        pakanKg: 50,
        telur: 100,
        kematian: 9,
        suhu: 35,
        diubahPada: "2026-11-19T07:00:00.000Z",
      });
    expect(simpanLama.status).toBe(200);
    expect(simpanLama.body.catatan.telur).toBe(630);
  });

  it("POST /v1/sinkron idempoten untuk opId ganda dan mendukung hapus catatan", async () => {
    const app = createApp();
    const agen = await agenDemo(app);
    const deviceId = "perangkat-sinkron";
    const kandangId = crypto.randomUUID();
    const catatanId = crypto.randomUUID();
    const opKandang = crypto.randomUUID();
    const opCatatan = crypto.randomUUID();

    const payloadSync = {
      perangkatId: deviceId,
      itemOutbox: [
        {
          opId: opKandang,
          jenis: "upsert_kandang",
          dibuatPada: "2026-11-19T08:00:00.000Z",
          payload: {
            id: kandangId,
            nama: "Kandang Soreang",
            jenisAyam: "petelur",
            jumlahEkor: 500,
            umurMinggu: 25,
            lokasi: "Soreang",
            bahanTersedia: ["jagung_kuning"],
            diubahPada: "2026-11-19T08:00:00.000Z",
          },
        },
        {
          opId: opCatatan,
          jenis: "upsert_catatan",
          dibuatPada: "2026-11-19T08:01:00.000Z",
          payload: {
            id: catatanId,
            kandangId,
            tanggal: "2026-11-19",
            pakanKg: 55,
            telur: 420,
            kematian: 0,
            suhu: 26,
            diubahPada: "2026-11-19T08:01:00.000Z",
          },
        },
      ],
    };

    const res1 = await agen.post("/v1/sinkron").send(payloadSync);
    expect(res1.status).toBe(200);
    const parsed1 = sinkronResponseSchema.parse(res1.body);
    expect(parsed1.dikonfirmasiOpIds).toEqual([opKandang, opCatatan]);
    expect(parsed1.catatanTerbaru).toHaveLength(1);

    // Kirim ulang opId yang sama persis: harus tetap idempoten tanpa menggandakan catatan.
    const res2 = await agen.post("/v1/sinkron").send(payloadSync);
    expect(res2.status).toBe(200);
    const parsed2 = sinkronResponseSchema.parse(res2.body);
    expect(parsed2.dikonfirmasiOpIds).toEqual([opKandang, opCatatan]);
    expect(parsed2.catatanTerbaru).toHaveLength(1);

    // Hapus catatan lewat outbox
    const opHapus = crypto.randomUUID();
    const resHapus = await agen.post("/v1/sinkron").send({
      perangkatId: deviceId,
      itemOutbox: [
        {
          opId: opHapus,
          jenis: "hapus_catatan",
          dibuatPada: "2026-11-19T09:00:00.000Z",
          payload: {
            id: catatanId,
            kandangId,
            tanggal: "2026-11-19",
            dihapusPada: "2026-11-19T09:00:00.000Z",
            diubahPada: "2026-11-19T09:00:00.000Z",
          },
        },
      ],
    });
    expect(resHapus.status).toBe(200);
    expect(resHapus.body.catatanTerbaru[0].dihapusPada).toBe("2026-11-19T09:00:00.000Z");
  });

  it("DELETE /v1/akun menghapus akun beserta seluruh kandang dan catatannya", async () => {
    const app = createApp();
    const nomor = "081234500001";
    const agen = await agenOtp(app, nomor);
    const kandangId = crypto.randomUUID();
    const catatanId = crypto.randomUUID();

    await agen.post("/v1/kandang").send({
      id: kandangId,
      nama: "Kandang Sementara",
      jenisAyam: "petelur",
      jumlahEkor: 300,
    });

    await agen.put(`/v1/catatan/${catatanId}`).send({
      kandangId,
      tanggal: "2026-11-19",
      pakanKg: 35,
      telur: 240,
      kematian: 0,
      suhu: 27,
      diubahPada: "2026-11-19T08:00:00.000Z",
    });

    const delRes = await agen.delete("/v1/akun");
    expect(delRes.status).toBe(200);
    expect(delRes.body.ok).toBe(true);

    // Sesi lama ikut berakhir; masuk lagi dengan nomor yang sama memulai akun kosong.
    expect((await agen.get("/v1/kandang")).status).toBe(401);
    const lagi = await agenOtp(app, nomor);
    const cekKandang = await lagi.get("/v1/kandang");
    expect(cekKandang.status).toBe(200);
    expect(cekKandang.body.kandang).toEqual([]);
  });
});
