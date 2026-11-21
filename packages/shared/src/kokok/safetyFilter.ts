import type { UrgensiKokok } from "../schemas/kokok.js";

/**
 * Kalimat yang MEMBERI dosis/takaran ("dosisnya cukup…", "takaran yang tepat adalah…").
 * Menyebut kata dosis untuk menolak atau menjelaskan bahaya ("salah takaran bisa membahayakan")
 * tidak dianggap pelanggaran. Dicek di luar kalimat penolakan.
 */
const POLA_KATA_DOSIS: readonly RegExp[] = [
  /\b(?:dosis|takaran)\w*\s+(?:yang\s+)?(?:adalah|cukup|sebanyak|yaitu|ialah|kira-kira|sekitar|tepat|dianjurkan|disarankan|aman)\b/i,
  /\b(?:dosis|takaran)\w*\s*:/i,
];

/** Obat spesifik, angka takaran, dan merek: selalu ditolak, juga di dalam kalimat larangan. */
const POLA_DOSIS_OBAT: readonly RegExp[] = [
  /\b\d+(?:[.,]\d+)?\s*(?:mg|ml|cc|gram|gr|g|tetes|tablet|kaplet|kapsul)\s*(?:\/|per)?\s*(?:liter|l|ekor|kg|hari)?\b/i,
  /\b(?:berikan|minumkan|campurkan|suntikkan|injeksikan)\s+(?:antibiotik|obat|enrofloksasin|amoksisilin|doksisiklin|oksitetrasiklin|tylosin|sulfadiazin)\b/i,
  /\b(?:enrofloksasin|enrofloxacin|amoksisilin|amoxicillin|doksisiklin|doxycycline|oksitetrasiklin|oxytetracycline|ciprofloxacin|tylosin|neomycin|colistin|trimethoprim|sulfa\w*|eritromisin|erythromycin|tetrasiklin|tetracycline|ivermectin|amprolium|toltrazuril)\b/i,
  // Nama galur/merek vaksin tertentu = rekomendasi produk; serahkan ke dokter hewan.
  /\b(?:la\s?sota|hitchner|ma-?5|clone\s?30|ibd\s+blen|bursa\s?plex)\b/i,
];

/** Saran berbahaya yang tidak boleh keluar dari Kokok. */
const POLA_SARAN_BERBAHAYA: readonly RegExp[] = [
  /\b(?:aman|boleh|bisa)\s+(?:dimakan|dikonsumsi|dimasak|dijual)\b/i,
  /\b(?:jual|potong|sembelih)\s+(?:saja|aja|segera)\b/i,
  /\b(?:di|mem)?buang\b.{0,20}\b(?:ke|di)\s+(?:sungai|kali|selokan|got)\b/i,
  /\b(?:tidak\s+perlu|tak\s+perlu|ga\s+perlu|gak\s+perlu)\s+(?:lapor|melapor|ke\s+dokter|diperiksa)\b/i,
];

/** Janji keuntungan: Kokok tidak memberi saran keuangan. */
const POLA_JANJI_KEUANGAN: readonly RegExp[] = [
  /\b(?:pasti|dijamin|jaminan)\s+(?:untung|cuan|balik\s+modal|aman)\b/i,
  /\b(?:untung|keuntungan|imbal\s+hasil)\s+(?:pasti|dijamin|besar|tinggi)\b/i,
];

const POLA_DIAGNOSIS_PASTI: readonly RegExp[] = [
  /\bdiagnosis\s+pasti\b/i,
  /\bpasti\s+(?:terkena|sakit|terserang|flu burung|nd|tetelo|ai|snot|crd|koksidiosis|gumboro)\b/i,
  /\bpositif\s+(?:terkena|ai|nd|flu burung|tetelo|snot|crd|koksidiosis)\b/i,
  /\bayam\s+anda\s+(?:pasti|jelas|positif|terdiagnosis)\b/i,
  /\bterdiagnosis\b/i,
];

const POLA_PERMINTAAN_DOSIS_PENGGUNA: readonly RegExp[] = [
  // \w* agar bentuk berakhiran -nya/-kan ikut tertangkap ("dosisnya", "obatnya").
  /\b(?:berapa|minta|kasih|resep|aturan)\b.*\b(?:dosis\w*|takaran\w*|ml|mg|cc|antibiotik\w*|obat\w*)\b/i,
  /\b(?:dosis|takaran)\w*\s+(?:obat|antibiotik|vitamin|vaksin)\b/i,
  /\bobat\w*\s+apa\b/i,
  /\b(?:obat|antibiotik)\w*\s+(?:yang\s+)?(?:cocok|ampuh|bagus|manjur|tepat)\b/i,
];

const POLA_PERMINTAAN_DIAGNOSIS_PENGGUNA: readonly RegExp[] = [
  /\b(?:apakah\s+ini\s+pasti|pastikan\s+penyakit|diagnosis\s+pasti|vonis\s+penyakit)\b/i,
  /\bpenyakit\s+apa\s+pastinya\b/i,
];

export interface HasilDeteksiInput {
  mintaDosis: boolean;
  mintaDiagnosis: boolean;
}

export function detectUnsafeUserAsk(teksPengguna: string): HasilDeteksiInput {
  return {
    mintaDosis: POLA_PERMINTAAN_DOSIS_PENGGUNA.some((re) => re.test(teksPengguna)),
    mintaDiagnosis: POLA_PERMINTAAN_DIAGNOSIS_PENGGUNA.some((re) => re.test(teksPengguna)),
  };
}

export interface HasilFilterKeluaran {
  aman: boolean;
  alasan?: string;
}

export function checkKokokOutputSafety(
  alasanUrgensi: string,
  panduanUmum: readonly string[],
  jawaban = "",
): HasilFilterKeluaran {
  const gabungan = [jawaban, alasanUrgensi, ...panduanUmum].join("\n");
  // Larangan ("Jangan buang bangkai ke sungai", "Tidak ada jaminan pasti untung") justru aman:
  // buang bagian kalimat yang diawali kata larangan sebelum mencari saran berbahaya.
  const tanpaLarangan = gabungan.replace(
    // Berhenti di koma juga, agar "Jangan khawatir, ayam sakit aman dimakan" tetap tertangkap.
    /\b(?:jangan|dilarang|tidak\s+boleh|hindari|tidak\s+ada)\b[^.,;\n]*/gi,
    "",
  );

  // Penolakan ("Kokok tidak bisa memberi dosis/diagnosis pasti") adalah jawaban yang benar.
  const tanpaPenolakan = gabungan.replace(
    /\b(?:jangan|dilarang|tidak\s+(?:boleh|bisa|dapat|akan|memberi|menyebut|mau)|tak\s+bisa|bukan|tanpa)\b[^.,;\n]*/gi,
    "",
  );

  if (POLA_SARAN_BERBAHAYA.some((re) => re.test(tanpaLarangan))) {
    return {
      aman: false,
      alasan: "Jawaban mengandung saran berbahaya bagi kesehatan ayam atau manusia.",
    };
  }

  if (POLA_JANJI_KEUANGAN.some((re) => re.test(tanpaLarangan))) {
    return { aman: false, alasan: "Jawaban mengandung janji keuntungan yang tidak diizinkan." };
  }

  if (
    POLA_DOSIS_OBAT.some((re) => re.test(gabungan)) ||
    POLA_KATA_DOSIS.some((re) => re.test(tanpaPenolakan))
  ) {
    return {
      aman: false,
      alasan: "Jawaban mengandung pola dosis atau pemberian obat yang tidak diizinkan.",
    };
  }

  if (POLA_DIAGNOSIS_PASTI.some((re) => re.test(tanpaPenolakan))) {
    return {
      aman: false,
      alasan: "Jawaban mengandung pernyataan diagnosis pasti yang tidak diizinkan.",
    };
  }

  return { aman: true };
}

export function tujuanRujukanUntukUrgensi(urgensi: UrgensiKokok): string | null {
  if (urgensi === "tinggi") {
    return "Segera hubungi dokter hewan atau dinas peternakan / puskeswan terdekat.";
  }
  if (urgensi === "sedang") {
    return "Hubungi penyuluh peternakan atau puskeswan untuk pemeriksaan lebih lanjut.";
  }
  return null;
}

export function jawabanCadanganAman(
  urgensi: UrgensiKokok,
  alasanPenolakan: string,
): {
  urgensi: UrgensiKokok;
  alasanUrgensi: string;
  tujuanRujukan: string | null;
  panduanUmum: string[];
  catatanFilter: string;
} {
  const urgensiEfektif: UrgensiKokok = urgensi === "rendah" ? "sedang" : urgensi;
  const rujukan = tujuanRujukanUntukUrgensi(urgensiEfektif);

  return {
    urgensi: urgensiEfektif,
    alasanUrgensi:
      "Kokok tidak dapat menentukan penyakit secara pasti maupun memberi aturan pengobatan. Gejala beberapa penyakit unggas sangat mirip sehingga pemeriksaan dan pengobatan perlu ditentukan langsung oleh tenaga ahli.",
    tujuanRujukan: rujukan,
    panduanUmum: [
      "Pisahkan ayam yang tampak sakit ke kandang karantina agar tidak menular ke ayam lain.",
      "Catat jumlah ayam sakit, ayam mati, penurunan pakan/telur, dan waktu mulai muncul gejala.",
      "Tingkatkan kebersihan tempat minum, tempat pakan, dan batasi keluar-masuk orang ke kandang.",
      "Bagikan ringkasan kasus di bawah ini kepada dokter hewan, puskeswan, atau penyuluh setempat untuk penentuan pemeriksaan dan penanganan obat.",
    ],
    catatanFilter: alasanPenolakan,
  };
}
