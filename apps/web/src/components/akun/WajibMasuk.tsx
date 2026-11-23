import type { ReactNode } from "react";
import { Link } from "react-router";
import { useAkun } from "../../lib/akun";
import { AppShell } from "../layout/AppShell";
import { ArrowRightIcon, Card, ClipboardIcon, FeedIcon, KokokMascot } from "../ui";

/**
 * Penjaga halaman yang wajib masuk (Kokok). Tamu melihat ajakan masuk; setelah masuk, halaman
 * masuk mengembalikan pengguna ke `lanjut`. Akun demo dihitung sudah masuk.
 */
export function WajibMasuk({
  children,
  pageTitle,
  judul,
  deskripsi,
  lanjut,
}: {
  children: ReactNode;
  pageTitle: string;
  judul: string;
  deskripsi: ReactNode;
  /** Path /app/... tujuan setelah masuk. */
  lanjut: string;
}) {
  const akun = useAkun();
  if (akun) return <>{children}</>;

  return (
    <AppShell pageTitle={pageTitle}>
      <Card variant="warm" className="tk-wajib-masuk">
        <div className="tk-kokok-header">
          <KokokMascot size="md" />
          <div>
            <p className="tk-eyebrow">PERLU MASUK</p>
            <h1 className="tk-pakan-h1">{judul}</h1>
            <p className="tk-muted tk-prose">{deskripsi}</p>
          </div>
        </div>
        <div className="tk-actions-row">
          <Link
            to={`/app/masuk?lanjut=${encodeURIComponent(lanjut)}`}
            className="tk-btn tk-btn--primary"
          >
            Masuk atau daftar
            <ArrowRightIcon size={18} />
          </Link>
        </div>
        <p className="tk-muted tk-prose" style={{ marginBottom: 0 }}>
          Tanpa akun, Anda tetap bisa memakai:
        </p>
        <div className="tk-actions-row">
          <Link to="/app/pakan" className="tk-btn tk-btn--secondary">
            <FeedIcon size={18} />
            Hitung pakan
          </Link>
          <Link to="/app/catatan" className="tk-btn tk-btn--secondary">
            <ClipboardIcon size={18} />
            Catatan harian
          </Link>
        </div>
      </Card>
    </AppShell>
  );
}
