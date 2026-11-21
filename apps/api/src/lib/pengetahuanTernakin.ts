/**
 * Fakta produk Ternakin yang boleh dipakai Kokok saat mengobrol (selaras dengan FAQ landing page
 * dan PRD). Kokok tidak boleh mengarang fitur atau angka di luar daftar ini.
 */

export interface FaktaTernakin {
  id: string;
  /** Kata kunci untuk jawaban cadangan tanpa AI. */
  kataKunci: RegExp;
  isi: string;
  aksi: "cek_gejala" | "hitung_pakan" | "lihat_investasi" | "hubungi_tim" | "tidak_ada";
}

export const FAKTA_TERNAKIN: readonly FaktaTernakin[] = [
  {
    id: "apa",
    kataKunci: /\b(?:ternakin\s+(?:itu\s+)?apa|apa\s+itu\s+ternakin|aplikasi\s+apa|fitur)\b/i,
    isi: "Ternakin adalah asisten digital untuk peternak ayam: hitung campuran pakan termurah yang gizinya cukup, catatan harian kandang, tanya Kokok soal kesehatan ayam, rujukan toko pakan mitra, dan (prototipe) peluang titip modal ke peternak.",
    aksi: "tidak_ada",
  },
  {
    id: "siapa",
    kataKunci: /\b(?:untuk\s+siapa|cocok\s+untuk|siapa\s+saja)\b/i,
    isi: "Untuk peternak ayam petelur mandiri skala kecil, dimulai dari Bandung Raya. Peternak plasma tetap bisa memakai catatan harian dan tanya Kokok, tetapi modul pakan dan toko untuk peternak mandiri. Ada juga peran Pengguna untuk yang ingin bertanya ke Kokok dan mencoba titip modal.",
    aksi: "tidak_ada",
  },
  {
    id: "pakan",
    kataKunci: /\b(?:pakan|ransum|campuran|hitung)\b/i,
    isi: 'Di menu Pakan, tulis bahan dan harganya (boleh teks bebas seperti "jagung 6.500, dedak 4.000"), lalu Ternakin menghitung campuran termurah yang memenuhi gizi SNI. Hasil per 100 kg dan angkanya dari perhitungan, bukan tebakan AI.',
    aksi: "hitung_pakan",
  },
  {
    id: "bayar",
    kataKunci: /\b(?:bayar|biaya|gratis|harga\s+aplikasi|berbayar|langganan)\b/i,
    isi: "Gratis untuk peternak. Pendapatan Ternakin datang dari toko pakan mitra.",
    aksi: "tidak_ada",
  },
  {
    id: "sinyal",
    kataKunci: /\b(?:sinyal|offline|internet|kuota|tanpa\s+jaringan)\b/i,
    isi: "Catatan harian tersimpan di ponsel dan terkirim saat tersambung. Hitung pakan tetap jalan tanpa sinyal; membaca teks bebas dan bertanya ke Kokok butuh sinyal.",
    aksi: "tidak_ada",
  },
  {
    id: "obat",
    kataKunci: /\b(?:obat|dosis|resep|antibiotik|vaksin)\b/i,
    isi: "Kokok tidak memberi nama obat, dosis, atau diagnosis pasti, karena gejala beberapa penyakit unggas mirip. Kokok menilai urgensi, memberi langkah aman, dan merujuk ke dokter hewan atau puskeswan.",
    aksi: "cek_gejala",
  },
  {
    id: "investasi",
    kataKunci: /\b(?:investasi|titip\s+modal|modal|pemodal)\b/i,
    isi: "Fitur titip modal ke peternak ayam pedaging masih prototipe/simulasi: belum ada uang yang berpindah dan Ternakin tidak memegang uang. Di versi rilis pendanaan lewat penyelenggara urun dana berizin OJK. Risikonya: ayam bisa sakit atau mati dan harga bisa turun, jadi modal bisa berkurang bahkan habis.",
    aksi: "lihat_investasi",
  },
  {
    id: "unduh",
    kataKunci: /\b(?:unduh|download|install|pasang|play\s*store|app\s*store)\b/i,
    isi: "Tidak perlu unduh dari Play Store. Pasang dari peramban ke layar utama; di iPhone lewat Bagikan lalu Tambah ke Layar Utama.",
    aksi: "tidak_ada",
  },
  {
    id: "tim",
    kataKunci: /\b(?:tim|admin|cs|hubungi|kontak|whatsapp|wa)\b/i,
    isi: "Tim Ternakin bisa dihubungi lewat WhatsApp dari tombol yang Kokok berikan.",
    aksi: "hubungi_tim",
  },
];

export function teksPengetahuan(): string {
  return FAKTA_TERNAKIN.map((f) => `- ${f.isi}`).join("\n");
}
