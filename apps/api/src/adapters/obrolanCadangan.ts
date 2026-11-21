import { jawabanPenjagaCakupan } from "@ternakin/shared";
import { FAKTA_TERNAKIN } from "../lib/pengetahuanTernakin.js";
import type { ObrolanInput, ObrolanOutput } from "./types.js";

/**
 * Balasan obrolan Kokok TANPA AI. Dipakai bila AI tidak tersedia, gagal, atau jawabannya ditolak
 * filter keselamatan. Tetap menanggapi isi pesan (sapaan, pertanyaan aplikasi, keluhan ayam),
 * bukan satu kalimat yang sama untuk semua pesan.
 */

const POLA_SAPAAN =
  /^\s*(?:halo+|hal+o|hai+|hi+|hey|hei|pagi|siang|sore|malam|selamat\s+(?:pagi|siang|sore|malam)|assalamu'?alaikum|permisi|p|tes|test)\b/i;
const POLA_TERIMA_KASIH = /\b(?:terima\s*kasih|makasih|thanks|thx|nuhun|hatur\s+nuhun)\b/i;
const POLA_KELUHAN =
  /\b(?:ngorok|bersin|batuk|sesak|lesu|lemas|mencret|diare|kotoran|mati|kejang|lumpuh|bengkak|jengger|pial|nafsu\s+makan|telur\s+turun|produksi\s+turun|sakit|pincang|bulu\s+rontok|megap|panas)\b/i;

function estimasiToken(teks: string): number {
  return Math.max(1, Math.ceil(teks.length / 4));
}

function hasil(
  input: ObrolanInput,
  balasan: string,
  aksi: ObrolanOutput["aksi"],
  urgensi: ObrolanOutput["urgensi"] = null,
): ObrolanOutput {
  return {
    balasan,
    aksi,
    urgensi,
    sumber: "mock",
    tokenMasuk: estimasiToken(input.pesan),
    tokenKeluar: estimasiToken(balasan),
  };
}

export function balasObrolanCadangan(input: ObrolanInput): ObrolanOutput {
  const teks = input.pesan.trim();

  switch (input.kategori) {
    case "praktik_berbahaya":
    case "kesehatan_manusia":
    case "keuangan": {
      const j = jawabanPenjagaCakupan(input.kategori);
      return hasil(
        input,
        j.jawaban,
        input.kategori === "keuangan" ? "lihat_investasi" : "tidak_ada",
        input.kategori === "keuangan" ? null : j.urgensi,
      );
    }
    case "minta_obat":
      return hasil(
        input,
        "Kokok tidak boleh menyebut nama obat atau dosis, karena salah obat atau salah takaran bisa membahayakan ayam. Ceritakan gejalanya di Tanya Kokok, nanti Kokok bantu menilai seberapa mendesak dan langkah aman sambil menunggu dokter hewan.",
        "cek_gejala",
      );
    case "minta_diagnosis":
      return hasil(
        input,
        "Kokok tidak bisa memastikan penyakit, karena banyak penyakit ayam gejalanya mirip. Kepastian butuh pemeriksaan dokter hewan. Kokok bisa bantu menilai seberapa mendesak dan memberi langkah aman.",
        "cek_gejala",
      );
    default:
      break;
  }

  if (POLA_SAPAAN.test(teks) && teks.length <= 40) {
    return hasil(
      input,
      "Halo juga! Saya Kokok, asisten peternak di Ternakin. Saya bisa bantu menilai keluhan ayam, menjelaskan cara hitung pakan, atau fitur Ternakin lainnya. Ada yang bisa saya bantu?",
      "tidak_ada",
    );
  }

  if (POLA_TERIMA_KASIH.test(teks)) {
    return hasil(
      input,
      "Sama-sama! Semoga ayamnya sehat selalu. Kalau ada keluhan lain, ceritakan saja ke Kokok.",
      "tidak_ada",
    );
  }

  if (POLA_KELUHAN.test(teks)) {
    return hasil(
      input,
      "Terima kasih sudah bercerita. Supaya Kokok bisa menilai seberapa mendesak keluhan ini dan memberi langkah aman dari pedoman, lanjutkan ke halaman Tanya Kokok; cerita Anda ikut terbawa.",
      "cek_gejala",
    );
  }

  const fakta = FAKTA_TERNAKIN.find((f) => f.kataKunci.test(teks));
  if (fakta) return hasil(input, fakta.isi, fakta.aksi);

  return hasil(
    input,
    "Maaf, Kokok hanya bisa membantu soal kesehatan dan perawatan ayam, serta cara memakai Ternakin. Coba ceritakan keluhan ayam Anda atau tanyakan fitur Ternakin.",
    "tidak_ada",
  );
}
