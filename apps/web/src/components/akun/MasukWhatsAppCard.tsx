import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { normalisasiNomorPonsel, PANJANG_KODE_OTP, type PeranAkun } from "@ternakin/shared";
import {
  ArrowRightIcon,
  Banner,
  Button,
  Card,
  Field,
  HomeIcon,
  LogOutIcon,
  ShieldCheckIcon,
  SproutCoinIcon,
  TextInput,
  WhatsAppIcon,
} from "../ui";
import { GalatAkun, aturPeran, keluarAkun, mintaOtp, useAkun, verifikasiOtp } from "../../lib/akun";
import { BERANDA_PERAN, LABEL_PERAN, namaTampil } from "../../lib/peran";
import { useOnlineStatus } from "../../lib/pwa";

type Tahap = "nomor" | "kode";

const PENJELASAN_PERAN: Record<PeranAkun, string> = {
  peternak: "Hitung pakan, catatan harian, toko pakan, tanya Kokok, dan ajukan peluang modal.",
  pengguna: "Tanya Kokok soal ayam peliharaan dan titip modal ke peternak di sekitar.",
};

function pesanDari(err: unknown): string {
  return err instanceof GalatAkun ? err.message : "Terjadi kendala. Coba lagi sebentar lagi.";
}

/** Hitung mundur detik untuk tombol kirim ulang. */
function useHitungMundur(): [number, (detik: number) => void] {
  const [sisa, setSisa] = useState(0);
  useEffect(() => {
    if (sisa <= 0) return;
    const t = window.setTimeout(() => setSisa((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [sisa]);
  return [sisa, setSisa];
}

/** Hanya tujuan internal /app agar tidak bisa dipakai mengalihkan ke situs lain. */
function tujuanAman(lanjut: string | null | undefined): string | null {
  return lanjut && lanjut.startsWith("/app") && !lanjut.startsWith("//") ? lanjut : null;
}

function PilihanPeran({
  nilai,
  onPilih,
  nama,
}: {
  nilai: PeranAkun | null;
  onPilih: (peran: PeranAkun) => void;
  nama: string;
}) {
  return (
    <fieldset className="tk-masuk-peran">
      <legend className="tk-field__label">Saya masuk sebagai</legend>
      {(["peternak", "pengguna"] as const).map((peran) => (
        <label
          key={peran}
          className={`tk-masuk-peran__opsi ${nilai === peran ? "is-dipilih" : ""}`.trim()}
        >
          <input
            type="radio"
            name={nama}
            value={peran}
            checked={nilai === peran}
            onChange={() => onPilih(peran)}
          />
          <span className="tk-masuk-peran__ikon" aria-hidden="true">
            {peran === "peternak" ? <HomeIcon size={20} /> : <SproutCoinIcon size={20} />}
          </span>
          <span>
            <strong>{LABEL_PERAN[peran]}</strong>
            <span className="tk-masuk-peran__teks">{PENJELASAN_PERAN[peran]}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function MasukWhatsAppCard({
  peranSaran = null,
  lanjut = null,
}: {
  peranSaran?: PeranAkun | null;
  lanjut?: string | null;
}) {
  const akun = useAkun();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();

  const [tahap, setTahap] = useState<Tahap>("nomor");
  const [peranDipilih, setPeranDipilih] = useState<PeranAkun | null>(peranSaran);
  const [nomor, setNomor] = useState("");
  const [kode, setKode] = useState("");
  const [nomorTersamar, setNomorTersamar] = useState("");
  const [kodeDemo, setKodeDemo] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);
  const [sedang, setSedang] = useState(false);
  const [konfirmasiKeluar, setKonfirmasiKeluar] = useState(false);
  const [sisaKirimUlang, setSisaKirimUlang] = useHitungMundur();

  const kirimKode = async () => {
    setGalat(null);
    if (!normalisasiNomorPonsel(nomor)) {
      setGalat("Nomor WhatsApp belum benar. Contoh: 0812 3456 7890.");
      return;
    }
    setSedang(true);
    try {
      const hasil = await mintaOtp(nomor);
      setNomorTersamar(hasil.nomorTersamar);
      setKodeDemo(hasil.kodeDemo ?? null);
      setSisaKirimUlang(hasil.kirimUlangDetik);
      setKode("");
      setTahap("kode");
    } catch (err) {
      if (err instanceof GalatAkun && err.tungguDetik) setSisaKirimUlang(err.tungguDetik);
      setGalat(pesanDari(err));
    } finally {
      setSedang(false);
    }
  };

  const handleNomor = (e: FormEvent) => {
    e.preventDefault();
    void kirimKode();
  };

  const handleKode = async (e: FormEvent) => {
    e.preventDefault();
    setGalat(null);
    if (!new RegExp(`^\\d{${PANJANG_KODE_OTP}}$`).test(kode)) {
      setGalat(`Masukkan ${PANJANG_KODE_OTP} angka kode dari WhatsApp.`);
      return;
    }
    setSedang(true);
    try {
      const hasil = await verifikasiOtp(nomor, kode, peranDipilih ?? undefined);
      const pindah = hasil.kandangDipindahkan ?? 0;
      setSukses(
        pindah > 0
          ? `Berhasil masuk. ${pindah} profil kandang dari HP ini sudah tersimpan di akun Anda.`
          : "Berhasil masuk. Data Anda kini tersimpan di akun dan bisa dibuka di HP lain.",
      );
      setTahap("nomor");
      setNomor("");
      setKode("");
      setKodeDemo(null);
      const tujuan = tujuanAman(lanjut);
      if (tujuan && hasil.pengguna.peran) void navigate(tujuan);
    } catch (err) {
      setGalat(pesanDari(err));
      if (err instanceof GalatAkun && err.kode !== "OTP_SALAH") setKode("");
    } finally {
      setSedang(false);
    }
  };

  const handlePilihPeran = async (peran: PeranAkun) => {
    setGalat(null);
    setSedang(true);
    try {
      await aturPeran(peran);
      void navigate(tujuanAman(lanjut) ?? BERANDA_PERAN[peran]);
    } catch (err) {
      setGalat(pesanDari(err));
    } finally {
      setSedang(false);
    }
  };

  const handleKeluar = async () => {
    setGalat(null);
    setSedang(true);
    try {
      await keluarAkun();
      setSukses("Anda sudah keluar. Data di HP ini dibersihkan dan tetap aman di akun Anda.");
      setKonfirmasiKeluar(false);
    } catch (err) {
      setGalat(pesanDari(err));
    } finally {
      setSedang(false);
    }
  };

  if (akun && !akun.peran) {
    return (
      <Card>
        <h2 className="tk-inv-h2">Pilih peran akun Anda</h2>
        <p className="tk-muted tk-prose">
          Menu Ternakin menyesuaikan peran. Peran bisa diganti nanti dari halaman Profil.
        </p>
        {sukses && <Banner variant="success">{sukses}</Banner>}
        <div className="tk-masuk-peran tk-masuk-peran--tombol">
          {(["peternak", "pengguna"] as const).map((peran) => (
            <Button
              key={peran}
              variant={peran === peranSaran ? "primary" : "secondary"}
              disabled={sedang}
              iconStart={
                peran === "peternak" ? <HomeIcon size={18} /> : <SproutCoinIcon size={18} />
              }
              onClick={() => void handlePilihPeran(peran)}
            >
              Saya {LABEL_PERAN[peran].toLowerCase()}
            </Button>
          ))}
        </div>
        {galat && <Banner variant="error">{galat}</Banner>}
      </Card>
    );
  }

  if (akun) {
    const peran = akun.peran ?? "peternak";
    return (
      <Card className="tk-masuk-aktif">
        <span className="tk-masuk-aktif__icon" aria-hidden="true">
          <ShieldCheckIcon size={24} />
        </span>
        <div className="tk-masuk-aktif__text">
          <p className="tk-masuk-aktif__label">
            {akun.isDemo ? "Akun demo" : "Masuk dengan WhatsApp"} · {LABEL_PERAN[peran]}
          </p>
          <p className="tk-masuk-aktif__nama">{namaTampil(akun)}</p>
        </div>
        <div className="tk-masuk-aktif__aksi">
          <Link to={BERANDA_PERAN[peran]} className="tk-btn tk-btn--secondary">
            {peran === "pengguna" ? "Lihat peluang" : "Buka beranda"}
          </Link>
          {!konfirmasiKeluar && (
            <Button
              variant="secondary"
              iconStart={<LogOutIcon size={18} />}
              onClick={() => setKonfirmasiKeluar(true)}
            >
              Keluar
            </Button>
          )}
        </div>
        {sukses && (
          <Banner variant="success" className="tk-masuk-otp__banner">
            {sukses}
          </Banner>
        )}
        {konfirmasiKeluar && (
          <div className="tk-masuk-otp__konfirmasi">
            <Banner variant="info" title="Keluar dari akun?">
              Perubahan terakhir dikirim dulu ke akun, lalu data di HP ini dihapus. Masuk lagi untuk
              membukanya kembali.
            </Banner>
            <div className="tk-inv-actions">
              <Button disabled={sedang} onClick={() => void handleKeluar()}>
                {sedang ? "Menyimpan dan keluar..." : "Ya, keluar"}
              </Button>
              <Button variant="secondary" onClick={() => setKonfirmasiKeluar(false)}>
                Batal
              </Button>
            </div>
          </div>
        )}
        {galat && (
          <Banner variant="error" className="tk-masuk-otp__banner">
            {galat}
          </Banner>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="tk-inv-h2">Masuk dengan nomor WhatsApp</h2>
      <p className="tk-muted tk-prose">
        Data Anda tersimpan di akun, jadi aman bila HP hilang dan bisa dibuka di HP lain. Tanpa kata
        sandi: kami kirim kode {PANJANG_KODE_OTP} angka lewat WhatsApp.
      </p>

      {sukses && <Banner variant="success">{sukses}</Banner>}
      {!isOnline && (
        <Banner variant="offline">
          Masuk butuh sinyal internet. Sementara itu Anda tetap bisa memakai Ternakin tanpa akun.
        </Banner>
      )}

      {tahap === "nomor" ? (
        <form className="tk-inv-form tk-masuk-form" onSubmit={handleNomor} noValidate>
          <PilihanPeran nilai={peranDipilih} onPilih={setPeranDipilih} nama="masuk-peran" />
          <Field id="masuk-nomor" label="Nomor WhatsApp" hint="Contoh: 0812 3456 7890">
            <TextInput
              id="masuk-nomor"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={nomor}
              onChange={(e) => setNomor(e.target.value)}
            />
          </Field>
          {galat && <Banner variant="error">{galat}</Banner>}
          <Button
            type="submit"
            disabled={sedang || !isOnline || sisaKirimUlang > 0}
            iconStart={<WhatsAppIcon size={18} />}
          >
            {sedang
              ? "Mengirim kode..."
              : sisaKirimUlang > 0
                ? `Kirim kode (${sisaKirimUlang} dtk)`
                : "Kirim kode ke WhatsApp"}
          </Button>
        </form>
      ) : (
        <form className="tk-inv-form tk-masuk-form" onSubmit={(e) => void handleKode(e)} noValidate>
          <p className="tk-prose" style={{ margin: 0 }}>
            Kode dikirim ke WhatsApp <strong>{nomorTersamar}</strong>. Berlaku 5 menit.
          </p>
          {kodeDemo && (
            <Banner variant="info" title="Mode demo">
              Layanan WhatsApp belum dipasang di server ini. Kode Anda: <strong>{kodeDemo}</strong>
            </Banner>
          )}
          <Field id="masuk-kode" label={`Kode ${PANJANG_KODE_OTP} angka`}>
            <TextInput
              id="masuk-kode"
              className="tk-masuk-otp__kode"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={PANJANG_KODE_OTP}
              value={kode}
              onChange={(e) => setKode(e.target.value.replace(/\D/g, ""))}
            />
          </Field>
          {galat && <Banner variant="error">{galat}</Banner>}
          <Button type="submit" disabled={sedang} iconEnd={<ArrowRightIcon size={18} />}>
            {sedang ? "Memeriksa..." : "Masuk"}
          </Button>
          <div className="tk-inv-actions">
            <Button
              variant="secondary"
              disabled={sedang || sisaKirimUlang > 0}
              onClick={() => void kirimKode()}
            >
              {sisaKirimUlang > 0 ? `Kirim ulang (${sisaKirimUlang} dtk)` : "Kirim ulang kode"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setTahap("nomor");
                setGalat(null);
                setKodeDemo(null);
              }}
            >
              Ganti nomor
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
