import crypto from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  daftarPeluangResponseSchema,
  mintaOtpResponseSchema,
  peluangInvestasiSchema,
  sesiAkunResponseSchema,
  type PeranAkun,
} from "@ternakin/shared";
import { createApp } from "./app.js";
import { initDatabase } from "./db/database.js";

function buatApp() {
  const dbCtx = initDatabase(":memory:");
  return { app: createApp({ dbCtx, rahasiaOtp: "rahasia-uji" }), dbCtx };
}

type Agen = ReturnType<typeof request.agent>;

async function masukDemo(agent: Agen, peran: PeranAkun) {
  const res = await agent.post("/v1/auth/demo").send({ peran });
  expect(res.status).toBe(200);
  return sesiAkunResponseSchema.parse(res.body);
}

async function masukOtp(agent: Agen, nomor: string, peran?: PeranAkun) {
  const minta = await agent.post("/v1/auth/otp/minta").send({ nomorPonsel: nomor });
  const { kodeDemo } = mintaOtpResponseSchema.parse(minta.body);
  const res = await agent
    .post("/v1/auth/otp/verifikasi")
    .send({ nomorPonsel: nomor, kode: kodeDemo, peran });
  expect(res.status).toBe(200);
  return sesiAkunResponseSchema.parse(res.body);
}

const AJUAN = {
  namaPeternak: "Kang Ujang",
  namaKandang: "Kandang Mekarsari",
  kecamatan: "Banjaran",
  wilayah: "Kab. Bandung",
  lat: -7.05,
  lng: 107.59,
  pengalamanTahun: 3,
  jumlahEkor: 800,
  kebutuhanModal: 25_000_000,
  porsiPemodalPersen: 60,
  rencanaMulai: "2026-12-15",
};

describe("Daftar peluang investasi (simulasi)", () => {
  it("bisa dilihat tanpa akun dan memakai data contoh yang sama dengan prototipe", async () => {
    const { app } = buatApp();
    const res = await request(app).get("/v1/investasi/peluang");
    expect(res.status).toBe(200);
    const { peluang } = daftarPeluangResponseSchema.parse(res.body);
    expect(peluang.map((p) => p.id)).toEqual([
      "pl-ciparay",
      "pl-cileunyi",
      "pl-lembang",
      "pl-soreang",
      "pl-jatinangor",
    ]);
    const ciparay = peluang[0]!;
    expect(ciparay).toMatchObject({
      peternak: "Pak Dedi S.",
      modalTerkumpul: 19_500_000,
      izinData: true,
      milikSaya: false,
      minatSaya: 0,
      isDemo: true,
    });
    expect(ciparay.catatan.length).toBeGreaterThan(0);
  });
});

describe("Pengguna mencatat minat titip modal", () => {
  it("minat menambah modal terkumpul dan tercatat di minat saya", async () => {
    const { app } = buatApp();
    const agent = request.agent(app);
    await masukDemo(agent, "pengguna");

    const res = await agent
      .post("/v1/investasi/peluang/pl-ciparay/minat")
      .send({ nominal: 250_000 });
    expect(res.status).toBe(201);
    const peluang = peluangInvestasiSchema.parse(res.body.peluang);
    expect(peluang.modalTerkumpul).toBe(19_750_000);
    expect(peluang.minatSaya).toBe(250_000);

    const minat = await agent.get("/v1/investasi/minat-saya");
    expect(minat.body.minat).toHaveLength(1);
    expect(minat.body.minat[0]).toMatchObject({
      peluangId: "pl-ciparay",
      namaKandang: "Kandang Sukamaju",
      nominal: 250_000,
    });

    // Orang lain melihat modal bertambah, tetapi minatSaya miliknya tetap 0.
    const tamu = await request(app).get("/v1/investasi/peluang/pl-ciparay");
    expect(tamu.body.peluang).toMatchObject({ modalTerkumpul: 19_750_000, minatSaya: 0 });
  });

  it("menolak nominal di bawah minimal, melebihi sisa, dan peluang yang tidak dibuka", async () => {
    const { app } = buatApp();
    const agent = request.agent(app);
    await masukDemo(agent, "pengguna");
    const kirim = (id: string, nominal: number) =>
      agent.post(`/v1/investasi/peluang/${id}/minat`).send({ nominal });

    expect((await kirim("pl-ciparay", 50_000)).body.kode).toBe("DI_BAWAH_MINIMAL");
    expect((await kirim("pl-ciparay", 13_000_000)).body.kode).toBe("MELEBIHI_SISA");
    expect((await kirim("pl-soreang", 100_000)).status).toBe(409); // menunggu pemeriksaan
    expect((await kirim("pl-cileunyi", 100_000)).status).toBe(409); // sedang dipelihara
    expect((await kirim("pl-tidak-ada", 100_000)).status).toBe(404);
  });

  it("tamu dan peternak tidak bisa mencatat minat", async () => {
    const { app } = buatApp();
    const tamu = await request(app)
      .post("/v1/investasi/peluang/pl-ciparay/minat")
      .send({ nominal: 100_000 });
    expect(tamu.status).toBe(401);

    const peternak = request.agent(app);
    await masukDemo(peternak, "peternak");
    const res = await peternak
      .post("/v1/investasi/peluang/pl-lembang/minat")
      .send({ nominal: 100_000 });
    expect(res.status).toBe(403);
    expect(res.body.kode).toBe("PERAN_TIDAK_SESUAI");
  });
});

describe("Pembatasan fitur untuk peran Pengguna", () => {
  it("pengguna ditolak dari fitur peternak, tetapi tetap bisa tanya Kokok", async () => {
    const { app } = buatApp();
    const agent = request.agent(app);
    await masukDemo(agent, "pengguna");

    const ditolak = [
      await agent.get("/v1/kandang"),
      await agent
        .post("/v1/kandang")
        .send({ nama: "Kandang", jenisAyam: "petelur", jumlahEkor: 10 }),
      await agent
        .post("/v1/sinkron")
        .send({ perangkatId: "x", terakhirSinkron: null, itemOutbox: [] }),
      await agent.post("/v1/pakan/urai").send({ teks: "jagung 6.500" }),
      await agent.get("/v1/toko/rujukan"),
      await agent.put(`/v1/catatan/${crypto.randomUUID()}`).send({}),
    ];
    for (const res of ditolak) {
      expect(res.status).toBe(403);
      expect(res.body.kode).toBe("KHUSUS_PETERNAK");
    }

    const kokok = await agent
      .post("/v1/kokok/triase")
      .send({ gejala: "Ayam peliharaan saya ngorok dan bersin sejak kemarin" });
    expect(kokok.status).toBe(200);

    // Data referensi dan daftar toko tetap terbuka (dipakai cache offline).
    expect((await agent.get("/v1/referensi")).status).toBe(200);
    expect((await agent.get("/v1/toko")).status).toBe(200);
  });

  it("tamu tetap bisa memakai fitur peternak (mode tamu = peternak)", async () => {
    const { app } = buatApp();
    const res = await request(app)
      .post("/v1/kandang")
      .set("x-device-id", "tamu-1")
      .send({ nama: "Kandang Tamu", jenisAyam: "petelur", jumlahEkor: 300 });
    expect(res.status).toBe(200);
  });
});

describe("Peternak mengelola peluangnya", () => {
  it("izin data disembunyikan dari orang lain tetapi tetap terlihat oleh pemiliknya", async () => {
    const { app } = buatApp();
    const peternak = request.agent(app);
    await masukDemo(peternak, "peternak");

    const res = await peternak
      .put("/v1/investasi/peluang/pl-ciparay/izin")
      .send({ izinData: false });
    expect(res.status).toBe(200);
    expect(res.body.peluang).toMatchObject({ izinData: false, milikSaya: true });
    expect(res.body.peluang.catatan.length).toBeGreaterThan(0);

    const lain = await request(app).get("/v1/investasi/peluang/pl-ciparay");
    expect(lain.body.peluang).toMatchObject({ izinData: false, catatan: [] });

    const bukanMilik = await peternak
      .put("/v1/investasi/peluang/pl-lembang/izin")
      .send({ izinData: false });
    expect(bukanMilik.status).toBe(404);
  });

  it("peternak mengajukan peluang baru yang menunggu pemeriksaan dokter hewan", async () => {
    const { app, dbCtx } = buatApp();
    const agent = request.agent(app);
    const sesi = await masukOtp(agent, "081211112222", "peternak");

    const res = await agent.post("/v1/investasi/peluang").send(AJUAN);
    expect(res.status).toBe(201);
    const peluang = peluangInvestasiSchema.parse(res.body.peluang);
    expect(peluang).toMatchObject({
      status: "menunggu-pemeriksaan",
      peternak: "Kang Ujang",
      milikSaya: true,
      modalTerkumpul: 0,
      pemeriksaan: null,
      siklusLalu: null,
      isDemo: false,
    });

    const nama = dbCtx.db
      .prepare("SELECT nama FROM pengguna WHERE id = ?")
      .get(sesi.pengguna.id) as {
      nama: string;
    };
    expect(nama.nama).toBe("Kang Ujang");

    // Pengguna tidak bisa mengajukan peluang.
    const pengguna = request.agent(app);
    await masukDemo(pengguna, "pengguna");
    expect((await pengguna.post("/v1/investasi/peluang").send(AJUAN)).status).toBe(403);
  });
});

describe("Peran akun", () => {
  it("peran dipilih saat masuk pertama, lalu tidak berubah lewat login berikutnya", async () => {
    const { app, dbCtx } = buatApp();
    const sesi1 = await masukOtp(request.agent(app), "081233334444", "pengguna");
    expect(sesi1.pengguna.peran).toBe("pengguna");

    dbCtx.db.prepare("DELETE FROM otp_permintaan").run();
    const sesi2 = await masukOtp(request.agent(app), "081233334444", "peternak");
    expect(sesi2.pengguna.peran).toBe("pengguna");
  });

  it("akun tanpa peran bisa memilih, lalu mengganti peran dari Profil", async () => {
    const { app } = buatApp();
    const agent = request.agent(app);
    const sesi = await masukOtp(agent, "081255556666");
    expect(sesi.pengguna.peran).toBeNull();

    const pilih = await agent.put("/v1/auth/peran").send({ peran: "peternak" });
    expect(pilih.body.pengguna.peran).toBe("peternak");
    const ganti = await agent.put("/v1/auth/peran").send({ peran: "pengguna" });
    expect(ganti.body.pengguna.peran).toBe("pengguna");
    expect((await agent.get("/v1/auth/saya")).body.pengguna.peran).toBe("pengguna");

    expect((await request(app).put("/v1/auth/peran").send({ peran: "peternak" })).status).toBe(401);
  });

  it("akun demo: tanpa nomor, peran tetap, dan tidak bisa dihapus", async () => {
    const { app } = buatApp();
    const agent = request.agent(app);
    const sesi = await masukDemo(agent, "peternak");
    expect(sesi.pengguna).toMatchObject({
      nama: "Pak Dedi S.",
      peran: "peternak",
      isDemo: true,
      nomorTersamar: "",
    });

    expect((await agent.put("/v1/auth/peran").send({ peran: "pengguna" })).status).toBe(403);
    expect((await agent.delete("/v1/akun")).status).toBe(403);
    expect((await agent.get("/v1/investasi/peluang/pl-ciparay")).body.peluang.milikSaya).toBe(true);
  });

  it("akun demo bisa dimatikan", async () => {
    const dbCtx = initDatabase(":memory:");
    const app = createApp({ dbCtx, akunDemoAktif: false });
    expect((await request(app).post("/v1/auth/demo").send({ peran: "pengguna" })).status).toBe(404);
  });
});
