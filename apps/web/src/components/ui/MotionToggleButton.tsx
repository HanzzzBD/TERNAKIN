import { useMotionPreference } from "../../lib/motion";
import { TEKS } from "../../lib/teks";
import { MotionIcon } from "./Icons";

export interface MotionToggleButtonProps {
  compact?: boolean;
  className?: string;
}

export function MotionToggleButton({ compact = false, className = "" }: MotionToggleButtonProps) {
  const { isMotionOn, toggleMotion } = useMotionPreference();
  const statusTeks = isMotionOn ? TEKS.animasiAktif : TEKS.animasiMati;

  return (
    <button
      type="button"
      className={`tk-motion-btn ${compact ? "tk-motion-btn--compact" : ""} ${className}`.trim()}
      aria-pressed={!isMotionOn}
      aria-label={`${TEKS.aturAnimasi}: ${statusTeks}`}
      onClick={toggleMotion}
    >
      <MotionIcon size={18} />
      <span>{compact ? statusTeks : `${TEKS.aturAnimasi}: ${statusTeks}`}</span>
    </button>
  );
}
