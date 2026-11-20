import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { AppShell } from "../components/layout/AppShell";
import {
  ArrowRightIcon,
  Banner,
  Button,
  Card,
  CheckIcon,
  Field,
  HomeIcon,
  LogOutIcon,
  StethoscopeIcon,
  StoreIcon,
  TextInput,
  UserIcon,
  WhatsAppIcon,
} from "../components/ui";
import { TEKS_INVESTASI } from "../content/investasiContent";
import {
  AKUN_DEMO,
  BERANDA_PERAN,
  LABEL_PERAN,
  cocokkanAkunDemo,
  keluarDemo,
  masukDemo,
  useAkunDemo,
  type PeranAkun,
} from "../lib/akunDemo";
import { buatTautanWhatsAppTim } from "../lib/wa";
import "./InvestasiPage.css";

const INFO_PERAN: Record<PeranAkun, { ikon: ReactNode; bisa: readonly string[] }> = {
  pengguna: {
    ikon: <UserIcon size={24} />,
    bisa: [
      "Lihat peluang di peternak terdekat",
      "Periksa data kandang dan hasil dokter hewan",
      "Coba catat minat titip modal",
    ],
  },
  peternak: {
    ikon: <HomeIcon size={24} />,
    bisa: [
      "Atur izin data catatan harian",
      "Pantau peluang kandang Anda",
      "Ajukan peluang siklus berikutnya",
    ],
  },
};

function tujuanAman(lanjut: string | null, peran: PeranAkun): string {
  // Hanya izinkan tujuan internal /app agar tidak bisa dipakai untuk mengalihkan ke situs lain
  if (lanjut && lanjut.startsWith("/app/") && !lanjut.startsWith("//")) return lanjut;
  return BERANDA_PERAN[peran];
}

export function MasukPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const akun = useAkunDemo();
  const peranSaran: PeranAkun = params.get("peran") === "peternak" ? "peternak" : "pengguna";
  const lanjut = params.get("lanjut");

  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [galat, setGalat] = useState<string | null>(null);

  const masukSebagai = (peran: PeranAkun) => {
    masukDemo(peran);
    void navigate(tujuanAman(lanjut, peran));
  };

  const handleMasukManual = (e: FormEvent) => {
    e.preventDefault();
    const peran = cocokkanAkunDemo(email, sandi);
    if (!peran) {
      setGalat("Email atau kata sandi tidak cocok dengan akun demo di atas.");
      return;
    }
    masukSebagai(peran);
  };

  const urutanPeran: PeranAkun[] =
    peranSaran === "peternak" ? ["peternak", "pengguna"] : ["pengguna", "peternak"];

  return (
    <AppShell pageTitle="Masuk">
      <Card variant="warm" className="tk-inv-hero">
        <p className="tk-eyebrow">AKUN DEMO · PROTOTIPE</p>
        <h1 className="tk-inv-title">Masuk ke Ternakin</h1>
        <p className="tk-muted tk-prose">
          Pilih akun demo untuk mencoba Ternakin sebagai pengguna atau peternak. Akun hanya
          tersimpan di perangkat ini dan bisa diganti kapan saja.
        </p>
      </Card>

      {akun && (
        <Card className="tk-masuk-aktif">
          <span className="tk-masuk-aktif__icon" aria-hidden="true">
            {INFO_PERAN[akun.peran].ikon}
          </span>
          <div className="tk-masuk-aktif__text">
            <p className="tk-masuk-aktif__label">Sedang masuk sebagai</p>
            <p className="tk-masuk-aktif__nama">
              {akun.nama} · {LABEL_PERAN[akun.peran]} demo
            </p>
          </div>
          <div className="tk-masuk-aktif__aksi">
            <Link to={BERANDA_PERAN[akun.peran]} className="tk-btn tk-btn--secondary">
              Lanjutkan
            </Link>
            <Button variant="secondary" iconStart={<LogOutIcon size={18} />} onClick={keluarDemo}>
              Keluar
            </Button>
          </div>
        </Card>
      )}

      <section aria-labelledby="judul-akun-demo" className="tk-masuk-section">
        <h2 id="judul-akun-demo" className="tk-inv-h2">
          {akun ? "Ganti ke akun demo lain" : "Pilih akun demo"}
        </h2>
        <div className="tk-masuk-grid">
          {urutanPeran.map((peran) => {
            const data = AKUN_DEMO[peran];
            const sedangDipakai = akun?.peran === peran;
            return (
              <article
                key={peran}
                className={`tk-masuk-kartu ${peran === peranSaran && !akun ? "tk-masuk-kartu--saran" : ""}`.trim()}
              >
                <div className="tk-masuk-kartu__head">
                  <span className="tk-masuk-kartu__icon" aria-hidden="true">
                    {INFO_PERAN[peran].ikon}
                  </span>
                  <div>
                    <h3 className="tk-masuk-kartu__title">{LABEL_PERAN[peran]} demo</h3>
                    <p className="tk-masuk-kartu__nama">{data.nama}</p>
                  </div>
                </div>
                <ul className="tk-masuk-kartu__list">
                  {INFO_PERAN[peran].bisa.map((b) => (
                    <li key={b}>
                      <CheckIcon size={16} />
                      {b}
                    </li>
                  ))}
                </ul>
                <dl className="tk-masuk-kartu__cred">
                  <div>
                    <dt>Email</dt>
                    <dd>{data.email}</dd>
                  </div>
                  <div>
                    <dt>Sandi</dt>
                    <dd>{data.sandi}</dd>
                  </div>
                </dl>
                <Button
                  fullWidth
                  variant={sedangDipakai ? "secondary" : "primary"}
                  iconEnd={<ArrowRightIcon size={18} />}
                  onClick={() => masukSebagai(peran)}
                >
                  {sedangDipakai
                    ? `Buka sebagai ${LABEL_PERAN[peran].toLowerCase()}`
                    : `Masuk sebagai ${LABEL_PERAN[peran].toLowerCase()}`}
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <Card>
        <h2 className="tk-inv-h2">Masuk dengan email</h2>
        <form className="tk-inv-form tk-masuk-form" onSubmit={handleMasukManual} noValidate>
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
          <Button type="submit" iconEnd={<ArrowRightIcon size={18} />}>
            Masuk
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="tk-inv-h2">Mitra Ternakin</h2>
        <p className="tk-muted tk-prose">
          Pendaftaran toko pakan mitra dan dokter hewan mitra masih dibantu langsung oleh tim lewat
          WhatsApp.
        </p>
        <div className="tk-inv-mitra-grid">
          <a
            className="tk-inv-mitra-link"
            href={buatTautanWhatsAppTim(TEKS_INVESTASI.pesanWaToko)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <StoreIcon size={22} />
            <span>
              <strong>Toko pakan mitra</strong>
              <span className="tk-inv-demo-btn__sub">Gabung lewat WhatsApp</span>
            </span>
            <WhatsAppIcon size={20} />
          </a>
          <a
            className="tk-inv-mitra-link"
            href={buatTautanWhatsAppTim(TEKS_INVESTASI.pesanWaDokter)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <StethoscopeIcon size={22} />
            <span>
              <strong>Dokter hewan mitra</strong>
              <span className="tk-inv-demo-btn__sub">Gabung lewat WhatsApp</span>
            </span>
            <WhatsAppIcon size={20} />
          </a>
        </div>
      </Card>
    </AppShell>
  );
}
