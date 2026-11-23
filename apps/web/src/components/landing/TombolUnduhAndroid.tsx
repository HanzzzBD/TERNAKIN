import { useEffect, useState } from "react";
import type { InfoUnduhanAndroid } from "@ternakin/shared";
import { formatUkuranMb, muatInfoAndroid } from "../../lib/unduhan";
import { InstallIcon } from "../ui";

/**
 * Tombol unduh APK Android dari server Ternakin. Tidak tampil bila APK belum dipasang di server
 * atau info gagal dimuat (misalnya offline), agar tidak ada tautan yang berujung 404.
 */
export function TombolUnduhAndroid({ className = "" }: { className?: string }) {
  const [info, setInfo] = useState<InfoUnduhanAndroid | null>(null);

  useEffect(() => {
    let aktif = true;
    void muatInfoAndroid().then((hasil) => {
      if (aktif) setInfo(hasil);
    });
    return () => {
      aktif = false;
    };
  }, []);

  if (!info?.tersedia) return null;
  const ukuran = formatUkuranMb(info.ukuranByte);

  return (
    <a href={info.url} download="Ternakin.apk" className={`tk-btn ${className}`.trim()}>
      <InstallIcon size={20} />
      <span>Unduh untuk Android{ukuran ? ` (${ukuran})` : ""}</span>
    </a>
  );
}
