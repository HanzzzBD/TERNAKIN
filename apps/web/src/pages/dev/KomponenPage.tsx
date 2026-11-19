import { AppShell } from "../../components/layout/AppShell";
import {
  Accordion,
  AlertOctagonIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  Badge,
  Banner,
  Button,
  Card,
  ChatIcon,
  CheckIcon,
  ClipboardIcon,
  FeedIcon,
  Field,
  HomeIcon,
  IconButton,
  InstallIcon,
  KokokMascot,
  MotionIcon,
  NumberInput,
  PlusIcon,
  RefreshIcon,
  ShieldCheckIcon,
  Skeleton,
  StoreIcon,
  TextInput,
  UrgencyChip,
  WhatsAppIcon,
  WifiIcon,
  WifiOffIcon,
} from "../../components/ui";
import "./KomponenPage.css";

interface SwatchKontras {
  nama: string;
  pasangan: string;
  rasio: string;
  kelas: string;
}

const SWATCH_KONTRAS: readonly SwatchKontras[] = [
  {
    nama: "Teks utama di putih",
    pasangan: "--tk-ink di --tk-white",
    rasio: "14,97 : 1 (AAA)",
    kelas: "tk-dev-swatch--ink-white",
  },
  {
    nama: "Teks utama di peach",
    pasangan: "--tk-ink di --tk-peach",
    rasio: "13,71 : 1 (AAA)",
    kelas: "tk-dev-swatch--ink-peach",
  },
  {
    nama: "Teks sekunder di putih",
    pasangan: "--tk-ink-muted di --tk-white",
    rasio: "5,66 : 1 (AA)",
    kelas: "tk-dev-swatch--muted-white",
  },
  {
    nama: "Teks sekunder di peach",
    pasangan: "--tk-ink-muted di --tk-peach",
    rasio: "5,19 : 1 (AA)",
    kelas: "tk-dev-swatch--muted-peach",
  },
  {
    nama: "Tombol utama oranye",
    pasangan: "--tk-ink di --tk-orange",
    rasio: "5,34 : 1 (AA)",
    kelas: "tk-dev-swatch--ink-orange",
  },
  {
    nama: "Aksen & label kecil",
    pasangan: "--tk-orange-dark di --tk-white",
    rasio: "5,18 : 1 (AA)",
    kelas: "tk-dev-swatch--orangedark-white",
  },
  {
    nama: "Hijau pendukung",
    pasangan: "--tk-white di --tk-green",
    rasio: "6,37 : 1 (AA)",
    kelas: "tk-dev-swatch--white-green",
  },
  {
    nama: "Badge mitra & solver",
    pasangan: "--tk-green-dark di --tk-green-soft",
    rasio: "7,98 : 1 (AAA)",
    kelas: "tk-dev-swatch--greendark-soft",
  },
  {
    nama: "Peringatan & usang",
    pasangan: "--tk-ink di --tk-amber-soft",
    rasio: "11,83 : 1 (AAA)",
    kelas: "tk-dev-swatch--ink-amber",
  },
  {
    nama: "Urgensi tinggi & galat",
    pasangan: "--tk-white di --tk-danger",
    rasio: "7,47 : 1 (AAA)",
    kelas: "tk-dev-swatch--white-danger",
  },
];

const DAFTAR_IKON = [
  { nama: "Beranda", icon: <HomeIcon /> },
  { nama: "Pakan", icon: <FeedIcon /> },
  { nama: "Catatan", icon: <ClipboardIcon /> },
  { nama: "Kokok", icon: <ChatIcon /> },
  { nama: "Toko", icon: <StoreIcon /> },
  { nama: "Panah kanan", icon: <ArrowRightIcon /> },
  { nama: "Panah luar", icon: <ArrowUpRightIcon /> },
  { nama: "Tambah", icon: <PlusIcon /> },
  { nama: "Centang", icon: <CheckIcon /> },
  { nama: "Muat ulang", icon: <RefreshIcon /> },
  { nama: "Animasi", icon: <MotionIcon /> },
  { nama: "Pasang", icon: <InstallIcon /> },
  { nama: "Aman", icon: <ShieldCheckIcon /> },
  { nama: "Peringatan", icon: <AlertTriangleIcon /> },
  { nama: "Bahaya", icon: <AlertOctagonIcon /> },
  { nama: "Daring", icon: <WifiIcon /> },
  { nama: "Offline", icon: <WifiOffIcon /> },
  { nama: "WhatsApp", icon: <WhatsAppIcon /> },
] as const;

export default function KomponenPage() {
  return (
    <AppShell pageTitle="Uji Komponen (Dev)">
      <Card variant="warm">
        <p className="tk-eyebrow">DESIGN SYSTEM · KHUSUS PENGEMBANGAN</p>
        <h1 className="tk-dev-h1">
          Pakan lebih hemat. <em>Ayam lebih terjaga.</em>
        </h1>
        <p className="tk-muted tk-prose">
          Halaman ini hanya tersedia saat pengembangan (/dev/komponen) dan tidak masuk build
          produksi. Font memakai Georama dengan lebar normal (100%) serta angka rata kolom:{" "}
          <strong className="tk-tabular">Rp 9.754 / kg</strong>.
        </p>
        <div className="tk-dev-row">
          <KokokMascot size="md" interactive />
        </div>
      </Card>

      <Card>
        <h2 className="tk-dev-h2">Kontras warna token (usulan palet)</h2>
        <p className="tk-muted tk-prose">
          Semua pasangan teks memenuhi minimal WCAG AA (4,5 : 1). Oranye hanya dipakai sebagai warna
          merek dengan teks gelap, bukan warna status.
        </p>
        <div className="tk-dev-swatch-grid">
          {SWATCH_KONTRAS.map((swatch) => (
            <div key={swatch.nama} className={`tk-dev-swatch ${swatch.kelas}`}>
              <span className="tk-dev-swatch__name">{swatch.nama}</span>
              <span className="tk-dev-swatch__meta">{swatch.pasangan}</span>
              <span className="tk-dev-swatch__meta tk-tabular">{swatch.rasio}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="tk-dev-grid">
        <Card>
          <h2 className="tk-dev-h2">Tombol dan IconButton</h2>
          <div className="tk-dev-stack">
            <div className="tk-dev-row">
              <Button variant="primary">Tombol utama</Button>
              <Button variant="secondary" iconEnd={<ArrowRightIcon size={18} />}>
                Tombol sekunder
              </Button>
              <Button variant="ghost">Tombol ringan</Button>
              <Button variant="primary" disabled>
                Nonaktif
              </Button>
            </div>

            <div className="on-orange tk-dev-orange-band">
              <div className="tk-dev-row">
                <Button variant="primary">Utama di pita oranye</Button>
                <IconButton
                  variant="default"
                  aria-label="Muat ulang contoh"
                  icon={<RefreshIcon size={20} />}
                />
                <IconButton
                  variant="primary"
                  aria-label="Tambah contoh"
                  icon={<PlusIcon size={20} />}
                />
              </div>
            </div>

            <div className="on-dark tk-dev-dark-band">
              <a href="#konten-utama" className="tk-dev-dark-link">
                Tautan latar gelap (cek cincin fokus putih)
              </a>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="tk-dev-h2">Badge dan Chip Urgensi</h2>
          <div className="tk-dev-stack">
            <div className="tk-dev-row">
              <Badge variant="mitra" />
              <Badge variant="solver" />
              <Badge variant="usang" />
              <Badge variant="offline" />
            </div>
            <div className="tk-dev-row">
              <UrgencyChip urgency="rendah" />
              <UrgencyChip urgency="sedang" />
              <UrgencyChip urgency="tinggi" />
            </div>
          </div>
        </Card>
      </div>

      <div className="tk-dev-grid">
        <Card>
          <h2 className="tk-dev-h2">Formulir dan Input Angka</h2>
          <div className="tk-dev-stack">
            <Field id="dev-kandang" label="Nama kandang" hint="Contoh: Kandang Blok Utara" required>
              <TextInput id="dev-kandang" placeholder="Isi nama kandang" />
            </Field>
            <Field id="dev-pakan" label="Pakan terpakai" hint="Memakai inputmode decimal">
              <NumberInput id="dev-pakan" unit="kg" placeholder="0" />
            </Field>
            <Field id="dev-suhu" label="Suhu kandang" error="Nilai suhu harus berupa angka valid.">
              <NumberInput id="dev-suhu" unit="°C" hasError defaultValue="31.5" />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="tk-dev-h2">Akordeon (&lt;details&gt;)</h2>
          <Accordion
            items={[
              {
                id: "dev-faq-1",
                question: "Apakah hitungan pakan tetap jalan tanpa sinyal?",
                answer: (
                  <p>
                    Ya. Memilih bahan, mengisi harga, dan menghitung campuran berjalan langsung di
                    perangkat.
                  </p>
                ),
                defaultOpen: true,
              },
              {
                id: "dev-faq-2",
                question: "Bagaimana urutan toko ditentukan?",
                answer: <p>Urutan murni dari total biaya pakan, bukan dari komisi.</p>,
              },
            ]}
          />
        </Card>
      </div>

      <Card>
        <h2 className="tk-dev-h2">Kondisi layar (Offline, Memuat, Kosong, Galat)</h2>
        <div className="tk-dev-grid">
          <Card variant="warm" as="article">
            <p className="tk-eyebrow">KONDISI OFFLINE</p>
            <div className="tk-dev-stack">
              <Banner variant="offline" title="Sinyal terputus">
                Isian Anda disimpan sebagai draf di ponsel.
              </Banner>
              <Button variant="secondary" disabled>
                Butuh sinyal untuk kirim ke server
              </Button>
            </div>
          </Card>

          <Card as="article">
            <p className="tk-eyebrow">KONDISI MEMUAT (SKELETON)</p>
            <div
              className="tk-dev-stack"
              role="status"
              aria-busy="true"
              aria-label="Contoh tampilan memuat"
            >
              <Skeleton variant="title" />
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="button" />
            </div>
          </Card>

          <Card as="article">
            <p className="tk-eyebrow">KONDISI KOSONG</p>
            <div className="tk-dev-stack">
              <p className="tk-muted">Belum ada catatan harian tersimpan.</p>
              <div>
                <Button variant="primary">Catat hari ini</Button>
              </div>
            </div>
          </Card>

          <Card as="article">
            <p className="tk-eyebrow">KONDISI GALAT SERVER</p>
            <Banner
              variant="error"
              title="Gagal menghubungi server"
              action={
                <Button variant="secondary" iconStart={<RefreshIcon size={18} />}>
                  Coba lagi
                </Button>
              }
            >
              Isian Anda tidak hilang. Coba kirim ulang sebentar lagi.
            </Banner>
          </Card>
        </div>
      </Card>

      <Card>
        <h2 className="tk-dev-h2">Set Ikon SVG Inline</h2>
        <div className="tk-dev-icon-grid">
          {DAFTAR_IKON.map((item) => (
            <div key={item.nama} className="tk-dev-icon-item">
              {item.icon}
              <span>{item.nama}</span>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
