import { bacaAkunLokal, setelAkunLokal } from "./akunCache";

/**
 * Semua fitur wajib masuk: bila API aplikasi menjawab 401 (sesi di server berakhir atau dicabut),
 * salinan status masuk lokal dihapus sehingga penjaga rute membawa pengguna ke halaman Masuk.
 * Dipasang sekali di main.tsx agar setiap pemanggil /v1 (pakan, catatan, sinkron, toko, investasi,
 * Kokok) tertangani tanpa mengubah masing-masing.
 *
 * Galat jaringan (offline) bukan 401, jadi pengguna tetap masuk dan bisa bekerja tanpa sinyal.
 * Rute /v1/auth/* dikecualikan karena 401 di sana adalah jawaban normal proses masuk.
 */
export function apakahSesiBerakhir(url: string, status: number, asal: string): boolean {
  if (status !== 401) return false;
  let alamat: URL;
  try {
    alamat = new URL(url, asal);
  } catch {
    return false;
  }
  return (
    alamat.origin === new URL(asal).origin &&
    alamat.pathname.startsWith("/v1/") &&
    !alamat.pathname.startsWith("/v1/auth/")
  );
}

function urlDari(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

export function pasangPenjagaSesi(): void {
  const fetchAsli = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const res = await fetchAsli(input, init);
    if (bacaAkunLokal() && apakahSesiBerakhir(urlDari(input), res.status, window.location.href)) {
      setelAkunLokal(null);
    }
    return res;
  };
}
