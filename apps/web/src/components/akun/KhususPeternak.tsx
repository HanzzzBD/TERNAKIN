import type { ReactNode } from "react";
import { Link, Navigate } from "react-router";
import { usePeranAktif } from "../../lib/peran";
import { AppShell } from "../layout/AppShell";
import { ArrowRightIcon, Card, ChatIcon, SproutCoinIcon } from "../ui";

/**
 * Penjaga halaman khusus peternak (pakan, catatan, toko). Tamu tetap boleh (mode tamu = peternak).
 * Akun berperan Pengguna melihat penjelasan dan diarahkan ke fitur miliknya.
 */
export function KhususPeternak({
  children,
  alihkanPengguna = false,
}: {
  children: ReactNode;
  /** true: pengguna langsung dialihkan ke Investasi (dipakai untuk Beranda). */
  alihkanPengguna?: boolean;
}) {
  const { peran } = usePeranAktif();
  if (peran !== "pengguna") return <>{children}</>;
  if (alihkanPengguna) return <Navigate to="/app/investasi" replace />;

  return (
    <AppShell pageTitle="Khusus peternak">
      <Card variant="warm" className="tk-khusus-peternak">
        <p className="tk-eyebrow">KHUSUS PETERNAK</p>
        <h1 className="tk-pakan-h1">Fitur ini untuk peternak</h1>
        <p className="tk-muted tk-prose">
          Akun Anda berperan <strong>Pengguna</strong>. Pengguna bisa bertanya ke Kokok tentang ayam
          peliharaan dan menitipkan modal ke peternak di sekitar.
        </p>
        <div className="tk-actions-row">
          <Link to="/app/investasi" className="tk-btn tk-btn--primary">
            <SproutCoinIcon size={18} />
            Lihat peluang investasi
          </Link>
          <Link to="/app/tanya" className="tk-btn tk-btn--secondary">
            <ChatIcon size={18} />
            Tanya Kokok
          </Link>
        </div>
        <p className="tk-muted tk-prose" style={{ marginBottom: 0 }}>
          Anda juga beternak?{" "}
          <Link to="/app/profil">
            Ganti peran ke Peternak <ArrowRightIcon size={14} />
          </Link>
        </p>
      </Card>
    </AppShell>
  );
}
