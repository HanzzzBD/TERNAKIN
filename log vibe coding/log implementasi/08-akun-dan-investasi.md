# Akun, Peran, dan Investasi Ternak (Modul 5)

| Commit | Tanggal | Penulis | Model (trailer) | Pesan |
|---|---|---|---|---|
| `54c305d` | 20 Nov | hasbywira90 | Claude Opus 5.5 | feat(investasi): menambah prototipe Modul 5 investasi ternak dan akun demo |
| `7835fd8` | 21 Nov | HanzzzBD | Claude Opus 5.5 | feat(akun): menambah masuk WhatsApp OTP, pembagian peran peternak/pengguna, dan investasi simulasi di server |
| `8365142` | 21 Nov | HanzzzBD | Claude Opus 5.5 | feat(akun): menambah masuk dengan email + kata sandi dan Google, serta email kode berlogo Kokok |
| `f499ebd` | 23 Nov | HanzzzBD | Claude Opus 5.5 | feat(akun): mewajibkan masuk untuk Kokok dan menambah pengingat masuk bagi tamu |
| `af0181c` | 23 Nov | HanzzzBD | Claude Opus 5.5 | feat(akun): mewajibkan masuk untuk semua fitur di web dan Android |
| `4a2b568` | 23 Nov | HanzzzBD | Claude Opus 5.5 | test(e2e): masuk per tes dan mengisolasi server e2e dari kredensial asli |
| `8c72aa9` | 23 Nov | HanzzzBD | Claude Opus 5.5 | fix(api): mengirim asal situs ke Google agar tombol masuk dengan Google berfungsi |
| `476f232` | 23 Nov | HanzzzBD | Claude Opus 5.5 | fix(mobile): menampilkan penyebab gagal masuk dengan Google |

## Isi

**Prototipe Modul 5 (`54c305d`).** Modul investasi ternak ayam pedaging sebagai prototipe tanpa transaksi uang. Ternakin tidak memegang uang. Pendanaan dinyatakan akan berjalan lewat penyelenggara urun dana berizin OJK yang sedang disiapkan.
- Akun demo pengguna dan peternak, halaman Masuk dengan masuk sekali klik, ganti akun, dan keluar.
- Pengguna melihat peluang diurutkan dari kandang terdekat, dengan pilihan wilayah Bandung Raya atau lokasi perangkat. Detail kandang berisi hasil pemeriksaan dokter hewan mitra, grafik catatan harian, dan risiko.
- Peternak melihat profil peternakannya sendiri. Ia tidak bisa membuka atau mendanai kandang lain.
- Peluang hanya bisa didanai setelah kandang diperiksa dokter hewan mitra.

**Masuk WhatsApp dan peran (`7835fd8`).**
- OTP 6 digit lewat Fonnte. Kode disimpan sebagai HMAC, berlaku 5 menit, maksimal 5 percobaan, dengan jeda kirim ulang 60 detik dan 5 kali per jam per nomor.
- Sesi cookie HttpOnly dengan SameSite=Lax, dan Secure di production.
- Data tamu di perangkat dipindah ke akun saat masuk.
- Peran dipilih saat masuk dan satu akun hanya punya satu peran. Peran bisa diganti lewat `PUT /v1/auth/peran`. Tamu berperan sebagai peternak, sesuai PRD.
- Pengguna hanya mengakses Kokok dan investasi. Endpoint kandang, catatan, sinkron, pakan, lead, dan rujukan toko menolak dengan `KHUSUS_PETERNAK`.
- Modul 5 di server memakai tabel `peluang_investasi` dan `minat_investasi`, dengan lima peluang contoh.

**Masuk email dan Google (`8365142`).**
- Daftar, masuk, kirim ulang kode, lupa sandi, dan atur ulang sandi dengan email. Sandi di-hash scrypt. Kode email disimpan sebagai HMAC, berlaku 15 menit, dan maksimal 5 percobaan.
- Pesan galat dibuat seragam agar tidak bisa dipakai untuk menebak email yang terdaftar.
- Email kode memakai template HTML dengan logo Kokok yang disisipkan inline (cid), dan ada versi teks biasa.
- Masuk dengan Google memakai Google Identity Services. ID token diverifikasi di server tanpa dependensi tambahan: tanda tangan RS256 dengan JWKS Google, serta pemeriksaan `aud`, `iss`, `exp`, dan email terverifikasi.
- Akun Google ditautkan ke akun email yang sama. Bila akun email itu belum terverifikasi, sandinya dihapus agar tidak bisa diambil alih pendaftar palsu.
- Halaman Masuk menampilkan tombol Google, form email, lalu WhatsApp sebagai pilihan kedua.

**Kokok wajib masuk dan pengingat untuk tamu (`f499ebd`).** Mode tamu tetap ada, tetapi Kokok kini khusus akun.
- API: middleware `wajibMasuk` dipasang di seluruh rute `/v1/kokok`. Tamu yang memanggil `/v1/kokok/triase` atau `/v1/kokok/obrolan` mendapat `401 BELUM_MASUK`. Akun demo dihitung sudah masuk, jadi juri tetap bisa mencoba Kokok. OpenAPI mencantumkan respons 401.
- Web: halaman Tanya Kokok dibungkus `WajibMasuk`. Tamu melihat ajakan masuk yang kembali ke `/app/tanya` setelah masuk, dan draf pertanyaan tetap tersimpan. Respons 401 (sesi berakhir di server) menghapus status masuk lokal.
- Popup Kokok di landing: kolom ketik diganti tombol "Masuk untuk ngobrol" bagi tamu. Pertanyaan cepat tetap dijawab dengan teks FAQ yang sudah tertulis, tanpa memanggil server.
- Mobile: tab Kokok menampilkan ajakan masuk untuk tamu, dan menyegarkan sesi bila server membalas 401.
- Web dan mobile: Beranda menampilkan pengingat bahwa data tamu hanya tersimpan di perangkat, dengan tombol Masuk dan "Nanti saja". "Nanti saja" menyembunyikan pengingat selama 7 hari.
- Tes: tes Kokok API kini masuk dengan akun demo, ditambah tes tamu ditolak 401, tes popup untuk tamu, dan tes `WajibMasuk`/`PengingatMasuk`. Hasil sebelum commit: API 131, web 49, dan shared 81 tes lolos, serta lint dan build lolos.

**Semua fitur wajib masuk (`af0181c`).** Pemilik produk memutuskan menghapus mode tamu, menggantikan aturan `f499ebd` yang hanya mengunci Kokok. Keputusan diambil lewat empat pilihan: cakupan (semua fitur), platform (web dan Android), perilaku offline (tetap jalan setelah sekali masuk), dan penegakan (server ikut menolak).
- API: `wajibMasuk` dipasang di `/kandang`, `/catatan`, `/sinkron`, `/pakan`, `/lead`, `/toko`, dan `/investasi`. Tetap terbuka: `/auth`, referensi pakan (`/referensi`, `/bahan`) untuk cache offline, `/unduhan`, `/openapi.json`, dan `DELETE /akun`.
- Web: semua `/app/*` kecuali `/app/masuk` berada di bawah `WajibMasuk` (layout route) yang mengalihkan tamu ke `/app/masuk?lanjut=<tujuan>`. `penjagaSesi` (dipasang di `main.tsx`) menghapus status masuk lokal bila `/v1` selain `/v1/auth` menjawab 401. Galat jaringan tidak mengakhiri sesi. Pengingat masuk tamu dihapus. Setelah hapus akun, pesan konfirmasi dibawa lewat `sessionStorage` dan tampil di halaman Masuk.
- Android: tab hanya terbuka untuk akun yang sudah memilih peran (`Stack.Protected`), selain itu layar Masuk setelah layar sambutan. Data pengguna disimpan di `AsyncStorage` (token tetap di SecureStore), sehingga aplikasi tetap terbuka saat dibuka tanpa sinyal. Sebelumnya status masuk hanya dibaca dari server. 401 dari API mengakhiri sesi lewat penangan terpusat di `api.ts`.
- Tombol akun di header diperbesar dari 40px ke 48px. Masalah ini baru terlihat saat tes e2e berjalan dalam keadaan masuk.
- Tes API memakai agen yang sudah masuk (`src/uji/masuk.ts`, dikecualikan dari build). Data tamu lama disiapkan langsung di basis data untuk menguji pemindahan ke akun, dan tes keamanan kepemilikan memakai dua akun. Tes baru memastikan tamu ditolak 401 di semua fitur dan rute publik tetap terbuka.
- PRD (F5) dan SDD diperbarui.

**Tes e2e masuk per tes (`4a2b568`).** Tiap tes Playwright masuk sebagai akun peternak baru lewat OTP mode demo, dengan IP tiruan per tes agar tidak terkena batas OTP per IP. Server e2e ikut membaca `.env` lokal yang berisi kredensial asli. Karena itu `playwright.config.ts` mengosongkan `FONNTE_TOKEN`, SMTP, `GOOGLE_CLIENT_ID`, dan `LLM_API_KEY`, dan helper memeriksa bahwa server dalam mode demo sebelum meminta OTP. Saat pengerjaan, port 4173 ternyata dipakai aplikasi lain sehingga Playwright memakai server yang salah. Permintaan OTP saat itu masuk ke server tersebut, bukan ke Fonnte. Port kini bisa diganti lewat `E2E_PORT`.

Hasil sebelum commit: API 135, web 52, dan shared 81 tes lolos. E2E 23 (preview) dan 6 (dev) lolos. Lint, typecheck, dan bundle Android lolos.

**Perbaikan masuk dengan Google di web (`8c72aa9`).** Masuk dengan Google gagal di semua browser web, ponsel maupun desktop, padahal origin `https://ternakin.code-xpert.my.id` sudah terdaftar di Google Cloud. Penyebabnya `Referrer-Policy: no-referrer` bawaan helmet. Iframe `accounts.google.com/gsi/button` tidak menerima asal situs, sehingga Google menjawab 400. Pembuktian langsung ke Google: tanpa Referer 400, dengan Referer situs 200, dan dengan Referer situs lain 403. Kebijakan diganti ke `strict-origin-when-cross-origin`, yang ke situs lain hanya mengirim asal tanpa path atau query. Tes baru menjaga header ini bersama COOP dan CSP untuk Google. Yang diperiksa dan tidak bermasalah: `GOOGLE_CLIENT_ID` terbaca server, CSP untuk skrip/iframe/koneksi GSI, COOP untuk popup, verifikasi token di `/v1/auth/google`, dan JWKS Google terjangkau.

**Pesan galat Google di Android (`476f232`).** Semua kegagalan sebelumnya tampil sebagai "Masuk dengan Google gagal". `DEVELOPER_ERROR` (kode 10, SHA-1 APK belum terdaftar sebagai OAuth client Android) kini tampil dengan pesan jelas, dan galat lain menyertakan kodenya. Perubahan JS ini dikirim lewat EAS Update.

## Keputusan yang tercatat

- Investasi hanya simulasi. Tidak ada uang yang berpindah, dan tidak ada angka imbal hasil yang dijanjikan.
- Investasi sungguhan ditunda sampai ada mitra penyelenggara berizin OJK.
- Peternak tidak bisa mendanai peternak lain. Pengguna tidak bisa mengakses data kandang.
- Akun demo tidak bisa diganti perannya atau dihapus.
- Kepemilikan data diatur di server: kandang tidak bisa diambil alih lewat ID, dan catatan hanya bisa ditulis pemiliknya.
- Dokumen untuk penilaian: semua nama peternak, kandang, dokter hewan, dan angka diberi label contoh.
- Kokok wajib masuk, tetapi pakan, catatan, dan toko tetap bisa dipakai tanpa akun (`f499ebd`). Keputusan ini digantikan `af0181c`.
- Semua fitur wajib masuk (`af0181c`). Masalah offline-first ditangani dengan menyimpan status masuk di perangkat: masuk pertama butuh internet, setelah itu pakan dan catatan tetap jalan tanpa sinyal.
- Server ikut menolak tamu, jadi aturan tidak bisa diakali dengan memanggil API langsung.
- Tes e2e tidak boleh memakai layanan sungguhan: semua kredensial dikosongkan di konfigurasi Playwright.
- `Referrer-Policy` memakai `strict-origin-when-cross-origin`, bukan `no-referrer`, karena tombol Google membutuhkan asal situs.
- Untuk masuk dengan Google di Android, client OAuth bertipe Android (paket `id.ternakin.app` dan SHA-1 keystore EAS) didaftarkan di proyek Google Cloud yang sama dengan client Web. Aplikasi tetap memakai Client ID Web.

---

## Detail perubahan per commit

Bagian ini dibuat dari `git show` untuk setiap commit: jumlah baris berubah per file, status file (baru atau diubah), dan isi pesan commit.

### `54c305d` — feat(investasi): menambah prototipe Modul 5 investasi ternak dan akun demo

- **Tanggal:** 2026-11-20 · **Penulis:** hasbywira90 · **Model:** Claude Opus 5.5
- **Ringkasan:** 15 file, +2927 / -2 baris

**Isi pesan commit:**

> Menambahkan Modul 5 investasi ternak ayam pedaging sebagai prototipe tanpa transaksi uang. Ternakin tidak memegang uang; pendanaan dinyatakan akan berjalan lewat penyelenggara urun dana berizin OJK yang sedang disiapkan. Semua peternak, kandang, dokter hewan, dan angka diberi label data contoh.
> - Akun demo pengguna dan peternak (sesi lokal), halaman Masuk dengan masuk sekali klik, ganti akun, dan keluar, serta menu akun di bilah atas aplikasi.
> - Pengguna: daftar peluang terurut dari kandang terdekat (pilihan wilayah Bandung Raya atau lokasi perangkat), detail kandang berisi hasil pemeriksaan dokter hewan mitra, grafik catatan harian, risiko, dan simulasi minat titip modal dengan persetujuan risiko.
> - Peternak: menu Investasi langsung membuka profil peternakannya, izin tampilkan data catatan harian, syarat peluang dibuka, dan formulir ajuan siklus berikutnya. Peternak tidak dapat membuka atau mendanai kandang lain.
> - Peluang hanya bisa didanai setelah kandang diperiksa dokter hewan mitra.

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/src/App.tsx` | 8 | 0 | diubah |
| `apps/web/src/components/investasi/KandangDetail.tsx` | 154 | 0 | baru |
| `apps/web/src/components/investasi/PeluangUi.tsx` | 116 | 0 | baru |
| `apps/web/src/components/layout/AkunMenu.tsx` | 98 | 0 | baru |
| `apps/web/src/components/layout/AppShell.css` | 125 | 0 | diubah |
| `apps/web/src/components/layout/AppShell.tsx` | 2 | 0 | diubah |
| `apps/web/src/components/ui/AppNav.tsx` | 12 | 2 | diubah |
| `apps/web/src/content/investasiContent.ts` | 305 | 0 | baru |
| `apps/web/src/lib/akunDemo.ts` | 208 | 0 | baru |
| `apps/web/src/pages/InvestasiDetailPage.tsx` | 229 | 0 | baru |
| `apps/web/src/pages/InvestasiPage.css` | 843 | 0 | baru |
| `apps/web/src/pages/InvestasiPage.test.tsx` | 166 | 0 | baru |
| `apps/web/src/pages/InvestasiPage.tsx` | 175 | 0 | baru |
| `apps/web/src/pages/MasukPage.tsx` | 241 | 0 | baru |
| `apps/web/src/pages/PeternakPage.tsx` | 245 | 0 | baru |


### `7835fd8` — feat(akun): menambah masuk WhatsApp OTP, pembagian peran peternak/pengguna, dan investasi simulasi di server

- **Tanggal:** 2026-11-21 · **Penulis:** HanzzzBD · **Model:** Claude Opus 5.5
- **Ringkasan:** 62 file, +5929 / -794 baris

**Isi pesan commit:**

> Akun nomor WhatsApp + OTP (PRD F5)
> - POST /v1/auth/otp/minta dan /verifikasi: kode 6 angka dikirim lewat Fonnte, disimpan
>   sebagai HMAC, berlaku 5 menit, maksimal 5 percobaan, jeda kirim ulang 60 detik dan
>   5 kali per jam per nomor. Tanpa FONNTE_TOKEN di luar production kode tampil di layar.
> - Sesi cookie HttpOnly SameSite=Lax (Secure di production), berlaku SESI_BERLAKU_HARI.
> - Data tamu perangkat dipindah ke akun saat masuk (kunci pemilik akun:<id>); keluar
>   mengirim antrean dulu lalu membersihkan data di HP.
> Keamanan kepemilikan data
> - Kandang tidak bisa diambil alih lewat ID dan catatan hanya bisa ditulis pemiliknya
>   (PUT /v1/catatan kini wajib x-device-id atau sesi).
> - ID perangkat berawalan akun: dari klien ditolak agar tidak bisa menyamar sebagai akun.
> Peran peternak dan pengguna
> - Peran dipilih saat masuk (pengguna.peran_akun), satu peran per akun, bisa diganti
>   lewat PUT /v1/auth/peran. Tamu = mode peternak sesuai PRD.
> - Pengguna hanya Kokok dan investasi: kandang, catatan, sinkron, pakan, lead, dan
>   rujukan toko ditolak dengan KHUSUS_PETERNAK. Menu web, penjaga rute, dan Profil
>   menyesuaikan peran.
> - Akun demo bersama (POST /v1/auth/demo, AKUN_DEMO_AKTIF) mengikuti aturan peran yang
>   sama, tidak bisa diganti perannya atau dihapus, dan hanya dibuka di HP tanpa data tamu.
> Investasi ternak — Modul 5 (SIMULASI, tanpa uang sungguhan)
> - Tabel peluang_investasi dan minat_investasi, lima peluang contoh di-seed.
> - Peternak mengajukan peluang (menunggu pemeriksaan dokter hewan) dan mengatur izin
>   tampil data; pengguna mencatat minat dengan validasi minimal titip dan sisa modal.
> - Web memakai API, menggantikan data contoh dan localStorage. Investasi sungguhan tetap
>   ditunda sesuai Risk Analysis sampai ada mitra berizin OJK.
> OpenAPI, SDD, .env.example, dan docker-compose diperbarui.

| File | + | − | Status |
|---|---:|---:|---|
| `.env.example` | 8 | 0 | diubah |
| `Ternakin SDD Website (PWA).md` | 25 | 1 | diubah |
| `apps/api/migrations/003_akun_otp.sql` | 20 | 0 | baru |
| `apps/api/migrations/004_peran_investasi.sql` | 40 | 0 | baru |
| `apps/api/seed/peluang_investasi.json` | 1073 | 0 | baru |
| `apps/api/src/adapters/pengirimOtp.ts` | 86 | 0 | baru |
| `apps/api/src/akun.test.ts` | 375 | 0 | baru |
| `apps/api/src/app.ts` | 20 | 0 | diubah |
| `apps/api/src/catatan.test.ts` | 37 | 28 | diubah |
| `apps/api/src/config/env.ts` | 8 | 0 | diubah |
| `apps/api/src/db/akunRepo.ts` | 274 | 0 | baru |
| `apps/api/src/db/catatanRepo.ts` | 28 | 3 | diubah |
| `apps/api/src/db/database.ts` | 12 | 0 | diubah |
| `apps/api/src/db/investasiRepo.ts` | 294 | 0 | baru |
| `apps/api/src/investasi.test.ts` | 279 | 0 | baru |
| `apps/api/src/lib/pemilik.ts` | 53 | 0 | baru |
| `apps/api/src/middleware/peran.ts` | 53 | 0 | baru |
| `apps/api/src/middleware/sesi.ts` | 63 | 0 | baru |
| `apps/api/src/openapi.ts` | 194 | 1 | diubah |
| `apps/api/src/routes/akun.ts` | 39 | 6 | diubah |
| `apps/api/src/routes/auth.ts` | 304 | 0 | baru |
| `apps/api/src/routes/catatan.ts` | 15 | 1 | diubah |
| `apps/api/src/routes/investasi.ts` | 117 | 0 | baru |
| `apps/api/src/routes/kandang.ts` | 12 | 11 | diubah |
| `apps/api/src/routes/kokok.ts` | 8 | 7 | diubah |
| `apps/api/src/routes/lead.ts` | 2 | 1 | diubah |
| `apps/api/src/routes/pakan.ts` | 7 | 6 | diubah |
| `apps/api/src/routes/sinkron.ts` | 57 | 16 | diubah |
| `apps/api/src/routes/v1.ts` | 28 | 1 | diubah |
| `apps/api/src/server.ts` | 27 | 0 | diubah |
| `apps/web/src/App.tsx` | 33 | 4 | diubah |
| `apps/web/src/components/akun/KartuAkunPeran.tsx` | 101 | 0 | baru |
| `apps/web/src/components/akun/KhususPeternak.tsx` | 51 | 0 | baru |
| `apps/web/src/components/akun/MasukWhatsAppCard.test.tsx` | 163 | 0 | baru |
| `apps/web/src/components/akun/MasukWhatsAppCard.tsx` | 366 | 0 | baru |
| `apps/web/src/components/investasi/KandangDetail.tsx` | 25 | 19 | diubah |
| `apps/web/src/components/investasi/PeluangUi.tsx` | 6 | 2 | diubah |
| `apps/web/src/components/layout/AkunMenu.tsx` | 33 | 16 | diubah |
| `apps/web/src/components/layout/AppShell.css` | 12 | 0 | diubah |
| `apps/web/src/components/layout/AppShell.tsx` | 22 | 3 | diubah |
| `apps/web/src/components/ui/AppNav.tsx` | 35 | 18 | diubah |
| `apps/web/src/db/sync.ts` | 19 | 2 | diubah |
| `apps/web/src/lib/akun.ts` | 197 | 0 | baru |
| `apps/web/src/lib/akunCache.ts` | 50 | 0 | baru |
| `apps/web/src/lib/akunDemo.ts` | 6 | 193 | diubah |
| `apps/web/src/lib/investasi.ts` | 144 | 0 | baru |
| `apps/web/src/lib/peran.ts` | 49 | 0 | baru |
| `apps/web/src/main.tsx` | 2 | 0 | diubah |
| `apps/web/src/pages/InvestasiDetailPage.tsx` | 54 | 32 | diubah |
| `apps/web/src/pages/InvestasiPage.css` | 76 | 0 | diubah |
| `apps/web/src/pages/InvestasiPage.test.tsx` | 221 | 65 | diubah |
| `apps/web/src/pages/InvestasiPage.tsx` | 29 | 26 | diubah |
| `apps/web/src/pages/LandingPage.tsx` | 12 | 5 | diubah |
| `apps/web/src/pages/MasukPage.tsx` | 53 | 114 | diubah |
| `apps/web/src/pages/PeternakPage.tsx` | 221 | 119 | diubah |
| `apps/web/src/pages/ProfilPage.tsx` | 121 | 94 | diubah |
| `docker-compose.yml` | 3 | 0 | diubah |
| `packages/shared/src/index.ts` | 41 | 0 | diubah |
| `packages/shared/src/lib/nomorPonsel.test.ts` | 29 | 0 | baru |
| `packages/shared/src/lib/nomorPonsel.ts` | 29 | 0 | baru |
| `packages/shared/src/schemas/akun.ts` | 58 | 0 | baru |
| `packages/shared/src/schemas/investasi.ts` | 110 | 0 | baru |


### `8365142` — feat(akun): menambah masuk dengan email + kata sandi dan Google, serta email kode berlogo Kokok

- **Tanggal:** 2026-11-21 · **Penulis:** HanzzzBD · **Model:** Claude Opus 5.5
- **Ringkasan:** 40 file, +2975 / -109 baris

**Isi pesan commit:**

> Masuk dengan email
> - Daftar (nama, email, kata sandi, peran) dengan kode verifikasi ke email, masuk dengan
>   email + kata sandi, kirim ulang kode, serta lupa dan atur ulang kata sandi.
> - Kata sandi di-hash scrypt; kode email disimpan sebagai HMAC, berlaku 15 menit,
>   maksimal 5 percobaan, dengan jeda kirim ulang. Pesan galat masuk dan lupa sandi dibuat
>   seragam agar tidak bisa dipakai menebak email terdaftar.
> - Pengiriman lewat SMTP mana pun (Resend, Gmail App Password, email domain sendiri);
>   tanpa SMTP di luar production kode tampil di layar (mode demo).
> - Email kode memakai template HTML dengan logo Kokok yang disisipkan inline (cid),
>   ditambah versi teks biasa. Logo ikut disalin di Dockerfile.
> Masuk dengan Google
> - Tombol Google Identity Services; ID token diverifikasi server tanpa dependensi
>   (tanda tangan RS256 dengan JWKS Google, aud, iss, exp, email terverifikasi).
> - Ditautkan ke akun email yang sama; bila akun email itu belum terverifikasi, sandinya
>   dihapus agar tidak bisa diambil alih pendaftar palsu.
> - CSP dan Cross-Origin-Opener-Policy disesuaikan untuk skrip dan popup Google.
> Halaman Masuk
> - Urutan: tombol Google, form email (tab Masuk/Daftar), lalu WhatsApp sebagai pilihan
>   kedua. Akun demo kembali menampilkan email dan sandi, dan bisa diketik di form email.
> - GET /v1/auth/konfigurasi memberi tahu web cara masuk yang aktif.
> - Langkah akhir semua cara masuk disatukan di selesaikanMasuk.
> Variabel baru: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_DARI, GOOGLE_CLIENT_ID.
> Dependensi baru: nodemailer. OpenAPI dan SDD diperbarui.

| File | + | − | Status |
|---|---:|---:|---|
| `.env.example` | 11 | 0 | diubah |
| `Dockerfile` | 1 | 0 | diubah |
| `Ternakin SDD Website (PWA).md` | 8 | 1 | diubah |
| `apps/api/assets/kokok-email.png` | - | - | baru |
| `apps/api/migrations/005_email_google.sql` | 14 | 0 | baru |
| `apps/api/package.json` | 2 | 0 | diubah |
| `apps/api/src/adapters/pengirimEmail.ts` | 92 | 0 | baru |
| `apps/api/src/app.ts` | 31 | 1 | diubah |
| `apps/api/src/authEmail.test.ts` | 407 | 0 | baru |
| `apps/api/src/config/env.ts` | 8 | 0 | diubah |
| `apps/api/src/db/akunRepo.ts` | 14 | 2 | diubah |
| `apps/api/src/db/database.ts` | 10 | 0 | diubah |
| `apps/api/src/db/emailRepo.ts` | 234 | 0 | baru |
| `apps/api/src/db/investasiRepo.ts` | 25 | 2 | diubah |
| `apps/api/src/lib/googleIdToken.ts` | 117 | 0 | baru |
| `apps/api/src/lib/pemilik.ts` | 2 | 0 | diubah |
| `apps/api/src/lib/sandi.ts` | 69 | 0 | baru |
| `apps/api/src/lib/sesiMasuk.ts` | 42 | 0 | baru |
| `apps/api/src/lib/templateEmail.ts` | 114 | 0 | baru |
| `apps/api/src/openapi.ts` | 139 | 0 | diubah |
| `apps/api/src/routes/auth.ts` | 31 | 46 | diubah |
| `apps/api/src/routes/authEmail.ts` | 420 | 0 | baru |
| `apps/api/src/routes/v1.ts` | 8 | 0 | diubah |
| `apps/api/src/server.ts` | 29 | 0 | diubah |
| `apps/web/src/components/akun/MasukEmailCard.test.tsx` | 205 | 0 | baru |
| `apps/web/src/components/akun/MasukEmailCard.tsx` | 417 | 0 | baru |
| `apps/web/src/components/akun/MasukWhatsAppCard.test.tsx` | 1 | 0 | diubah |
| `apps/web/src/components/akun/MasukWhatsAppCard.tsx` | 2 | 43 | diubah |
| `apps/web/src/components/akun/PilihanPeran.tsx` | 46 | 0 | baru |
| `apps/web/src/components/akun/TombolGoogle.tsx` | 123 | 0 | baru |
| `apps/web/src/lib/akun.ts` | 123 | 6 | diubah |
| `apps/web/src/lib/akunDemo.ts` | 3 | 3 | diubah |
| `apps/web/src/lib/peran.ts` | 1 | 1 | diubah |
| `apps/web/src/pages/InvestasiPage.css` | 67 | 0 | diubah |
| `apps/web/src/pages/InvestasiPage.test.tsx` | 6 | 1 | diubah |
| `apps/web/src/pages/MasukPage.tsx` | 32 | 3 | diubah |
| `docker-compose.yml` | 6 | 0 | diubah |
| `package-lock.json` | 21 | 0 | diubah |
| `packages/shared/src/index.ts` | 16 | 0 | diubah |
| `packages/shared/src/schemas/akun.ts` | 78 | 0 | diubah |


### `f499ebd` — feat(akun): mewajibkan masuk untuk Kokok dan menambah pengingat masuk bagi tamu

- **Tanggal:** 2026-11-23 · **Penulis:** HanzzzBD · **Model:** Claude Opus 5.5
- **Ringkasan:** 20 file, +580 / -58 baris

**Isi pesan commit:**

> - API: middleware wajibMasuk; /v1/kokok/triase dan /v1/kokok/obrolan menolak tamu dengan 401 BELUM_MASUK. Akun demo dihitung sudah masuk. OpenAPI mencantumkan 401.
> - Web: halaman Tanya Kokok dibungkus WajibMasuk (ajakan masuk, kembali ke /app/tanya setelah masuk). Popup Kokok di landing mengganti kolom ketik dengan ajakan masuk; pertanyaan cepat tetap dijawab teks tetap tanpa memanggil server. Respons 401 menghapus status masuk lokal.
> - Mobile: tab Kokok menampilkan ajakan masuk untuk tamu dan menyegarkan sesi saat 401.
> - Web dan mobile: pengingat di Beranda bahwa data tamu hanya tersimpan di perangkat, dengan tombol Masuk dan "Nanti saja" (disembunyikan 7 hari).
> - Pakan, catatan, dan toko tetap bisa dipakai tamu (mode tamu PRD).
> - Tes: Kokok API masuk dengan akun demo, tes tamu ditolak, tes popup tamu, dan tes WajibMasuk/PengingatMasuk. SDD diperbarui.

| File | + | − | Status |
|---|---:|---:|---|
| `Ternakin SDD Website (PWA).md` | 3 | 1 | diubah |
| `apps/api/src/kokok.test.ts` | 76 | 24 | diubah |
| `apps/api/src/middleware/peran.ts` | 14 | 1 | diubah |
| `apps/api/src/openapi.ts` | 8 | 0 | diubah |
| `apps/api/src/routes/kokok.ts` | 9 | 0 | diubah |
| `apps/mobile/src/app/(tab)/index.tsx` | 2 | 0 | diubah |
| `apps/mobile/src/app/(tab)/kokok.tsx` | 51 | 3 | diubah |
| `apps/mobile/src/components/PengingatMasuk.tsx` | 71 | 0 | baru |
| `apps/web/src/App.tsx` | 14 | 1 | diubah |
| `apps/web/src/components/akun/PengingatMasuk.tsx` | 60 | 0 | baru |
| `apps/web/src/components/akun/WajibMasuk.test.tsx` | 90 | 0 | baru |
| `apps/web/src/components/akun/WajibMasuk.tsx` | 64 | 0 | baru |
| `apps/web/src/components/landing/KokokChatPopup.css` | 14 | 0 | diubah |
| `apps/web/src/components/landing/KokokChatPopup.test.tsx` | 32 | 3 | diubah |
| `apps/web/src/components/landing/KokokChatPopup.tsx` | 41 | 24 | diubah |
| `apps/web/src/components/layout/AppShell.css` | 15 | 1 | diubah |
| `apps/web/src/content/landingContent.ts` | 4 | 0 | diubah |
| `apps/web/src/lib/kokokObrolan.ts` | 3 | 0 | diubah |
| `apps/web/src/pages/FondasiPage.tsx` | 2 | 0 | diubah |
| `apps/web/src/pages/KokokPage.tsx` | 7 | 0 | diubah |

### `af0181c` — feat(akun): mewajibkan masuk untuk semua fitur di web dan Android

- **Tanggal:** 2026-11-23 · **Penulis:** HanzzzBD · **Model:** Claude Opus 5.5
- **Ringkasan:** 35 file, +621 / -573 baris

**Isi pesan commit:**

> Mode tamu dihapus (keputusan 23 Nov 2026). Landing dan /privasi tetap publik, dan aplikasi tetap bisa dipakai offline setelah sekali masuk.
> - API: wajibMasuk di /kandang, /catatan, /sinkron, /pakan, /lead, /toko, dan /investasi (Kokok sudah dijaga). Tetap terbuka: /auth, referensi pakan, /unduhan, /openapi.json, dan DELETE /akun.
> - Web: semua /app/* kecuali /app/masuk berada di bawah WajibMasuk (layout route) yang mengalihkan tamu ke /app/masuk?lanjut=<tujuan>. penjagaSesi menghapus status masuk lokal saat /v1 (bukan /v1/auth) menjawab 401. Pengingat masuk tamu dihapus. Setelah hapus akun, pesan konfirmasi tampil di halaman Masuk. Teks "bisa tanpa akun" diganti.
> - Android: tab hanya terbuka untuk akun yang sudah memilih peran (Stack.Protected), selain itu layar Masuk. Data pengguna disimpan di AsyncStorage agar tetap masuk saat dibuka tanpa sinyal; 401 dari API mengakhiri sesi. Pengingat dan gerbang Kokok dihapus.
> - Tombol akun di header diperbesar ke 48px (ukuran sentuh minimal).
> - Tes API memakai agen yang sudah masuk (src/uji/masuk.ts, tidak ikut build); data tamu lama disiapkan langsung di basis data untuk tes pemindahan ke akun. Tes baru: tamu ditolak 401 di semua fitur dan rute publik tetap terbuka.
> - PRD (F5) dan SDD diperbarui.

| File | + | − | Status |
|---|---:|---:|---|
| `Ternakin PRD Website (PWA).md` | 1 | 1 | diubah |
| `Ternakin SDD Website (PWA).md` | 7 | 4 | diubah |
| `apps/api/src/akun.test.ts` | 69 | 51 | diubah |
| `apps/api/src/authEmail.test.ts` | 8 | 6 | diubah |
| `apps/api/src/catatan.test.ts` | 51 | 53 | diubah |
| `apps/api/src/gemini.test.ts` | 3 | 2 | diubah |
| `apps/api/src/investasi.test.ts` | 47 | 11 | diubah |
| `apps/api/src/pakan.test.ts` | 45 | 42 | diubah |
| `apps/api/src/routes/v1.ts` | 12 | 2 | diubah |
| `apps/api/src/toko.test.ts` | 25 | 20 | diubah |
| `apps/api/src/uji/masuk.ts` | 56 | 0 | baru |
| `apps/api/tsconfig.json` | 1 | 1 | diubah |
| `apps/mobile/src/app/(tab)/index.tsx` | 0 | 2 | diubah |
| `apps/mobile/src/app/(tab)/kokok.tsx` | 3 | 47 | diubah |
| `apps/mobile/src/app/_layout.tsx` | 8 | 3 | diubah |
| `apps/mobile/src/app/masuk.tsx` | 9 | 11 | diubah |
| `apps/mobile/src/components/PengingatMasuk.tsx` | 0 | 71 | dihapus |
| `apps/mobile/src/lib/api.ts` | 12 | 0 | diubah |
| `apps/mobile/src/lib/sesi.tsx` | 50 | 8 | diubah |
| `apps/web/src/App.test.tsx` | 29 | 1 | diubah |
| `apps/web/src/App.tsx` | 40 | 49 | diubah |
| `apps/web/src/components/akun/KartuAkunPeran.tsx` | 1 | 1 | diubah |
| `apps/web/src/components/akun/MasukEmailCard.tsx` | 1 | 1 | diubah |
| `apps/web/src/components/akun/MasukWhatsAppCard.tsx` | 1 | 1 | diubah |
| `apps/web/src/components/akun/PengingatMasuk.tsx` | 0 | 60 | dihapus |
| `apps/web/src/components/akun/WajibMasuk.test.tsx` | 24 | 60 | diubah |
| `apps/web/src/components/akun/WajibMasuk.tsx` | 10 | 57 | diubah |
| `apps/web/src/components/layout/AppShell.css` | 3 | 2 | diubah |
| `apps/web/src/db/sync.ts` | 9 | 2 | diubah |
| `apps/web/src/lib/penjagaSesi.test.ts` | 20 | 0 | baru |
| `apps/web/src/lib/penjagaSesi.ts` | 42 | 0 | baru |
| `apps/web/src/lib/pesanMasuk.ts` | 24 | 0 | baru |
| `apps/web/src/main.tsx` | 3 | 0 | diubah |
| `apps/web/src/pages/FondasiPage.tsx` | 1 | 3 | diubah |
| `apps/web/src/pages/MasukPage.tsx` | 6 | 1 | diubah |

### `4a2b568` — test(e2e): masuk per tes dan mengisolasi server e2e dari kredensial asli

- **Tanggal:** 2026-11-23 · **Penulis:** HanzzzBD · **Model:** Claude Opus 5.5
- **Ringkasan:** 8 file, +106 / -4 baris

**Isi pesan commit:**

> - e2e/masuk.ts: tiap tes masuk sebagai akun peternak baru lewat OTP mode demo (IP tiruan per tes lewat X-Forwarded-For agar tidak terkena batas OTP). Sebelum meminta OTP, helper memastikan server dalam mode demo dan berhenti bila tidak.
> - playwright.config.ts: server e2e mengosongkan FONNTE_TOKEN, SMTP, GOOGLE_CLIENT_ID, dan LLM_API_KEY (LLM_PROVIDER=mock) karena server ikut membaca .env lokal. Port bisa diganti lewat E2E_PORT bila 4173 dipakai aplikasi lain.
> - catatan-offline: setelah hapus akun, aplikasi pindah ke halaman Masuk dengan pesan.

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/e2e/appshell.spec.ts` | 6 | 0 | diubah |
| `apps/web/e2e/catatan-offline.spec.ts` | 11 | 1 | diubah |
| `apps/web/e2e/kokok.spec.ts` | 6 | 0 | diubah |
| `apps/web/e2e/masuk.ts` | 49 | 0 | baru |
| `apps/web/e2e/offline.spec.ts` | 6 | 0 | diubah |
| `apps/web/e2e/pakan-offline.spec.ts` | 6 | 0 | diubah |
| `apps/web/e2e/toko-offline.spec.ts` | 6 | 0 | diubah |
| `apps/web/playwright.config.ts` | 16 | 3 | diubah |

### `8c72aa9` — fix(api): mengirim asal situs ke Google agar tombol masuk dengan Google berfungsi

- **Tanggal:** 2026-11-23 · **Penulis:** HanzzzBD · **Model:** Claude Opus 5.5
- **Ringkasan:** 2 file, +17 / -0 baris

**Isi pesan commit:**

> Helmet bawaan memasang Referrer-Policy: no-referrer, sehingga iframe accounts.google.com/gsi/button tidak tahu asal situs dan menjawab 400. Masuk dengan Google di web (ponsel dan desktop) gagal walau origin sudah terdaftar di Google Cloud. Diuji langsung ke Google: tanpa Referer 400, dengan Referer ternakin.code-xpert.my.id 200, dengan Referer situs lain 403.
> - referrerPolicy: strict-origin-when-cross-origin (ke situs lain hanya asal, tanpa path).
> - Tes header: Referrer-Policy, Cross-Origin-Opener-Policy, dan CSP untuk Google.

| File | + | − | Status |
|---|---:|---:|---|
| `apps/api/src/app.test.ts` | 13 | 0 | diubah |
| `apps/api/src/app.ts` | 4 | 0 | diubah |

### `476f232` — fix(mobile): menampilkan penyebab gagal masuk dengan Google

- **Tanggal:** 2026-11-23 · **Penulis:** HanzzzBD · **Model:** Claude Opus 5.5
- **Ringkasan:** 1 file, +12 / -0 baris

**Isi pesan commit:**

> Sebelumnya semua kegagalan tampil sebagai "Masuk dengan Google gagal", sehingga penyebab tidak terlihat. DEVELOPER_ERROR (kode 10, SHA-1 APK belum terdaftar sebagai OAuth client Android) kini tampil dengan pesan jelas, dan galat lain menyertakan kodenya.

| File | + | − | Status |
|---|---:|---:|---|
| `apps/mobile/src/lib/akun.ts` | 12 | 0 | diubah |
