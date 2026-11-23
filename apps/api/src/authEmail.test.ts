import crypto from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  kodeEmailResponseSchema,
  konfigurasiAuthResponseSchema,
  sesiAkunResponseSchema,
} from "@ternakin/shared";
import type { PengirimEmail } from "./adapters/pengirimEmail.js";
import { createApp } from "./app.js";
import { initDatabase } from "./db/database.js";
import { buatVerifikasiGoogle } from "./lib/googleIdToken.js";
import { CID_LOGO, buatEmailKode, type IsiEmail } from "./lib/templateEmail.js";

const CLIENT_ID = "uji-123.apps.googleusercontent.com";

/* ---------- Penerbit token Google tiruan (kunci RSA sendiri) ---------- */

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const KID = "kunci-uji";
const jwkPublik = { ...publicKey.export({ format: "jwk" }), kid: KID, alg: "RS256", use: "sig" };

function tokenGoogle(isi: Record<string, unknown>, kunci = privateKey): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const kepala = b64({ alg: "RS256", kid: KID, typ: "JWT" });
  const badan = b64({
    iss: "https://accounts.google.com",
    aud: CLIENT_ID,
    exp: Math.floor(Date.now() / 1000) + 3600,
    email_verified: true,
    ...isi,
  });
  const tanda = crypto.sign("RSA-SHA256", Buffer.from(`${kepala}.${badan}`), kunci);
  return `${kepala}.${badan}.${tanda.toString("base64url")}`;
}

const fetchJwks = (async () =>
  Response.json(
    { keys: [jwkPublik] },
    { headers: { "cache-control": "max-age=600" } },
  )) as typeof fetch;

function buatApp(opsi: { pengirimEmail?: PengirimEmail | null } = {}) {
  const dbCtx = initDatabase(":memory:");
  const app = createApp({
    dbCtx,
    rahasiaOtp: "rahasia-uji",
    googleClientId: CLIENT_ID,
    verifikasiGoogle: buatVerifikasiGoogle(CLIENT_ID, fetchJwks),
    ...opsi,
  });
  return { app, dbCtx };
}

type Agen = ReturnType<typeof request.agent>;

const DAFTAR = {
  nama: "Bu Euis",
  email: "Euis.Peternak@Gmail.com",
  sandi: "rahasia-kuat-1",
  peran: "peternak" as const,
};

async function daftarDanVerifikasi(agent: Agen, perangkatId?: string) {
  const daftar = await agent.post("/v1/auth/email/daftar").send(DAFTAR);
  expect(daftar.status).toBe(201);
  const { kodeDemo } = kodeEmailResponseSchema.parse(daftar.body);
  const res = await agent
    .post("/v1/auth/email/verifikasi")
    .send({ email: DAFTAR.email, kode: kodeDemo, perangkatId });
  expect(res.status).toBe(200);
  return sesiAkunResponseSchema.parse(res.body);
}

describe("Konfigurasi cara masuk", () => {
  it("memberi tahu web cara masuk yang aktif", async () => {
    const { app } = buatApp();
    const res = await request(app).get("/v1/auth/konfigurasi");
    expect(konfigurasiAuthResponseSchema.parse(res.body)).toEqual({
      googleClientId: CLIENT_ID,
      whatsapp: true,
      email: "demo",
      akunDemo: true,
    });
  });
});

describe("Daftar dan masuk dengan email", () => {
  it("daftar → kode verifikasi → langsung masuk dengan nama dan peran dari form", async () => {
    const { app, dbCtx } = buatApp();
    const agent = request.agent(app);
    const sesi = await daftarDanVerifikasi(agent);
    expect(sesi.pengguna).toMatchObject({
      nama: "Bu Euis",
      peran: "peternak",
      emailTersamar: "eu***@gmail.com",
      isDemo: false,
    });
    expect((await agent.get("/v1/auth/saya")).status).toBe(200);

    // Email disimpan huruf kecil; sandi hanya sebagai hash scrypt.
    const row = dbCtx.db
      .prepare("SELECT email, sandi_hash FROM pengguna WHERE id = ?")
      .get(sesi.pengguna.id) as { email: string; sandi_hash: string };
    expect(row.email).toBe("euis.peternak@gmail.com");
    expect(row.sandi_hash.startsWith("scrypt$")).toBe(true);
    expect(row.sandi_hash).not.toContain(DAFTAR.sandi);
  });

  it("masuk dengan email + sandi, menolak sandi salah dan email tak dikenal dengan pesan sama", async () => {
    const { app } = buatApp();
    await daftarDanVerifikasi(request.agent(app));

    const salah = await request(app)
      .post("/v1/auth/email/masuk")
      .send({ email: DAFTAR.email, sandi: "bukan-sandinya" });
    const takDikenal = await request(app)
      .post("/v1/auth/email/masuk")
      .send({ email: "tidak.ada@gmail.com", sandi: "apa-saja-1" });
    expect(salah.status).toBe(401);
    expect(takDikenal.status).toBe(401);
    expect(salah.body).toEqual(takDikenal.body);

    const agent = request.agent(app);
    const masuk = await agent
      .post("/v1/auth/email/masuk")
      .send({ email: "euis.peternak@gmail.com", sandi: DAFTAR.sandi });
    expect(masuk.status).toBe(200);
    expect(String(masuk.headers["set-cookie"])).toContain("HttpOnly");
  });

  it("akun yang belum diverifikasi diminta verifikasi dulu saat masuk", async () => {
    const { app, dbCtx } = buatApp();
    await request(app).post("/v1/auth/email/daftar").send(DAFTAR);
    dbCtx.db.prepare("DELETE FROM kode_email").run(); // lewati jeda kirim ulang

    const res = await request(app)
      .post("/v1/auth/email/masuk")
      .send({ email: DAFTAR.email, sandi: DAFTAR.sandi });
    expect(res.status).toBe(403);
    expect(res.body.kode).toBe("EMAIL_BELUM_TERVERIFIKASI");
    expect(res.body.rinci.kodeDemo).toMatch(/^\d{6}$/);
  });

  it("email yang sudah terverifikasi tidak bisa didaftarkan ulang", async () => {
    const { app } = buatApp();
    await daftarDanVerifikasi(request.agent(app));
    const ulang = await request(app).post("/v1/auth/email/daftar").send(DAFTAR);
    expect(ulang.status).toBe(409);
    expect(ulang.body.kode).toBe("EMAIL_TERDAFTAR");
  });

  it("kode verifikasi salah ditolak dan dikunci setelah 5 kali", async () => {
    const { app } = buatApp();
    const daftar = await request(app).post("/v1/auth/email/daftar").send(DAFTAR);
    const kode = daftar.body.kodeDemo as string;
    const salah = kode === "000000" ? "111111" : "000000";
    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post("/v1/auth/email/verifikasi")
        .send({ email: DAFTAR.email, kode: salah });
      expect(res.body.kode).toBe("KODE_SALAH");
    }
    const kelima = await request(app)
      .post("/v1/auth/email/verifikasi")
      .send({ email: DAFTAR.email, kode: salah });
    expect(kelima.body.kode).toBe("KODE_TERLALU_BANYAK_PERCOBAAN");
    const benar = await request(app)
      .post("/v1/auth/email/verifikasi")
      .send({ email: DAFTAR.email, kode });
    expect(benar.body.kode).toBe("KODE_KEDALUWARSA");
  });

  it("data tamu lama di perangkat ikut pindah ke akun email", async () => {
    const { app, dbCtx } = buatApp();
    // Tamu tidak bisa lagi menulis lewat API; baris disiapkan langsung untuk meniru data lama.
    dbCtx.db
      .prepare(
        "INSERT INTO kandang (id, perangkat_id, nama, jenis_ayam, jumlah_ekor, diubah_pada) VALUES (?, ?, 'Kandang Tamu', 'petelur', 300, ?)",
      )
      .run(crypto.randomUUID(), "tamu-email", new Date().toISOString());

    const sesi = await daftarDanVerifikasi(request.agent(app), "tamu-email");
    expect(sesi.kandangDipindahkan).toBe(1);
  });

  it("menolak daftar saat layanan email dimatikan (production tanpa SMTP)", async () => {
    const { app } = buatApp({ pengirimEmail: null });
    const res = await request(app).post("/v1/auth/email/daftar").send(DAFTAR);
    expect(res.status).toBe(503);
  });

  it("bila SMTP gagal, kode dibatalkan agar bisa langsung dicoba lagi", async () => {
    let gagal = true;
    const { app } = buatApp({
      pengirimEmail: {
        mode: "smtp",
        kirim: async () => {
          if (gagal) throw new Error("EAUTH");
        },
      },
    });
    const pertama = await request(app).post("/v1/auth/email/daftar").send(DAFTAR);
    expect(pertama.status).toBe(502);
    gagal = false;
    const kedua = await request(app).post("/v1/auth/email/daftar").send(DAFTAR);
    expect(kedua.status).toBe(201);
    expect(kedua.body.kodeDemo).toBeUndefined();
  });
});

describe("Lupa kata sandi", () => {
  it("kode reset → sandi baru → langsung masuk; sandi lama tidak berlaku", async () => {
    const { app, dbCtx } = buatApp();
    await daftarDanVerifikasi(request.agent(app));

    const lupa = await request(app).post("/v1/auth/email/lupa-sandi").send({ email: DAFTAR.email });
    expect(lupa.status).toBe(200);
    const kode = lupa.body.kodeDemo as string;

    const agent = request.agent(app);
    const reset = await agent
      .post("/v1/auth/email/reset-sandi")
      .send({ email: DAFTAR.email, kode, sandiBaru: "sandi-baru-123" });
    expect(reset.status).toBe(200);
    expect((await agent.get("/v1/auth/saya")).status).toBe(200);

    dbCtx.db.prepare("DELETE FROM kode_email").run();
    const lama = await request(app)
      .post("/v1/auth/email/masuk")
      .send({ email: DAFTAR.email, sandi: DAFTAR.sandi });
    expect(lama.status).toBe(401);
    const baru = await request(app)
      .post("/v1/auth/email/masuk")
      .send({ email: DAFTAR.email, sandi: "sandi-baru-123" });
    expect(baru.status).toBe(200);
  });

  it("respons sama untuk email yang tidak terdaftar (tidak bisa dipakai menebak akun)", async () => {
    const { app } = buatApp();
    const res = await request(app)
      .post("/v1/auth/email/lupa-sandi")
      .send({ email: "siapa@gmail.com" });
    expect(res.status).toBe(200);
    expect(kodeEmailResponseSchema.parse(res.body).kodeDemo).toBeUndefined();
  });
});

describe("Akun demo lewat form email", () => {
  it("juri bisa mengetik email & sandi demo; sandi demo tidak bisa direset", async () => {
    const { app } = buatApp();
    const agent = request.agent(app);
    const res = await agent
      .post("/v1/auth/email/masuk")
      .send({ email: "pengguna@demo.ternakin.id", sandi: "demo1234" });
    expect(res.status).toBe(200);
    expect(res.body.pengguna).toMatchObject({ nama: "Rani", peran: "pengguna", isDemo: true });

    const lupa = await request(app)
      .post("/v1/auth/email/lupa-sandi")
      .send({ email: "pengguna@demo.ternakin.id" });
    expect(lupa.body.kodeDemo).toBeUndefined();
  });

  it("data tamu tidak dipindahkan ke akun demo bersama", async () => {
    const { app } = buatApp();
    await request(app)
      .post("/v1/kandang")
      .set("x-device-id", "tamu-demo")
      .send({ nama: "Kandang Pribadi", jenisAyam: "petelur", jumlahEkor: 100 });
    const res = await request(app)
      .post("/v1/auth/email/masuk")
      .send({ email: "peternak@demo.ternakin.id", sandi: "demo1234", perangkatId: "tamu-demo" });
    expect(res.body.kandangDipindahkan).toBe(0);
  });
});

describe("Masuk dengan Google", () => {
  it("token sah membuat akun baru dengan peran yang dipilih", async () => {
    const { app } = buatApp();
    const agent = request.agent(app);
    const res = await agent.post("/v1/auth/google").send({
      credential: tokenGoogle({ sub: "g-1", email: "Rani.Investor@gmail.com", name: "Rani W." }),
      peran: "pengguna",
    });
    expect(res.status).toBe(200);
    expect(res.body.pengguna).toMatchObject({ nama: "Rani W.", peran: "pengguna", isDemo: false });

    // Masuk lagi dengan sub yang sama → akun yang sama
    const lagi = await request(app)
      .post("/v1/auth/google")
      .send({ credential: tokenGoogle({ sub: "g-1", email: "rani.investor@gmail.com" }) });
    expect(lagi.body.pengguna.id).toBe(res.body.pengguna.id);
  });

  it("menautkan ke akun email yang sudah ada", async () => {
    const { app } = buatApp();
    const sesi = await daftarDanVerifikasi(request.agent(app));
    const res = await request(app)
      .post("/v1/auth/google")
      .send({ credential: tokenGoogle({ sub: "g-euis", email: "euis.peternak@gmail.com" }) });
    expect(res.body.pengguna.id).toBe(sesi.pengguna.id);
  });

  it("menghapus sandi akun email belum terverifikasi saat ditautkan (cegah pengambilalihan)", async () => {
    const { app, dbCtx } = buatApp();
    // Orang lain mendaftar memakai email korban tetapi tidak bisa memverifikasinya.
    await request(app)
      .post("/v1/auth/email/daftar")
      .send({ ...DAFTAR, sandi: "sandi-penyusup" });

    await request(app)
      .post("/v1/auth/google")
      .send({ credential: tokenGoogle({ sub: "g-korban", email: "euis.peternak@gmail.com" }) });
    const row = dbCtx.db
      .prepare("SELECT sandi_hash FROM pengguna WHERE email = ?")
      .get("euis.peternak@gmail.com") as { sandi_hash: string | null };
    expect(row.sandi_hash).toBeNull();

    const penyusup = await request(app)
      .post("/v1/auth/email/masuk")
      .send({ email: DAFTAR.email, sandi: "sandi-penyusup" });
    expect(penyusup.status).toBe(401);
  });

  it.each([
    ["untuk aplikasi lain", { aud: "aplikasi-lain.apps.googleusercontent.com" }],
    ["kedaluwarsa", { exp: Math.floor(Date.now() / 1000) - 10 }],
    ["penerbit palsu", { iss: "https://penipu.example" }],
    ["email belum diverifikasi Google", { email_verified: false }],
  ])("menolak token %s", async (_label, ubahan) => {
    const { app } = buatApp();
    const res = await request(app)
      .post("/v1/auth/google")
      .send({ credential: tokenGoogle({ sub: "g-x", email: "x@gmail.com", ...ubahan }) });
    expect(res.status).toBe(401);
    expect(res.body.kode).toBe("GOOGLE_TIDAK_SAH");
  });

  it("menolak token yang ditandatangani kunci lain", async () => {
    const { app } = buatApp();
    const kunciLain = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
    const res = await request(app)
      .post("/v1/auth/google")
      .send({ credential: tokenGoogle({ sub: "g-x", email: "x@gmail.com" }, kunciLain) });
    expect(res.status).toBe(401);
  });

  it("503 bila Google belum diatur", async () => {
    const dbCtx = initDatabase(":memory:");
    const app = createApp({ dbCtx });
    const res = await request(app)
      .post("/v1/auth/google")
      .send({ credential: tokenGoogle({ sub: "g", email: "a@gmail.com" }) });
    expect(res.status).toBe(503);
  });
});

describe("Header keamanan untuk tombol Google", () => {
  it("CSP mengizinkan skrip Google dan COOP memperbolehkan popup", async () => {
    const { app } = buatApp();
    const res = await request(app).get("/health");
    expect(res.headers["content-security-policy"]).toContain(
      "https://accounts.google.com/gsi/client",
    );
    expect(res.headers["cross-origin-opener-policy"]).toBe("same-origin-allow-popups");
  });
});

describe("Isi email kode", () => {
  it("memakai template HTML berlogo Kokok dengan kode, plus versi teks biasa", async () => {
    const terkirim: Array<{ ke: string; isi: IsiEmail }> = [];
    const { app } = buatApp({
      pengirimEmail: {
        mode: "smtp",
        kirim: async (ke, isi) => {
          terkirim.push({ ke, isi });
        },
      },
    });

    const res = await request(app).post("/v1/auth/email/daftar").send(DAFTAR);
    expect(res.status).toBe(201);
    expect(terkirim).toHaveLength(1);
    const { ke, isi } = terkirim[0]!;
    const kode = /\b(\d{6})\b/.exec(isi.teks)?.[1];

    expect(ke).toBe("euis.peternak@gmail.com");
    expect(isi.subjek).toBe("Kode verifikasi akun Ternakin");
    expect(kode).toMatch(/^\d{6}$/);
    expect(isi.html).toContain(`cid:${CID_LOGO}`);
    expect(isi.html).toContain(kode);
    expect(isi.html).toContain("Email ini dikirim otomatis oleh Ternakin");
  });

  it("teks di template di-escape agar aman sebagai HTML", () => {
    const isi = buatEmailKode({
      subjek: "Uji",
      judul: "<script>alert(1)</script>",
      pembuka: "a & b",
      kode: "123456",
      berlakuMenit: 15,
      catatanKeamanan: '"kutip"',
    });
    expect(isi.html).not.toContain("<script>");
    expect(isi.html).toContain("&lt;script&gt;");
    expect(isi.html).toContain("a &amp; b");
  });
});
