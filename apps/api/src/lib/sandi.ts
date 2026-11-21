import crypto from "node:crypto";

/**
 * Hash kata sandi dengan scrypt (bawaan Node, tanpa dependensi).
 * Format tersimpan: scrypt$N$r$p$saltBase64$hashBase64 agar parameter bisa dinaikkan kelak.
 */

const N = 16384;
const R = 8;
const P = 1;
const PANJANG_KUNCI = 64;

function scryptAsync(
  sandi: string,
  salt: Buffer,
  n: number,
  r: number,
  p: number,
): Promise<Buffer> {
  return new Promise((selesai, gagal) => {
    crypto.scrypt(
      sandi,
      salt,
      PANJANG_KUNCI,
      { N: n, r, p, maxmem: 64 * 1024 * 1024 },
      (err, kunci) => (err ? gagal(err) : selesai(kunci)),
    );
  });
}

export async function hashSandi(sandi: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const kunci = await scryptAsync(sandi, salt, N, R, P);
  return ["scrypt", N, R, P, salt.toString("base64"), kunci.toString("base64")].join("$");
}

export async function cocokSandi(sandi: string, tersimpan: string | null): Promise<boolean> {
  if (!tersimpan) return false;
  const [algo, n, r, p, saltB64, hashB64] = tersimpan.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const harapan = Buffer.from(hashB64, "base64");
  const kunci = await scryptAsync(
    sandi,
    Buffer.from(saltB64, "base64"),
    Number(n),
    Number(r),
    Number(p),
  );
  return kunci.length === harapan.length && crypto.timingSafeEqual(kunci, harapan);
}

/** Hash tiruan untuk menyamakan waktu respons saat email tidak terdaftar (cegah tebak akun). */
let hashTiruan: Promise<string> | null = null;
export function hashSandiTiruan(): Promise<string> {
  hashTiruan ??= hashSandi(crypto.randomBytes(16).toString("hex"));
  return hashTiruan;
}

/** Versi sinkron untuk seed akun demo saat basis data disiapkan. */
export function hashSandiSync(sandi: string): string {
  const salt = crypto.randomBytes(16);
  const kunci = crypto.scryptSync(sandi, salt, PANJANG_KUNCI, {
    N,
    r: R,
    p: P,
    maxmem: 64 * 1024 * 1024,
  });
  return ["scrypt", N, R, P, salt.toString("base64"), kunci.toString("base64")].join("$");
}
