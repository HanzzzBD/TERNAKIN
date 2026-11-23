import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const KUNCI = "tk_sambutan_selesai";

interface NilaiSambutan {
  /** null = masih dibaca dari penyimpanan. */
  selesai: boolean | null;
  tandaiSelesai: () => void;
}

const KonteksSambutan = createContext<NilaiSambutan | null>(null);

/** Layar sambutan (onboarding) hanya tampil sekali per pemasangan aplikasi. */
export function SambutanProvider({ children }: { children: ReactNode }) {
  const [selesai, setSelesai] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KUNCI)
      .then((v) => setSelesai(v === "1"))
      .catch(() => setSelesai(true));
  }, []);

  const nilai = useMemo<NilaiSambutan>(
    () => ({
      selesai,
      tandaiSelesai: () => {
        setSelesai(true);
        void AsyncStorage.setItem(KUNCI, "1").catch(() => {});
      },
    }),
    [selesai],
  );

  return <KonteksSambutan.Provider value={nilai}>{children}</KonteksSambutan.Provider>;
}

export function useSambutan(): NilaiSambutan {
  const nilai = useContext(KonteksSambutan);
  if (!nilai) throw new Error("useSambutan harus dipakai di dalam SambutanProvider");
  return nilai;
}
