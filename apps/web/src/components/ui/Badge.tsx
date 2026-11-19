import type { ReactNode } from "react";
import { AlertTriangleIcon, ShieldCheckIcon, StoreIcon, WifiOffIcon } from "./Icons";

export type BadgeVariant = "mitra" | "solver" | "usang" | "offline";

export interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

const DEFAULT_BADGE: Record<BadgeVariant, { label: string; icon: ReactNode }> = {
  mitra: { label: "Toko mitra", icon: <StoreIcon size={16} /> },
  solver: { label: "Dihitung solver", icon: <ShieldCheckIcon size={16} /> },
  usang: { label: "Usang", icon: <AlertTriangleIcon size={16} /> },
  offline: { label: "Offline", icon: <WifiOffIcon size={16} /> },
};

export function Badge({ variant, label, className = "" }: BadgeProps) {
  const config = DEFAULT_BADGE[variant];
  return (
    <span className={`tk-badge tk-badge--${variant} ${className}`.trim()}>
      {config.icon}
      <span>{label ?? config.label}</span>
    </span>
  );
}
