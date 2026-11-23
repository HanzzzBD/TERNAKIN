import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import type { NamaIkon } from "@/components/ui";
import { sudut, warna } from "@/lib/tema";

/** Ikon per rute: [tidak aktif, aktif]. Rute tengah (kokok) ditampilkan sebagai tombol oranye. */
const IKON: Record<string, [NamaIkon, NamaIkon]> = {
  index: ["home-outline", "home"],
  pakan: ["calculator-outline", "calculator"],
  kokok: ["chatbubble-ellipses-outline", "chatbubble-ellipses"],
  catatan: ["clipboard-outline", "clipboard"],
  profil: ["person-outline", "person"],
};

const RUTE_TENGAH = "kokok";
const TINGGI_TOPI = 26;

/**
 * Bilah tab gelap: isi layar krem "ditutup" sudut membulat di atas bilah,
 * ikon putih, ikon aktif oranye, dan tombol tengah oranye untuk Kokok.
 */
export function BilahTab({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const rute = state.routes.filter((r) => {
    const opsi = descriptors[r.key]?.options as { hidden?: boolean } | undefined;
    return !opsi?.hidden;
  });
  const aktif = state.routes[state.index]?.key;

  return (
    <View style={gaya.wadah}>
      <View style={gaya.topi} />
      <View style={[gaya.baris, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {rute.map((r) => {
          const fokus = r.key === aktif;
          const opsi = descriptors[r.key]?.options;
          const judul = opsi?.title ?? r.name;
          const [ikonDiam, ikonAktif] = IKON[r.name] ?? ["ellipse-outline", "ellipse"];
          const tengah = r.name === RUTE_TENGAH;

          const tekan = () => {
            const peristiwa = emitter.emit({
              type: "tabPress",
              target: r.key,
              canPreventDefault: true,
            });
            if (!fokus && !peristiwa.defaultPrevented) navigateToTab(r.key);
          };

          return (
            <Pressable
              key={r.key}
              accessibilityRole="tab"
              accessibilityLabel={judul}
              accessibilityState={{ selected: fokus }}
              onPress={tekan}
              hitSlop={4}
              style={({ pressed }) => [
                gaya.item,
                tengah && gaya.itemTengah,
                tengah && fokus && gaya.itemTengahAktif,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name={fokus ? ikonAktif : ikonDiam}
                size={tengah ? 28 : 25}
                color={tengah ? warna.gelap : fokus ? warna.aksen : warna.putih}
              />
              {fokus && !tengah ? <View style={gaya.titikAktif} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const gaya = StyleSheet.create({
  wadah: { backgroundColor: warna.gelap },
  topi: {
    height: TINGGI_TOPI,
    backgroundColor: warna.krem,
    borderBottomLeftRadius: sudut.xl + 4,
    borderBottomRightRadius: sudut.xl + 4,
  },
  baris: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 14,
    paddingHorizontal: 12,
  },
  item: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTengah: {
    width: 64,
    height: 64,
    borderRadius: sudut.l,
    backgroundColor: warna.aksen,
  },
  itemTengahAktif: { backgroundColor: "#ffb184" },
  titikAktif: {
    position: "absolute",
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: warna.aksen,
  },
});
