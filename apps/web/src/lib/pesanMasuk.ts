/**
 * Pesan sekali tampil untuk halaman Masuk. Dipakai bila sebuah aksi mengakhiri sesi (mis. hapus akun)
 * sehingga penjaga rute langsung membawa pengguna ke halaman Masuk sebelum pesan sempat terlihat.
 */
const KUNCI = "tk.pesanMasuk";

export function simpanPesanMasuk(pesan: string): void {
  try {
    window.sessionStorage.setItem(KUNCI, pesan);
  } catch {
    // sessionStorage tidak tersedia: pesan dilewati, alur tetap berjalan
  }
}

/** Mengambil pesan lalu menghapusnya agar hanya tampil sekali. */
export function ambilPesanMasuk(): string | null {
  try {
    const pesan = window.sessionStorage.getItem(KUNCI);
    if (pesan) window.sessionStorage.removeItem(KUNCI);
    return pesan;
  } catch {
    return null;
  }
}
