import type { SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function BaseIcon({ size = 20, children, "aria-label": ariaLabel, ...props }: IconProps) {
  const isDecorative = !ariaLabel;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={isDecorative ? true : undefined}
      role={isDecorative ? undefined : "img"}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </BaseIcon>
  );
}

export function FeedIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 13a8 8 0 0 0 16 0H4Z" />
      <path d="M7 13c.5-3 2.5-5 5-5s4.5 2 5 5" />
      <path d="M12 5v3" />
    </BaseIcon>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V2.5h6V4" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
    </BaseIcon>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9l-5 4V6Z" />
      <path d="M8.5 9.5h7" />
      <path d="M8.5 13h4.5" />
    </BaseIcon>
  );
}

export function StoreIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 9 5 4h14l2 5" />
      <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M5 12v8h14v-8" />
    </BaseIcon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </BaseIcon>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </BaseIcon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </BaseIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </BaseIcon>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66L20 8.5" />
      <path d="M20 4v4.5h-4.5" />
    </BaseIcon>
  );
}

export function MotionIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M10 9.5 15 12l-5 2.5v-5Z" />
    </BaseIcon>
  );
}

export function InstallIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
    </BaseIcon>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </BaseIcon>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10.3 4.3 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 16.5h.01" />
    </BaseIcon>
  );
}

export function AlertOctagonIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <polygon points="8 3 16 3 21 8 21 16 16 21 8 21 3 16 3 8" />
      <path d="M12 8v5" />
      <path d="M12 16.5h.01" />
    </BaseIcon>
  );
}

export function WifiIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 9.5a11.5 11.5 0 0 1 16 0" />
      <path d="M7.5 13a6.5 6.5 0 0 1 9 0" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </BaseIcon>
  );
}

export function WifiOffIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 3l18 18" />
      <path d="M8.5 12.8a6.5 6.5 0 0 1 6.7.2" />
      <path d="M4 9.5a11.5 11.5 0 0 1 6.1-2.8" />
      <path d="M14.5 6.9A11.5 11.5 0 0 1 20 9.5" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </BaseIcon>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.6-1.2A9 9 0 1 0 12 3Z" />
      <path d="M9.2 8.8c-.3.6-.3 1.7.4 2.9.8 1.3 2 2.4 3.4 3 1.1.5 2 .4 2.5 0l.7-.7c.2-.2.2-.6 0-.8l-1.3-.9c-.2-.2-.5-.1-.7.1l-.5.5c-.8-.3-1.8-1.2-2.2-2l.4-.5c.2-.2.2-.5.1-.7l-.8-1.4c-.2-.2-.5-.3-.8-.1l-.7.6Z" />
    </BaseIcon>
  );
}
