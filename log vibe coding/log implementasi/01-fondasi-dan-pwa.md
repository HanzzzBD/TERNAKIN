# Fondasi dan PWA

| Commit | Tanggal | Penulis | Model (trailer) | Pesan |
|---|---|---|---|---|
| `3252682` | 19 Nov | hasbywira90 | Claude Sonnet 5.5 | Add PRD and SDD for Ternakin website (PWA) |
| `ffb10af` | 19 Nov | hasbywira90 | Claude Sonnet 5.5 | Remove author name from PRD and SDD |
| `bd2b287` | 19 Nov | Muhammad Khalifa | tidak tercatat | build(deps): menyiapkan fondasi monorepo npm workspaces dan konfigurasi |
| `04446f9` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(shared): menambah skema zod galat seragam dan kesehatan |
| `bcb5c7c` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(api): menyiapkan server Express dasar dengan /health dan fallback SPA |
| `5f28c8a` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(pwa): menyiapkan cangkang PWA offline-first dan halaman uji fondasi |
| `9ef1c5f` | 19 Nov | Muhammad Khalifa | tidak tercatat | fix(pwa): mengubah orientasi manifest menjadi any untuk dukungan laptop |
| `ecc37f8` | 19 Nov | Muhammad Khalifa | tidak tercatat | build(deps): menambah @axe-core/playwright untuk audit aksesibilitas |
| `578cbb8` | 20 Nov | hasbywira90 | Claude Opus 5.5 | chore(deps): memperbarui package-lock hasil npm install |

## Isi

**Dokumen (`3252682`, `ffb10af`).** PRD dan SDD untuk website PWA ditulis lebih dulu sebagai acuan. Commit kedua menghapus nama penulis dari dua dokumen itu.

**Monorepo (`bd2b287`).** Tiga paket dalam npm workspaces: `apps/web`, `apps/api`, dan `packages/shared`. Konfigurasi bersama mencakup TypeScript ketat, ESLint, Prettier, dan `.env.example`.

**Skema bersama (`04446f9`).** Skema Zod untuk format galat seragam `{ kode, pesan, rinci }` sesuai SDD, beserta respons `/health`. Diuji dengan Vitest.

**Server API (`bcb5c7c`).** Express dengan helmet, pino, rate limiter, middleware validasi Zod, dan penangan galat yang tidak membocorkan jejak tumpukan. Server juga menyajikan `dist` web dengan aturan `Cache-Control` dan fallback SPA.

**Cangkang PWA (`5f28c8a`, `9ef1c5f`).** React + Vite + vite-plugin-pwa dengan Workbox `generateSW` dan `registerType: prompt`. Ikon manifest 192, 512, dan maskable. Halaman uji tetap terbuka saat offline, dengan tes unit dan Playwright offline. Commit `9ef1c5f` mengubah orientasi manifest dari portrait menjadi `any` dan menambahkan `id` serta `purpose` ikon, agar aplikasi bisa dipasang di laptop tanpa peringatan.

**Audit aksesibilitas (`ecc37f8`).** `@axe-core/playwright` ditambahkan sebagai devDependency untuk pemindaian aksesibilitas otomatis.

**Lockfile (`578cbb8`).** Menyelaraskan `package-lock.json` dengan hasil `npm install` terbaru: dependensi opsional `@emnapi/core` dan `@emnapi/runtime`. Tidak ada perubahan versi dependensi.

## Keputusan yang tercatat

- Fase kerja tercatat di pesan commit: Fase 0 untuk fondasi, Fase 1 untuk UI dan aksesibilitas.
- Manifest memakai orientasi `any` agar tidak terkunci ke potret di laptop.

---

## Detail perubahan per commit

Bagian ini dibuat dari `git show` untuk setiap commit: jumlah baris berubah per file, status file (baru atau diubah), dan isi pesan commit.

### `3252682` — Add PRD and SDD for Ternakin website (PWA)

- **Tanggal:** 2026-11-19 · **Penulis:** hasbywira90 · **Model:** Claude Sonnet 5.5
- **Ringkasan:** 2 file, +267 / -0 baris

| File | + | − | Status |
|---|---:|---:|---|
| `Ternakin PRD Website (PWA).md` | 127 | 0 | baru |
| `Ternakin SDD Website (PWA).md` | 140 | 0 | baru |


### `ffb10af` — Remove author name from PRD and SDD

- **Tanggal:** 2026-11-19 · **Penulis:** hasbywira90 · **Model:** Claude Sonnet 5.5
- **Ringkasan:** 2 file, +2 / -2 baris

| File | + | − | Status |
|---|---:|---:|---|
| `Ternakin PRD Website (PWA).md` | 1 | 1 | diubah |
| `Ternakin SDD Website (PWA).md` | 1 | 1 | diubah |


### `bd2b287` — build(deps): menyiapkan fondasi monorepo npm workspaces dan konfigurasi

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 14 file, +10656 / -0 baris

**Isi pesan commit:**

> Menyiapkan npm workspaces untuk apps/web, apps/api, dan packages/shared beserta TypeScript ketat, ESLint, Prettier, dan .env.example.
> Fase 0

| File | + | − | Status |
|---|---:|---:|---|
| `.env.example` | 17 | 0 | baru |
| `.gitignore` | 33 | 0 | baru |
| `.prettierignore` | 8 | 0 | baru |
| `.prettierrc.json` | 7 | 0 | baru |
| `apps/api/package.json` | 31 | 0 | baru |
| `apps/api/tsconfig.json` | 10 | 0 | baru |
| `apps/web/package.json` | 34 | 0 | baru |
| `apps/web/tsconfig.json` | 20 | 0 | baru |
| `eslint.config.js` | 42 | 0 | baru |
| `package-lock.json` | 10371 | 0 | baru |
| `package.json` | 32 | 0 | baru |
| `packages/shared/package.json` | 23 | 0 | baru |
| `packages/shared/tsconfig.json` | 12 | 0 | baru |
| `tsconfig.base.json` | 16 | 0 | baru |


### `04446f9` — feat(shared): menambah skema zod galat seragam dan kesehatan

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 4 file, +51 / -0 baris

**Isi pesan commit:**

> Menyediakan skema zod bersama untuk format galat { kode, pesan, rinci } sesuai SDD serta respons /health dan unit tes Vitest.
> Fase 0

| File | + | − | Status |
|---|---:|---:|---|
| `packages/shared/src/index.ts` | 2 | 0 | baru |
| `packages/shared/src/schemas/galat.test.ts` | 33 | 0 | baru |
| `packages/shared/src/schemas/galat.ts` | 9 | 0 | baru |
| `packages/shared/src/schemas/kesehatan.ts` | 7 | 0 | baru |


### `bcb5c7c` — feat(api): menyiapkan server Express dasar dengan /health dan fallback SPA

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 9 file, +306 / -0 baris

**Isi pesan commit:**

> Menambahkan server Express dengan helmet, pino, rate limiter, middleware validasi zod, penangan galat seragam tanpa jejak tumpukan, dan penyajian dist web dengan aturan Cache-Control serta fallback SPA yang tidak menimpa /v1, /health, /sw.js, dan /manifest.webmanifest.
> Fase 0

| File | + | − | Status |
|---|---:|---:|---|
| `apps/api/src/app.test.ts` | 107 | 0 | baru |
| `apps/api/src/app.ts` | 69 | 0 | baru |
| `apps/api/src/config/env.ts` | 20 | 0 | baru |
| `apps/api/src/lib/logger.ts` | 5 | 0 | baru |
| `apps/api/src/middleware/errorHandler.ts` | 40 | 0 | baru |
| `apps/api/src/middleware/rateLimit.ts` | 15 | 0 | baru |
| `apps/api/src/middleware/validate.ts` | 26 | 0 | baru |
| `apps/api/src/routes/v1.ts` | 13 | 0 | baru |
| `apps/api/src/server.ts` | 11 | 0 | baru |


### `5f28c8a` — feat(pwa): menyiapkan cangkang PWA offline-first dan halaman uji fondasi

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 20 file, +828 / -0 baris

**Isi pesan commit:**

> Mengonfigurasi React + Vite + vite-plugin-pwa (Workbox generateSW, registerType prompt), ikon manifest 192/512/maskable, halaman uji yang tetap terbuka dalam mode offline, serta tes unit dan Playwright offline.
> Fase 0

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/e2e/offline.spec.ts` | 39 | 0 | baru |
| `apps/web/index.html` | 19 | 0 | baru |
| `apps/web/playwright.config.ts` | 15 | 0 | baru |
| `apps/web/public/icons/icon-192.png` | - | - | baru |
| `apps/web/public/icons/icon-512.png` | - | - | baru |
| `apps/web/public/icons/icon.svg` | 6 | 0 | baru |
| `apps/web/public/icons/maskable-512.png` | - | - | baru |
| `apps/web/src/App.test.tsx` | 55 | 0 | baru |
| `apps/web/src/App.tsx` | 14 | 0 | baru |
| `apps/web/src/components/PwaStatusBar.tsx` | 37 | 0 | baru |
| `apps/web/src/lib/pwa.ts` | 92 | 0 | baru |
| `apps/web/src/lib/teks.ts` | 29 | 0 | baru |
| `apps/web/src/main.tsx` | 15 | 0 | baru |
| `apps/web/src/pages/FondasiPage.tsx` | 150 | 0 | baru |
| `apps/web/src/styles/fondasi.css` | 243 | 0 | baru |
| `apps/web/src/test/pwaRegisterMock.ts` | 7 | 0 | baru |
| `apps/web/src/test/setup.ts` | 19 | 0 | baru |
| `apps/web/src/vite-env.d.ts` | 2 | 0 | baru |
| `apps/web/vite.config.ts` | 66 | 0 | baru |
| `apps/web/vitest.config.ts` | 20 | 0 | baru |


### `9ef1c5f` — fix(pwa): mengubah orientasi manifest menjadi any untuk dukungan laptop

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 2 file, +39 / -12 baris

**Isi pesan commit:**

> Mengubah orientation dari portrait menjadi any dan menambahkan id serta purpose ikon eksplisit pada manifest PWA agar bisa dipasang di laptop tanpa peringatan, serta memperluas tes Playwright.
> Fase 0

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/e2e/offline.spec.ts` | 35 | 9 | diubah |
| `apps/web/vite.config.ts` | 4 | 3 | diubah |


### `ecc37f8` — build(deps): menambah @axe-core/playwright untuk audit aksesibilitas

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 2 file, +29 / -36 baris

**Isi pesan commit:**

> Menambahkan @axe-core/playwright sebagai devDependency di apps/web untuk pemindaian aksesibilitas otomatis pada Playwright.
> Fase 1

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/package.json` | 1 | 0 | diubah |
| `package-lock.json` | 28 | 36 | diubah |


### `578cbb8` — chore(deps): memperbarui package-lock hasil npm install

- **Tanggal:** 2026-11-20 · **Penulis:** hasbywira90 · **Model:** Claude Opus 5.5
- **Ringkasan:** 1 file, +34 / -21 baris

**Isi pesan commit:**

> Menyelaraskan metadata package-lock.json dengan hasil npm install terbaru: menambah dependensi opsional @emnapi/core dan @emnapi/runtime serta merapikan penanda peer pada beberapa paket. Tidak ada perubahan versi dependensi langsung.

| File | + | − | Status |
|---|---:|---:|---|
| `package-lock.json` | 34 | 21 | diubah |

