import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router/stack";
import {
  aturIzinSinkron,
  bersihkanDataKandang,
  muatDataKandang,
  mulaiUlangTarikan,
  sinkronkan,
} from "@/lib/kandang";
import { SambutanProvider, useSambutan } from "@/lib/sambutan";
import { SesiProvider, useSesi } from "@/lib/sesi";
import { warna } from "@/lib/tema";

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Menjaga data kandang selaras dengan sesi: sinkron saat dibuka, masuk, dan keluar akun. */
function PenjagaSinkron() {
  const { pengguna, peran, memuat } = useSesi();
  const idSebelumnya = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    aturIzinSinkron(peran === "peternak", !!pengguna);
  }, [peran, pengguna]);

  useEffect(() => {
    if (memuat) return;
    const id = pengguna?.id ?? null;
    const lama = idSebelumnya.current;
    idSebelumnya.current = id;

    void (async () => {
      await muatDataKandang();
      if (lama !== undefined && lama !== id) {
        // Keluar: salinan data akun di HP ini dihapus. Masuk: tarik ulang data akun.
        if (id === null) await bersihkanDataKandang();
        else await mulaiUlangTarikan();
      }
      await sinkronkan();
    })();
  }, [memuat, pengguna?.id]);

  useEffect(() => {
    const langganan = AppState.addEventListener("change", (status) => {
      if (status === "active") void sinkronkan();
    });
    return () => langganan.remove();
  }, []);

  return null;
}

function Navigasi() {
  const { memuat } = useSesi();
  const { selesai } = useSambutan();
  const siap = !memuat && selesai !== null;

  // Splash ditahan sampai status sesi dan status sambutan selesai dibaca.
  useEffect(() => {
    if (siap) SplashScreen.hideAsync().catch(() => {});
  }, [siap]);

  if (!siap) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: warna.krem },
        headerTintColor: warna.tinta,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: warna.krem },
      }}
    >
      <Stack.Protected guard={!selesai}>
        <Stack.Screen name="sambutan" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!selesai}>
        <Stack.Screen name="(tab)" options={{ headerShown: false }} />
        <Stack.Screen name="masuk" options={{ headerShown: false, presentation: "modal" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SesiProvider>
        <SambutanProvider>
          <StatusBar style="dark" />
          <PenjagaSinkron />
          <Navigasi />
        </SambutanProvider>
      </SesiProvider>
    </SafeAreaProvider>
  );
}
