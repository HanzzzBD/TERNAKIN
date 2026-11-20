# Log Vibe Coding — Hasby

| | |
|---|---|
| **Anggota tim** | Hasby (akun git `hasbywira90`) |
| **Proyek** | Ternakin — asisten digital peternak ayam (PWA) |
| **Branch** | `Dev-Website` |
| **Periode** | 19–20 November 2026 |
| **Alat AI** | Claude Code (model Claude Opus 5.5) sebagai ekstensi VS Code |
| **Cakupan** | Aplikasi web `apps/web` (React + Vite + TypeScript) |

## Ringkasan

Selama dua hari, Hasby memberi arahan kepada AI dalam bahasa sehari-hari, sering disertai tangkapan layar dari browser. AI membaca kode, menulis perubahan, menjalankan tes, lalu memeriksa hasilnya langsung di browser lewat tangkapan layar otomatis dan audit aksesibilitas. Hasby menilai hasilnya, memberi koreksi, dan mengambil keputusan produk.

Hasil utama:

1. Landing page dirapikan: maskot Kokok tampil bervolume 3D di hero, ada popup chatbot Kokok, dan tipografi lebih tegas.
2. Fitur baru **Modul 5 — Investasi ternak** (prototipe): akun demo pengguna dan peternak, peluang investasi di peternak terdekat, profil peternakan, dan aturan wajib pemeriksaan dokter hewan mitra.
3. Kokok merujuk kasus urgensi tinggi ke **dokter hewan mitra**.
4. Section **Alur Ternakin** per peran di landing page, navbar ponsel yang rapi, dan tampilan responsif di semua halaman.
5. Halaman Pakan disederhanakan (input teks bebas menyatu ke baris "Lainnya") dan teks di landing dipangkas.

Hasil akhir: 6 commit di branch `Dev-Website`, 29 tes unit lolos, lint bersih, dan 0 pelanggaran aksesibilitas (axe) di 12 halaman × 6 lebar layar.

## Cara kerja manusia dan AI

1. **Hasby** menulis permintaan, kadang dengan tangkapan layar bagian yang bermasalah.
2. **AI** membaca kode dan dokumen terkait (PRD, SDD, tes yang ada) sebelum mengubah apa pun.
3. Untuk keputusan yang menyangkut produk atau hukum, **AI bertanya dulu** kepada Hasby (contoh: cakupan fitur investasi, nama mitra OJK, peran dokter hewan).
4. **AI** menulis kode dan tes, lalu menjalankan typecheck, lint, dan tes unit.
5. **AI** membuka halaman di browser (Microsoft Edge lewat Playwright), mengambil tangkapan layar desktop dan ponsel, dan menjalankan audit aksesibilitas axe.
6. **Hasby** mencoba sendiri di `localhost`, lalu memberi koreksi lanjutan.

---

## Log per permintaan

### 1. Merapikan landing, popup chatbot Kokok, maskot menonjol — 19 Nov 2026

> **Prompt Hasby:** "coba kamu rapihkan dan berikan chatbot kokok ada pop up nya juga di halaman buat maskot juga menonjol seperti refrensi https://omongin.id/, jangan model 2d banyak tipografi yang masih bisa di perbaiki"

**Yang dikerjakan AI:**
- Mempelajari situs referensi omongin.id lewat CSS-nya: ilustrasi clay 3D dengan sisi tebal, elemen melayang, tombol bertepi tebal, dan judul display rapat.
- Membuat komponen `KokokFigure`: kesan 3D dari gambar Kokok yang ada lewat tepi tebal bertumpuk, lapisan cahaya-bayangan yang dipotong mengikuti siluet, bayangan lantai, gerak melayang, dan kemiringan mengikuti kursor.
- Membuat panggung hero (`KokokHeroStage`): Kokok besar di depan lingkaran matahari, dikelilingi gelembung obrolan, ubin ikon, dan telur yang melayang.
- Membuat popup chatbot (`KokokChatPopup`) dengan sapaan otomatis, pertanyaan cepat yang jawabannya diambil dari FAQ, dan cerita gejala yang diteruskan ke halaman Tanya Kokok.
- Memperbaiki tipografi: judul lebih besar dan tebal, aksen huruf miring diganti stiker dan stabilo, label pil, dan inline style dibersihkan.

**Keputusan:** model 3D sungguhan belum tersedia, jadi efek 3D dibuat dengan CSS. Bila nanti ada aset render 3D, cukup ganti `kokok.webp`.

**Masalah yang ditemukan dan diperbaiki:**
- Label pertanyaan cepat sama persis dengan pertanyaan FAQ sehingga tes gagal. Labelnya dibuat berbeda.
- Axe menemukan dua landmark *banner*, karena popup memakai `<header>`. Diganti `<div>`.
- Judul hero terlalu besar dan gelembung menutupi Kokok. Ukuran dan posisi disesuaikan setelah dicek di tangkapan layar.

### 2. Fitur baru Modul 5 — Investasi ternak — 20 Nov 2026

> **Prompt Hasby:** "Saya ingin membuat fitur baru yang akan di highlight di website kami: Fitur baru ini adalah investasi ternak, Modul 5 di Ternakin. Siapa pun bisa menjadi pengguna biasa dan menitipkan modal ke peternak ayam di dekatnya. … Ternakin tidak memegang uangnya. Pendanaan berjalan lewat penyelenggara berizin OJK … Fitur ini dimulai dari ayam pedaging. Peran sekarang ada empat, tanpa peran investor: Pengguna, Peternak, Toko pakan mitra, Dokter hewan mitra. … dugaan saya perannya ada dua. Pertama, ia menjadi tujuan rujukan Kokok saat urgensi tinggi … Kedua, ia memberi verifikasi atau pemeriksaan kesehatan kandang …"

**Pertanyaan AI sebelum membangun, dan jawaban Hasby:**

| Pertanyaan | Jawaban |
|---|---|
| Seberapa jauh dibangun? | Landing dan prototipe, dengan login serta akun demo untuk peternak dan pengguna. Toko pakan dan dokter hewan lewat WhatsApp dulu; dokter hewan juga menjadi tujuan rujukan Kokok. |
| Sudah ada mitra OJK? | Tidak diisi. AI memakai kalimat aman: "akan berjalan lewat penyelenggara berizin OJK yang sedang disiapkan", tanpa nama atau logo. |
| Peran dokter hewan | Dua peran, dan **pemeriksaan kandang wajib** sebelum peluang dibuka. |

**Yang dikerjakan AI:**
- Landing: section "Modul 05" berlatar hijau tua, kartu peluang contoh, tiga poin kepercayaan, dan catatan risiko.
- Halaman baru: `/app/masuk` (akun demo), `/app/investasi` (peluang diurutkan dari kandang terdekat dengan rumus haversine, wilayah Bandung Raya atau lokasi perangkat), `/app/investasi/:id` (detail kandang, hasil pemeriksaan dokter hewan, grafik catatan harian, risiko, simulasi minat titip modal), dan `/app/peternak` (izin tampilkan data, syarat dibuka, formulir ajuan).
- Kokok: saat urgensi tinggi tampil daftar dokter hewan mitra dengan tombol kirim ringkasan kasus lewat WhatsApp.

**Keputusan kepatuhan:**
- Tidak ada uang yang berpindah. Tombol hanya "mencatat minat (simulasi)".
- Tidak ada angka imbal hasil yang dijanjikan; yang ditampilkan hanya rumus porsi (porsi modal × bagian pemodal × laba bersih).
- Semua nama peternak, kandang, dokter hewan, dan angka diberi label **contoh**. Nomor WhatsApp dokter hewan dibiarkan kosong agar tidak memakai nomor palsu.
- Pengguna wajib mencentang pernyataan risiko sebelum mencatat minat.

**Masalah yang ditemukan dan diperbaiki:** urutan heading di daftar peluang (axe), chip akun yang menimpa logo di ponsel, dan kotak fakta kartu yang menyempit.

### 3. Menjalankan aplikasi — 20 Nov 2026

> **Prompt Hasby:** "coba jalankan"

AI menjalankan `npm run dev`: web di `localhost:5173` dan API di `localhost:3000` (Kokok memakai penyedia LLM tiruan atau *mock*), lalu memastikan keduanya merespons.

### 4. Maskot tanpa kotak latar dan alur website yang jelas — 20 Nov 2026

> **Prompt Hasby (dengan tangkapan layar maskot di dalam kotak putih):** "saya ingin setiap ada gambar seperti ini di rapihkan jangan ada background buat rapih seperti halaman hero saya juga ingin agar website jelas alurnya di landing page juga berikan alur website nya agar jelas"

**Yang dikerjakan AI:**
- Semua maskot Kokok berdiri bebas tanpa kotak, di depan lingkaran matahari kecil seperti hero, dengan label nama berbentuk stiker.
- Section baru **Alur Ternakin** dengan tab peran (peternak, pemodal, mitra). Setiap langkah menaut langsung ke halaman aplikasi. Tab bisa dipindah dengan klik atau tombol panah keyboard.

### 5. Login demo, keluar akun, navbar ponsel, responsif — 20 Nov 2026

> **Prompt Hasby (dengan tangkapan layar menu ponsel yang berantakan):** "untuk sekarang saya ingin kamu tambahkan login untuk peternak dan user siapkan akun demo masing masing ini saat saya sudah coba masuk saya tidak bisa keluar dan mencoba akun lain, perbaiki juga navbar tampilan mobile dan buat website saat ini responsive"

**Yang dikerjakan AI:**
- Halaman Masuk: kartu akun demo dengan masuk sekali klik, kartu "Sedang masuk sebagai…" dengan tombol Keluar, dan menu akun di bilah atas (Ganti akun, Keluar).

  | Akun demo | Email | Sandi |
  |---|---|---|
  | Pengguna (Rani) | `pengguna@demo.ternakin.id` | `demo1234` |
  | Peternak (Pak Dedi) | `peternak@demo.ternakin.id` | `demo1234` |

- Navbar ponsel: bilah penuh dengan tombol menu, tautan tersusun vertikal, dan tombol akun.
- Sapuan responsif otomatis: 12 halaman × 6 lebar layar (360–1440px) diperiksa dari luberan horizontal dan pelanggaran axe. Hasilnya 0 masalah.

### 6. Peternak hanya melihat peternakannya sendiri — 20 Nov 2026

> **Prompt Hasby:** "untuk di dalam akun peternak bagian investasi tuh langsung isi profil peternakan dia tidak usah ada peternakan orang lain jadi peternak tida bisa investasi ke peternak lain"

**Yang dikerjakan AI:**
- Untuk peternak, tab Investasi langsung membuka `/app/peternak`. Daftar peluang dan kandang peternak lain dialihkan ke sana, dan formulir titip modal tidak pernah tampil untuk peternak.
- Profil, pemeriksaan dokter hewan, dan data catatan harian dipisah menjadi komponen bersama (`KandangDetail`) agar tampilan peternak dan pengguna selalu sama.

### 7. Baris "Lainnya" di Pakan, navbar tidak mengganggu, teks lebih ringkas — 20 Nov 2026

> **Prompt Hasby (dengan tangkapan layar):** "tolong tempat free teks hilangkan masukan jadi lainnya menyatuh dengan tabel bahan, ini juga setiap saya memilih alur navbar otomatis turun tolong sesuaikan navbar agar tidak mengganggu, saya juga ingin jangan terlalu banyak teks dan hal hal yang tida terpakai agar pengguna tida kebingungan"

**Yang dikerjakan AI:**
- Kartu teks bebas di halaman Pakan dihapus dan diganti baris **Lainnya** di dalam daftar bahan. Langkah konfirmasi "Cek dulu bacaan kami" tetap dipertahankan.
- Navbar:
  - **Akar masalah:** di ponsel navbar selebar layar, sehingga kursor yang lewat membuka menu. Membuka menu dengan kursor dibatasi ke desktop.
  - Menu tertutup saat mengetuk di luar menu atau menggulir, dan navbar menyingkir saat menggulir ke bawah.
  - **Bug kedua yang ditemukan saat diuji:** membuka menu mendorong konten sehingga browser menggeser halaman dan menu langsung tertutup lagi. Menu sekarang melayang di atas konten.
- Teks dipangkas: section "Empat peran" dihapus (sama dengan tab Alur), teks hero, modul, kepercayaan, toko, dan FAQ diringkas.

**Keputusan:** AI sempat menghapus tombol "Cek sambungan server" di Beranda, lalu **mengembalikannya** setelah menemukan tiga tes khusus untuk fitur itu. Fitur tersebut sengaja dibuat sejak fase awal, jadi penghapusannya diserahkan ke keputusan tim.

### 8. Commit dan push — 20 Nov 2026

> **Prompt Hasby:** "commit push semua ke branch dev website tapi harus jelas terstruktur dan rapih"

AI membagi perubahan menjadi 6 commit per topik dengan gaya pesan commit tim. Urutannya diatur supaya kode di setiap commit tetap utuh. Satu file teks (`teks.ts`) yang berisi perubahan untuk dua fitur dipecah ke commit masing-masing. Setiap commit di-typecheck terpisah sebelum push.

| Commit | Isi |
|---|---|
| `578cbb8` chore(deps) | Pembaruan `package-lock.json` hasil `npm install` |
| `332fc60` feat(ui) | Maskot Kokok 3D, token tipografi, ikon baru |
| `54c305d` feat(investasi) | Modul 5, akun demo, menu akun |
| `1ec047d` feat(kokok) | Rujukan urgensi tinggi ke dokter hewan mitra |
| `184eeea` feat(pakan) | Baris "Lainnya" di daftar bahan |
| `68e6e8d` feat(landing) | Hero Kokok, popup chatbot, alur, highlight Modul 05, navbar, teks ringkas |

### 9. Log vibe coding — 20 Nov 2026

> **Prompt Hasby:** "tambahkan log vibe coding karena keharusan persyaratan lomba buat folder khsuus bernama log vibe coding nanti yg saya namain nya log vibe coding hasby"

AI membuat dokumen ini di folder `log vibe coding/`.

---

## Verifikasi akhir

| Pemeriksaan | Hasil |
|---|---|
| Typecheck TypeScript | Lolos, juga di setiap commit secara terpisah |
| ESLint | Bersih |
| Tes unit (Vitest) | 29 lolos, termasuk tes baru untuk popup Kokok, alur per peran, Modul 5, login/keluar/ganti akun, pembatasan peternak, rujukan dokter hewan, dan baris Lainnya |
| Aksesibilitas (axe) | 0 pelanggaran di 12 halaman × 6 lebar layar, termasuk saat menu ponsel dan popup terbuka |
| Responsif | Tidak ada luberan horizontal dari 360px sampai 1440px |

## Keterbatasan yang diketahui

- Tes E2E Playwright belum dijalankan karena browser bawaan Playwright belum terpasang di laptop. Pemeriksaan visual dan axe dijalankan dengan Microsoft Edge.
- Efek 3D maskot dibuat dengan CSS dari gambar 2D, belum model 3D sungguhan.
- Akun demo hanya tersimpan di perangkat (localStorage), bukan autentikasi sungguhan.
- Modul 5 masih prototipe: belum ada mitra penyelenggara berizin OJK, dan semua data peluang, peternak, serta dokter hewan adalah contoh.
