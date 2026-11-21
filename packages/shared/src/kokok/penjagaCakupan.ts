import type { UrgensiKokok } from "../schemas/kokok.js";

/**
 * Penjaga cakupan Kokok (dijalankan SEBELUM memanggil AI).
 *
 * Tujuan Kokok menurut PRD/SDD: triase kesehatan dan perawatan ayam (dan unggas peliharaan)
 * berdasarkan panduan terkurasi, lalu merujuk ke ahli. Yang BOLEH dan JANGAN:
 *
 * BOLEH: menilai urgensi gejala ayam, langkah aman (isolasi, sanitasi, ventilasi, pencatatan),
 *        merujuk ke dokter hewan/puskeswan/penyuluh, menjelaskan biosekuriti dan perawatan dasar.
 * JANGAN: dosis/merek obat & diagnosis pasti (lihat safetyFilter), saran keuangan/investasi,
 *         keluhan kesehatan manusia, praktik berbahaya (menjual/mengonsumsi ayam sakit,
 *         membuang bangkai sembarangan, menyembunyikan wabah), dan topik di luar peternakan.
 */
export type KategoriCakupan =
  "boleh" | "praktik_berbahaya" | "kesehatan_manusia" | "keuangan" | "di_luar_topik";

const POLA_PRAKTIK_BERBAHAYA: readonly RegExp[] = [
  /\b(?:jual|dijual|menjual|lepas)\b.{0,30}\b(?:ayam|unggas|daging|telur|bangkai)\b.{0,20}\b(?:sakit|mati|bangkai)\b/i,
  /\b(?:ayam|unggas|daging)\b.{0,15}\b(?:sakit|mati)\b.{0,30}\b(?:dijual|jual|dimasak|dimakan|dikonsumsi|dipotong|disembelih)\b/i,
  /\b(?:makan|masak|konsumsi|potong|sembelih)\b.{0,20}\b(?:ayam|unggas|bangkai)\b.{0,15}\b(?:sakit|mati|bangkai)\b/i,
  /\b(?:buang|membuang|dibuang)\b.{0,20}\bbangkai\b.{0,30}\b(?:sungai|kali|selokan|got|jalan|sawah|kebun|tempat sampah)\b/i,
  /\bbangkai\b.{0,30}\b(?:dibuang|buang)\b.{0,20}\b(?:sungai|kali|selokan|got|jalan|sawah)\b/i,
  /\b(?:sembunyikan|rahasiakan|tutupi|jangan\s+lapor|tidak\s+usah\s+lapor|gak\s+usah\s+lapor|ga\s+usah\s+lapor)\b.{0,30}\b(?:wabah|kematian|penyakit|kasus|dinas)\b/i,
];

/**
 * Keluhan pada manusia: subjek manusia langsung diikuti gejala manusia.
 * Sengaja tidak menangkap "ayam saya lemas" (lookbehind kata unggas) dan kata ambigu (sakit, lemas).
 */
const POLA_KESEHATAN_MANUSIA: readonly RegExp[] = [
  /(?<!\b(?:ayam|unggas|bebek|itik|burung|puyuh|entok)\s)\b(?:saya|aku|anak\s+saya|istri\s+saya|suami\s+saya|keluarga\s+saya|pekerja(?:\s+kandang)?|karyawan|tetangga)\s+(?:(?:juga|jadi|merasa|ikut|kena|terkena|sedang|lagi|mulai)\s+)*(?:demam|sesak|batuk|pilek|pusing|mual|muntah|diare|gatal|ruam|meriang)\b/i,
  /\b(?:tertular|menular\s+ke\s+(?:manusia|orang|saya|anak))\b/i,
  /\bflu\s+burung\b.{0,20}\b(?:manusia|orang)\b/i,
];

/** Gejala/keluhan ayam: bila ada, pertanyaan tetap dijawab walau menyinggung keuangan. */
const POLA_GEJALA_AYAM =
  /\b(?:ngorok|bersin|batuk|sesak|lesu|lemas|mencret|diare|kotoran|mati|kejang|lumpuh|bengkak|jengger|pial|tidak\s+mau\s+makan|nafsu\s+makan|telur\s+turun|produksi\s+turun|demam|sakit)\b/i;

const POLA_KEUANGAN: readonly RegExp[] = [
  /\b(?:investasi|invest|saham|reksadana|kripto|crypto|pinjaman|pinjol|kredit|cicilan)\b/i,
  /\b(?:untung|keuntungan|cuan|imbal\s+hasil|return|roi|bagi\s+hasil|balik\s+modal|profit)\b.{0,30}\b(?:berapa|pasti|aman|dijamin|jamin|besar)\b/i,
  /\b(?:berapa|pasti|aman|dijamin)\b.{0,30}\b(?:untung|keuntungan|cuan|imbal\s+hasil|return|bagi\s+hasil)\b/i,
  /\b(?:titip|tanam)\s+modal\b/i,
];

/** Kata yang menandakan pertanyaan masih soal unggas/peternakan. */
const POLA_DOMAIN =
  // Akhiran -nya/-ku/-mu ikut diterima ("telurnya", "ayamku", "pakannya").
  /\b(?:ayam|unggas|itik|bebek|entok|mentok|puyuh|merpati|burung|angsa|kalkun|doc|pullet|broiler|layer|petelur|pedaging|kampung|jago|babon|ternak|peternak|peternakan|kandang|telur|kerabang|cangkang|pakan|ransum|konsentrat|jagung|dedak|bekatul|bungkil|premix|jamur|jamuran|aflatoksin|jengger|pial|bulu|paruh|ceker|kotoran|tahi|mencret|ngorok|bersin|lesu|lemas|bangkai|vaksin|vaksinasi|biosekuriti|litter|sekam|tetelo|gumboro|koksi|snot|crd|flu\s+burung|mareks|cacing|cacingan|kutu|tungau|lumpuh|kejang|ekor|mati\s+mendadak|brooding|brooder|molting|mengeram|menetas|fcr|hdp)(?:nya|ku|mu)?\b/i;

export interface HasilCakupan {
  kategori: KategoriCakupan;
}

export function periksaCakupanPertanyaan(teks: string): HasilCakupan {
  const t = teks.toLowerCase();
  if (POLA_PRAKTIK_BERBAHAYA.some((re) => re.test(t))) return { kategori: "praktik_berbahaya" };
  if (POLA_KESEHATAN_MANUSIA.some((re) => re.test(t))) return { kategori: "kesehatan_manusia" };
  if (POLA_KEUANGAN.some((re) => re.test(t)) && !POLA_GEJALA_AYAM.test(t)) {
    return { kategori: "keuangan" };
  }
  if (!POLA_DOMAIN.test(t)) return { kategori: "di_luar_topik" };
  return { kategori: "boleh" };
}

export interface JawabanPenjaga {
  urgensi: UrgensiKokok;
  jawaban: string;
  alasanUrgensi: string;
  panduanUmum: string[];
  catatanFilter: string;
}

/** Jawaban tetap (tanpa AI) untuk pertanyaan di luar cakupan atau berbahaya. */
export function jawabanPenjagaCakupan(kategori: Exclude<KategoriCakupan, "boleh">): JawabanPenjaga {
  switch (kategori) {
    case "praktik_berbahaya":
      return {
        urgensi: "tinggi",
        jawaban:
          "Mohon jangan menjual, memotong, memasak, atau membuang sembarangan ayam yang sakit atau mati. Penyakit unggas seperti flu burung bisa menular ke ayam lain dan ke manusia. Kematian yang tidak biasa juga perlu dilaporkan, bukan disembunyikan.",
        alasanUrgensi:
          "Ayam sakit atau mati yang dijual, dikonsumsi, atau dibuang sembarangan dapat menyebarkan penyakit ke kandang lain dan ke manusia.",
        panduanUmum: [
          "Jangan jual, potong, masak, atau berikan ayam sakit/mati kepada orang lain.",
          "Kubur bangkai minimal 1 meter atau bakar di lokasi kandang; pakai sarung tangan dan masker, lalu cuci tangan dengan sabun.",
          "Jangan buang bangkai ke sungai, selokan, kebun, atau tempat sampah umum.",
          "Laporkan kematian yang tidak biasa ke dinas peternakan atau puskeswan setempat dalam 24 jam.",
        ],
        catatanFilter:
          "Pertanyaan menyangkut praktik berbahaya; dijawab dengan langkah aman bawaan.",
      };
    case "kesehatan_manusia":
      return {
        urgensi: "tinggi",
        jawaban:
          "Kokok hanya membantu soal kesehatan ayam, jadi tidak bisa menilai keluhan pada manusia. Bila Anda atau orang di sekitar demam, batuk, atau sesak setelah menangani unggas yang sakit atau mati, segera periksa ke Puskesmas atau fasilitas kesehatan terdekat dan sampaikan riwayat kontak dengan unggas.",
        alasanUrgensi:
          "Gejala pada manusia setelah kontak dengan unggas sakit perlu diperiksa tenaga kesehatan, bukan oleh Kokok.",
        panduanUmum: [
          "Segera periksa ke Puskesmas, klinik, atau rumah sakit terdekat.",
          "Ceritakan kepada petugas kesehatan bahwa Anda menangani unggas sakit atau mati.",
          "Sementara itu, pakai masker dan sarung tangan bila harus masuk kandang, dan cuci tangan dengan sabun.",
          "Laporkan kondisi ayam ke dinas peternakan atau puskeswan setempat.",
        ],
        catatanFilter: "Pertanyaan tentang kesehatan manusia; dirujuk ke fasilitas kesehatan.",
      };
    case "keuangan":
      return {
        urgensi: "rendah",
        jawaban:
          "Kokok khusus membantu soal kesehatan dan perawatan ayam, jadi tidak memberi saran keuangan, investasi, atau perkiraan keuntungan. Fitur titip modal di Ternakin masih berupa simulasi; untuk keputusan keuangan, baca risiko di halaman Investasi dan konsultasikan dengan penasihat atau penyelenggara berizin OJK.",
        alasanUrgensi: "Pertanyaan keuangan berada di luar cakupan Kokok.",
        panduanUmum: [
          "Baca bagian 'Risiko yang perlu Anda pahami' di halaman detail peluang investasi.",
          "Tidak ada keuntungan yang dijamin dalam usaha ternak; ayam bisa sakit dan harga bisa turun.",
          "Bila ingin bertanya soal kesehatan ayam peliharaan, ceritakan gejalanya kepada Kokok.",
        ],
        catatanFilter: "Pertanyaan keuangan/investasi; Kokok tidak memberi saran keuangan.",
      };
    case "di_luar_topik":
      return {
        urgensi: "rendah",
        jawaban:
          'Maaf, Kokok hanya bisa membantu soal kesehatan dan perawatan ayam atau unggas. Coba ceritakan gejala ayam Anda, misalnya "ayam lesu dan tidak mau makan sejak kemarin".',
        alasanUrgensi: "Pertanyaan tidak berkaitan dengan kesehatan atau perawatan unggas.",
        panduanUmum: [
          "Sebutkan gejala yang terlihat: perilaku, napas, kotoran, nafsu makan, atau produksi telur.",
          "Tambahkan sejak kapan gejala muncul dan berapa ekor yang terdampak.",
        ],
        catatanFilter: "Pertanyaan di luar cakupan Kokok.",
      };
  }
}
