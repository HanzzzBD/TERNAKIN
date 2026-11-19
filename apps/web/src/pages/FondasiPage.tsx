import { useState } from "react";
import { useNavigate } from "react-router";
import { kesehatanApiSchema } from "@ternakin/shared";
import { AppShell } from "../components/layout/AppShell";
import {
  ArrowRightIcon,
  Banner,
  Button,
  Card,
  FeedIcon,
  InstallIcon,
  RefreshIcon,
} from "../components/ui";
import { useOnlineStatus, usePwaInstall } from "../lib/pwa";
import { TEKS } from "../lib/teks";

type StatusServer = "diam" | "memuat" | "aktif" | "offline" | "galat";

export function FondasiPage() {
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
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
    <AppShell pageTitle="Beranda">
      <Card variant="warm">
        <p className="tk-eyebrow">{TEKS.eyebrowFondasi}</p>
        <h1
          style={{ fontSize: "var(--text-2xl)", lineHeight: 1.2, marginBottom: "var(--space-3)" }}
        >
          {TEKS.judulFondasi}
        </h1>
        <p className="tk-muted tk-prose">{TEKS.deskripsiFondasi}</p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            marginBottom: "var(--space-4)",
          }}
        >
          <Button
            variant="primary"
            iconStart={<FeedIcon size={20} />}
            iconEnd={<ArrowRightIcon size={18} />}
            onClick={() => {
              void navigate("/app/pakan");
            }}
          >
            {TEKS.tombolMulaiPakan}
          </Button>

          {!isStandalone ? (
            <Button
              variant="secondary"
              iconStart={<InstallIcon size={20} />}
              onClick={() => void handlePasang()}
            >
              {TEKS.tombolPasang}
            </Button>
          ) : (
            <Banner variant="success">{TEKS.sudahTerpasang}</Banner>
          )}

          <Button
            variant="secondary"
            iconStart={<RefreshIcon size={18} />}
            disabled={statusServer === "memuat" || !isOnline}
            onClick={() => void cekServer()}
          >
            {statusServer === "memuat" ? TEKS.cekServerMemuat : TEKS.tombolCekServer}
          </Button>
        </div>

        {!isStandalone && (
          <p className="tk-muted" style={{ fontSize: "var(--text-sm)", marginBottom: 0 }}>
            {TEKS.keteranganPasang}
          </p>
        )}

        {tampilPanduanPasang && !isStandalone && (
          <div style={{ marginTop: "var(--space-4)" }}>
            <Banner variant="info" title={TEKS.panduanIosJudul}>
              {isIos ? TEKS.panduanIosIsi : TEKS.panduanBrowserLain}
            </Banner>
          </div>
        )}

        {statusServer === "aktif" && (
          <div style={{ marginTop: "var(--space-4)" }}>
            <Banner variant="success">{TEKS.cekServerBerhasil}</Banner>
          </div>
        )}

        {statusServer === "offline" && (
          <div style={{ marginTop: "var(--space-4)" }}>
            <Banner variant="info">{TEKS.cekServerOffline}</Banner>
          </div>
        )}

        {statusServer === "galat" && (
          <div style={{ marginTop: "var(--space-4)" }}>
            <Banner variant="error">{TEKS.cekServerGagal}</Banner>
          </div>
        )}
      </Card>

      <Card>
        <p className="tk-muted tk-prose" style={{ marginBottom: 0 }}>
          {TEKS.catatanTahap}
        </p>
      </Card>
    </AppShell>
  );
}
