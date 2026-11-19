import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  variant?: "default" | "primary" | "ghost";
  icon: ReactNode;
}

export function IconButton({
  variant = "default",
  icon,
  className = "",
  type = "button",
  ...props
}: IconButtonProps) {
  const classes = ["tk-icon-btn", `tk-icon-btn--${variant}`, className].filter(Boolean).join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {icon}
    </button>
  );
}
