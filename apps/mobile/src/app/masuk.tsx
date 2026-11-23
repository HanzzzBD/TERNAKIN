import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  kodeEmailResponseSchema,
  mintaOtpResponseSchema,
  normalisasiNomorPonsel,
  PANJANG_KODE_OTP,
  type KodeEmailResponse,
  type KonfigurasiAuthResponse,
  type PeranAkun,
  type SesiAkunResponse,
} from "@ternakin/shared";
import { Info, MasukanKode, Pemisah, PilihanPeran, TautanTeks, useHitungMundur } from "@/components/MasukUi";
import { Kartu, KepalaLayar, Layar, Masukan, PesanGalat, Teks, Tombol, TombolIkon } from "@/components/ui";
import {
  AKUN_DEMO_TAMPIL,
  DOMAIN_DEMO,
  LABEL_PERAN,
  ambilTokenGoogle,
  googleTersedia,
  useKonfigurasiAuth,
} from "@/lib/akun";
import { GalatApi, panggilApi, pesanGalat } from "@/lib/api";
import { useDataKandang } from "@/lib/kandang";
import { useSesi } from "@/lib/sesi";
import { bayangan, huruf, jarak, sudut, warna } from "@/lib/tema";

const PESAN_ADA_DATA_TAMU =
  "HP ini sudah berisi data kandang Anda. Akun demo dipakai bersama, jadi agar data Anda tidak tercampur, daftar atau masuklah dengan akun Anda sendiri.";

const INFO_PERAN: Record<PeranAkun, readonly string[]> = {
  pengguna: [
    "Lihat peluang di peternak terdekat",
    "Periksa data kandang dan hasil dokter hewan",
    "Coba catat minat titip modal",
    "Tanya Kokok soal ayam peliharaan",
  ],
  peternak: [
    "Hitung pakan, catatan harian, dan toko",
    "Atur izin data catatan harian",
    "Pantau peluang kandang Anda",
    "Ajukan peluang siklus berikutnya",
  ],
};

const MITRA = [
  {
    judul: "Toko pakan mitra",
    ikon: "storefront-outline",
    pesan: "Halo tim Ternakin, saya pemilik/pengelola toko pakan dan ingin bergabung sebagai toko pakan mitra.",
  },
  {
    judul: "Dokter hewan mitra",
    ikon: "medkit-outline",
    pesan: "Halo tim Ternakin, saya dokter hewan dan tertarik menjadi dokter hewan mitra Ternakin (rujukan Kokok dan pemeriksaan kandang).",
  },
] as const;

function bukaWhatsAppTim(teks: string) {
  // Nomor tim belum diputuskan: tanpa nomor, WhatsApp membuka pilihan kontak (tidak pernah nomor palsu).
  const nomor = (process.env.EXPO_PUBLIC_WA_NUMBER ?? "").replace(/[^\d]/g, "");
  const isi = encodeURIComponent(teks);
  void Linking.openURL(nomor ? `https://wa.me/${nomor}?text=${isi}` : `https://wa.me/?text=${isi}`);
}

export default function MasukLayar() {
  const { pengguna } = useSesi();
  const konfigurasi = useKonfigurasiAuth();
  const [pesanSukses, setPesanSukses] = useState<string | null>(null);

  /** Setelah sesi dibuat: tanpa peran → pilih peran dulu; selain itu kembali ke aplikasi. */
  function selesai(hasil: SesiAkunResponse) {
    const pindah = hasil.kandangDipindahkan ?? 0;
    if (pindah > 0) setPesanSukses(`${pindah} profil kandang dari HP ini sudah tersimpan di akun Anda.`);
    if (hasil.pengguna.peran) router.back();
  }

  const perluPeran = !!pengguna && !pengguna.peran;

  return (
    <Layar
      kepala={
        <KepalaLayar
          judul="Masuk"
          kiri={<TombolIkon ikon="close" label="Tutup" onPress={() => router.back()} />}
        />
      }
    >
      <View style={{ gap: jarak.s }}>
        <Text style={gaya.judulBesar}>Masuk ke Ternakin</Text>
        <Teks redup>
          Ada dua peran. <Text style={gaya.tebal}>Peternak</Text> menghitung pakan, mencatat kandang, bertanya
          ke Kokok, dan mengajukan peluang modal. <Text style={gaya.tebal}>Pengguna</Text> bertanya ke Kokok dan
          menitipkan modal ke peternak. Tanpa akun, Ternakin tetap bisa dipakai sebagai peternak.
        </Teks>
      </View>

      {perluPeran ? (
        <KartuPilihPeran pesanSukses={pesanSukses} />
      ) : !konfigurasi ? null : (
        <>
          {konfigurasi.email !== "nonaktif" ? <KartuEmail konfigurasi={konfigurasi} onSelesai={selesai} /> : null}
          {konfigurasi.whatsapp ? (
            <>
              <Pemisah />
              <KartuWhatsApp onSelesai={selesai} />
            </>
          ) : null}
          {konfigurasi.akunDemo ? <BagianDemo /> : null}
        </>
      )}

      <Kartu style={{ gap: jarak.m }}>
        <Text style={gaya.judulKartu}>Mitra Ternakin</Text>
        <Teks redup>
          Pendaftaran toko pakan mitra dan dokter hewan mitra masih dibantu langsung oleh tim lewat WhatsApp.
        </Teks>
        {MITRA.map((m) => (
          <Pressable
            key={m.judul}
            accessibilityRole="link"
            accessibilityLabel={`${m.judul}, gabung lewat WhatsApp`}
            onPress={() => bukaWhatsAppTim(m.pesan)}
            style={({ pressed }) => [gaya.barisMitra, pressed && { opacity: 0.7 }]}
          >
            <View style={gaya.ikonMitra}>
              <Ionicons name={m.ikon} size={22} color={warna.aksenTeks} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={gaya.namaMitra}>{m.judul}</Text>
              <Text style={gaya.subMitra}>Gabung lewat WhatsApp</Text>
            </View>
            <Ionicons name="logo-whatsapp" size={22} color={warna.hijau} />
          </Pressable>
        ))}
      </Kartu>
    </Layar>
  );
}

/* ---------- Pilih peran (akun baru dari Google/WhatsApp tanpa peran) ---------- */

function KartuPilihPeran({ pesanSukses }: { pesanSukses: string | null }) {
  const { aturPeran } = useSesi();
  const [peran, setPeran] = useState<PeranAkun | null>(null);
  const [galat, setGalat] = useState("");
  const [sedang, setSedang] = useState(false);

  async function simpan() {
    if (!peran) return setGalat("Pilih peran: Peternak atau Pengguna.");
    setGalat("");
    setSedang(true);
    try {
      await aturPeran(peran);
      router.back();
    } catch (err) {
      setGalat(pesanGalat(err));
    } finally {
      setSedang(false);
    }
  }

  return (
    <Kartu style={{ gap: jarak.m }}>
      <Text style={gaya.judulKartu}>Pilih peran akun Anda</Text>
      <Teks redup>Menu Ternakin menyesuaikan peran. Peran bisa diganti nanti dari halaman Akun.</Teks>
      {pesanSukses ? <Info>{pesanSukses}</Info> : null}
      <PilihanPeran nilai={peran} onPilih={setPeran} />
      <PesanGalat>{galat}</PesanGalat>
      <Tombol label="Lanjut" ikon="arrow-forward" memuat={sedang} onPress={simpan} />
    </Kartu>
  );
}

/* ---------- Email + kata sandi, daftar, verifikasi, lupa sandi, Google ---------- */

type Mode = "masuk" | "daftar";
type Langkah = "form" | "verifikasi" | "lupa" | "reset";

function KartuEmail({
  konfigurasi,
  onSelesai,
}: {
  konfigurasi: KonfigurasiAuthResponse;
  onSelesai: (hasil: SesiAkunResponse) => void;
}) {
  const { masukEmail, masukLewat } = useSesi();
  const { kandang, jumlahAntrean } = useDataKandang();
  const [mode, setMode] = useState<Mode>("masuk");
  const [langkah, setLangkah] = useState<Langkah>("form");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [peran, setPeran] = useState<PeranAkun | null>(null);
  const [kode, setKode] = useState("");
  const [sandiBaru, setSandiBaru] = useState("");
  const [infoKode, setInfoKode] = useState<KodeEmailResponse | null>(null);
  const [galat, setGalat] = useState("");
  const [sedang, setSedang] = useState<"form" | "google" | null>(null);
  const [sisaKirimUlang, setSisaKirimUlang] = useHitungMundur();

  const tampilGoogle = !!konfigurasi.googleClientId && googleTersedia();
  const emailBersih = email.trim();

  async function jalankan(aksi: () => Promise<void>, jenis: "form" | "google" = "form") {
    setGalat("");
    setSedang(jenis);
    try {
      await aksi();
    } catch (err) {
      const tunggu = err instanceof GalatApi ? err.rinci?.tungguDetik : undefined;
      if (typeof tunggu === "number") setSisaKirimUlang(tunggu);
      setGalat(err instanceof Error && !(err instanceof GalatApi) ? err.message : pesanGalat(err));
    } finally {
      setSedang(null);
    }
  }

  function keLangkahKode(info: KodeEmailResponse, berikut: Langkah) {
    setInfoKode(info);
    setSisaKirimUlang(info.kirimUlangDetik);
    setKode("");
    setLangkah(berikut);
  }

  const mintaKode = (path: string, body: Record<string, unknown>) =>
    panggilApi(path, { body, skema: kodeEmailResponseSchema });

  function masuk() {
    if (!emailBersih || !sandi) return setGalat("Isi email dan kata sandi.");
    if (emailBersih.toLowerCase().endsWith(DOMAIN_DEMO) && (kandang || jumlahAntrean > 0)) {
      return setGalat(PESAN_ADA_DATA_TAMU);
    }
    void jalankan(async () => {
      try {
        onSelesai(await masukEmail(emailBersih, sandi));
      } catch (err) {
        if (err instanceof GalatApi && err.kode === "EMAIL_BELUM_TERVERIFIKASI" && err.rinci) {
          const r = err.rinci;
          keLangkahKode(
            {
              ok: true,
              emailTersamar: String(r.emailTersamar ?? emailBersih),
              berlakuDetik: Number(r.berlakuDetik ?? 900),
              kirimUlangDetik: Number(r.kirimUlangDetik ?? 60),
              ...(typeof r.kodeDemo === "string" ? { kodeDemo: r.kodeDemo } : {}),
            },
            "verifikasi",
          );
          return;
        }
        throw err;
      }
    });
  }

  function daftar() {
    if (!peran) return setGalat("Pilih peran: Peternak atau Pengguna.");
    if (!nama.trim() || !emailBersih) return setGalat("Isi nama panggilan dan email.");
    if (sandi.length < 8) return setGalat("Kata sandi minimal 8 karakter.");
    void jalankan(async () =>
      keLangkahKode(
        await mintaKode("/v1/auth/email/daftar", { nama: nama.trim(), email: emailBersih, sandi, peran }),
        "verifikasi",
      ),
    );
  }

  function verifikasi() {
    if (kode.length !== PANJANG_KODE_OTP) return setGalat(`Masukkan ${PANJANG_KODE_OTP} angka kode dari email.`);
    void jalankan(async () => onSelesai(await masukLewat("/v1/auth/email/verifikasi", { email: emailBersih, kode })));
  }

  function lupa() {
    if (!emailBersih) return setGalat("Isi email akun Anda.");
    void jalankan(async () => keLangkahKode(await mintaKode("/v1/auth/email/lupa-sandi", { email: emailBersih }), "reset"));
  }

  function reset() {
    if (kode.length !== PANJANG_KODE_OTP) return setGalat(`Masukkan ${PANJANG_KODE_OTP} angka kode dari email.`);
    if (sandiBaru.length < 8) return setGalat("Kata sandi baru minimal 8 karakter.");
    void jalankan(async () =>
      onSelesai(await masukLewat("/v1/auth/email/reset-sandi", { email: emailBersih, kode, sandiBaru })),
    );
  }

  function kirimUlang() {
    void jalankan(async () => {
      const info =
        langkah === "reset"
          ? await mintaKode("/v1/auth/email/lupa-sandi", { email: emailBersih })
          : await mintaKode("/v1/auth/email/kirim-ulang", { email: emailBersih });
      keLangkahKode(info, langkah);
    });
  }

  function google() {
    const clientId = konfigurasi.googleClientId;
    if (!clientId) return;
    void jalankan(async () => {
      const hasil = await ambilTokenGoogle(clientId);
      if (hasil.status === "batal") return;
      onSelesai(
        await masukLewat("/v1/auth/google", { credential: hasil.idToken, ...(peran ? { peran } : {}) }),
      );
    }, "google");
  }

  function kembali() {
    setLangkah("form");
    setGalat("");
    setInfoKode(null);
  }

  const infoPengiriman = infoKode ? (
    <>
      <Teks>
        Kode dikirim ke <Text style={gaya.tebal}>{infoKode.emailTersamar}</Text>. Berlaku{" "}
        {Math.round(infoKode.berlakuDetik / 60)} menit. Periksa juga folder Spam.
      </Teks>
      {infoKode.kodeDemo ? (
        <Info>
          Mode demo: pengiriman email belum dipasang di server ini. Kode Anda:{" "}
          <Text style={gaya.tebal}>{infoKode.kodeDemo}</Text>
        </Info>
      ) : null}
    </>
  ) : null;

  const tombolKirimUlang = (
    <View style={{ flexDirection: "row", gap: jarak.s }}>
      <View style={{ flex: 1 }}>
        <Tombol
          jenis="kedua"
          label={sisaKirimUlang > 0 ? `Kirim ulang (${sisaKirimUlang})` : "Kirim ulang"}
          nonaktif={sedang !== null || sisaKirimUlang > 0}
          onPress={kirimUlang}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Tombol jenis="kedua" label="Kembali" onPress={kembali} />
      </View>
    </View>
  );

  return (
    <Kartu style={{ gap: jarak.m }}>
      <Text style={gaya.judulKartu}>
        {langkah === "lupa" || langkah === "reset" ? "Atur ulang kata sandi" : "Masuk ke akun Anda"}
      </Text>

      {langkah === "form" ? (
        <>
          {tampilGoogle ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Masuk dengan Google"
                accessibilityState={{ busy: sedang === "google", disabled: sedang !== null }}
                disabled={sedang !== null}
                onPress={google}
                style={({ pressed }) => [gaya.tombolGoogle, (pressed || sedang !== null) && { opacity: 0.7 }]}
              >
                <Ionicons name="logo-google" size={22} color="#4285F4" />
                <Text style={gaya.teksGoogle}>{sedang === "google" ? "Membuka Google..." : "Masuk dengan Google"}</Text>
              </Pressable>
              <Pemisah teks="atau pakai email" />
            </>
          ) : null}

          <View style={gaya.tab} accessibilityRole="tablist">
            {(
              [
                ["masuk", "Masuk"],
                ["daftar", "Daftar"],
              ] as const
            ).map(([nilai, label]) => {
              const aktif = mode === nilai;
              return (
                <Pressable
                  key={nilai}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: aktif }}
                  onPress={() => {
                    setMode(nilai);
                    setGalat("");
                  }}
                  style={[gaya.tabBtn, aktif && gaya.tabBtnAktif]}
                >
                  <Text style={[gaya.teksTab, aktif && { color: warna.putih }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {mode === "masuk" ? (
            <>
              <Masukan
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="nama@contoh.com"
              />
              <Masukan
                label="Kata sandi"
                value={sandi}
                onChangeText={setSandi}
                secureTextEntry
                autoComplete="current-password"
                placeholder="Kata sandi"
              />
              <PesanGalat>{galat}</PesanGalat>
              <Tombol label="Masuk" ikon="arrow-forward" memuat={sedang === "form"} nonaktif={sedang !== null} onPress={masuk} />
              <TautanTeks
                label="Lupa kata sandi?"
                onPress={() => {
                  setLangkah("lupa");
                  setGalat("");
                }}
              />
            </>
          ) : (
            <>
              <PilihanPeran nilai={peran} onPilih={setPeran} />
              <Masukan
                label="Nama panggilan (mis. Bu Euis)"
                value={nama}
                onChangeText={setNama}
                autoComplete="name"
                maxLength={60}
              />
              <Masukan
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="nama@contoh.com"
              />
              <Masukan
                label="Kata sandi (minimal 8 karakter)"
                value={sandi}
                onChangeText={setSandi}
                secureTextEntry
                autoComplete="new-password"
              />
              <PesanGalat>{galat}</PesanGalat>
              <Tombol label="Daftar" ikon="arrow-forward" memuat={sedang === "form"} nonaktif={sedang !== null} onPress={daftar} />
            </>
          )}
        </>
      ) : null}

      {langkah === "verifikasi" ? (
        <>
          {infoPengiriman}
          <MasukanKode label={`Kode ${PANJANG_KODE_OTP} angka dari email`} nilai={kode} ubah={setKode} />
          <PesanGalat>{galat}</PesanGalat>
          <Tombol label="Verifikasi dan masuk" ikon="arrow-forward" memuat={sedang === "form"} onPress={verifikasi} />
          {tombolKirimUlang}
        </>
      ) : null}

      {langkah === "lupa" ? (
        <>
          <Teks redup>Masukkan email akun Anda. Kami kirim kode untuk membuat kata sandi baru.</Teks>
          <Masukan
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <PesanGalat>{galat}</PesanGalat>
          <Tombol label="Kirim kode" memuat={sedang === "form"} nonaktif={sisaKirimUlang > 0} onPress={lupa} />
          <TautanTeks label="Kembali ke Masuk" onPress={kembali} />
        </>
      ) : null}

      {langkah === "reset" ? (
        <>
          {infoPengiriman}
          <MasukanKode label={`Kode ${PANJANG_KODE_OTP} angka dari email`} nilai={kode} ubah={setKode} />
          <Masukan
            label="Kata sandi baru (minimal 8 karakter)"
            value={sandiBaru}
            onChangeText={setSandiBaru}
            secureTextEntry
            autoComplete="new-password"
          />
          <PesanGalat>{galat}</PesanGalat>
          <Tombol label="Simpan sandi baru dan masuk" memuat={sedang === "form"} onPress={reset} />
          {tombolKirimUlang}
        </>
      ) : null}
    </Kartu>
  );
}

/* ---------- WhatsApp OTP ---------- */

function KartuWhatsApp({ onSelesai }: { onSelesai: (hasil: SesiAkunResponse) => void }) {
  const { masukLewat } = useSesi();
  const [tahap, setTahap] = useState<"nomor" | "kode">("nomor");
  const [peran, setPeran] = useState<PeranAkun | null>(null);
  const [nomor, setNomor] = useState("");
  const [kode, setKode] = useState("");
  const [nomorTersamar, setNomorTersamar] = useState("");
  const [kodeDemo, setKodeDemo] = useState<string | null>(null);
  const [galat, setGalat] = useState("");
  const [sedang, setSedang] = useState(false);
  const [sisaKirimUlang, setSisaKirimUlang] = useHitungMundur();

  async function kirimKode() {
    setGalat("");
    if (!normalisasiNomorPonsel(nomor)) return setGalat("Nomor WhatsApp belum benar. Contoh: 0812 3456 7890.");
    setSedang(true);
    try {
      const hasil = await panggilApi("/v1/auth/otp/minta", {
        body: { nomorPonsel: nomor },
        skema: mintaOtpResponseSchema,
      });
      setNomorTersamar(hasil.nomorTersamar);
      setKodeDemo(hasil.kodeDemo ?? null);
      setSisaKirimUlang(hasil.kirimUlangDetik);
      setKode("");
      setTahap("kode");
    } catch (err) {
      const tunggu = err instanceof GalatApi ? err.rinci?.tungguDetik : undefined;
      if (typeof tunggu === "number") setSisaKirimUlang(tunggu);
      setGalat(pesanGalat(err));
    } finally {
      setSedang(false);
    }
  }

  async function verifikasi() {
    setGalat("");
    if (kode.length !== PANJANG_KODE_OTP) return setGalat(`Masukkan ${PANJANG_KODE_OTP} angka kode dari WhatsApp.`);
    setSedang(true);
    try {
      onSelesai(
        await masukLewat("/v1/auth/otp/verifikasi", {
          nomorPonsel: nomor,
          kode,
          ...(peran ? { peran } : {}),
        }),
      );
    } catch (err) {
      setGalat(pesanGalat(err));
      if (err instanceof GalatApi && err.kode !== "OTP_SALAH") setKode("");
    } finally {
      setSedang(false);
    }
  }

  return (
    <Kartu style={{ gap: jarak.m }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: jarak.s }}>
        <Ionicons name="logo-whatsapp" size={24} color={warna.hijau} />
        <Text style={[gaya.judulKartu, { flex: 1 }]}>Masuk dengan WhatsApp</Text>
      </View>

      {tahap === "nomor" ? (
        <>
          <Teks redup>Kami kirim kode {PANJANG_KODE_OTP} angka ke WhatsApp Anda. Tanpa kata sandi.</Teks>
          <PilihanPeran nilai={peran} onPilih={setPeran} judul="Untuk akun baru, saya sebagai" />
          <Masukan
            label="Nomor WhatsApp"
            value={nomor}
            onChangeText={setNomor}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="0812 3456 7890"
          />
          <PesanGalat>{galat}</PesanGalat>
          <Tombol
            label={sisaKirimUlang > 0 ? `Kirim kode (${sisaKirimUlang})` : "Kirim kode"}
            ikon="logo-whatsapp"
            memuat={sedang}
            nonaktif={sisaKirimUlang > 0}
            onPress={() => void kirimKode()}
          />
        </>
      ) : (
        <>
          <Teks>
            Kode dikirim ke <Text style={gaya.tebal}>{nomorTersamar}</Text> lewat WhatsApp. Berlaku 5 menit.
          </Teks>
          {kodeDemo ? (
            <Info>
              Mode demo: WhatsApp belum dipasang di server ini. Kode Anda: <Text style={gaya.tebal}>{kodeDemo}</Text>
            </Info>
          ) : null}
          <MasukanKode label={`Kode ${PANJANG_KODE_OTP} angka dari WhatsApp`} nilai={kode} ubah={setKode} />
          <PesanGalat>{galat}</PesanGalat>
          <Tombol label="Masuk" ikon="arrow-forward" memuat={sedang} onPress={() => void verifikasi()} />
          <View style={{ flexDirection: "row", gap: jarak.s }}>
            <View style={{ flex: 1 }}>
              <Tombol
                jenis="kedua"
                label={sisaKirimUlang > 0 ? `Kirim ulang (${sisaKirimUlang})` : "Kirim ulang"}
                nonaktif={sedang || sisaKirimUlang > 0}
                onPress={() => void kirimKode()}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Tombol
                jenis="kedua"
                label="Ganti nomor"
                onPress={() => {
                  setTahap("nomor");
                  setGalat("");
                }}
              />
            </View>
          </View>
        </>
      )}
    </Kartu>
  );
}

/* ---------- Akun demo ---------- */

function BagianDemo() {
  const { masukDemo } = useSesi();
  const { kandang, jumlahAntrean } = useDataKandang();
  const [sedang, setSedang] = useState<PeranAkun | null>(null);
  const [galat, setGalat] = useState("");

  async function masukSebagai(peran: PeranAkun) {
    setGalat("");
    // Akun demo dipakai bersama: data kandang tamu di HP ini tidak boleh ikut tersinkron ke sana.
    if (kandang || jumlahAntrean > 0) return setGalat(PESAN_ADA_DATA_TAMU);
    setSedang(peran);
    try {
      await masukDemo(peran);
      router.back();
    } catch (err) {
      setGalat(pesanGalat(err));
    } finally {
      setSedang(null);
    }
  }

  return (
    <View style={{ gap: jarak.m }}>
      <View style={{ gap: jarak.xs }}>
        <Text style={gaya.judulBagian}>Coba akun demo</Text>
        <Teks redup>
          Untuk juri dan uji coba. Ketuk tombolnya, atau ketik email dan sandi di form Masuk. Akun demo dipakai
          bersama, jadi jangan isi data pribadi.
        </Teks>
      </View>
      <PesanGalat>{galat}</PesanGalat>
      {(["pengguna", "peternak"] as const).map((peran) => (
        <Kartu key={peran} style={{ gap: jarak.m }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: jarak.m }}>
            <View style={gaya.ikonDemo}>
              <Ionicons name={peran === "peternak" ? "home" : "person"} size={22} color={warna.aksenTeks} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={gaya.judulKartu}>{LABEL_PERAN[peran]} demo</Text>
              <Text style={gaya.subMitra}>{AKUN_DEMO_TAMPIL[peran].nama}</Text>
            </View>
          </View>
          <View style={gaya.kredensial}>
            <View>
              <Text style={gaya.labelKred}>Email</Text>
              <Text style={gaya.nilaiKred} selectable>
                {AKUN_DEMO_TAMPIL[peran].email}
              </Text>
            </View>
            <View>
              <Text style={gaya.labelKred}>Sandi</Text>
              <Text style={gaya.nilaiKred} selectable>
                {AKUN_DEMO_TAMPIL[peran].sandi}
              </Text>
            </View>
          </View>
          <View style={{ gap: 6 }}>
            {INFO_PERAN[peran].map((b) => (
              <View key={b} style={{ flexDirection: "row", gap: jarak.s, alignItems: "center" }}>
                <Ionicons name="checkmark-circle" size={18} color={warna.aksen} />
                <Text style={gaya.teksDaftar}>{b}</Text>
              </View>
            ))}
          </View>
          <Tombol
            label={`Masuk sebagai ${LABEL_PERAN[peran].toLowerCase()}`}
            ikon="arrow-forward"
            memuat={sedang === peran}
            nonaktif={sedang !== null}
            onPress={() => void masukSebagai(peran)}
          />
        </Kartu>
      ))}
    </View>
  );
}

const gaya = StyleSheet.create({
  judulBesar: { fontSize: huruf.besar - 4, fontWeight: "700", color: warna.tinta, letterSpacing: -0.5 },
  tebal: { fontWeight: "700", color: warna.tinta },
  judulKartu: { fontSize: huruf.sub + 1, fontWeight: "700", color: warna.tinta },
  judulBagian: { fontSize: huruf.sub + 2, fontWeight: "600", color: warna.tinta },
  tombolGoogle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: jarak.m,
    minHeight: 56,
    borderRadius: sudut.l,
    backgroundColor: warna.putih,
    borderWidth: 1.5,
    borderColor: warna.kremGaris,
  },
  teksGoogle: { fontSize: huruf.sub - 1, fontWeight: "600", color: warna.tinta },
  tab: { flexDirection: "row", backgroundColor: warna.krem, borderRadius: sudut.l, padding: 4, gap: 4 },
  tabBtn: { flex: 1, minHeight: 46, borderRadius: sudut.m, alignItems: "center", justifyContent: "center" },
  tabBtnAktif: { backgroundColor: warna.gelap, ...bayangan },
  teksTab: { fontSize: huruf.isi, fontWeight: "700", color: warna.tintaRedup },
  barisMitra: {
    flexDirection: "row",
    alignItems: "center",
    gap: jarak.m,
    padding: jarak.m,
    borderRadius: sudut.l,
    backgroundColor: warna.krem,
  },
  ikonMitra: {
    width: 44,
    height: 44,
    borderRadius: sudut.m,
    backgroundColor: warna.putih,
    alignItems: "center",
    justifyContent: "center",
  },
  namaMitra: { fontSize: huruf.isi, fontWeight: "700", color: warna.tinta },
  subMitra: { fontSize: huruf.kecil, color: warna.tintaRedup },
  ikonDemo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: warna.aksenLembut,
    alignItems: "center",
    justifyContent: "center",
  },
  kredensial: {
    gap: jarak.s,
    backgroundColor: warna.krem,
    borderRadius: sudut.m,
    padding: jarak.m,
  },
  labelKred: { fontSize: 12, color: warna.tintaRedup, fontWeight: "600" },
  nilaiKred: { fontSize: huruf.isi, fontWeight: "700", color: warna.tinta },
  teksDaftar: { flex: 1, fontSize: huruf.isi - 1, color: warna.tinta },
});
