# UI, Tipografi, dan Maskot Kokok

| Commit | Tanggal | Penulis | Model (trailer) | Pesan |
|---|---|---|---|---|
| `66018aa` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(ui): menambahkan font Georama variable self-hosted dan lisensi OFL |
| `0f67d55` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(ui): menambahkan token warna, tipografi, dan jarak di tokens.css |
| `8b5e3e4` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(ui): menambahkan base.css mobile-first dan pengaturan data-motion |
| `4888562` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(ui): membangun komponen UI dasar yang aksesibel |
| `6784003` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(ui): menambahkan tata letak responsif AppShell |
| `3b7841c` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(ui): menambahkan halaman uji komponen /dev/komponen dan tes responsif axe |
| `5880828` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(ui): mengubah sidebar desktop menjadi icon rail yang dapat buka-tutup |
| `cabde57` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(ui): menambah maskot Kokok interaktif dan memoles sidebar rail |
| `b6e3e4b` | 19 Nov | Muhammad Khalifa | tidak tercatat | build(deps): menambah pustaka animasi gsap pada paket web |
| `30bde3f` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(web): menambah transisi halaman gsap, pintasan demo, qr toko, dan rilis |
| `332fc60` | 20 Nov | hasbywira90 | Claude Opus 5.5 | feat(ui): membuat maskot Kokok bervolume 3D dan merapikan tipografi dasar |

## Isi

**Token dan tipografi (`66018aa`, `0f67d55`, `8b5e3e4`).** Font Georama variable (normal dan italic) di-host sendiri dengan lisensi OFL, sehingga masuk precache service worker. Token warna `--tk-*`, ukuran teks dasar 17px, radius kartu 20px, radius pil 999px, dan target sentuh 48px, seluruhnya di `tokens.css`. Layout mobile-first dengan breakpoint 640, 960, dan 1280px. Cincin fokus 3px berlaku untuk latar terang dan gelap.

**Komponen dasar (`4888562`).** Button, IconButton, Badge, UrgencyChip, Card, Field, TextInput, NumberInput (`inputmode` decimal dengan satuan), Banner, Skeleton, AppNav, Accordion berbasis `details`, MotionToggleButton, dan set ikon SVG inline.

**AppShell dan halaman uji (`6784003`, `3b7841c`).** Navigasi responsif: bilah tab bawah lima tab di ponsel (di bawah 640px), satu kolom maksimal 640px di tablet, dan rel navigasi kiri dengan konten maksimal 1120px di laptop (960px ke atas). Halaman `/dev/komponen` hanya dimuat di mode development, sehingga tidak masuk build produksi.

**Sidebar (`5880828`, `cabde57`).** Rel desktop menjadi icon rail selebar 80px yang bisa dibuka ke 240px. Status buka-tutup disimpan di localStorage (`tk.rail`).

**Maskot (`cabde57`, `332fc60`).** Aset transparan Kokok (28 KB WebP) ikut precache PWA. Komponen `KokokMascot` yang bisa diklik dipasang di Beranda, halaman Kokok, dan header brand. Commit `332fc60` menambahkan `KokokFigure`: tepi tebal bertumpuk ala clay, lapisan cahaya-bayangan yang mengikuti siluet, bayangan lantai, gerak melayang, dan kemiringan mengikuti kursor. Model 3D sungguhan belum tersedia, jadi efek ini murni CSS dari gambar 2D.

**Animasi (`b6e3e4b`, `30bde3f`).** Dependensi GSAP dan ScrollTrigger ditambahkan. `30bde3f` memasang transisi antar halaman berbasis GSAP di AppShell serta gradasi latar halus di seluruh halaman aplikasi.

## Keputusan yang tercatat

- Efek 3D maskot dibuat dengan CSS. Bila nanti ada render 3D, cukup ganti `kokok.webp`.
- Tombol "Atur animasi" dihapus pada `cabde57` dan `e9b4d3b`, digantikan kontrol gerak yang lebih sederhana.

---

## Detail perubahan per commit

Bagian ini dibuat dari `git show` untuk setiap commit: jumlah baris berubah per file, status file (baru atau diubah), dan isi pesan commit.

### `66018aa` — feat(ui): menambahkan font Georama variable self-hosted dan lisensi OFL

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 7 file, +115 / -1 baris

**Isi pesan commit:**

> Menyimpan font Georama variable woff2 (normal dan italic, sumbu wdth dan wght utuh) beserta OFL.txt di apps/web/public/fonts agar masuk precache service worker, menambahkan @font-face font-display swap, preload, dan font-stretch 100% pada body.
> Fase 1

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/index.html` | 1 | 0 | diubah |
| `apps/web/public/fonts/OFL.txt` | 93 | 0 | baru |
| `apps/web/public/fonts/georama-italic-var.woff2` | - | - | baru |
| `apps/web/public/fonts/georama-var.woff2` | - | - | baru |
| `apps/web/src/main.tsx` | 1 | 0 | diubah |
| `apps/web/src/styles/fondasi.css` | 2 | 1 | diubah |
| `apps/web/src/styles/fonts.css` | 18 | 0 | baru |


### `0f67d55` — feat(ui): menambahkan token warna, tipografi, dan jarak di tokens.css

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 3 file, +61 / -20 baris

**Isi pesan commit:**

> Menetapkan seluruh token warna usulan (--tk-*), ukuran teks dasar 17px, radius kartu 20px, radius pil 999px, tinggi target sentuh 48px, dan jarak antar bagian terpusat di tokens.css tanpa hex di luar berkas tersebut.
> Fase 1

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/src/main.tsx` | 1 | 0 | diubah |
| `apps/web/src/styles/fondasi.css` | 0 | 20 | diubah |
| `apps/web/src/styles/tokens.css` | 60 | 0 | baru |


### `8b5e3e4` — feat(ui): menambahkan base.css mobile-first dan pengaturan data-motion

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 4 file, +319 / -0 baris

**Isi pesan commit:**

> Menyediakan reset ringan, font-stretch 100%, line-height 1.55, tautan lewati ke konten, cincin fokus 3px untuk latar terang/gelap, breakpoint mobile-first (640/960/1280px), serta utilitas data-motion yang tersimpan di localStorage tk.motion dan menghormati prefers-reduced-motion.
> Fase 1

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/src/lib/motion.test.ts` | 45 | 0 | baru |
| `apps/web/src/lib/motion.ts` | 90 | 0 | baru |
| `apps/web/src/main.tsx` | 4 | 0 | diubah |
| `apps/web/src/styles/base.css` | 180 | 0 | baru |


### `4888562` — feat(ui): membangun komponen UI dasar yang aksesibel

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 16 file, +1274 / -3 baris

**Isi pesan commit:**

> Menambahkan Button, IconButton, Badge, UrgencyChip, Card, Field, TextInput, NumberInput (inputmode decimal dan satuan), Banner, Skeleton, AppNav, Accordion berbasis details, MotionToggleButton, set ikon SVG inline, ui.css tanpa hex langsung, dan tes unit.
> Fase 1

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/src/components/ui/Accordion.tsx` | 32 | 0 | baru |
| `apps/web/src/components/ui/AppNav.tsx` | 51 | 0 | baru |
| `apps/web/src/components/ui/Badge.tsx` | 27 | 0 | baru |
| `apps/web/src/components/ui/Banner.tsx` | 34 | 0 | baru |
| `apps/web/src/components/ui/Button.tsx` | 33 | 0 | baru |
| `apps/web/src/components/ui/Card.tsx` | 23 | 0 | baru |
| `apps/web/src/components/ui/Field.tsx` | 85 | 0 | baru |
| `apps/web/src/components/ui/IconButton.tsx` | 23 | 0 | baru |
| `apps/web/src/components/ui/Icons.tsx` | 201 | 0 | baru |
| `apps/web/src/components/ui/MotionToggleButton.tsx` | 26 | 0 | baru |
| `apps/web/src/components/ui/Skeleton.tsx` | 12 | 0 | baru |
| `apps/web/src/components/ui/UrgencyChip.tsx` | 25 | 0 | baru |
| `apps/web/src/components/ui/index.ts` | 39 | 0 | baru |
| `apps/web/src/components/ui/ui.css` | 529 | 0 | baru |
| `apps/web/src/components/ui/ui.test.tsx` | 124 | 0 | baru |
| `apps/web/src/lib/teks.ts` | 10 | 3 | diubah |


### `6784003` — feat(ui): menambahkan tata letak responsif AppShell

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 8 file, +436 / -339 baris

**Isi pesan commit:**

> Menambahkan AppShell responsif mobile-first (ponsel <640px bilah tab bawah 5 tab dengan safe-area, tablet 640-959px satu kolom maks 640px, laptop >=960px rel navigasi vertikal kiri dengan konten maks 1120px, 100dvh), memperbarui FondasiPage dan PwaStatusBar memakai komponen UI dasar, serta menghapus fondasi.css.
> Fase 1

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/src/App.tsx` | 6 | 1 | diubah |
| `apps/web/src/components/PwaStatusBar.tsx` | 17 | 17 | diubah |
| `apps/web/src/components/layout/AppShell.css` | 210 | 0 | baru |
| `apps/web/src/components/layout/AppShell.tsx` | 92 | 0 | baru |
| `apps/web/src/main.tsx` | 2 | 1 | diubah |
| `apps/web/src/pages/FondasiPage.tsx` | 72 | 96 | diubah |
| `apps/web/src/pages/ModulSegeraPage.tsx` | 37 | 0 | baru |
| `apps/web/src/styles/fondasi.css` | 0 | 224 | diubah |


### `3b7841c` — feat(ui): menambahkan halaman uji komponen /dev/komponen dan tes responsif axe

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 7 file, +757 / -13 baris

**Isi pesan commit:**

> Menambahkan halaman uji /dev/komponen khusus pengembangan (dimuat kondisional dengan import.meta.env.DEV sehingga tidak masuk build produksi maupun precache), menampilkan semua komponen, kondisi layar (offline, memuat, kosong, galat), serta tabel kontras warna, lengkap dengan tes Playwright 5 viewport (360/390/768/1280/1440px), audit @axe-core/playwright, dan verifikasi Georama offline.
> Fase 1

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/e2e/appshell.spec.ts` | 98 | 0 | baru |
| `apps/web/e2e/dev-komponen.spec.ts` | 93 | 0 | baru |
| `apps/web/e2e/offline.spec.ts` | 27 | 4 | diubah |
| `apps/web/playwright.config.ts` | 30 | 9 | diubah |
| `apps/web/src/App.tsx` | 14 | 0 | diubah |
| `apps/web/src/pages/dev/KomponenPage.css` | 165 | 0 | baru |
| `apps/web/src/pages/dev/KomponenPage.tsx` | 330 | 0 | baru |


### `5880828` — feat(ui): mengubah sidebar desktop menjadi icon rail yang dapat buka-tutup

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 9 file, +367 / -26 baris

**Isi pesan commit:**

> Mengubah rel navigasi samping (>=960px) menjadi icon rail selebar 80px yang dapat dibuka ke 240px (disimpan di localStorage tk.rail). Saat mengecil menjadi ikon 48x48, nama menu, Profil kandang, tombol toggle, dan Atur animasi tampil sebagai tooltip saat hover atau fokus papan ketik.
> Fase 6

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/e2e/appshell.spec.ts` | 38 | 0 | diubah |
| `apps/web/src/components/layout/AppShell.css` | 84 | 2 | diubah |
| `apps/web/src/components/layout/AppShell.tsx` | 101 | 17 | diubah |
| `apps/web/src/components/ui/AppNav.tsx` | 16 | 3 | diubah |
| `apps/web/src/components/ui/Icons.tsx` | 29 | 0 | diubah |
| `apps/web/src/components/ui/MotionToggleButton.tsx` | 16 | 4 | diubah |
| `apps/web/src/components/ui/index.ts` | 3 | 0 | diubah |
| `apps/web/src/components/ui/ui.css` | 79 | 0 | diubah |
| `apps/web/src/styles/tokens.css` | 1 | 0 | diubah |


### `cabde57` — feat(ui): menambah maskot Kokok interaktif dan memoles sidebar rail

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 12 file, +359 / -89 baris

**Isi pesan commit:**

> Menambahkan aset transparan maskot Kokok (28 KB WebP, ikut precache PWA) beserta komponen interaktif KokokMascot yang bisa diklik di Beranda, halaman Kokok, dan header brand. Menghapus tombol Atur animasi, menghilangkan transisi lebar berat pada sidebar, dan memindahkan tombol buka/tutup menu ke bawah Profil kandang.
> Fase 6

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/e2e/appshell.spec.ts` | 20 | 7 | diubah |
| `apps/web/e2e/toko-offline.spec.ts` | 15 | 9 | diubah |
| `apps/web/public/images/kokok.webp` | - | - | baru |
| `apps/web/src/components/layout/AppShell.css` | 35 | 22 | diubah |
| `apps/web/src/components/layout/AppShell.tsx` | 55 | 45 | diubah |
| `apps/web/src/components/ui/KokokMascot.tsx` | 84 | 0 | baru |
| `apps/web/src/components/ui/index.ts` | 1 | 0 | diubah |
| `apps/web/src/components/ui/ui.css` | 131 | 0 | diubah |
| `apps/web/src/pages/FondasiPage.tsx` | 5 | 0 | diubah |
| `apps/web/src/pages/KokokPage.tsx` | 10 | 3 | diubah |
| `apps/web/src/pages/dev/KomponenPage.tsx` | 2 | 2 | diubah |
| `apps/web/vite.config.ts` | 1 | 1 | diubah |


### `b6e3e4b` — build(deps): menambah pustaka animasi gsap pada paket web

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 2 file, +19 / -0 baris

**Isi pesan commit:**

> Menambahkan dependensi gsap beserta plugin ScrollTrigger untuk animasi gulir dan transisi antar halaman.
> Fase 7

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/package.json` | 1 | 0 | diubah |
| `package-lock.json` | 18 | 0 | diubah |


### `30bde3f` — feat(web): menambah transisi halaman gsap, pintasan demo, qr toko, dan rilis

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 12 file, +355 / -6 baris

**Isi pesan commit:**

> Menambahkan animasi transisi antar halaman berbasis GSAP pada AppShell, gradasi latar halus di seluruh halaman aplikasi, tombol muat data contoh demo juri 760 ekor di Beranda, panel kartu QR dan tautan rujukan berkode ?src di halaman Toko, pemisahan chunk bundle produksi, serta berkas deploy Docker Compose dan cadangan SQLite.
> Fase 7

| File | + | − | Status |
|---|---:|---:|---|
| `Dockerfile` | 37 | 0 | baru |
| `apps/web/src/App.tsx` | 15 | 2 | diubah |
| `apps/web/src/components/layout/AppShell.css` | 6 | 0 | diubah |
| `apps/web/src/components/layout/AppShell.tsx` | 8 | 3 | diubah |
| `apps/web/src/pages/FondasiPage.tsx` | 77 | 1 | diubah |
| `apps/web/src/pages/TokoPage.css` | 43 | 0 | diubah |
| `apps/web/src/pages/TokoPage.tsx` | 81 | 0 | diubah |
| `apps/web/src/test/setup.ts` | 5 | 0 | diubah |
| `apps/web/vite.config.ts` | 14 | 0 | diubah |
| `deploy/backup-sqlite.sh` | 14 | 0 | baru |
| `deploy/nginx.conf` | 19 | 0 | baru |
| `docker-compose.yml` | 36 | 0 | baru |


### `332fc60` — feat(ui): membuat maskot Kokok bervolume 3D dan merapikan tipografi dasar

- **Tanggal:** 2026-11-20 · **Penulis:** hasbywira90 · **Model:** Claude Opus 5.5
- **Ringkasan:** 7 file, +320 / -43 baris

**Isi pesan commit:**

> Menambahkan komponen KokokFigure yang memberi kesan 3D pada maskot Kokok: tepi tebal bertumpuk ala clay, lapisan cahaya-bayangan yang mengikuti siluet, bayangan lantai, gerak melayang, kemiringan mengikuti kursor, serta lingkaran matahari opsional di belakangnya. KokokMascot kini memakai figur ini, berdiri bebas tanpa kotak latar, dengan label nama berbentuk stiker dan ukuran baru xl untuk hero.
> Menambah token tipografi display (ukuran, jarak huruf, lebar huruf Georama), text-wrap balance dan pretty, penghalusan font, ikon baru (SproutCoin, Stethoscope, MapPin, LogOut), serta navigasi bawah yang menyesuaikan jumlah tab.

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/src/components/ui/Icons.tsx` | 41 | 0 | diubah |
| `apps/web/src/components/ui/KokokFigure.tsx` | 57 | 0 | baru |
| `apps/web/src/components/ui/KokokMascot.tsx` | 22 | 14 | diubah |
| `apps/web/src/components/ui/index.ts` | 5 | 0 | diubah |
| `apps/web/src/components/ui/ui.css` | 174 | 28 | diubah |
| `apps/web/src/styles/base.css` | 15 | 0 | diubah |
| `apps/web/src/styles/tokens.css` | 6 | 1 | diubah |

