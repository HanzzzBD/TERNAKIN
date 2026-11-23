import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { PANJANG_KODE_OTP, type PeranAkun } from "@ternakin/shared";
import { LABEL_PERAN } from "@/lib/akun";
import { huruf, jarak, sudut, warna } from "@/lib/tema";

const PENJELASAN_PERAN: Record<PeranAkun, string> = {
  peternak: "Hitung pakan, catatan harian, tanya Kokok, dan ajukan peluang modal.",
  pengguna: "Tanya Kokok soal ayam peliharaan dan titip modal ke peternak di sekitar.",
};

/** Pilihan peran Peternak / Pengguna (sama dengan web: PilihanPeran). */
export function PilihanPeran({
  nilai,
  onPilih,
  judul = "Saya masuk sebagai",
}: {
  nilai: PeranAkun | null;
  onPilih: (peran: PeranAkun) => void;
  judul?: string;
}) {
  return (
    <View style={{ gap: jarak.s }} accessibilityRole="radiogroup" accessibilityLabel={judul}>
      <Text style={gaya.label}>{judul}</Text>
      {(["peternak", "pengguna"] as const).map((peran) => {
        const dipilih = nilai === peran;
        return (
          <Pressable
            key={peran}
            accessibilityRole="radio"
            accessibilityState={{ checked: dipilih }}
            onPress={() => onPilih(peran)}
            style={[gaya.opsi, dipilih && gaya.opsiDipilih]}
          >
            <View style={[gaya.ikonOpsi, dipilih && { backgroundColor: warna.aksen }]}>
              <Ionicons
                name={peran === "peternak" ? "home" : "trending-up"}
                size={20}
                color={dipilih ? warna.putih : warna.aksenTeks}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={gaya.namaOpsi}>{LABEL_PERAN[peran]}</Text>
              <Text style={gaya.teksOpsi}>{PENJELASAN_PERAN[peran]}</Text>
            </View>
            <Ionicons
              name={dipilih ? "radio-button-on" : "radio-button-off"}
              size={22}
              color={dipilih ? warna.aksen : warna.kremGaris}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

/** Garis pemisah dengan teks di tengah ("atau"). */
export function Pemisah({ teks = "atau" }: { teks?: string }) {
  return (
    <View style={gaya.pemisah} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={gaya.garis} />
      <Text style={gaya.teksPemisah}>{teks}</Text>
      <View style={gaya.garis} />
    </View>
  );
}

/** Isian kode angka besar (OTP WhatsApp atau kode email). */
export function MasukanKode({
  label,
  nilai,
  ubah,
}: {
  label: string;
  nilai: string;
  ubah: (t: string) => void;
}) {
  return (
    <View style={{ gap: jarak.xs }}>
      <Text style={gaya.label}>{label}</Text>
      <TextInput
        value={nilai}
        onChangeText={(t) => ubah(t.replace(/\D/g, "").slice(0, PANJANG_KODE_OTP))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={PANJANG_KODE_OTP}
        placeholder={"•".repeat(PANJANG_KODE_OTP)}
        placeholderTextColor={warna.kremGaris}
        accessibilityLabel={label}
        style={gaya.kode}
      />
    </View>
  );
}

/** Kotak info dengan ikon (mis. mode demo menampilkan kode). */
export function Info({ children, nada = "aksen" }: { children: React.ReactNode; nada?: "aksen" | "netral" }) {
  return (
    <View style={[gaya.info, nada === "netral" && { backgroundColor: warna.krem }]}>
      <Ionicons name="information-circle" size={20} color={nada === "aksen" ? warna.aksenTeks : warna.tintaRedup} />
      <Text style={gaya.teksInfo}>{children}</Text>
    </View>
  );
}

/** Tautan teks kecil ("Lupa kata sandi?"). */
export function TautanTeks({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10} style={{ alignSelf: "center", padding: jarak.xs }}>
      <Text style={gaya.tautan}>{label}</Text>
    </Pressable>
  );
}

/** Hitung mundur detik untuk tombol kirim ulang kode. */
export function useHitungMundur(): [number, (detik: number) => void] {
  const [sisa, setSisa] = useState(0);
  useEffect(() => {
    if (sisa <= 0) return;
    const t = setTimeout(() => setSisa((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sisa]);
  return [sisa, setSisa];
}

const gaya = StyleSheet.create({
  label: { fontSize: huruf.kecil, fontWeight: "600", color: warna.tintaRedup },
  opsi: {
    flexDirection: "row",
    alignItems: "center",
    gap: jarak.m,
    padding: jarak.m,
    borderRadius: sudut.l,
    backgroundColor: warna.krem,
    borderWidth: 2,
    borderColor: "transparent",
  },
  opsiDipilih: { borderColor: warna.aksen, backgroundColor: warna.aksenLembut },
  ikonOpsi: {
    width: 40,
    height: 40,
    borderRadius: sudut.s + 2,
    backgroundColor: warna.putih,
    alignItems: "center",
    justifyContent: "center",
  },
  namaOpsi: { fontSize: huruf.isi, fontWeight: "700", color: warna.tinta },
  teksOpsi: { fontSize: huruf.kecil, color: warna.tintaRedup, lineHeight: 19 },
  pemisah: { flexDirection: "row", alignItems: "center", gap: jarak.m },
  garis: { flex: 1, height: 1, backgroundColor: warna.kremGaris },
  teksPemisah: { fontSize: huruf.kecil, color: warna.tintaRedup, fontWeight: "600" },
  kode: {
    minHeight: 64,
    borderRadius: sudut.m,
    backgroundColor: warna.krem,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 10,
    textAlign: "center",
    color: warna.tinta,
  },
  info: {
    flexDirection: "row",
    gap: jarak.s,
    alignItems: "flex-start",
    backgroundColor: warna.aksenLembut,
    borderRadius: sudut.m,
    padding: jarak.m,
  },
  teksInfo: { flex: 1, fontSize: huruf.isi - 1, lineHeight: 22, color: warna.tinta },
  tautan: { fontSize: huruf.isi, fontWeight: "700", color: warna.aksenTeks },
});
