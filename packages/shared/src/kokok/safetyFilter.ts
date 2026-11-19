import type { UrgensiKokok } from "../schemas/kokok.js";

const POLA_DOSIS_OBAT: readonly RegExp[] = [
  /\bdosis\b/i,
  /\btakaran\b/i,
  /\b\d+(?:[.,]\d+)?\s*(?:mg|ml|cc|gram|gr|g|tetes|tablet|kaplet|kapsul)\s*(?:\/|per)?\s*(?:liter|l|ekor|kg|hari)?\b/i,
  /\b(?:berikan|minumkan|campurkan|suntikkan|injeksikan)\s+(?:antibiotik|obat|enrofloksasin|amoksisilin|doksisiklin|oksitetrasiklin|tylosin|sulfadiazin)\b/i,
  /\b(?:enrofloksasin|amoksisilin|doksisiklin|oksitetrasiklin|ciprofloxacin|tylosin|neomycin|colistin)\b/i,
];

const POLA_DIAGNOSIS_PASTI: readonly RegExp[] = [
  /\bdiagnosis\s+pasti\b/i,
  /\bpasti\s+(?:terkena|sakit|terserang|flu burung|nd|tetelo|ai|snot|crd|koksidiosis|gumboro)\b/i,
  /\bpositif\s+(?:terkena|ai|nd|flu burung|tetelo|snot|crd|koksidiosis)\b/i,
  /\bayam\s+anda\s+(?:pasti|jelas|positif|terdiagnosis)\b/i,
  /\bterdiagnosis\b/i,
];

const POLA_PERMINTAAN_DOSIS_PENGGUNA: readonly RegExp[] = [
  /\b(?:berapa|minta|kasih|resep|aturan)\b.*\b(?:dosis|takaran|ml|mg|cc|antibiotik|obat)\b/i,
  /\b(?:dosis|takaran)\s+(?:obat|antibiotik|vitamin|vaksin)\b/i,
  /\bobat\s+apa\b.*\b(?:berapa|takaran|dosis|gram|ml|mg)\b/i,
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
): HasilFilterKeluaran {
  const gabungan = [alasanUrgensi, ...panduanUmum].join("\n");

  if (POLA_DOSIS_OBAT.some((re) => re.test(gabungan))) {
    return {
      aman: false,
      alasan: "Jawaban mengandung pola dosis atau pemberian obat yang tidak diizinkan.",
    };
  }

  if (POLA_DIAGNOSIS_PASTI.some((re) => re.test(gabungan))) {
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
