import {
  galatApiSchema,
  mintaOtpResponseSchema,
  sesiAkunResponseSchema,
  type MintaOtpResponse,
  type PeranAkun,
  type SesiAkunResponse,
} from "@ternakin/shared";
import { db, getOrCreateDeviceId } from "../db/db";
import { bersihkanDataLokal, flushOutbox } from "../db/sync";
import { setelAkunLokal } from "./akunCache";

export { useAkun } from "./akunCache";

export class GalatAkun extends Error {
  constructor(
    pesan: string,
    readonly kode?: string,
    readonly tungguDetik?: number,
  ) {
    super(pesan);
    this.name = "GalatAkun";
  }
}

const PESAN_JARINGAN = "Belum tersambung ke internet. Periksa sinyal lalu coba lagi.";

export async function keGalat(res: Response): Promise<GalatAkun> {
  try {
    const parsed = galatApiSchema.safeParse(await res.json());
    if (parsed.success) {
      const tunggu = parsed.data.rinci?.tungguDetik;
      return new GalatAkun(
        parsed.data.pesan,
        parsed.data.kode,
        typeof tunggu === "number" ? tunggu : undefined,
      );
    }
  } catch {
    // isi bukan JSON
  }
  return new GalatAkun("Terjadi kendala di server. Coba lagi sebentar lagi.");
}

async function kirimJson(url: string, body?: unknown): Promise<Response> {
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new GalatAkun(PESAN_JARINGAN);
  }
}

/** Menyegarkan status akun dari server. Saat offline, status terakhir tetap dipakai. */
export async function muatAkun(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  try {
    const res = await fetch("/v1/auth/saya");
    if (res.status === 401) {
      setelAkunLokal(null);
      return;
    }
    if (!res.ok) return;
    const parsed = sesiAkunResponseSchema.safeParse(await res.json());
    if (parsed.success) setelAkunLokal(parsed.data.pengguna);
  } catch {
    // Jaringan putus: biarkan status lokal
  }
}

export async function mintaOtp(nomorPonsel: string): Promise<MintaOtpResponse> {
  const res = await kirimJson("/v1/auth/otp/minta", { nomorPonsel });
  if (!res.ok) throw await keGalat(res);
  return mintaOtpResponseSchema.parse(await res.json());
}

/**
 * Mencocokkan kode. Data mode tamu di perangkat ini dipindah ke akun oleh server,
 * lalu seluruh data akun (termasuk dari HP lain) ditarik ulang.
 */
export async function verifikasiOtp(
  nomorPonsel: string,
  kode: string,
  peran?: PeranAkun,
): Promise<SesiAkunResponse> {
  const perangkatId = await getOrCreateDeviceId();
  const res = await kirimJson("/v1/auth/otp/verifikasi", {
    nomorPonsel,
    kode,
    perangkatId,
    ...(peran ? { peran } : {}),
  });
  if (!res.ok) throw await keGalat(res);
  const hasil = sesiAkunResponseSchema.parse(await res.json());

  setelAkunLokal(hasil.pengguna);
  try {
    await db.meta.delete("terakhirSinkron");
  } catch {
    // Abaikan
  }
  await sinkronkanSampaiSelesai();
  return hasil;
}

async function tunggu(ms: number): Promise<void> {
  await new Promise((selesai) => setTimeout(selesai, ms));
}

/** flushOutbox menolak bila sedang berjalan; coba beberapa kali agar benar-benar terkirim. */
async function sinkronkanSampaiSelesai(): Promise<boolean> {
  for (let i = 0; i < 4; i++) {
    if (await flushOutbox()) return true;
    await tunggu(600);
  }
  return false;
}

/**
 * Keluar akun: kirim dulu semua perubahan ke server, akhiri sesi, lalu bersihkan data di HP ini
 * agar tidak tercampur dengan pengguna berikutnya.
 */
export async function keluarAkun(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new GalatAkun(
      "Sambungkan internet dulu agar catatan terakhir Anda tersimpan di akun sebelum keluar.",
    );
  }

  await sinkronkanSampaiSelesai();
  const sisa = await db.outbox.count().catch(() => 0);
  if (sisa > 0) {
    throw new GalatAkun(
      `Masih ada ${sisa} perubahan yang belum terkirim. Tunggu sinyal stabil lalu coba keluar lagi.`,
    );
  }

  const res = await kirimJson("/v1/auth/keluar");
  if (!res.ok) throw await keGalat(res);

  await bersihkanDataLokal();
  setelAkunLokal(null);
}

/** Memilih atau mengganti peran akun (Peternak / Pengguna). Data kandang tetap tersimpan. */
export async function aturPeran(peran: PeranAkun): Promise<void> {
  // Kirim dulu perubahan kandang yang tertunda selagi masih berperan peternak.
  if (peran === "pengguna") await sinkronkanSampaiSelesai();
  let res: Response;
  try {
    res = await fetch("/v1/auth/peran", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peran }),
    });
  } catch {
    throw new GalatAkun(PESAN_JARINGAN);
  }
  if (!res.ok) throw await keGalat(res);
  setelAkunLokal(sesiAkunResponseSchema.parse(await res.json()).pengguna);
  if (peran === "peternak") {
    // Tarik ulang data kandang akun ini (mungkin dibuat saat dulu berperan peternak).
    try {
      await db.meta.delete("terakhirSinkron");
    } catch {
      // Abaikan
    }
    await sinkronkanSampaiSelesai();
  }
}

/**
 * Masuk ke akun demo bersama (untuk juri). Karena dipakai banyak orang, data tamu di HP ini
 * tidak boleh ikut tersinkron ke akun demo: hanya diizinkan bila HP belum punya data kandang.
 */
export async function masukAkunDemo(peran: PeranAkun): Promise<SesiAkunResponse> {
  const [jumlahKandang, jumlahAntrean] = await Promise.all([
    db.kandang.count().catch(() => 0),
    db.outbox.count().catch(() => 0),
  ]);
  if (jumlahKandang > 0 || jumlahAntrean > 0) {
    throw new GalatAkun(
      "HP ini sudah berisi data kandang Anda. Akun demo dipakai bersama, jadi agar data Anda tidak tercampur, masuklah dengan nomor WhatsApp Anda sendiri.",
      "ADA_DATA_TAMU",
    );
  }

  const res = await kirimJson("/v1/auth/demo", { peran });
  if (!res.ok) throw await keGalat(res);
  const hasil = sesiAkunResponseSchema.parse(await res.json());
  setelAkunLokal(hasil.pengguna);
  if (peran === "peternak") await sinkronkanSampaiSelesai();
  return hasil;
}
