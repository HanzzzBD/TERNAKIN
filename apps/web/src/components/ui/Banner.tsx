import type { ReactNode } from "react";
import { AlertOctagonIcon, AlertTriangleIcon, ShieldCheckIcon, WifiOffIcon } from "./Icons";

export type BannerVariant = "offline" | "error" | "info" | "success";

export interface BannerProps {
  variant: BannerVariant;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

const BANNER_ICON: Record<BannerVariant, ReactNode> = {
  offline: <WifiOffIcon size={20} />,
  error: <AlertOctagonIcon size={20} />,
  info: <AlertTriangleIcon size={20} />,
  success: <ShieldCheckIcon size={20} />,
};

export function Banner({ variant, title, children, action, className = "" }: BannerProps) {
  const role = variant === "error" || variant === "offline" ? "alert" : "status";

  return (
    <div className={`tk-banner tk-banner--${variant} ${className}`.trim()} role={role}>
      <span className="tk-banner__icon">{BANNER_ICON[variant]}</span>
      <div className="tk-banner__body">
        {title && <strong className="tk-banner__title">{title}</strong>}
        <div className="tk-banner__text">{children}</div>
      </div>
      {action && <div className="tk-banner__action">{action}</div>}
    </div>
  );
}
