export type SkeletonVariant = "text" | "title" | "card" | "button";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
}

export function Skeleton({ variant = "text", className = "" }: SkeletonProps) {
  return (
    <div className={`tk-skeleton tk-skeleton--${variant} ${className}`.trim()} aria-hidden="true" />
  );
}
