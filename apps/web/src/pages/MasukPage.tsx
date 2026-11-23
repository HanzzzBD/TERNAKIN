import { useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { PeranAkun } from "@ternakin/shared";
import { MasukEmailCard } from "../components/akun/MasukEmailCard";
import { MasukWhatsAppCard } from "../components/akun/MasukWhatsAppCard";
import { AppShell } from "../components/layout/AppShell";
import {
  ArrowRightIcon,
  Banner,
  Button,
  Card,
  CheckIcon,
  HomeIcon,
  StethoscopeIcon,
  StoreIcon,
  UserIcon,
  WhatsAppIcon,
} from "../components/ui";
import { TEKS_INVESTASI } from "../content/investasiContent";
import { GalatAkun, masukAkunDemo, useAkun, useKonfigurasiAuth } from "../lib/akun";
import { ambilPesanMasuk } from "../lib/pesanMasuk";
import { AKUN_DEMO_TAMPIL } from "../lib/akunDemo";
import { BERANDA_PERAN, LABEL_PERAN } from "../lib/peran";
import { buatTautanWhatsAppTim } from "../lib/wa";
import "./InvestasiPage.css";

const INFO_PERAN: Record<PeranAkun, { ikon: ReactNode; bisa: readonly string[] }> = {
  pengguna: {
    ikon: <UserIcon size={24} />,
    bisa: [
      "Lihat peluang di peternak terdekat",
      "Periksa data kandang dan hasil dokter hewan",
      "Coba catat minat titip modal",
      "Tanya Kokok soal ayam peliharaan",
    ],
  },
  peternak: {
    ikon: <HomeIcon size={24} />,
    bisa: [
      "Hitung pakan, catatan harian, dan toko",
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

function peranDariParam(nilai: string | null): PeranAkun | null {
  return nilai === "peternak" || nilai === "pengguna" ? nilai : null;
}

export function MasukPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const akun = useAkun();
  const konfigurasi = useKonfigurasiAuth();
  const peranSaran = peranDariParam(params.get("peran"));
  const lanjut = params.get("lanjut");
  const [galatDemo, setGalatDemo] = useState<string | null>(null);
  // Pesan dari aksi yang mengakhiri sesi (mis. hapus akun); hanya tampil sekali.
  const [pesanAwal] = useState(ambilPesanMasuk);
  const [sedangDemo, setSedangDemo] = useState<PeranAkun | null>(null);

  const masukSebagai = async (peran: PeranAkun) => {
    setGalatDemo(null);
    setSedangDemo(peran);
    try {
      await masukAkunDemo(peran);
      void navigate(tujuanAman(lanjut, peran));
    } catch (err) {
      setGalatDemo(err instanceof GalatAkun ? err.message : "Akun demo belum bisa dibuka.");
    } finally {
      setSedangDemo(null);
    }
  };

  const urutanPeran: PeranAkun[] =
    peranSaran === "peternak" ? ["peternak", "pengguna"] : ["pengguna", "peternak"];

  return (
    <AppShell pageTitle="Masuk">
      {pesanAwal && <Banner variant="success">{pesanAwal}</Banner>}
      <Card variant="warm" className="tk-inv-hero">
        <p className="tk-eyebrow">AKUN TERNAKIN</p>
        <h1 className="tk-inv-title">Masuk ke Ternakin</h1>
        <p className="tk-muted tk-prose">
          Ada dua peran. <strong>Peternak</strong> menghitung pakan, mencatat kandang, bertanya ke
          Kokok, dan mengajukan peluang modal. <strong>Pengguna</strong> bertanya ke Kokok dan
          menitipkan modal ke peternak. Masuk dulu untuk memakai Ternakin; daftarnya gratis, dan
          setelah masuk sekali, Ternakin tetap bisa dipakai tanpa sinyal.
        </p>
      </Card>

      <MasukEmailCard
        googleClientId={konfigurasi?.googleClientId ?? null}
        peranSaran={peranSaran}
        lanjut={lanjut}
      />

      {/* Saat sudah masuk, kartu ini menampilkan status akun dan pilihan peran. */}
      {(akun || konfigurasi?.whatsapp !== false) && (
        <>
          {!akun && konfigurasi?.akunDemo !== false && (
            <p className="tk-masuk-atau" aria-hidden="true">
              <span>atau</span>
            </p>
          )}
          <MasukWhatsAppCard peranSaran={peranSaran} lanjut={lanjut} />
        </>
      )}

      {!akun && (
        <section aria-labelledby="judul-akun-demo" className="tk-masuk-section">
          <h2 id="judul-akun-demo" className="tk-inv-h2">
            Coba akun demo
          </h2>
          <p className="tk-muted tk-prose">
            Untuk juri dan uji coba. Klik tombolnya, atau ketik email dan sandi di form Masuk di
            atas. Akun demo dipakai bersama, jadi jangan isi data pribadi.
          </p>
          {galatDemo && <Banner variant="error">{galatDemo}</Banner>}
          <div className="tk-masuk-grid">
            {urutanPeran.map((peran) => (
              <article
                key={peran}
                className={`tk-masuk-kartu ${peran === peranSaran ? "tk-masuk-kartu--saran" : ""}`.trim()}
              >
                <div className="tk-masuk-kartu__head">
                  <span className="tk-masuk-kartu__icon" aria-hidden="true">
                    {INFO_PERAN[peran].ikon}
                  </span>
                  <div>
                    <h3 className="tk-masuk-kartu__title">{LABEL_PERAN[peran]} demo</h3>
                    <p className="tk-masuk-kartu__nama">{AKUN_DEMO_TAMPIL[peran].nama}</p>
                  </div>
                </div>
                <dl className="tk-masuk-kartu__cred">
                  <div>
                    <dt>Email</dt>
                    <dd>{AKUN_DEMO_TAMPIL[peran].email}</dd>
                  </div>
                  <div>
                    <dt>Sandi</dt>
                    <dd>{AKUN_DEMO_TAMPIL[peran].sandi}</dd>
                  </div>
                </dl>
                <ul className="tk-masuk-kartu__list">
                  {INFO_PERAN[peran].bisa.map((b) => (
                    <li key={b}>
                      <CheckIcon size={16} />
                      {b}
                    </li>
                  ))}
                </ul>
                <Button
                  fullWidth
                  disabled={sedangDemo !== null}
                  iconEnd={<ArrowRightIcon size={18} />}
                  onClick={() => void masukSebagai(peran)}
                >
                  {sedangDemo === peran
                    ? "Membuka..."
                    : `Masuk sebagai ${LABEL_PERAN[peran].toLowerCase()}`}
                </Button>
              </article>
            ))}
          </div>
        </section>
      )}

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
