# Ternakin: SDD Website (PWA)

Nov 18, 2026

## Tujuan dan prinsip desain

Desain ini menerjemahkan PRD ke arsitektur yang bisa dibangun satu orang secara bertahap, dengan tiga prinsip yang tidak ditawar.

- **Hibrida:** hitungan angka dilakukan solver dan aturan yang bisa diperiksa; LLM hanya menafsirkan teks bebas dan menjelaskan hasil. LLM tidak pernah menjadi sumber angka biaya.
- **Offline-first:** data ditulis ke penyimpanan lokal lebih dulu, lalu disinkronkan. Jaringan dianggap kemewahan.
- **Satu backend, satu kontrak API:** web dan aplikasi mobile memanggil API yang sama, sehingga kontrak ditulis sekali dan dites sekali.

Tambahan: setiap keputusan sengaja dibuat sederhana (SQLite dulu, satu proses backend) agar bisa dipindah ke PostgreSQL atau dipecah kemudian, tanpa menulis ulang logika bisnis.

## Arsitektur sistem

&#91;embedded content: arsitektur sistem · 2 klien, 4 modul, 2 penyimpanan dan layanan\]

Web dan mobile memanggil satu backend yang sama. Solver (berwarna) menghitung pakan; LLM, yang berada di luar dan boleh gagal, hanya mengurai teks dan menjelaskan hasil.

## Stack teknologi

Pilihan di bawah mengutamakan yang paling sedikit bagian bergerak. Tabel ini mencerminkan yang sudah dibangun (diperbarui 21 November 2026).

| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| Antarmuka | PWA: React + Vite, Workbox (vite-plugin-pwa) untuk service worker | Bisa dipasang dari peramban dan berjalan offline |
| Data lokal | IndexedDB lewat Dexie | Penyimpanan terstruktur di perangkat untuk mode offline |
| Backend | Node.js + Express + TypeScript (monorepo npm workspaces) | Satu bahasa dengan web; skema zod dan solver dibagi lewat `packages/shared`, sehingga hitungan offline di perangkat identik dengan server |
| Basis data | SQLite (better-sqlite3) dulu, lalu PostgreSQL | Mulai tanpa server tambahan; skema dijaga kompatibel |
| Solver | Simpleks pemrograman linear di `packages/shared/src/feed/solver.ts` | Biaya terendah dengan batasan gizi; berjalan di server dan di perangkat tanpa sinyal |
| LLM | Google Gemini lewat REST (bawaan `gemini-3.5-flash-lite`, dapat diganti lewat `LLM_MODEL`), cadangan jawaban bawaan (mock) | Mengurai teks bebas, menjelaskan hasil, dan triase Kokok; dengan batas token, cache, dan batas harian. Tanpa kunci atau saat gagal, server tetap berjalan dengan jawaban bawaan |
| Pencarian panduan | Embedding Gemini (`gemini-embedding-2`, 768 dimensi) disimpan di SQLite, kemiripan kosinus di proses Node; cadangan pencarian kata kunci + sinonim | Jawaban Kokok berdasar panduan yang dikurasi, tanpa layanan basis data vektor tambahan |
| Hosting | VPS sekitar Rp500.000 per bulan, Docker Compose, nginx | Murah dan terkendali penuh |

## Model data

Sepuluh tabel cukup untuk seluruh MVP. Setiap catatan milik pengguna memakai ID UUID buatan klien, supaya data yang dibuat offline tidak bentrok saat diunggah.

| Tabel | Isi utama | Catatan |
| --- | --- | --- |
| pengguna | id, nomor ponsel (opsional), peran (peternak, admin) | Mode tamu tanpa baris di server |
| kandang | id, pengguna, nama, jenis\_ayam, jumlah\_ekor | jenis\_ayam adalah parameter, awalnya petelur |
| catatan\_harian | id, kandang, tanggal, pakan\_kg, telur, kematian, suhu, diubah\_pada | Satu catatan per kandang per tanggal |
| bahan | id, nama, satuan | Master bahan pakan |
| nutrisi\_bahan | bahan, zat gizi, kadar | Sumber: tabel komposisi bahan |
| kebutuhan\_gizi | jenis\_ayam, fase, zat gizi, batas min dan maks | Sumber: SNI, disimpan sebagai data |
| toko | id, nama, area, status\_mitra | status\_mitra membedakan mitra dan bukan |
| harga\_toko | toko, bahan, harga, asal\_harga, diperbarui\_pada | Wajib ada asal dan waktu |
| dokumen\_panduan | id, judul, sumber, isi, versi | Bahan indeks RAG, dikurasi manual |
| percakapan\_kokok | id, pengguna, ringkasan, urgensi, sumber\_dipakai | Untuk evaluasi, tanpa menyimpan data pribadi berlebih |
| panduan\_embedding (tambahan) | dokumen\_id, model, hash\_isi, dimensi, vektor | Indeks RAG; hanya panduan baru atau berubah yang di-embed ulang |
| otp\_permintaan (tambahan) | nomor\_ponsel, kode\_hash, percobaan, terpakai, kedaluwarsa\_pada | Kode OTP disimpan sebagai HMAC, berlaku 5 menit, maksimal 5 percobaan |
| sesi (tambahan) | token\_hash, pengguna, kedaluwarsa\_pada | Token sesi disimpan sebagai hash SHA-256; berlaku 30 hari (SESI\_BERLAKU\_HARI) |
| kode\_email (tambahan) | email, tujuan (verifikasi/reset), kode\_hash, percobaan, kedaluwarsa\_pada | Kode email sebagai HMAC, berlaku 15 menit, maksimal 5 percobaan |

Kolom tambahan `pengguna`: `email` (unik), `sandi_hash` (scrypt), `email_terverifikasi`, dan `google_sub` (unik).

Kepemilikan data: baris milik tamu memakai `perangkat_id` berisi ID perangkat; setelah masuk, kolom yang sama berisi `akun:<id pengguna>` dan `pengguna_id` terisi. Kunci berawalan `akun:` hanya berasal dari sesi yang terverifikasi, tidak pernah dari kiriman klien.

Di perangkat, IndexedDB menyimpan salinan kandang, catatan\_harian, bahan, harga, toko, dan satu tabel outbox untuk perubahan yang belum terkirim.

## Desain API

Satu API REST berformat JSON, versi `/v1`, dipakai bersama oleh web dan mobile. Dokumentasi OpenAPI dibangun dari skema zod bersama dan tersedia di `GET /v1/openapi.json`; dokumen ini menjadi kontrak untuk rekan yang membuat aplikasi mobile.

| Metode dan jalur | Fungsi |
| --- | --- |
| POST /v1/pakan/urai | Mengurai teks bebas menjadi daftar bahan dan harga untuk dikonfirmasi |
| POST /v1/pakan/hitung | Menghitung campuran termurah dari bahan, harga, dan fase ayam |
| GET /v1/bahan | Master bahan dan nutrisi, dapat di-cache |
| GET, POST /v1/kandang | Daftar dan buat kandang |
| PUT /v1/catatan/{id} | Membuat atau memperbarui catatan harian (idempoten) |
| POST /v1/sinkron | Mengunggah antrean outbox dan mengambil perubahan sejak penanda terakhir |
| POST /v1/kokok/triase | Menilai gejala; mengembalikan urgensi, langkah, dan sumber |
| GET /v1/toko/rujukan | Toko berurut menurut total biaya untuk suatu campuran |
| DELETE /v1/akun | Menghapus akun dan seluruh datanya |
| POST /v1/auth/email/daftar, /email/verifikasi, /email/masuk | Daftar (nama, email, sandi, peran) dengan kode verifikasi lewat Gmail SMTP, lalu masuk dengan email + kata sandi |
| POST /v1/auth/email/lupa-sandi, /email/reset-sandi | Atur ulang kata sandi dengan kode dari email |
| POST /v1/auth/google | Masuk dengan Google; ID token diperiksa server dengan kunci publik Google |
| GET /v1/auth/konfigurasi | Cara masuk yang aktif, untuk menyusun halaman Masuk |
| POST /v1/auth/otp/minta | Mengirim kode OTP 6 angka ke WhatsApp lewat Fonnte (jeda 60 detik, maksimal 5 per jam per nomor) |
| POST /v1/auth/otp/verifikasi | Mencocokkan kode, membuat sesi cookie, dan memindahkan data tamu perangkat ke akun |
| GET /v1/auth/saya, POST /v1/auth/keluar | Status sesi dan keluar |

Format galat seragam: `{ "kode": "...", "pesan": "...", "rinci": {...} }` dengan kode HTTP yang sesuai. Pesan ditulis dalam bahasa Indonesia sederhana agar bisa ditampilkan langsung ke pengguna.

## Desain modul

Setiap modul memisahkan bagian yang pasti (aturan dan perhitungan) dari bagian yang luwes (LLM), dan batas di antaranya divalidasi.

**Penyusun pakan**

1. Teks bebas diurai LLM menjadi JSON dengan skema tetap (bahan, harga, satuan). Hasil divalidasi dan ditampilkan ke pengguna untuk dikonfirmasi.
2. Solver meminimalkan biaya total dengan variabel porsi tiap bahan, dengan batasan: jumlah porsi sama dengan 100%, zat gizi di antara batas min dan maks dari kebutuhan\_gizi, dan batas pemakaian per bahan bila ada.
3. Bila tidak ada solusi layak, sistem menyebut zat gizi mana yang tidak terpenuhi dan menyarankan bahan tambahan. LLM tidak mengubah angka hasil; ia hanya menuliskan penjelasan dari hasil solver.

**Catatan dan peringatan dini**

- MVP: ambang umum per jenis ayam yang disimpan sebagai data (misalnya kematian harian di atas batas). Aturan ditulis sebagai fungsi murni agar mudah diuji.
- Setelah beberapa minggu data: garis dasar per kandang dari statistik sederhana (rata-rata dan simpangan bergulir), peringatan bila menyimpang jauh. Ditunda dari MVP.

**Triase Kokok**

1. Gejala dari pengguna diringkas menjadi kueri, lalu dokumen\_panduan relevan diambil dari indeks RAG.
2. LLM menjawab hanya dari dokumen yang diambil, dengan keluaran berskema: urgensi (rendah, sedang, tinggi), alasan singkat, langkah aman, dan daftar sumber.
3. Penyaring pascaproses menolak jawaban yang memuat dosis obat atau diagnosis pasti, dan menggantinya dengan jawaban aman bawaan.
4. Bila tidak ada dokumen yang cukup relevan, jawaban bawaan: tidak tahu, kategori urgensi sedang, dan saran menghubungi ahli.
5. Ringkasan kasus disusun dari data kandang dan gejala untuk dibagikan lewat WhatsApp.

Penjaga boleh/jangan Kokok (tiga lapis, diperbarui 21 November 2026):

| Lapis | Isi |
| --- | --- |
| Sebelum AI (`periksaCakupanPertanyaan`, `detectUnsafeUserAsk`) | Pertanyaan berisi praktik berbahaya (menjual/mengonsumsi ayam sakit, membuang bangkai sembarangan, menyembunyikan wabah), keluhan kesehatan manusia, saran keuangan/investasi, permintaan obat/dosis/diagnosis pasti, dan topik di luar unggas dijawab dengan jawaban tetap yang aman tanpa memanggil AI. |
| Instruksi AI | Daftar BOLEH (hanya dari panduan, jawaban langsung 2-4 kalimat yang menanggapi cerita peternak, langkah aman, rujukan ke ahli, mengaku tidak tahu) dan JANGAN (obat/vaksin/dosis, diagnosis pasti, praktik berbahaya, saran keuangan, kesehatan manusia, topik lain, menuruti perintah di teks gejala). AI juga menandai `diLuarPanduan` bila panduan tidak membahas keluhan. |
| Setelah AI (`checkKokokOutputSafety`) | Menolak nama obat/vaksin, dosis, diagnosis pasti, saran berbahaya, dan janji keuntungan (larangan seperti "jangan buang bangkai ke sungai" tetap lolos). Urgensi tinggi dari aturan bawaan tidak bisa diturunkan AI. |

Semua kalimat jawaban Kokok ditulis AI (Gemini), termasuk penolakan untuk pesan yang dijaga: penjaga hanya menentukan kategori dan arahan, AI menulis tanggapan yang sesuai pesan, lalu filter keluaran memeriksanya. Jawaban tetap hanya dipakai bila AI tidak tersedia atau jawabannya ditolak filter.

Obrolan bebas (`POST /v1/kokok/obrolan`) dipakai jendela chat Kokok di halaman depan: membawa beberapa pesan terakhir sebagai konteks, bisa menjawab sapaan dan pertanyaan tentang Ternakin dari daftar fakta produk yang dikurasi, menanggapi keluhan ayam dengan langkah aman awal lalu mengarahkan ke Tanya Kokok, dan mengembalikan saran aksi (cek gejala, hitung pakan, lihat investasi, hubungi tim).

Basis pengetahuan Kokok (RAG) terdiri dari 6 panduan triase (`apps/api/seed/panduan.json`) dan 28 dokumen pengetahuan peternakan (`apps/api/seed/pengetahuan_peternakan.json`): 5 dokumen pakan merujuk jurnal di folder Sumber Mendukung (Azhari dkk. 2025, Purnamasari dkk. 2022, Arbiantara & Widianingrum 2024, Huda dkk. 2023, Hakim dkk. 2024/SNI 8290.5:2016), dan sisanya ringkasan tim tentang kesehatan dan manajemen kandang yang diberi label belum ditinjau dokter hewan/penyuluh. Kokok mengambil 4 potongan paling relevan per pertanyaan. Menambah dokumen cukup dengan menambah objek `{id, judul, sumber, isi, versi}` ke berkas tersebut lalu memulai ulang server; indeks embedding hanya menghitung ulang dokumen yang baru atau berubah. Isi dokumen tidak boleh memuat nama obat, dosis, atau diagnosis pasti, dan sumber harus ditulis apa adanya. Dokumen ringkasan tim perlu ditinjau dokter hewan/penyuluh sebelum pilot.

**Rujukan toko**

- Total biaya tiap toko dihitung dari kebutuhan bahan campuran dikali harga toko tersebut. Peringkat murni dari total biaya; status mitra hanya label.

**Peran akun (tambahan, 21 November 2026)**

| Peran | Fitur | Catatan |
| --- | --- | --- |
| Peternak | Penyusun pakan, catatan harian, toko, Kokok, mengajukan kandang sebagai peluang modal | Tamu (belum masuk) diperlakukan sebagai peternak sesuai mode tamu PRD |
| Pengguna | Kokok (untuk ayam peliharaan) dan mencatat minat titip modal ke peternak | Tidak bisa membuka pakan, catatan, dan toko; server menolak dengan kode `KHUSUS_PETERNAK` |

- Peran dipilih saat pertama masuk dengan nomor WhatsApp dan disimpan di `pengguna.peran_akun`. Satu peran per akun, bisa diganti dari Profil (`PUT /v1/auth/peran`); data kandang tetap tersimpan saat berganti peran.
- Akun demo bersama untuk juri (`POST /v1/auth/demo`, Rani sebagai pengguna dan Pak Dedi sebagai peternak) mengikuti aturan peran yang sama, tidak bisa diganti perannya atau dihapus, dan dapat dimatikan lewat `AKUN_DEMO_AKTIF=false`. Agar data tamu tidak bocor ke akun bersama, akun demo hanya bisa dibuka di perangkat tanpa data kandang tamu.

**Investasi ternak — Modul 5 (SIMULASI)**

- Dokumen Risk Analysis dan Business Model Canvas menunda investasi sungguhan sampai ada mitra berizin OJK dan konsultasi hukum. Karena itu modul ini hanya simulasi: tidak ada uang yang berpindah, pengguna hanya mencatat minat.
- Peternak mengajukan peluang (`POST /v1/investasi/peluang`) yang selalu dimulai dengan status menunggu pemeriksaan dokter hewan mitra, lalu mengatur izin tampil data catatan harian. Saat izin dimatikan, server tidak mengirim catatan kepada orang lain.
- Pengguna mencatat minat (`POST /v1/investasi/peluang/{id}/minat`) dengan validasi minimal titip, sisa kebutuhan modal, dan status dibuka. Modal terkumpul dihitung dari modal awal contoh ditambah seluruh minat.
- Tabel `peluang_investasi` dan `minat_investasi`; lima peluang contoh di-seed dari `apps/api/seed/peluang_investasi.json` dan ditandai sebagai data contoh.

## Offline dan sinkronisasi

Setiap tulisan masuk ke IndexedDB lebih dulu dan masuk antrean outbox; pengguna tidak pernah menunggu server.

1. **Cangkang aplikasi:** service worker menyimpan HTML, JS, CSS, dan ikon sehingga aplikasi terbuka tanpa jaringan.
2. **Data referensi:** bahan, nutrisi, kebutuhan gizi, dan daftar toko diambil saat daring dan disimpan lokal dengan penanda versi.
3. **Antrean:** tiap perubahan diberi UUID dan stempel waktu klien, lalu dikirim lewat POST /v1/sinkron saat sinyal tersedia, dengan percobaan ulang bertahap.
4. **Idempoten:** server mengabaikan UUID yang sudah diproses, sehingga kiriman ganda tidak menggandakan data.
5. **Konflik:** catatan harian per kandang per tanggal memakai aturan perubahan terbaru menang berdasar stempel waktu; perangkat yang kalah menerima nilai pemenang saat sinkron.
6. **Fitur yang butuh jaringan:** pertanyaan baru ke Kokok dan penguraian teks oleh LLM; layar menampilkan pesan jelas dan menyimpan pertanyaan agar bisa dikirim ulang.

## Keamanan, privasi, dan batas AI

Tiga lapis: lindungi akses, kurangi data, dan batasi apa yang boleh dikatakan AI.

- **Akses:** HTTPS di seluruh jalur, validasi skema di server untuk semua input, pembatasan laju per pengguna dan per alamat. Cara masuk utama adalah email + kata sandi (scrypt, kode verifikasi dan atur ulang sandi lewat Gmail SMTP dengan App Password) dan tombol "Masuk dengan Google" (ID token diverifikasi server: tanda tangan RS256, `aud`, `iss`, `exp`, email terverifikasi). Saat Google ditautkan ke akun email yang belum terverifikasi, sandi lama dihapus agar akun tidak bisa diambil alih oleh pendaftar palsu. Pesan galat masuk dan lupa sandi dibuat seragam agar tidak bisa dipakai menebak email terdaftar. CSP dan `Cross-Origin-Opener-Policy: same-origin-allow-popups` disesuaikan untuk skrip dan popup Google. WhatsApp + OTP (Fonnte) tetap tersedia sebagai pilihan kedua. Sesi berupa cookie `HttpOnly`, `SameSite=Lax`, dan `Secure` di production, sehingga token tidak bisa dibaca skrip. Tanpa token Fonnte di luar production, kode ditampilkan di layar (mode demo); di production tanpa token, masuk dinonaktifkan. Keluar akun mengirim antrean dulu lalu membersihkan data di perangkat. Kandang dan catatan hanya bisa diubah oleh pemiliknya.
- **Rahasia:** kunci API LLM hanya ada di server, tidak pernah dikirim ke klien; disimpan sebagai variabel lingkungan.
- **Privasi:** hanya data yang dibutuhkan; percakapan Kokok disimpan sebagai ringkasan untuk evaluasi; pengguna dapat menghapus seluruh data lewat DELETE /v1/akun.
- **Batas AI:** tanpa dosis obat dan diagnosis pasti, jawaban selalu bersumber atau mengaku tidak tahu, dan peringkat toko tidak dipengaruhi komisi. Aturan ini diuji dengan kumpulan pertanyaan uji yang dijalankan sebelum setiap rilis.
- **Biaya:** batas token per permintaan, cache untuk pertanyaan yang sama, dan batas harian per pengguna agar tagihan LLM tidak melonjak.

## Deployment, pengujian, dan risiko teknis

Satu VPS menjalankan semuanya lewat Docker Compose: nginx sebagai pintu masuk HTTPS, satu kontainer Node.js (API sekaligus menyajikan berkas PWA), dan basis data SQLite di volume. Rilis dilakukan dengan menarik citra baru lalu memulai ulang, dengan cadangan basis data harian.

**Pengujian**

- Solver: tiga contoh bahan dengan hasil yang diperiksa tangan, ditambah kasus tanpa solusi.
- API: uji kontrak dari skema OpenAPI, dipakai juga oleh tim mobile.
- Offline: skenario mode pesawat di ponsel Android nyata, termasuk sinkronisasi setelah sinyal kembali.
- Kokok: kumpulan pertanyaan uji berisi pertanyaan yang meminta dosis dan diagnosis, yang harus ditolak.

**Risiko teknis**

| Risiko | Dampak | Tindakan |
| --- | --- | --- |
| Satu orang mengerjakan semua | Jadwal molor | Urutan pengerjaan di PRD; tiap tahap bisa didemokan |
| Gemini gagal, lambat, atau biayanya melonjak | Kokok dan urai teks terganggu | Gemini dipilih; batas waktu, batas token, cache, dan batas harian per perangkat; jawaban bawaan otomatis dipakai saat gagal |
| Jawaban LLM menurunkan tanda bahaya | Kasus berat dianggap ringan | Aturan bawaan menjadi lantai keselamatan: bila aturan menilai tinggi, jawaban LLM yang lebih rendah diganti |
| Data SNI dan nutrisi tidak lengkap | Solver tidak akurat | Mulai dari beberapa bahan umum dan tandai sumbernya |
| Jawaban Kokok keliru | Risiko bagi ayam peternak | Sumber wajib, penyaring dosis, rujukan ke ahli |
| Sinkronisasi konflik | Data hilang | UUID, idempoten, aturan konflik tertulis |
