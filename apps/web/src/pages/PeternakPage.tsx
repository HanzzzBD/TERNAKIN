import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { formatAngka, formatRupiah } from "@ternakin/shared";
import {
  DataKandang,
  KartuPemeriksaan,
  ProfilPeternakan,
} from "../components/investasi/KandangDetail";
import { AppShell } from "../components/layout/AppShell";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  Banner,
  Button,
  Card,
  CheckIcon,
  Field,
  NumberInput,
  StethoscopeIcon,
  TextInput,
} from "../components/ui";
import { PELUANG_INVESTASI, TEKS_INVESTASI } from "../content/investasiContent";
import {
  aturIzinDataPeternak,
  tambahAjuanPeluang,
  useAjuanPeluang,
  useAkunDemo,
  useIzinDataPeternak,
} from "../lib/akunDemo";
import "./InvestasiPage.css";

/** Perkiraan kasar biaya per ekor ayam pedaging sampai panen (contoh, untuk saran isian). */
const BIAYA_PER_EKOR_CONTOH = 32_000;

function angkaDari(teks: string): number {
  const n = Number(teks.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function PeternakPage() {
  const akun = useAkunDemo();
  const izinData = useIzinDataPeternak();
  const ajuan = useAjuanPeluang();

  const [ekorTeks, setEkorTeks] = useState("");
  const [modalTeks, setModalTeks] = useState("");
  const [porsiTeks, setPorsiTeks] = useState("60");
  const [mulai, setMulai] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [terkirim, setTerkirim] = useState(false);

  if (!akun || akun.peran !== "peternak") {
    return <Navigate to="/app/masuk?peran=peternak&lanjut=/app/peternak" replace />;
  }

  const peluangSaya = PELUANG_INVESTASI.find((p) => p.id === akun.peluangMilikId);
  const ekor = angkaDari(ekorTeks);
  const saranModal = ekor * BIAYA_PER_EKOR_CONTOH;

  const handleAjukan = (e: FormEvent) => {
    e.preventDefault();
    setTerkirim(false);
    const modal = angkaDari(modalTeks);
    const porsi = angkaDari(porsiTeks);
    if (ekor < 100) return setGalat("Jumlah ayam minimal 100 ekor.");
    if (modal < 1_000_000) return setGalat("Kebutuhan modal minimal Rp 1.000.000.");
    if (porsi < 30 || porsi > 80) return setGalat("Porsi pemodal antara 30% dan 80% dari laba.");
    if (!mulai) return setGalat("Isi rencana tanggal mulai pemeliharaan.");
    if (!izinData)
      return setGalat("Izinkan data catatan harian ditampilkan agar peluang bisa diajukan.");
    tambahAjuanPeluang({
      jumlahEkor: ekor,
      kebutuhanModal: modal,
      porsiPemodalPersen: porsi,
      rencanaMulai: mulai,
    });
    setGalat(null);
    setTerkirim(true);
    setEkorTeks("");
    setModalTeks("");
    setMulai("");
  };

  const syarat = [
    { label: "Profil kandang lengkap", ok: true },
    { label: "Catatan harian minimal 14 hari terakhir", ok: true },
    { label: "Izin data catatan harian ditampilkan", ok: izinData },
    { label: "Diperiksa dokter hewan mitra (wajib)", ok: Boolean(peluangSaya?.pemeriksaan) },
  ];

  return (
    <AppShell pageTitle="Kandang saya">
      <Card variant="warm" className="tk-inv-hero">
        <p className="tk-eyebrow">{TEKS_INVESTASI.labelModul}</p>
        <h1 className="tk-inv-title">Halo, {akun.nama}</h1>
        <p className="tk-muted tk-prose">
          Ini profil peternakan Anda. Pengguna di sekitar melihat kandang, hasil pemeriksaan dokter
          hewan, dan data catatan harian di bawah ini sebelum menitipkan modal.
        </p>
      </Card>

      <Banner variant="info">{TEKS_INVESTASI.catatanPrototipe}</Banner>

      {peluangSaya && (
        <>
          <section aria-labelledby="judul-profil-peternakan" className="tk-peternak-profil">
            <div className="tk-peternak-profil__head">
              <h2 id="judul-profil-peternakan" className="tk-inv-h2">
                Profil peternakan
              </h2>
              <Link to={`/app/investasi/${peluangSaya.id}`} className="tk-inv-textlink">
                Lihat seperti yang dilihat pengguna <ArrowRightIcon size={16} />
              </Link>
            </div>
            <ProfilPeternakan peluang={peluangSaya} judulLevel={2} />
          </section>
          <KartuPemeriksaan peluang={peluangSaya} />
          <DataKandang peluang={peluangSaya} sudutPeternak />
        </>
      )}

      <Card>
        <h2 className="tk-inv-h2">Izin tampilkan data kandang</h2>
        <label className="tk-inv-switch">
          <input
            type="checkbox"
            role="switch"
            checked={izinData}
            onChange={(e) => aturIzinDataPeternak(e.target.checked)}
          />
          <span className="tk-inv-switch__track" aria-hidden="true" />
          <span>
            Izinkan bobot, pakan, dan angka kematian dari catatan harian ditampilkan ke pengguna
          </span>
        </label>
        <p className="tk-inv-footnote">
          Nama lengkap, nomor telepon, dan alamat persis tidak pernah ditampilkan. Izin bisa dicabut
          kapan saja.
        </p>
      </Card>

      <Card>
        <h2 className="tk-inv-h2">Syarat peluang dibuka</h2>
        <ul className="tk-inv-checklist">
          {syarat.map((s) => (
            <li key={s.label} className={s.ok ? "is-ok" : "is-belum"}>
              <span className="tk-inv-checklist__icon" aria-hidden="true">
                {s.ok ? <CheckIcon size={16} /> : <AlertTriangleIcon size={16} />}
              </span>
              <span>
                {s.label}
                <span className="tk-sr-only">{s.ok ? " — terpenuhi" : " — belum"}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="tk-inv-h2">Ajukan peluang siklus berikutnya</h2>
        <form className="tk-inv-form" onSubmit={handleAjukan} noValidate>
          <Field id="ajuan-ekor" label="Jumlah ayam pedaging (DOC)" required>
            <NumberInput
              id="ajuan-ekor"
              unit="ekor"
              value={ekorTeks}
              onChange={(e) => setEkorTeks(e.target.value)}
            />
          </Field>
          <Field
            id="ajuan-modal"
            label="Kebutuhan modal"
            hint={
              ekor > 0
                ? `Saran kasar: ${formatRupiah(saranModal)} (± ${formatRupiah(BIAYA_PER_EKOR_CONTOH)} per ekor sampai panen, angka contoh).`
                : "Bibit, pakan, obat, dan listrik sampai panen."
            }
            required
          >
            <NumberInput
              id="ajuan-modal"
              unit="rupiah"
              aria-describedby="ajuan-modal-hint"
              value={modalTeks}
              onChange={(e) => setModalTeks(e.target.value)}
            />
          </Field>
          <Field
            id="ajuan-porsi"
            label="Porsi laba bersih untuk pemodal"
            hint="Sisanya untuk Anda sebagai pengelola kandang."
            required
          >
            <NumberInput
              id="ajuan-porsi"
              unit="%"
              aria-describedby="ajuan-porsi-hint"
              value={porsiTeks}
              onChange={(e) => setPorsiTeks(e.target.value)}
            />
          </Field>
          <Field id="ajuan-mulai" label="Rencana mulai pelihara" required>
            <TextInput
              id="ajuan-mulai"
              type="date"
              value={mulai}
              onChange={(e) => setMulai(e.target.value)}
            />
          </Field>
          {galat && <Banner variant="error">{galat}</Banner>}
          <Button type="submit" iconEnd={<ArrowRightIcon size={18} />}>
            Ajukan peluang
          </Button>
        </form>
        {terkirim && (
          <Banner variant="success">
            Ajuan terkirim (simulasi). Tim akan menjadwalkan pemeriksaan dokter hewan mitra lewat
            WhatsApp sebelum peluang dibuka untuk modal.
          </Banner>
        )}
      </Card>

      {ajuan.length > 0 && (
        <Card>
          <h2 className="tk-inv-h2">Ajuan Anda</h2>
          <ul className="tk-inv-ajuan">
            {ajuan.map((a) => (
              <li key={a.id}>
                <div>
                  <strong className="tk-num">{formatAngka(a.jumlahEkor, 0)} ekor</strong> ·{" "}
                  <span className="tk-num">{formatRupiah(a.kebutuhanModal)}</span> ·{" "}
                  {a.porsiPemodalPersen}% pemodal
                  <p className="tk-inv-footnote">Mulai {a.rencanaMulai}</p>
                </div>
                <span className="tk-inv-status tk-inv-status--menunggu-pemeriksaan">
                  <StethoscopeIcon size={14} /> Menunggu pemeriksaan
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AppShell>
  );
}
