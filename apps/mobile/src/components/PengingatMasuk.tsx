import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Kartu, Teks, Tombol } from "@/components/ui";
import { useSesi } from "@/lib/sesi";
import { huruf, jarak, warna } from "@/lib/tema";

const KUNCI_DITUTUP = "tk_pengingat_masuk_ditutup";
const JEDA_TAMPIL_ULANG_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Pengingat untuk tamu bahwa data hanya tersimpan di HP ini (sama seperti web). Tamu tetap bebas
 * memakai fitur peternak; "Nanti saja" menyembunyikan pengingat selama 7 hari.
 */
export function PengingatMasuk() {
  const { pengguna, memuat } = useSesi();
  // null = status tutup belum terbaca dari penyimpanan; jangan tampil dulu agar tidak berkedip.
  const [ditutup, setDitutup] = useState<boolean | null>(null);

  useEffect(() => {
    let aktif = true;
    AsyncStorage.getItem(KUNCI_DITUTUP)
      .then((mentah) => {
        const waktu = mentah ? Date.parse(mentah) : Number.NaN;
        if (aktif) setDitutup(Number.isFinite(waktu) && Date.now() - waktu < JEDA_TAMPIL_ULANG_MS);
      })
      .catch(() => aktif && setDitutup(false));
    return () => {
      aktif = false;
    };
  }, []);

  if (memuat || pengguna || ditutup !== false) return null;

  const tutup = () => {
    setDitutup(true);
    AsyncStorage.setItem(KUNCI_DITUTUP, new Date().toISOString()).catch(() => {
      // Abaikan: pengingat tetap tertutup selama aplikasi terbuka
    });
  };

  return (
    <Kartu style={gaya.kartu}>
      <View style={gaya.baris}>
        <Ionicons name="cloud-offline-outline" size={22} color={warna.aksenTeks} />
        <Text style={gaya.judul}>Data Anda hanya tersimpan di HP ini</Text>
      </View>
      <Teks redup>
        Masuk agar catatan kandang tercadang dan bisa dibuka di HP lain, serta untuk bertanya ke
        Kokok. Data yang sudah ada ikut dipindah ke akun Anda.
      </Teks>
      <View style={gaya.aksi}>
        <View style={{ flex: 1 }}>
          <Tombol label="Masuk" ikon="log-in-outline" onPress={() => router.navigate("/masuk")} />
        </View>
        <View style={{ flex: 1 }}>
          <Tombol label="Nanti saja" jenis="hantu" onPress={tutup} />
        </View>
      </View>
    </Kartu>
  );
}

const gaya = StyleSheet.create({
  kartu: { gap: jarak.s, backgroundColor: warna.aksenLembut },
  baris: { flexDirection: "row", alignItems: "center", gap: jarak.s },
  judul: { flex: 1, fontSize: huruf.isi, fontWeight: "700", color: warna.tinta },
  aksi: { flexDirection: "row", gap: jarak.s, marginTop: jarak.xs },
});
