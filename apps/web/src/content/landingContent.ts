export interface MasalahStatItem {
  id: string;
  angka: string;
  judul: string;
  keterangan: string;
}

export interface ModulLandingItem {
  nomor: "01" | "02" | "03" | "04";
  label: string;
  judul: string;
  kalimat: string;
  pratinjau: "pakan" | "catatan" | "kokok" | "toko";
}

export interface LangkahMulaiItem {
  nomor: "01" | "02" | "03";
  judul: string;
  keterangan: string;
}

export interface KepercayaanItem {
  id: "solver" | "toko" | "kokok" | "privasi";
  judul: string;
  keterangan: string;
}

export interface FaqLandingItem {
  id: string;
  pertanyaan: string;
  jawaban: string;
}

export const LANDING_NAV_LINKS = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#kepercayaan", label: "Kepercayaan" },
  { href: "#untuk-toko", label: "Untuk toko pakan" },
  { href: "#faq", label: "FAQ" },
] as const;

export const LANDING_HERO = {
  eyebrow: "ASISTEN DIGITAL PETERNAK AYAM",
  h1Utama: "Pakan lebih hemat.",
  h1Aksen: "Ayam lebih terjaga.",
  sub: "Hitung pakan termurah yang tetap cukup gizi, catat kandang tiap hari, dan tahu harus menghubungi siapa saat ayam bermasalah. Tetap jalan walau sinyal di kandang hilang.",
  tombolUtama: "Mulai hitung pakan",
  tombolWa: "Tanya dulu lewat WhatsApp",
  pesanWaHero:
    "Halo tim Ternakin, saya peternak ayam dan ingin bertanya mengenai penggunaan Ternakin.",
  tombolPasang: "Pasang di layar utama",
  keteranganPasang: "Gratis untuk peternak. Tidak perlu unduh dari toko aplikasi.",
  keteranganPratinjau: "Contoh tampilan, bukan hasil nyata",
} as const;

export const LANDING_MARQUEE_BARIS_1 = [
  "Gratis untuk peternak",
  "Jalan tanpa sinyal",
  "Tanpa alat tambahan",
  "Harga toko di sekitar",
  "Hitungan bisa diperiksa",
] as const;

export const LANDING_MARQUEE_BARIS_2 = [
  "Hitungan bisa diperiksa",
  "Gratis untuk peternak",
  "Harga toko di sekitar",
  "Jalan tanpa sinyal",
  "Tanpa alat tambahan",
] as const;

export const LANDING_MASALAH = {
  eyebrow: "KENAPA TERNAKIN",
  judul: "Pakan menyedot sebagian besar biaya. Ayam sakit tidak menunggu.",
  kartu: [
    {
      id: "biaya-pakan",
      angka: "70–80%",
      judul: "Biaya usaha terserap pakan",
      keterangan:
        "Pakan menjadi komponen pengeluaran terbesar pada usaha ayam petelur mandiri skala kecil.",
    },
    {
      id: "tenaga-keswan",
      angka: "1.691 puskeswan, 971 dokter hewan",
      judul: "Keterbatasan tenaga kesehatan hewan (data 2021)",
      keterangan:
        "Akses pemeriksaan langsung sering terbatas sehingga peternak perlu tahu tingkat urgensi sejak awal.",
    },
    {
      id: "lapor-cepat",
      angka: "Kurang dari 24 jam",
      judul: "Batas pelaporan kasus gejala berat",
      keterangan:
        "Gejala penyakit menular seperti AI dan ND sering tampak mirip dan perlu segera dilaporkan ke ahli.",
    },
  ] satisfies readonly MasalahStatItem[],
  sumberLabel: "Sumber rujukan dokumen ringkasan eksekutif:",
  sumberDaftar: [
    { nama: "BRMP Jawa Timur (Kementan)" },
    { nama: "Republika" },
    { nama: "Kementerian Pertanian RI" },
    { nama: "Universitas Gadjah Mada (UGM)" },
  ] as const,
  catatanVerifikasi:
    "Catatan jujur: angka latar di atas diambil dari ringkasan riset awal proyek dan dijadwalkan diverifikasi ulang terhadap publikasi resmi BPS, Kementan, dan teks SNI sebelum rilis publik penuh.",
} as const;

export const LANDING_MODUL: readonly ModulLandingItem[] = [
  {
    nomor: "01",
    label: "HITUNG PAKAN",
    judul: "Tulis bahan dan harganya, Ternakin cari campuran termurah.",
    kalimat:
      "Komposisi per 100 kg dan biaya per kg dihitung solver yang bisa diperiksa, lalu dijelaskan dengan bahasa sehari-hari.",
    pratinjau: "pakan",
  },
  {
    nomor: "02",
    label: "CATAT HARIAN",
    judul: "Catat sebentar, tanpa sinyal pun bisa.",
    kalimat:
      "Pakan, telur atau bobot, ayam mati, dan suhu tersimpan di ponsel, lalu terkirim saat sinyal kembali.",
    pratinjau: "catatan",
  },
  {
    nomor: "03",
    label: "TANYA KOKOK",
    judul: "Ayam lesu? Tanya dulu.",
    kalimat:
      "Menilai seberapa mendesak, memberi panduan umum dari pedoman, lalu menyiapkan ringkasan kasus untuk penyuluh, puskeswan, atau dokter hewan. Tidak memberi dosis obat dan bukan diagnosis.",
    pratinjau: "kokok",
  },
  {
    nomor: "04",
    label: "TOKO PAKAN",
    judul: "Tahu belinya di mana.",
    kalimat:
      "Toko mitra yang menjual bahan campuran termurah, lengkap dengan harga, asal harga, dan kapan diperbarui.",
    pratinjau: "toko",
  },
];

export const LANDING_CARA_MULAI = {
  eyebrow: "CARA KERJA",
  judul: "Mulainya gampang.",
  langkah: [
    {
      nomor: "01",
      judul: "Isi profil kandang",
      keterangan: "Masukkan jenis ayam, umur dalam minggu, dan jumlah ayam di kandang Anda.",
    },
    {
      nomor: "02",
      judul: "Ketik bahan dan harga yang Anda temui",
      keterangan:
        "Pilih dari daftar bahan atau tulis dengan kalimat sehari-hari lalu periksa hasil bacaannya.",
    },
    {
      nomor: "03",
      judul: "Lihat campuran dan toko, lalu hubungi lewat WhatsApp",
      keterangan:
        "Periksa komposisi per 100 kg, bandingkan total biaya antar toko sekitar, dan hubungi toko langsung.",
    },
  ] satisfies readonly LangkahMulaiItem[],
  tombolUtama: "Mulai hitung pakan",
} as const;

export const LANDING_KEPERCAYAAN = {
  eyebrow: "CARA KAMI MENJAGA KEPERCAYAAN",
  judulUtama: "Angkanya dihitung,",
  judulAksen: "bukan dikarang.",
  poin: [
    {
      id: "solver",
      judul: "Angka pakan dari perhitungan optimasi",
      keterangan:
        "Setiap komposisi dan biaya per kg dihitung langsung oleh solver dengan batasan gizi yang bisa Anda buka di panel Lihat perhitungan.",
    },
    {
      id: "toko",
      judul: "Urutan toko dari total biaya, bukan komisi",
      keterangan:
        "Setiap kartu toko menampilkan label mitra atau bukan, asal harga, waktu pembaruan, dan penanda Usang bila harga sudah lama.",
    },
    {
      id: "kokok",
      judul: "Kokok menjawab dari pedoman terkurasi",
      keterangan:
        "Menampilkan sumber pedoman yang dipakai, tidak memberi dosis obat maupun diagnosis pasti, dan merujuk ke ahli bila mendesak atau di luar pedoman.",
    },
    {
      id: "privasi",
      judul: "Data kandang Anda tidak dijual",
      keterangan:
        "Catatan harian tersimpan untuk keperluan kandang Anda sendiri dan dapat dihapus seluruhnya kapan saja.",
    },
  ] satisfies readonly KepercayaanItem[],
  gelembungMaskot:
    "Saya Kokok. Saya membantu cek urgensi gejala dari pedoman, bukan memberi dosis obat.",
  slotMaskotLabel: "Slot maskot Kokok (belum ditentukan)",
} as const;

export const LANDING_TOKO = {
  eyebrow: "TOKO PAKAN?",
  judul: "Dapat calon pembeli baru dari peternak di sekitar.",
  poin: [
    "Pilot gratis untuk toko pakan di wilayah Bandung Raya dan sekitarnya.",
    "Cukup kirim daftar harga bahan pakan lewat WhatsApp tiap minggu, tim kami yang memasukkannya.",
    "Setiap peternak yang menghubungi toko tercatat atas nama toko lewat tautan atau kartu QR khusus, dan rekap lead dikirim tiap minggu.",
    "Urutan toko selalu memakai total biaya pakan yang memenuhi gizi, sehingga harga yang bersaing otomatis berada di atas.",
  ] as const,
  tombolWa: "Jadi toko mitra lewat WhatsApp",
  pesanWaToko:
    "Halo tim Ternakin, saya pemilik/pengelola toko pakan dan tertarik ikut pilot toko mitra.",
} as const;

export const LANDING_FAQ: readonly FaqLandingItem[] = [
  {
    id: "faq-siapa",
    pertanyaan: "Ternakin untuk siapa?",
    jawaban:
      "Peternak ayam petelur mandiri skala kecil, dimulai dari Bandung Raya. Peternak plasma yang menerima pakan dari perusahaan inti tetap bisa memakai catatan harian dan triase, tetapi modul pakan dan toko ditujukan untuk peternak mandiri.",
  },
  {
    id: "faq-bayar",
    pertanyaan: "Bayar berapa?",
    jawaban: "Gratis untuk peternak. Pendapatan datang dari toko pakan mitra.",
  },
  {
    id: "faq-sinyal",
    pertanyaan: "Kalau sinyal hilang?",
    jawaban:
      "Catatan harian tersimpan di ponsel dan terkirim saat tersambung. Hitung pakan tetap jalan; membaca teks bebas dan bertanya ke Kokok butuh sinyal.",
  },
  {
    id: "faq-obat",
    pertanyaan: "Chatbot bisa memberi obat?",
    jawaban:
      "Tidak. Ia tidak memberi dosis atau diagnosis pasti, hanya menilai urgensi, memberi panduan umum, dan merujuk ke ahli, karena gejala beberapa penyakit unggas mirip.",
  },
  {
    id: "faq-urutan-toko",
    pertanyaan: "Kenapa toko ini di urutan atas?",
    jawaban:
      "Urutan dari total biaya pakan yang memenuhi gizi. Setiap toko diberi label mitra, asal harga, dan umur harga; harga yang terlalu lama ditandai usang.",
  },
  {
    id: "faq-unduh",
    pertanyaan: "Perlu unduh dari Play Store atau App Store?",
    jawaban:
      "Tidak. Pasang dari peramban ke layar utama; di iPhone lewat Bagikan lalu Tambah ke Layar Utama.",
  },
];

export const LANDING_PENUTUP = {
  eyebrow: "MULAI DARI KANDANG ANDA",
  judulUtama: "Hitung dulu.",
  judulAksen: "Lihat sendiri selisihnya.",
  tombolUtama: "Mulai hitung pakan",
  tombolPasang: "Pasang di layar utama",
  catatanPrototipe: "Versi prototipe. Fitur dan data masih dalam pengujian.",
} as const;

export const LANDING_FOOTER = {
  tagline:
    "Asisten digital peternak ayam untuk menekan biaya pakan dan bertindak cepat saat ayam bermasalah.",
  hakCipta: "© 2026 Ternakin",
  pesanWaFooter: "Halo tim Ternakin, saya ingin menghubungi tim terkait aplikasi Ternakin.",
} as const;
