import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { AlurWebsite } from "../components/landing/AlurWebsite";
import { FieldProof } from "../components/landing/FieldProof";
import { InvestasiHighlight } from "../components/landing/InvestasiHighlight";
import { KokokChatPopup } from "../components/landing/KokokChatPopup";
import { KokokHeroStage } from "../components/landing/KokokHeroStage";
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
  LogOutIcon,
  MenuIcon,
  ShieldCheckIcon,
  StoreIcon,
  WhatsAppIcon,
} from "../components/ui";
import {
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
import { animateFloatingPillOpen, useLandingGsap } from "../lib/gsapAnimations";
import { BERANDA_PERAN, LABEL_PERAN, keluarDemo, useAkunDemo } from "../lib/akunDemo";
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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const waktuBukaOtomatisRef = useRef<number>(0);
  const [pillTerbuka, setPillTerbuka] = useState(false);
  const [headerSembunyi, setHeaderSembunyi] = useState(false);
  const pillTerbukaRef = useRef(false);
  const posisiBukaRef = useRef(0);

  useEffect(() => {
    pillTerbukaRef.current = pillTerbuka;
    // Header yang sedang menyingkir tetap tampil selama menu terbuka (lihat kelas di bawah)
    if (pillTerbuka) posisiBukaRef.current = window.scrollY;
  }, [pillTerbuka]);
  const [pesanPasang, setPesanPasang] = useState<string | null>(null);
  const { bisaPasangLangsung, isStandalone, isIos, pasangSekarang } = usePwaInstall();
  const akun = useAkunDemo();

  useLandingGsap(rootRef);

  // Hanya desktop dengan mouse yang membuka menu saat kursor lewat; ponsel dan tablet lewat ketukan
  const bolehBukaHover = () =>
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover) and (min-width: 960px)").matches;

  // Tutup menu saat mengetuk di luar, dan sembunyikan navbar saat menggulir ke bawah
  useEffect(() => {
    let posisiSebelum = window.scrollY;
    const handleGulir = () => {
      const posisi = window.scrollY;
      // Menu terbuka: tutup hanya bila digulir cukup jauh, agar sisa gulir tidak langsung menutupnya
      if (pillTerbukaRef.current) {
        if (Math.abs(posisi - posisiBukaRef.current) > 60) setPillTerbuka(false);
        posisiSebelum = posisi;
        return;
      }
      if (Math.abs(posisi - posisiSebelum) < 6) return;
      setHeaderSembunyi(posisi > posisiSebelum && posisi > 160);
      posisiSebelum = posisi;
    };
    const handleKetukLuar = (e: PointerEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) setPillTerbuka(false);
    };
    window.addEventListener("scroll", handleGulir, { passive: true });
    document.addEventListener("pointerdown", handleKetukLuar);
    return () => {
      window.removeEventListener("scroll", handleGulir);
      document.removeEventListener("pointerdown", handleKetukLuar);
    };
  }, []);

  const bukaPill = () => {
    setPillTerbuka((sebelum) => {
      if (!sebelum) {
        waktuBukaOtomatisRef.current = Date.now();
        window.requestAnimationFrame(() => {
          animateFloatingPillOpen(pillRef.current);
        });
      }
      return true;
    });
  };

  const tutupPill = () => {
    setPillTerbuka(false);
  };

  const togglePill = () => {
    setPillTerbuka((sebelum) => {
      if (sebelum && Date.now() - waktuBukaOtomatisRef.current < 450) {
        return true;
      }
      const baru = !sebelum;
      if (baru) {
        window.requestAnimationFrame(() => {
          animateFloatingPillOpen(pillRef.current);
        });
      }
      return baru;
    });
  };

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
    <div ref={rootRef} className="tk-landing" id="atas">
      <a className="skip-link" href="#konten-utama">
        {TEKS.lewatiKeKonten}
      </a>

      <header
        className={`tk-floating-header ${headerSembunyi && !pillTerbuka ? "tk-floating-header--sembunyi" : ""}`.trim()}
        onFocusCapture={() => setHeaderSembunyi(false)}
      >
        <div className="tk-landing-container tk-floating-header__inner">
          <div
            ref={pillRef}
            className={`tk-floating-pill ${pillTerbuka ? "tk-floating-pill--open" : ""}`.trim()}
            data-open={pillTerbuka ? "true" : "false"}
            onMouseEnter={() => {
              if (bolehBukaHover()) bukaPill();
            }}
            onMouseLeave={() => {
              if (bolehBukaHover()) tutupPill();
            }}
          >
            <button
              type="button"
              className="tk-brand tk-floating-pill__trigger"
              aria-expanded={pillTerbuka}
              aria-controls="nav-pill-tray"
              aria-label="ternakin — buka atau tutup menu navigasi"
              onClick={togglePill}
              onFocus={() => {
                if (bolehBukaHover()) bukaPill();
              }}
            >
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
              <span className="tk-floating-pill__burger" aria-hidden="true">
                {pillTerbuka ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
              </span>
            </button>

            <div id="nav-pill-tray" className="tk-floating-pill__tray" aria-hidden={!pillTerbuka}>
              <div className="tk-floating-pill__tray-inner">
                <nav className="tk-landing-nav" aria-label="Navigasi halaman utama">
                  {LANDING_NAV_LINKS.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      tabIndex={pillTerbuka ? 0 : -1}
                      className="tk-landing-nav__link tk-floating-pill__item"
                      onClick={() => setPillTerbuka(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>

                <div className="tk-floating-pill__actions">
                  {akun ? (
                    <>
                      <Link
                        to={BERANDA_PERAN[akun.peran]}
                        tabIndex={pillTerbuka ? 0 : -1}
                        className="tk-btn tk-btn--secondary tk-landing-header__cta tk-floating-pill__item"
                      >
                        {akun.nama} · {LABEL_PERAN[akun.peran]}
                      </Link>
                      <button
                        type="button"
                        tabIndex={pillTerbuka ? 0 : -1}
                        className="tk-btn tk-btn--ghost tk-landing-header__cta tk-floating-pill__item"
                        onClick={keluarDemo}
                      >
                        <LogOutIcon size={18} />
                        <span>Keluar</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/app/masuk"
                      tabIndex={pillTerbuka ? 0 : -1}
                      className="tk-btn tk-btn--secondary tk-landing-header__cta tk-floating-pill__item"
                    >
                      Masuk
                    </Link>
                  )}
                  <Link
                    to="/app"
                    tabIndex={pillTerbuka ? 0 : -1}
                    className="tk-btn tk-btn--primary tk-landing-header__cta tk-floating-pill__item"
                  >
                    Buka aplikasi
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="konten-utama" tabIndex={-1}>
        {/* 1. Hero */}
        <section className="tk-section tk-section--hero tk-hero">
          <PolaHeroSvg />
          <div className="tk-landing-container tk-hero__inner">
            <div className="tk-hero__copy">
              <a href="#investasi" className="tk-hero__announce">
                <span className="tk-hero__announce-label">{LANDING_HERO.pengumumanLabel}</span>
                <span>{LANDING_HERO.pengumuman}</span>
                <ArrowRightIcon size={16} />
              </a>

              <h1 className="tk-hero__title">
                <span className="tk-hero__title-line">{LANDING_HERO.h1Utama}</span>{" "}
                <span className="tk-hero__title-accent">
                  <span className="tk-sticker">{LANDING_HERO.h1Aksen}</span>
                </span>
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
            </div>

            <div className="tk-hero__visual-col">
              <KokokHeroStage />
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

        {/* 2b. Alur website per peran */}
        <AlurWebsite />

        {/* 3. Masalah */}
        <section className="tk-section tk-section--masalah" aria-labelledby="judul-masalah">
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
                  <p className="tk-stat-card__text">{item.keterangan}</p>
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
              <p className="tk-source-bar__note">{LANDING_MASALAH.catatanVerifikasi}</p>
            </div>
          </div>
        </section>

        {/* 4. Empat modul */}
        <section id="fitur" className="tk-section tk-section--modul" aria-labelledby="judul-modul">
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
                      <span className="tk-module-label">{modul.label}</span>
                    </div>
                    <h3 className="tk-module-title">{modul.judul}</h3>
                    <p className="tk-module-text">{modul.kalimat}</p>
                  </div>
                  <div className="tk-module-visual">
                    <PhoneFrame kind={modul.pratinjau} />
                  </div>
                </article>
              ))}
            </div>

            <p className="tk-modules-caption">Data di layar adalah contoh.</p>
          </div>
        </section>

        {/* 4b. Modul 05 — Investasi ternak (fitur baru) */}
        <InvestasiHighlight />

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
                  className="tk-trust-kokok"
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
          className="tk-section tk-section--mitra"
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
        <section id="faq" className="tk-section tk-section--faq" aria-labelledby="judul-faq">
          <div className="tk-landing-container">
            <p className="tk-eyebrow">PERTANYAAN UMUM</p>
            <h2 id="judul-faq" className="tk-landing-h2">
              Hal yang paling sering ditanyakan.
            </h2>
            <Accordion
              items={LANDING_FAQ.map((item) => ({
                id: item.id,
                question: item.pertanyaan,
                answer: <p className="tk-faq-answer">{item.jawaban}</p>,
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
            {pesanPasang && <Banner variant="info">{pesanPasang}</Banner>}
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
                  <a href="#investasi">Investasi ternak</a>
                </li>
                <li>
                  <a href="#cara-kerja">Alur Ternakin</a>
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

      <KokokChatPopup />
    </div>
  );
}
