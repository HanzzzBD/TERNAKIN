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

Pilihan di bawah mengutamakan yang paling sedikit bagian bergerak. Kerangka web depan dan pustaka RAG masih usulan sampai dikonfirmasi.

| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| Antarmuka | PWA (usulan: React + Vite, Workbox untuk service worker) | Bisa dipasang dari peramban dan berjalan offline |
| Data lokal | IndexedDB (usulan: Dexie) | Penyimpanan terstruktur di perangkat untuk mode offline |
| Backend | FastAPI (Python) | Cocok dengan SciPy, PuLP, dan ekosistem AI; dokumentasi API otomatis |
| Basis data | SQLite dulu, lalu PostgreSQL | Mulai tanpa server tambahan; skema dijaga kompatibel |
| Solver | SciPy linprog atau PuLP | Pemrograman linear untuk biaya terendah dengan batasan gizi |
| LLM | API penyedia LLM (belum dipilih) | Mengurai teks bebas dan menjelaskan; dengan batas token dan cache |
| Pencarian panduan | Indeks RAG (pustaka belum dipilih) | Jawaban Kokok berdasar panduan yang dikurasi |
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

Di perangkat, IndexedDB menyimpan salinan kandang, catatan\_harian, bahan, harga, toko, dan satu tabel outbox untuk perubahan yang belum terkirim.

## Desain API

Satu API REST berformat JSON, versi `/v1`, dipakai bersama oleh web dan mobile. Dokumentasi OpenAPI dibuat otomatis oleh FastAPI dan menjadi kontrak untuk rekan yang membuat aplikasi mobile.

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

**Rujukan toko**

- Total biaya tiap toko dihitung dari kebutuhan bahan campuran dikali harga toko tersebut. Peringkat murni dari total biaya; status mitra hanya label.

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

- **Akses:** HTTPS di seluruh jalur, sesi bertoken berumur pendek, validasi skema di server untuk semua input, pembatasan laju per pengguna dan per alamat.
- **Rahasia:** kunci API LLM hanya ada di server, tidak pernah dikirim ke klien; disimpan sebagai variabel lingkungan.
- **Privasi:** hanya data yang dibutuhkan; percakapan Kokok disimpan sebagai ringkasan untuk evaluasi; pengguna dapat menghapus seluruh data lewat DELETE /v1/akun.
- **Batas AI:** tanpa dosis obat dan diagnosis pasti, jawaban selalu bersumber atau mengaku tidak tahu, dan peringkat toko tidak dipengaruhi komisi. Aturan ini diuji dengan kumpulan pertanyaan uji yang dijalankan sebelum setiap rilis.
- **Biaya:** batas token per permintaan, cache untuk pertanyaan yang sama, dan batas harian per pengguna agar tagihan LLM tidak melonjak.

## Deployment, pengujian, dan risiko teknis

Satu VPS menjalankan semuanya lewat Docker Compose: nginx sebagai pintu masuk HTTPS, satu kontainer FastAPI, dan basis data. Rilis dilakukan dengan menarik citra baru lalu memulai ulang, dengan cadangan basis data harian.

**Pengujian**

- Solver: tiga contoh bahan dengan hasil yang diperiksa tangan, ditambah kasus tanpa solusi.
- API: uji kontrak dari skema OpenAPI, dipakai juga oleh tim mobile.
- Offline: skenario mode pesawat di ponsel Android nyata, termasuk sinkronisasi setelah sinyal kembali.
- Kokok: kumpulan pertanyaan uji berisi pertanyaan yang meminta dosis dan diagnosis, yang harus ditolak.

**Risiko teknis**

| Risiko | Dampak | Tindakan |
| --- | --- | --- |
| Satu orang mengerjakan semua | Jadwal molor | Urutan pengerjaan di PRD; tiap tahap bisa didemokan |
| Penyedia LLM atau biayanya belum dipilih | Kokok tertunda | Pilih lebih awal; sediakan jawaban bawaan tanpa LLM |
| Data SNI dan nutrisi tidak lengkap | Solver tidak akurat | Mulai dari beberapa bahan umum dan tandai sumbernya |
| Jawaban Kokok keliru | Risiko bagi ayam peternak | Sumber wajib, penyaring dosis, rujukan ke ahli |
| Sinkronisasi konflik | Data hilang | UUID, idempoten, aturan konflik tertulis |
