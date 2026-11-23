import { useEffect, useState } from "react";
import {
  sinkronResponseSchema,
  type CatatanHarian,
  type ItemOutboxSync,
  type Kandang,
} from "@ternakin/shared";
import { bacaAkunLokal, setelAkunLokal } from "../lib/akunCache";
import { simpanPesanMasuk } from "../lib/pesanMasuk";
import { useOnlineStatus } from "../lib/pwa";
import {
  createClientUuid,
  db,
  getOrCreateDeviceId,
  getSavedSrcParam,
  type CatatanLokal,
  type KandangLokal,
} from "./db";

const SYNC_EVENT = "tk:sync-change";
const RETRY_DELAYS_MS = [5_000, 15_000, 60_000] as const;

let sedangFlush = false;
let retryCount = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let listenersTerpasang = false;

function emitSyncChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SYNC_EVENT));
  }
}

async function mintaPenyimpananPersisten(): Promise<void> {
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.persist) {
      await navigator.storage.persist();
    }
  } catch {
    // Abaikan bila peramban tidak mendukung storage.persist
  }
}

export async function simpanKandangLokal(input: {
  id?: string;
  nama: string;
  jumlahEkor: number;
  umurMinggu: number | null;
  lokasi: string | null;
  bahanTersedia: string[];
}): Promise<KandangLokal> {
  const sekarang = new Date().toISOString();
  const perangkatId = await getOrCreateDeviceId();
  const kandang: KandangLokal = {
    id: input.id ?? createClientUuid(),
    perangkatId,
    nama: input.nama.trim(),
    jenisAyam: "petelur",
    jumlahEkor: input.jumlahEkor,
    umurMinggu: input.umurMinggu,
    lokasi: input.lokasi?.trim() || null,
    bahanTersedia: input.bahanTersedia,
    diubahPada: sekarang,
    syncState: "pending",
  };

  const payloadKandang: Kandang = {
    id: kandang.id,
    perangkatId: kandang.perangkatId,
    nama: kandang.nama,
    jenisAyam: kandang.jenisAyam,
    jumlahEkor: kandang.jumlahEkor,
    umurMinggu: kandang.umurMinggu,
    lokasi: kandang.lokasi,
    bahanTersedia: kandang.bahanTersedia,
    diubahPada: kandang.diubahPada,
  };

  const op: ItemOutboxSync = {
    opId: createClientUuid(),
    jenis: "upsert_kandang",
    payload: payloadKandang,
    dibuatPada: sekarang,
  };

  try {
    await db.transaction("rw", db.kandang, db.outbox, async () => {
      await db.kandang.put(kandang);
      await db.outbox.add(op);
    });
  } catch {
    // Abaikan di lingkungan tanpa IndexedDB
  }

  emitSyncChange();
  if (typeof navigator !== "undefined" && navigator.onLine) {
    void flushOutbox();
  }
  return kandang;
}

export async function simpanCatatanLokal(input: {
  kandangId: string;
  tanggal: string;
  pakanKg: number | null;
  telur: number | null;
  kematian: number | null;
  suhu: number | null;
}): Promise<CatatanLokal> {
  const sekarang = new Date().toISOString();

  // Satu catatan per (kandangId, tanggal): bila tanggal sama sudah ada, perbarui baris yang sama.
  let existing: CatatanLokal | undefined;
  let jumlahSebelumnya = 0;
  try {
    const semua = await db.catatan.where("kandangId").equals(input.kandangId).toArray();
    jumlahSebelumnya = semua.length;
    existing = semua.find((c) => c.tanggal === input.tanggal);
  } catch {
    // Abaikan bila IndexedDB tidak tersedia
  }

  const catatan: CatatanLokal = {
    id: existing?.id ?? createClientUuid(),
    kandangId: input.kandangId,
    tanggal: input.tanggal,
    pakanKg: input.pakanKg,
    telur: input.telur,
    kematian: input.kematian,
    suhu: input.suhu,
    diubahPada: sekarang,
    dihapusPada: null,
    syncState: "pending",
  };

  const payload: CatatanHarian = {
    id: catatan.id,
    kandangId: catatan.kandangId,
    tanggal: catatan.tanggal,
    pakanKg: catatan.pakanKg,
    telur: catatan.telur,
    kematian: catatan.kematian,
    suhu: catatan.suhu,
    diubahPada: catatan.diubahPada,
    dihapusPada: null,
  };

  const op: ItemOutboxSync = {
    opId: createClientUuid(),
    jenis: "upsert_catatan",
    payload,
    dibuatPada: sekarang,
  };

  try {
    await db.transaction("rw", db.catatan, db.outbox, async () => {
      await db.catatan.put(catatan);
      await db.outbox.add(op);
    });
  } catch {
    // Abaikan
  }

  if (jumlahSebelumnya === 0) {
    void mintaPenyimpananPersisten();
  }

  emitSyncChange();
  if (typeof navigator !== "undefined" && navigator.onLine) {
    void flushOutbox();
  }
  return catatan;
}

export async function hapusCatatanLokal(catatan: CatatanLokal): Promise<void> {
  const sekarang = new Date().toISOString();
  const terhapus: CatatanLokal = {
    ...catatan,
    dihapusPada: sekarang,
    diubahPada: sekarang,
    syncState: "pending",
  };

  const op: ItemOutboxSync = {
    opId: createClientUuid(),
    jenis: "hapus_catatan",
    payload: {
      id: catatan.id,
      kandangId: catatan.kandangId,
      tanggal: catatan.tanggal,
      dihapusPada: sekarang,
      diubahPada: sekarang,
    },
    dibuatPada: sekarang,
  };

  try {
    await db.transaction("rw", db.catatan, db.outbox, async () => {
      await db.catatan.put(terhapus);
      await db.outbox.add(op);
    });
  } catch {
    // Abaikan
  }

  emitSyncChange();
  if (typeof navigator !== "undefined" && navigator.onLine) {
    void flushOutbox();
  }
}

export async function catatLeadLokal(tokoId: string): Promise<{ clientId: string }> {
  const sekarang = new Date().toISOString();
  const clientId = createClientUuid();
  const src = getSavedSrcParam();

  const op: ItemOutboxSync = {
    opId: createClientUuid(),
    jenis: "catat_lead",
    payload: {
      clientId,
      tokoId,
      src,
      dibuatPada: sekarang,
    },
    dibuatPada: sekarang,
  };

  try {
    await db.outbox.add(op);
  } catch {
    // Abaikan bila IndexedDB tidak tersedia
  }

  emitSyncChange();
  if (typeof navigator !== "undefined" && navigator.onLine) {
    void flushOutbox();
  }
  return { clientId };
}

function jadwalkanUlangFlush(): void {
  if (retryTimer !== null) return;
  const jeda = RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)] ?? 60_000;
  retryCount += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (typeof navigator !== "undefined" && navigator.onLine) {
      void flushOutbox();
    }
  }, jeda);
}

/**
 * Mengirim antrean outbox dan menarik perubahan dari server.
 * Bila sudah masuk akun, tarikan tetap dilakukan walau perangkat kosong (data dari HP lain).
 */
export async function flushOutbox(): Promise<boolean> {
  if (sedangFlush) return false;
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  // Peran Pengguna tidak memakai kandang dan catatan; server juga menolaknya.
  if (bacaAkunLokal()?.peran === "pengguna") return true;

  sedangFlush = true;
  emitSyncChange();

  try {
    const outboxItems = await db.outbox.orderBy("seq").toArray();
    const jumlahKandang = await db.kandang.count();
    if (outboxItems.length === 0 && jumlahKandang === 0 && !bacaAkunLokal()) {
      retryCount = 0;
      return true;
    }

    const perangkatId = await getOrCreateDeviceId();
    const metaTerakhir = await db.meta.get("terakhirSinkron");

    const itemPayload: ItemOutboxSync[] = outboxItems.map((item) => {
      if (item.jenis === "upsert_kandang") {
        return {
          opId: item.opId,
          jenis: item.jenis,
          payload: item.payload,
          dibuatPada: item.dibuatPada,
        };
      }
      if (item.jenis === "upsert_catatan") {
        return {
          opId: item.opId,
          jenis: item.jenis,
          payload: item.payload,
          dibuatPada: item.dibuatPada,
        };
      }
      if (item.jenis === "hapus_catatan") {
        return {
          opId: item.opId,
          jenis: item.jenis,
          payload: item.payload,
          dibuatPada: item.dibuatPada,
        };
      }
      return {
        opId: item.opId,
        jenis: item.jenis,
        payload: item.payload,
        dibuatPada: item.dibuatPada,
      };
    });

    const res = await fetch("/v1/sinkron", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        perangkatId,
        terakhirSinkron: metaTerakhir?.nilai ?? null,
        itemOutbox: itemPayload,
      }),
    });

    if (!res.ok) {
      jadwalkanUlangFlush();
      return false;
    }

    const json: unknown = await res.json();
    const parsed = sinkronResponseSchema.safeParse(json);
    if (!parsed.success) {
      jadwalkanUlangFlush();
      return false;
    }

    const dikonfirmasi = new Set(parsed.data.dikonfirmasiOpIds);

    await db.transaction("rw", [db.outbox, db.kandang, db.catatan, db.meta], async () => {
      for (const item of outboxItems) {
        if (item.seq !== undefined && dikonfirmasi.has(item.opId)) {
          await db.outbox.delete(item.seq);
        }
      }

      const sisaOutbox = await db.outbox.toArray();
      const pendingKandangIds = new Set(
        sisaOutbox.filter((o) => o.jenis === "upsert_kandang").map((o) => o.payload.id),
      );
      const pendingCatatanKeys = new Set(
        sisaOutbox
          .filter((o) => o.jenis === "upsert_catatan" || o.jenis === "hapus_catatan")
          .map((o) => `${o.payload.kandangId}:${o.payload.tanggal}`),
      );

      for (const k of parsed.data.kandangTerbaru) {
        if (!pendingKandangIds.has(k.id)) {
          await db.kandang.put({ ...k, syncState: "synced" });
        }
      }

      for (const c of parsed.data.catatanTerbaru) {
        const kunciTanggal = `${c.kandangId}:${c.tanggal}`;
        if (!pendingCatatanKeys.has(kunciTanggal)) {
          // Hapus catatan lokal lama pada (kandangId, tanggal) jika ID pemenang dari server berbeda.
          const lokalSamaTanggal = await db.catatan
            .where("kandangId")
            .equals(c.kandangId)
            .filter((row) => row.tanggal === c.tanggal && row.id !== c.id)
            .toArray();
          for (const duplikat of lokalSamaTanggal) {
            await db.catatan.delete(duplikat.id);
          }
          await db.catatan.put({ ...c, syncState: "synced" });
        }
      }

      await db.meta.put({ kunci: "terakhirSinkron", nilai: parsed.data.waktuServer });
    });

    retryCount = 0;
    if (retryTimer !== null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    return true;
  } catch {
    jadwalkanUlangFlush();
    return false;
  } finally {
    sedangFlush = false;
    emitSyncChange();
  }
}

export function startSyncListeners(): void {
  if (listenersTerpasang || typeof window === "undefined") return;
  listenersTerpasang = true;

  const triggerFlush = () => {
    if (navigator.onLine) {
      void flushOutbox();
    }
  };

  window.addEventListener("online", triggerFlush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      triggerFlush();
    }
  });

  // Flush saat aplikasi pertama dibuka.
  triggerFlush();
}

export async function hapusSemuaDataPengguna(): Promise<{ serverDihapus: boolean }> {
  let serverDihapus = false;
  const perangkatId = await getOrCreateDeviceId();

  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const res = await fetch("/v1/akun", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": perangkatId,
        },
        body: JSON.stringify({ perangkatId }),
      });
      serverDihapus = res.ok;
    } catch {
      serverDihapus = false;
    }
  }

  await bersihkanDataLokal();
  // Akun di server ikut terhapus bila sedang masuk. Sesi berakhir sehingga penjaga rute membuka
  // halaman Masuk; pesan disimpan dulu agar tampil di sana.
  if (serverDihapus) {
    simpanPesanMasuk(
      "Akun Anda beserta seluruh data kandang dan catatan di perangkat dan server telah dihapus.",
    );
    setelAkunLokal(null);
  }
  return { serverDihapus };
}

/**
 * Menghapus seluruh salinan data di perangkat ini (kandang, catatan, antrean, riwayat, draf).
 * Dipakai saat hapus data dan saat keluar akun. ID perangkat ikut diganti.
 */
export async function bersihkanDataLokal(): Promise<void> {
  try {
    await db.transaction(
      "rw",
      [db.kandang, db.catatan, db.outbox, db.draf, db.komposisi, db.kokok, db.meta],
      async () => {
        await db.kandang.clear();
        await db.catatan.clear();
        await db.outbox.clear();
        await db.draf.clear();
        await db.komposisi.clear();
        await db.kokok.clear();
        await db.meta.clear();
      },
    );
  } catch {
    // Abaikan bila IndexedDB tidak tersedia
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem("tk.src");
    } catch {
      // Abaikan
    }
  }

  emitSyncChange();
}

export interface SyncStatusSnapshot {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  namaKandangAktif: string | null;
}

export function useSyncStatus(): SyncStatusSnapshot {
  const isOnline = useOnlineStatus();
  const [snapshot, setSnapshot] = useState<{
    pendingCount: number;
    isSyncing: boolean;
    namaKandangAktif: string | null;
  }>({
    pendingCount: 0,
    isSyncing: false,
    namaKandangAktif: null,
  });

  useEffect(() => {
    let aktif = true;
    const muat = async () => {
      try {
        const [pendingCount, daftarKandang] = await Promise.all([
          db.outbox.count(),
          db.kandang.toArray(),
        ]);
        if (!aktif) return;
        const terbaru = daftarKandang.sort((a, b) => b.diubahPada.localeCompare(a.diubahPada))[0];
        setSnapshot({
          pendingCount,
          isSyncing: sedangFlush,
          namaKandangAktif: terbaru?.nama ?? null,
        });
      } catch {
        // Abaikan bila IndexedDB tidak tersedia
      }
    };

    void muat();
    const onChange = () => {
      void muat();
    };
    window.addEventListener(SYNC_EVENT, onChange);
    return () => {
      aktif = false;
      window.removeEventListener(SYNC_EVENT, onChange);
    };
  }, [isOnline]);

  return {
    isOnline,
    pendingCount: snapshot.pendingCount,
    isSyncing: snapshot.isSyncing,
    namaKandangAktif: snapshot.namaKandangAktif,
  };
}
