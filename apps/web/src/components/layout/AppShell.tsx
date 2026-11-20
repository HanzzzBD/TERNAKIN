import { useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import { useSyncStatus } from "../../db/sync";
import { usePageTransition } from "../../lib/gsapAnimations";
import { TEKS } from "../../lib/teks";
import { PwaStatusBar } from "../PwaStatusBar";
import { AkunMenu } from "./AkunMenu";
import {
  AppNav,
  Banner,
  RefreshIcon,
  SidebarCollapseIcon,
  SidebarExpandIcon,
  UserIcon,
  WifiIcon,
  WifiOffIcon,
} from "../ui";

const RAIL_STORAGE_KEY = "tk.rail";

function bacaStatusRailAwal(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const tersimpan = window.localStorage.getItem(RAIL_STORAGE_KEY);
    if (tersimpan === "expanded") return false;
    return true;
  } catch {
    return true;
  }
}

export interface AppShellProps {
  pageTitle?: string;
  children: ReactNode;
}

export function AppShell({ pageTitle, children }: AppShellProps) {
  const { isOnline, pendingCount, isSyncing, namaKandangAktif } = useSyncStatus();
  const [isRailCollapsed, setIsRailCollapsed] = useState<boolean>(bacaStatusRailAwal);
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement | null>(null);

  usePageTransition(contentRef, location.pathname);

  const handleToggleRail = () => {
    setIsRailCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(RAIL_STORAGE_KEY, next ? "collapsed" : "expanded");
      } catch {
        // Abaikan bila localStorage tidak tersedia
      }
      return next;
    });
  };

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

  const labelToggleRail = isRailCollapsed ? "Buka menu" : "Kecilkan menu";

  return (
    <div className="tk-shell">
      <a href="#konten-utama" className="skip-link">
        {TEKS.lewatiKeKonten}
      </a>

      <aside
        className={`tk-shell__rail ${isRailCollapsed ? "tk-shell__rail--collapsed" : ""}`.trim()}
        aria-label="Bilah navigasi samping"
        data-collapsed={isRailCollapsed ? "true" : "false"}
      >
        <div className="tk-shell__rail-brand">
          <img
            src="/images/kokok.webp"
            alt=""
            aria-hidden="true"
            className="tk-brand-kokok-avatar"
            width={36}
            height={36}
          />
          {!isRailCollapsed && (
            <div className="tk-shell__rail-brand-text">
              <p className="tk-wordmark">
                {TEKS.namaAplikasi}
                <span className="tk-wordmark__dot" aria-hidden="true">
                  .
                </span>
              </p>
              {namaKandangAktif && <p className="tk-shell__kandang-sub">{namaKandangAktif}</p>}
            </div>
          )}
        </div>

        <div className="tk-shell__rail-nav">
          <AppNav variant="rail" collapsed={isRailCollapsed} ariaLabel="Navigasi samping" />
        </div>

        <div className="tk-shell__rail-footer">
          <NavLink
            to="/app/profil"
            aria-label={isRailCollapsed ? "Profil kandang" : undefined}
            className={({ isActive }) =>
              `tk-shell__profil-link ${isActive ? "tk-shell__profil-link--active" : ""} ${isRailCollapsed ? "tk-shell__profil-link--collapsed tk-rail-tip-host" : ""}`.trim()
            }
          >
            <span className="tk-nav__icon">
              <UserIcon size={20} />
            </span>
            <span
              className={isRailCollapsed ? "tk-rail-tip" : ""}
              aria-hidden={isRailCollapsed ? true : undefined}
            >
              Profil kandang
            </span>
          </NavLink>

          <button
            type="button"
            className={`tk-shell__rail-toggle ${isRailCollapsed ? "tk-shell__rail-toggle--collapsed tk-rail-tip-host" : ""}`.trim()}
            aria-expanded={!isRailCollapsed}
            aria-label={isRailCollapsed ? labelToggleRail : undefined}
            onClick={handleToggleRail}
          >
            <span className="tk-nav__icon">
              {isRailCollapsed ? (
                <SidebarExpandIcon size={20} />
              ) : (
                <SidebarCollapseIcon size={20} />
              )}
            </span>
            <span
              className={isRailCollapsed ? "tk-rail-tip" : ""}
              aria-hidden={isRailCollapsed ? true : undefined}
            >
              {labelToggleRail}
            </span>
          </button>
        </div>
      </aside>

      <div className="tk-shell__frame">
        <header className="tk-shell__topbar">
          <div className="tk-shell__topbar-inner">
            <div className="tk-shell__topbar-left">
              <div className="tk-shell__mobile-brand">
                <img
                  src="/images/kokok.webp"
                  alt=""
                  aria-hidden="true"
                  className="tk-brand-kokok-avatar"
                  width={32}
                  height={32}
                />
                <p className="tk-wordmark">
                  {TEKS.namaAplikasi}
                  <span className="tk-wordmark__dot" aria-hidden="true">
                    .
                  </span>
                </p>
              </div>
              {pageTitle && (
                <p className="tk-shell__page-title">
                  {pageTitle}
                  {namaKandangAktif ? ` · ${namaKandangAktif}` : ""}
                </p>
              )}
            </div>

            <div className="tk-shell__topbar-right">
              <AkunMenu />
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
            </div>
          </div>
        </header>

        <main id="konten-utama" className="tk-shell__main" tabIndex={-1}>
          <div ref={contentRef} className="tk-shell__content">
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
