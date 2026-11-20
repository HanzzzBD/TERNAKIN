/**
 * Alur website Ternakin per peran, ditampilkan di landing page agar pengunjung
 * langsung tahu harus mulai dari mana dan halaman mana yang dibuka berikutnya.
 */

export type IkonAlur =
  | "profil"
  | "pakan"
  | "catatan"
  | "kokok"
  | "toko"
  | "masuk"
  | "peluang"
  | "dokter"
  | "modal"
  | "panen"
  | "whatsapp";

export interface LangkahAlur {
  judul: string;
  keterangan: string;
  ikon: IkonAlur;
  /** Tujuan internal (/app/...) atau "wa:<pesan>" untuk WhatsApp tim. */
  tujuan?: string;
  labelTujuan?: string;
}

export interface JalurAlur {
  id: "peternak" | "pemodal" | "mitra";
  tab: string;
  ringkas: string;
  langkah: readonly LangkahAlur[];
  ajakan: { label: string; tujuan: string };
}

export const LANDING_ALUR = {
  eyebrow: "ALUR TERNAKIN",
  judulUtama: "Mulai dari peran",
  judulAksen: "Anda.",
  sub: "Pilih siapa Anda, lalu ikuti langkahnya. Setiap langkah langsung membuka halaman yang dimaksud.",
  sapaanKokok: "Bingung mulai dari mana? Pilih peran dulu, nanti saya tunjukkan jalannya.",
  jalur: [
    {
      id: "peternak",
      tab: "Saya peternak",
      ringkas: "Hemat biaya pakan, catat kandang, dan dapat bantuan saat ayam bermasalah.",
      langkah: [
        {
          judul: "Isi profil kandang",
          keterangan: "Jenis ayam, umur, dan jumlah ekor.",
          ikon: "profil",
          tujuan: "/app/profil",
          labelTujuan: "Buka Profil",
        },
        {
          judul: "Hitung pakan termurah",
          keterangan: "Tulis bahan dan harga, dapat campuran yang cukup gizi.",
          ikon: "pakan",
          tujuan: "/app/pakan",
          labelTujuan: "Buka Pakan",
        },
        {
          judul: "Beli di toko mitra",
          keterangan: "Bandingkan total biaya toko terdekat, hubungi lewat WhatsApp.",
          ikon: "toko",
          tujuan: "/app/toko",
          labelTujuan: "Buka Toko",
        },
        {
          judul: "Catat kandang tiap hari",
          keterangan: "Pakan, telur atau bobot, ayam mati, suhu. Bisa tanpa sinyal.",
          ikon: "catatan",
          tujuan: "/app/catatan",
          labelTujuan: "Buka Catatan",
        },
        {
          judul: "Tanya Kokok saat ayam sakit",
          keterangan: "Cek urgensi; bila tinggi, dirujuk ke dokter hewan mitra.",
          ikon: "kokok",
          tujuan: "/app/tanya",
          labelTujuan: "Buka Kokok",
        },
        {
          judul: "Ajukan peluang modal",
          keterangan: "Untuk ayam pedaging, setelah kandang diperiksa dokter hewan.",
          ikon: "modal",
          tujuan: "/app/masuk?peran=peternak",
          labelTujuan: "Masuk peternak",
        },
      ],
      ajakan: { label: "Mulai hitung pakan", tujuan: "/app/pakan" },
    },
    {
      id: "pemodal",
      tab: "Saya ingin titip modal",
      ringkas:
        "Titipkan modal ke peternak ayam pedaging di dekat Anda, terima bagi hasil saat panen.",
      langkah: [
        {
          judul: "Masuk sebagai pengguna",
          keterangan: "Untuk sekarang pakai akun demo.",
          ikon: "masuk",
          tujuan: "/app/masuk?peran=pengguna",
          labelTujuan: "Masuk",
        },
        {
          judul: "Lihat peluang terdekat",
          keterangan: "Kandang diurutkan dari yang paling dekat dengan Anda.",
          ikon: "peluang",
          tujuan: "/app/investasi",
          labelTujuan: "Buka Investasi",
        },
        {
          judul: "Periksa kandangnya",
          keterangan: "Data catatan harian dan hasil pemeriksaan dokter hewan mitra.",
          ikon: "dokter",
          tujuan: "/app/investasi/pl-ciparay",
          labelTujuan: "Lihat contoh",
        },
        {
          judul: "Titip modal lewat mitra OJK",
          keterangan: "Ternakin tidak memegang uang. Prototipe: baru mencatat minat.",
          ikon: "modal",
        },
        {
          judul: "Pantau sampai panen",
          keterangan: "Lihat ayam tumbuh, lalu terima bagian laba saat ayam dijual.",
          ikon: "panen",
        },
      ],
      ajakan: { label: "Lihat peluang di dekat Anda", tujuan: "/app/investasi" },
    },
    {
      id: "mitra",
      tab: "Saya mitra",
      ringkas: "Toko pakan dan dokter hewan bergabung lewat WhatsApp, dibantu langsung oleh tim.",
      langkah: [
        {
          judul: "Hubungi tim lewat WhatsApp",
          keterangan: "Sebutkan Anda toko pakan atau dokter hewan.",
          ikon: "whatsapp",
          tujuan:
            "wa:Halo tim Ternakin, saya ingin bergabung sebagai mitra (toko pakan / dokter hewan).",
          labelTujuan: "Buka WhatsApp",
        },
        {
          judul: "Toko: kirim harga tiap minggu",
          keterangan: "Tampil di daftar toko dan dapat pembeli lewat tautan atau QR.",
          ikon: "toko",
        },
        {
          judul: "Dokter hewan: terima rujukan Kokok",
          keterangan: "Peternak dengan kasus urgensi tinggi menghubungi Anda langsung.",
          ikon: "kokok",
        },
        {
          judul: "Dokter hewan: periksa kandang",
          keterangan: "Peluang modal baru dibuka setelah kandang Anda periksa.",
          ikon: "dokter",
        },
      ],
      ajakan: {
        label: "Gabung lewat WhatsApp",
        tujuan:
          "wa:Halo tim Ternakin, saya ingin bergabung sebagai mitra (toko pakan / dokter hewan).",
      },
    },
  ] satisfies readonly JalurAlur[],
} as const;
