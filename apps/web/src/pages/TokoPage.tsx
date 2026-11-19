import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  formatAngka,
  formatRupiah,
  formatUmurHarga,
  rankStores,
  type PakanHitungLayak,
  type Toko,
  type TokoTerurut,
} from "@ternakin/shared";
import { AppShell } from "../components/layout/AppShell";
import {
  ArrowRightIcon,
  Badge,
  Banner,
  Button,
  Card,
  FeedIcon,
  RefreshIcon,
  Skeleton,
  WhatsAppIcon,
} from "../components/ui";
import { db, getSavedSrcParam } from "../db/db";
import { catatLeadLokal, useSyncStatus } from "../db/sync";
import { muatDaftarToko } from "../lib/toko";
import { buatTautanWhatsAppToko } from "../lib/wa";
import "./TokoPage.css";

export function TokoPage() {
  const navigate = useNavigate();
  const { isOnline } = useSyncStatus();

  const [tokoList, setTokoList] = useState<Toko[]>([]);
  const [staleDays, setStaleDays] = useState(7);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [dariCache, setDariCache] = useState(false);
  const [memuat, setMemuat] = useState(true);

  const [komposisiAktif, setKomposisiAktif] = useState<PakanHitungLayak | null>(null);
  const [pesanLead, setPesanLead] = useState<string | null>(null);

  useEffect(() => {
    let aktif = true;

    void db.komposisi
      .get("terakhir")
      .then((tersimpan) => {
        if (aktif && tersimpan) {
          setKomposisiAktif(tersimpan.hasil);
        }
      })
      .catch(() => {});

    void muatDaftarToko(isOnline).then((res) => {
      if (!aktif) return;
      setTokoList(res.toko);
      setStaleDays(res.staleDays);
      setFetchedAt(res.fetchedAt);
      setDariCache(res.dariCache);
      setMemuat(false);
    });

    return () => {
      aktif = false;
    };
  }, [isOnline]);

  const muatUlang = async () => {
    setMemuat(true);
    const res = await muatDaftarToko(isOnline);
    setTokoList(res.toko);
    setStaleDays(res.staleDays);
    setFetchedAt(res.fetchedAt);
    setDariCache(res.dariCache);
    setMemuat(false);
  };

  const tokoTerurut = useMemo<TokoTerurut[]>(() => {
    const komposisi =
      komposisiAktif?.komposisi.map((k) => ({
        bahanId: k.bahanId,
        nama: k.nama,
        kgPer100Kg: k.kgPer100Kg,
      })) ?? [];

    return rankStores({
      tokoList,
      komposisi,
      staleDays,
    });
  }, [tokoList, komposisiAktif, staleDays]);

  const handleHubungi = (toko: TokoTerurut) => {
    // Pencatatan lead tidak pernah menahan pembukaan WhatsApp; bila offline masuk antrean outbox.
    void catatLeadLokal(toko.id);
    setPesanLead(
      navigator.onLine
        ? `Rujukan ke ${toko.nama} dicatat.`
        : `Rujukan ke ${toko.nama} masuk antrean offline dan akan dikirim saat sinyal kembali.`,
    );
  };

  const adaDataContoh = tokoTerurut.some((t) => t.isDemo);
  const srcKode = getSavedSrcParam();

  return (
    <AppShell pageTitle="Toko pakan">
      <Card variant="warm">
        <p className="tk-eyebrow">RUJUKAN TOKO · URUTAN MURNI DARI BIAYA</p>
        <h1 className="tk-pakan-h1">Tahu belinya di mana.</h1>
        <p className="tk-muted tk-prose" style={{ marginBottom: 0 }}>
          Urutan toko dihitung murni dari total biaya pakan untuk campuran Anda, bukan dari komisi.
          Status mitra, asal harga, dan waktu pembaruan selalu ditampilkan terbuka.
        </p>
      </Card>

      {adaDataContoh && (
        <Banner variant="info" title="Data contoh">
          Daftar toko dan harga di bawah adalah data contoh Bandung Raya tanpa nomor telepon nyata
          sampai diganti data hasil verifikasi lapangan tim.
        </Banner>
      )}

      {!komposisiAktif && !memuat && (
        <Banner
          variant="info"
          title="Belum ada campuran terpilih"
          action={
            <Button
              variant="secondary"
              iconStart={<FeedIcon size={18} />}
              iconEnd={<ArrowRightIcon size={18} />}
              onClick={() => {
                void navigate("/app/pakan");
              }}
            >
              Hitung pakan dulu
            </Button>
          }
        >
          Daftar toko saat ini diurutkan menurut abjad. Hitung campuran pakan terlebih dahulu untuk
          melihat urutan berdasarkan total biaya termurah.
        </Banner>
      )}

      {komposisiAktif && (
        <Banner
          variant="success"
          title={`Diurutkan untuk campuran fase ${komposisiAktif.fase} (100 kg)`}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                void navigate("/app/pakan");
              }}
            >
              Ubah campuran
            </Button>
          }
        >
          Toko dengan total biaya campuran termurah berada di urutan teratas.
        </Banner>
      )}

      {dariCache && fetchedAt && (
        <Banner variant="offline">
          Menampilkan harga terakhir yang tersimpan di perangkat (diambil{" "}
          {new Date(fetchedAt).toLocaleString("id-ID")}).
        </Banner>
      )}

      {pesanLead && <Banner variant="success">{pesanLead}</Banner>}

      {memuat && (
        <Card>
          <div
            className="tk-pakan-stack"
            role="status"
            aria-busy="true"
            aria-label="Memuat daftar toko"
          >
            <Skeleton variant="title" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
        </Card>
      )}

      {!memuat && tokoTerurut.length === 0 && (
        <Card>
          <p className="tk-muted tk-prose">
            Belum ada data toko yang tersimpan di perangkat. Hubungkan sinyal lalu muat ulang.
          </p>
          <Button
            variant="secondary"
            iconStart={<RefreshIcon size={18} />}
            onClick={() => void muatUlang()}
          >
            Muat ulang daftar toko
          </Button>
        </Card>
      )}

      {!memuat && tokoTerurut.length > 0 && (
        <div className="tk-toko-list">
          {tokoTerurut.map((toko, idx) => {
            const waUrl = buatTautanWhatsAppToko(toko, srcKode);
            return (
              <Card key={toko.id} as="article" className="tk-toko-card">
                <div className="tk-toko-head">
                  <div className="tk-toko-title-wrap">
                    {komposisiAktif && toko.lengkap && (
                      <span className="tk-toko-rank tk-tabular" aria-label={`Urutan ${idx + 1}`}>
                        #{idx + 1}
                      </span>
                    )}
                    <div>
                      <h2 className="tk-toko-nama">{toko.nama}</h2>
                      <p className="tk-toko-area">{toko.area}</p>
                    </div>
                  </div>
                </div>

                <div className="tk-toko-badges">
                  <Badge
                    variant={toko.statusMitra ? "mitra" : "offline"}
                    label={toko.statusMitra ? "Toko mitra" : "Bukan mitra"}
                  />
                  {toko.isDemo && <Badge variant="usang" label="Data contoh" />}
                  {toko.hasHargaUsang && <Badge variant="usang" label="Usang" />}
                </div>

                {komposisiAktif && toko.lengkap && toko.totalBiayaPer100Kg !== null && (
                  <div className="tk-toko-biaya">
                    <div>
                      <div className="tk-toko-biaya__sub">Total campuran 100 kg</div>
                      <div className="tk-toko-biaya__utama tk-tabular">
                        {formatRupiah(toko.totalBiayaPer100Kg)}
                      </div>
                    </div>
                    <div className="tk-toko-biaya__sub tk-tabular">
                      <strong>{formatRupiah(toko.biayaPerKg ?? 0)}</strong> / kg
                    </div>
                  </div>
                )}

                {komposisiAktif && !toko.lengkap && toko.bahanKurang.length > 0 && (
                  <Banner variant="info">
                    Belum mencatat harga untuk: {toko.bahanKurang.join(", ")}.
                  </Banner>
                )}

                <ul className="tk-toko-rincian">
                  {toko.rincianHarga.map((item) => (
                    <li key={item.bahanId} className="tk-toko-rincian__row tk-tabular">
                      <span>
                        {item.namaBahan}
                        {item.kgPer100Kg > 0 ? ` (${formatAngka(item.kgPer100Kg, 1)} kg)` : ""}
                        {item.isUsang ? " · Usang" : ""}
                      </span>
                      <strong>{formatRupiah(item.hargaPerKg)}/kg</strong>
                    </li>
                  ))}
                </ul>

                <div className="tk-toko-meta">
                  <span>Asal harga: {toko.asalHargaRingkas}</span>
                  <span>Diperbarui: {formatUmurHarga(toko.umurHariTertua)}</span>
                </div>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tk-btn tk-btn--secondary tk-btn--full tk-toko-wa-link"
                  onClick={() => handleHubungi(toko)}
                >
                  <span className="tk-btn__icon">
                    <WhatsAppIcon size={20} />
                  </span>
                  <span>Hubungi lewat WhatsApp</span>
                </a>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
