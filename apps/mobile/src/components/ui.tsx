import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps, ReactNode, Ref } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { bayangan, huruf, jarak, sudut, warna } from "@/lib/tema";

export type NamaIkon = ComponentProps<typeof Ionicons>["name"];

/** Kerangka layar: latar krem, aman dari notch, isi bisa digulir. */
export function Layar({
  children,
  gulir = true,
  kepala,
  refGulir,
}: {
  children: ReactNode;
  gulir?: boolean;
  refGulir?: Ref<ScrollViewInstance>;
  /** Kepala tetap (tidak ikut digulir), misalnya KepalaLayar atau kolom cari. */
  kepala?: ReactNode;
}) {
  return (
    <SafeAreaView style={gaya.layar} edges={["top", "left", "right"]}>
      {kepala ? <View style={gaya.kepalaTetap}>{kepala}</View> : null}
      {gulir ? (
        <ScrollView
          ref={refGulir}
          contentContainerStyle={gaya.isiLayar}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[gaya.isiLayar, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

/** Tombol ikon bulat putih seperti tombol kalender/lonceng di kepala layar. */
export function TombolIkon({
  ikon,
  label,
  onPress,
  titik,
  gelap,
}: {
  ikon: NamaIkon;
  label: string;
  onPress?: () => void;
  /** Titik oranye kecil (misalnya ada peringatan). */
  titik?: boolean;
  gelap?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        gaya.tombolIkon,
        gelap && { backgroundColor: warna.gelap },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Ionicons name={ikon} size={22} color={gelap ? warna.putih : warna.tinta} />
      {titik ? <View style={gaya.titik} /> : null}
    </Pressable>
  );
}

/** Kepala layar: tombol bulat kiri, judul kecil di tengah, tombol bulat kanan. */
export function KepalaLayar({
  judul,
  kiri,
  kanan,
}: {
  judul: string;
  kiri?: ReactNode;
  kanan?: ReactNode;
}) {
  return (
    <View style={gaya.kepala}>
      <View style={gaya.slotKepala}>{kiri}</View>
      <Text style={gaya.judulKepala} accessibilityRole="header" numberOfLines={1}>
        {judul}
      </Text>
      <View style={[gaya.slotKepala, { alignItems: "flex-end" }]}>{kanan}</View>
    </View>
  );
}

export function Judul({ children, style }: { children: ReactNode; style?: TextProps["style"] }) {
  return (
    <Text style={[gaya.judul, style]} accessibilityRole="header">
      {children}
    </Text>
  );
}

/** Judul bagian dengan lencana jumlah dan tautan aksi di kanan ("Lihat semua"). */
export function JudulBagian({
  children,
  jumlah,
  aksi,
  onAksi,
}: {
  children: ReactNode;
  jumlah?: number;
  aksi?: string;
  onAksi?: () => void;
}) {
  return (
    <View style={gaya.judulBagian}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: jarak.s, flexShrink: 1 }}>
        <Text style={gaya.teksJudulBagian} accessibilityRole="header">
          {children}
        </Text>
        {jumlah !== undefined ? (
          <View style={gaya.lencana}>
            <Text style={gaya.teksLencana}>{jumlah}</Text>
          </View>
        ) : null}
      </View>
      {aksi && onAksi ? (
        <Pressable accessibilityRole="button" onPress={onAksi} hitSlop={10}>
          <Text style={gaya.aksiBagian}>{aksi}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Teks({ redup, style, ...props }: TextProps & { redup?: boolean }) {
  return <Text {...props} style={[gaya.teks, redup && { color: warna.tintaRedup }, style]} />;
}

export function Kartu({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[gaya.kartu, style]}>{children}</View>;
}

/** Pil kecil untuk status ("Tersinkron", "Menunggu dikirim"). */
export function Pil({
  label,
  nada = "netral",
  ikon,
}: {
  label: string;
  nada?: "netral" | "aksen" | "hijau" | "bahaya";
  ikon?: NamaIkon;
}) {
  const latar = {
    netral: warna.kremTua,
    aksen: warna.aksenLembut,
    hijau: warna.hijauLembut,
    bahaya: warna.bahayaLembut,
  }[nada];
  const teks = {
    netral: warna.tintaRedup,
    aksen: warna.aksenTeks,
    hijau: warna.hijau,
    bahaya: warna.bahaya,
  }[nada];
  return (
    <View style={[gaya.pil, { backgroundColor: latar }]}>
      {ikon ? <Ionicons name={ikon} size={14} color={teks} /> : null}
      <Text style={[gaya.teksPil, { color: teks }]}>{label}</Text>
    </View>
  );
}

type JenisTombol = "utama" | "aksen" | "kedua" | "hantu";

export function Tombol({
  label,
  onPress,
  jenis = "utama",
  memuat,
  nonaktif,
  ikon,
}: {
  label: string;
  onPress: () => void;
  jenis?: JenisTombol;
  memuat?: boolean;
  nonaktif?: boolean;
  ikon?: NamaIkon;
}) {
  const mati = nonaktif || memuat;
  const warnaTeks = jenis === "utama" || jenis === "aksen" ? warna.putih : warna.tinta;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!mati, busy: !!memuat }}
      disabled={mati}
      onPress={onPress}
      style={({ pressed }) => [
        gaya.tombol,
        jenis === "utama" && { backgroundColor: warna.gelap },
        jenis === "aksen" && { backgroundColor: warna.aksen },
        jenis === "kedua" && {
          backgroundColor: warna.putih,
          borderColor: warna.kremGaris,
          borderWidth: 1.5,
        },
        jenis === "hantu" && { backgroundColor: "transparent" },
        (pressed || mati) && { opacity: 0.65 },
      ]}
    >
      {memuat ? (
        <ActivityIndicator color={warnaTeks} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: jarak.s }}>
          {ikon ? <Ionicons name={ikon} size={20} color={warnaTeks} /> : null}
          <Text style={[gaya.labelTombol, { color: warnaTeks }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Masukan({
  label,
  akhiran,
  ...props
}: TextInputProps & { label: string; akhiran?: string }) {
  return (
    <View style={{ gap: jarak.xs }}>
      <Text style={gaya.labelMasukan}>{label}</Text>
      <View style={gaya.bingkaiMasukan}>
        <TextInput
          placeholderTextColor={warna.tintaRedup}
          accessibilityLabel={label}
          {...props}
          style={[gaya.masukan, props.style]}
        />
        {akhiran ? <Text style={gaya.akhiran}>{akhiran}</Text> : null}
      </View>
    </View>
  );
}

export function PesanGalat({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <View style={gaya.galat} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={20} color={warna.bahaya} />
      <Text style={{ color: warna.bahaya, fontSize: huruf.isi, flex: 1 }}>{children}</Text>
    </View>
  );
}

const gaya = StyleSheet.create({
  layar: { flex: 1, backgroundColor: warna.krem },
  kepalaTetap: { paddingHorizontal: jarak.l, paddingTop: jarak.s, paddingBottom: jarak.s },
  isiLayar: { padding: jarak.l, gap: jarak.l, paddingBottom: jarak.xxl },
  kepala: { flexDirection: "row", alignItems: "center", minHeight: 52 },
  slotKepala: { width: 56 },
  judulKepala: {
    flex: 1,
    textAlign: "center",
    fontSize: huruf.isi,
    fontWeight: "600",
    color: warna.tinta,
  },
  tombolIkon: {
    width: 52,
    height: 52,
    borderRadius: sudut.m,
    backgroundColor: warna.putih,
    alignItems: "center",
    justifyContent: "center",
    ...bayangan,
  },
  titik: {
    position: "absolute",
    top: 13,
    right: 14,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: warna.aksen,
    borderWidth: 1.5,
    borderColor: warna.putih,
  },
  judul: {
    fontSize: huruf.judul,
    fontWeight: "700",
    color: warna.tinta,
    letterSpacing: -0.5,
  },
  judulBagian: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: jarak.m,
  },
  teksJudulBagian: { fontSize: huruf.sub + 2, fontWeight: "600", color: warna.tinta },
  lencana: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: warna.aksen,
    alignItems: "center",
    justifyContent: "center",
  },
  teksLencana: { color: warna.putih, fontSize: 12, fontWeight: "700" },
  aksiBagian: { fontSize: huruf.kecil + 1, color: warna.tintaRedup, fontWeight: "600" },
  teks: { fontSize: huruf.isi, color: warna.tinta, lineHeight: 23 },
  kartu: {
    backgroundColor: warna.putih,
    borderRadius: sudut.xl,
    padding: jarak.l + 2,
    gap: jarak.s,
    ...bayangan,
  },
  pil: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    borderRadius: sudut.bulat,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  teksPil: { fontSize: 13, fontWeight: "700" },
  tombol: {
    minHeight: 56,
    borderRadius: sudut.l,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: jarak.l,
  },
  labelTombol: { fontSize: huruf.sub - 1, fontWeight: "600" },
  labelMasukan: { fontSize: huruf.kecil, fontWeight: "600", color: warna.tintaRedup },
  bingkaiMasukan: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
    borderRadius: sudut.m,
    backgroundColor: warna.krem,
    paddingHorizontal: jarak.m,
  },
  masukan: { flex: 1, minWidth: 0, minHeight: 54, fontSize: huruf.sub, color: warna.tinta },
  akhiran: { fontSize: huruf.isi, color: warna.tintaRedup, fontWeight: "600", marginLeft: jarak.s },
  galat: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: jarak.s,
    backgroundColor: warna.bahayaLembut,
    borderRadius: sudut.m,
    padding: jarak.m,
  },
});
