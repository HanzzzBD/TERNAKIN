import { useState, type FormEvent } from "react";
import { Link, Navigate, useParams } from "react-router";
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
  ShieldCheckIcon,
} from "../components/ui";
import {
  PELUANG_INVESTASI,
  TEKS_INVESTASI,
  type PeluangInvestasi,
} from "../content/investasiContent";
import { tambahMinatTitip, useAkunDemo, useMinatTitip } from "../lib/akunDemo";
import "./InvestasiPage.css";

function parseRupiah(teks: string): number {
  const angka = Number(teks.replace(/[^\d]/g, ""));
  return Number.isFinite(angka) ? angka : 0;
}

function FormTitip({ peluang }: { peluang: PeluangInvestasi }) {
  const akun = useAkunDemo();
  const minat = useMinatTitip();
  const [nominalTeks, setNominalTeks] = useState("");
  const [pahamRisiko, setPahamRisiko] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [berhasil, setBerhasil] = useState<number | null>(null);

  const sisa = Math.max(0, peluang.kebutuhanModal - peluang.modalTerkumpul);
  const minatDiSini = minat
    .filter((m) => m.peluangId === peluang.id)
    .reduce((jml, m) => jml + m.nominal, 0);

  if (peluang.status === "menunggu-pemeriksaan") {
    return (
      <Card variant="warm">
        <h2 className="tk-inv-h2">Belum bisa didanai</h2>
        <p className="tk-muted tk-prose">
          Kandang ini menunggu pemeriksaan dokter hewan mitra. {TEKS_INVESTASI.syaratDibuka}
        </p>
      </Card>
    );
  }

  if (peluang.status === "dipelihara" || sisa === 0) {
    return (
      <Card variant="warm">
        <h2 className="tk-inv-h2">Modal sudah terpenuhi</h2>
        <p className="tk-muted tk-prose">
          Ayam sedang dipelihara. Pantau perkembangannya lewat data catatan harian di atas.
        </p>
      </Card>
    );
  }

  if (!akun) {
    return (
      <Card variant="warm" className="tk-inv-cta-card">
        <p className="tk-inv-cta-card__text">Masuk sebagai pengguna untuk mencoba titip modal.</p>
        <Link
          to={`/app/masuk?peran=pengguna&lanjut=/app/investasi/${peluang.id}`}
          className="tk-btn tk-btn--primary"
        >
          Masuk akun demo
        </Link>
      </Card>
    );
  }

  if (akun.peran !== "pengguna") {
    return (
      <Banner variant="info">
        Titip modal hanya untuk akun pengguna. Anda sedang masuk sebagai peternak.
      </Banner>
    );
  }

  const nominal = parseRupiah(nominalTeks);
  const porsiModal = nominal > 0 ? (nominal / peluang.kebutuhanModal) * 100 : 0;

  const handleKirim = (e: FormEvent) => {
    e.preventDefault();
    setBerhasil(null);
    if (nominal < peluang.minimalTitip) {
      setGalat(`Minimal titip ${formatRupiah(peluang.minimalTitip)}.`);
      return;
    }
    if (nominal > sisa) {
      setGalat(`Sisa kebutuhan modal kandang ini ${formatRupiah(sisa)}.`);
      return;
    }
    if (!pahamRisiko) {
      setGalat("Centang pernyataan risiko terlebih dahulu.");
      return;
    }
    tambahMinatTitip({ peluangId: peluang.id, nominal });
    setGalat(null);
    setBerhasil(nominal);
    setNominalTeks("");
    setPahamRisiko(false);
  };

  return (
    <Card className="tk-inv-titip">
      <h2 className="tk-inv-h2">Titip modal (simulasi)</h2>
      {minatDiSini > 0 && (
        <p className="tk-inv-titip__punya">
          <CheckIcon size={18} />
          Minat Anda di kandang ini: <strong className="tk-num">{formatRupiah(minatDiSini)}</strong>
        </p>
      )}
      <form onSubmit={handleKirim} className="tk-inv-form" noValidate>
        <Field
          id="titip-nominal"
          label="Nominal modal"
          hint={`Minimal ${formatRupiah(peluang.minimalTitip)}, sisa kebutuhan ${formatRupiah(sisa)}.`}
          error={galat ?? undefined}
        >
          <NumberInput
            id="titip-nominal"
            unit="rupiah"
            placeholder="500000"
            aria-describedby="titip-nominal-hint"
            value={nominalTeks}
            hasError={Boolean(galat)}
            onChange={(e) => setNominalTeks(e.target.value)}
          />
        </Field>

        {nominal > 0 && (
          <p className="tk-inv-porsi">
            Porsi modal Anda <strong className="tk-num">{formatAngka(porsiModal, 2)}%</strong>.
            Bagian Anda = {formatAngka(porsiModal, 2)}% × {peluang.porsiPemodalPersen}% × laba
            bersih siklus. Bila siklus rugi, modal yang kembali bisa berkurang.
          </p>
        )}

        <label className="tk-inv-check">
          <input
            type="checkbox"
            checked={pahamRisiko}
            onChange={(e) => setPahamRisiko(e.target.checked)}
          />
          <span>
            Saya memahami bahwa modal bisa berkurang atau habis, dan Ternakin tidak menjamin hasil.
          </span>
        </label>

        <Button type="submit" iconEnd={<ArrowRightIcon size={18} />}>
          Catat minat titip modal
        </Button>
      </form>

      {berhasil !== null && (
        <Banner variant="success">
          Minat {formatRupiah(berhasil)} tercatat (simulasi). Di versi rilis, Anda akan diarahkan ke
          penyelenggara urun dana berizin OJK untuk verifikasi identitas dan pembayaran. Ternakin
          tidak menerima uang Anda.
        </Banner>
      )}
    </Card>
  );
}

export function InvestasiDetailPage() {
  const { id } = useParams();
  const akun = useAkunDemo();
  const peluang = PELUANG_INVESTASI.find((p) => p.id === id);

  // Peternak hanya boleh melihat kandangnya sendiri, tidak bisa membuka atau mendanai kandang lain
  if (akun?.peran === "peternak" && id !== akun.peluangMilikId) {
    return <Navigate to="/app/peternak" replace />;
  }
  if (!peluang) return <Navigate to="/app/investasi" replace />;

  const milikSendiri = akun?.peran === "peternak";

  return (
    <AppShell pageTitle={milikSendiri ? "Kandang saya" : "Investasi ternak"}>
      {milikSendiri ? (
        <>
          <Link to="/app/peternak" className="tk-inv-back">
            ← Kandang saya
          </Link>
          <Banner variant="info">
            Ini tampilan kandang Anda seperti yang dilihat pengguna yang ingin menitipkan modal.
          </Banner>
        </>
      ) : (
        <Link to="/app/investasi" className="tk-inv-back">
          ← Semua peluang
        </Link>
      )}

      <ProfilPeternakan peluang={peluang} />
      <KartuPemeriksaan peluang={peluang} />
      <DataKandang peluang={peluang} />
      {!milikSendiri && <FormTitip peluang={peluang} />}

      <Card className="tk-inv-risk">
        <h2 className="tk-inv-h2">
          <AlertTriangleIcon size={22} /> Risiko yang perlu Anda pahami
        </h2>
        <ul className="tk-inv-list">
          {TEKS_INVESTASI.risiko.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="tk-inv-ojk">
          <ShieldCheckIcon size={18} />
          <span>{TEKS_INVESTASI.ojk}</span>
        </p>
      </Card>
    </AppShell>
  );
}
