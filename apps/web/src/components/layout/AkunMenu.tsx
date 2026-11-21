import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { GalatAkun, keluarAkun } from "../../lib/akun";
import { BERANDA_PERAN, LABEL_PERAN, namaTampil, usePeranAktif } from "../../lib/peran";
import { ArrowRightIcon, LogOutIcon, RefreshIcon, UserIcon } from "../ui";

/**
 * Chip akun di bilah atas aplikasi. Saat belum masuk berupa tautan "Masuk";
 * saat sudah masuk membuka menu kecil berisi halaman peran, ganti peran, dan keluar.
 */
export function AkunMenu() {
  const { akun, peran } = usePeranAktif();
  const [galat, setGalat] = useState<string | null>(null);
  const navigate = useNavigate();
  const idMenu = useId();
  const [terbuka, setTerbuka] = useState(false);
  const wadahRef = useRef<HTMLDivElement | null>(null);
  const tombolRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!terbuka) return;
    const tutupBilaDiLuar = (e: MouseEvent) => {
      if (wadahRef.current && !wadahRef.current.contains(e.target as Node)) setTerbuka(false);
    };
    const tutupDenganEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setTerbuka(false);
        tombolRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", tutupBilaDiLuar);
    document.addEventListener("keydown", tutupDenganEsc);
    return () => {
      document.removeEventListener("mousedown", tutupBilaDiLuar);
      document.removeEventListener("keydown", tutupDenganEsc);
    };
  }, [terbuka]);

  if (!akun) {
    return (
      <Link to="/app/masuk" className="tk-akun-chip">
        <UserIcon size={16} />
        <span className="tk-akun-chip__text">Masuk</span>
      </Link>
    );
  }

  const keluar = async () => {
    setGalat(null);
    try {
      await keluarAkun();
      setTerbuka(false);
      void navigate("/app");
    } catch (err) {
      setGalat(err instanceof GalatAkun ? err.message : "Belum bisa keluar. Coba lagi.");
    }
  };

  const labelPeran = akun.peran ? LABEL_PERAN[akun.peran] : "Pilih peran";

  return (
    <div ref={wadahRef} className="tk-akun-menu">
      <button
        ref={tombolRef}
        type="button"
        className="tk-akun-chip"
        aria-expanded={terbuka}
        aria-controls={idMenu}
        onClick={() => setTerbuka((t) => !t)}
      >
        <UserIcon size={16} />
        <span className="tk-akun-chip__text">
          {namaTampil(akun)} · {labelPeran}
        </span>
      </button>

      {terbuka && (
        <div id={idMenu} className="tk-akun-menu__panel">
          <p className="tk-akun-menu__who">
            <strong>{namaTampil(akun)}</strong>
            <span>
              {akun.isDemo ? "Akun demo " : "Akun "}
              {labelPeran.toLowerCase()}
            </span>
          </p>
          <Link
            to={peran === "peternak" ? "/app/peternak" : BERANDA_PERAN[peran]}
            className="tk-akun-menu__item"
            onClick={() => setTerbuka(false)}
          >
            <ArrowRightIcon size={18} />
            {peran === "pengguna" ? "Peluang investasi" : "Kandang saya"}
          </Link>
          <Link to="/app/profil" className="tk-akun-menu__item" onClick={() => setTerbuka(false)}>
            <RefreshIcon size={18} />
            {akun.isDemo ? "Profil akun" : "Ganti peran"}
          </Link>
          <button
            type="button"
            className="tk-akun-menu__item tk-akun-menu__item--keluar"
            onClick={() => void keluar()}
          >
            <LogOutIcon size={18} />
            Keluar
          </button>
          {galat && (
            <p className="tk-akun-menu__galat" role="alert">
              {galat}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
