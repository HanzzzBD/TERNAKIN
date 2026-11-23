# Aplikasi Mobile (Android, Expo)

| Commit | Tanggal | Penulis | Model (trailer) | Pesan |
|---|---|---|---|---|
| `e1e7197` | 23 Nov | HanzzzBD | Claude Haiku 5.5 | feat(mobile): menambah aplikasi mobile Expo, perbaikan API akun, dan log implementasi |
| `b4d9731` | 23 Nov | HanzzzBD | Claude Opus 5.5 | feat(mobile): menambah EAS Update dan mengarahkan APK preview/production ke server produksi |
| `8b0cd50` | 23 Nov | HanzzzBD | Claude Opus 5.5 | feat(unduhan): menyediakan unduhan APK Android dari website Ternakin |

## Isi

**Aplikasi `apps/mobile`.** Aplikasi Android baru dengan Expo SDK 58, Expo Router, dan TypeScript. Workspace ini memakai `@ternakin/shared` yang sama dengan web, jadi skema, solver pakan, dan penyaring Kokok tidak ditulis ulang.
- Lima tab: Beranda, Catatan, Pakan, Kokok, dan Profil. Ada juga layar sambutan dan layar masuk.
- Komponen bersama (`ui.tsx`, `BilahTab`, `GaugeBusur`, `KartuCatatan`, `MasukUi`) dan klien API (`lib/api.ts`), serta penyimpanan sesi, referensi, dan data kandang di perangkat.
- APK dibangun di cloud oleh EAS (`eas.json`), jadi Android Studio tidak wajib.

**Sesi untuk aplikasi native di API.** Web tetap memakai cookie HttpOnly. Aplikasi mobile menandai dirinya dengan header `X-Ternakin-Klien: mobile`. Respons masuk lalu ikut mengembalikan `token` sesi, yang disimpan aplikasi dan dikirim balik sebagai `Authorization: Bearer`.
- `middleware/sesi.ts` membaca cookie lebih dulu, lalu header Bearer (`bacaBearer`, `klienMobile`).
- `lib/sesiMasuk.ts` mengembalikan token hanya untuk klien mobile. Semua rute masuk di `auth.ts` dan `authEmail.ts` meneruskan penanda ini.
- Skema `SesiAkunResponse` di `packages/shared` mendapat kolom `token` opsional.
- Tes `mobile.test.ts` ditambahkan.

**Proxy tepercaya.** Variabel baru `TRUST_PROXY` (bawaan `loopback`) mengatur Express `trust proxy`. Tanpa pengaturan ini, semua permintaan lewat tunnel atau nginx tampak berasal dari satu IP, sehingga batas laju per pengguna menyatu. `docker-compose.yml` memakai `uniquelocal` karena nginx berada di jaringan Docker.

**Tunnel pengembangan.** `scripts/tunnel.mjs` (`npm run tunnel`) menjalankan Cloudflare Tunnel untuk API dan Metro, dengan contoh konfigurasi di `deploy/cloudflared/ternakin-dev.example.yml`. HP tidak perlu satu WiFi dengan laptop.

**Konfigurasi monorepo.** Skrip `typecheck` ikut memeriksa workspace mobile, dan ada skrip baru `npm run mobile`. `overrides` mengunci `react` dan `react-dom` ke 19.3.0 agar web dan mobile memakai versi yang sama. `eslint.config.js` ditambah aturan untuk mobile. Sebagian besar perubahan baris di commit ini berasal dari `package-lock.json` (+10655 / -3771).

**Log implementasi.** Folder `log vibe coding/log implementasi/` (README dan berkas 01–08) ditambahkan, dan `log vibe coding hasby.md` dihapus.

**EAS Update dan APK ke server produksi (`b4d9731`).** Perubahan JavaScript dan tampilan bisa dikirim ke APK yang sudah terpasang tanpa build dan pasang ulang.
- `expo-updates` ~58.0.22. `app.json` berisi `updates.url` dan `runtimeVersion` berkebijakan `fingerprint`, sehingga update tidak dikirim ke APK yang native-nya berbeda.
- `eas.json`: channel `preview` dan `production`, dan `EXPO_PUBLIC_API_URL` kedua profil itu ke `https://ternakin.code-xpert.my.id`. Profil `development` tetap memakai tunnel laptop untuk hot reload. Sebelumnya semua profil memakai tunnel, sehingga APK hanya jalan saat laptop menyala.
- `npm run update -w @ternakin/mobile -- "pesan"` (`scripts/update.mjs`) membangun `@ternakin/shared`, lalu menjalankan `eas update --channel --environment` dengan alamat API produksi yang dipaksa, agar alamat tunnel dari `.env` lokal tidak ikut terkirim. Alamat bawaan di `src/lib/api.ts` juga diganti ke server produksi.
- Hook `eas-build-post-install` membangun `@ternakin/shared` di server EAS. Build preview pertama gagal di fase bundle (`Unable to resolve "@ternakin/shared"`), karena `packages/shared/dist` tidak ikut git dan APK development tidak pernah memaketkan JavaScript sendiri. Setelah perbaikan, `expo export --platform android` dari kondisi tanpa `dist` berhasil (bundle 4,8 MB).

**Unduhan APK dari website (`8b0cd50`).**
- API: `GET /unduh/ternakin.apk` mengirim APK sebagai lampiran (`application/vnd.android.package-archive`, tanpa cache), dan `GET /v1/unduhan` memberi info tersedia, ukuran, dan waktu diperbarui. APK dibaca dari `UNDUHAN_DIR` (bawaan `<folder database>/unduhan`), sehingga tidak terhapus saat deploy. Nama berkas tetap dan tidak ada path dari klien yang dipakai.
- Web: tombol "Unduh untuk Android (xx MB)" di hero dan ajakan penutup landing, hanya tampil bila APK tersedia. Service worker tidak lagi mengalihkan `/unduh/` ke `index.html`.
- `deploy/pasang-apk.sh <link APK | berkas>` mengunduh APK hasil `eas build` ke folder unduhan, menolak berkas yang bukan APK (harus diawali "PK" dan minimal 1 MB), lalu menggantinya sekaligus dengan `mv` agar pengunjung tidak mengunduh berkas setengah jadi.
- Tes: 4 tes API unduhan dan 2 tes tombol. Uji ujung ke ujung dengan APK tiruan: paket hosting dijalankan, `/v1/unduhan` melaporkan tersedia, dan berkas yang diunduh identik dengan aslinya.

## Keputusan yang tercatat

- Aplikasi mobile berbagi logika dengan web lewat `@ternakin/shared`.
- Sesi mobile memakai token Bearer karena aplikasi native tidak bisa memakai cookie HttpOnly seperti browser. Token hanya dikirim bila klien menandai diri sebagai mobile.
- Build APK lewat EAS di cloud.
- Perubahan JS/tampilan dikirim lewat EAS Update. Perubahan native (modul native, konfigurasi native di `app.json`, upgrade SDK) tetap butuh build APK baru, dan pengguna memasangnya di atas APK lama tanpa menghapusnya (kunci tanda tangan EAS sama).
- APK untuk publik disimpan di server Ternakin, bukan di git (ukurannya puluhan MB) dan bukan link artefak EAS (disimpan sementara).

---

## Detail perubahan per commit

Bagian ini dibuat dari `git show` untuk setiap commit: jumlah baris berubah per file, status file (baru, diubah, atau dihapus), dan isi pesan commit. Berkas gambar ditandai "biner" karena git tidak menghitung barisnya.

### `e1e7197` — feat(mobile): menambah aplikasi mobile Expo, perbaikan API akun, dan log implementasi

- **Tanggal:** 2026-11-23 · **Penulis:** HanzzzBD · **Model:** Claude Haiku 5.5
- **Ringkasan:** 66 file, +17222 / -3953 baris

**Isi pesan commit:**

> - apps/mobile: aplikasi Expo baru dengan tab Beranda, Catatan, Pakan, Kokok, dan Profil, layar sambutan dan masuk, serta komponen dan klien API bersama.
> - apps/api: penyesuaian sesi masuk dan middleware sesi, rute auth dan authEmail, serta tes mobile.
> - packages/shared: skema akun diperbarui; dependensi dan lockfile ikut diselaraskan.
> - deploy/cloudflared dan scripts/tunnel.mjs: contoh konfigurasi tunnel untuk pengembangan.
> - docker-compose.yml, eslint.config.js, package.json: konfigurasi diperbarui.
> - log vibe coding: log implementasi per fitur dengan detail per commit, dan penghapusan log vibe coding hasby.md.

| File | + | − | Status |
|---|---:|---:|---|
| `Ternakin SDD Website (PWA).md` | 2 | 1 | diubah |
| `apps/api/src/app.ts` | 7 | 0 | diubah |
| `apps/api/src/config/env.ts` | 3 | 0 | diubah |
| `apps/api/src/lib/sesiMasuk.ts` | 9 | 3 | diubah |
| `apps/api/src/middleware/sesi.ts` | 14 | 1 | diubah |
| `apps/api/src/mobile.test.ts` | 53 | 0 | baru |
| `apps/api/src/routes/auth.ts` | 7 | 2 | diubah |
| `apps/api/src/routes/authEmail.ts` | 5 | 1 | diubah |
| `apps/api/src/server.ts` | 1 | 0 | diubah |
| `apps/mobile/.claude/settings.json` | 5 | 0 | baru |
| `apps/mobile/.env.example` | 5 | 0 | baru |
| `apps/mobile/.gitignore` | 50 | 0 | baru |
| `apps/mobile/.vscode/extensions.json` | 1 | 0 | baru |
| `apps/mobile/.vscode/settings.json` | 7 | 0 | baru |
| `apps/mobile/AGENTS.md` | 41 | 0 | baru |
| `apps/mobile/README.md` | 91 | 0 | baru |
| `apps/mobile/app.json` | 53 | 0 | baru |
| `apps/mobile/assets/images/android-icon-foreground.png` | biner | biner | baru |
| `apps/mobile/assets/images/favicon.png` | biner | biner | baru |
| `apps/mobile/assets/images/icon.png` | biner | biner | baru |
| `apps/mobile/assets/images/kokok.webp` | biner | biner | baru |
| `apps/mobile/assets/images/splash-icon.png` | biner | biner | baru |
| `apps/mobile/eas.json` | 26 | 0 | baru |
| `apps/mobile/package.json` | 51 | 0 | baru |
| `apps/mobile/scripts/dev.mjs` | 25 | 0 | baru |
| `apps/mobile/src/app/(tab)/_layout.tsx` | 26 | 0 | baru |
| `apps/mobile/src/app/(tab)/catatan.tsx` | 411 | 0 | baru |
| `apps/mobile/src/app/(tab)/index.tsx` | 215 | 0 | baru |
| `apps/mobile/src/app/(tab)/kokok.tsx` | 235 | 0 | baru |
| `apps/mobile/src/app/(tab)/pakan.tsx` | 551 | 0 | baru |
| `apps/mobile/src/app/(tab)/profil.tsx` | 148 | 0 | baru |
| `apps/mobile/src/app/_layout.tsx` | 100 | 0 | baru |
| `apps/mobile/src/app/masuk.tsx` | 766 | 0 | baru |
| `apps/mobile/src/app/sambutan.tsx` | 210 | 0 | baru |
| `apps/mobile/src/components/BilahTab.tsx` | 115 | 0 | baru |
| `apps/mobile/src/components/GaugeBusur.tsx` | 88 | 0 | baru |
| `apps/mobile/src/components/KartuCatatan.tsx` | 96 | 0 | baru |
| `apps/mobile/src/components/MasukUi.tsx` | 175 | 0 | baru |
| `apps/mobile/src/components/ui.tsx` | 370 | 0 | baru |
| `apps/mobile/src/lib/akun.ts` | 103 | 0 | baru |
| `apps/mobile/src/lib/api.ts` | 87 | 0 | baru |
| `apps/mobile/src/lib/kandang.ts` | 376 | 0 | baru |
| `apps/mobile/src/lib/penyimpanan.ts` | 40 | 0 | baru |
| `apps/mobile/src/lib/referensi.ts` | 105 | 0 | baru |
| `apps/mobile/src/lib/sambutan.tsx` | 42 | 0 | baru |
| `apps/mobile/src/lib/sesi.tsx` | 139 | 0 | baru |
| `apps/mobile/src/lib/tema.ts` | 41 | 0 | baru |
| `apps/mobile/tsconfig.json` | 11 | 0 | baru |
| `deploy/cloudflared/ternakin-dev.example.yml` | 17 | 0 | baru |
| `docker-compose.yml` | 2 | 0 | diubah |
| `eslint.config.js` | 20 | 0 | diubah |
| `log vibe coding/log implementasi/01-fondasi-dan-pwa.md` | 211 | 0 | baru |
| `log vibe coding/log implementasi/02-ui-dan-maskot.md` | 281 | 0 | baru |
| `log vibe coding/log implementasi/03-pakan.md` | 151 | 0 | baru |
| `log vibe coding/log implementasi/04-catatan-kandang.md` | 103 | 0 | baru |
| `log vibe coding/log implementasi/05-toko-rujukan.md` | 98 | 0 | baru |
| `log vibe coding/log implementasi/06-kokok.md` | 241 | 0 | baru |
| `log vibe coding/log implementasi/07-landing.md` | 196 | 0 | baru |
| `log vibe coding/log implementasi/08-akun-dan-investasi.md` | 253 | 0 | baru |
| `log vibe coding/log implementasi/README.md` | 53 | 0 | baru |
| `log vibe coding/log vibe coding hasby.md` | 0 | 171 | dihapus |
| `package-lock.json` | 10655 | 3771 | diubah |
| `package.json` | 8 | 2 | diubah |
| `packages/shared/package.json` | 2 | 1 | diubah |
| `packages/shared/src/schemas/akun.ts` | 2 | 0 | diubah |
| `scripts/tunnel.mjs` | 23 | 0 | baru |

### `b4d9731` — feat(mobile): menambah EAS Update dan mengarahkan APK preview/production ke server produksi

- **Tanggal:** 2026-11-23 · **Penulis:** HanzzzBD · **Model:** Claude Opus 5.5
- **Ringkasan:** 7 file, +207 / -4 baris

**Isi pesan commit:**

> - expo-updates ~58.0.22; app.json berisi updates.url dan runtimeVersion berkebijakan fingerprint agar update tidak dikirim ke APK yang native-nya berbeda.
> - eas.json: channel preview/production, dan EXPO_PUBLIC_API_URL kedua profil ke https://ternakin.code-xpert.my.id (profil development tetap memakai tunnel).
> - scripts/update.mjs (npm run update): membangun @ternakin/shared lalu menjalankan eas update --channel/--environment dengan alamat API produksi yang dipaksa, agar alamat tunnel dari .env lokal tidak ikut terkirim.
> - Hook eas-build-post-install membangun @ternakin/shared di server EAS. Sebelumnya build preview gagal di fase bundle karena packages/shared/dist tidak ikut git.
> - Alamat API bawaan di src/lib/api.ts diganti ke server produksi.
> - README mobile: alamat produksi dan panduan EAS Update.

| File | + | − | Status |
|---|---:|---:|---|
| `apps/mobile/README.md` | 33 | 0 | diubah |
| `apps/mobile/app.json` | 2 | 0 | diubah |
| `apps/mobile/eas.json` | 4 | 2 | diubah |
| `apps/mobile/package.json` | 3 | 0 | diubah |
| `apps/mobile/scripts/update.mjs` | 60 | 0 | baru |
| `apps/mobile/src/lib/api.ts` | 6 | 2 | diubah |
| `package-lock.json` | 99 | 0 | diubah |

### `8b0cd50` — feat(unduhan): menyediakan unduhan APK Android dari website Ternakin

- **Tanggal:** 2026-11-23 · **Penulis:** HanzzzBD · **Model:** Claude Opus 5.5
- **Ringkasan:** 16 file, +370 / -1 baris

**Isi pesan commit:**

> - API: GET /unduh/ternakin.apk mengirim APK sebagai lampiran, dan GET /v1/unduhan memberi info tersedia/ukuran/waktu diperbarui. APK dibaca dari UNDUHAN_DIR (bawaan <folder database>/unduhan) sehingga tidak terhapus saat deploy.
> - Shared: skema unduhanResponseSchema dan URL_UNDUH_ANDROID. OpenAPI diperbarui.
> - Web: tombol "Unduh untuk Android (xx MB)" di hero dan ajakan penutup landing, hanya tampil bila APK tersedia. Service worker tidak mengalihkan /unduh/ ke index.html.
> - deploy/pasang-apk.sh: mengunduh APK dari link hasil eas build (atau menyalin berkas), memeriksa bahwa berkas benar APK, lalu menggantinya sekaligus.
> - Tes: 4 tes API unduhan dan 2 tes tombol unduh.

| File | + | − | Status |
|---|---:|---:|---|
| `.env.example` | 3 | 0 | diubah |
| `apps/api/src/app.ts` | 6 | 0 | diubah |
| `apps/api/src/config/env.ts` | 2 | 0 | diubah |
| `apps/api/src/openapi.ts` | 13 | 0 | diubah |
| `apps/api/src/routes/unduhan.ts` | 66 | 0 | baru |
| `apps/api/src/routes/v1.ts` | 6 | 0 | diubah |
| `apps/api/src/server.ts` | 8 | 0 | diubah |
| `apps/api/src/unduhan.test.ts` | 73 | 0 | baru |
| `apps/web/src/components/landing/TombolUnduhAndroid.test.tsx` | 50 | 0 | baru |
| `apps/web/src/components/landing/TombolUnduhAndroid.tsx` | 32 | 0 | baru |
| `apps/web/src/lib/unduhan.ts` | 21 | 0 | baru |
| `apps/web/src/pages/LandingPage.tsx` | 3 | 0 | diubah |
| `apps/web/vite.config.ts` | 2 | 1 | diubah |
| `deploy/pasang-apk.sh` | 58 | 0 | baru |
| `packages/shared/src/index.ts` | 7 | 0 | diubah |
| `packages/shared/src/schemas/unduhan.ts` | 20 | 0 | baru |
