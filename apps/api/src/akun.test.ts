import crypto from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { mintaOtpResponseSchema, sesiAkunResponseSchema } from "@ternakin/shared";
import { FonntePengirimOtp, GalatPengirimOtp, type PengirimOtp } from "./adapters/pengirimOtp.js";
import { createApp } from "./app.js";
import { initDatabase } from "./db/database.js";

const NOMOR = "0812 3456 7890";
const NOMOR_628 = "6281234567890";

function buatAppUji(pengirimOtp?: PengirimOtp | null) {
  const dbCtx = initDatabase(":memory:");
  const app = createApp({ dbCtx, rahasiaOtp: "rahasia-uji", pengirimOtp });
  return { app, dbCtx };
}

async function mintaKode(agent: ReturnType<typeof request.agent>, nomor = NOMOR): Promise<string> {
  const res = await agent.post("/v1/auth/otp/minta").send({ nomorPonsel: nomor });
  expect(res.status).toBe(200);
  const body = mintaOtpResponseSchema.parse(res.body);
  expect(body.kodeDemo).toMatch(/^\d{6}$/);
  return body.kodeDemo!;
}

async function masuk(
  agent: ReturnType<typeof request.agent>,
  opsi: { nomor?: string; perangkatId?: string } = {},
) {
  const kode = await mintaKode(agent, opsi.nomor);
  const res = await agent
    .post("/v1/auth/otp/verifikasi")
    .send({ nomorPonsel: opsi.nomor ?? NOMOR, kode, perangkatId: opsi.perangkatId });
  expect(res.status).toBe(200);
  return sesiAkunResponseSchema.parse(res.body);
}

function payloadKandang(id: string, nama: string) {
  return { id, nama, jenisAyam: "petelur", jumlahEkor: 500 };
}

/**
 * Data tamu lama di server (dibuat sebelum semua fitur wajib masuk). Tamu tidak bisa lagi menulis
 * lewat API, jadi baris disiapkan langsung di basis data untuk menguji pemindahan ke akun.
 */
function simpanKandangTamuLama(
  dbCtx: ReturnType<typeof initDatabase>,
  perangkatId: string,
  id: string,
  nama: string,
) {
  dbCtx.db
    .prepare(
      "INSERT INTO kandang (id, perangkat_id, nama, jenis_ayam, jumlah_ekor, diubah_pada) VALUES (?, ?, ?, 'petelur', 500, ?)",
    )
    .run(id, perangkatId, nama, new Date().toISOString());
}

describe("OTP: minta kode", () => {
  it("mode demo mengembalikan kode dan menyamarkan nomor", async () => {
    const { app } = buatAppUji();
    const res = await request(app).post("/v1/auth/otp/minta").send({ nomorPonsel: NOMOR });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      nomorTersamar: "0812****7890",
      berlakuDetik: 300,
      kirimUlangDetik: 60,
    });
  });

  it("menolak nomor yang bukan nomor ponsel Indonesia", async () => {
    const { app } = buatAppUji();
    const res = await request(app).post("/v1/auth/otp/minta").send({ nomorPonsel: "022123456" });
    expect(res.status).toBe(400);
    expect(res.body.kode).toBe("NOMOR_TIDAK_VALID");
  });

  it("membatasi kirim ulang dalam 60 detik untuk nomor yang sama", async () => {
    const { app } = buatAppUji();
    await request(app).post("/v1/auth/otp/minta").send({ nomorPonsel: NOMOR });
    const ulang = await request(app)
      .post("/v1/auth/otp/minta")
      .send({ nomorPonsel: "+6281234567890" });
    expect(ulang.status).toBe(429);
    expect(ulang.body.kode).toBe("OTP_TUNGGU");
    expect(ulang.body.rinci.tungguDetik).toBeGreaterThan(0);
  });

  it("menjawab 503 bila layanan OTP belum diatur", async () => {
    const { app } = buatAppUji(null);
    const res = await request(app).post("/v1/auth/otp/minta").send({ nomorPonsel: NOMOR });
    expect(res.status).toBe(503);
    expect(res.body.kode).toBe("OTP_BELUM_DIATUR");
  });

  it("menyimpan kode hanya sebagai hash", async () => {
    const { app, dbCtx } = buatAppUji();
    const kode = await mintaKode(request.agent(app));
    const row = dbCtx.db.prepare("SELECT kode_hash FROM otp_permintaan").get() as {
      kode_hash: string;
    };
    expect(row.kode_hash).not.toContain(kode);
    expect(row.kode_hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("OTP: verifikasi dan sesi", () => {
  it("kode salah ditolak, lalu dikunci setelah 5 kali salah", async () => {
    const { app } = buatAppUji();
    const agent = request.agent(app);
    const kode = await mintaKode(agent);
    const salah = kode === "000000" ? "111111" : "000000";

    for (let i = 1; i <= 4; i++) {
      const res = await agent
        .post("/v1/auth/otp/verifikasi")
        .send({ nomorPonsel: NOMOR, kode: salah });
      expect(res.body.kode).toBe("OTP_SALAH");
    }
    const kelima = await agent
      .post("/v1/auth/otp/verifikasi")
      .send({ nomorPonsel: NOMOR, kode: salah });
    expect(kelima.body.kode).toBe("OTP_TERLALU_BANYAK_PERCOBAAN");

    // Kode yang benar pun tidak berlaku lagi setelah dikunci.
    const benar = await agent.post("/v1/auth/otp/verifikasi").send({ nomorPonsel: NOMOR, kode });
    expect(benar.status).toBe(400);
    expect(benar.body.kode).toBe("OTP_KEDALUWARSA");
  });

  it("kode benar membuat sesi HttpOnly, kode tidak bisa dipakai dua kali", async () => {
    const { app } = buatAppUji();
    const agent = request.agent(app);
    const kode = await mintaKode(agent);

    const res = await agent.post("/v1/auth/otp/verifikasi").send({ nomorPonsel: NOMOR, kode });
    expect(res.status).toBe(200);
    expect(res.body.pengguna.nomorTersamar).toBe("0812****7890");
    const cookie = String(res.headers["set-cookie"]);
    expect(cookie).toContain("tk_sesi=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");

    const saya = await agent.get("/v1/auth/saya");
    expect(saya.status).toBe(200);
    expect(saya.body.pengguna.id).toBe(res.body.pengguna.id);

    const ulang = await request(app)
      .post("/v1/auth/otp/verifikasi")
      .send({ nomorPonsel: NOMOR, kode });
    expect(ulang.body.kode).toBe("OTP_KEDALUWARSA");
  });

  it("tanpa cookie /saya menjawab 401, dan keluar mengakhiri sesi", async () => {
    const { app } = buatAppUji();
    expect((await request(app).get("/v1/auth/saya")).status).toBe(401);

    const agent = request.agent(app);
    await masuk(agent);
    const keluar = await agent.post("/v1/auth/keluar");
    expect(keluar.status).toBe(200);
    expect((await agent.get("/v1/auth/saya")).status).toBe(401);
  });

  it("nomor yang sama di perangkat lain masuk ke akun yang sama", async () => {
    const { app, dbCtx } = buatAppUji();
    const s1 = await masuk(request.agent(app));
    // Lewati jeda kirim ulang 60 detik dengan menghapus riwayat OTP.
    dbCtx.db.prepare("DELETE FROM otp_permintaan").run();
    const s2 = await masuk(request.agent(app));
    expect(s2.pengguna.id).toBe(s1.pengguna.id);
    const jumlah = dbCtx.db
      .prepare("SELECT COUNT(*) AS n FROM pengguna WHERE nomor_ponsel IS NOT NULL")
      .get() as { n: number };
    expect(jumlah.n).toBe(1);
  });
});

describe("Pindah data tamu ke akun", () => {
  it("kandang perangkat pindah ke akun dan terlihat dari perangkat lain", async () => {
    const { app, dbCtx } = buatAppUji();
    const perangkatA = "perangkat-tamu-a";
    const kandangId = crypto.randomUUID();

    simpanKandangTamuLama(dbCtx, perangkatA, kandangId, "Kandang Ciparay");

    const agentA = request.agent(app);
    const sesi = await masuk(agentA, { perangkatId: perangkatA });
    expect(sesi.kandangDipindahkan).toBe(1);

    // Data tidak lagi milik perangkat (mode tamu)...
    const sisaTamu = dbCtx.db
      .prepare("SELECT COUNT(*) AS n FROM kandang WHERE perangkat_id = ?")
      .get(perangkatA) as { n: number };
    expect(sisaTamu.n).toBe(0);

    // ...melainkan milik akun, dari perangkat mana pun yang masuk.
    dbCtx.db.prepare("DELETE FROM otp_permintaan").run();
    const agentB = request.agent(app);
    await masuk(agentB, { perangkatId: "perangkat-baru-b" });
    const sinkron = await agentB
      .post("/v1/sinkron")
      .send({ perangkatId: "perangkat-baru-b", terakhirSinkron: null, itemOutbox: [] });
    expect(sinkron.status).toBe(200);
    expect(sinkron.body.kandangTerbaru.map((k: { id: string }) => k.id)).toEqual([kandangId]);

    const row = dbCtx.db.prepare("SELECT pengguna_id FROM kandang WHERE id = ?").get(kandangId) as {
      pengguna_id: string;
    };
    expect(row.pengguna_id).toBe(sesi.pengguna.id);
  });

  it("pemakaian AI hari ini ikut pindah agar batas harian tidak bisa dilewati", async () => {
    const { app, dbCtx } = buatAppUji();
    const perangkat = "perangkat-kuota";
    dbCtx.db
      .prepare(
        "INSERT INTO pemakaian_llm (perangkat_id, rute, token_masuk, token_keluar, dibuat_pada) VALUES (?, 'uji', 1, 1, ?)",
      )
      .run(perangkat, new Date().toISOString());

    const sesi = await masuk(request.agent(app), { perangkatId: perangkat });
    const row = dbCtx.db
      .prepare("SELECT COUNT(*) AS n FROM pemakaian_llm WHERE perangkat_id = ?")
      .get(`akun:${sesi.pengguna.id}`) as { n: number };
    expect(row.n).toBe(1);
  });
});

describe("Keamanan kepemilikan data", () => {
  it("klien tidak bisa menyamar sebagai akun lewat x-device-id berawalan akun:", async () => {
    const { app } = buatAppUji();
    const agent = request.agent(app);
    const sesi = await masuk(agent);
    await agent.post("/v1/kandang").send(payloadKandang(crypto.randomUUID(), "Kandang Rahasia"));

    // Tanpa sesi: ditolak sebelum header perangkat dibaca.
    const penyamar = await request(app)
      .get("/v1/kandang")
      .set("x-device-id", `akun:${sesi.pengguna.id}`);
    expect(penyamar.status).toBe(401);

    // Akun lain yang mengirim header berawalan akun: tetap hanya melihat datanya sendiri.
    const lain = request.agent(app);
    await masuk(lain, { nomor: "081298765432" });
    const lihatLain = await lain.get("/v1/kandang").set("x-device-id", `akun:${sesi.pengguna.id}`);
    expect(lihatLain.status).toBe(200);
    expect(lihatLain.body.kandang).toEqual([]);

    const hapus = await request(app)
      .delete("/v1/akun")
      .send({ perangkatId: `akun:${sesi.pengguna.id}` });
    expect(hapus.status).toBe(400);
    expect((await agent.get("/v1/kandang")).body.kandang).toHaveLength(1);
  });

  it("kandang tidak bisa diambil alih atau ditulisi akun lain lewat ID-nya", async () => {
    const { app, dbCtx } = buatAppUji();
    const kandangId = crypto.randomUUID();
    const pemilik = request.agent(app);
    await masuk(pemilik);
    await pemilik.post("/v1/kandang").send(payloadKandang(kandangId, "Kandang Asli"));

    const penyusup = request.agent(app);
    await masuk(penyusup, { nomor: "081298765432" });

    const ambilAlih = await penyusup.post("/v1/kandang").send(payloadKandang(kandangId, "Diambil"));
    expect(ambilAlih.status).toBe(403);

    const catatanPut = await penyusup.put(`/v1/catatan/${crypto.randomUUID()}`).send({
      kandangId,
      tanggal: "2026-11-20",
      pakanKg: 1,
      telur: 1,
      kematian: 0,
      suhu: 27,
      diubahPada: "2026-11-20T08:00:00.000Z",
    });
    expect(catatanPut.status).toBe(403);

    const opCatatan = crypto.randomUUID();
    const sinkron = await penyusup.post("/v1/sinkron").send({
      perangkatId: "penyusup",
      terakhirSinkron: null,
      itemOutbox: [
        {
          opId: opCatatan,
          jenis: "upsert_catatan",
          dibuatPada: "2026-11-20T08:00:00.000Z",
          payload: {
            id: crypto.randomUUID(),
            kandangId,
            tanggal: "2026-11-20",
            pakanKg: 1,
            telur: 1,
            kematian: 0,
            suhu: 27,
            diubahPada: "2026-11-20T08:00:00.000Z",
          },
        },
      ],
    });
    expect(sinkron.status).toBe(200);
    expect(sinkron.body.dikonfirmasiOpIds).toEqual([opCatatan]);

    const nama = dbCtx.db.prepare("SELECT nama FROM kandang WHERE id = ?").get(kandangId) as {
      nama: string;
    };
    expect(nama.nama).toBe("Kandang Asli");
    const jumlahCatatan = dbCtx.db
      .prepare("SELECT COUNT(*) AS n FROM catatan_harian WHERE kandang_id = ?")
      .get(kandangId) as { n: number };
    expect(jumlahCatatan.n).toBe(0);
  });

  it("DELETE /v1/akun saat masuk menghapus akun, datanya, dan sesinya", async () => {
    const { app, dbCtx } = buatAppUji();
    const agent = request.agent(app);
    const sesi = await masuk(agent);
    await agent.post("/v1/kandang").send(payloadKandang(crypto.randomUUID(), "Kandang Dihapus"));

    const hapus = await agent.delete("/v1/akun");
    expect(hapus.status).toBe(200);

    const sisa = (sql: string) => (dbCtx.db.prepare(sql).get(sesi.pengguna.id) as { n: number }).n;
    expect(sisa("SELECT COUNT(*) AS n FROM pengguna WHERE id = ?")).toBe(0);
    expect(sisa("SELECT COUNT(*) AS n FROM sesi WHERE pengguna_id = ?")).toBe(0);
    expect(sisa("SELECT COUNT(*) AS n FROM kandang WHERE pengguna_id = ?")).toBe(0);
    expect((await agent.get("/v1/auth/saya")).status).toBe(401);
  });
});

describe("Pengirim OTP Fonnte", () => {
  it("mengirim token tanpa Bearer dan nomor 628 dengan countryCode 0", async () => {
    let tertangkap: { url: string; headers: Record<string, string>; form: FormData } | null = null;
    const fetchFn = (async (url: string | URL | Request, init?: RequestInit) => {
      tertangkap = {
        url: String(url),
        headers: init?.headers as Record<string, string>,
        form: init?.body as FormData,
      };
      return Response.json({ status: true, detail: "success! message in queue" });
    }) as typeof fetch;

    await new FonntePengirimOtp({ token: "token-uji", timeoutMs: 1000, fetchFn }).kirim(
      NOMOR_628,
      "Kode 123456",
    );

    expect(tertangkap).not.toBeNull();
    const t = tertangkap!;
    expect(t.url).toBe("https://api.fonnte.com/send");
    expect(t.headers.Authorization).toBe("token-uji");
    expect(t.form.get("target")).toBe(NOMOR_628);
    expect(t.form.get("countryCode")).toBe("0");
    expect(t.form.get("message")).toBe("Kode 123456");
  });

  it.each([
    [{ status: false, reason: "token invalid" }, 200],
    [{ Status: false, reason: "devices must belong to an account" }, 200],
    [{}, 500],
  ])("menganggap %j gagal", async (isi, status) => {
    const fetchFn = (async () => Response.json(isi, { status })) as typeof fetch;
    const pengirim = new FonntePengirimOtp({ token: "t", timeoutMs: 1000, fetchFn });
    await expect(pengirim.kirim(NOMOR_628, "x")).rejects.toThrow(GalatPengirimOtp);
  });

  it("bila Fonnte gagal, rute menjawab 502 dan kode bisa langsung diminta ulang", async () => {
    let gagal = true;
    const pengirim: PengirimOtp = {
      mode: "fonnte",
      kirim: async () => {
        if (gagal) throw new GalatPengirimOtp("insufficient quota");
      },
    };
    const { app, dbCtx } = buatAppUji(pengirim);

    const pertama = await request(app).post("/v1/auth/otp/minta").send({ nomorPonsel: NOMOR });
    expect(pertama.status).toBe(502);
    expect(pertama.body.kode).toBe("OTP_GAGAL_TERKIRIM");

    gagal = false;
    const kedua = await request(app).post("/v1/auth/otp/minta").send({ nomorPonsel: NOMOR });
    expect(kedua.status).toBe(200);
    expect(kedua.body.kodeDemo).toBeUndefined();
    const jumlah = dbCtx.db.prepare("SELECT COUNT(*) AS n FROM otp_permintaan").get() as {
      n: number;
    };
    expect(jumlah.n).toBe(1);
  });
});
