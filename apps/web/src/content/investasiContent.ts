/**
 * Data dan teks Modul 5 — Investasi ternak (prototipe).
 *
 * SEMUA data di file ini adalah CONTOH untuk prototipe: nama peternak, kandang,
 * dokter hewan, dan angka tidak mewakili orang atau usaha sungguhan. Ternakin
 * tidak memegang uang; di versi rilis pendanaan berjalan lewat penyelenggara
 * urun dana berizin OJK yang masih disiapkan (belum ada nama mitra yang pasti).
 */

export type StatusPeluang = "dibuka" | "menunggu-pemeriksaan" | "dipelihara";

export interface TitikCatatan {
  hari: number;
  bobotGram: number;
  mortalitasPersen: number;
  pakanKg: number;
}

export interface PemeriksaanDokter {
  dokter: string;
  klinik: string;
  tanggal: string;
  hasil: "layak" | "layak-dengan-catatan";
  poin: readonly string[];
}

export interface PeluangInvestasi {
  id: string;
  peternak: string;
  namaKandang: string;
  kecamatan: string;
  wilayah: string;
  lat: number;
  lng: number;
  pengalamanTahun: number;
  jumlahEkor: number;
  siklusHari: number;
  status: StatusPeluang;
  /** Hari pemeliharaan berjalan, hanya untuk status "dipelihara". */
  hariBerjalan: number | null;
  kebutuhanModal: number;
  modalTerkumpul: number;
  minimalTitip: number;
  porsiPemodalPersen: number;
  pemeriksaan: PemeriksaanDokter | null;
  /** Ringkasan siklus sebelumnya dari catatan harian peternak. */
  siklusLalu: { mortalitasPersen: number; bobotPanenKg: number; fcr: number; hariPanen: number };
  catatan: readonly TitikCatatan[];
}

/** Kurva bobot ayam pedaging yang wajar (gram) — dipakai untuk membuat catatan contoh. */
function bobotPadaHari(hari: number, faktor: number): number {
  const kurva = 42 + 1.6 * hari * hari + 4 * hari;
  return Math.round(kurva * faktor);
}

function buatCatatanContoh(
  sampaiHari: number,
  faktorBobot: number,
  mortalitasAkhir: number,
  jumlahEkor: number,
): TitikCatatan[] {
  const hasil: TitikCatatan[] = [];
  for (let hari = 1; hari <= sampaiHari; hari += 1) {
    const bobot = bobotPadaHari(hari, faktorBobot);
    // Konsumsi pakan harian kira-kira sebanding bobot (gram per ekor), dikonversi ke kg kandang
    const pakanPerEkorGram = Math.min(200, 12 + bobot * 0.085);
    hasil.push({
      hari,
      bobotGram: bobot,
      mortalitasPersen: Math.round(((mortalitasAkhir * hari) / sampaiHari) * 10) / 10,
      pakanKg: Math.round((pakanPerEkorGram * jumlahEkor) / 1000),
    });
  }
  return hasil;
}

export const PELUANG_INVESTASI: readonly PeluangInvestasi[] = [
  {
    id: "pl-ciparay",
    peternak: "Pak Dedi S.",
    namaKandang: "Kandang Sukamaju",
    kecamatan: "Ciparay",
    wilayah: "Kab. Bandung",
    lat: -7.0336,
    lng: 107.7247,
    pengalamanTahun: 6,
    jumlahEkor: 1000,
    siklusHari: 32,
    status: "dibuka",
    hariBerjalan: null,
    kebutuhanModal: 32_000_000,
    modalTerkumpul: 19_500_000,
    minimalTitip: 100_000,
    porsiPemodalPersen: 60,
    pemeriksaan: {
      dokter: "drh. Rina A. (contoh)",
      klinik: "Klinik Hewan Mitra Bandung Timur (contoh)",
      tanggal: "2026-11-12",
      hasil: "layak",
      poin: [
        "Ventilasi dan kepadatan kandang sesuai untuk 1.000 ekor.",
        "Program vaksinasi ND dan Gumboro siklus lalu tercatat lengkap.",
        "Tidak ditemukan tanda penyakit menular saat kunjungan.",
      ],
    },
    siklusLalu: { mortalitasPersen: 3.1, bobotPanenKg: 1.9, fcr: 1.52, hariPanen: 32 },
    catatan: buatCatatanContoh(32, 1.0, 3.1, 1000),
  },
  {
    id: "pl-cileunyi",
    peternak: "Bu Euis N.",
    namaKandang: "Kandang Mekar Tani",
    kecamatan: "Cileunyi",
    wilayah: "Kab. Bandung",
    lat: -6.9396,
    lng: 107.7466,
    pengalamanTahun: 4,
    jumlahEkor: 1500,
    siklusHari: 33,
    status: "dipelihara",
    hariBerjalan: 18,
    kebutuhanModal: 48_000_000,
    modalTerkumpul: 48_000_000,
    minimalTitip: 100_000,
    porsiPemodalPersen: 60,
    pemeriksaan: {
      dokter: "drh. Bayu P. (contoh)",
      klinik: "Praktik Dokter Hewan Mitra Cileunyi (contoh)",
      tanggal: "2026-10-28",
      hasil: "layak",
      poin: [
        "Kandang panggung dengan alas bersih dan tempat minum otomatis.",
        "Biosekuriti pintu masuk tersedia (bak celup kaki).",
      ],
    },
    siklusLalu: { mortalitasPersen: 4.0, bobotPanenKg: 1.85, fcr: 1.58, hariPanen: 33 },
    catatan: buatCatatanContoh(18, 0.98, 1.8, 1500),
  },
  {
    id: "pl-lembang",
    peternak: "Kang Asep R.",
    namaKandang: "Kandang Cikole",
    kecamatan: "Lembang",
    wilayah: "Kab. Bandung Barat",
    lat: -6.8117,
    lng: 107.6175,
    pengalamanTahun: 3,
    jumlahEkor: 800,
    siklusHari: 34,
    status: "dibuka",
    hariBerjalan: null,
    kebutuhanModal: 26_000_000,
    modalTerkumpul: 6_200_000,
    minimalTitip: 100_000,
    porsiPemodalPersen: 55,
    pemeriksaan: {
      dokter: "drh. Rina A. (contoh)",
      klinik: "Klinik Hewan Mitra Bandung Timur (contoh)",
      tanggal: "2026-11-15",
      hasil: "layak-dengan-catatan",
      poin: [
        "Suhu malam di Lembang rendah; pemanas DOC wajib disiapkan hari 1–14.",
        "Catatan harian siklus lalu lengkap 34 dari 34 hari.",
      ],
    },
    siklusLalu: { mortalitasPersen: 4.6, bobotPanenKg: 1.82, fcr: 1.61, hariPanen: 34 },
    catatan: buatCatatanContoh(34, 0.96, 4.6, 800),
  },
  {
    id: "pl-soreang",
    peternak: "Pak Ujang H.",
    namaKandang: "Kandang Barokah",
    kecamatan: "Soreang",
    wilayah: "Kab. Bandung",
    lat: -7.0331,
    lng: 107.5186,
    pengalamanTahun: 2,
    jumlahEkor: 600,
    siklusHari: 32,
    status: "menunggu-pemeriksaan",
    hariBerjalan: null,
    kebutuhanModal: 19_500_000,
    modalTerkumpul: 0,
    minimalTitip: 100_000,
    porsiPemodalPersen: 60,
    pemeriksaan: null,
    siklusLalu: { mortalitasPersen: 5.2, bobotPanenKg: 1.78, fcr: 1.64, hariPanen: 32 },
    catatan: buatCatatanContoh(32, 0.95, 5.2, 600),
  },
  {
    id: "pl-jatinangor",
    peternak: "Teh Nining W.",
    namaKandang: "Kandang Cibeusi",
    kecamatan: "Jatinangor",
    wilayah: "Kab. Sumedang",
    lat: -6.9306,
    lng: 107.772,
    pengalamanTahun: 5,
    jumlahEkor: 1200,
    siklusHari: 33,
    status: "dibuka",
    hariBerjalan: null,
    kebutuhanModal: 38_500_000,
    modalTerkumpul: 30_800_000,
    minimalTitip: 100_000,
    porsiPemodalPersen: 60,
    pemeriksaan: {
      dokter: "drh. Bayu P. (contoh)",
      klinik: "Praktik Dokter Hewan Mitra Cileunyi (contoh)",
      tanggal: "2026-11-10",
      hasil: "layak",
      poin: [
        "Riwayat 3 siklus terakhir tercatat di Ternakin tanpa kasus penyakit menular.",
        "Gudang pakan kering dan tertutup.",
      ],
    },
    siklusLalu: { mortalitasPersen: 2.8, bobotPanenKg: 1.95, fcr: 1.49, hariPanen: 33 },
    catatan: buatCatatanContoh(33, 1.02, 2.8, 1200),
  },
];

export const LOKASI_PILIHAN = [
  { id: "kota-bandung", label: "Kota Bandung", lat: -6.9218, lng: 107.607 },
  { id: "cimahi", label: "Kota Cimahi", lat: -6.8722, lng: 107.5425 },
  { id: "kab-bandung", label: "Kab. Bandung (Soreang)", lat: -7.025, lng: 107.526 },
  { id: "bandung-barat", label: "Kab. Bandung Barat (Ngamprah)", lat: -6.844, lng: 107.505 },
  { id: "sumedang", label: "Kab. Sumedang (Jatinangor)", lat: -6.93, lng: 107.77 },
] as const;

export type LokasiPilihanId = (typeof LOKASI_PILIHAN)[number]["id"];

/** Dokter hewan mitra contoh, tujuan rujukan Kokok saat urgensi tinggi. */
export interface DokterHewanMitra {
  id: string;
  nama: string;
  klinik: string;
  wilayahLayanan: string;
  /** Nomor WhatsApp terverifikasi; kosong selama mitra belum resmi. */
  nomorWa: string;
}

export const DOKTER_HEWAN_MITRA: readonly DokterHewanMitra[] = [
  {
    id: "drh-rina",
    nama: "drh. Rina A. (contoh)",
    klinik: "Klinik Hewan Mitra Bandung Timur (contoh)",
    wilayahLayanan: "Ciparay, Majalaya, Lembang",
    nomorWa: "",
  },
  {
    id: "drh-bayu",
    nama: "drh. Bayu P. (contoh)",
    klinik: "Praktik Dokter Hewan Mitra Cileunyi (contoh)",
    wilayahLayanan: "Cileunyi, Jatinangor, Rancaekek",
    nomorWa: "",
  },
];

export const TEKS_INVESTASI = {
  labelModul: "MODUL 05 · INVESTASI TERNAK",
  labelBaru: "Baru",
  catatanPrototipe:
    "Prototipe. Semua peternak, kandang, dokter hewan, dan angka di halaman ini adalah contoh. Tidak ada uang yang berpindah.",
  ojk: "Di versi rilis, pendanaan berjalan lewat penyelenggara urun dana berizin OJK yang sedang disiapkan. Ternakin tidak menerima atau memegang uang Anda.",
  risiko: [
    "Ayam bisa sakit atau mati sehingga jumlah panen berkurang.",
    "Harga jual ayam hidup saat panen bisa turun di bawah perkiraan.",
    "Bagi hasil dihitung dari laba bersih. Bila siklus merugi, modal yang kembali bisa berkurang, bahkan habis.",
    "Pemeriksaan dokter hewan menilai kesiapan kandang, bukan jaminan hasil.",
  ],
  syaratDibuka: "Setiap peluang baru dibuka setelah kandang diperiksa dokter hewan mitra.",
  pesanWaToko:
    "Halo tim Ternakin, saya pemilik/pengelola toko pakan dan ingin bergabung sebagai toko pakan mitra.",
  pesanWaDokter:
    "Halo tim Ternakin, saya dokter hewan dan tertarik menjadi dokter hewan mitra Ternakin (rujukan Kokok dan pemeriksaan kandang).",
} as const;

export const LANDING_INVESTASI = {
  eyebrow: "BARU · MODUL 05",
  judulUtama: "Titip modal, ayam tumbuh,",
  judulAksen: "hasil dibagi.",
  sub: "Titipkan modal ke peternak ayam pedaging di dekat Anda. Modal jadi ayam, dan Anda menerima bagian laba saat panen.",
  jaminanJujur: [
    {
      id: "uang",
      judul: "Ternakin tidak memegang uang",
      keterangan: "Pendanaan akan berjalan lewat penyelenggara urun dana berizin OJK.",
    },
    {
      id: "data",
      judul: "Bukti dari catatan harian",
      keterangan: "Bobot, pakan, dan kematian ayam ditampilkan atas izin peternak.",
    },
    {
      id: "dokter",
      judul: "Diperiksa dokter hewan mitra",
      keterangan: "Kandang wajib diperiksa sebelum peluang dibuka untuk modal.",
    },
  ],
  catatanRisiko:
    "Investasi ternak berisiko: modal bisa berkurang bila ayam sakit atau harga jual turun. Saat ini masih prototipe; penyelenggara berizin OJK sedang disiapkan.",
  tombolLihat: "Lihat peluang di dekat Anda",
  tombolMasuk: "Coba akun demo",
} as const;
