# Aplikasi Mobile (Android, Expo)

| Commit | Tanggal | Penulis | Model (trailer) | Pesan |
|---|---|---|---|---|
| `e1e7197` | 23 Nov | HanzzzBD | Claude Haiku 5.5 | feat(mobile): menambah aplikasi mobile Expo, perbaikan API akun, dan log implementasi |

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

## Keputusan yang tercatat

- Aplikasi mobile berbagi logika dengan web lewat `@ternakin/shared`.
- Sesi mobile memakai token Bearer karena aplikasi native tidak bisa memakai cookie HttpOnly seperti browser. Token hanya dikirim bila klien menandai diri sebagai mobile.
- Build APK lewat EAS di cloud.

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
