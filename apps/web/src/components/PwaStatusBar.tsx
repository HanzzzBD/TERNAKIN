import { useRegisterSW } from "virtual:pwa-register/react";
import { TEKS } from "../lib/teks";

export function PwaStatusBar() {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (needRefresh) {
    return (
      <div className="pwa-toast" role="status" aria-live="polite">
        <span>{TEKS.pwaVersiBaru}</span>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            void updateServiceWorker(true);
          }}
        >
          {TEKS.pwaTombolPerbarui}
        </button>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div className="pwa-toast" role="status" aria-live="polite">
        <span>{TEKS.pwaSiapOffline}</span>
      </div>
    );
  }

  return null;
}
