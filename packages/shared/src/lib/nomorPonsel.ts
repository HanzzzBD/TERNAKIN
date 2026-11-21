/**
 * Normalisasi nomor ponsel Indonesia ke format internasional tanpa tanda plus (628…).
 * Menerima "0812-3456-7890", "+62 812 3456 7890", "62812…", atau "812…".
 * Mengembalikan null bila bukan nomor ponsel Indonesia yang masuk akal (8–13 digit setelah 62).
 */
export function normalisasiNomorPonsel(masukan: string): string | null {
  const digit = masukan.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  if (!/^\d+$/.test(digit)) return null;

  let inti: string;
  if (digit.startsWith("62")) {
    inti = digit.slice(2);
  } else if (digit.startsWith("0")) {
    inti = digit.slice(1);
  } else {
    inti = digit;
  }

  // Nomor seluler Indonesia diawali 8 dan panjangnya 9–12 digit setelah kode negara.
  if (!/^8\d{8,11}$/.test(inti)) return null;
  return `62${inti}`;
}

/** Menyamarkan nomor untuk ditampilkan: 6281234567890 → 0812****7890. */
export function samarkanNomorPonsel(nomor628: string): string {
  const lokal = nomor628.startsWith("62") ? `0${nomor628.slice(2)}` : nomor628;
  if (lokal.length <= 8) return lokal;
  return `${lokal.slice(0, 4)}${"*".repeat(lokal.length - 8)}${lokal.slice(-4)}`;
}
