import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  formatAngka,
  formatPersen,
  formatRupiah,
  optimizeFeed,
  type BahanMaster,
  type FaseAyam,
  type PakanHitungLayak,
  type PakanHitungResult,
  type PakanHitungTakLayak,
} from "@ternakin/shared";
import { JudulBagian, Kartu, Pil, PesanGalat, Teks, Tombol, TombolIkon } from "@/components/ui";
import { useReferensi } from "@/lib/referensi";
import { bayangan, huruf, jarak, sudut, warna } from "@/lib/tema";

const FASE: { id: FaseAyam; nama: string; sub: string; emoji: string }[] = [
  { id: "starter", nama: "Starter", sub: "0–6 mgg", emoji: "🐣" },
  { id: "grower", nama: "Grower", sub: "7–18 mgg", emoji: "🐥" },
  { id: "layer", nama: "Layer", sub: "Bertelur", emoji: "🐔" },
];

const WARNA_KOMPOSISI = ["#f7955c", "#262422", "#f2c48d", "#9c6b4e", "#e9b8a0", "#6f8f72", "#c9b8a6"];
const KUNCI_HARGA = "tk_harga_pakan_v1";

/** "5.800", "5800", "5800,5" → angka; kosong/tidak valid → null. Sama dengan web. */
function uraiHarga(teks: string): number | null {
  const bersih = teks.replace(/\s+/g, "").replace(/^rp/i, "");
  if (!bersih) return null;
  const n = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(bersih)
    ? Number(bersih.replace(/\./g, "").replace(",", "."))
    : Number(bersih.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function PakanLayar() {
  const { referensi, sumber, memuat, muatUlang } = useReferensi();
  const gulir = useRef<ScrollViewInstance>(null);
  const [cari, setCari] = useState("");
  const [fase, setFase] = useState<FaseAyam>("layer");
  const [dipilih, setDipilih] = useState<Record<string, boolean>>({});
  const [harga, setHarga] = useState<Record<string, string>>({});
  const [hargaSekarang, setHargaSekarang] = useState("");
  const [galat, setGalat] = useState("");
  const [menghitung, setMenghitung] = useState(false);
  const [hasil, setHasil] = useState<PakanHitungResult | null>(null);
  const posisiHasil = useRef(0);

  // Harga dan pilihan terakhir diingat agar peternak tidak mengetik ulang setiap kali.
  useEffect(() => {
    AsyncStorage.getItem(KUNCI_HARGA)
      .then((t) => {
        if (!t) return;
        const simpan = JSON.parse(t) as { harga?: Record<string, string>; dipilih?: Record<string, boolean> };
        if (simpan.harga) setHarga(simpan.harga);
        if (simpan.dipilih) setDipilih(simpan.dipilih);
      })
      .catch(() => {});
  }, []);

  const daftarBahan = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    const semua = referensi?.bahan ?? [];
    if (!kata) return semua;
    return semua.filter(
      (b) => b.nama.toLowerCase().includes(kata) || b.sinonim.some((s) => s.toLowerCase().includes(kata)),
    );
  }, [referensi, cari]);

  const jumlahDipilih = referensi?.bahan.filter((b) => dipilih[b.id]).length ?? 0;

  function alihkan(id: string) {
    setDipilih((d) => ({ ...d, [id]: !d[id] }));
    setGalat("");
  }

  async function hitung() {
    if (!referensi) return;
    const bahan = referensi.bahan
      .filter((b) => dipilih[b.id])
      .map((b) => ({ bahanId: b.id, hargaPerKg: uraiHarga(harga[b.id] ?? "") }));
    if (bahan.length === 0 || bahan.some((b) => b.hargaPerKg === null)) {
      setGalat("Pilih minimal satu bahan dan isi harga per kg lebih dari 0.");
      return;
    }
    setGalat("");
    setMenghitung(true);
    void AsyncStorage.setItem(KUNCI_HARGA, JSON.stringify({ harga, dipilih })).catch(() => {});
    // Beri satu frame agar indikator memuat sempat tampil sebelum solver berjalan.
    await new Promise((r) => setTimeout(r, 16));
    try {
      const h = optimizeFeed({
        request: {
          jenisAyam: "petelur",
          fase,
          bahan: bahan.map((b) => ({ bahanId: b.bahanId, hargaPerKg: b.hargaPerKg as number })),
          biayaSekarangPerKg: uraiHarga(hargaSekarang) ?? undefined,
        },
        katalogBahan: referensi.bahan,
        kebutuhanGizi: referensi.kebutuhanGizi,
        catatanData: referensi.catatanData,
        isDemo: referensi.isDemo,
      });
      setHasil(h);
      setTimeout(() => gulir.current?.scrollTo({ y: posisiHasil.current, animated: true }), 80);
    } finally {
      setMenghitung(false);
    }
  }

  function tambahSaran(id: string) {
    setDipilih((d) => ({ ...d, [id]: true }));
    setHasil(null);
  }

  return (
    <SafeAreaView style={gaya.layar} edges={["top", "left", "right"]}>
      <View style={gaya.kepala}>
        <View style={gaya.kolomCari}>
          <Ionicons name="search" size={22} color={warna.tinta} />
          <TextInput
            value={cari}
            onChangeText={setCari}
            placeholder="Cari bahan pakan"
            placeholderTextColor={warna.tintaRedup}
            style={gaya.masukanCari}
            accessibilityLabel="Cari bahan pakan"
            returnKeyType="search"
          />
          {cari ? (
            <Pressable accessibilityLabel="Hapus pencarian" onPress={() => setCari("")} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color={warna.tintaRedup} />
            </Pressable>
          ) : null}
        </View>
        <TombolIkon ikon="refresh" label="Muat ulang data bahan" onPress={() => void muatUlang()} />
      </View>

      <ScrollView
        ref={gulir}
        contentContainerStyle={gaya.isi}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={gaya.barisFase}>
          {FASE.map((f) => {
            const aktif = f.id === fase;
            return (
              <Pressable
                key={f.id}
                accessibilityRole="button"
                accessibilityState={{ selected: aktif }}
                accessibilityLabel={`Fase ${f.nama}, ${f.sub}`}
                onPress={() => {
                  setFase(f.id);
                  setHasil(null);
                }}
                style={{ alignItems: "center", gap: 6 }}
              >
                <View style={[gaya.ubinFase, aktif && gaya.ubinFaseAktif]}>
                  <Text style={gaya.emoji}>{f.emoji}</Text>
                </View>
                <Text style={[gaya.namaFase, aktif && { color: warna.tinta, fontWeight: "700" }]}>{f.nama}</Text>
                <Text style={gaya.subFase}>{f.sub}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {memuat && !referensi ? (
          <View style={{ padding: jarak.xl }} accessibilityLabel="Memuat daftar bahan pakan">
            <ActivityIndicator color={warna.aksen} size="large" />
          </View>
        ) : !referensi ? (
          <PesanGalat>Data bahan pakan belum tersedia. Sambungkan internet lalu ketuk muat ulang.</PesanGalat>
        ) : (
          <>
            {referensi.isDemo ? (
              <View style={gaya.infoData}>
                <Pil label={sumber === "server" ? "Data contoh" : "Data contoh · offline"} nada="aksen" ikon="information-circle" />
                <Teks redup style={{ fontSize: huruf.kecil, lineHeight: 20 }}>{referensi.catatanData}</Teks>
              </View>
            ) : null}

            <JudulBagian
              jumlah={jumlahDipilih}
              aksi={jumlahDipilih ? "Reset" : undefined}
              onAksi={() => {
                setDipilih({});
                setHasil(null);
              }}
            >
              Bahan & Harga
            </JudulBagian>

            {daftarBahan.length === 0 ? <Teks redup>Tidak ada bahan yang cocok dengan “{cari}”.</Teks> : null}
            {daftarBahan.map((b) => (
              <KartuBahan
                key={b.id}
                bahan={b}
                dipilih={!!dipilih[b.id]}
                harga={harga[b.id] ?? ""}
                onAlih={() => alihkan(b.id)}
                onHarga={(t) => setHarga((h) => ({ ...h, [b.id]: t }))}
              />
            ))}

            <Kartu style={{ gap: jarak.s }}>
              <Text style={gaya.labelKecil}>Harga pakan yang dipakai sekarang (boleh kosong)</Text>
              <View style={gaya.barisHarga}>
                <Text style={gaya.rp}>Rp</Text>
                <TextInput
                  value={hargaSekarang}
                  onChangeText={setHargaSekarang}
                  keyboardType="numeric"
                  placeholder="7.500"
                  placeholderTextColor={warna.kremGaris}
                  style={gaya.masukanHarga}
                  accessibilityLabel="Harga pakan sekarang per kg"
                />
                <Text style={gaya.perKg}>/kg</Text>
              </View>
            </Kartu>

            <PesanGalat>{galat}</PesanGalat>
            <Tombol label="Hitung Campuran Termurah" ikon="flash" memuat={menghitung} onPress={hitung} />

            <View onLayout={(e) => (posisiHasil.current = e.nativeEvent.layout.y - jarak.l)}>
              {hasil?.status === "layak" ? <HasilLayak hasil={hasil} /> : null}
              {hasil?.status === "tak_layak" ? <HasilTakLayak hasil={hasil} onTambah={tambahSaran} /> : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function KartuBahan({
  bahan,
  dipilih,
  harga,
  onAlih,
  onHarga,
}: {
  bahan: BahanMaster;
  dipilih: boolean;
  harga: string;
  onAlih: () => void;
  onHarga: (t: string) => void;
}) {
  const protein = bahan.nutrisi.protein_kasar;
  return (
    <View style={[gaya.kartuBahan, dipilih && gaya.kartuBahanAktif]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: dipilih }}
        accessibilityLabel={bahan.nama}
        onPress={onAlih}
        style={gaya.barisBahan}
      >
        <View style={[gaya.centang, dipilih && gaya.centangAktif]}>
          {dipilih ? <Ionicons name="checkmark" size={18} color={warna.putih} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={gaya.namaBahan}>{bahan.nama}</Text>
          <Text style={gaya.subBahan}>
            {protein !== undefined ? `Protein ${formatAngka(protein, 1)}%` : "—"} · maks {formatAngka(bahan.batasMaksPersen, 0)}%
          </Text>
        </View>
      </Pressable>
      {dipilih ? (
        <View style={gaya.barisHarga}>
          <Text style={gaya.rp}>Rp</Text>
          <TextInput
            value={harga}
            onChangeText={onHarga}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={warna.kremGaris}
            style={gaya.masukanHarga}
            accessibilityLabel={`Harga ${bahan.nama} per kg`}
          />
          <Text style={gaya.perKg}>/kg</Text>
        </View>
      ) : null}
    </View>
  );
}

function HasilLayak({ hasil }: { hasil: PakanHitungLayak }) {
  const terpenuhi = hasil.pemenuhanGizi.filter((g) => g.terpenuhi).length;
  const total = hasil.pemenuhanGizi.length;
  const komposisi = hasil.komposisi.filter((k) => k.persentase > 0.05);
  const namaFase = FASE.find((f) => f.id === hasil.fase)?.nama ?? hasil.fase;

  return (
    <View style={{ gap: jarak.l }}>
      <View style={gaya.kartuHasil}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: jarak.s }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={gaya.judulHasil}>Campuran Termurah</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="checkmark-circle" size={18} color={warna.aksen} />
              <Text style={gaya.subHasil}>Fase {namaFase} · per 100 kg pakan</Text>
            </View>
          </View>
          <Ionicons name="star" size={26} color={warna.gelap} />
        </View>

        <View style={gaya.batangKomposisi} accessibilityElementsHidden>
          {komposisi.map((k, i) => (
            <View
              key={k.bahanId}
              style={{ flex: k.persentase, backgroundColor: WARNA_KOMPOSISI[i % WARNA_KOMPOSISI.length] }}
            />
          ))}
        </View>

        <View style={{ gap: jarak.s }}>
          {komposisi.map((k, i) => (
            <View key={k.bahanId} style={gaya.barisKomposisi}>
              <View style={[gaya.kotakWarna, { backgroundColor: WARNA_KOMPOSISI[i % WARNA_KOMPOSISI.length] }]} />
              <Text style={gaya.namaKomposisi} numberOfLines={2}>{k.nama}</Text>
              <Text style={gaya.persenKomposisi}>{formatPersen(k.persentase)}</Text>
              <Text style={gaya.kgKomposisi}>{formatAngka(k.kgPer100Kg, 1)} kg</Text>
            </View>
          ))}
        </View>

        <View style={gaya.kakiHasil}>
          <Text style={gaya.labelGizi}>Gizi</Text>
          <View style={{ flexDirection: "row", gap: 4 }} accessibilityLabel={`${terpenuhi} dari ${total} syarat gizi terpenuhi`}>
            {hasil.pemenuhanGizi.map((g) => (
              <View key={g.zatGizi} style={[gaya.segmenGizi, { backgroundColor: g.terpenuhi ? warna.aksen : warna.kremTua }]} />
            ))}
          </View>
          <View style={gaya.pemisah} />
          <Text style={gaya.hargaBesar} numberOfLines={1} adjustsFontSizeToFit>
            {formatRupiah(hasil.biayaPerKg)}
            <Text style={gaya.perKgBesar}>/kg</Text>
          </Text>
        </View>

        {hasil.selisihPerKg !== undefined ? (
          <View style={[gaya.selisih, { backgroundColor: hasil.selisihPerKg > 0 ? warna.hijauLembut : warna.kremTua }]}>
            <Ionicons
              name={hasil.selisihPerKg > 0 ? "trending-down" : "information-circle-outline"}
              size={20}
              color={hasil.selisihPerKg > 0 ? warna.hijau : warna.tintaRedup}
            />
            <Text style={{ flex: 1, fontSize: huruf.isi, color: hasil.selisihPerKg > 0 ? warna.hijau : warna.tinta }}>
              {hasil.selisihPerKg > 0
                ? `Hemat ${formatRupiah(hasil.selisihPerKg)}/kg dibanding pakan sekarang.`
                : "Tidak lebih murah dari pakan sekarang dengan bahan dan harga ini."}
            </Text>
          </View>
        ) : null}
      </View>

      <JudulBagian>Pemenuhan Gizi</JudulBagian>
      <Kartu style={{ gap: jarak.m }}>
        {hasil.pemenuhanGizi.map((g) => {
          const acuan = g.batasMaks ?? (g.batasMin ? g.batasMin * 1.25 : 100);
          const lebar = acuan > 0 ? Math.max(4, Math.min(100, (g.nilai / acuan) * 100)) : 0;
          return (
            <View key={g.zatGizi} style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: jarak.s }}>
                <Text style={gaya.namaKomposisi}>{g.label}</Text>
                <Text style={[gaya.persenKomposisi, { color: g.terpenuhi ? warna.tinta : warna.bahaya }]}>
                  {formatAngka(g.nilai, 2)} {g.satuan}
                </Text>
              </View>
              <View style={gaya.relGizi}>
                <View style={[gaya.isiGizi, { width: `${lebar}%`, backgroundColor: g.terpenuhi ? warna.aksen : warna.bahaya }]} />
              </View>
              <Text style={gaya.subBahan}>
                Target {g.batasMin !== null ? `min ${formatAngka(g.batasMin, 2)}` : "tanpa min"}
                {g.batasMaks !== null ? `, maks ${formatAngka(g.batasMaks, 2)}` : ""} {g.satuan}
              </Text>
            </View>
          );
        })}
        <Teks redup style={{ fontSize: huruf.kecil, lineHeight: 20 }}>{hasil.catatanData}</Teks>
      </Kartu>
    </View>
  );
}

function HasilTakLayak({ hasil, onTambah }: { hasil: PakanHitungTakLayak; onTambah: (id: string) => void }) {
  return (
    <Kartu style={{ gap: jarak.m }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: jarak.s }}>
        <Ionicons name="alert-circle" size={24} color={warna.bahaya} />
        <Text style={[gaya.judulHasil, { flex: 1 }]}>Belum bisa dicampur</Text>
      </View>
      <Teks>{hasil.pesan}</Teks>
      {hasil.zatBermasalah.map((z) => (
        <View key={z.zatGizi} style={gaya.barisKomposisi}>
          <View style={[gaya.kotakWarna, { backgroundColor: warna.bahaya }]} />
          <Text style={gaya.namaKomposisi}>{z.label}</Text>
          <Text style={gaya.subBahan}>
            {z.alasan === "kurang" ? "kurang" : z.alasan === "berlebih" ? "berlebih" : "bentrok"} · target{" "}
            {formatAngka(z.batasTarget, 2)} {z.satuan}
          </Text>
        </View>
      ))}
      {hasil.saranBahan.length > 0 ? (
        <>
          <Text style={gaya.labelKecil}>Coba tambahkan:</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: jarak.s }}>
            {hasil.saranBahan.map((s) => (
              <Pressable
                key={s.bahanId}
                accessibilityRole="button"
                onPress={() => onTambah(s.bahanId)}
                style={gaya.chipSaran}
              >
                <Ionicons name="add" size={18} color={warna.aksenTeks} />
                <Text style={{ color: warna.aksenTeks, fontWeight: "700", fontSize: huruf.isi }}>{s.nama}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </Kartu>
  );
}

const gaya = StyleSheet.create({
  layar: { flex: 1, backgroundColor: warna.krem },
  kepala: {
    flexDirection: "row",
    alignItems: "center",
    gap: jarak.m,
    paddingHorizontal: jarak.l,
    paddingTop: jarak.s,
    paddingBottom: jarak.s,
  },
  kolomCari: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: jarak.s,
    height: 52,
    borderRadius: sudut.m,
    backgroundColor: warna.putih,
    paddingHorizontal: jarak.m,
    ...bayangan,
  },
  masukanCari: { flex: 1, minWidth: 0, fontSize: huruf.isi + 1, color: warna.tinta, height: 52 },
  isi: { padding: jarak.l, paddingTop: jarak.s, gap: jarak.l, paddingBottom: jarak.xxl },
  barisFase: { gap: jarak.m, paddingVertical: 4, paddingHorizontal: 2 },
  ubinFase: {
    width: 84,
    height: 84,
    borderRadius: sudut.l,
    backgroundColor: warna.putih,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    ...bayangan,
  },
  ubinFaseAktif: { borderColor: warna.aksen, backgroundColor: warna.aksenLembut },
  emoji: { fontSize: 40 },
  namaFase: { fontSize: huruf.isi, color: warna.tinta },
  subFase: { fontSize: 12, color: warna.tintaRedup, marginTop: -4 },
  infoData: { gap: jarak.xs },
  kartuBahan: {
    backgroundColor: warna.putih,
    borderRadius: sudut.l,
    padding: jarak.m + 2,
    gap: jarak.m,
    borderWidth: 2,
    borderColor: "transparent",
    ...bayangan,
  },
  kartuBahanAktif: { borderColor: warna.aksen },
  barisBahan: { flexDirection: "row", alignItems: "center", gap: jarak.m },
  centang: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: warna.kremGaris,
    alignItems: "center",
    justifyContent: "center",
  },
  centangAktif: { backgroundColor: warna.aksen, borderColor: warna.aksen },
  namaBahan: { fontSize: huruf.sub - 1, fontWeight: "600", color: warna.tinta },
  subBahan: { fontSize: huruf.kecil, color: warna.tintaRedup },
  barisHarga: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: warna.krem,
    borderRadius: sudut.m,
    paddingHorizontal: jarak.m,
    minHeight: 54,
  },
  rp: { fontSize: huruf.sub, fontWeight: "600", color: warna.tintaRedup, marginRight: jarak.s },
  masukanHarga: { flex: 1, minWidth: 0, fontSize: huruf.sub + 2, fontWeight: "600", color: warna.tinta, minHeight: 54 },
  perKg: { fontSize: huruf.isi, color: warna.tintaRedup, fontWeight: "600" },
  labelKecil: { fontSize: huruf.kecil, fontWeight: "600", color: warna.tintaRedup },
  kartuHasil: {
    backgroundColor: warna.putih,
    borderRadius: sudut.xl,
    padding: jarak.xl,
    gap: jarak.l,
    ...bayangan,
  },
  judulHasil: { fontSize: huruf.sub + 2, fontWeight: "600", color: warna.tinta },
  subHasil: { fontSize: huruf.kecil + 1, color: warna.tintaRedup },
  batangKomposisi: { flexDirection: "row", height: 18, borderRadius: 9, overflow: "hidden", gap: 3 },
  barisKomposisi: { flexDirection: "row", alignItems: "center", gap: jarak.s },
  kotakWarna: { width: 12, height: 12, borderRadius: 4 },
  namaKomposisi: { flex: 1, fontSize: huruf.isi, color: warna.tinta },
  persenKomposisi: { fontSize: huruf.isi, fontWeight: "700", color: warna.tinta, minWidth: 56, textAlign: "right" },
  kgKomposisi: { fontSize: huruf.kecil, color: warna.tintaRedup, minWidth: 58, textAlign: "right" },
  kakiHasil: { flexDirection: "row", alignItems: "center", gap: jarak.s, paddingTop: jarak.s },
  labelGizi: { fontSize: huruf.sub, color: warna.tintaRedup },
  segmenGizi: { width: 12, height: 28, borderRadius: 6 },
  pemisah: { width: 1, height: 32, backgroundColor: warna.garis, marginHorizontal: jarak.s },
  hargaBesar: { flex: 1, textAlign: "right", fontSize: huruf.judul + 4, fontWeight: "600", color: warna.tinta, letterSpacing: -0.5 },
  perKgBesar: { fontSize: huruf.isi, fontWeight: "500", color: warna.tintaRedup },
  selisih: { flexDirection: "row", alignItems: "center", gap: jarak.s, borderRadius: sudut.m, padding: jarak.m },
  relGizi: { height: 10, borderRadius: 5, backgroundColor: warna.kremTua, overflow: "hidden" },
  isiGizi: { height: 10, borderRadius: 5 },
  chipSaran: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: warna.aksenLembut,
    borderRadius: sudut.bulat,
    paddingHorizontal: jarak.m,
    paddingVertical: jarak.s,
  },
});
