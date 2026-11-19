import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { ChatIcon, ClipboardIcon, FeedIcon, HomeIcon, StoreIcon } from "./Icons";

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
];

export interface AppNavProps {
  variant: "bottom" | "rail";
  items?: readonly NavItem[];
  ariaLabel?: string;
}

export function AppNav({
  variant,
  items = DEFAULT_NAV_ITEMS,
  ariaLabel = "Navigasi utama",
}: AppNavProps) {
  return (
    <nav className={`tk-nav tk-nav--${variant}`} aria-label={ariaLabel}>
      <ul className="tk-nav__list">
        {items.map((item) => (
          <li key={item.to} className="tk-nav__item">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `tk-nav__link ${isActive ? "tk-nav__link--active" : ""}`.trim()
              }
            >
              <span className="tk-nav__icon">{item.icon}</span>
              <span className="tk-nav__label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
