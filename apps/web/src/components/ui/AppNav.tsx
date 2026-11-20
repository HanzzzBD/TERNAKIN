import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { useAkunDemo } from "../../lib/akunDemo";
import { ChatIcon, ClipboardIcon, FeedIcon, HomeIcon, SproutCoinIcon, StoreIcon } from "./Icons";

export interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: ReactNode;
}

const DEFAULT_NAV_ITEMS: readonly NavItem[] = [
  { to: "/app", label: "Beranda", end: true, icon: <HomeIcon size={22} /> },
  { to: "/app/pakan", label: "Pakan", icon: <FeedIcon size={22} /> },
  { to: "/app/catatan", label: "Catatan", icon: <ClipboardIcon size={22} /> },
  { to: "/app/tanya", label: "Kokok", icon: <ChatIcon size={22} /> },
  { to: "/app/toko", label: "Toko", icon: <StoreIcon size={22} /> },
  { to: "/app/investasi", label: "Investasi", icon: <SproutCoinIcon size={22} /> },
];

export interface AppNavProps {
  variant: "bottom" | "rail";
  collapsed?: boolean;
  items?: readonly NavItem[];
  ariaLabel?: string;
}

export function AppNav({
  variant,
  collapsed = false,
  items = DEFAULT_NAV_ITEMS,
  ariaLabel = "Navigasi utama",
}: AppNavProps) {
  const isRailCollapsed = variant === "rail" && collapsed;
  const akun = useAkunDemo();
  // Untuk peternak, tab Investasi langsung membuka profil peternakannya sendiri
  const daftarItem =
    akun?.peran === "peternak"
      ? items.map((item) =>
          item.to === "/app/investasi" ? { ...item, to: "/app/peternak" } : item,
        )
      : items;

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
