import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { evaluateAlerts, formatAngka } from "@ternakin/shared";
import { GaugeBusur } from "@/components/GaugeBusur";
import { KartuCatatan } from "@/components/KartuCatatan";
import { PengingatMasuk } from "@/components/PengingatMasuk";
import { JudulBagian, Kartu, KepalaLayar, Layar, Teks, Tombol, TombolIkon } from "@/components/ui";
import { labelTanggal, tanggalLokal, useDataKandang } from "@/lib/kandang";
import { useReferensi } from "@/lib/referensi";
import { useSesi } from "@/lib/sesi";
import { huruf, jarak, sudut, warna } from "@/lib/tema";

function bukaCatatan(tanggal?: string) {
  router.navigate(tanggal ? { pathname: "/catatan", params: { tanggal } } : "/catatan");
}

export default function Beranda() {
  const { peran } = useSesi();
  return peran === "peternak" ? <BerandaPeternak /> : <BerandaPengguna />;
}

function BerandaPeternak() {
  const { pengguna } = useSesi();
  const { kandang, catatan, semuaCatatan, siap } = useDataKandang();
  const { referensi } = useReferensi();
  const hariIni = tanggalLokal();
  const catatanHariIni = catatan.find((c) => c.tanggal === hariIni);

  const peringatan = useMemo(
    () =>
      kandang && referensi
        ? evaluateAlerts(semuaCatatan, kandang, referensi.ambangPeringatan)
        : [],
    [kandang, referensi, semuaCatatan],
  );

  const telur = catatanHariIni?.telur ?? null;
  const ekor = kandang?.jumlahEkor ?? 0;
  const persen = telur !== null && ekor > 0 ? (telur / ekor) * 100 : 0;

  return (
    <Layar
      kepala={
        <KepalaLayar
          judul={kandang?.nama ?? "Beranda"}
          kiri={<TombolIkon ikon="calendar-outline" label="Buka catatan harian" onPress={() => bukaCatatan()} />}
          kanan={
            <TombolIkon
              ikon="notifications-outline"
              label={peringatan.length ? `${peringatan.length} peringatan` : "Tidak ada peringatan"}
              titik={peringatan.length > 0}
              onPress={() => bukaCatatan()}
            />
          }
        />
      }
    >
      <PengingatMasuk />
      {!siap ? null : !kandang ? (
        <Kartu style={{ alignItems: "center", paddingVertical: jarak.xl }}>
          <Image source={require("@/assets/images/kokok.webp")} style={gaya.kokokBesar} contentFit="contain" />
          <Text style={gaya.judulKosong}>
            {pengguna?.nama ? `Halo, ${pengguna.nama}!` : "Halo, Peternak!"}
          </Text>
          <Teks redup style={{ textAlign: "center" }}>
            Siapkan profil kandang dulu supaya produksi telur, pakan, dan suhu bisa dipantau tiap hari.
          </Teks>
          <View style={{ alignSelf: "stretch", marginTop: jarak.s }}>
            <Tombol label="Siapkan Kandang" ikon="add" onPress={() => bukaCatatan()} />
          </View>
        </Kartu>
      ) : (
        <>
          <GaugeBusur
            nilai={persen / 100}
            label={`Produksi telur hari ini ${formatAngka(persen, 0)} persen dari ${ekor} ekor`}
          >
            <Ionicons name="egg" size={22} color={warna.aksen} />
            <Text style={gaya.tanggalGauge}>{labelTanggal(hariIni)}</Text>
            <Text style={gaya.angkaGauge} numberOfLines={1} adjustsFontSizeToFit>
              {telur === null ? "—" : formatAngka(telur, 0)} <Text style={gaya.satuanGauge}>butir</Text>
            </Text>
            <Text style={gaya.ketGauge}>
              {telur === null ? "Belum dicatat" : `${formatAngka(persen, 0)}% dari ${formatAngka(ekor, 0)} ekor`}
            </Text>
          </GaugeBusur>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={catatanHariIni ? "Ubah catatan hari ini" : "Isi catatan hari ini"}
            onPress={() => bukaCatatan(hariIni)}
            style={({ pressed }) => [gaya.tombolTambah, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name={catatanHariIni ? "create-outline" : "add"} size={26} color={warna.tinta} />
            <Text style={gaya.teksTambah}>
              {catatanHariIni ? "Ubah catatan hari ini" : "Isi catatan hari ini"}
            </Text>
          </Pressable>

          {peringatan.map((p) => (
            <Kartu key={p.id} style={gaya.kartuPeringatan}>
              <View style={{ flexDirection: "row", gap: jarak.s, alignItems: "center" }}>
                <Ionicons name="warning" size={22} color={p.tingkat === "tinggi" ? warna.bahaya : warna.aksenTeks} />
                <Text style={gaya.judulPeringatan}>{p.judul}</Text>
              </View>
              <Teks>{p.alasan}</Teks>
              <Pressable accessibilityRole="button" onPress={() => router.navigate("/kokok")} hitSlop={8}>
                <Text style={gaya.tautan}>Tanya Kokok soal ini →</Text>
              </Pressable>
            </Kartu>
          ))}

          {catatan.length > 0 ? (
            <>
              <JudulBagian jumlah={catatan.length} aksi="Lihat semua" onAksi={() => bukaCatatan()}>
                Catatan Terakhir
              </JudulBagian>
              {catatan.slice(0, 3).map((c) => (
                <KartuCatatan key={c.id} catatan={c} ekor={ekor} onPress={() => bukaCatatan(c.tanggal)} />
              ))}
            </>
          ) : null}
        </>
      )}
    </Layar>
  );
}

function BerandaPengguna() {
  const { pengguna } = useSesi();
  return (
    <Layar
      kepala={
        <KepalaLayar
          judul="Beranda"
          kanan={<TombolIkon ikon="person-outline" label="Akun" onPress={() => router.navigate("/profil")} />}
        />
      }
    >
      <Text style={gaya.sapaanBesar}>
        {pengguna?.nama ? `Halo, ${pengguna.nama}` : "Halo"}
        {"\n"}
        <Text style={{ color: warna.tintaRedup }}>mau tanya apa hari ini?</Text>
      </Text>

      <Pressable accessibilityRole="button" onPress={() => router.navigate("/kokok")}>
        {({ pressed }) => (
          <View style={[gaya.heroKokok, pressed && { opacity: 0.9 }]}>
            <View style={{ flex: 1, gap: jarak.s }}>
              <Text style={gaya.judulHero}>Tanya Kokok</Text>
              <Text style={gaya.isiHero}>Seputar beternak ayam, pakan, kesehatan, dan peluang usaha.</Text>
              <View style={gaya.tombolHero}>
                <Text style={{ color: warna.putih, fontWeight: "600" }}>Mulai bertanya</Text>
              </View>
            </View>
            <Image source={require("@/assets/images/kokok.webp")} style={{ width: 110, height: 110 }} contentFit="contain" />
          </View>
        )}
      </Pressable>

      <Kartu>
        <View style={{ flexDirection: "row", alignItems: "center", gap: jarak.s }}>
          <Ionicons name="trending-up" size={22} color={warna.aksenTeks} />
          <Text style={gaya.judulCatatan}>Investasi peternakan</Text>
        </View>
        <Teks redup>
          Daftar peluang investasi (simulasi) sementara dibuka lewat web Ternakin. Versi aplikasi menyusul.
        </Teks>
      </Kartu>
    </Layar>
  );
}

const gaya = StyleSheet.create({
  kokokBesar: { width: 120, height: 120 },
  judulKosong: { fontSize: huruf.judul - 2, fontWeight: "700", color: warna.tinta },
  tanggalGauge: { fontSize: huruf.isi, color: warna.tinta, marginTop: 2 },
  angkaGauge: { fontSize: huruf.besar, fontWeight: "600", color: warna.tinta, letterSpacing: -1 },
  satuanGauge: { fontSize: huruf.sub, fontWeight: "500" },
  ketGauge: { fontSize: huruf.kecil + 1, color: warna.aksenTeks, fontWeight: "500" },
  tombolTambah: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: jarak.s,
    minHeight: 56,
    borderRadius: sudut.l,
    backgroundColor: warna.kremTua,
  },
  teksTambah: { fontSize: huruf.isi, fontWeight: "600", color: warna.tinta },
  kartuPeringatan: { backgroundColor: warna.aksenLembut, shadowOpacity: 0, elevation: 0 },
  judulPeringatan: { fontSize: huruf.sub, fontWeight: "700", color: warna.tinta, flex: 1 },
  tautan: { fontSize: huruf.isi, fontWeight: "700", color: warna.aksenTeks },
  judulCatatan: { fontSize: huruf.sub, fontWeight: "600", color: warna.tinta },
  sapaanBesar: { fontSize: huruf.judul + 2, lineHeight: 34, fontWeight: "700", color: warna.tinta, letterSpacing: -0.5 },
  heroKokok: {
    flexDirection: "row",
    alignItems: "center",
    gap: jarak.m,
    backgroundColor: warna.aksenLembut,
    borderRadius: sudut.xl,
    padding: jarak.l + 2,
  },
  judulHero: { fontSize: huruf.judul - 2, fontWeight: "700", color: warna.tinta },
  isiHero: { fontSize: huruf.isi, lineHeight: 22, color: warna.tinta },
  tombolHero: {
    alignSelf: "flex-start",
    backgroundColor: warna.gelap,
    borderRadius: sudut.bulat,
    paddingHorizontal: jarak.l,
    paddingVertical: jarak.s + 2,
    marginTop: jarak.xs,
  },
});
