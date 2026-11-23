// Bantuan tes (tidak ikut build, lihat tsconfig "exclude"): semua fitur aplikasi wajib masuk,
// jadi tes memakai agen supertest yang sudah memegang cookie sesi.
import request from "supertest";
import { expect } from "vitest";
import { mintaOtpResponseSchema, type PeranAkun } from "@ternakin/shared";
import type { createApp } from "../app.js";

export type Aplikasi = ReturnType<typeof createApp>;
export type Agen = ReturnType<typeof request.agent>;

/** Masuk dengan akun demo bersama (Pak Dedi = peternak, Rani = pengguna). */
export async function agenDemo(
  app: Aplikasi,
  peran: PeranAkun = "peternak",
  perangkatId?: string,
): Promise<Agen> {
  const agen = request.agent(app);
  const res = await agen.post("/v1/auth/demo").send({ peran, perangkatId });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return agen;
}

/**
 * Masuk dengan akun WhatsApp baru lewat OTP mode demo (kode tampil di respons). Dipakai bila tes
 * butuh beberapa akun terpisah atau akun yang boleh dihapus (akun demo tidak bisa dihapus).
 */
export async function agenOtp(
  app: Aplikasi,
  nomorPonsel: string,
  opsi: { peran?: PeranAkun; perangkatId?: string } = {},
): Promise<Agen> {
  const agen = request.agent(app);
  const minta = await agen.post("/v1/auth/otp/minta").send({ nomorPonsel });
  expect(minta.status, JSON.stringify(minta.body)).toBe(200);
  const { kodeDemo } = mintaOtpResponseSchema.parse(minta.body);
  const res = await agen.post("/v1/auth/otp/verifikasi").send({
    nomorPonsel,
    kode: kodeDemo,
    peran: opsi.peran ?? "peternak",
    perangkatId: opsi.perangkatId,
  });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return agen;
}

const agenPerAplikasi = new WeakMap<Aplikasi, Promise<Agen>>();

/** Agen akun demo peternak yang dipakai bersama untuk satu aplikasi uji (masuk sekali saja). */
export function sebagaiAkun(app: Aplikasi): Promise<Agen> {
  let agen = agenPerAplikasi.get(app);
  if (!agen) {
    agen = agenDemo(app);
    agenPerAplikasi.set(app, agen);
  }
  return agen;
}
