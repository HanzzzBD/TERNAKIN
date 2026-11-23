# Landing Page

| Commit | Tanggal | Penulis | Model (trailer) | Pesan |
|---|---|---|---|---|
| `68bfae1` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(landing): menambah meta Open Graph, konten, dan komponen landing |
| `d432ad9` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(landing): membangun landing page 10 bagian, privasi, dan tes E2E |
| `e9b4d3b` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(landing): menggabung kartu toko-pilot, perbaiki skip-link, dan pasang Kokok |
| `292f700` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(landing): mengubah navbar jadi floating pill dan gradasi latar menyatu |
| `76d9c4f` | 19 Nov | Muhammad Khalifa | tidak tercatat | fix(landing): mencegah bayangan bawah tombol Buka aplikasi terpotong di pill |
| `68e6e8d` | 20 Nov | hasbywira90 | Claude Opus 5.5 | feat(landing): menonjolkan Kokok, menambah alur per peran, dan merapikan navbar |
| `d426d14` | 23 Nov | hasbywira90 | Claude Sonnet 5.5 | fix(landing): melonggarkan strip kata kunci dan membuat aksen judul investasi satu strip terbaca |
| `80dfe02` | 23 Nov | hasbywira90 | tidak tercatat | Revert "fix(landing): melonggarkan strip kata kunci dan membuat aksen judul investasi satu strip terbaca" |
| `bea6f2e` | 23 Nov | hasbywira90 | Claude Opus 5.5 | setup deployv2.1 |

## Isi

**Konten dan meta (`68bfae1`).** Meta Open Graph dan fallback `noscript` di `index.html`. Helper `wa.me` memakai `VITE_WA_NUMBER` dan tidak memakai nomor palsu. Berkas konten landing dan bukti lapangan, serta komponen `PhoneFrame`.

**Landing 10 bagian (`d432ad9`).** Landing responsif 360 sampai 1440px di rute `/`, dengan header menempel, tombol Atur animasi, marquee dua arah yang berhenti saat animasi dimatikan, dan halaman `/privasi`. Testimoni dan klaim tidak dibuat-buat. Tes E2E landing ditambahkan.

**Toko dan bukti (`e9b4d3b`).** Bagian Toko pakan dan Bukti dari lapangan digabung menjadi satu grid dua kolom. Nama kelas skip-link diperbaiki, karena tautan "Lewati ke konten" sebelumnya tampil di tampilan normal. Kokok dipasang di landing.

**Navbar pil (`292f700`, `76d9c4f`).** Header landing dan halaman privasi menjadi floating pill yang awalnya hanya menampilkan maskot dan nama "ternakin.", lalu melebar saat di-hover atau difokuskan. Animasi ScrollTrigger ditambahkan. `76d9c4f` menambah ruang padding vertikal agar bayangan bawah tombol "Buka aplikasi" tidak terpotong.

**Kokok dan alur per peran (`68e6e8d`).** Hero berisi panggung Kokok 3D besar di depan lingkaran matahari. Pil "Baru" mengarah ke Modul 5. Popup chatbot Kokok di pojok kanan bawah dengan sapaan otomatis dan pertanyaan cepat. Section "Alur Ternakin" dengan tab peran (peternak, pemodal, mitra), menggantikan bagian "Cara kerja" lama. Section Modul 05 berlatar hijau tua. Navbar ponsel dibuat sebagai bilah penuh yang tidak mendorong konten. Teks hero, modul, kepercayaan, toko, dan FAQ diringkas.

**Strip kata kunci (`d426d14`, `80dfe02`).** `d426d14` melonggarkan jarak strip oranye dan membuat aksen judul investasi "hasil dibagi." menjadi satu blok strip di latar hijau gelap, agar terbaca. `80dfe02` me-revert commit itu. Efek bersihnya nol, sehingga kode landing kembali ke kondisi `68e6e8d`.

**Strip, aksen investasi, dan popup Kokok (`bea6f2e`).** Judul commit ini sama dengan commit deploy `34d2d69`, tetapi isinya perbaikan tampilan landing.
- Strip kata kunci menjadi satu baris dengan animasi loop yang mulus. Daftar kata di `landingContent.ts` dipangkas (8 baris dihapus).
- Aksen judul investasi "hasil dibagi." menjadi blok kuning yang terbaca. Label kartu contoh tidak lagi menutupi isi, dan tinggi kartu jaminan disamakan.
- Di popup Kokok, saat jawaban panjang, hanya log pesan yang menyusut. Tombol pertanyaan cepat dan kolom ketik tidak lagi terpotong.

## Keputusan yang tercatat

- Navbar ponsel dibuka hanya saat diketuk, tidak saat kursor lewat. Menu melayang di atas konten agar tidak mendorong halaman.
- Teks landing dipangkas agar pengguna tidak kebingungan. Klaim dan testimoni tidak dibuat.
- Commit `d426d14` dibatalkan dengan revert, bukan perbaikan baru. Perbaikan strip dan aksen investasi kemudian dikerjakan ulang di `bea6f2e`.

---

## Detail perubahan per commit

Bagian ini dibuat dari `git show` untuk setiap commit: jumlah baris berubah per file, status file (baru atau diubah), dan isi pesan commit.

### `68bfae1` — feat(landing): menambah meta Open Graph, konten, dan komponen landing

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 9 file, +541 / -0 baris

**Isi pesan commit:**

> Menambahkan meta Open Graph dan fallback noscript pada index.html, tipe VITE_WA_NUMBER dan helper wa.me tim tanpa nomor palsu, ikon navigasi SVG, berkas konten landing dan bukti lapangan kosong, serta komponen PhoneFrame dan FieldProof.
> Fase 6

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/index.html` | 24 | 0 | diubah |
| `apps/web/src/components/landing/FieldProof.tsx` | 53 | 0 | baru |
| `apps/web/src/components/landing/PhoneFrame.tsx` | 127 | 0 | baru |
| `apps/web/src/components/ui/Icons.tsx` | 28 | 0 | diubah |
| `apps/web/src/components/ui/index.ts` | 3 | 0 | diubah |
| `apps/web/src/content/buktiLapangan.ts` | 16 | 0 | baru |
| `apps/web/src/content/landingContent.ts` | 270 | 0 | baru |
| `apps/web/src/lib/wa.ts` | 12 | 0 | diubah |
| `apps/web/src/vite-env.d.ts` | 8 | 0 | diubah |


### `d432ad9` — feat(landing): membangun landing page 10 bagian, privasi, dan tes E2E

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 8 file, +1845 / -4 baris

**Isi pesan commit:**

> Membangun landing page responsif 360-1440px di rute / dengan header menempel, tombol Atur animasi, marquee dua arah yang berhenti saat animasi mati, sepuluh bagian tanpa klaim atau testimoni buatan, halaman /privasi, serta unit test dan Playwright E2E + axe.
> Fase 6

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/e2e/landing.spec.ts` | 102 | 0 | baru |
| `apps/web/playwright.config.ts` | 2 | 1 | diubah |
| `apps/web/src/App.test.tsx` | 6 | 2 | diubah |
| `apps/web/src/App.tsx` | 4 | 1 | diubah |
| `apps/web/src/pages/LandingPage.css` | 994 | 0 | baru |
| `apps/web/src/pages/LandingPage.test.tsx` | 85 | 0 | baru |
| `apps/web/src/pages/LandingPage.tsx` | 557 | 0 | baru |
| `apps/web/src/pages/PrivasiPage.tsx` | 95 | 0 | baru |


### `e9b4d3b` — feat(landing): menggabung kartu toko-pilot, perbaiki skip-link, dan pasang Kokok

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 6 file, +189 / -100 baris

**Isi pesan commit:**

> Menggabungkan bagian Toko pakan dan Bukti dari lapangan menjadi satu section grid dua kolom kiri-kanan, memperbaiki bug nama kelas skip-link agar Lewati ke konten tidak muncul di tampilan normal, menghapus tombol Atur animasi, serta memasang maskot Kokok interaktif pada header, hero, kepercayaan, dan footer.
> Fase 6

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/e2e/landing.spec.ts` | 30 | 15 | diubah |
| `apps/web/src/components/landing/FieldProof.tsx` | 12 | 10 | diubah |
| `apps/web/src/pages/LandingPage.css` | 40 | 3 | diubah |
| `apps/web/src/pages/LandingPage.test.tsx` | 14 | 11 | diubah |
| `apps/web/src/pages/LandingPage.tsx` | 79 | 57 | diubah |
| `apps/web/src/pages/PrivasiPage.tsx` | 14 | 4 | diubah |


### `292f700` — feat(landing): mengubah navbar jadi floating pill dan gradasi latar menyatu

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 5 file, +672 / -175 baris

**Isi pesan commit:**

> Mengubah header landing dan halaman privasi menjadi floating pill yang awalnya hanya menampilkan maskot Kokok dan ternakin., lalu melebar dari kiri ke kanan saat di-hover atau difokuskan. Menambahkan animasi GSAP ScrollTrigger di seluruh bagian landing serta menyatukan latar belakang antar bagian dengan gradasi kontinu.
> Fase 7

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/e2e/landing.spec.ts` | 29 | 14 | diubah |
| `apps/web/src/lib/gsapAnimations.ts` | 280 | 0 | baru |
| `apps/web/src/pages/LandingPage.css` | 175 | 76 | diubah |
| `apps/web/src/pages/LandingPage.tsx` | 101 | 65 | diubah |
| `apps/web/src/pages/PrivasiPage.tsx` | 87 | 20 | diubah |


### `76d9c4f` — fix(landing): mencegah bayangan bawah tombol Buka aplikasi terpotong di pill

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 1 file, +6 / -1 baris

**Isi pesan commit:**

> Menambahkan ruang padding vertikal pada kontainer dalam floating pill agar bayangan bawah 4px tombol Buka aplikasi tampil utuh.
> Fase 7

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/src/pages/LandingPage.css` | 6 | 1 | diubah |


### `68e6e8d` — feat(landing): menonjolkan Kokok, menambah alur per peran, dan merapikan navbar

- **Tanggal:** 2026-11-20 · **Penulis:** hasbywira90 · **Model:** Claude Opus 5.5
- **Ringkasan:** 11 file, +2778 / -203 baris

**Isi pesan commit:**

> Memperbarui landing page agar maskot lebih menonjol, alur website jelas, dan teks lebih ringkas.
> - Hero: panggung Kokok 3D berukuran besar di depan lingkaran matahari, dikelilingi gelembung obrolan, ubin, dan telur yang melayang; Kokok miring mengikuti kursor. Pil pengumuman "Baru" mengarah ke Modul 5.
> - Popup chatbot Kokok mengambang di pojok kanan bawah: sapaan otomatis, pertanyaan cepat yang jawabannya diambil dari FAQ, dan cerita gejala ayam diteruskan ke halaman Tanya Kokok sebagai draf.
> - Section Alur Ternakin dengan tab peran (peternak, pemodal, mitra); setiap langkah menaut langsung ke halaman aplikasi. Menggantikan bagian Cara kerja lama.
> - Section Modul 05 investasi ternak berlatar hijau tua dengan kartu peluang contoh, poin kepercayaan, dan catatan risiko.
> - Navbar: tombol Masuk atau status akun dengan Keluar, menu ponsel berupa bilah penuh dengan tombol menu, terbuka hanya saat diketuk, melayang di atas konten, tertutup saat mengetuk di luar, dan menyingkir saat menggulir ke bawah. Di desktop tetap pil yang melebar saat kursor lewat.
> - Tipografi judul lebih tegas (aksen stiker dan stabilo menggantikan huruf miring), kartu dan tombol bertepi tebal, serta teks hero, modul, kepercayaan, toko, sumber data, dan FAQ diringkas.

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/src/components/landing/AlurWebsite.tsx` | 177 | 0 | baru |
| `apps/web/src/components/landing/InvestasiHighlight.tsx` | 121 | 0 | baru |
| `apps/web/src/components/landing/KokokChatPopup.css` | 462 | 0 | baru |
| `apps/web/src/components/landing/KokokChatPopup.tsx` | 332 | 0 | baru |
| `apps/web/src/components/landing/KokokHeroStage.tsx` | 103 | 0 | baru |
| `apps/web/src/content/alurContent.ts` | 169 | 0 | baru |
| `apps/web/src/content/landingContent.ts` | 84 | 59 | diubah |
| `apps/web/src/lib/gsapAnimations.ts` | 22 | 9 | diubah |
| `apps/web/src/pages/LandingPage.css` | 1108 | 47 | diubah |
| `apps/web/src/pages/LandingPage.test.tsx` | 68 | 1 | diubah |
| `apps/web/src/pages/LandingPage.tsx` | 132 | 87 | diubah |


### `d426d14` — fix(landing): melonggarkan strip kata kunci dan membuat aksen judul investasi satu strip terbaca

- **Tanggal:** 2026-11-23 · **Penulis:** hasbywira90 · **Model:** Claude Sonnet 5.5
- **Ringkasan:** 1 file, +14 / -5 baris

**Isi pesan commit:**

> - Strip oranye: memperlebar jarak antar kata, antar baris, dan padding, serta memberi margin atas/bawah agar tidak menempel ke hero dan section sekitarnya
> - Judul modul investasi: aksen 'hasil dibagi.' di latar hijau gelap kini satu blok strip penuh, sebelumnya teks gelap hanya bergaris bawah tipis sehingga sulit dibaca

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/src/pages/LandingPage.css` | 14 | 5 | diubah |


### `80dfe02` — Revert "fix(landing): melonggarkan strip kata kunci dan membuat aksen judul investasi satu strip terbaca"

- **Tanggal:** 2026-11-23 · **Penulis:** hasbywira90 · **Model:** tidak tercatat
- **Ringkasan:** 1 file, +5 / -14 baris

**Isi pesan commit:**

> This reverts commit d426d14dfa1f3102f2110ace54ccdf0e5a688a9d.

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/src/pages/LandingPage.css` | 5 | 14 | diubah |


### `bea6f2e` — setup deployv2.1

- **Tanggal:** 2026-11-23 · **Penulis:** hasbywira90 · **Model:** Claude Opus 5.5
- **Ringkasan:** 4 file, +44 / -53 baris

**Isi pesan commit:**

> - Kokok: hanya log pesan yang menyusut saat jawaban panjang, agar tombol cepat dan kolom ketik tidak terpotong
> - Landing: strip kata kunci jadi satu baris dengan loop animasi yang mulus
> - Investasi: aksen 'hasil dibagi.' jadi blok kuning terbaca, label kartu contoh tidak lagi menutupi isi, kartu jaminan disamakan tingginya

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/src/components/landing/KokokChatPopup.css` | 14 | 1 | diubah |
| `apps/web/src/content/landingContent.ts` | 0 | 8 | diubah |
| `apps/web/src/pages/LandingPage.css` | 26 | 28 | diubah |
| `apps/web/src/pages/LandingPage.tsx` | 4 | 16 | diubah |
