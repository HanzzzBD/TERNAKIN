import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Kartu, KepalaLayar, Layar, PesanGalat, Pil, Teks, Tombol } from "@/components/ui";
import { API_URL, pesanGalat } from "@/lib/api";
import { sinkronkan, useDataKandang } from "@/lib/kandang";
import { useSesi } from "@/lib/sesi";
import { huruf, jarak, sudut, warna } from "@/lib/tema";

export default function ProfilLayar() {
  const { pengguna, peran, keluar, aturPeran } = useSesi();
  const { jumlahAntrean } = useDataKandang();
  const [proses, setProses] = useState<"peran" | "keluar" | null>(null);
  const [galat, setGalat] = useState("");

  const nama = pengguna?.nama ?? (pengguna ? "Tanpa nama" : "Tamu");
  const inisial = nama.trim().charAt(0).toUpperCase() || "T";
  const peranLain = peran === "peternak" ? "pengguna" : "peternak";

  async function gantiPeran() {
    setGalat("");
    setProses("peran");
    try {
      await aturPeran(peranLain);
    } catch (err) {
      setGalat(pesanGalat(err));
    } finally {
      setProses(null);
    }
  }

  async function jalankanKeluar() {
    setProses("keluar");
    try {
      // Kirim antrean dulu; salinan data di HP dihapus setelah keluar.
      await sinkronkan();
      await keluar();
    } finally {
      setProses(null);
    }
  }

  function konfirmasiKeluar() {
    if (jumlahAntrean === 0) return void jalankanKeluar();
    Alert.alert(
      "Masih ada data belum terkirim",
      `${jumlahAntrean} perubahan belum sampai ke server dan akan hilang dari HP ini bila keluar sekarang.`,
      [
        { text: "Batal", style: "cancel" },
        { text: "Tetap keluar", style: "destructive", onPress: () => void jalankanKeluar() },
      ],
    );
  }

  return (
    <Layar kepala={<KepalaLayar judul="Akun" />}>
      <Kartu style={{ alignItems: "center", paddingVertical: jarak.xl, gap: jarak.s }}>
        <View style={gaya.avatar}>
          {pengguna ? (
            <Text style={gaya.inisial}>{inisial}</Text>
          ) : (
            <Image source={require("@/assets/images/kokok.webp")} style={{ width: 64, height: 64 }} contentFit="contain" />
          )}
        </View>
        <Text style={gaya.nama}>{nama}</Text>
        {pengguna?.emailTersamar ? <Teks redup>{pengguna.emailTersamar}</Teks> : null}
        {pengguna?.nomorTersamar ? <Teks redup>{pengguna.nomorTersamar}</Teks> : null}
        <View style={{ flexDirection: "row", gap: jarak.s, marginTop: jarak.xs }}>
          <Pil label={peran === "peternak" ? "Peternak" : "Pengguna (pemodal)"} nada="aksen" />
          {pengguna?.isDemo ? <Pil label="Akun demo" /> : null}
          {!pengguna ? <Pil label="Mode tamu" /> : null}
        </View>
      </Kartu>

      {!pengguna ? (
        <Kartu style={{ gap: jarak.m }}>
          <Baris ikon="phone-portrait-outline" teks="Data kandang tersimpan di HP ini." />
          <Baris ikon="cloud-outline" teks="Masuk agar data tersimpan di akun dan bisa dibuka dari HP lain." />
          <Tombol label="Masuk" ikon="log-in-outline" onPress={() => router.push("/masuk")} />
        </Kartu>
      ) : (
        <>
          {!pengguna.isDemo ? (
            <Kartu style={{ gap: jarak.m }}>
              <Baris ikon="swap-horizontal" teks="Ganti peran kapan saja. Data Anda tetap tersimpan." />
              <PesanGalat>{galat}</PesanGalat>
              <Tombol
                jenis="kedua"
                label={`Ganti ke ${peranLain === "peternak" ? "Peternak" : "Pengguna"}`}
                memuat={proses === "peran"}
                nonaktif={proses !== null}
                onPress={gantiPeran}
              />
            </Kartu>
          ) : null}
          <Tombol
            jenis="hantu"
            ikon="log-out-outline"
            label="Keluar"
            memuat={proses === "keluar"}
            nonaktif={proses !== null}
            onPress={konfirmasiKeluar}
          />
        </>
      )}

      {__DEV__ ? (
        <Teks redup style={{ fontSize: huruf.kecil, textAlign: "center" }}>
          API: {API_URL}
        </Teks>
      ) : null}
    </Layar>
  );
}

function Baris({ ikon, teks }: { ikon: "phone-portrait-outline" | "cloud-outline" | "swap-horizontal"; teks: string }) {
  return (
    <View style={{ flexDirection: "row", gap: jarak.m, alignItems: "center" }}>
      <View style={gaya.ikonBaris}>
        <Ionicons name={ikon} size={20} color={warna.aksenTeks} />
      </View>
      <Teks style={{ flex: 1 }}>{teks}</Teks>
    </View>
  );
}

const gaya = StyleSheet.create({
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: warna.aksenLembut,
    alignItems: "center",
    justifyContent: "center",
  },
  inisial: { fontSize: huruf.besar, fontWeight: "700", color: warna.aksenTeks },
  nama: { fontSize: huruf.judul - 2, fontWeight: "700", color: warna.tinta },
  ikonBaris: {
    width: 40,
    height: 40,
    borderRadius: sudut.s + 2,
    backgroundColor: warna.krem,
    alignItems: "center",
    justifyContent: "center",
  },
});
