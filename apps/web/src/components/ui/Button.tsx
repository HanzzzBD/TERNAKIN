import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

export function Button({
  variant = "primary",
  fullWidth = false,
  iconStart,
  iconEnd,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  const classes = ["tk-btn", `tk-btn--${variant}`, fullWidth ? "tk-btn--full" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {iconStart && <span className="tk-btn__icon">{iconStart}</span>}
      <span>{children}</span>
      {iconEnd && <span className="tk-btn__icon">{iconEnd}</span>}
    </button>
  );
}
