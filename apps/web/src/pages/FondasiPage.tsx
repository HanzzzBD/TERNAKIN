import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { evaluateAlerts, kesehatanApiSchema, type DataReferensi } from "@ternakin/shared";
import { AppShell } from "../components/layout/AppShell";
import {
  ArrowRightIcon,
  Badge,
  Banner,
  Button,
  Card,
  ChatIcon,
  ClipboardIcon,
  FeedIcon,
  InstallIcon,
  KokokMascot,
  RefreshIcon,
  UrgencyChip,
} from "../components/ui";
import { db, type CatatanLokal, type KandangLokal } from "../db/db";
import { flushOutbox, useSyncStatus } from "../db/sync";
import { usePwaInstall } from "../lib/pwa";
import { muatReferensiPakan } from "../lib/referensi";
import { TEKS } from "../lib/teks";

type StatusServer = "diam" | "memuat" | "aktif" | "offline" | "galat";

function tanggalHariIni(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function FondasiPage() {
  const { isOnline, pendingCount, isSyncing } = useSyncStatus();
  const navigate = useNavigate();
  const { bisaPasangLangsung, isStandalone, isIos, pasangSekarang } = usePwaInstall();
  const [statusServer, setStatusServer] = useState<StatusServer>("diam");
  const [tampilPanduanPasang, setTampilPanduanPasang] = useState(false);

  const [kandang, setKandang] = useState<KandangLokal | null>(null);
  const [catatanList, setCatatanList] = useState<CatatanLokal[]>([]);
  const [referensi, setReferensi] = useState<DataReferensi | null>(null);

  useEffect(() => {
    let aktif = true;
    const muatRingkasan = async () => {
      try {
        const semuaKandang = await db.kandang.toArray();
        const k = semuaKandang.sort((a, b) => b.diubahPada.localeCompare(a.diubahPada))[0] ?? null;
        if (!aktif) return;
        setKandang(k);
        if (k) {
          const semuaCatatan = await db.catatan.where("kandangId").equals(k.id).toArray();
          if (!aktif) return;
          setCatatanList(semuaCatatan.filter((c) => !c.dihapusPada));
        } else {
          setCatatanList([]);
        }
      } catch {
        // Abaikan bila IndexedDB tidak tersedia
      }
    };

    void muatRingkasan();
    void muatReferensiPakan(isOnline).then(({ data }) => {
      if (aktif && data) setReferensi(data);
    });

    const onSync = () => {
      void muatRingkasan();
    };
    window.addEventListener("tk:sync-change", onSync);
    return () => {
      aktif = false;
      window.removeEventListener("tk:sync-change", onSync);
    };
  }, [isOnline]);

  const catatanHariIniSudah = useMemo(() => {
    const hariIni = tanggalHariIni();
    return catatanList.some((c) => c.tanggal === hariIni);
  }, [catatanList]);

  const peringatanAktif = useMemo(() => {
    if (!kandang || !referensi) return [];
    return evaluateAlerts(catatanList, kandang, referensi.ambangPeringatan);
  }, [catatanList, kandang, referensi]);

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
        <p className="tk-eyebrow">
          HARI INI · {kandang ? kandang.nama.toUpperCase() : "MODE TAMU"}
        </p>
        <h1
          style={{ fontSize: "var(--text-2xl)", lineHeight: 1.2, marginBottom: "var(--space-3)" }}
        >
          {TEKS.judulFondasi}
        </h1>
        <p className="tk-muted tk-prose">{TEKS.deskripsiFondasi}</p>

        <div style={{ marginBottom: "var(--space-4)" }}>
          <KokokMascot size="md" interactive />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-2)",
            marginBottom: "var(--space-4)",
          }}
        >
          <Badge
            variant={catatanHariIniSudah ? "solver" : "usang"}
            label={
              catatanHariIniSudah ? "Catatan hari ini sudah diisi" : "Catatan hari ini belum diisi"
            }
          />
          {pendingCount > 0 && (
            <Badge variant="offline" label={`${pendingCount} perubahan menunggu dikirim`} />
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            marginBottom: "var(--space-3)",
          }}
        >
          <Button
            variant="primary"
            iconStart={<ClipboardIcon size={20} />}
            iconEnd={<ArrowRightIcon size={18} />}
            onClick={() => {
              void navigate("/app/catatan");
            }}
          >
            Catat hari ini
          </Button>

          <Button
            variant="secondary"
            iconStart={<FeedIcon size={20} />}
            onClick={() => {
              void navigate("/app/pakan");
            }}
          >
            Hitung pakan
          </Button>

          <Button
            variant="secondary"
            iconStart={<ChatIcon size={20} />}
            onClick={() => {
              void navigate("/app/tanya");
            }}
          >
            Tanya Kokok
          </Button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <Button
            variant="ghost"
            onClick={() => {
              void navigate("/app/profil");
            }}
          >
            {kandang ? "Ubah profil kandang & hapus data" : "Atur profil kandang"}
          </Button>

          {pendingCount > 0 && isOnline && (
            <Button
              variant="secondary"
              iconStart={<RefreshIcon size={18} />}
              disabled={isSyncing}
              onClick={() => void flushOutbox()}
            >
              {isSyncing ? "Menyinkron..." : "Kirim sekarang"}
            </Button>
          )}
        </div>
      </Card>

      {peringatanAktif.length > 0 && (
        <Card variant="danger">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-2)",
              marginBottom: "var(--space-2)",
            }}
          >
            <strong>Peringatan aktif ({peringatanAktif.length})</strong>
            <UrgencyChip urgency={peringatanAktif[0]?.tingkat ?? "sedang"} />
          </div>
          <p className="tk-prose" style={{ marginBottom: "var(--space-3)" }}>
            {peringatanAktif[0]?.alasan}
          </p>
          <Button
            variant="secondary"
            iconEnd={<ArrowRightIcon size={18} />}
            onClick={() => {
              void navigate("/app/catatan");
            }}
          >
            Lihat detail peringatan
          </Button>
        </Card>
      )}

      <Card>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            marginBottom: "var(--space-3)",
          }}
        >
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
    </AppShell>
  );
}
