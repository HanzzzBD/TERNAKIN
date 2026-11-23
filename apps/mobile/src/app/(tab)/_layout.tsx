import { Tabs } from "expo-router/js-tabs";
import { BilahTab } from "@/components/BilahTab";
import { useSesi } from "@/lib/sesi";
import { warna } from "@/lib/tema";

export default function TabLayout() {
  const { peran } = useSesi();
  // Peran "pengguna" (calon pemodal) hanya bertanya ke Kokok dan investasi (sesuai keputusan produk).
  const peternak = peran === "peternak";

  return (
    <Tabs
      tabBar={(props) => <BilahTab {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: warna.krem },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Beranda" }} />
      <Tabs.Screen name="pakan" options={{ title: "Hitung Pakan", href: peternak ? undefined : null }} />
      <Tabs.Screen name="kokok" options={{ title: "Tanya Kokok" }} />
      <Tabs.Screen name="catatan" options={{ title: "Catatan Harian", href: peternak ? undefined : null }} />
      <Tabs.Screen name="profil" options={{ title: "Akun" }} />
    </Tabs>
  );
}
