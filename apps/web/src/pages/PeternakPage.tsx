import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { formatAngka, formatRupiah, type PeluangInvestasi } from "@ternakin/shared";
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
import { LOKASI_PILIHAN, TEKS_INVESTASI, type LokasiPilihanId } from "../content/investasiContent";
import { GalatAkun } from "../lib/akun";
import { ajukanPeluang, aturIzinDataPeluang, useDaftarPeluang } from "../lib/investasi";
import { namaTampil, usePeranAktif } from "../lib/peran";
import "./InvestasiPage.css";

/** Perkiraan kasar biaya per ekor ayam pedaging sampai panen (contoh, untuk saran isian). */
const BIAYA_PER_EKOR_CONTOH = 32_000;

function angkaDari(teks: string): number {
  const n = Number(teks.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function pesanDari(err: unknown): string {
  return err instanceof GalatAkun ? err.message : "Terjadi kendala. Coba lagi sebentar lagi.";
}

function IzinData({ peluang }: { peluang: PeluangInvestasi }) {
  const [galat, setGalat] = useState<string | null>(null);
  const [sedang, setSedang] = useState(false);

  const ubah = async (izin: boolean) => {
    setGalat(null);
    setSedang(true);
    try {
      await aturIzinDataPeluang(peluang.id, izin);
    } catch (err) {
      setGalat(pesanDari(err));
    } finally {
      setSedang(false);
    }
  };

  return (
    <Card>
      <h2 className="tk-inv-h2">Izin tampilkan data kandang</h2>
      <label className="tk-inv-switch">
        <input
          type="checkbox"
          role="switch"
          checked={peluang.izinData}
          disabled={sedang}
          onChange={(e) => void ubah(e.target.checked)}
        />
        <span className="tk-inv-switch__track" aria-hidden="true" />
        <span>
          Izinkan bobot, pakan, dan angka kematian dari catatan harian ditampilkan ke pengguna
        </span>
      </label>
      {galat && <Banner variant="error">{galat}</Banner>}
      <p className="tk-inv-footnote">
        Nama lengkap, nomor telepon, dan alamat persis tidak pernah ditampilkan. Izin bisa dicabut
        kapan saja.
      </p>
    </Card>
  );
}

function FormAjuan({ namaAwal }: { namaAwal: string }) {
  const [namaPeternak, setNamaPeternak] = useState(namaAwal);
  const [namaKandang, setNamaKandang] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [wilayahId, setWilayahId] = useState<LokasiPilihanId>("kab-bandung");
  const [pengalamanTeks, setPengalamanTeks] = useState("");
  const [ekorTeks, setEkorTeks] = useState("");
  const [modalTeks, setModalTeks] = useState("");
  const [porsiTeks, setPorsiTeks] = useState("60");
  const [mulai, setMulai] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [terkirim, setTerkirim] = useState(false);
  const [sedang, setSedang] = useState(false);

  const ekor = angkaDari(ekorTeks);
  const saranModal = ekor * BIAYA_PER_EKOR_CONTOH;

  const handleAjukan = async (e: FormEvent) => {
    e.preventDefault();
    setTerkirim(false);
    const modal = angkaDari(modalTeks);
    const porsi = angkaDari(porsiTeks);
    const wilayah = LOKASI_PILIHAN.find((l) => l.id === wilayahId) ?? LOKASI_PILIHAN[0];
    if (namaPeternak.trim().length < 2) return setGalat("Isi nama panggilan Anda, mis. Pak Dedi.");
    if (namaKandang.trim().length < 3) return setGalat("Isi nama kandang.");
    if (kecamatan.trim().length < 3) return setGalat("Isi kecamatan lokasi kandang.");
    if (ekor < 100) return setGalat("Jumlah ayam minimal 100 ekor.");
    if (modal < 1_000_000) return setGalat("Kebutuhan modal minimal Rp 1.000.000.");
    if (porsi < 30 || porsi > 80) return setGalat("Porsi pemodal antara 30% dan 80% dari laba.");
    if (!mulai) return setGalat("Isi rencana tanggal mulai pemeliharaan.");

    setSedang(true);
    try {
      await ajukanPeluang({
        namaPeternak: namaPeternak.trim(),
        namaKandang: namaKandang.trim(),
        kecamatan: kecamatan.trim(),
        wilayah: wilayah.label,
        lat: wilayah.lat,
        lng: wilayah.lng,
        pengalamanTahun: angkaDari(pengalamanTeks),
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
    } catch (err) {
      setGalat(pesanDari(err));
    } finally {
      setSedang(false);
    }
  };

  return (
    <Card>
      <h2 className="tk-inv-h2">Ajukan peluang siklus berikutnya</h2>
      <form className="tk-inv-form" onSubmit={(e) => void handleAjukan(e)} noValidate>
        <Field id="ajuan-nama" label="Nama panggilan yang tampil ke pengguna" required>
          <TextInput
            id="ajuan-nama"
            placeholder="Pak Dedi S."
            value={namaPeternak}
            onChange={(e) => setNamaPeternak(e.target.value)}
          />
        </Field>
        <Field id="ajuan-kandang" label="Nama kandang" required>
          <TextInput
            id="ajuan-kandang"
            placeholder="Kandang Sukamaju"
            value={namaKandang}
            onChange={(e) => setNamaKandang(e.target.value)}
          />
        </Field>
        <Field id="ajuan-kecamatan" label="Kecamatan" required>
          <TextInput
            id="ajuan-kecamatan"
            placeholder="Ciparay"
            value={kecamatan}
            onChange={(e) => setKecamatan(e.target.value)}
          />
        </Field>
        <Field id="ajuan-wilayah" label="Kabupaten/kota" required>
          <select
            id="ajuan-wilayah"
            className="tk-input"
            value={wilayahId}
            onChange={(e) => setWilayahId(e.target.value as LokasiPilihanId)}
          >
            {LOKASI_PILIHAN.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="ajuan-pengalaman" label="Pengalaman beternak">
          <NumberInput
            id="ajuan-pengalaman"
            unit="tahun"
            value={pengalamanTeks}
            onChange={(e) => setPengalamanTeks(e.target.value)}
          />
        </Field>
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
        <Button type="submit" disabled={sedang} iconEnd={<ArrowRightIcon size={18} />}>
          {sedang ? "Mengirim..." : "Ajukan peluang"}
        </Button>
      </form>
      {terkirim && (
        <Banner variant="success">
          Ajuan terkirim (simulasi). Tim akan menjadwalkan pemeriksaan dokter hewan mitra lewat
          WhatsApp sebelum peluang dibuka untuk modal.
        </Banner>
      )}
    </Card>
  );
}

export function PeternakPage() {
  const { peran, akun } = usePeranAktif();
  const daftar = useDaftarPeluang();

  if (!akun || peran !== "peternak") {
    return <Navigate to="/app/masuk?peran=peternak&lanjut=/app/peternak" replace />;
  }

  const milikSaya = (daftar.data ?? []).filter((p) => p.milikSaya);
  // Profil utama: peluang yang sudah diperiksa (dibuka/dipelihara); sisanya tampil sebagai ajuan.
  const peluangSaya = milikSaya.find((p) => p.status !== "menunggu-pemeriksaan") ?? null;
  const ajuan = milikSaya.filter((p) => p.status === "menunggu-pemeriksaan");

  const syarat = [
    { label: "Profil kandang lengkap", ok: true },
    { label: "Catatan harian minimal 14 hari terakhir", ok: Boolean(peluangSaya?.catatan.length) },
    { label: "Izin data catatan harian ditampilkan", ok: peluangSaya?.izinData ?? true },
    { label: "Diperiksa dokter hewan mitra (wajib)", ok: Boolean(peluangSaya?.pemeriksaan) },
  ];

  return (
    <AppShell pageTitle="Kandang saya">
      <Card variant="warm" className="tk-inv-hero">
        <p className="tk-eyebrow">{TEKS_INVESTASI.labelModul}</p>
        <h1 className="tk-inv-title">Halo, {namaTampil(akun)}</h1>
        <p className="tk-muted tk-prose">
          Ini profil peternakan Anda. Pengguna di sekitar melihat kandang, hasil pemeriksaan dokter
          hewan, dan data catatan harian di bawah ini sebelum menitipkan modal.
        </p>
      </Card>

      <Banner variant="info">{TEKS_INVESTASI.catatanPrototipe}</Banner>
      {daftar.galat && <Banner variant="offline">{daftar.galat}</Banner>}

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
          <IzinData peluang={peluangSaya} />
        </>
      )}

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

      <FormAjuan namaAwal={akun.nama ?? ""} />

      {ajuan.length > 0 && (
        <Card>
          <h2 className="tk-inv-h2">Ajuan Anda</h2>
          <ul className="tk-inv-ajuan">
            {ajuan.map((a) => (
              <li key={a.id}>
                <div>
                  <strong>{a.namaKandang}</strong> ·{" "}
                  <strong className="tk-num">{formatAngka(a.jumlahEkor, 0)} ekor</strong> ·{" "}
                  <span className="tk-num">{formatRupiah(a.kebutuhanModal)}</span> ·{" "}
                  {a.porsiPemodalPersen}% pemodal
                  {a.rencanaMulai && <p className="tk-inv-footnote">Mulai {a.rencanaMulai}</p>}
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
