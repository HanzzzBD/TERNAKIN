# Rujukan Toko Pakan

| Commit | Tanggal | Penulis | Model (trailer) | Pesan |
|---|---|---|---|---|
| `8f22daa` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(toko): menambah skema toko, lead, dan fungsi murni rankStores |
| `40d9e74` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(toko): menambah seed 5 toko contoh, rujukan biaya, lead idempoten, dan rute admin |
| `6490ea9` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(toko): membangun layar rujukan toko offline-first dan antrean lead WhatsApp |

## Isi

**Skema dan peringkat (`8f22daa`).** Skema Zod untuk toko, harga toko, lead, dan pembaruan harga oleh admin. Operasi `catat_lead` masuk ke outbox. Fungsi murni `rankStores` mengurutkan toko hanya dari total biaya pakan, dan menandai harga yang sudah usang.

**Seed dan admin (`40d9e74`).** Seed lima toko contoh di Bandung Raya dengan `is_demo=1`. Satu toko sengaja memakai harga usang untuk menguji penandaan. Tidak ada nomor telepon yang belum terverifikasi. Middleware `X-Admin-Key` memakai `crypto.timingSafeEqual`. Endpoint `GET /v1/toko` dan lead idempoten.

**Layar offline (`6490ea9`).** Daftar toko disimpan lokal di Dexie versi 3. Lead masuk ke antrean outbox `catatLeadLokal` tanpa memblokir pengguna. Penyusun tautan `wa.me` tidak memakai nomor telepon palsu. Layar `/app/toko` diurutkan murni dari total biaya dan diberi label "Toko mitra" atau "B".

## Keputusan yang tercatat

- Urutan toko hanya dari total biaya. Tidak ada faktor lain yang dicampur ke peringkat.
- Nomor WhatsApp toko tidak diisi dengan nomor palsu. Tautan dibuat tanpa nomor bila nomor belum terverifikasi.
- Endpoint admin dilindungi kunci header dengan perbandingan waktu-konstan.

---

## Detail perubahan per commit

Bagian ini dibuat dari `git show` untuk setiap commit: jumlah baris berubah per file, status file (baru atau diubah), dan isi pesan commit.

### `8f22daa` — feat(toko): menambah skema toko, lead, dan fungsi murni rankStores

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 5 file, +420 / -0 baris

**Isi pesan commit:**

> Menambahkan skema Zod toko, harga toko, lead, dan update harga admin, menambahkan operasi catat_lead pada outbox, serta fungsi murni rankStores yang mengurutkan murni dari total biaya pakan dan menandai harga usang melewati STALE_DAYS tanpa menyembunyikannya.
> Fase 4

| File | + | − | Status |
|---|---:|---:|---|
| `packages/shared/src/index.ts` | 24 | 0 | diubah |
| `packages/shared/src/schemas/catatan.ts` | 11 | 0 | diubah |
| `packages/shared/src/schemas/toko.ts` | 93 | 0 | baru |
| `packages/shared/src/stores/rank.test.ts` | 157 | 0 | baru |
| `packages/shared/src/stores/rank.ts` | 135 | 0 | baru |


### `40d9e74` — feat(toko): menambah seed 5 toko contoh, rujukan biaya, lead idempoten, dan rute admin

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 14 file, +813 / -2 baris

**Isi pesan commit:**

> Menambahkan seed 5 toko contoh Bandung Raya (is_demo=1, tanpa nomor telepon tak terverifikasi, termasuk satu toko harga usang), middleware X-Admin-Key berbasis crypto.timingSafeEqual, endpoint GET /v1/toko, GET /v1/toko/rujukan, POST /v1/lead, PUT /v1/admin/toko/{id}/harga, GET /v1/admin/lead (JSON/CSV), dukungan catat_lead di /v1/sinkron, pembaruan OpenAPI 3.1, dan tes supertest.
> Fase 4

| File | + | − | Status |
|---|---:|---:|---|
| `apps/api/migrations/001_init.sql` | 3 | 1 | diubah |
| `apps/api/seed/toko.json` | 97 | 0 | baru |
| `apps/api/src/app.ts` | 3 | 0 | diubah |
| `apps/api/src/db/database.ts` | 64 | 0 | diubah |
| `apps/api/src/db/tokoRepo.ts` | 202 | 0 | baru |
| `apps/api/src/middleware/requireAdminKey.ts` | 39 | 0 | baru |
| `apps/api/src/openapi.ts` | 49 | 1 | diubah |
| `apps/api/src/routes/admin.ts` | 85 | 0 | baru |
| `apps/api/src/routes/lead.ts` | 36 | 0 | baru |
| `apps/api/src/routes/sinkron.ts` | 11 | 0 | diubah |
| `apps/api/src/routes/toko.ts` | 74 | 0 | baru |
| `apps/api/src/routes/v1.ts` | 7 | 0 | diubah |
| `apps/api/src/server.ts` | 1 | 0 | diubah |
| `apps/api/src/toko.test.ts` | 142 | 0 | baru |


### `6490ea9` — feat(toko): membangun layar rujukan toko offline-first dan antrean lead WhatsApp

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 10 file, +766 / -2 baris

**Isi pesan commit:**

> Menambahkan penyimpanan daftar toko lokal di Dexie v3, antrean outbox catatLeadLokal non-blocking, penyusun tautan wa.me tanpa nomor telepon palsu, layar /app/toko berurut murni dari total biaya dengan label Toko mitra/Bukan mitra, Data contoh, asal dan umur harga, badge Usang, serta tes unit dan Playwright offline + axe.
> Fase 4

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/e2e/toko-offline.spec.ts` | 103 | 0 | baru |
| `apps/web/playwright.config.ts` | 2 | 1 | diubah |
| `apps/web/src/App.tsx` | 2 | 1 | diubah |
| `apps/web/src/db/db.ts` | 19 | 0 | diubah |
| `apps/web/src/db/sync.ts` | 39 | 0 | diubah |
| `apps/web/src/lib/toko.ts` | 70 | 0 | baru |
| `apps/web/src/lib/wa.ts` | 30 | 0 | baru |
| `apps/web/src/pages/TokoPage.css` | 126 | 0 | baru |
| `apps/web/src/pages/TokoPage.test.tsx` | 84 | 0 | baru |
| `apps/web/src/pages/TokoPage.tsx` | 291 | 0 | baru |

