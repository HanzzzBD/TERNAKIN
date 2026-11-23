import { useState } from "react";
import { Link } from "react-router";
import { useAkun } from "../../lib/akun";
import { ArrowRightIcon, Banner, Button } from "../ui";

const KUNCI_DITUTUP = "tk.pengingatMasuk.ditutupPada";
const JEDA_TAMPIL_ULANG_MS = 7 * 24 * 60 * 60 * 1000;

function baruSajaDitutup(): boolean {
  try {
    const mentah = window.localStorage.getItem(KUNCI_DITUTUP);
    const waktu = mentah ? Date.parse(mentah) : Number.NaN;
    return Number.isFinite(waktu) && Date.now() - waktu < JEDA_TAMPIL_ULANG_MS;
  } catch {
    return false;
  }
}

/**
 * Pengingat untuk tamu bahwa data hanya tersimpan di perangkat ini. Tamu tetap bebas memakai
 * fitur peternak; "Nanti saja" menyembunyikan pengingat selama 7 hari.
 */
export function PengingatMasuk({ lanjut = "/app" }: { lanjut?: string }) {
  const akun = useAkun();
  const [ditutup, setDitutup] = useState(baruSajaDitutup);
  if (akun || ditutup) return null;

  const tutup = () => {
    setDitutup(true);
    try {
      window.localStorage.setItem(KUNCI_DITUTUP, new Date().toISOString());
    } catch {
      // Abaikan bila localStorage tidak tersedia; pengingat tertutup untuk sesi ini saja
    }
  };

  return (
    <Banner
      variant="info"
      title="Data Anda hanya tersimpan di perangkat ini"
      action={
        <div className="tk-pengingat-masuk__aksi">
          <Link
            to={`/app/masuk?lanjut=${encodeURIComponent(lanjut)}`}
            className="tk-btn tk-btn--primary"
          >
            Masuk
            <ArrowRightIcon size={16} />
          </Link>
          <Button variant="ghost" onClick={tutup}>
            Nanti saja
          </Button>
        </div>
      }
    >
      Masuk agar catatan kandang tercadang dan bisa dibuka di HP lain, serta untuk bertanya ke
      Kokok. Data yang sudah ada ikut dipindah ke akun Anda.
    </Banner>
  );
}
