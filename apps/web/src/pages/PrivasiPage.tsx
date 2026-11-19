import { Link } from "react-router";
import { ArrowRightIcon, Card } from "../components/ui";
import { TEKS } from "../lib/teks";

export function PrivasiPage() {
  return (
    <div className="tk-landing">
      <a className="skip-link" href="#konten-utama">
        {TEKS.lewatiKeKonten}
      </a>

      <header className="tk-landing-header">
        <div className="tk-landing-container tk-landing-header__inner">
          <Link to="/" className="tk-brand">
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
          </Link>
          <Link to="/app" className="tk-btn tk-btn--primary tk-landing-header__cta">
            Buka aplikasi
          </Link>
        </div>
      </header>

      <main
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
