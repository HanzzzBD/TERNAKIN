import { Image } from "expo-image";
import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Tombol } from "@/components/ui";
import { useSambutan } from "@/lib/sambutan";
import { huruf, jarak, sudut, warna } from "@/lib/tema";

interface Penanda {
  label: string;
  /** Posisi horizontal dalam persen lebar hero. */
  x: number;
  y: number;
  garis: number;
}

interface Slide {
  id: string;
  judul: string;
  isi: string;
  latar: string;
  penanda: Penanda[];
}

const SLIDE: Slide[] = [
  {
    id: "catatan",
    judul: "Kandang Sehat,\nDipantau Kokok",
    isi: "Catat telur, pakan, dan suhu tiap hari. Kokok memberi tanda bila ada yang tidak biasa.",
    latar: "#fbdcc6",
    penanda: [
      { label: "184 telur", x: 5, y: 48, garis: 120 },
      { label: "29 °C", x: 70, y: 64, garis: 80 },
      { label: "0 mati", x: 68, y: 262, garis: 16 },
    ],
  },
  {
    id: "pakan",
    judul: "Pakan Hemat,\nGizi Tetap SNI",
    isi: "Racik campuran termurah dari bahan yang ada di sekitar. Dihitung langsung di HP, tanpa sinyal.",
    latar: "#f6e2b8",
    penanda: [
      { label: "Jagung 52%", x: 4, y: 48, garis: 120 },
      { label: "Rp5.812/kg", x: 62, y: 64, garis: 80 },
      { label: "Dedak 18%", x: 62, y: 262, garis: 16 },
    ],
  },
  {
    id: "kokok",
    judul: "Bingung Soal Ayam?\nTanya Kokok",
    isi: "Ceritakan gejala atau tanya seputar pakan dan kandang. Kokok menjawab dengan bahasa sehari-hari.",
    latar: "#dfe9d8",
    penanda: [
      { label: "Ayam lesu?", x: 4, y: 48, garis: 120 },
      { label: "Kandang panas?", x: 54, y: 64, garis: 80 },
      { label: "Telur turun?", x: 58, y: 262, garis: 16 },
    ],
  },
];

export default function SambutanLayar() {
  const { tandaiSelesai } = useSambutan();
  const { width } = useWindowDimensions();
  const [indeks, setIndeks] = useState(0);
  const daftar = useRef<FlatList<Slide>>(null);
  const terakhir = indeks === SLIDE.length - 1;

  function saatGulir(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== indeks) setIndeks(i);
  }

  function lanjut() {
    if (terakhir) {
      tandaiSelesai();
      return;
    }
    daftar.current?.scrollToIndex({ index: indeks + 1, animated: true });
  }

  return (
    <SafeAreaView style={gaya.layar} edges={["top", "bottom"]}>
      <View style={gaya.atas}>
        <Pressable accessibilityRole="button" onPress={tandaiSelesai} hitSlop={12}>
          <Text style={gaya.lewati}>Lewati</Text>
        </Pressable>
      </View>

      <FlatList
        ref={daftar}
        data={SLIDE}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={saatGulir}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: jarak.l }}>
            <View style={[gaya.hero, { backgroundColor: item.latar }]}>
              <View style={gaya.lingkaran} />
              <Image
                source={require("@/assets/images/kokok.webp")}
                style={gaya.kokok}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
              {item.penanda.map((p) => (
                <View
                  key={p.label}
                  style={[gaya.penanda, { left: `${p.x}%`, top: p.y }]}
                  pointerEvents="none"
                >
                  <View style={gaya.pilPenanda}>
                    <Text style={gaya.teksPenanda}>{p.label}</Text>
                  </View>
                  <View style={[gaya.garis, { height: p.garis }]} />
                  <View style={gaya.titik} />
                </View>
              ))}
            </View>
            <Text style={gaya.judul} accessibilityRole="header">
              {item.judul}
            </Text>
            <Text style={gaya.isi}>{item.isi}</Text>
          </View>
        )}
      />

      <View style={gaya.bawah}>
        <View style={gaya.titikHalaman} accessibilityLabel={`Halaman ${indeks + 1} dari ${SLIDE.length}`}>
          {SLIDE.map((s, i) => (
            <View key={s.id} style={[gaya.titikKecil, i === indeks && gaya.titikKecilAktif]} />
          ))}
        </View>
        <Tombol label={terakhir ? "Mulai Sekarang" : "Lanjut"} onPress={lanjut} />
      </View>
    </SafeAreaView>
  );
}

const gaya = StyleSheet.create({
  layar: { flex: 1, backgroundColor: warna.krem },
  atas: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: jarak.xl, paddingVertical: jarak.s },
  lewati: { fontSize: huruf.isi, color: warna.tintaRedup, fontWeight: "600" },
  hero: {
    height: 360,
    borderRadius: sudut.xl + 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  lingkaran: {
    position: "absolute",
    bottom: -90,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  kokok: { width: 230, height: 230, marginBottom: 6 },
  penanda: { position: "absolute", alignItems: "center" },
  pilPenanda: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: sudut.bulat,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  teksPenanda: { fontSize: huruf.isi, fontWeight: "600", color: warna.tinta },
  garis: { width: 1.5, backgroundColor: "rgba(255,255,255,0.9)" },
  titik: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: warna.putih,
    borderWidth: 3,
    borderColor: warna.aksen,
    marginTop: -2,
  },
  judul: {
    marginTop: jarak.xl,
    fontSize: huruf.besar,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -1,
    color: warna.tinta,
    textAlign: "center",
  },
  isi: {
    marginTop: jarak.m,
    fontSize: huruf.isi + 1,
    lineHeight: 25,
    color: warna.tintaRedup,
    textAlign: "center",
    paddingHorizontal: jarak.s,
  },
  bawah: { paddingHorizontal: jarak.l, paddingBottom: jarak.m, gap: jarak.l },
  titikHalaman: { flexDirection: "row", justifyContent: "center", gap: 6 },
  titikKecil: { width: 7, height: 7, borderRadius: 4, backgroundColor: warna.kremGaris },
  titikKecilAktif: { width: 22, backgroundColor: warna.gelap },
});
