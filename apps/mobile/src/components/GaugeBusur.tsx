import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { warna } from "@/lib/tema";

const LEBAR = 300;
const TINGGI = 232;
const JARI = 116;
const PUSAT_Y = 156;
const SEG_LEBAR = 38;
const SEG_TINGGI = 56;
/** Busur dari kiri bawah, melewati atas, ke kanan bawah (derajat, 0 = kanan, berlawanan jarum jam). */
const SUDUT_AWAL = 205;
const SUDUT_AKHIR = -25;

/**
 * Gauge busur bersegmen: segmen terisi berwarna aksen, sisanya krem.
 * Isi (angka utama) diletakkan di tengah busur.
 */
export function GaugeBusur({
  nilai,
  segmen = 11,
  label,
  children,
}: {
  /** 0..1 */
  nilai: number;
  segmen?: number;
  label: string;
  children?: ReactNode;
}) {
  const aman = Number.isFinite(nilai) ? Math.min(1, Math.max(0, nilai)) : 0;
  const terisi = Math.round(aman * segmen);
  const langkah = (SUDUT_AWAL - SUDUT_AKHIR) / (segmen - 1);

  return (
    <View
      style={gaya.wadah}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(aman * 100) }}
    >
      {Array.from({ length: segmen }, (_, i) => {
        const derajat = SUDUT_AWAL - langkah * i;
        const rad = (derajat * Math.PI) / 180;
        const x = LEBAR / 2 + JARI * Math.cos(rad);
        const y = PUSAT_Y - JARI * Math.sin(rad);
        return (
          <Animated.View
            key={i}
            entering={FadeIn.delay(i * 45).duration(260)}
            style={[
              gaya.segmen,
              {
                left: x - SEG_LEBAR / 2,
                top: y - SEG_TINGGI / 2,
                backgroundColor: i < terisi ? warna.aksen : warna.kremTua,
                transform: [{ rotate: `${90 - derajat}deg` }],
              },
            ]}
          />
        );
      })}
      <View style={gaya.isi} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

const gaya = StyleSheet.create({
  wadah: { width: LEBAR, height: TINGGI, alignSelf: "center" },
  segmen: {
    position: "absolute",
    width: SEG_LEBAR,
    height: SEG_TINGGI,
    borderRadius: 14,
  },
  isi: {
    position: "absolute",
    left: 60,
    right: 60,
    top: PUSAT_Y - 62,
    alignItems: "center",
    gap: 2,
  },
});
