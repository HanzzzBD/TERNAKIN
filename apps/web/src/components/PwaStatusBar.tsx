import { useRegisterSW } from "virtual:pwa-register/react";
import { TEKS } from "../lib/teks";
import { Banner, Button } from "./ui";

export function PwaStatusBar() {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (needRefresh) {
    return (
      <Banner
        variant="success"
        action={
          <Button
            variant="secondary"
            onClick={() => {
              void updateServiceWorker(true);
            }}
          >
            {TEKS.pwaTombolPerbarui}
          </Button>
        }
      >
        {TEKS.pwaVersiBaru}
      </Banner>
    );
  }

  if (offlineReady) {
    return <Banner variant="success">{TEKS.pwaSiapOffline}</Banner>;
  }

  return null;
}
