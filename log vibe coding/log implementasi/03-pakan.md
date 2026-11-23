# Penyusun Pakan

| Commit | Tanggal | Penulis | Model (trailer) | Pesan |
|---|---|---|---|---|
| `dd3386d` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(solver): menambah skema pakan, solver LP Two-Phase Simplex, dan pemeriksa penjelasan |
| `b9461c1` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(api): menambah basis data SQLite, adaptor LLM mock, dan endpoint penyusun pakan |
| `9d0331c` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(web): membangun layar penyusun pakan offline-first di /app/pakan |
| `184eeea` | 20 Nov | hasbywira90 | Claude Opus 5.5 | feat(pakan): menyatukan input teks bebas ke baris Lainnya di daftar bahan |
| `02a5969` | 21 Nov | HanzzzBD | Claude Opus 5.5 | fix(pakan): menyesuaikan batas minimum fosfor fase layer dengan SNI 8290.5:2016 |

## Isi

**Solver (`dd3386d`).** Solver LP Two-Phase Simplex murni di `packages/shared` dengan nol dependensi, sehingga hasilnya identik di perangkat dan di server. Ditambah utilitas format Rupiah dan angka id-ID, serta `verifyFeedExplanation` untuk memeriksa penjelasan terhadap hasil solver.

**Backend (`b9461c1`).** Migrasi SQLite 10 tabel sesuai SDD, ditambah tiga tabel: `lead`, `pemakaian_llm`, dan `cache_llm`. Data referensi contoh untuk bahan dan kebutuhan gizi petelur ada di `seed/referensi.json`. Ada `MockLlmAdapter`, `SharedSolverAdapter`, dan endpoint `/v1/bahan` serta penyusun pakan.

**Layar offline (`9d0331c`).** Penyimpanan Dexie untuk referensi, draf, dan komposisi. Solver berjalan di Web Worker. Layar `/app/pakan` dengan pemilihan fase petelur, bahan dan harga yang tersimpan offline, jalan pintas teks bebas dengan konfirmasi wajib "Cek dulu bacaan kami", dan hasil.

**Teks bebas (`184eeea`).** Kartu terpisah "Jalan pintas" dihapus. Sebagai gantinya ada baris "Lainnya" di akhir daftar bahan. Bila dicentang, pengguna menulis nama bahan dan harga dalam satu kolom. Teks petunjuk diringkas, dan tes unit serta E2E offline disesuaikan.

**Batas fosfor (`02a5969`).** Batas minimum fosfor pakan petelur masa produksi naik dari 0,45% ke 0,55%, sesuai SNI 8290.5:2016 (dikutip Hakim dkk. 2024, JINTP 22(2):122-128). Versi data referensi dinaikkan ke `2026.11.demo-2` agar salinan offline di perangkat ikut diperbarui.

## Keputusan yang tercatat

- Solver dibuat murni dan tanpa dependensi agar bisa dijalankan sama persis di perangkat dan server.
- Batas fosfor mengikuti SNI, bukan angka lama. Sumber dicantumkan di pesan commit.
- Teks bebas dipindah ke dalam daftar bahan, bukan kartu terpisah, agar tidak membingungkan pengguna.

---

## Detail perubahan per commit

Bagian ini dibuat dari `git show` untuk setiap commit: jumlah baris berubah per file, status file (baru atau diubah), dan isi pesan commit.

### `dd3386d` — feat(solver): menambah skema pakan, solver LP Two-Phase Simplex, dan pemeriksa penjelasan

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 9 file, +1286 / -0 baris

**Isi pesan commit:**

> Menambahkan skema Zod pakan dan referensi, utilitas format Rupiah/angka id-ID, solver LP Two-Phase Simplex murni di packages/shared (0 dependensi, identik di perangkat dan server), serta fungsi verifyFeedExplanation yang menolak penjelasan LLM jika menyebut angka berbeda dari solver.
> Fase 2

| File | + | − | Status |
|---|---:|---:|---|
| `packages/shared/src/feed/solver.test.ts` | 272 | 0 | baru |
| `packages/shared/src/feed/solver.ts` | 587 | 0 | baru |
| `packages/shared/src/feed/verifyExplanation.test.ts` | 72 | 0 | baru |
| `packages/shared/src/feed/verifyExplanation.ts` | 95 | 0 | baru |
| `packages/shared/src/index.ts` | 45 | 0 | diubah |
| `packages/shared/src/lib/format.test.ts` | 17 | 0 | baru |
| `packages/shared/src/lib/format.ts` | 21 | 0 | baru |
| `packages/shared/src/schemas/pakan.ts` | 134 | 0 | baru |
| `packages/shared/src/schemas/referensi.ts` | 43 | 0 | baru |


### `b9461c1` — feat(api): menambah basis data SQLite, adaptor LLM mock, dan endpoint penyusun pakan

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 15 file, +1464 / -14 baris

**Isi pesan commit:**

> Menambahkan migrasi 10 tabel SDD dan 3 tabel tambahan (lead, pemakaian_llm, cache_llm), data referensi contoh bahan dan kebutuhan gizi petelur di seed/referensi.json, MockLlmAdapter, SharedSolverAdapter, endpoint /v1/bahan, /v1/referensi, /v1/pakan/urai, /v1/pakan/hitung, /v1/pakan/jelaskan (dengan verifikasi angka ketat), /v1/openapi.json, serta tes supertest.
> Fase 2

| File | + | − | Status |
|---|---:|---:|---|
| `apps/api/migrations/001_init.sql` | 122 | 0 | baru |
| `apps/api/seed/referensi.json` | 237 | 0 | baru |
| `apps/api/src/adapters/mockLlm.ts` | 150 | 0 | baru |
| `apps/api/src/adapters/solverAdapter.ts` | 21 | 0 | baru |
| `apps/api/src/adapters/types.ts` | 30 | 0 | baru |
| `apps/api/src/app.ts` | 29 | 3 | diubah |
| `apps/api/src/db/database.ts` | 214 | 0 | baru |
| `apps/api/src/lib/llmGuard.ts` | 58 | 0 | baru |
| `apps/api/src/middleware/rateLimit.ts` | 13 | 0 | diubah |
| `apps/api/src/openapi.ts` | 115 | 0 | baru |
| `apps/api/src/pakan.test.ts` | 183 | 0 | baru |
| `apps/api/src/routes/pakan.ts` | 207 | 0 | baru |
| `apps/api/src/routes/referensi.ts` | 32 | 0 | baru |
| `apps/api/src/routes/v1.ts` | 42 | 9 | diubah |
| `apps/api/src/server.ts` | 11 | 2 | diubah |


### `9d0331c` — feat(web): membangun layar penyusun pakan offline-first di /app/pakan

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 15 file, +2107 / -10 baris

**Isi pesan commit:**

> Menambahkan penyimpanan Dexie (referensi, draf, komposisi), Web Worker solver LP, layar /app/pakan (pilih fase petelur, bahan dan harga offline, jalan pintas teks bebas dengan konfirmasi wajib Cek dulu bacaan kami, hasil per 100 kg, batang pemenuhan gizi, badge terpisah Dihitung solver dan Penjelasan ditulis AI, akordeon Lihat perhitungan, kasus tak layak dengan saran bahan), serta tes unit dan Playwright mode pesawat + axe.
> Fase 2

| File | + | − | Status |
|---|---:|---:|---|
| `.gitignore` | 2 | 1 | diubah |
| `apps/web/e2e/pakan-offline.spec.ts` | 69 | 0 | baru |
| `apps/web/playwright.config.ts` | 1 | 1 | diubah |
| `apps/web/public/data/referensi-bawaan.json` | 237 | 0 | baru |
| `apps/web/src/App.tsx` | 2 | 1 | diubah |
| `apps/web/src/db/db.ts` | 61 | 0 | baru |
| `apps/web/src/lib/referensi.ts` | 92 | 0 | baru |
| `apps/web/src/lib/runSolver.ts` | 33 | 0 | baru |
| `apps/web/src/lib/teks.ts` | 56 | 4 | diubah |
| `apps/web/src/pages/FondasiPage.tsx` | 23 | 2 | diubah |
| `apps/web/src/pages/PakanPage.css` | 361 | 0 | baru |
| `apps/web/src/pages/PakanPage.test.tsx` | 256 | 0 | baru |
| `apps/web/src/pages/PakanPage.tsx` | 907 | 0 | baru |
| `apps/web/src/workers/solver.worker.ts` | 6 | 0 | baru |
| `apps/web/vite.config.ts` | 1 | 1 | diubah |


### `184eeea` — feat(pakan): menyatukan input teks bebas ke baris Lainnya di daftar bahan

- **Tanggal:** 2026-11-20 · **Penulis:** hasbywira90 · **Model:** Claude Opus 5.5
- **Ringkasan:** 5 file, +196 / -139 baris

**Isi pesan commit:**

> Menghapus kartu terpisah "Jalan pintas: tulis bahan dan harga sekaligus" dan menggantinya dengan baris Lainnya di akhir daftar bahan. Bila dicentang, pengguna menulis nama bahan dan harga di satu kolom, lalu Ternakin mencocokkannya ke data bahan; langkah konfirmasi "Cek dulu bacaan kami" tetap ada sebelum bahan masuk ke daftar.
> Teks petunjuk halaman Pakan diringkas agar tidak membingungkan, dan tes unit serta E2E offline disesuaikan dengan tombol Tambahkan yang baru.

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/e2e/pakan-offline.spec.ts` | 4 | 2 | diubah |
| `apps/web/src/lib/teks.ts` | 12 | 15 | diubah |
| `apps/web/src/pages/PakanPage.css` | 34 | 0 | diubah |
| `apps/web/src/pages/PakanPage.test.tsx` | 4 | 2 | diubah |
| `apps/web/src/pages/PakanPage.tsx` | 142 | 120 | diubah |


### `02a5969` — fix(pakan): menyesuaikan batas minimum fosfor fase layer dengan SNI 8290.5:2016

- **Tanggal:** 2026-11-21 · **Penulis:** HanzzzBD · **Model:** Claude Opus 5.5
- **Ringkasan:** 2 file, +6 / -6 baris

**Isi pesan commit:**

> Batas minimum fosfor pakan petelur masa produksi naik dari 0,45% ke 0,55%
> sesuai SNI 8290.5:2016 (dikutip Hakim dkk. 2024, JINTP 22(2):122-128).
> Versi data referensi dinaikkan ke 2026.11.demo-2 agar salinan offline di
> perangkat ikut diperbarui.

| File | + | − | Status |
|---|---:|---:|---|
| `apps/api/seed/referensi.json` | 3 | 3 | diubah |
| `apps/web/public/data/referensi-bawaan.json` | 3 | 3 | diubah |

