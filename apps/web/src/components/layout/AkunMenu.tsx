import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { BERANDA_PERAN, LABEL_PERAN, keluarDemo, useAkunDemo } from "../../lib/akunDemo";
import { ArrowRightIcon, LogOutIcon, RefreshIcon, UserIcon } from "../ui";

/**
 * Chip akun di bilah atas aplikasi. Saat belum masuk berupa tautan "Masuk";
 * saat sudah masuk membuka menu kecil berisi halaman peran, ganti akun, dan keluar.
 */
export function AkunMenu() {
  const akun = useAkunDemo();
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

  const keluar = (keHalamanMasuk: boolean) => {
    setTerbuka(false);
    keluarDemo();
    if (keHalamanMasuk) void navigate("/app/masuk");
  };

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
          {akun.nama} · {LABEL_PERAN[akun.peran]}
        </span>
      </button>

      {terbuka && (
        <div id={idMenu} className="tk-akun-menu__panel">
          <p className="tk-akun-menu__who">
            <strong>{akun.nama}</strong>
            <span>Akun demo {LABEL_PERAN[akun.peran].toLowerCase()}</span>
          </p>
          <Link
            to={BERANDA_PERAN[akun.peran]}
            className="tk-akun-menu__item"
            onClick={() => setTerbuka(false)}
          >
            <ArrowRightIcon size={18} />
            {akun.peran === "peternak" ? "Kandang saya" : "Peluang investasi"}
          </Link>
          <button type="button" className="tk-akun-menu__item" onClick={() => keluar(true)}>
            <RefreshIcon size={18} />
            Ganti akun
          </button>
          <button
            type="button"
            className="tk-akun-menu__item tk-akun-menu__item--keluar"
            onClick={() => keluar(false)}
          >
            <LogOutIcon size={18} />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}
