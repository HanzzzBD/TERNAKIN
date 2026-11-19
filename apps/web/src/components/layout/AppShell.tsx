import type { ReactNode } from "react";
import { Link } from "react-router";
import { useSyncStatus } from "../../db/sync";
import { TEKS } from "../../lib/teks";
import { PwaStatusBar } from "../PwaStatusBar";
import { AppNav, Banner, MotionToggleButton, RefreshIcon, WifiIcon, WifiOffIcon } from "../ui";

export interface AppShellProps {
  pageTitle?: string;
  children: ReactNode;
}

export function AppShell({ pageTitle, children }: AppShellProps) {
  const { isOnline, pendingCount, isSyncing, namaKandangAktif } = useSyncStatus();

  const statusChipLabel = !isOnline
    ? TEKS.statusOffline
    : isSyncing
      ? "Menyinkron..."
      : pendingCount > 0
        ? `${pendingCount} menunggu`
        : "Tersinkron";

  const statusChipClass = !isOnline
    ? "tk-net-chip--offline"
    : pendingCount > 0
      ? "tk-net-chip--pending"
      : "tk-net-chip--online";

  return (
    <div className="tk-shell">
      <a href="#konten-utama" className="skip-link">
        {TEKS.lewatiKeKonten}
      </a>

      <aside className="tk-shell__rail" aria-label="Bilah navigasi samping">
        <div className="tk-shell__rail-brand">
          <p className="tk-wordmark">
            {TEKS.namaAplikasi}
            <span className="tk-wordmark__dot" aria-hidden="true">
              .
            </span>
          </p>
          {namaKandangAktif && <p className="tk-shell__kandang-sub">{namaKandangAktif}</p>}
        </div>

        <div className="tk-shell__rail-nav">
          <AppNav variant="rail" ariaLabel="Navigasi samping" />
        </div>

        <div className="tk-shell__rail-footer">
          <Link to="/app/profil" className="tk-shell__profil-link">
            Profil kandang
          </Link>
          <MotionToggleButton />
        </div>
      </aside>

      <div className="tk-shell__frame">
        <header className="tk-shell__topbar">
          <div className="tk-shell__topbar-inner">
            <div className="tk-shell__topbar-left">
              <p className="tk-wordmark tk-shell__mobile-brand">
                {TEKS.namaAplikasi}
                <span className="tk-wordmark__dot" aria-hidden="true">
                  .
                </span>
              </p>
              {pageTitle && (
                <p className="tk-shell__page-title">
                  {pageTitle}
                  {namaKandangAktif ? ` · ${namaKandangAktif}` : ""}
                </p>
              )}
            </div>

            <div className="tk-shell__topbar-right">
              <span className={`tk-net-chip ${statusChipClass}`} role="status" aria-live="polite">
                {!isOnline ? (
                  <WifiOffIcon size={16} />
                ) : pendingCount > 0 ? (
                  <RefreshIcon size={16} />
                ) : (
                  <WifiIcon size={16} />
                )}
                <span>{statusChipLabel}</span>
              </span>

              <div className="tk-shell__mobile-motion">
                <MotionToggleButton compact />
              </div>
            </div>
          </div>
        </header>

        <main id="konten-utama" className="tk-shell__main" tabIndex={-1}>
          <div className="tk-shell__content">
            <PwaStatusBar />

            {!isOnline && (
              <div className="tk-shell__offline">
                <Banner variant="offline">{TEKS.bannerOffline}</Banner>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>

      <div className="tk-shell__bottom">
        <div className="tk-shell__bottom-inner">
          <AppNav variant="bottom" ariaLabel="Navigasi bawah" />
        </div>
      </div>
    </div>
  );
}
