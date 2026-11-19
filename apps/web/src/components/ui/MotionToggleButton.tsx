import { useMotionPreference } from "../../lib/motion";
import { TEKS } from "../../lib/teks";
import { MotionIcon } from "./Icons";

export interface MotionToggleButtonProps {
  compact?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export function MotionToggleButton({
  compact = false,
  iconOnly = false,
  className = "",
}: MotionToggleButtonProps) {
  const { isMotionOn, toggleMotion } = useMotionPreference();
  const statusTeks = isMotionOn ? TEKS.animasiAktif : TEKS.animasiMati;
  const labelLengkap = `${TEKS.aturAnimasi}: ${statusTeks}`;

  return (
    <button
      type="button"
      className={`tk-motion-btn ${compact ? "tk-motion-btn--compact" : ""} ${iconOnly ? "tk-motion-btn--icon-only tk-rail-tip-host" : ""} ${className}`.trim()}
      aria-pressed={!isMotionOn}
      aria-label={labelLengkap}
      onClick={toggleMotion}
    >
      <MotionIcon size={18} />
      {iconOnly ? (
        <span className="tk-rail-tip" aria-hidden="true">
          {labelLengkap}
        </span>
      ) : (
        <span>{compact ? statusTeks : labelLengkap}</span>
      )}
    </button>
  );
}
