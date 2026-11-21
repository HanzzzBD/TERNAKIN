import type { PeranAkun } from "@ternakin/shared";

/**
 * Info tampilan akun demo bersama untuk juri. Sesinya sungguhan di server (POST /v1/auth/demo)
 * dan mengikuti aturan peran yang sama dengan akun WhatsApp.
 */
export const AKUN_DEMO_TAMPIL: Record<PeranAkun, { nama: string; email: string; sandi: string }> = {
  pengguna: { nama: "Rani", email: "pengguna@demo.ternakin.id", sandi: "demo1234" },
  peternak: { nama: "Pak Dedi S.", email: "peternak@demo.ternakin.id", sandi: "demo1234" },
};

/** Jarak garis lurus (km) antara dua titik koordinat, rumus haversine. */
export function hitungJarakKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
