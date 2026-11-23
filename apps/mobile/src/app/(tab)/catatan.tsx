import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from "react-native";
import { evaluateAlerts, formatAngka } from "@ternakin/shared";
import { KartuCatatan } from "@/components/KartuCatatan";
import {
  JudulBagian,
  Kartu,
  KepalaLayar,
  Layar,
  Masukan,
  PesanGalat,
  Teks,
  Tombol,
  TombolIkon,
} from "@/components/ui";
import {
  geserTanggal,
  hapusCatatan,
  labelTanggal,
  simpanCatatan,
  simpanKandang,
  sinkronkan,
  tanggalLokal,
  useDataKandang,
  type KandangLokal,
} from "@/lib/kandang";
import { useReferensi } from "@/lib/referensi";
import { bayangan, huruf, jarak, sudut, warna } from "@/lib/tema";

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const RE_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

/** "12,5" atau "12.5" → 12.5; kosong → null; tidak valid → NaN. */
function uraiAngka(teks: string): number | null {
  const bersih = teks.trim().replace(",", ".");
  if (!bersih) return null;
  const n = Number(bersih);
  return Number.isFinite(n) ? n : Number.NaN;
}

function keTeks(n: number | null): string {
  return n === null ? "" : String(n).replace(".", ",");
}

export default function CatatanLayar() {
  const { kandang, siap } = useDataKandang();
  const [ubahKandang, setUbahKandang] = useState(false);

  if (!siap) return <Layar>{null}</Layar>;
  if (!kandang || ubahKandang) {
    return <FormKandang kandang={kandang} onSelesai={() => setUbahKandang(false)} />;
  }
  return <IsiCatatan kandang={kandang} onUbahKandang={() => setUbahKandang(true)} />;
}

function FormKandang({ kandang, onSelesai }: { kandang: KandangLokal | null; onSelesai: () => void }) {
  const [nama, setNama] = useState(kandang?.nama ?? "");
  const [ekor, setEkor] = useState(kandang ? String(kandang.jumlahEkor) : "");
  const [umur, setUmur] = useState(kandang?.umurMinggu != null ? String(kandang.umurMinggu) : "");
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  async function simpan() {
    const jumlah = Number(ekor.trim());
    const umurN = umur.trim() ? Number(umur.trim()) : null;
    if (!nama.trim()) return setGalat("Nama kandang wajib diisi.");
    if (!Number.isInteger(jumlah) || jumlah < 0) return setGalat("Jumlah ayam harus bilangan bulat, tidak negatif.");
    if (umurN !== null && (!Number.isInteger(umurN) || umurN < 0 || umurN > 200))
      return setGalat("Umur ayam diisi dalam minggu (0–200).");
    setGalat("");
    setProses(true);
    try {
      await simpanKandang({ id: kandang?.id, nama, jumlahEkor: jumlah, umurMinggu: umurN });
      onSelesai();
    } finally {
      setProses(false);
    }
  }

  return (
    <Layar
      kepala={
        <KepalaLayar
          judul={kandang ? "Ubah Kandang" : "Siapkan Kandang"}
          kiri={kandang ? <TombolIkon ikon="chevron-back" label="Kembali" onPress={onSelesai} /> : undefined}
        />
      }
    >
      <View style={{ gap: jarak.s }}>
        <Text style={gaya.judulBesar}>{kandang ? "Profil kandang" : "Kandang pertama Anda"}</Text>
        <Teks redup>Dipakai untuk menghitung persen produksi telur dan peringatan kematian.</Teks>
      </View>
      <Kartu style={{ gap: jarak.m }}>
        <Masukan label="Nama kandang" value={nama} onChangeText={setNama} placeholder="Misal: Kandang Belakang" maxLength={100} />
        <Masukan
          label="Jumlah ayam"
          value={ekor}
          onChangeText={setEkor}
          keyboardType="number-pad"
          placeholder="500"
          akhiran="ekor"
        />
        <Masukan
          label="Umur ayam (boleh kosong)"
          value={umur}
          onChangeText={setUmur}
          keyboardType="number-pad"
          placeholder="24"
          akhiran="minggu"
        />
        <PesanGalat>{galat}</PesanGalat>
        <Tombol label="Simpan Kandang" memuat={proses} onPress={simpan} />
      </Kartu>
      <Teks redup style={{ fontSize: huruf.kecil, textAlign: "center" }}>
        Tersimpan di HP ini dan dikirim ke server saat ada sinyal.
      </Teks>
    </Layar>
  );
}

function IsiCatatan({ kandang, onUbahKandang }: { kandang: KandangLokal; onUbahKandang: () => void }) {
  const params = useLocalSearchParams<{ tanggal?: string }>();
  const { catatan, semuaCatatan, jumlahAntrean, sedangSinkron, galatSinkron } = useDataKandang();
  const { referensi } = useReferensi();
  const gulir = useRef<ScrollViewInstance>(null);
  const hariIni = tanggalLokal();

  const [tanggal, setTanggal] = useState(hariIni);
  const [telur, setTelur] = useState("");
  const [pakan, setPakan] = useState("");
  const [mati, setMati] = useState("");
  const [suhu, setSuhu] = useState("");
  const [galat, setGalat] = useState("");
  const [pesan, setPesan] = useState("");
  const [proses, setProses] = useState(false);

  // Dibuka dari Beranda dengan ?tanggal=YYYY-MM-DD (state disesuaikan saat render, bukan di effect).
  const [paramLama, setParamLama] = useState<string | undefined>(undefined);
  if (params.tanggal !== paramLama) {
    setParamLama(params.tanggal);
    if (params.tanggal && RE_TANGGAL.test(params.tanggal) && params.tanggal <= hariIni) {
      setTanggal(params.tanggal);
    }
  }

  const terpilih = catatan.find((c) => c.tanggal === tanggal);

  // Isi formulir dengan catatan tersimpan saat tanggal diganti.
  const kunciForm = `${tanggal}:${terpilih?.id ?? ""}`;
  const [kunciLama, setKunciLama] = useState<string | null>(null);
  if (kunciForm !== kunciLama) {
    setKunciLama(kunciForm);
    setTelur(keTeks(terpilih?.telur ?? null));
    setPakan(keTeks(terpilih?.pakanKg ?? null));
    setMati(keTeks(terpilih?.kematian ?? null));
    setSuhu(keTeks(terpilih?.suhu ?? null));
    setGalat("");
    if (kunciLama?.split(":")[0] !== tanggal) setPesan("");
  }

  const peringatan = useMemo(
    () => (referensi ? evaluateAlerts(semuaCatatan, kandang, referensi.ambangPeringatan) : []),
    [referensi, semuaCatatan, kandang],
  );

  const hari7 = useMemo(() => Array.from({ length: 7 }, (_, i) => geserTanggal(hariIni, i - 6)), [hariIni]);
  const adaCatatan = new Set(catatan.map((c) => c.tanggal));

  async function simpan() {
    const nilai = {
      telur: uraiAngka(telur),
      pakanKg: uraiAngka(pakan),
      kematian: uraiAngka(mati),
      suhu: uraiAngka(suhu),
    };
    if (Object.values(nilai).every((v) => v === null)) return setGalat("Isi minimal satu angka.");
    if (Object.values(nilai).some((v) => v !== null && Number.isNaN(v)))
      return setGalat("Gunakan angka saja, misalnya 12,5.");
    if ((nilai.telur !== null && (!Number.isInteger(nilai.telur) || nilai.telur < 0)) ||
        (nilai.kematian !== null && (!Number.isInteger(nilai.kematian) || nilai.kematian < 0)))
      return setGalat("Jumlah telur dan ayam mati harus bilangan bulat, tidak negatif.");
    if (nilai.pakanKg !== null && nilai.pakanKg < 0) return setGalat("Pakan tidak boleh negatif.");
    if (nilai.suhu !== null && (nilai.suhu < -10 || nilai.suhu > 60))
      return setGalat("Suhu kandang harus antara -10 dan 60 °C.");

    setGalat("");
    setProses(true);
    try {
      await simpanCatatan({ kandangId: kandang.id, tanggal, ...nilai });
      setPesan(`Catatan ${labelTanggal(tanggal, true).toLowerCase()} tersimpan.`);
    } finally {
      setProses(false);
    }
  }

  function konfirmasiHapus() {
    if (!terpilih) return;
    Alert.alert("Hapus catatan?", `Catatan ${labelTanggal(tanggal)} akan dihapus.`, [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: () => void hapusCatatan(terpilih) },
    ]);
  }

  function pilihDariRiwayat(t: string) {
    setTanggal(t);
    gulir.current?.scrollTo({ y: 0, animated: true });
  }

  const statusSinkron = sedangSinkron
    ? "Mengirim…"
    : jumlahAntrean > 0
      ? `${jumlahAntrean} menunggu dikirim${galatSinkron ? " (offline)" : ""}`
      : "Semua tersinkron";

  return (
    <Layar
      refGulir={gulir}
      kepala={
        <KepalaLayar
          judul="Catatan Harian"
          kiri={<TombolIkon ikon="home-outline" label="Ubah profil kandang" onPress={onUbahKandang} />}
          kanan={
            <TombolIkon
              ikon={jumlahAntrean > 0 ? "cloud-upload-outline" : "cloud-done-outline"}
              label={`${statusSinkron}. Ketuk untuk kirim sekarang`}
              titik={jumlahAntrean > 0}
              onPress={() => void sinkronkan()}
            />
          }
        />
      }
    >
      <View style={gaya.ringkasKandang}>
        <View style={{ flex: 1 }}>
          <Text style={gaya.judulBesar} numberOfLines={1}>{kandang.nama}</Text>
          <Text style={gaya.redup}>
            {formatAngka(kandang.jumlahEkor, 0)} ekor
            {kandang.umurMinggu != null ? ` · ${kandang.umurMinggu} minggu` : ""} · {statusSinkron}
          </Text>
        </View>
      </View>

      <View style={gaya.barisHari}>
        {hari7.map((t) => {
          const aktif = t === tanggal;
          const d = new Date(`${t}T00:00:00`);
          return (
            <Pressable
              key={t}
              accessibilityRole="button"
              accessibilityState={{ selected: aktif }}
              accessibilityLabel={`${labelTanggal(t, true)}${adaCatatan.has(t) ? ", sudah dicatat" : ""}`}
              onPress={() => setTanggal(t)}
              style={[gaya.ubinHari, aktif && gaya.ubinHariAktif]}
            >
              <Text style={[gaya.namaHari, aktif && { color: warna.putih }]}>{HARI[d.getDay()]}</Text>
              <Text style={[gaya.angkaHari, aktif && { color: warna.putih }]}>{d.getDate()}</Text>
              <View style={[gaya.titikHari, adaCatatan.has(t) && { backgroundColor: aktif ? warna.putih : warna.aksen }]} />
            </Pressable>
          );
        })}
      </View>

      <Kartu style={{ gap: jarak.m }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={gaya.judulKartu}>{labelTanggal(tanggal, true) === labelTanggal(tanggal)
              ? labelTanggal(tanggal)
              : `${labelTanggal(tanggal, true)} · ${labelTanggal(tanggal)}`}</Text>
          {terpilih ? <Text style={gaya.redup}>Sudah dicatat</Text> : null}
        </View>
        <View style={gaya.kisi}>
          <KotakAngka label="Telur" satuan="butir" ikon="egg-outline" nilai={telur} ubah={setTelur} papan="number-pad" />
          <KotakAngka label="Pakan" satuan="kg" ikon="nutrition-outline" nilai={pakan} ubah={setPakan} papan="decimal-pad" />
          <KotakAngka label="Ayam mati" satuan="ekor" ikon="medkit-outline" nilai={mati} ubah={setMati} papan="number-pad" />
          <KotakAngka label="Suhu" satuan="°C" ikon="thermometer-outline" nilai={suhu} ubah={setSuhu} papan="decimal-pad" />
        </View>
        <PesanGalat>{galat}</PesanGalat>
        {pesan ? (
          <View style={gaya.sukses} accessibilityLiveRegion="polite">
            <Ionicons name="checkmark-circle" size={20} color={warna.hijau} />
            <Text style={{ color: warna.hijau, fontSize: huruf.isi, flex: 1 }}>{pesan}</Text>
          </View>
        ) : null}
        <Tombol label={terpilih ? "Perbarui Catatan" : "Simpan Catatan"} memuat={proses} onPress={simpan} />
        {terpilih ? <Tombol jenis="hantu" label="Hapus catatan ini" onPress={konfirmasiHapus} /> : null}
      </Kartu>

      {peringatan.map((p) => (
        <Kartu key={p.id} style={gaya.kartuPeringatan}>
          <View style={{ flexDirection: "row", gap: jarak.s, alignItems: "center" }}>
            <Ionicons name="warning" size={22} color={p.tingkat === "tinggi" ? warna.bahaya : warna.aksenTeks} />
            <Text style={[gaya.judulKartu, { flex: 1 }]}>{p.judul}</Text>
          </View>
          <Teks>{p.alasan}</Teks>
          <Teks redup style={{ fontSize: huruf.kecil }}>Acuan ambang: {p.sumberAmbang}</Teks>
          <Pressable accessibilityRole="button" onPress={() => router.navigate("/kokok")} hitSlop={8}>
            <Text style={gaya.tautan}>Tanya Kokok soal ini →</Text>
          </Pressable>
        </Kartu>
      ))}

      {catatan.length > 0 ? (
        <>
          <JudulBagian jumlah={catatan.length}>Riwayat</JudulBagian>
          {catatan.slice(0, 30).map((c) => (
            <KartuCatatan key={c.id} catatan={c} ekor={kandang.jumlahEkor} onPress={() => pilihDariRiwayat(c.tanggal)} />
          ))}
        </>
      ) : null}
    </Layar>
  );
}

function KotakAngka({
  label,
  satuan,
  ikon,
  nilai,
  ubah,
  papan,
}: {
  label: string;
  satuan: string;
  ikon: "egg-outline" | "nutrition-outline" | "medkit-outline" | "thermometer-outline";
  nilai: string;
  ubah: (t: string) => void;
  papan: "number-pad" | "decimal-pad";
}) {
  return (
    <View style={gaya.kotak}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name={ikon} size={18} color={warna.aksenTeks} />
        <Text style={gaya.labelKotak}>{label}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
        <TextInput
          value={nilai}
          onChangeText={ubah}
          keyboardType={papan}
          placeholder="0"
          placeholderTextColor={warna.kremGaris}
          accessibilityLabel={`${label} (${satuan})`}
          style={gaya.masukanKotak}
          maxLength={7}
        />
        <Text style={gaya.satuanKotak}>{satuan}</Text>
      </View>
    </View>
  );
}

const gaya = StyleSheet.create({
  judulBesar: { fontSize: huruf.judul, fontWeight: "700", color: warna.tinta, letterSpacing: -0.5 },
  redup: { fontSize: huruf.kecil + 1, color: warna.tintaRedup },
  ringkasKandang: { flexDirection: "row", alignItems: "center" },
  barisHari: { flexDirection: "row", gap: 6 },
  ubinHari: {
    flex: 1,
    paddingVertical: jarak.m,
    borderRadius: sudut.l,
    backgroundColor: warna.putih,
    alignItems: "center",
    gap: 2,
    ...bayangan,
  },
  ubinHariAktif: { backgroundColor: warna.aksen },
  namaHari: { fontSize: 12, color: warna.tintaRedup, fontWeight: "600" },
  angkaHari: { fontSize: huruf.sub, color: warna.tinta, fontWeight: "700" },
  titikHari: { width: 6, height: 6, borderRadius: 3, marginTop: 2, backgroundColor: "transparent" },
  judulKartu: { fontSize: huruf.sub, fontWeight: "700", color: warna.tinta },
  kisi: { flexDirection: "row", flexWrap: "wrap", gap: jarak.s },
  kotak: {
    flexGrow: 1,
    flexBasis: "46%",
    backgroundColor: warna.krem,
    borderRadius: sudut.l,
    padding: jarak.m,
    gap: 2,
  },
  labelKotak: { fontSize: huruf.kecil, color: warna.tintaRedup, fontWeight: "600" },
  masukanKotak: {
    flex: 1,
    minWidth: 0,
    fontSize: huruf.besar - 4,
    fontWeight: "600",
    color: warna.tinta,
    paddingVertical: 2,
    minHeight: 48,
  },
  satuanKotak: { fontSize: huruf.isi, color: warna.tintaRedup, fontWeight: "600" },
  sukses: {
    flexDirection: "row",
    gap: jarak.s,
    alignItems: "center",
    backgroundColor: warna.hijauLembut,
    borderRadius: sudut.m,
    padding: jarak.m,
  },
  kartuPeringatan: { backgroundColor: warna.aksenLembut, shadowOpacity: 0, elevation: 0 },
  tautan: { fontSize: huruf.isi, fontWeight: "700", color: warna.aksenTeks },
});
