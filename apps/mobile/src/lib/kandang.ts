import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { useSyncExternalStore } from "react";
import {
  sinkronResponseSchema,
  type CatatanHarian,
  type ItemOutboxSync,
  type Kandang,
} from "@ternakin/shared";
import { panggilApi } from "./api";
import { ambilPerangkatId } from "./penyimpanan";

/**
 * Data kandang dan catatan harian di HP (offline-first), padanan Dexie + outbox di web.
 * Semua perubahan disimpan lokal lebih dulu lalu dikirim lewat POST /v1/sinkron:
 * idempoten per opId, perubahan terbaru menang (aturan server sama dengan web).
 */

export type StatusSinkron = "pending" | "synced";
export type KandangLokal = Kandang & { syncState: StatusSinkron };
export type CatatanLokal = CatatanHarian & { syncState: StatusSinkron };

interface Keadaan {
  kandang: KandangLokal[];
  catatan: CatatanLokal[];
  outbox: ItemOutboxSync[];
  terakhirSinkron: string | null;
}

const KUNCI = "tk_data_kandang_v1";
const BATAS_KIRIM = 200;
const JEDA_ULANG_MS = [5_000, 15_000, 60_000] as const;

const kosong = (): Keadaan => ({ kandang: [], catatan: [], outbox: [], terakhirSinkron: null });

let keadaan: Keadaan = kosong();
let siap = false;
let pemuatan: Promise<void> | null = null;
let sedangSinkron = false;
let galatSinkron = false;
let percobaanUlang = 0;
let pewaktuUlang: ReturnType<typeof setTimeout> | null = null;

/** Diatur oleh PenjagaSinkron sesuai sesi: peran "pengguna" tidak memakai kandang. */
let izin = { boleh: true, adaAkun: false };

const pendengar = new Set<() => void>();

export interface SnapshotKandang {
  siap: boolean;
  /** Kandang aktif = yang terakhir diubah (sama dengan web). */
  kandang: KandangLokal | null;
  /** Catatan kandang aktif yang belum dihapus, terbaru dulu. */
  catatan: CatatanLokal[];
  /** Termasuk catatan terhapus; dipakai evaluasi peringatan. */
  semuaCatatan: CatatanLokal[];
  jumlahAntrean: number;
  sedangSinkron: boolean;
  galatSinkron: boolean;
}

let snapshot: SnapshotKandang = buatSnapshot();

function buatSnapshot(): SnapshotKandang {
  const kandang =
    [...keadaan.kandang].sort((a, b) => b.diubahPada.localeCompare(a.diubahPada))[0] ?? null;
  const semuaCatatan = kandang ? keadaan.catatan.filter((c) => c.kandangId === kandang.id) : [];
  return {
    siap,
    kandang,
    catatan: semuaCatatan
      .filter((c) => !c.dihapusPada)
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    semuaCatatan,
    jumlahAntrean: keadaan.outbox.length,
    sedangSinkron,
    galatSinkron,
  };
}

function kabari() {
  snapshot = buatSnapshot();
  for (const fn of pendengar) fn();
}

async function simpanKeDisk() {
  try {
    await AsyncStorage.setItem(KUNCI, JSON.stringify(keadaan));
  } catch {
    // Penyimpanan penuh/rusak: data tetap ada di memori sampai aplikasi ditutup.
  }
}

export function muatDataKandang(): Promise<void> {
  pemuatan ??= (async () => {
    try {
      const mentah = await AsyncStorage.getItem(KUNCI);
      if (mentah) {
        const data = JSON.parse(mentah) as Partial<Keadaan>;
        keadaan = {
          kandang: Array.isArray(data.kandang) ? data.kandang : [],
          catatan: Array.isArray(data.catatan) ? data.catatan : [],
          outbox: Array.isArray(data.outbox) ? data.outbox : [],
          terakhirSinkron: typeof data.terakhirSinkron === "string" ? data.terakhirSinkron : null,
        };
      }
    } catch {
      keadaan = kosong();
    }
    siap = true;
    kabari();
  })();
  return pemuatan;
}

async function ubah(fn: (k: Keadaan) => Keadaan) {
  await muatDataKandang();
  keadaan = fn(keadaan);
  kabari();
  await simpanKeDisk();
}

const uuid = () => Crypto.randomUUID();

export async function simpanKandang(input: {
  id?: string;
  nama: string;
  jumlahEkor: number;
  umurMinggu: number | null;
}): Promise<KandangLokal> {
  const sekarang = new Date().toISOString();
  const lama = keadaan.kandang.find((k) => k.id === input.id);
  const payload: Kandang = {
    id: lama?.id ?? uuid(),
    perangkatId: await ambilPerangkatId(),
    nama: input.nama.trim(),
    jenisAyam: lama?.jenisAyam ?? "petelur",
    jumlahEkor: input.jumlahEkor,
    umurMinggu: input.umurMinggu,
    lokasi: lama?.lokasi ?? null,
    bahanTersedia: lama?.bahanTersedia ?? [],
    diubahPada: sekarang,
  };
  const kandang: KandangLokal = { ...payload, syncState: "pending" };
  await ubah((k) => ({
    ...k,
    kandang: [...k.kandang.filter((x) => x.id !== kandang.id), kandang],
    outbox: [
      ...k.outbox,
      { opId: uuid(), jenis: "upsert_kandang", payload, dibuatPada: sekarang },
    ],
  }));
  void sinkronkan();
  return kandang;
}

export async function simpanCatatan(input: {
  kandangId: string;
  tanggal: string;
  pakanKg: number | null;
  telur: number | null;
  kematian: number | null;
  suhu: number | null;
}): Promise<CatatanLokal> {
  const sekarang = new Date().toISOString();
  // Satu catatan per (kandang, tanggal): tanggal yang sama memperbarui baris yang sama.
  const lama = keadaan.catatan.find(
    (c) => c.kandangId === input.kandangId && c.tanggal === input.tanggal,
  );
  const payload: CatatanHarian = {
    id: lama?.id ?? uuid(),
    ...input,
    diubahPada: sekarang,
    dihapusPada: null,
  };
  const catatan: CatatanLokal = { ...payload, syncState: "pending" };
  await ubah((k) => ({
    ...k,
    catatan: [...k.catatan.filter((c) => c.id !== catatan.id), catatan],
    outbox: [
      ...k.outbox,
      { opId: uuid(), jenis: "upsert_catatan", payload, dibuatPada: sekarang },
    ],
  }));
  void sinkronkan();
  return catatan;
}

export async function hapusCatatan(catatan: CatatanLokal): Promise<void> {
  const sekarang = new Date().toISOString();
  const terhapus: CatatanLokal = {
    ...catatan,
    dihapusPada: sekarang,
    diubahPada: sekarang,
    syncState: "pending",
  };
  await ubah((k) => ({
    ...k,
    catatan: [...k.catatan.filter((c) => c.id !== catatan.id), terhapus],
    outbox: [
      ...k.outbox,
      {
        opId: uuid(),
        jenis: "hapus_catatan",
        payload: {
          id: catatan.id,
          kandangId: catatan.kandangId,
          tanggal: catatan.tanggal,
          dihapusPada: sekarang,
          diubahPada: sekarang,
        },
        dibuatPada: sekarang,
      },
    ],
  }));
  void sinkronkan();
}

function jadwalkanUlang() {
  if (pewaktuUlang) return;
  const jeda = JEDA_ULANG_MS[Math.min(percobaanUlang, JEDA_ULANG_MS.length - 1)] ?? 60_000;
  percobaanUlang += 1;
  pewaktuUlang = setTimeout(() => {
    pewaktuUlang = null;
    void sinkronkan();
  }, jeda);
}

/**
 * Mengirim antrean lalu menarik perubahan dari server. Aman dipanggil berkali-kali.
 * Mengembalikan true bila tidak ada yang perlu dikirim atau pengiriman berhasil.
 */
export async function sinkronkan(): Promise<boolean> {
  await muatDataKandang();
  if (sedangSinkron) return false;
  if (!izin.boleh) return true;
  const kirim = keadaan.outbox.slice(0, BATAS_KIRIM);
  // Tamu tanpa data tidak perlu menghubungi server; akun tetap menarik data dari HP lain.
  if (kirim.length === 0 && keadaan.kandang.length === 0 && !izin.adaAkun) return true;

  sedangSinkron = true;
  kabari();
  try {
    const res = await panggilApi("/v1/sinkron", {
      body: {
        perangkatId: await ambilPerangkatId(),
        terakhirSinkron: keadaan.terakhirSinkron,
        itemOutbox: kirim,
      },
      skema: sinkronResponseSchema,
    });

    const dikonfirmasi = new Set(res.dikonfirmasiOpIds);
    keadaan = terapkanTarikan(
      { ...keadaan, outbox: keadaan.outbox.filter((o) => !dikonfirmasi.has(o.opId)) },
      res.kandangTerbaru,
      res.catatanTerbaru,
      res.waktuServer,
    );
    await simpanKeDisk();

    percobaanUlang = 0;
    galatSinkron = false;
    if (pewaktuUlang) {
      clearTimeout(pewaktuUlang);
      pewaktuUlang = null;
    }
    // Sisa antrean di atas batas kirim dikirim pada putaran berikutnya.
    if (keadaan.outbox.length > 0 && dikonfirmasi.size > 0) setTimeout(() => void sinkronkan(), 0);
    return true;
  } catch {
    galatSinkron = true;
    jadwalkanUlang();
    return false;
  } finally {
    sedangSinkron = false;
    kabari();
  }
}

/** Data server ditulis ke lokal kecuali baris yang masih punya perubahan di antrean. */
function terapkanTarikan(
  k: Keadaan,
  kandangServer: Kandang[],
  catatanServer: CatatanHarian[],
  waktuServer: string,
): Keadaan {
  const kandangMenunggu = new Set(
    k.outbox.filter((o) => o.jenis === "upsert_kandang").map((o) => o.payload.id),
  );
  const catatanMenunggu = new Set(
    k.outbox
      .filter((o) => o.jenis === "upsert_catatan" || o.jenis === "hapus_catatan")
      .map((o) => `${o.payload.kandangId}:${o.payload.tanggal}`),
  );

  const kandang = new Map(k.kandang.map((x) => [x.id, x]));
  for (const x of kandangServer) {
    if (!kandangMenunggu.has(x.id)) kandang.set(x.id, { ...x, syncState: "synced" });
  }

  let catatan = k.catatan;
  for (const c of catatanServer) {
    const kunci = `${c.kandangId}:${c.tanggal}`;
    if (catatanMenunggu.has(kunci)) continue;
    // ID pemenang dari server menggantikan baris lokal lain di tanggal yang sama.
    catatan = catatan.filter((x) => `${x.kandangId}:${x.tanggal}` !== kunci);
    catatan = [...catatan, { ...c, syncState: "synced" }];
  }

  // Baris yang op-nya sudah dikonfirmasi ditandai tersinkron.
  catatan = catatan.map((c) =>
    c.syncState === "pending" && !catatanMenunggu.has(`${c.kandangId}:${c.tanggal}`)
      ? { ...c, syncState: "synced" }
      : c,
  );
  const daftarKandang = [...kandang.values()].map((x) =>
    x.syncState === "pending" && !kandangMenunggu.has(x.id)
      ? { ...x, syncState: "synced" as const }
      : x,
  );

  return { ...k, kandang: daftarKandang, catatan, terakhirSinkron: waktuServer };
}

export function aturIzinSinkron(boleh: boolean, adaAkun: boolean) {
  izin = { boleh, adaAkun };
}

/** Setelah masuk akun: tarik ulang semua data akun dari awal. */
export async function mulaiUlangTarikan(): Promise<void> {
  await ubah((k) => ({ ...k, terakhirSinkron: null }));
}

/** Saat keluar akun: salinan data di HP ini dihapus (sama dengan web). */
export async function bersihkanDataKandang(): Promise<void> {
  await ubah(() => kosong());
}

function berlangganan(fn: () => void) {
  pendengar.add(fn);
  return () => pendengar.delete(fn);
}

export function useDataKandang(): SnapshotKandang {
  return useSyncExternalStore(
    berlangganan,
    () => snapshot,
    () => snapshot,
  );
}

/** Tanggal lokal HP dalam format YYYY-MM-DD (bukan UTC, agar tidak bergeser setelah jam 17.00 WIB). */
export function tanggalLokal(d = new Date()): string {
  const bb = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bb}-${hh}`;
}

export function geserTanggal(tanggal: string, hari: number): string {
  const [t, b, h] = tanggal.split("-").map(Number);
  return tanggalLokal(new Date(t ?? 2000, (b ?? 1) - 1, (h ?? 1) + hari));
}

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "21 Nov", atau "Hari ini"/"Kemarin" bila relatif = true. */
export function labelTanggal(tanggal: string, relatif = false): string {
  if (relatif) {
    const hariIni = tanggalLokal();
    if (tanggal === hariIni) return "Hari ini";
    if (tanggal === geserTanggal(hariIni, -1)) return "Kemarin";
  }
  const [, b, h] = tanggal.split("-").map(Number);
  return `${h ?? ""} ${BULAN[(b ?? 1) - 1] ?? ""}`;
}
