import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  penggunaSayaSchema,
  sesiAkunResponseSchema,
  type PenggunaSaya,
  type PeranAkun,
  type SesiAkunResponse,
} from "@ternakin/shared";
import { aturPenanganSesiBerakhir, GalatApi, panggilApi } from "./api";
import { ambilPerangkatId, ambilToken, hapusToken, simpanToken } from "./penyimpanan";

interface NilaiSesi {
  /** null = belum masuk. Semua fitur wajib masuk, jadi aplikasi menampilkan layar Masuk. */
  pengguna: PenggunaSaya | null;
  memuat: boolean;
  /** Peran efektif (bawaan peternak sampai pengguna memilih). */
  peran: PeranAkun;
  masukDemo: (peran: PeranAkun) => Promise<void>;
  masukEmail: (email: string, sandi: string) => Promise<SesiAkunResponse>;
  /**
   * Memanggil rute masuk mana pun yang menjawab sesi (verifikasi email, reset sandi,
   * WhatsApp OTP, Google). ID perangkat dikirim agar data tamu dipindah ke akun.
   */
  masukLewat: (path: string, body: Record<string, unknown>) => Promise<SesiAkunResponse>;
  aturPeran: (peran: PeranAkun) => Promise<void>;
  keluar: () => Promise<void>;
  segarkan: () => Promise<void>;
}

const KonteksSesi = createContext<NilaiSesi | null>(null);

/** Salinan data pengguna (bukan token) agar aplikasi tetap terbuka saat dibuka tanpa sinyal. */
const KUNCI_PENGGUNA = "tk_pengguna";

async function bacaPenggunaTersimpan(): Promise<PenggunaSaya | null> {
  try {
    const mentah = await AsyncStorage.getItem(KUNCI_PENGGUNA);
    if (!mentah) return null;
    const hasil = penggunaSayaSchema.safeParse(JSON.parse(mentah));
    return hasil.success ? hasil.data : null;
  } catch {
    return null;
  }
}

function simpanPenggunaTersimpan(pengguna: PenggunaSaya | null): void {
  const tugas = pengguna
    ? AsyncStorage.setItem(KUNCI_PENGGUNA, JSON.stringify(pengguna))
    : AsyncStorage.removeItem(KUNCI_PENGGUNA);
  tugas.catch(() => {});
}

/**
 * Pengguna dari token tersimpan. null = belum masuk (tanpa token, atau sesi kedaluwarsa/dicabut);
 * "tidak_berubah" = server tak terjangkau (offline) sehingga token dibiarkan.
 */
async function bacaSesiServer(): Promise<PenggunaSaya | null | "tidak_berubah"> {
  if (!(await ambilToken())) return null;
  try {
    const res = await panggilApi("/v1/auth/saya", { skema: sesiAkunResponseSchema });
    return res.pengguna;
  } catch (err) {
    if (err instanceof GalatApi && err.status === 401) {
      await hapusToken();
      return null;
    }
    return "tidak_berubah";
  }
}

export function SesiProvider({ children }: { children: ReactNode }) {
  const [pengguna, setPengguna] = useState<PenggunaSaya | null>(null);
  const [memuat, setMemuat] = useState(true);

  const terapkanRespons = useCallback(async (res: SesiAkunResponse) => {
    if (res.token) await simpanToken(res.token);
    setPengguna(res.pengguna);
  }, []);

  const masukLewat = useCallback(
    async (path: string, body: Record<string, unknown>) => {
      const res = await panggilApi(path, {
        body: { ...body, perangkatId: await ambilPerangkatId() },
        skema: sesiAkunResponseSchema,
      });
      await terapkanRespons(res);
      return res;
    },
    [terapkanRespons],
  );

  const segarkan = useCallback(async () => {
    const hasil = await bacaSesiServer();
    if (hasil !== "tidak_berubah") setPengguna(hasil);
  }, []);

  // Status sesi dibaca sekali saat aplikasi dibuka; splash ditahan sampai selesai. Saat offline,
  // salinan pengguna di HP dipakai (hanya bila token sesi masih ada) agar fitur tetap bisa dipakai.
  useEffect(() => {
    let aktif = true;
    void (async () => {
      const hasil = await bacaSesiServer();
      let pengguna: PenggunaSaya | null = null;
      if (hasil !== "tidak_berubah") pengguna = hasil;
      else if (await ambilToken()) pengguna = await bacaPenggunaTersimpan();
      if (!aktif) return;
      setPengguna(pengguna);
      setMemuat(false);
    })();
    return () => {
      aktif = false;
    };
  }, []);

  // Salinan di HP selalu mengikuti status sesi terbaru.
  useEffect(() => {
    if (!memuat) simpanPenggunaTersimpan(pengguna);
  }, [pengguna, memuat]);

  // 401 dari API aplikasi mana pun: token dihapus dan aplikasi kembali ke layar Masuk.
  useEffect(() => {
    aturPenanganSesiBerakhir(() => {
      void hapusToken().catch(() => {});
      setPengguna(null);
    });
    return () => aturPenanganSesiBerakhir(null);
  }, []);

  const nilai = useMemo<NilaiSesi>(
    () => ({
      pengguna,
      memuat,
      peran: pengguna?.peran ?? "peternak",
      masukDemo: async (peran) => {
        const res = await panggilApi("/v1/auth/demo", {
          body: { peran },
          skema: sesiAkunResponseSchema,
        });
        await terapkanRespons(res);
      },
      masukEmail: (email, sandi) => masukLewat("/v1/auth/email/masuk", { email, sandi }),
      masukLewat,
      aturPeran: async (peran) => {
        const res = await panggilApi("/v1/auth/peran", {
          method: "PUT",
          body: { peran },
          skema: sesiAkunResponseSchema,
        });
        setPengguna(res.pengguna);
      },
      keluar: async () => {
        try {
          await panggilApi("/v1/auth/keluar", { method: "POST" });
        } catch {
          // Tetap keluar di HP walau server tidak terjangkau.
        }
        await hapusToken();
        setPengguna(null);
      },
      segarkan,
    }),
    [pengguna, memuat, segarkan, terapkanRespons, masukLewat],
  );

  return <KonteksSesi.Provider value={nilai}>{children}</KonteksSesi.Provider>;
}

export function useSesi(): NilaiSesi {
  const nilai = useContext(KonteksSesi);
  if (!nilai) throw new Error("useSesi harus dipakai di dalam SesiProvider");
  return nilai;
}
