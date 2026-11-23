import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatAngka } from "@ternakin/shared";
import { Pil } from "@/components/ui";
import { labelTanggal, type CatatanLokal } from "@/lib/kandang";
import { bayangan, huruf, jarak, sudut, warna } from "@/lib/tema";

/** Kartu ringkasan satu catatan harian (gaya kartu "Lunch/Breakfast" pada desain acuan). */
export function KartuCatatan({
  catatan: c,
  ekor,
  onPress,
}: {
  catatan: CatatanLokal;
  ekor: number;
  onPress: () => void;
}) {
  const persen = c.telur !== null && ekor > 0 ? (c.telur / ekor) * 100 : null;
  const metrik: [string, string][] = [
    ["Pakan", c.pakanKg === null ? "—" : `${formatAngka(c.pakanKg, 1)} kg`],
    ["Mati", c.kematian === null ? "—" : `${formatAngka(c.kematian, 0)} ekor`],
    ["Suhu", c.suhu === null ? "—" : `${formatAngka(c.suhu, 1)}°C`],
  ];
  const tersinkron = c.syncState === "synced";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Catatan ${labelTanggal(c.tanggal, true)}, ketuk untuk mengubah`}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View style={[gaya.kartu, pressed && { opacity: 0.85 }]}>
          <View style={gaya.barisAtas}>
            <View style={gaya.avatar}>
              <Ionicons name="egg-outline" size={24} color={warna.aksenTeks} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={gaya.judul}>{labelTanggal(c.tanggal, true)}</Text>
              <Pil
                label={tersinkron ? "Tersinkron" : "Menunggu dikirim"}
                nada={tersinkron ? "hijau" : "netral"}
                ikon={tersinkron ? "checkmark-circle" : "cloud-upload-outline"}
              />
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={gaya.angka}>
                {c.telur === null ? "—" : formatAngka(c.telur, 0)}
                <Text style={gaya.satuan}> butir</Text>
              </Text>
              {persen !== null ? (
                <Text style={gaya.persen}>{formatAngka(persen, 0)}% produksi</Text>
              ) : null}
            </View>
          </View>
          <View style={gaya.barisBawah}>
            {metrik.map(([label, nilai]) => (
              <View key={label} style={{ gap: 2 }}>
                <Text style={gaya.labelMetrik}>{label}</Text>
                <Text style={gaya.nilaiMetrik}>{nilai}</Text>
              </View>
            ))}
            <View style={{ flex: 1 }} />
            <Ionicons name="pencil" size={22} color={warna.tinta} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

const gaya = StyleSheet.create({
  kartu: {
    backgroundColor: warna.putih,
    borderRadius: sudut.xl,
    padding: jarak.l,
    gap: jarak.m,
    ...bayangan,
  },
  barisAtas: { flexDirection: "row", alignItems: "center", gap: jarak.m },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: warna.aksenLembut,
    alignItems: "center",
    justifyContent: "center",
  },
  judul: { fontSize: huruf.sub, fontWeight: "600", color: warna.tinta },
  angka: { fontSize: huruf.judul + 2, fontWeight: "600", color: warna.tinta, letterSpacing: -0.5 },
  satuan: { fontSize: huruf.isi, fontWeight: "500" },
  persen: { fontSize: huruf.kecil, color: warna.aksenTeks, fontWeight: "500" },
  barisBawah: { flexDirection: "row", alignItems: "flex-end", gap: jarak.l, paddingLeft: 4 },
  labelMetrik: { fontSize: huruf.kecil, color: warna.tintaRedup },
  nilaiMetrik: { fontSize: huruf.isi, fontWeight: "600", color: warna.tinta },
});
