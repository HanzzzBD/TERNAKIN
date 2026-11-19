import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MOTION_STORAGE_KEY,
  getInitialMotion,
  initMotionPreference,
  saveMotionPreference,
} from "./motion";

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.motion;
  vi.restoreAllMocks();
});

describe("Pengaturan gerakan data-motion", () => {
  it("mengikuti prefers-reduced-motion: reduce bila belum ada pilihan tersimpan", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList,
    );

    expect(getInitialMotion()).toBe("off");
    expect(initMotionPreference()).toBe("off");
    expect(document.documentElement.dataset.motion).toBe("off");
  });

  it("menyimpan pilihan pengguna ke localStorage tk.motion dan data-motion", () => {
    saveMotionPreference("off");
    expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBe("off");
    expect(document.documentElement.dataset.motion).toBe("off");

    saveMotionPreference("on");
    expect(window.localStorage.getItem(MOTION_STORAGE_KEY)).toBe("on");
    expect(document.documentElement.dataset.motion).toBe("on");
  });
});
