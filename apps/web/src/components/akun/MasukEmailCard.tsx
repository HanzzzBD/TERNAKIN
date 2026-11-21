import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  PANJANG_KODE_OTP,
  type KodeEmailResponse,
  type PeranAkun,
  type SesiAkunResponse,
} from "@ternakin/shared";
import { ArrowRightIcon, Banner, Button, Card, Field, TextInput } from "../ui";
import {
  GalatAkun,
  daftarEmail,
  kirimUlangKodeEmail,
  lupaSandi,
  masukEmail,
  masukGoogle,
  resetSandi,
  useAkun,
  verifikasiEmail,
} from "../../lib/akun";
import { BERANDA_PERAN } from "../../lib/peran";
import { useOnlineStatus } from "../../lib/pwa";
import { PilihanPeran } from "./PilihanPeran";
import { TombolGoogle } from "./TombolGoogle";

type Mode = "masuk" | "daftar";
type Langkah = "form" | "verifikasi" | "lupa" | "reset";

function pesanDari(err: unknown): string {
  return err instanceof GalatAkun ? err.message : "Terjadi kendala. Coba lagi sebentar lagi.";
}

/** Hanya tujuan internal /app agar tidak bisa dipakai mengalihkan ke situs lain. */
function tujuanAman(lanjut: string | null | undefined): string | null {
  return lanjut && lanjut.startsWith("/app") && !lanjut.startsWith("//") ? lanjut : null;
}

function useHitungMundur(): [number, (detik: number) => void] {
  const [sisa, setSisa] = useState(0);
  useEffect(() => {
    if (sisa <= 0) return;
    const t = window.setTimeout(() => setSisa((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [sisa]);
  return [sisa, setSisa];
}

/** Kartu utama halaman Masuk: email + kata sandi, daftar, verifikasi, lupa sandi, dan Google. */
export function MasukEmailCard({
  googleClientId = null,
  peranSaran = null,
  lanjut = null,
}: {
  googleClientId?: string | null;
  peranSaran?: PeranAkun | null;
  lanjut?: string | null;
}) {
  const akun = useAkun();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>(peranSaran ? "daftar" : "masuk");
  const [langkah, setLangkah] = useState<Langkah>("form");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [peran, setPeran] = useState<PeranAkun | null>(peranSaran);
  const [kode, setKode] = useState("");
  const [sandiBaru, setSandiBaru] = useState("");
  const [infoKode, setInfoKode] = useState<KodeEmailResponse | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [sedang, setSedang] = useState(false);
  const [sisaKirimUlang, setSisaKirimUlang] = useHitungMundur();

  const sudahMasuk = useCallback(
    (hasil: SesiAkunResponse) => {
      const peranAkun = hasil.pengguna.peran;
      // Tanpa peran: halaman Masuk menampilkan pilihan peran.
      if (peranAkun) void navigate(tujuanAman(lanjut) ?? BERANDA_PERAN[peranAkun]);
    },
    [lanjut, navigate],
  );

  const jalankan = async (aksi: () => Promise<void>) => {
    setGalat(null);
    setSedang(true);
    try {
      await aksi();
    } catch (err) {
      if (err instanceof GalatAkun && err.tungguDetik) setSisaKirimUlang(err.tungguDetik);
      setGalat(pesanDari(err));
    } finally {
      setSedang(false);
    }
  };

  const keLangkahKode = (info: KodeEmailResponse, berikut: Langkah) => {
    setInfoKode(info);
    setSisaKirimUlang(info.kirimUlangDetik);
    setKode("");
    setLangkah(berikut);
  };

  const onGoogle = useCallback(
    (credential: string) => {
      setGalat(null);
      setSedang(true);
      masukGoogle(credential, peran ?? undefined)
        .then(sudahMasuk)
        .catch((err: unknown) => setGalat(pesanDari(err)))
        .finally(() => setSedang(false));
    },
    [peran, sudahMasuk],
  );

  if (akun) return null;

  const handleMasuk = (e: FormEvent) => {
    e.preventDefault();
    void jalankan(async () => {
      try {
        sudahMasuk(await masukEmail(email, sandi));
      } catch (err) {
        if (err instanceof GalatAkun && err.kode === "EMAIL_BELUM_TERVERIFIKASI" && err.rinci) {
          keLangkahKode(
            {
              ok: true,
              emailTersamar: String(err.rinci.emailTersamar ?? email),
              berlakuDetik: Number(err.rinci.berlakuDetik ?? 900),
              kirimUlangDetik: Number(err.rinci.kirimUlangDetik ?? 60),
              ...(typeof err.rinci.kodeDemo === "string" ? { kodeDemo: err.rinci.kodeDemo } : {}),
            },
            "verifikasi",
          );
          return;
        }
        throw err;
      }
    });
  };

  const handleDaftar = (e: FormEvent) => {
    e.preventDefault();
    if (!peran) {
      setGalat("Pilih peran: Peternak atau Pengguna.");
      return;
    }
    if (sandi.length < 8) {
      setGalat("Kata sandi minimal 8 karakter.");
      return;
    }
    void jalankan(async () => {
      keLangkahKode(await daftarEmail({ nama, email, sandi, peran }), "verifikasi");
    });
  };

  const handleVerifikasi = (e: FormEvent) => {
    e.preventDefault();
    void jalankan(async () => sudahMasuk(await verifikasiEmail(email, kode)));
  };

  const handleLupa = (e: FormEvent) => {
    e.preventDefault();
    void jalankan(async () => keLangkahKode(await lupaSandi(email), "reset"));
  };

  const handleReset = (e: FormEvent) => {
    e.preventDefault();
    if (sandiBaru.length < 8) {
      setGalat("Kata sandi baru minimal 8 karakter.");
      return;
    }
    void jalankan(async () => sudahMasuk(await resetSandi(email, kode, sandiBaru)));
  };

  const kirimUlang = () =>
    void jalankan(async () => {
      const info = langkah === "reset" ? await lupaSandi(email) : await kirimUlangKodeEmail(email);
      keLangkahKode(info, langkah);
    });

  const kembaliKeForm = () => {
    setLangkah("form");
    setGalat(null);
    setInfoKode(null);
  };

  const inputKode = (
    <Field id="email-kode" label={`Kode ${PANJANG_KODE_OTP} angka dari email`}>
      <TextInput
        id="email-kode"
        className="tk-masuk-otp__kode"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={PANJANG_KODE_OTP}
        value={kode}
        onChange={(e) => setKode(e.target.value.replace(/\D/g, ""))}
      />
    </Field>
  );

  const infoPengiriman = infoKode && (
    <>
      <p className="tk-prose" style={{ margin: 0 }}>
        Kode dikirim ke <strong>{infoKode.emailTersamar}</strong>. Berlaku{" "}
        {Math.round(infoKode.berlakuDetik / 60)} menit. Periksa juga folder Spam.
      </p>
      {infoKode.kodeDemo && (
        <Banner variant="info" title="Mode demo">
          Pengiriman email belum dipasang di server ini. Kode Anda:{" "}
          <strong>{infoKode.kodeDemo}</strong>
        </Banner>
      )}
    </>
  );

  const tombolKirimUlang = (
    <div className="tk-inv-actions">
      <Button variant="secondary" disabled={sedang || sisaKirimUlang > 0} onClick={kirimUlang}>
        {sisaKirimUlang > 0 ? `Kirim ulang (${sisaKirimUlang} dtk)` : "Kirim ulang kode"}
      </Button>
      <Button variant="secondary" onClick={kembaliKeForm}>
        Kembali
      </Button>
    </div>
  );

  return (
    <Card>
      <h2 className="tk-inv-h2">
        {langkah === "lupa" || langkah === "reset" ? "Atur ulang kata sandi" : "Masuk ke akun Anda"}
      </h2>

      {!isOnline && (
        <Banner variant="offline">
          Masuk butuh sinyal internet. Sementara itu Anda tetap bisa memakai Ternakin tanpa akun.
        </Banner>
      )}

      {langkah === "form" && (
        <>
          {googleClientId && (
            <>
              <TombolGoogle clientId={googleClientId} onCredential={onGoogle} nonaktif={sedang} />
              <p className="tk-masuk-atau" aria-hidden="true">
                <span>atau pakai email</span>
              </p>
            </>
          )}

          <div className="tk-masuk-tab" role="tablist" aria-label="Masuk atau daftar">
            {(
              [
                ["masuk", "Masuk"],
                ["daftar", "Daftar"],
              ] as const
            ).map(([nilai, label]) => (
              <button
                key={nilai}
                type="button"
                role="tab"
                aria-selected={mode === nilai}
                className="tk-masuk-tab__btn"
                onClick={() => {
                  setMode(nilai);
                  setGalat(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "masuk" ? (
            <form className="tk-inv-form tk-masuk-form" onSubmit={handleMasuk} noValidate>
              <Field id="masuk-email" label="Email">
                <TextInput
                  id="masuk-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field id="masuk-sandi" label="Kata sandi">
                <TextInput
                  id="masuk-sandi"
                  type="password"
                  autoComplete="current-password"
                  value={sandi}
                  onChange={(e) => setSandi(e.target.value)}
                />
              </Field>
              {galat && <Banner variant="error">{galat}</Banner>}
              <Button
                type="submit"
                disabled={sedang || !isOnline}
                iconEnd={<ArrowRightIcon size={18} />}
              >
                {sedang ? "Memeriksa..." : "Masuk"}
              </Button>
              <button
                type="button"
                className="tk-masuk-tautan"
                onClick={() => {
                  setLangkah("lupa");
                  setGalat(null);
                }}
              >
                Lupa kata sandi?
              </button>
            </form>
          ) : (
            <form className="tk-inv-form tk-masuk-form" onSubmit={handleDaftar} noValidate>
              <PilihanPeran nilai={peran} onPilih={setPeran} nama="daftar-peran" />
              <Field
                id="daftar-nama"
                label="Nama panggilan"
                hint="Tampil di menu dan profil, mis. Bu Euis"
              >
                <TextInput
                  id="daftar-nama"
                  autoComplete="name"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                />
              </Field>
              <Field id="daftar-email" label="Email">
                <TextInput
                  id="daftar-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field id="daftar-sandi" label="Kata sandi" hint="Minimal 8 karakter">
                <TextInput
                  id="daftar-sandi"
                  type="password"
                  autoComplete="new-password"
                  value={sandi}
                  onChange={(e) => setSandi(e.target.value)}
                />
              </Field>
              {galat && <Banner variant="error">{galat}</Banner>}
              <Button
                type="submit"
                disabled={sedang || !isOnline}
                iconEnd={<ArrowRightIcon size={18} />}
              >
                {sedang ? "Mendaftar..." : "Daftar"}
              </Button>
            </form>
          )}
        </>
      )}

      {langkah === "verifikasi" && (
        <form className="tk-inv-form tk-masuk-form" onSubmit={handleVerifikasi} noValidate>
          {infoPengiriman}
          {inputKode}
          {galat && <Banner variant="error">{galat}</Banner>}
          <Button type="submit" disabled={sedang} iconEnd={<ArrowRightIcon size={18} />}>
            {sedang ? "Memeriksa..." : "Verifikasi dan masuk"}
          </Button>
          {tombolKirimUlang}
        </form>
      )}

      {langkah === "lupa" && (
        <form className="tk-inv-form tk-masuk-form" onSubmit={handleLupa} noValidate>
          <p className="tk-muted tk-prose" style={{ margin: 0 }}>
            Masukkan email akun Anda. Kami kirim kode untuk membuat kata sandi baru.
          </p>
          <Field id="lupa-email" label="Email">
            <TextInput
              id="lupa-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {galat && <Banner variant="error">{galat}</Banner>}
          <Button type="submit" disabled={sedang || !isOnline || sisaKirimUlang > 0}>
            {sedang ? "Mengirim..." : "Kirim kode"}
          </Button>
          <button type="button" className="tk-masuk-tautan" onClick={kembaliKeForm}>
            Kembali ke Masuk
          </button>
        </form>
      )}

      {langkah === "reset" && (
        <form className="tk-inv-form tk-masuk-form" onSubmit={handleReset} noValidate>
          {infoPengiriman}
          {inputKode}
          <Field id="reset-sandi" label="Kata sandi baru" hint="Minimal 8 karakter">
            <TextInput
              id="reset-sandi"
              type="password"
              autoComplete="new-password"
              value={sandiBaru}
              onChange={(e) => setSandiBaru(e.target.value)}
            />
          </Field>
          {galat && <Banner variant="error">{galat}</Banner>}
          <Button type="submit" disabled={sedang} iconEnd={<ArrowRightIcon size={18} />}>
            {sedang ? "Menyimpan..." : "Simpan sandi baru dan masuk"}
          </Button>
          {tombolKirimUlang}
        </form>
      )}
    </Card>
  );
}
