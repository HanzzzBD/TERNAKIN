# Akun, Peran, dan Investasi Ternak (Modul 5)

| Commit | Tanggal | Penulis | Model (trailer) | Pesan |
|---|---|---|---|---|
| `54c305d` | 20 Nov | hasbywira90 | Claude Opus 5.5 | feat(investasi): menambah prototipe Modul 5 investasi ternak dan akun demo |
| `7835fd8` | 21 Nov | HanzzzBD | Claude Opus 5.5 | feat(akun): menambah masuk WhatsApp OTP, pembagian peran peternak/pengguna, dan investasi simulasi di server |
| `8365142` | 21 Nov | HanzzzBD | Claude Opus 5.5 | feat(akun): menambah masuk dengan email + kata sandi dan Google, serta email kode berlogo Kokok |

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

## Keputusan yang tercatat

- Investasi hanya simulasi. Tidak ada uang yang berpindah, dan tidak ada angka imbal hasil yang dijanjikan.
- Investasi sungguhan ditunda sampai ada mitra penyelenggara berizin OJK.
- Peternak tidak bisa mendanai peternak lain. Pengguna tidak bisa mengakses data kandang.
- Akun demo tidak bisa diganti perannya atau dihapus.
- Kepemilikan data diatur di server: kandang tidak bisa diambil alih lewat ID, dan catatan hanya bisa ditulis pemiliknya.
- Dokumen untuk penilaian: semua nama peternak, kandang, dokter hewan, dan angka diberi label contoh.

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

