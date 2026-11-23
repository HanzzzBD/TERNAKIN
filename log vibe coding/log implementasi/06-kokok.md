# Kokok — Asisten AI Peternakan

| Commit | Tanggal | Penulis | Model (trailer) | Pesan |
|---|---|---|---|---|
| `e21efa2` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(kokok): menambah skema triase Kokok dan filter keselamatan |
| `f20c98b` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(kokok): menambah endpoint triase Kokok, pencari panduan, dan 10 tes uji |
| `18869e6` | 19 Nov | Muhammad Khalifa | tidak tercatat | feat(kokok): membangun layar Kokok dengan riwayat offline dan bagikan WhatsApp |
| `1ec047d` | 20 Nov | hasbywira90 | Claude Opus 5.5 | feat(kokok): merujuk kasus urgensi tinggi ke dokter hewan mitra |
| `4c8a659` | 21 Nov | HanzzzBD | Claude Opus 5.5 | feat(kokok): mengintegrasikan Gemini sebagai penyedia LLM dan RAG berbasis embedding |
| `658c81f` | 21 Nov | HanzzzBD | Claude Opus 5.5 | feat(kokok): menjadikan jawaban Kokok dari AI dengan penjaga boleh/jangan, obrolan bebas, dan basis pengetahuan peternakan |

## Isi

**Triase dan filter (`e21efa2`).** Skema Zod untuk permintaan, respons, dan riwayat lokal Kokok. Daftar gejala awal ada di data referensi. Fungsi murni menolak keluaran yang memuat pola dosis obat atau diagnosis pasti.

**Endpoint triase (`f20c98b`).** Dokumen panduan uji coba di-seed ke tabel `dokumen_panduan`. `SqliteGuidelineRetriever` berada di balik antarmuka `GuidelineRetriever`. Triase deterministik ada di `MockLlmAdapter`, serta endpoint `POST /v1/kokok/triase`. Ada 10 tes uji.

**Layar Kokok (`18869e6`).** Tabel Dexie versi 4 untuk riwayat. Layar `/app/tanya` dengan penafian yang selalu tampil, tombol gejala cepat, kartu urgensi tinggi berwarna merah, sumber pedoman di accordion, dan ringkasan kasus yang bisa dibagikan lewat WhatsApp.

**Rujukan dokter hewan (`1ec047d`).** Saat urgensi tinggi, kartu menampilkan daftar dokter hewan mitra, diurutkan dari wilayah layanan yang cocok dengan lokasi kandang. Tautan WhatsApp menerima nomor tujuan. Selama mitra belum resmi, nomor dibiarkan kosong dan halaman meminta pengguna menghubungi puskeswan terdekat.

**Gemini dan RAG (`4c8a659`).** `GeminiClient` memakai REST tanpa SDK, untuk `generateContent` dengan keluaran JSON terstruktur dan `batchEmbedContents`. Kunci hanya dikirim lewat header dan tidak dicatat. `GeminiLlmAdapter` mengurai teks pakan, menjelaskan hasil solver, dan triase Kokok. Penjelasan diverifikasi terhadap angka solver. Tanda bahaya tinggi dari aturan bawaan tidak bisa diturunkan oleh LLM. Galat, batas waktu, atau keluaran tidak valid jatuh ke adapter mock. Vektor panduan disimpan di SQLite (migrasi 002), di-embed ulang hanya bila isinya berubah, dan dicari dengan kemiripan kosinus. Ada cadangan pencarian kata kunci. Variabel baru: `LLM_PROVIDER=gemini`, `LLM_MODEL`, `LLM_EMBEDDING_MODEL`, `LLM_EMBEDDING_DIMENSI`, `LLM_THINKING_LEVEL`, `LLM_TIMEOUT_MS`, `RAG_AMBANG_KEMIRIPAN`.

**Penjaga boleh/jangan dan obrolan (`658c81f`).** Penjaga cakupan tiga lapis:
1. Sebelum AI: mengenali praktik berbahaya, keluhan kesehatan manusia, saran keuangan, permintaan obat atau diagnosis, dan topik di luar unggas.
2. Instruksi AI memuat daftar BOLEH dan JANGAN, dan AI bisa menandai `diLuarPanduan` agar Kokok mengaku tidak tahu.
3. Setelah AI: filter menolak nama obat, angka takaran, dosis, diagnosis pasti, dan janji keuntungan. Kalimat penolakan seperti "tidak bisa memberi dosis" tetap lolos.

Endpoint `POST /v1/kokok/obrolan` untuk obrolan bebas dengan riwayat 8 pesan, fakta produk yang dikurasi, dan dokumen pengetahuan. Basis pengetahuan berisi 28 dokumen baru. Lima dokumen pakan merujuk jurnal di folder Sumber Mendukung. Sisanya ringkasan tim tentang kesehatan dan manajemen kandang yang diberi label belum ditinjau dokter hewan atau penyuluh. Kokok mengambil 4 potongan per pertanyaan.

## Keputusan yang tercatat

- Keputusan keselamatan dijalankan kode, bukan model. Tanda bahaya tinggi tidak bisa diturunkan AI.
- Model yang gagal atau tidak valid jatuh ke mock, sehingga layanan tidak mati.
- Dokumen pengetahuan yang belum ditinjau dokter hewan diberi label terang, bukan disajikan sebagai rujukan final.
- Nomor dokter hewan dibiarkan kosong sampai mitra resmi, agar tidak memakai nomor palsu.

---

## Detail perubahan per commit

Bagian ini dibuat dari `git show` untuk setiap commit: jumlah baris berubah per file, status file (baru atau diubah), dan isi pesan commit.

### `e21efa2` — feat(kokok): menambah skema triase Kokok dan filter keselamatan

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 7 file, +269 / -0 baris

**Isi pesan commit:**

> Menambahkan skema zod untuk permintaan, respons, dan riwayat lokal Kokok, daftar gejala awal pada data referensi, serta fungsi murni filter keluaran untuk menolak pola dosis obat atau diagnosis pasti dan menyusun jawaban cadangan yang aman.
> Fase 5

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/src/pages/CatatanPage.test.tsx` | 1 | 0 | diubah |
| `apps/web/src/pages/PakanPage.test.tsx` | 1 | 0 | diubah |
| `packages/shared/src/index.ts` | 24 | 0 | diubah |
| `packages/shared/src/kokok/safetyFilter.test.ts` | 61 | 0 | baru |
| `packages/shared/src/kokok/safetyFilter.ts` | 106 | 0 | baru |
| `packages/shared/src/schemas/kokok.ts` | 75 | 0 | baru |
| `packages/shared/src/schemas/referensi.ts` | 1 | 0 | diubah |


### `f20c98b` — feat(kokok): menambah endpoint triase Kokok, pencari panduan, dan 10 tes uji

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 13 file, +1054 / -4 baris

**Isi pesan commit:**

> Menambahkan seed dokumen panduan uji coba ke tabel dokumen_panduan, SqliteGuidelineRetriever di balik antarmuka GuidelineRetriever, triase deterministik pada MockLlmAdapter, serta endpoint POST /v1/kokok/triase dengan filter dosis/diagnosis, batas harian LLM, dan 10 pertanyaan uji.
> Fase 5

| File | + | − | Status |
|---|---:|---:|---|
| `apps/api/seed/panduan.json` | 44 | 0 | baru |
| `apps/api/seed/referensi.json` | 8 | 0 | diubah |
| `apps/api/src/adapters/mockLlm.ts` | 100 | 1 | diubah |
| `apps/api/src/adapters/sqliteGuidelineRetriever.ts` | 244 | 0 | baru |
| `apps/api/src/adapters/types.ts` | 33 | 0 | diubah |
| `apps/api/src/app.ts` | 5 | 1 | diubah |
| `apps/api/src/db/database.ts` | 36 | 0 | diubah |
| `apps/api/src/kokok.test.ts` | 256 | 0 | baru |
| `apps/api/src/openapi.ts` | 28 | 1 | diubah |
| `apps/api/src/pakan.test.ts` | 1 | 0 | diubah |
| `apps/api/src/routes/kokok.ts` | 279 | 0 | baru |
| `apps/api/src/routes/v1.ts` | 12 | 1 | diubah |
| `apps/web/public/data/referensi-bawaan.json` | 8 | 0 | diubah |


### `18869e6` — feat(kokok): membangun layar Kokok dengan riwayat offline dan bagikan WhatsApp

- **Tanggal:** 2026-11-19 · **Penulis:** Muhammad Khalifa · **Model:** tidak tercatat
- **Ringkasan:** 10 file, +1146 / -5 baris

**Isi pesan commit:**

> Menambahkan tabel kokok di Dexie v4, layar /app/tanya dengan penafian permanen, slot maskot kosong, tombol gejala cepat, kartu urgensi tinggi merah, sumber pedoman dalam accordion, ringkasan kasus dengan tautan wa.me tanpa nomor tujuan, serta dukungan baca riwayat dan simpan draf saat offline.
> Fase 5

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/e2e/kokok.spec.ts` | 83 | 0 | baru |
| `apps/web/playwright.config.ts` | 1 | 1 | diubah |
| `apps/web/src/App.tsx` | 2 | 2 | diubah |
| `apps/web/src/db/db.ts` | 13 | 0 | diubah |
| `apps/web/src/db/sync.ts` | 2 | 1 | diubah |
| `apps/web/src/lib/teks.ts` | 38 | 0 | diubah |
| `apps/web/src/lib/wa.ts` | 43 | 1 | diubah |
| `apps/web/src/pages/KokokPage.css` | 302 | 0 | baru |
| `apps/web/src/pages/KokokPage.test.tsx` | 137 | 0 | baru |
| `apps/web/src/pages/KokokPage.tsx` | 525 | 0 | baru |


### `1ec047d` — feat(kokok): merujuk kasus urgensi tinggi ke dokter hewan mitra

- **Tanggal:** 2026-11-20 · **Penulis:** hasbywira90 · **Model:** Claude Opus 5.5
- **Ringkasan:** 5 file, +187 / -3 baris

**Isi pesan commit:**

> Saat Kokok menilai urgensi tinggi, rujukan tidak lagi berhenti di anjuran menghubungi ahli. Kartu urgensi kini menampilkan daftar dokter hewan mitra, diurutkan dari yang wilayah layanannya cocok dengan lokasi kandang, dengan tombol kirim ringkasan kasus lewat WhatsApp yang sudah berisi sapaan rujukan.
> Tautan WhatsApp kasus kini menerima nomor tujuan dan sapaan opsional. Selama mitra belum resmi, nomor dibiarkan kosong sehingga tidak pernah memakai nomor palsu, dan halaman memberi catatan untuk menghubungi puskeswan bila belum ada yang bisa dihubungi.

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/src/lib/teks.ts` | 3 | 0 | diubah |
| `apps/web/src/lib/wa.ts` | 9 | 3 | diubah |
| `apps/web/src/pages/KokokPage.css` | 116 | 0 | diubah |
| `apps/web/src/pages/KokokPage.test.tsx` | 10 | 0 | diubah |
| `apps/web/src/pages/KokokPage.tsx` | 49 | 0 | diubah |


### `4c8a659` — feat(kokok): mengintegrasikan Gemini sebagai penyedia LLM dan RAG berbasis embedding

- **Tanggal:** 2026-11-21 · **Penulis:** HanzzzBD · **Model:** Claude Opus 5.5
- **Ringkasan:** 15 file, +1526 / -21 baris

**Isi pesan commit:**

> - Menambah GeminiClient (REST, tanpa SDK) untuk generateContent berkeluaran JSON
>   terstruktur dan batchEmbedContents; kunci hanya lewat header dan tidak dicatat.
> - GeminiLlmAdapter untuk urai teks pakan, penjelasan hasil solver, dan triase Kokok:
>   harga hasil urai wajib tertulis di teks peternak, penjelasan diverifikasi terhadap
>   angka solver, dan tanda bahaya tinggi dari aturan bawaan tidak bisa diturunkan LLM.
>   Galat, batas waktu, atau keluaran tidak valid jatuh ke adapter mock.
> - EmbeddingGuidelineRetriever: vektor panduan disimpan di SQLite (migrasi 002),
>   di-embed ulang hanya bila isi berubah, pencarian kosinus dengan ambang yang bisa
>   diatur, dan cadangan pencarian kata kunci.
> - LLM_PROVIDER kini menerima "gemini"; tanpa LLM_API_KEY server tetap memakai mock.
>   Variabel baru: LLM_MODEL, LLM_EMBEDDING_MODEL, LLM_EMBEDDING_DIMENSI,
>   LLM_THINKING_LEVEL, LLM_TIMEOUT_MS, RAG_AMBANG_KEMIRIPAN.
> - Rute pakan melaporkan sumber jawaban yang sebenarnya dan tidak menyimpan hasil
>   cadangan di cache.
> - SDD diperbarui: backend Express + TypeScript, solver simpleks bersama, Gemini.

| File | + | − | Status |
|---|---:|---:|---|
| `.env.example` | 12 | 0 | diubah |
| `Ternakin SDD Website (PWA).md` | 13 | 11 | diubah |
| `apps/api/migrations/002_panduan_embedding.sql` | 10 | 0 | baru |
| `apps/api/src/adapters/embeddingGuidelineRetriever.ts` | 218 | 0 | baru |
| `apps/api/src/adapters/geminiClient.ts` | 243 | 0 | baru |
| `apps/api/src/adapters/geminiLlm.ts` | 350 | 0 | baru |
| `apps/api/src/adapters/penyediaLlm.ts` | 97 | 0 | baru |
| `apps/api/src/adapters/sqliteGuidelineRetriever.ts` | 1 | 1 | diubah |
| `apps/api/src/adapters/types.ts` | 6 | 1 | diubah |
| `apps/api/src/config/env.ts` | 13 | 2 | diubah |
| `apps/api/src/db/database.ts` | 2 | 0 | diubah |
| `apps/api/src/gemini.test.ts` | 531 | 0 | baru |
| `apps/api/src/routes/pakan.ts` | 12 | 5 | diubah |
| `apps/api/src/server.ts` | 12 | 1 | diubah |
| `docker-compose.yml` | 6 | 0 | diubah |


### `658c81f` — feat(kokok): menjadikan jawaban Kokok dari AI dengan penjaga boleh/jangan, obrolan bebas, dan basis pengetahuan peternakan

- **Tanggal:** 2026-11-21 · **Penulis:** HanzzzBD · **Model:** Claude Opus 5.5
- **Ringkasan:** 26 file, +1835 / -81 baris

**Isi pesan commit:**

> Penjaga boleh/jangan (tiga lapis)
> - Sebelum AI: penjaga cakupan mengenali praktik berbahaya (menjual/mengonsumsi ayam sakit,
>   membuang bangkai sembarangan, menyembunyikan wabah), keluhan kesehatan manusia, saran
>   keuangan, permintaan obat/dosis/diagnosis, dan topik di luar unggas. Langkah dan urgensi
>   tetap dari penjaga; kalimat jawaban ditulis AI dengan arahan kategori.
> - Instruksi AI memuat daftar BOLEH dan JANGAN sesuai PRD/SDD, dan AI dapat menandai
>   diLuarPanduan agar Kokok mengaku tidak tahu.
> - Setelah AI: filter menolak nama obat/vaksin, angka takaran, kalimat yang memberi dosis,
>   diagnosis pasti, saran berbahaya, dan janji keuntungan; kalimat penolakan atau larangan
>   ("tidak bisa memberi dosis", "jangan buang bangkai ke sungai") tetap lolos.
> - Urgensi tinggi dari aturan bawaan tidak bisa diturunkan AI, dengan jawaban pengganti
>   yang wajar.
> Jawaban Kokok
> - Triase mengembalikan "jawaban" (2-4 kalimat yang menanggapi cerita peternak), tampil
>   sebagai balon percakapan; alasan urgensi jadi keterangan.
> - POST /v1/kokok/obrolan untuk obrolan bebas dengan riwayat 8 pesan, fakta produk
>   Ternakin yang dikurasi, dokumen pengetahuan, dan saran aksi (cek gejala, hitung pakan,
>   lihat investasi, hubungi tim). Popup chat di landing memakai endpoint ini dengan
>   balasan cadangan saat offline.
> - Variasi jawaban dinaikkan dan instruksi meminta detail spesifik serta tidak mengulang.
> Basis pengetahuan
> - 28 dokumen baru di seed/pengetahuan_peternakan.json: 5 dokumen pakan merujuk jurnal di
>   folder Sumber Mendukung, sisanya ringkasan tim tentang kesehatan dan manajemen kandang
>   berlabel belum ditinjau dokter hewan/penyuluh. Kokok mengambil 4 potongan per pertanyaan.
> Konfigurasi
> - Server membaca apps/api/.env dan .env akar repo; nilai kosong di apps/api/.env diisi
>   dari akar, sehingga kunci yang diisi di .env akar ikut terbaca saat npm run dev.
> OpenAPI dan SDD diperbarui. Basis data tetap SQLite.

| File | + | − | Status |
|---|---:|---:|---|
| `Ternakin SDD Website (PWA).md` | 14 | 0 | diubah |
| `apps/api/seed/pengetahuan_peternakan.json` | 310 | 0 | baru |
| `apps/api/src/adapters/geminiLlm.ts` | 158 | 13 | diubah |
| `apps/api/src/adapters/mockLlm.ts` | 15 | 1 | diubah |
| `apps/api/src/adapters/obrolanCadangan.ts` | 100 | 0 | baru |
| `apps/api/src/adapters/types.ts` | 31 | 0 | diubah |
| `apps/api/src/config/muatEnv.ts` | 39 | 0 | baru |
| `apps/api/src/config/muatEnvDulu.ts` | 5 | 0 | baru |
| `apps/api/src/db/database.ts` | 7 | 4 | diubah |
| `apps/api/src/gemini.test.ts` | 67 | 2 | diubah |
| `apps/api/src/kokok.test.ts` | 184 | 3 | diubah |
| `apps/api/src/lib/pengetahuanTernakin.ts` | 73 | 0 | baru |
| `apps/api/src/openapi.ts` | 21 | 0 | diubah |
| `apps/api/src/routes/kokok.ts` | 229 | 27 | diubah |
| `apps/api/src/server.ts` | 1 | 1 | diubah |
| `apps/web/src/components/landing/KokokChatPopup.test.tsx` | 96 | 0 | baru |
| `apps/web/src/components/landing/KokokChatPopup.tsx` | 40 | 18 | diubah |
| `apps/web/src/lib/kokokObrolan.ts` | 39 | 0 | baru |
| `apps/web/src/pages/KokokPage.css` | 19 | 0 | diubah |
| `apps/web/src/pages/KokokPage.test.tsx` | 8 | 0 | diubah |
| `apps/web/src/pages/KokokPage.tsx` | 13 | 3 | diubah |
| `packages/shared/src/index.ts` | 15 | 0 | diubah |
| `packages/shared/src/kokok/penjagaCakupan.test.ts` | 107 | 0 | baru |
| `packages/shared/src/kokok/penjagaCakupan.ts` | 136 | 0 | baru |
| `packages/shared/src/kokok/safetyFilter.ts` | 64 | 9 | diubah |
| `packages/shared/src/schemas/kokok.ts` | 44 | 0 | diubah |

