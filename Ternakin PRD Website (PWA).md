# Ternakin: PRD Website (PWA)

Nov 18, 2026

## Ringkasan dan tujuan

Ternakin Web adalah PWA berbahasa Indonesia yang tetap berjalan tanpa sinyal, dan dibangun dengan cakupan sekecil mungkin supaya bisa selesai tanpa bergantung pada satu orang.

- **Produk:** aplikasi web untuk peternak ayam petelur mandiri di Bandung Raya, dengan maskot chatbot Kokok. Jenis ayam disimpan sebagai parameter, bukan kode yang ditulis ulang.
- **Tujuan utama:** demo yang berjalan untuk juri IDTC 2026 (jalur Business Dev) dan dasar pilot 90 hari.
- **Alasan cakupan kecil:** bagian web belum bisa diandalkan dari rekan tim, jadi dokumen ini menetapkan apa yang wajib ada dan apa yang boleh ditunda. Siapa pun yang membangun, termasuk Anda sendiri, bisa mengerjakan berurutan dari dokumen ini dan SDD.
- **Hubungan dengan aplikasi mobile:** web dan mobile memakai satu backend dan satu kontrak API, jadi web harus lebih dulu stabil.

## Pengguna dan skenario utama

Dua pengguna dilayani, tetapi hanya peternak yang memakai aplikasi sehari-hari. Keduanya masih hipotesis dari data publik sampai wawancara dilakukan.

| Pengguna | Gambaran | Kebutuhan utama |
| --- | --- | --- |
| Peternak petelur mandiri | Rata-rata sekitar 761 ekor, meracik atau membeli pakan sendiri, memakai ponsel Android, sinyal tidak selalu ada | Campuran pakan termurah yang memenuhi gizi, dan jawaban cepat saat ayam bermasalah |
| Pemilik toko pakan | Toko di Bandung Raya yang menjual ke peternak sekitar | Pembeli baru yang datang dengan niat membeli, harga tampil benar |

Skenario inti yang harus bisa didemokan:

1. Peternak membuka aplikasi tanpa sinyal, memilih bahan pakan, mengisi harga, lalu mendapat campuran termurah.
2. Peternak mencatat produksi harian dan kematian dalam kurang dari satu menit.
3. Ayam lesu: peternak bertanya ke Kokok, mendapat tingkat urgensi dan panduan bersumber, lalu mengirim ringkasan kasus ke ahli lewat WhatsApp.
4. Peternak melihat toko mitra yang diurutkan dari total biaya pakan.

## Ruang lingkup

MVP hanya berisi apa yang dibutuhkan untuk empat skenario di atas, ditambah mode offline. Yang lain ditunda dengan alasan tertulis.

| Fitur | Status | Alasan |
| --- | --- | --- |
| Penyusun pakan (solver) | Wajib | Inti nilai produk dan paling mudah dibuktikan |
| Catatan harian | Wajib | Sumber data untuk peringatan dan Kokok |
| Triase Kokok (RAG, 3 tingkat urgensi) | Wajib | Pembeda utama dan inti penilaian Tech & AI |
| Rujukan toko mitra | Wajib, data diisi manual | Sumber pendapatan; tanpa portal toko dulu |
| Mode offline dan sinkronisasi | Wajib | Syarat dasar produk |
| Peringatan dini per kandang | Ditunda | Butuh data beberapa minggu; di MVP memakai ambang umum |
| Portal mandiri untuk toko | Ditunda | Data toko diisi tim dulu |
| Pembayaran dan penagihan | Ditunda | Belum ada tarif yang terbukti layak |
| Notifikasi WhatsApp otomatis | Ditunda | Cukup tombol bagikan ringkasan |
| Banyak jenis ayam di antarmuka | Ditunda | Petelur dulu; jenis ayam tetap parameter di data |

## Kebutuhan fungsional

Tiap modul punya satu cerita pengguna dan kriteria penerimaan yang bisa diuji. Angka di kriteria adalah target rancangan, bukan hasil pengukuran.

**F1. Penyusun pakan**

- Sebagai peternak, saya memasukkan bahan dan harga lalu mendapat campuran termurah yang memenuhi kebutuhan gizi.
- Diterima bila: solver menghasilkan komposisi dalam persen dan biaya per kg; hasil menyatakan jelas bila tidak ada campuran yang layak; kebutuhan gizi mengikuti SNI yang disimpan sebagai data; teks bebas ("jagung 3500, dedak 2800") dapat diurai LLM, dan hasil urai selalu ditampilkan untuk dikonfirmasi sebelum dihitung.

**F2. Catatan harian**

- Sebagai peternak, saya mencatat pakan, produksi telur, kematian, dan suhu per hari.
- Diterima bila: formulir tersimpan lokal saat offline; riwayat 30 hari tampil sebagai daftar dan grafik sederhana; data bisa diedit dan dihapus; ambang umum menampilkan peringatan bila angka di luar batas.

**F3. Triase Kokok**

- Sebagai peternak, saya menceritakan gejala dan mendapat tingkat urgensi serta langkah aman.
- Diterima bila: keluaran selalu satu dari tiga tingkat urgensi; jawaban mengutip sumber panduan; tidak pernah memuat dosis obat atau diagnosis pasti; selalu ada tombol bagikan ringkasan kasus ke WhatsApp; bila tidak ada sumber relevan, Kokok berkata tidak tahu dan menyarankan ahli.

**F4. Rujukan toko mitra**

- Sebagai peternak, saya melihat toko yang memberi total biaya pakan terendah untuk campuran saya.
- Diterima bila: urutan dihitung dari total biaya, bukan komisi; setiap toko berlabel mitra atau bukan, asal harga, dan waktu harga diperbarui; harga lebih lama dari batas yang ditetapkan ditandai usang.

**F5. Akun dan data**

- Masuk dengan nomor ponsel, email, atau Google. **Diubah 23 November 2026:** semua fitur aplikasi wajib masuk (mode tamu dihapus); landing page tetap publik. Masuk pertama butuh internet, setelah itu aplikasi tetap bisa dipakai offline. Data tamu lama dipindah ke akun saat masuk.

## Kebutuhan non-fungsional

Produk harus tetap berguna di ponsel Android murah dengan sinyal buruk; target di bawah ini diuji pada tahap akhir.

| Aspek | Kebutuhan | Cara uji |
| --- | --- | --- |
| Offline | Seluruh F1, F2, dan riwayat Kokok sebelumnya bisa dibuka tanpa sinyal; pertanyaan baru ke Kokok memerlukan sinyal dan menampilkan pesan jelas | Mode pesawat, buka tiap layar |
| Performa | Layar utama muncul dalam 3 detik pada jaringan 3G terbatasi (target) | Lighthouse dengan throttling |
| Ukuran | Aset awal sekecil mungkin; tanpa pustaka besar yang tidak dipakai | Laporan bundle |
| Bahasa | Seluruh antarmuka bahasa Indonesia, istilah sehari-hari peternak | Tinjauan manual |
| Keterbacaan | Teks besar, kontras jelas, tombol besar untuk layar kecil | Uji di ponsel nyata |
| Keamanan | HTTPS, sesi aman, kunci API LLM hanya di server, validasi input di server | Tinjauan SDD bagian keamanan |
| Privasi | Hanya data yang dibutuhkan; pengguna dapat menghapus datanya | Alur hapus akun diuji |
| Biaya | Infrastruktur sekitar Rp500.000 per bulan; panggilan LLM dibatasi token dan cache | Pantau biaya harian |

## Metrik keberhasilan dan definisi selesai

Untuk demo, produk dianggap selesai bila lima skenario inti berjalan di ponsel nyata tanpa bantuan pengembang. Metrik pilot ditetapkan setelah wawancara.

Definisi selesai demo:

- [ ] Skenario 1 sampai 4 berjalan dalam mode pesawat atau dengan cadangan yang jelas
- [ ] Solver mengembalikan hasil yang bisa diperiksa tangan untuk tiga contoh bahan
- [ ] Kokok menjawab dengan sumber pada sepuluh pertanyaan uji, dan menolak memberi dosis
- [ ] Aplikasi dapat dipasang dari peramban (PWA) dan dibuka dari layar utama
- [ ] Tautan prototipe publik dan satu akun demo siap
- [ ] Rekaman layar cadangan untuk sesi presentasi

Metrik pilot (nilai target diisi setelah wawancara): pengguna aktif mingguan, rata-rata penghematan biaya pakan yang dilaporkan peternak, jumlah rujukan toko yang diikuti pembelian. \[isi target\]

## Asumsi, ketergantungan, dan pertanyaan terbuka

Enam hal belum diputuskan dan menentukan pengerjaan; sisanya adalah asumsi kerja.

- [ ] Siapa yang membangun web dan backend sekarang? (rekan tim tidak bisa diandalkan)
- [ ] Penyedia LLM mana yang dipakai, dan berapa batas biaya per bulan
- [ ] Pustaka dan sumber indeks RAG untuk panduan kesehatan ayam
- [ ] Sumber resmi kebutuhan gizi dan kandungan bahan (SNI) dalam bentuk data
- [ ] Dari mana harga bahan dan harga toko diambil di pilot
- [ ] Demo memakai ayam petelur (rekomendasi) atau pedaging

Asumsi: web dan mobile memakai API yang sama; pengguna awal membuka dari Android; koperasi atau toko membantu pengenalan awal. Ketergantungan: akses ke VPS, domain, dan akun penyedia LLM.

## Urutan pengerjaan

Kerjakan berurutan dari yang paling dibutuhkan demo; setiap tahap harus bisa didemokan sendiri sebelum lanjut, sehingga bila waktu habis tetap ada produk yang berjalan.

1. **Fondasi:** repositori, backend FastAPI, basis data, PWA kosong yang bisa dipasang, dan satu halaman yang tetap terbuka offline.
2. **Penyusun pakan:** data bahan dan SNI, solver, layar hasil. Inilah demo pertama yang layak.
3. **Catatan harian:** formulir offline, penyimpanan lokal, sinkronisasi.
4. **Rujukan toko:** data toko manual, urutan berdasarkan total biaya, label mitra dan waktu harga.
5. **Kokok:** indeks RAG, tiga tingkat urgensi, batas keselamatan, ringkasan kasus.
6. **Pemolesan:** uji di ponsel nyata, kecepatan, teks, akun demo, rekaman cadangan.
