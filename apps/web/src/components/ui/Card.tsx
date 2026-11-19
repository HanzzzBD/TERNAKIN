import type { HTMLAttributes, ReactNode } from "react";

export type CardVariant = "default" | "warm" | "trust" | "danger";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  as?: "section" | "article" | "div";
  children: ReactNode;
}

export function Card({
  variant = "default",
  as: Tag = "section",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <Tag className={`tk-card tk-card--${variant} ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}
