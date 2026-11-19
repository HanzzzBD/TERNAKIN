import type { ReactNode } from "react";
import { AlertOctagonIcon, AlertTriangleIcon, ShieldCheckIcon } from "./Icons";

export type UrgencyLevel = "rendah" | "sedang" | "tinggi";

export interface UrgencyChipProps {
  urgency: UrgencyLevel;
  className?: string;
}

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; icon: ReactNode }> = {
  rendah: { label: "Rendah", icon: <ShieldCheckIcon size={16} /> },
  sedang: { label: "Sedang", icon: <AlertTriangleIcon size={16} /> },
  tinggi: { label: "Tinggi", icon: <AlertOctagonIcon size={16} /> },
};

export function UrgencyChip({ urgency, className = "" }: UrgencyChipProps) {
  const config = URGENCY_CONFIG[urgency];
  return (
    <span className={`tk-urgency tk-urgency--${urgency} ${className}`.trim()}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}
