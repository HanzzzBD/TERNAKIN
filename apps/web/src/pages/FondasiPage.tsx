import { useState } from "react";
import { kesehatanApiSchema } from "@ternakin/shared";
import { PwaStatusBar } from "../components/PwaStatusBar";
import { useOnlineStatus, usePwaInstall } from "../lib/pwa";
import { TEKS } from "../lib/teks";

type StatusServer = "diam" | "memuat" | "aktif" | "offline" | "galat";

export function FondasiPage() {
  const isOnline = useOnlineStatus();
  const { bisaPasangLangsung, isStandalone, isIos, pasangSekarang } = usePwaInstall();
  const [statusServer, setStatusServer] = useState<StatusServer>("diam");
  const [tampilPanduanPasang, setTampilPanduanPasang] = useState(false);

  const cekServer = async () => {
    if (!isOnline) {
      setStatusServer("offline");
      return;
    }

    setStatusServer("memuat");
    try {
      const respons = await fetch("/health", { cache: "no-store" });
      if (!respons.ok) {
        setStatusServer("galat");
        return;
      }
      const data: unknown = await respons.json();
      const valid = kesehatanApiSchema.safeParse(data);
      setStatusServer(valid.success ? "aktif" : "galat");
    } catch {
      setStatusServer(navigator.onLine ? "galat" : "offline");
    }
  };

  const handlePasang = async () => {
    if (bisaPasangLangsung) {
      await pasangSekarang();
      return;
    }
    setTampilPanduanPasang((sebelum) => !sebelum);
  };

  return (
    <div className="fondasi-shell">
      <a href="#konten-utama" className="skip-link">
        {TEKS.lewatiKeKonten}
      </a>

      <header className="fondasi-header">
        <p className="wordmark">
          {TEKS.namaAplikasi}
          <span className="wordmark-dot" aria-hidden="true">
            .
          </span>
        </p>

        <span
          className={`status-chip ${isOnline ? "status-chip--online" : "status-chip--offline"}`}
          role="status"
          aria-live="polite"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            {isOnline ? (
              <circle cx="8" cy="8" r="6" fill="currentColor" />
            ) : (
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            )}
          </svg>
          {isOnline ? TEKS.statusOnline : TEKS.statusOffline}
        </span>
      </header>

      <PwaStatusBar />

      {!isOnline && (
        <div className="offline-banner" role="alert">
          {TEKS.bannerOffline}
        </div>
      )}

      <main id="konten-utama">
        <section className="card card--warm">
          <p className="eyebrow">{TEKS.eyebrowFondasi}</p>
          <h1 className="heading">{TEKS.judulFondasi}</h1>
          <p className="muted">{TEKS.deskripsiFondasi}</p>

          <div className="actions">
            {!isStandalone ? (
              <button type="button" className="btn-primary" onClick={() => void handlePasang()}>
                {TEKS.tombolPasang}
              </button>
            ) : (
              <div className="status-box status-box--ok">{TEKS.sudahTerpasang}</div>
            )}

            <button
              type="button"
              className="btn-secondary"
              disabled={statusServer === "memuat" || !isOnline}
              onClick={() => void cekServer()}
            >
              {statusServer === "memuat" ? TEKS.cekServerMemuat : TEKS.tombolCekServer}
            </button>
          </div>

          {!isStandalone && <p className="muted">{TEKS.keteranganPasang}</p>}

          {tampilPanduanPasang && !isStandalone && (
            <div
              className="status-box status-box--info"
              role="region"
              aria-label={TEKS.panduanIosJudul}
            >
              <strong>{TEKS.panduanIosJudul}</strong>
              <p>{isIos ? TEKS.panduanIosIsi : TEKS.panduanBrowserLain}</p>
            </div>
          )}

          {statusServer === "aktif" && (
            <div className="status-box status-box--ok" role="status">
              {TEKS.cekServerBerhasil}
            </div>
          )}

          {statusServer === "offline" && (
            <div className="status-box status-box--info" role="status">
              {TEKS.cekServerOffline}
            </div>
          )}

          {statusServer === "galat" && (
            <div className="status-box status-box--error" role="alert">
              {TEKS.cekServerGagal}
            </div>
          )}
        </section>

        <section className="card">
          <p className="muted">{TEKS.catatanTahap}</p>
        </section>
      </main>
    </div>
  );
}
