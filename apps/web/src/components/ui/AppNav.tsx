import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { usePeranAktif, type PeranAktif } from "../../lib/peran";
import { ChatIcon, ClipboardIcon, FeedIcon, HomeIcon, SproutCoinIcon, StoreIcon } from "./Icons";

export interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: ReactNode;
}

const BERANDA: NavItem = { to: "/app", label: "Beranda", end: true, icon: <HomeIcon size={22} /> };
const PAKAN: NavItem = { to: "/app/pakan", label: "Pakan", icon: <FeedIcon size={22} /> };
const CATATAN: NavItem = {
  to: "/app/catatan",
  label: "Catatan",
  icon: <ClipboardIcon size={22} />,
};
const KOKOK: NavItem = { to: "/app/tanya", label: "Kokok", icon: <ChatIcon size={22} /> };
const TOKO: NavItem = { to: "/app/toko", label: "Toko", icon: <StoreIcon size={22} /> };
const INVESTASI: NavItem = {
  to: "/app/investasi",
  label: "Investasi",
  icon: <SproutCoinIcon size={22} />,
};

/**
 * Menu per peran. Pengguna hanya Investasi dan Kokok; peternak membuka peluang kandangnya
 * sendiri lewat tab Peluang; tamu (mode peternak) bisa melihat-lihat peluang investasi.
 */
const NAV_PER_PERAN: Record<PeranAktif, readonly NavItem[]> = {
  tamu: [BERANDA, PAKAN, CATATAN, KOKOK, TOKO, INVESTASI],
  peternak: [
    BERANDA,
    PAKAN,
    CATATAN,
    KOKOK,
    TOKO,
    { ...INVESTASI, to: "/app/peternak", label: "Peluang" },
  ],
  pengguna: [INVESTASI, KOKOK],
};

export interface AppNavProps {
  variant: "bottom" | "rail";
  collapsed?: boolean;
  items?: readonly NavItem[];
  ariaLabel?: string;
}

export function AppNav({
  variant,
  collapsed = false,
  items,
  ariaLabel = "Navigasi utama",
}: AppNavProps) {
  const isRailCollapsed = variant === "rail" && collapsed;
  const { peran } = usePeranAktif();
  const daftarItem = items ?? NAV_PER_PERAN[peran];

  return (
    <nav
      className={`tk-nav tk-nav--${variant} ${isRailCollapsed ? "tk-nav--rail-collapsed" : ""}`.trim()}
      aria-label={ariaLabel}
    >
      <ul className="tk-nav__list">
        {daftarItem.map((item) => (
          <li key={item.to} className="tk-nav__item">
            <NavLink
              to={item.to}
              end={item.end}
              aria-label={isRailCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `tk-nav__link ${isActive ? "tk-nav__link--active" : ""} ${isRailCollapsed ? "tk-rail-tip-host" : ""}`.trim()
              }
            >
              <span className="tk-nav__icon">{item.icon}</span>
              <span
                className={`tk-nav__label ${isRailCollapsed ? "tk-rail-tip" : ""}`.trim()}
                aria-hidden={isRailCollapsed ? true : undefined}
              >
                {item.label}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
