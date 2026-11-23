import { Navigate, Outlet, useLocation } from "react-router";
import { useAkun } from "../../lib/akun";

/**
 * Penjaga semua halaman aplikasi (/app/*, kecuali /app/masuk): seluruh fitur wajib masuk.
 * Tamu dialihkan ke halaman Masuk dengan `lanjut` = halaman yang dituju, lalu kembali ke sana
 * setelah masuk. Status masuk dibaca dari salinan lokal, jadi aplikasi tetap terbuka saat offline
 * setelah pernah masuk. Akun demo dihitung sudah masuk.
 */
export function WajibMasuk() {
  const akun = useAkun();
  const lokasi = useLocation();
  if (akun) return <Outlet />;

  const lanjut = `${lokasi.pathname}${lokasi.search}`;
  return <Navigate to={`/app/masuk?lanjut=${encodeURIComponent(lanjut)}`} replace />;
}
