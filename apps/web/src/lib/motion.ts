import { useCallback, useEffect, useState } from "react";

export type MotionMode = "on" | "off";

export const MOTION_STORAGE_KEY = "tk.motion";
const MOTION_CHANGE_EVENT = "tk:motion-change";

function bacaPreferensiSistem(): MotionMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "on";
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "off" : "on";
}

export function getInitialMotion(): MotionMode {
  if (typeof window === "undefined") {
    return "on";
  }
  try {
    const tersimpan = window.localStorage.getItem(MOTION_STORAGE_KEY);
    if (tersimpan === "on" || tersimpan === "off") {
      return tersimpan;
    }
  } catch {
    // Abaikan jika penyimpanan lokal dibatasi peramban
  }
  return bacaPreferensiSistem();
}

export function applyMotionPreference(mode: MotionMode): void {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.motion = mode;
  }
}

export function saveMotionPreference(mode: MotionMode): void {
  applyMotionPreference(mode);
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, mode);
  } catch {
    // Abaikan jika localStorage tidak tersedia
  }
  window.dispatchEvent(new CustomEvent<MotionMode>(MOTION_CHANGE_EVENT, { detail: mode }));
}

export function initMotionPreference(): MotionMode {
  const mode = getInitialMotion();
  applyMotionPreference(mode);
  return mode;
}

export function useMotionPreference() {
  const [motion, setMotionState] = useState<MotionMode>(() => getInitialMotion());

  useEffect(() => {
    applyMotionPreference(motion);
  }, [motion]);

  useEffect(() => {
    const onChange = (event: Event) => {
      const customEvent = event as CustomEvent<MotionMode>;
      if (customEvent.detail === "on" || customEvent.detail === "off") {
        setMotionState(customEvent.detail);
      }
    };
    window.addEventListener(MOTION_CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener(MOTION_CHANGE_EVENT, onChange);
    };
  }, []);

  const setMotion = useCallback((mode: MotionMode) => {
    setMotionState(mode);
    saveMotionPreference(mode);
  }, []);

  const toggleMotion = useCallback(() => {
    setMotion(motion === "on" ? "off" : "on");
  }, [motion, setMotion]);

  return {
    motion,
    isMotionOn: motion === "on",
    setMotion,
    toggleMotion,
  };
}
