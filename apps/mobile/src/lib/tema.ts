/**
 * Token desain aplikasi mobile.
 * Gaya: latar krem hangat, kartu putih bersudut besar, aksen peach-oranye, elemen gelap pekat
 * untuk tombol utama dan bilah tab. Hijau hanya dipakai untuk status "aman/tersinkron".
 */
export const warna = {
  putih: "#ffffff",
  krem: "#f3eee8",
  kremTua: "#e7e1d9",
  kremGaris: "#ddd6cc",
  tinta: "#1f1d1b",
  tintaRedup: "#7a736c",
  gelap: "#262422",
  gelapLembut: "#3a3734",
  aksen: "#f7955c",
  aksenLembut: "#fde3d2",
  /** Oranye gelap untuk teks kecil di atas putih/krem agar kontras tetap terbaca. */
  aksenTeks: "#b9541a",
  hijau: "#2f7a47",
  hijauLembut: "#e1f0e3",
  kuningLembut: "#fbecc4",
  bahaya: "#b42318",
  bahayaLembut: "#fbe9e7",
  garis: "#e6e0d8",
} as const;

export const jarak = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

export const sudut = { s: 10, m: 16, l: 22, xl: 28, bulat: 999 } as const;

/** Ukuran teks dibuat besar: pengguna utama peternak dengan HP Android murah, sering di luar ruangan. */
export const huruf = { kecil: 14, isi: 16, sub: 18, judul: 26, besar: 34, raksasa: 44 } as const;

/** Bayangan lembut kartu (elevation untuk Android, shadow untuk iOS/web). */
export const bayangan = {
  shadowColor: "#5b4636",
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;
