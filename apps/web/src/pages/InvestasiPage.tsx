import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router";
import { formatRupiah } from "@ternakin/shared";
import { KartuPeluang } from "../components/investasi/PeluangUi";
import { AppShell } from "../components/layout/AppShell";
import { Banner, Button, Card, Field, MapPinIcon, ShieldCheckIcon } from "../components/ui";
import { LOKASI_PILIHAN, TEKS_INVESTASI, type LokasiPilihanId } from "../content/investasiContent";
import { hitungJarakKm } from "../lib/akunDemo";
import { useDaftarPeluang, useMinatSaya } from "../lib/investasi";
import { usePeranAktif } from "../lib/peran";
import "./InvestasiPage.css";

type Filter = "semua" | "dibuka";

interface Titik {
  lat: number;
  lng: number;
  label: string;
}

export function InvestasiPage() {
  const { peran } = usePeranAktif();
  const daftarPeluang = useDaftarPeluang();
  const minat = useMinatSaya(peran === "pengguna").data ?? [];
  const [lokasiId, setLokasiId] = useState<LokasiPilihanId>("kota-bandung");
  const [titikGps, setTitikGps] = useState<Titik | null>(null);
  const [pesanGps, setPesanGps] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("semua");

  const lokasiPilihan = LOKASI_PILIHAN.find((l) => l.id === lokasiId) ?? LOKASI_PILIHAN[0];
  const titikAsal: Titik = titikGps ?? lokasiPilihan;

  const daftar = useMemo(() => {
    return (daftarPeluang.data ?? [])
      .filter((p) => filter === "semua" || p.status === "dibuka")
      .map((p) => ({
        peluang: p,
        jarak: hitungJarakKm(titikAsal.lat, titikAsal.lng, p.lat, p.lng),
      }))
      .sort((a, b) => a.jarak - b.jarak);
  }, [daftarPeluang.data, filter, titikAsal.lat, titikAsal.lng]);

  const pakaiLokasiSaya = () => {
    if (!("geolocation" in navigator)) {
      setPesanGps("Peramban ini tidak mendukung lokasi. Pilih wilayah dari daftar.");
      return;
    }
    setPesanGps("Mencari lokasi Anda...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTitikGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Lokasi Anda" });
        setPesanGps(null);
      },
      () => setPesanGps("Lokasi tidak bisa dibaca. Pilih wilayah dari daftar."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    );
  };

  const totalMinat = minat.reduce((jml, m) => jml + m.nominal, 0);

  // Peternak tidak melihat peluang peternak lain; menu Investasi membuka profil peternakannya
  if (peran === "peternak") return <Navigate to="/app/peternak" replace />;

  return (
    <AppShell pageTitle="Investasi ternak">
      <Card variant="warm" className="tk-inv-hero">
        <p className="tk-eyebrow">{TEKS_INVESTASI.labelModul}</p>
        <h1 className="tk-inv-title">Peluang ayam pedaging di dekat Anda</h1>
        <p className="tk-muted tk-prose">
          Titipkan modal ke peternak sekitar. Modal menjadi ayam yang dipelihara, lalu Anda menerima
          bagian laba saat ayam dipanen dan dijual.
        </p>
        <p className="tk-inv-ojk">
          <ShieldCheckIcon size={18} />
          <span>{TEKS_INVESTASI.ojk}</span>
        </p>
      </Card>

      <Banner variant="info">{TEKS_INVESTASI.catatanPrototipe}</Banner>

      {peran === "tamu" && (
        <Card className="tk-inv-cta-card">
          <p className="tk-inv-cta-card__text">
            Anda bisa melihat semua peluang tanpa akun. Untuk mencatat minat titip modal, masuk
            sebagai Pengguna.
          </p>
          <Link to="/app/masuk?peran=pengguna" className="tk-btn tk-btn--primary">
            Masuk sebagai Pengguna
          </Link>
        </Card>
      )}

      {peran === "pengguna" && minat.length > 0 && (
        <Card className="tk-inv-minat">
          <h2 className="tk-inv-h2">Minat titip modal Anda</h2>
          <ul className="tk-inv-minat__list">
            {minat.map((m) => (
              <li key={m.id}>
                <Link to={`/app/investasi/${m.peluangId}`}>{m.namaKandang}</Link>
                <span className="tk-num">{formatRupiah(m.nominal)}</span>
              </li>
            ))}
          </ul>
          <p className="tk-inv-minat__total">
            Total minat (simulasi): <strong className="tk-num">{formatRupiah(totalMinat)}</strong>
          </p>
        </Card>
      )}

      <Card className="tk-inv-lokasi">
        <Field id="inv-lokasi" label="Cari peternak di sekitar">
          <select
            id="inv-lokasi"
            className="tk-input"
            value={titikGps ? "" : lokasiId}
            onChange={(e) => {
              setTitikGps(null);
              setLokasiId(e.target.value as LokasiPilihanId);
            }}
          >
            {titikGps && <option value="">Lokasi Anda saat ini</option>}
            {LOKASI_PILIHAN.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Button variant="secondary" iconStart={<MapPinIcon size={18} />} onClick={pakaiLokasiSaya}>
          Gunakan lokasi saya
        </Button>
        {pesanGps && (
          <p className="tk-inv-gps" role="status">
            {pesanGps}
          </p>
        )}
      </Card>

      <h2 className="tk-inv-h2 tk-inv-list-title">Kandang di sekitar Anda</h2>
      <div className="tk-inv-filter" role="group" aria-label="Saring peluang">
        {(
          [
            ["semua", "Semua kandang"],
            ["dibuka", "Dibuka untuk modal"],
          ] as const
        ).map(([nilai, label]) => (
          <button
            key={nilai}
            type="button"
            className="tk-inv-filter__btn"
            aria-pressed={filter === nilai}
            onClick={() => setFilter(nilai)}
          >
            {label}
          </button>
        ))}
        <span className="tk-inv-filter__count" role="status">
          {daftar.length} kandang, terdekat dari {titikAsal.label}
        </span>
      </div>

      {daftarPeluang.galat && <Banner variant="offline">{daftarPeluang.galat}</Banner>}
      {daftarPeluang.sedangMuat && !daftarPeluang.data && (
        <p className="tk-muted" role="status">
          Memuat peluang...
        </p>
      )}

      <div className="tk-inv-grid">
        {daftar.map(({ peluang, jarak }) => (
          <KartuPeluang key={peluang.id} peluang={peluang} jarakKm={jarak} />
        ))}
      </div>

      <p className="tk-inv-footnote">{TEKS_INVESTASI.syaratDibuka}</p>
    </AppShell>
  );
}
