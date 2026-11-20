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
  { href: "#investasi", label: "Investasi" },
  { href: "#cara-kerja", label: "Alur" },
  { href: "#kepercayaan", label: "Kepercayaan" },
  { href: "#untuk-toko", label: "Untuk toko pakan" },
  { href: "#faq", label: "FAQ" },
] as const;

export const LANDING_HERO = {
  pengumumanLabel: "Baru",
  pengumuman: "Investasi ternak: titip modal ke peternak terdekat",
  eyebrow: "ASISTEN DIGITAL PETERNAK AYAM",
  h1Utama: "Pakan lebih hemat.",
  h1Aksen: "Ayam lebih terjaga.",
  sub: "Hitung pakan termurah, catat kandang tiap hari, dan dapat bantuan saat ayam sakit. Tetap jalan tanpa sinyal.",
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
  sumberLabel: "Sumber:",
  sumberDaftar: [
    { nama: "BRMP Jawa Timur (Kementan)" },
    { nama: "Republika" },
    { nama: "Kementerian Pertanian RI" },
    { nama: "Universitas Gadjah Mada (UGM)" },
  ] as const,
  catatanVerifikasi: "Angka dari riset awal, akan diverifikasi ulang sebelum rilis.",
} as const;

export const LANDING_MODUL: readonly ModulLandingItem[] = [
  {
    nomor: "01",
    label: "HITUNG PAKAN",
    judul: "Tulis bahan dan harganya, Ternakin cari campuran termurah.",
    kalimat: "Komposisi per 100 kg dihitung solver dan dijelaskan dengan bahasa sehari-hari.",
    pratinjau: "pakan",
  },
  {
    nomor: "02",
    label: "CATAT HARIAN",
    judul: "Catat sebentar, tanpa sinyal pun bisa.",
    kalimat: "Pakan, telur, ayam mati, dan suhu tersimpan di ponsel, terkirim saat ada sinyal.",
    pratinjau: "catatan",
  },
  {
    nomor: "03",
    label: "TANYA KOKOK",
    judul: "Ayam lesu? Tanya dulu.",
    kalimat: "Kokok menilai seberapa mendesak dan merujuk ke dokter hewan mitra. Bukan diagnosis, tanpa dosis obat.",
    pratinjau: "kokok",
  },
  {
    nomor: "04",
    label: "TOKO PAKAN",
    judul: "Tahu belinya di mana.",
    kalimat: "Toko terdekat yang menjual campuran termurah, lengkap dengan harga dan waktu pembaruan.",
    pratinjau: "toko",
  },
];

export const LANDING_KEPERCAYAAN = {
  eyebrow: "CARA KAMI MENJAGA KEPERCAYAAN",
  judulUtama: "Angkanya dihitung,",
  judulAksen: "bukan dikarang.",
  poin: [
    {
      id: "solver",
      judul: "Angka pakan dari perhitungan optimasi",
      keterangan: "Komposisi dan biaya per kg dihitung solver dan bisa Anda periksa.",
    },
    {
      id: "toko",
      judul: "Urutan toko dari total biaya, bukan komisi",
      keterangan: "Setiap toko diberi label mitra, asal harga, dan waktu pembaruan.",
    },
    {
      id: "kokok",
      judul: "Kokok menjawab dari pedoman terkurasi",
      keterangan: "Menampilkan sumber, tanpa dosis obat, dan merujuk ke ahli bila mendesak.",
    },
    {
      id: "privasi",
      judul: "Data kandang Anda tidak dijual",
      keterangan: "Catatan kandang milik Anda dan bisa dihapus kapan saja.",
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
    "Pilot gratis untuk toko pakan di Bandung Raya.",
    "Kirim daftar harga lewat WhatsApp tiap minggu, tim kami yang memasukkan.",
    "Dapat rekap peternak yang menghubungi toko Anda setiap minggu.",
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
    id: "faq-investasi-uang",
    pertanyaan: "Apakah Ternakin memegang uang investasi?",
    jawaban:
      "Tidak. Di versi rilis, pendanaan berjalan lewat penyelenggara urun dana berizin OJK yang sedang disiapkan. Ternakin menyediakan data kandang dari catatan harian, tampilan perkembangan, dan rujukan ke mitra. Saat ini fitur investasi masih prototipe dan tidak ada uang yang berpindah.",
  },
  {
    id: "faq-investasi-risiko",
    pertanyaan: "Apa risikonya menitipkan modal ke peternak?",
    jawaban:
      "Ayam bisa sakit atau mati dan harga jual bisa turun, sehingga modal yang kembali bisa berkurang bahkan habis. Karena itu setiap kandang wajib diperiksa dokter hewan mitra sebelum dibuka, dan datanya bisa Anda pantau setiap hari.",
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

export interface KokokChatPilihan {
  id: string;
  label: string;
  jawaban: string;
  aksi?: { label: string; ke: string } | { label: string; whatsapp: string };
}

/** Isi popup obrolan Kokok di landing page. Jawaban diambil dari FAQ agar tidak berbeda. */
function jawabanFaq(id: string): string {
  return LANDING_FAQ.find((item) => item.id === id)?.jawaban ?? "";
}

export const LANDING_KOKOK_CHAT = {
  judul: "Kokok",
  status: "Asisten peternak Ternakin",
  teaser: "Kukuruyuk! Ada yang mau ditanyakan soal Ternakin?",
  sapaan: [
    "Halo, saya Kokok! Saya bisa menjelaskan Ternakin atau membantu Anda mulai cek gejala ayam.",
    "Pilih pertanyaan di bawah, atau ceritakan keluhan ayam Anda.",
  ],
  pilihan: [
    {
      id: "pakan",
      label: "Cara hitung pakan",
      jawaban:
        "Tulis bahan pakan dan harganya, lalu Ternakin mencari campuran termurah yang gizinya tetap cukup. Hasilnya per 100 kg dan bisa Anda periksa sendiri.",
      aksi: { label: "Mulai hitung pakan", ke: "/app/pakan" },
    },
    { id: "bayar", label: "Biayanya berapa?", jawaban: jawabanFaq("faq-bayar") },
    { id: "sinyal", label: "Bisa tanpa sinyal?", jawaban: jawabanFaq("faq-sinyal") },
    { id: "obat", label: "Kokok bisa kasih obat?", jawaban: jawabanFaq("faq-obat") },
    { id: "siapa", label: "Cocok untuk siapa?", jawaban: jawabanFaq("faq-siapa") },
    {
      id: "investasi",
      label: "Investasi ternak",
      jawaban:
        "Fitur baru! Anda bisa menitipkan modal ke peternak ayam pedaging di dekat Anda, lalu menerima bagian laba saat panen. Ternakin tidak memegang uangnya, dan setiap kandang diperiksa dokter hewan mitra dulu. Masih prototipe, jadi belum ada uang yang berpindah.",
      aksi: { label: "Lihat peluang", ke: "/app/investasi" },
    },
    {
      id: "tim",
      label: "Bicara dengan tim",
      jawaban: "Tentu. Tim Ternakin bisa dihubungi langsung lewat WhatsApp.",
      aksi: {
        label: "Buka WhatsApp",
        whatsapp: "Halo tim Ternakin, saya ingin bertanya setelah mengobrol dengan Kokok.",
      },
    },
  ] satisfies readonly KokokChatPilihan[],
  labelInput: "Ceritakan keluhan ayam Anda",
  placeholderInput: "Contoh: ayam lesu dan ngorok sejak kemarin",
  balasanGejala:
    "Terima kasih sudah bercerita. Untuk menilai seberapa mendesak, saya perlu membaca pedoman di halaman Tanya Kokok. Cerita Anda sudah saya bawa ke sana.",
  tombolLanjutGejala: "Lanjut cek gejala",
  catatanAman: "Kokok tidak memberi diagnosis atau dosis obat.",
} as const;
