export const TEKS = {
  lewatiKeKonten: "Lewati ke konten",
  namaAplikasi: "ternakin",
  statusOnline: "Tersambung",
  statusOffline: "Offline",
  aturAnimasi: "Atur animasi",
  animasiAktif: "Aktif",
  animasiMati: "Mati",
  bannerOffline: "Anda sedang tanpa sinyal. Halaman ini tetap bisa dibuka dari penyimpanan ponsel.",
  eyebrowFondasi: "FONDASI PWA · FASE 0–2",
  judulFondasi: "Ternakin siap dibuka walau sinyal hilang.",
  deskripsiFondasi:
    "Hitung campuran pakan termurah langsung dari perangkat Anda, tetap berjalan meski sinyal di kandang terputus.",
  tombolMulaiPakan: "Mulai hitung pakan",
  tombolCekServer: "Cek sambungan server",
  cekServerMemuat: "Memeriksa sambungan server...",
  cekServerBerhasil: "Server aktif dan menjawab normal.",
  cekServerOffline:
    "Tidak bisa memeriksa server karena Anda sedang offline. Coba lagi saat sinyal kembali.",
  cekServerGagal: "Server belum dapat dijangkau. Coba lagi sebentar lagi.",
  tombolPasang: "Pasang di layar utama",
  keteranganPasang: "Gratis untuk peternak. Tidak perlu unduh dari toko aplikasi.",
  sudahTerpasang: "Aplikasi sudah dibuka dalam mode terpasang.",
  panduanIosJudul: "Cara pasang di iPhone atau iPad",
  panduanIosIsi: "Ketuk tombol Bagikan di bilah bawah Safari, lalu pilih Tambah ke Layar Utama.",
  panduanBrowserLain:
    "Buka menu peramban Anda lalu pilih Tambah ke Layar Utama atau Pasang aplikasi.",
  pwaSiapOffline: "Aplikasi tersimpan dan siap dibuka tanpa sinyal.",
  pwaVersiBaru: "Versi baru siap.",
  pwaTombolPerbarui: "Perbarui",
  catatanTahap:
    "Versi prototipe awal. Modul catatan harian, toko mitra, dan Kokok akan ditambahkan pada fase berikutnya.",
  modulSegeraJudul: "Modul ini disiapkan pada fase berikutnya",
  modulSegeraIsi:
    "Modul ini belum diaktifkan pada tahap ini. Anda sudah bisa menggunakan Penyusun pakan di tab Pakan.",
  kembaliKeBeranda: "Kembali ke Beranda",
} as const;

export const TEKS_PAKAN = {
  judulHalaman: "Penyusun pakan",
  eyebrow: "AYAM PETELUR · HITUNG TANPA SINYAL",
  judul: "Cari campuran pakan termurah yang tetap cukup gizi.",
  deskripsi:
    "Pilih bahan yang tersedia di sekitar Anda lalu isi harganya per kg. Perhitungan berjalan langsung di perangkat Anda.",
  labelFase: "Pilih fase ayam petelur",
  judulTeksBebas: "Jalan pintas: tulis bahan dan harga sekaligus",
  petunjukTeksBebas:
    "Contoh: Jagung 6.500 per kg, dedak 4.000, konsentrat 12.000 per kg, kapur 1.500",
  tombolUraiTeks: "Urai teks",
  uraiMemuat: "Membaca teks...",
  alasanUraiOffline:
    "Membaca teks bebas butuh sinyal. Tulisan Anda sudah disimpan sebagai draf; pilih bahan dan isi harga langsung di bawah.",
  judulKonfirmasiUrai: "Cek dulu bacaan kami",
  subKonfirmasiUrai:
    "Pastikan nama bahan dan harga per kg sudah benar sebelum diterapkan ke hitungan.",
  tombolTerapkanUrai: "Terapkan ke daftar bahan",
  tombolBatalUrai: "Tutup",
  judulPilihBahan: "Pilih bahan dan isi harga per kg",
  petunjukPilihBahan:
    "Centang bahan yang tersedia lalu isi harga per kg sesuai harga toko atau catatan Anda.",
  labelBiayaSekarang: "Biaya ransum Anda sekarang (opsional)",
  petunjukBiayaSekarang: "Isi bila ingin melihat selisih biaya per kg terhadap hasil hitungan.",
  tombolHitung: "Hitung campuran",
  hitungMemuat: "Menghitung campuran...",
  galatPilihBahan: "Pilih minimal satu bahan dan isi harga per kg lebih dari 0.",
  galatMemuatReferensi: "Data bahan belum berhasil dimuat. Coba muat ulang saat sinyal tersedia.",
  tombolMuatUlang: "Coba lagi",
  labelBiayaPerKg: "Biaya per kg",
  labelTotal100Kg: "Total per 100 kg",
  judulKomposisi: "Komposisi per 100 kg pakan",
  judulGizi: "Pemenuhan kebutuhan gizi",
  statusTerpenuhi: "Terpenuhi",
  badgePenjelasanAi: "Penjelasan ditulis AI",
  penjelasanMemuat: "Menyiapkan ringkasan bahasa sehari-hari...",
  penjelasanOffline:
    "Anda sedang tanpa sinyal. Angka campuran di atas tetap lengkap; ringkasan tambahan tersedia saat tersambung.",
  penjelasanDitolak:
    "Ringkasan otomatis tidak ditampilkan karena angkanya tidak cocok dengan hasil hitungan. Gunakan tabel angka di atas.",
  penjelasanGagal:
    "Ringkasan otomatis belum bisa diambil sekarang. Angka campuran di atas tetap berlaku.",
  judulLihatPerhitungan: "Lihat perhitungan",
  tombolLihatToko: "Lihat toko yang menjual",
  judulTakLayak: "Bahan ini belum cukup memenuhi kebutuhan gizi",
  judulZatBermasalah: "Zat gizi yang belum terpenuhi",
  judulSaranBahan: "Saran bahan tambahan yang bisa dicoba",
  tombolTambahSaran: "Tambahkan",
  labelDataContoh: "Data contoh",
} as const;

export const TEKS_KOKOK = {
  judulHalaman: "Kokok",
  eyebrow: "KOKOK · TRIASE GEJALA · UJI COBA",
  judul: "Cek cepat tingkat urgensi gejala ayam Anda.",
  penafianPermanen: "Bukan diagnosis dan tidak memberi dosis obat.",
  catatanUjiCoba:
    "Uji coba — pedoman contoh ini belum ditinjau penasihat penyuluh atau dokter hewan. Selalu pastikan ke tenaga ahli untuk pemeriksaan langsung.",
  slotMaskot: "Slot maskot Kokok (belum ditentukan)",
  labelGejalaCepat: "Atau pilih gejala yang paling dekat:",
  labelTextarea: "Ceritakan gejala yang Anda lihat di kandang",
  placeholderTextarea:
    "Contoh: 3 ekor ayam mulai ngorok, bersin, dan nafsu makan turun sejak kemarin sore.",
  labelSejakKapan: "Sejak kapan muncul? (opsional)",
  placeholderSejakKapan: "Contoh: Pagi ini / 2 hari lalu",
  tombolKirim: "Tanya Kokok",
  tombolMengirim: "Memeriksa pedoman...",
  bannerOffline:
    "Anda sedang tanpa sinyal. Pertanyaan baru butuh sambungan, namun tulisan Anda otomatis tersimpan sebagai draf dan riwayat tanya sebelumnya tetap bisa dibaca di bawah.",
  alasanOffline: "Tanya baru butuh sinyal. Draf Anda tersimpan di perangkat.",
  galatMinimalGejala: "Ceritakan gejala minimal 3 karakter agar Kokok dapat memeriksa pedoman.",
  galatServer: "Kokok belum bisa menjawab sekarang. Coba lagi sebentar lagi.",
  judulUrgensiTinggi: "Urgensi tinggi — segera hubungi dokter hewan",
  judulRiwayat: "Riwayat tanya Kokok",
  kosongRiwayat:
    "Belum ada percakapan tersimpan. Pilih salah satu gejala di atas atau tulis kondisi ayam Anda untuk memulai.",
  judulPanduanUmum: "Langkah aman yang bisa dilakukan sekarang",
  judulSumber: "Lihat sumber pedoman yang dipakai",
  tanpaSumber:
    "Tidak ada pedoman di basis data yang cocok dengan pertanyaan ini. Konsultasikan langsung dengan penyuluh, puskeswan, atau dokter hewan.",
  judulRingkasanKasus: "Ringkasan kasus untuk dibagikan",
  tombolKirimWa: "Kirim lewat WhatsApp",
  catatanWaTanpaNomor:
    "WhatsApp akan terbuka tanpa nomor tujuan agar Anda bisa memilih kontak dokter hewan, puskeswan, atau penyuluh Anda sendiri.",
  badgeUjiCoba: "Uji coba",
  badgeTerfilter: "Jawaban aman",
  badgeTidakTahu: "Di luar pedoman",
} as const;
