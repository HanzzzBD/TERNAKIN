import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { kokokObrolanResponseSchema, type AksiObrolan, type PesanRiwayat } from "@ternakin/shared";
import { GalatApi, panggilApi, pesanGalat } from "@/lib/api";
import { ambilPerangkatId } from "@/lib/penyimpanan";
import { useSesi } from "@/lib/sesi";
import { Kartu, KepalaLayar, Teks, Tombol, TombolIkon } from "@/components/ui";
import { bayangan, huruf, jarak, sudut, warna } from "@/lib/tema";

interface Pesan extends PesanRiwayat {
  id: string;
  aksi?: AksiObrolan;
  galat?: boolean;
}

const SAPAAN: Pesan = {
  id: "sapaan",
  dari: "kokok",
  teks: "Halo, saya Kokok. Ceritakan kondisi ayam Bapak/Ibu, atau tanya seputar pakan dan kandang.",
};

const MAKS_RIWAYAT = 8;

export default function KokokLayar() {
  const { pengguna } = useSesi();
  // Kokok khusus akun (termasuk akun demo); tamu tetap bisa memakai pakan dan catatan.
  return pengguna ? <ObrolanKokok /> : <AjakMasukKokok />;
}

function AjakMasukKokok() {
  return (
    <SafeAreaView style={gaya.layar} edges={["top", "left", "right"]}>
      <View style={gaya.kepala}>
        <KepalaLayar judul="Tanya Kokok" />
      </View>
      <View style={gaya.ajakan}>
        <Kartu style={gaya.kartuAjakan}>
          <Image
            source={require("@/assets/images/kokok.webp")}
            style={{ width: 96, height: 96 }}
            contentFit="contain"
          />
          <Text style={gaya.judulAjakan}>Masuk untuk bertanya ke Kokok</Text>
          <Teks redup style={{ textAlign: "center" }}>
            Kokok khusus untuk pengguna yang sudah masuk. Daftar gratis dengan email, Google, atau
            WhatsApp. Hitung pakan dan catatan harian tetap bisa dipakai tanpa akun.
          </Teks>
          <View style={{ alignSelf: "stretch", gap: jarak.s, marginTop: jarak.s }}>
            <Tombol
              label="Masuk atau daftar"
              ikon="log-in-outline"
              onPress={() => router.navigate("/masuk")}
            />
            <Tombol
              label="Hitung pakan"
              jenis="kedua"
              ikon="calculator-outline"
              onPress={() => router.navigate("/pakan")}
            />
          </View>
        </Kartu>
      </View>
    </SafeAreaView>
  );
}

function ObrolanKokok() {
  const { peran, segarkan } = useSesi();
  const [pesan, setPesan] = useState<Pesan[]>([SAPAAN]);
  const [draf, setDraf] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const daftar = useRef<FlatList<Pesan>>(null);

  async function kirim() {
    const isi = draf.trim();
    if (!isi || mengirim) return;
    const milikAnda: Pesan = { id: `a-${Date.now()}`, dari: "anda", teks: isi };
    const riwayat = pesan
      .filter((p) => p.id !== "sapaan" && !p.galat)
      .slice(-MAKS_RIWAYAT)
      .map(({ dari, teks }) => ({ dari, teks }));
    setPesan((lama) => [...lama, milikAnda]);
    setDraf("");
    setMengirim(true);
    try {
      const res = await panggilApi("/v1/kokok/obrolan", {
        body: { pesan: isi, riwayat, konteks: "aplikasi", perangkatId: await ambilPerangkatId() },
        skema: kokokObrolanResponseSchema,
        batasWaktu: 45_000,
      });
      setPesan((lama) => [
        ...lama,
        { id: `k-${Date.now()}`, dari: "kokok", teks: res.balasan, aksi: res.aksi },
      ]);
    } catch (err) {
      // Sesi berakhir di server: segarkan agar layar kembali ke ajakan masuk.
      if (err instanceof GalatApi && err.status === 401) void segarkan();
      setPesan((lama) => [
        ...lama,
        { id: `g-${Date.now()}`, dari: "kokok", teks: pesanGalat(err), galat: true },
      ]);
    } finally {
      setMengirim(false);
    }
  }

  function tombolAksi(aksi?: AksiObrolan) {
    if (aksi === "hitung_pakan" && peran === "peternak") {
      return <Chip label="Buka Hitung Pakan" onPress={() => router.navigate("/pakan")} />;
    }
    return null;
  }

  return (
    <SafeAreaView style={gaya.layar} edges={["top", "left", "right"]}>
      <View style={gaya.kepala}>
        <KepalaLayar
          judul="Tanya Kokok"
          kiri={
            <View style={gaya.avatarKokok}>
              <Image source={require("@/assets/images/kokok.webp")} style={{ width: 40, height: 40 }} contentFit="contain" />
            </View>
          }
          kanan={
            <TombolIkon
              ikon="refresh"
              label="Mulai obrolan baru"
              onPress={() => {
                if (!mengirim) setPesan([SAPAAN]);
              }}
            />
          }
        />
        <Text style={gaya.catatan}>
          Kokok bukan dokter hewan. Untuk kematian mendadak atau banyak ayam sakit, segera hubungi
          puskeswan.
        </Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={daftar}
          data={pesan}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: jarak.l, gap: jarak.m }}
          onContentSizeChange={() => daftar.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View
              style={[
                gaya.balon,
                item.dari === "anda" ? gaya.balonAnda : gaya.balonKokok,
                item.galat && gaya.balonGalat,
              ]}
            >
              <Text style={[gaya.teksBalon, item.dari === "anda" && { color: warna.putih }]}>
                {item.teks}
              </Text>
              {item.dari === "kokok" ? tombolAksi(item.aksi) : null}
            </View>
          )}
          ListFooterComponent={
            mengirim ? (
              <View style={[gaya.balon, gaya.balonKokok, { flexDirection: "row", gap: jarak.s }]}>
                <ActivityIndicator color={warna.aksen} />
                <Text style={gaya.teksBalon}>Kokok sedang menulis…</Text>
              </View>
            ) : undefined
          }
        />
        <View style={gaya.bilah}>
          <TextInput
            value={draf}
            onChangeText={setDraf}
            placeholder="Tulis pertanyaan untuk Kokok…"
            placeholderTextColor={warna.tintaRedup}
            style={gaya.masukan}
            multiline
            maxLength={500}
            accessibilityLabel="Pesan untuk Kokok"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kirim"
            onPress={kirim}
            disabled={!draf.trim() || mengirim}
            style={({ pressed }) => [
              gaya.kirim,
              (!draf.trim() || mengirim || pressed) && { opacity: 0.5 },
            ]}
          >
            <Ionicons name="arrow-up" size={24} color={warna.putih} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={gaya.chip}>
      <Text style={{ color: warna.aksenTeks, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

const gaya = StyleSheet.create({
  layar: { flex: 1, backgroundColor: warna.krem },
  kepala: { paddingHorizontal: jarak.l, paddingTop: jarak.s, gap: jarak.s },
  avatarKokok: {
    width: 52,
    height: 52,
    borderRadius: sudut.m,
    backgroundColor: warna.aksenLembut,
    alignItems: "center",
    justifyContent: "center",
  },
  ajakan: { flex: 1, justifyContent: "center", padding: jarak.l },
  kartuAjakan: { alignItems: "center", gap: jarak.s, paddingVertical: jarak.xl },
  judulAjakan: { fontSize: huruf.sub, fontWeight: "800", color: warna.tinta, textAlign: "center" },
  catatan: { fontSize: huruf.kecil, color: warna.tintaRedup, textAlign: "center", lineHeight: 20 },
  balon: { maxWidth: "88%", borderRadius: sudut.l, padding: jarak.m + 2, gap: jarak.s },
  balonKokok: {
    alignSelf: "flex-start",
    backgroundColor: warna.putih,
    borderTopLeftRadius: 6,
    ...bayangan,
  },
  balonAnda: { alignSelf: "flex-end", backgroundColor: warna.gelap, borderTopRightRadius: 6 },
  balonGalat: { backgroundColor: warna.bahayaLembut, shadowOpacity: 0, elevation: 0 },
  teksBalon: { fontSize: huruf.isi, lineHeight: 23, color: warna.tinta },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: warna.aksenLembut,
    borderRadius: sudut.bulat,
    paddingHorizontal: jarak.m,
    paddingVertical: jarak.s,
  },
  bilah: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: jarak.s,
    marginHorizontal: jarak.l,
    marginBottom: jarak.s,
    padding: 6,
    paddingLeft: jarak.l,
    backgroundColor: warna.putih,
    borderRadius: sudut.l,
    ...bayangan,
  },
  masukan: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    paddingVertical: jarak.m,
    fontSize: huruf.isi,
    color: warna.tinta,
  },
  kirim: {
    width: 48,
    height: 48,
    borderRadius: sudut.m,
    backgroundColor: warna.aksen,
    alignItems: "center",
    justifyContent: "center",
  },
});
