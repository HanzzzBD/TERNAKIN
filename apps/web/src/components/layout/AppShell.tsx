import type { ReactNode } from "react";
import { useOnlineStatus } from "../../lib/pwa";
import { TEKS } from "../../lib/teks";
import { PwaStatusBar } from "../PwaStatusBar";
import { AppNav, Banner, MotionToggleButton, WifiIcon, WifiOffIcon } from "../ui";

export interface AppShellProps {
  pageTitle?: string;
  children: ReactNode;
}

export function AppShell({ pageTitle, children }: AppShellProps) {
  const isOnline = useOnlineStatus();

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
        </div>

        <div className="tk-shell__rail-nav">
          <AppNav variant="rail" ariaLabel="Navigasi samping" />
        </div>

        <div className="tk-shell__rail-footer">
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
              {pageTitle && <p className="tk-shell__page-title">{pageTitle}</p>}
            </div>

            <div className="tk-shell__topbar-right">
              <span
                className={`tk-net-chip ${isOnline ? "tk-net-chip--online" : "tk-net-chip--offline"}`}
                role="status"
                aria-live="polite"
              >
                {isOnline ? <WifiIcon size={16} /> : <WifiOffIcon size={16} />}
                <span>{isOnline ? TEKS.statusOnline : TEKS.statusOffline}</span>
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
