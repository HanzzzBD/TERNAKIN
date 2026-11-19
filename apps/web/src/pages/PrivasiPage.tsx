import { useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRightIcon, Card } from "../components/ui";
import { animateFloatingPillOpen, usePageTransition } from "../lib/gsapAnimations";
import { TEKS } from "../lib/teks";

export function PrivasiPage() {
  const mainRef = useRef<HTMLElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const waktuBukaOtomatisRef = useRef<number>(0);
  const [pillTerbuka, setPillTerbuka] = useState(false);

  usePageTransition(mainRef, "/privasi");

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

  const togglePill = () => {
    setPillTerbuka((sebelum) => {
      if (sebelum && Date.now() - waktuBukaOtomatisRef.current < 450) {
        return true;
      }
      return !sebelum;
    });
  };

  return (
    <div className="tk-landing">
      <a className="skip-link" href="#konten-utama">
        {TEKS.lewatiKeKonten}
      </a>

      <header className="tk-floating-header">
        <div className="tk-landing-container tk-floating-header__inner">
          <div
            ref={pillRef}
            className={`tk-floating-pill ${pillTerbuka ? "tk-floating-pill--open" : ""}`.trim()}
            data-open={pillTerbuka ? "true" : "false"}
            onMouseEnter={bukaPill}
            onMouseLeave={() => setPillTerbuka(false)}
          >
            <button
              type="button"
              className="tk-brand tk-floating-pill__trigger"
              aria-expanded={pillTerbuka}
              aria-controls="nav-pill-privasi"
              aria-label="ternakin — buka atau tutup menu navigasi"
              onClick={togglePill}
              onFocus={bukaPill}
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
            </button>

            <div
              id="nav-pill-privasi"
              className="tk-floating-pill__tray"
              aria-hidden={!pillTerbuka}
            >
              <div className="tk-floating-pill__tray-inner">
                <Link
                  to="/"
                  tabIndex={pillTerbuka ? 0 : -1}
                  className="tk-landing-nav__link tk-floating-pill__item"
                >
                  Beranda utama
                </Link>
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
      </header>

      <main
        ref={mainRef}
        id="konten-utama"
        tabIndex={-1}
        className="tk-landing-container"
        style={{
          paddingBlock: "var(--space-8)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-5)",
        }}
      >
        <Card variant="warm">
          <p className="tk-eyebrow">KEBIJAKAN PRIVASI · DRAF PROTOTIPE</p>
          <h1 className="tk-landing-h2" style={{ marginBottom: "var(--space-2)" }}>
            Data kandang Anda milik Anda dan tidak dijual.
          </h1>
          <p className="tk-muted tk-prose" style={{ margin: 0 }}>
            Halaman ini menjelaskan secara ringkas data apa saja yang dikumpulkan Ternakin pada
            tahap prototipe dan bagaimana Anda dapat menghapus seluruh data Anda kapan saja.
          </p>
        </Card>

        <Card>
          <h2 className="tk-kokok-subheading">1. Data yang disimpan</h2>
          <ul className="tk-store-pitch-list" style={{ marginBottom: 0 }}>
            <li>
              Profil kandang (nama kandang, jenis ayam, umur minggu, populasi, bahan tersedia, dan
              lokasi kasar tingkat kecamatan atau kabupaten).
            </li>
            <li>
              Catatan harian kandang (pakan terpakai, telur, ayam mati, suhu) disimpan pertama kali
              di penyimpanan ponsel Anda lalu disinkronkan ke server saat tersambung.
            </li>
            <li>
              Riwayat tanya Kokok disimpan di perangkat Anda agar dapat dibaca kembali tanpa sinyal;
              di server kami tidak mencatat teks lengkap gejala ke log sistem.
            </li>
            <li>
              Catatan kontak ke toko mitra (kode toko dan waktu klik) dipakai untuk rekap rujukan
              toko mitra.
            </li>
          </ul>
        </Card>

        <Card>
          <h2 className="tk-kokok-subheading">2. Penggunaan data</h2>
          <p className="tk-prose" style={{ margin: 0 }}>
            Data kandang dipakai semata-mata untuk menghitung campuran pakan, menampilkan tren dan
            peringatan dini di aplikasi Anda, serta menyusun ringkasan kasus saat Anda memilih
            membagikannya lewat WhatsApp. Ternakin tidak menjual data kandang peternak kepada pihak
            ketiga, pabrik pakan, maupun pengiklan.
          </p>
        </Card>

        <Card>
          <h2 className="tk-kokok-subheading">3. Menghapus seluruh data Anda</h2>
          <p className="tk-prose">
            Anda dapat menghapus seluruh data kandang, catatan harian, dan riwayat Kokok di
            perangkat maupun di server kapan saja melalui menu <strong>Profil kandang</strong> lalu
            memilih tombol <strong>Hapus data saya</strong>.
          </p>
          <Link to="/app/profil" className="tk-btn tk-btn--secondary tk-landing-inline-btn">
            <span>Buka Profil kandang</span>
            <ArrowRightIcon size={20} />
          </Link>
        </Card>
      </main>
    </div>
  );
}
