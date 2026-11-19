import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { FieldProof } from "../components/landing/FieldProof";
import { PhoneFrame } from "../components/landing/PhoneFrame";
import {
  Accordion,
  ArrowRightIcon,
  ArrowUpIcon,
  Banner,
  Button,
  Card,
  ChatIcon,
  CloseIcon,
  FeedIcon,
  InstallIcon,
  KokokMascot,
  MenuIcon,
  ShieldCheckIcon,
  StoreIcon,
  WhatsAppIcon,
} from "../components/ui";
import {
  LANDING_CARA_MULAI,
  LANDING_FAQ,
  LANDING_FOOTER,
  LANDING_HERO,
  LANDING_KEPERCAYAAN,
  LANDING_MARQUEE_BARIS_1,
  LANDING_MARQUEE_BARIS_2,
  LANDING_MASALAH,
  LANDING_MODUL,
  LANDING_NAV_LINKS,
  LANDING_PENUTUP,
  LANDING_TOKO,
  type KepercayaanItem,
} from "../content/landingContent";
import { usePwaInstall } from "../lib/pwa";
import { TEKS } from "../lib/teks";
import { buatTautanWhatsAppTim } from "../lib/wa";
import "./LandingPage.css";

function IkonKepercayaan({ id }: { id: KepercayaanItem["id"] }) {
  if (id === "solver") return <FeedIcon size={22} />;
  if (id === "toko") return <StoreIcon size={22} />;
  if (id === "kokok") return <ChatIcon size={22} />;
  return <ShieldCheckIcon size={22} />;
}

function PolaHeroSvg(): ReactNode {
  return (
    <svg className="tk-hero__pattern" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="tk-pola-pakan" width="88" height="88" patternUnits="userSpaceOnUse">
          <ellipse
            cx="22"
            cy="24"
            rx="8"
            ry="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="64" cy="20" r="4" fill="currentColor" />
          <circle cx="72" cy="30" r="2.5" fill="currentColor" />
          <ellipse
            cx="58"
            cy="64"
            rx="7"
            ry="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="18" cy="68" r="3" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tk-pola-pakan)" />
    </svg>
  );
}

export function LandingPage() {
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [pesanPasang, setPesanPasang] = useState<string | null>(null);
  const { bisaPasangLangsung, isStandalone, isIos, pasangSekarang } = usePwaInstall();

  const handlePasang = async () => {
    if (isStandalone) {
      setPesanPasang(TEKS.sudahTerpasang);
      return;
    }
    if (bisaPasangLangsung) {
      const diterima = await pasangSekarang();
      if (diterima) {
        setPesanPasang(TEKS.sudahTerpasang);
      }
      return;
    }
    setPesanPasang(isIos ? TEKS.panduanIosIsi : TEKS.panduanBrowserLain);
  };

  const waHero = buatTautanWhatsAppTim(LANDING_HERO.pesanWaHero);
  const waToko = buatTautanWhatsAppTim(LANDING_TOKO.pesanWaToko);
  const waFooter = buatTautanWhatsAppTim(LANDING_FOOTER.pesanWaFooter);

  return (
    <div className="tk-landing" id="atas">
      <a className="skip-link" href="#konten-utama">
        {TEKS.lewatiKeKonten}
      </a>

      <header className="tk-landing-header">
        <div className="tk-landing-container tk-landing-header__inner">
          <a href="#atas" className="tk-brand">
            <img
              src="/images/kokok.webp"
              alt=""
              aria-hidden="true"
              className="tk-brand-kokok-avatar"
              width={32}
              height={32}
            />
            <span>
              ternakin
              <span className="tk-brand__dot" aria-hidden="true">
                .
              </span>
            </span>
          </a>

          <nav className="tk-landing-nav" aria-label="Navigasi halaman utama">
            {LANDING_NAV_LINKS.map((item) => (
              <a key={item.href} href={item.href} className="tk-landing-nav__link">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="tk-landing-header__actions">
            <Link to="/app" className="tk-btn tk-btn--primary tk-landing-header__cta">
              Buka aplikasi
            </Link>
            <button
              type="button"
              className="tk-landing-menu-btn"
              aria-expanded={menuTerbuka}
              aria-controls="panel-menu-ponsel"
              aria-label={menuTerbuka ? "Tutup menu navigasi" : "Buka menu navigasi"}
              onClick={() => setMenuTerbuka((v) => !v)}
            >
              {menuTerbuka ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>

        {menuTerbuka && (
          <div id="panel-menu-ponsel" className="tk-landing-mobile-panel">
            <nav aria-label="Navigasi ponsel">
              {LANDING_NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="tk-landing-mobile-panel__link"
                  onClick={() => setMenuTerbuka(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main id="konten-utama" tabIndex={-1}>
        {/* 1. Hero */}
        <section className="tk-section tk-section--white tk-hero">
          <PolaHeroSvg />
          <div className="tk-landing-container tk-hero__inner">
            <div>
              <p className="tk-eyebrow" style={{ marginBottom: "var(--space-3)" }}>
                {LANDING_HERO.eyebrow}
              </p>

              <h1 className="tk-hero__title">
                {LANDING_HERO.h1Utama}
                <span className="tk-hero__title-accent">{LANDING_HERO.h1Aksen}</span>
              </h1>

              <p className="tk-hero__sub">{LANDING_HERO.sub}</p>

              <div className="tk-hero__actions">
                <Link to="/app/pakan" className="tk-btn tk-btn--primary tk-landing-inline-btn">
                  <span>{LANDING_HERO.tombolUtama}</span>
                  <ArrowRightIcon size={20} />
                </Link>
                <a
                  href={waHero}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tk-btn tk-btn--secondary tk-landing-inline-btn"
                >
                  <WhatsAppIcon size={20} />
                  <span>{LANDING_HERO.tombolWa}</span>
                </a>
              </div>

              <div className="tk-hero__install-row">
                <Button
                  variant="secondary"
                  iconStart={<InstallIcon size={20} />}
                  onClick={() => void handlePasang()}
                >
                  {LANDING_HERO.tombolPasang}
                </Button>
                <p className="tk-hero__install-note">{LANDING_HERO.keteranganPasang}</p>
                {pesanPasang && <Banner variant="info">{pesanPasang}</Banner>}
              </div>
            </div>

            <div className="tk-hero__visual-col">
              <PhoneFrame kind="pakan" caption={LANDING_HERO.keteranganPratinjau} />
              <div className="tk-hero__kokok-card">
                <KokokMascot
                  size="sm"
                  interactive
                  messages={[
                    "Halo! Saya Kokok, teman kandang Anda di Ternakin. Ketuk saya untuk lihat info singkat.",
                    "Hitung pakan dan catatan harian tetap jalan walau sinyal di kandang hilang.",
                    "Gratis untuk peternak ayam petelur mandiri. Langsung coba tanpa unduh aplikasi.",
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Strip kata kunci (marquee dua arah) */}
        <section className="tk-marquee-band" aria-label="Keunggulan utama Ternakin">
          <div className="tk-marquee-row tk-marquee-row--left">
            {[0, 1].map((dup) => (
              <div key={`m1-${dup}`} className="tk-marquee-track" aria-hidden={dup === 1}>
                {LANDING_MARQUEE_BARIS_1.map((kata) => (
                  <span key={`${dup}-${kata}`} className="tk-marquee-item">
                    <span>{kata}</span>
                    <span className="tk-marquee-sep" aria-hidden="true" />
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div className="tk-marquee-row tk-marquee-row--right" aria-hidden="true">
            {[0, 1].map((dup) => (
              <div key={`m2-${dup}`} className="tk-marquee-track">
                {LANDING_MARQUEE_BARIS_2.map((kata) => (
                  <span key={`${dup}-${kata}`} className="tk-marquee-item">
                    <span>{kata}</span>
                    <span className="tk-marquee-sep" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* 3. Masalah */}
        <section className="tk-section tk-section--white" aria-labelledby="judul-masalah">
          <div className="tk-landing-container">
            <p className="tk-eyebrow">{LANDING_MASALAH.eyebrow}</p>
            <h2 id="judul-masalah" className="tk-landing-h2">
              {LANDING_MASALAH.judul}
            </h2>

            <div className="tk-stat-grid">
              {LANDING_MASALAH.kartu.map((item) => (
                <Card key={item.id} as="article">
                  <p className="tk-stat-card__value tk-num">{item.angka}</p>
                  <h3 className="tk-stat-card__title">{item.judul}</h3>
                  <p className="tk-muted" style={{ margin: 0 }}>
                    {item.keterangan}
                  </p>
                </Card>
              ))}
            </div>

            <div className="tk-source-bar">
              <span>{LANDING_MASALAH.sumberLabel}</span>
              <ul className="tk-source-list">
                {LANDING_MASALAH.sumberDaftar.map((s) => (
                  <li key={s.nama} className="tk-source-chip">
                    {s.nama}
                  </li>
                ))}
              </ul>
              <p style={{ margin: 0 }}>{LANDING_MASALAH.catatanVerifikasi}</p>
            </div>
          </div>
        </section>

        {/* 4. Empat modul */}
        <section id="fitur" className="tk-section tk-section--peach" aria-labelledby="judul-modul">
          <div className="tk-landing-container">
            <p className="tk-eyebrow">EMPAT MODUL UTAMA</p>
            <h2 id="judul-modul" className="tk-landing-h2">
              Semua kebutuhan harian kandang dalam satu aplikasi ringan.
            </h2>

            <div className="tk-modules-list">
              {LANDING_MODUL.map((modul, idx) => (
                <article
                  key={modul.nomor}
                  className={`tk-module-row ${idx % 2 === 1 ? "tk-module-row--reverse" : ""}`.trim()}
                >
                  <div className="tk-module-copy">
                    <div className="tk-module-head">
                      <span className="tk-step-circle tk-num">{modul.nomor}</span>
                      <span className="tk-eyebrow" style={{ margin: 0 }}>
                        {modul.label}
                      </span>
                    </div>
                    <h3 className="tk-module-title">{modul.judul}</h3>
                    <p className="tk-muted tk-prose" style={{ margin: 0 }}>
                      {modul.kalimat}
                    </p>
                  </div>
                  <div className="tk-module-visual">
                    <PhoneFrame kind={modul.pratinjau} />
                  </div>
                </article>
              ))}
            </div>

            <p className="tk-modules-caption">
              Sekilas tampilan aplikasi. Data di layar adalah contoh.
            </p>
          </div>
        </section>

        {/* 5. Cara mulai */}
        <section
          id="cara-kerja"
          className="tk-section tk-section--white"
          aria-labelledby="judul-cara-mulai"
        >
          <div className="tk-landing-container">
            <p className="tk-eyebrow">{LANDING_CARA_MULAI.eyebrow}</p>
            <h2 id="judul-cara-mulai" className="tk-landing-h2">
              {LANDING_CARA_MULAI.judul}
            </h2>

            <div className="tk-steps-grid">
              {LANDING_CARA_MULAI.langkah.map((step) => (
                <Card key={step.nomor} as="article" className="tk-step-card">
                  <span className="tk-step-circle tk-num">{step.nomor}</span>
                  <h3 className="tk-step-card__title">{step.judul}</h3>
                  <p className="tk-muted" style={{ margin: 0 }}>
                    {step.keterangan}
                  </p>
                </Card>
              ))}
            </div>

            <Link to="/app/pakan" className="tk-btn tk-btn--primary tk-landing-inline-btn">
              <span>{LANDING_CARA_MULAI.tombolUtama}</span>
              <ArrowRightIcon size={20} />
            </Link>
          </div>
        </section>

        {/* 6. Kepercayaan */}
        <section
          id="kepercayaan"
          className="tk-section tk-section--trust"
          aria-labelledby="judul-kepercayaan"
        >
          <div className="tk-landing-container">
            <p className="tk-eyebrow">{LANDING_KEPERCAYAAN.eyebrow}</p>
            <h2 id="judul-kepercayaan" className="tk-landing-h2">
              {LANDING_KEPERCAYAAN.judulUtama}{" "}
              <span className="tk-accent-italic">{LANDING_KEPERCAYAAN.judulAksen}</span>
            </h2>

            <div className="tk-trust-layout">
              <ul className="tk-trust-list">
                {LANDING_KEPERCAYAAN.poin.map((poin) => (
                  <li key={poin.id} className="tk-trust-item">
                    <span className="tk-trust-icon" aria-hidden="true">
                      <IkonKepercayaan id={poin.id} />
                    </span>
                    <div>
                      <h3>{poin.judul}</h3>
                      <p>
                        {poin.keterangan}
                        {poin.id === "privasi" && (
                          <>
                            {" "}
                            <Link to="/privasi" className="tk-inline-link">
                              Baca kebijakan privasi
                            </Link>
                            .
                          </>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <Card as="div" className="tk-trust-mascot-card">
                <KokokMascot
                  size="lg"
                  interactive
                  messages={[
                    LANDING_KEPERCAYAAN.gelembungMaskot,
                    "Setiap angka pakan di Ternakin dihitung oleh solver dan bisa Anda periksa sendiri.",
                    "Urutan toko selalu berdasarkan total biaya termurah, bukan komisi.",
                    "Data kandang Anda bersifat pribadi dan bisa dihapus kapan saja di Profil kandang.",
                  ]}
                />
              </Card>
            </div>
          </div>
        </section>

        {/* 7 & 8. Untuk toko pakan + Bukti dari lapangan (Grid 2 kolom kiri-kanan) */}
        <section
          id="untuk-toko"
          className="tk-section tk-section--white"
          aria-labelledby="judul-untuk-toko"
        >
          <div className="tk-landing-container">
            <div className="tk-partner-pilot-grid">
              <Card className="tk-partner-pilot-card">
                <p className="tk-eyebrow">{LANDING_TOKO.eyebrow}</p>
                <h2 id="judul-untuk-toko" className="tk-landing-h2">
                  {LANDING_TOKO.judul}
                </h2>
                <ul className="tk-store-pitch-list">
                  {LANDING_TOKO.poin.map((teks, idx) => (
                    <li key={`toko-poin-${idx}`}>{teks}</li>
                  ))}
                </ul>
                <div className="tk-partner-pilot-card__action">
                  <a
                    href={waToko}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tk-btn tk-btn--secondary tk-landing-inline-btn"
                  >
                    <WhatsAppIcon size={20} />
                    <span>{LANDING_TOKO.tombolWa}</span>
                  </a>
                </div>
              </Card>

              <FieldProof />
            </div>
          </div>
        </section>

        {/* 9. FAQ */}
        <section id="faq" className="tk-section tk-section--white" aria-labelledby="judul-faq">
          <div className="tk-landing-container">
            <p className="tk-eyebrow">PERTANYAAN UMUM</p>
            <h2 id="judul-faq" className="tk-landing-h2">
              Hal yang paling sering ditanyakan.
            </h2>
            <Accordion
              items={LANDING_FAQ.map((item) => ({
                id: item.id,
                question: item.pertanyaan,
                answer: <p style={{ margin: 0 }}>{item.jawaban}</p>,
              }))}
            />
          </div>
        </section>

        {/* 10. Ajakan penutup */}
        <section className="tk-section tk-section--orange" aria-labelledby="judul-penutup">
          <div className="tk-landing-container tk-cta-box">
            <p className="tk-cta-eyebrow">{LANDING_PENUTUP.eyebrow}</p>
            <h2 id="judul-penutup" className="tk-landing-h2">
              {LANDING_PENUTUP.judulUtama}{" "}
              <span className="tk-accent-italic--ink">{LANDING_PENUTUP.judulAksen}</span>
            </h2>
            <div className="tk-cta-actions">
              <Link to="/app/pakan" className="tk-btn tk-btn--on-orange tk-landing-inline-btn">
                <span>{LANDING_PENUTUP.tombolUtama}</span>
                <ArrowRightIcon size={20} />
              </Link>
              <Button
                variant="secondary"
                iconStart={<InstallIcon size={20} />}
                onClick={() => void handlePasang()}
              >
                {LANDING_PENUTUP.tombolPasang}
              </Button>
            </div>
            <p className="tk-cta-note">{LANDING_PENUTUP.catatanPrototipe}</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="tk-landing-footer">
        <div className="tk-landing-container">
          <div className="tk-footer-grid">
            <div>
              <span className="tk-footer-brand">
                <img
                  src="/images/kokok.webp"
                  alt=""
                  aria-hidden="true"
                  className="tk-brand-kokok-avatar"
                  width={34}
                  height={34}
                />
                <span>
                  ternakin
                  <span className="tk-brand__dot" aria-hidden="true">
                    .
                  </span>
                </span>
              </span>
              <p className="tk-footer-tagline">{LANDING_FOOTER.tagline}</p>
            </div>

            <div className="tk-footer-col">
              <h2>Jelajahi</h2>
              <ul className="tk-footer-links">
                <li>
                  <a href="#fitur">Fitur</a>
                </li>
                <li>
                  <a href="#cara-kerja">Cara kerja</a>
                </li>
                <li>
                  <a href="#untuk-toko">Untuk toko pakan</a>
                </li>
                <li>
                  <a href="#faq">FAQ</a>
                </li>
              </ul>
            </div>

            <div className="tk-footer-col">
              <h2>Langkah berikutnya</h2>
              <ul className="tk-footer-links">
                <li>
                  <Link to="/app/pakan">Hitung pakan</Link>
                </li>
                <li>
                  <Link to="/app">Pasang aplikasi</Link>
                </li>
                <li>
                  <a href={waFooter} target="_blank" rel="noopener noreferrer">
                    Hubungi lewat WhatsApp
                  </a>
                </li>
                <li>
                  <Link to="/privasi">Privasi</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="tk-footer-bottom">
            <p className="tk-footer-copy">{LANDING_FOOTER.hakCipta}</p>
            <div className="tk-footer-controls">
              <a href="#atas" className="tk-footer-top-link">
                <ArrowUpIcon size={18} />
                <span>Kembali ke atas</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
