# Catatan Kandang dan Sinkronisasi

| Commit | Tanggal | Penulis | Model (trailer) | Pesan |
|---|---|---|---|---|
| `179d8c7` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(catatan): menambah skema kandang, catatan harian, sinkronisasi, dan evaluateAlerts |
| `3172653` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(sinkron): menambah endpoint kandang, catatan harian, sinkron idempoten, dan hapus akun |
| `dba7e7d` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(catatan): membangun profil kandang, catatan harian offline-first, sparkline, dan sinkronisasi outbox |

## Isi

**Skema dan peringatan (`179d8c7`).** Skema Zod untuk kandang, catatan harian, outbox sinkronisasi, dan ambang peringatan di data referensi. Fungsi murni `evaluateAlerts` membaca ambangnya dari data referensi, tanpa angka tetap di dalam kode.

**Endpoint dan sinkronisasi (`3172653`).** Ambang peringatan contoh di `seed/referensi.json`. Tabel `outbox_diproses` untuk idempotensi, serta kolom `dihapus_pada` dan `bahan_tersedia_json`. Route `GET` dan `POST /v1/kandang`, `PUT /v1/catatan/{id}`, dan `POST /v1/sinkron`, yang idempoten per UUID operasi. Penghapusan akun juga ada di commit ini.

**Layar offline (`dba7e7d`).** Tabel Dexie untuk kandang, catatan, dan outbox. Mesin sinkronisasi outbox dipicu saat aplikasi dibuka, saat kembali online, saat `visibilitychange`, dan dengan retry bertahap, tanpa Background Sync API. Komponen `Sparkline` SVG menampilkan 7 dan 14 hari. Halaman profil kandang dan catatan harian ditambahkan.

## Keputusan yang tercatat

- Sinkronisasi memakai outbox dengan idempotensi per UUID, tanpa Background Sync API. Pesan commit tidak menyebut alasannya.
- Ambang peringatan berasal dari data referensi, agar bisa diubah tanpa mengubah kode.

---

## Detail perubahan per commit

Bagian ini dibuat dari `git show` untuk setiap commit: jumlah baris berubah per file, status file (baru atau diubah), dan isi pesan commit.

### `179d8c7` — feat(catatan): menambah skema kandang, catatan harian, sinkronisasi, dan evaluateAlerts

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 5 file, +333 / -0 baris

**Isi pesan commit:**

> Menambahkan skema Zod untuk kandang, catatan harian, outbox sinkronisasi, dan ambang peringatan pada referensi, serta fungsi murni evaluateAlerts yang membaca ambang dari data referensi tanpa konstanta ajaib.
> Fase 3

| File | + | − | Status |
|---|---:|---:|---|
| `packages/shared/src/alerts/evaluateAlerts.test.ts` | 84 | 0 | baru |
| `packages/shared/src/alerts/evaluateAlerts.ts` | 107 | 0 | baru |
| `packages/shared/src/index.ts` | 22 | 0 | diubah |
| `packages/shared/src/schemas/catatan.ts` | 109 | 0 | baru |
| `packages/shared/src/schemas/referensi.ts` | 11 | 0 | diubah |


### `3172653` — feat(sinkron): menambah endpoint kandang, catatan harian, sinkron idempoten, dan hapus akun

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 11 file, +751 / -1 baris

**Isi pesan commit:**

> Menambahkan ambang peringatan contoh pada seed/referensi.json, tabel outbox_diproses serta kolom dihapus_pada dan bahan_tersedia_json, route GET/POST /v1/kandang, PUT /v1/catatan/{id}, POST /v1/sinkron (idempoten per UUID outbox dengan aturan perubahan terbaru menang), DELETE /v1/akun, pembaruan OpenAPI 3.1, dan tes supertest.
> Fase 3

| File | + | − | Status |
|---|---:|---:|---|
| `apps/api/migrations/001_init.sql` | 8 | 0 | diubah |
| `apps/api/seed/referensi.json` | 11 | 0 | diubah |
| `apps/api/src/catatan.test.ts` | 179 | 0 | baru |
| `apps/api/src/db/catatanRepo.ts` | 254 | 0 | baru |
| `apps/api/src/db/database.ts` | 20 | 0 | diubah |
| `apps/api/src/openapi.ts` | 50 | 1 | diubah |
| `apps/api/src/routes/akun.ts` | 40 | 0 | baru |
| `apps/api/src/routes/catatan.ts` | 51 | 0 | baru |
| `apps/api/src/routes/kandang.ts` | 69 | 0 | baru |
| `apps/api/src/routes/sinkron.ts` | 61 | 0 | baru |
| `apps/api/src/routes/v1.ts` | 8 | 0 | diubah |


### `dba7e7d` — feat(catatan): membangun profil kandang, catatan harian offline-first, sparkline, dan sinkronisasi outbox

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 19 file, +2042 / -36 baris

**Isi pesan commit:**

> Menambahkan tabel Dexie kandang/catatan/outbox, mesin sinkronisasi outbox (flush saat buka, online, visibilitychange, dan simpan dengan retry bertahap tanpa Background Sync API), Sparkline SVG 7 dan 14 hari, halaman /app/profil dengan hapus data (DELETE /v1/akun), layar /app/catatan dengan riwayat 30 hari dan kartu peringatan dini offline, pembaruan Beranda dan chip status sinkron di AppShell, serta tes unit dan Playwright offline penuh.
> Fase 3

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/e2e/catatan-offline.spec.ts` | 82 | 0 | baru |
| `apps/web/playwright.config.ts` | 8 | 3 | diubah |
| `apps/web/public/data/referensi-bawaan.json` | 11 | 0 | diubah |
| `apps/web/src/App.test.tsx` | 1 | 1 | diubah |
| `apps/web/src/App.tsx` | 4 | 1 | diubah |
| `apps/web/src/components/layout/AppShell.css` | 19 | 0 | diubah |
| `apps/web/src/components/layout/AppShell.tsx` | 37 | 11 | diubah |
| `apps/web/src/components/ui/Sparkline.tsx` | 89 | 0 | baru |
| `apps/web/src/components/ui/index.ts` | 1 | 0 | diubah |
| `apps/web/src/components/ui/ui.css` | 35 | 0 | diubah |
| `apps/web/src/db/db.ts` | 64 | 6 | diubah |
| `apps/web/src/db/sync.ts` | 471 | 0 | baru |
| `apps/web/src/main.tsx` | 4 | 0 | diubah |
| `apps/web/src/pages/CatatanPage.css` | 136 | 0 | baru |
| `apps/web/src/pages/CatatanPage.test.tsx` | 82 | 0 | baru |
| `apps/web/src/pages/CatatanPage.tsx` | 532 | 0 | baru |
| `apps/web/src/pages/FondasiPage.tsx` | 176 | 14 | diubah |
| `apps/web/src/pages/PakanPage.test.tsx` | 1 | 0 | diubah |
| `apps/web/src/pages/ProfilPage.tsx` | 289 | 0 | baru |

