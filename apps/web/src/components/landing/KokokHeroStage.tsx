import { useRef, type CSSProperties, type PointerEvent } from "react";
import { ChatIcon, FeedIcon, KokokMascot, StoreIcon } from "../ui";

const PESAN_HERO: readonly string[] = [
  "Halo! Saya Kokok, teman kandang Anda di Ternakin. Ketuk saya untuk lihat info singkat.",
  "Hitung pakan dan catatan harian tetap jalan walau sinyal di kandang hilang.",
  "Gratis untuk peternak ayam petelur mandiri. Langsung coba tanpa unduh aplikasi.",
];

const KEMIRINGAN_MAKS = 12;

function gayaMelayang(waktu: number, jeda: number, miring: number): CSSProperties {
  return {
    ["--tk-float-time" as string]: `${waktu}s`,
    ["--tk-float-delay" as string]: `${jeda}s`,
    ["--tk-float-tilt" as string]: `${miring}deg`,
  };
}

/**
 * Panggung maskot di hero: Kokok berukuran besar di atas lingkaran matahari,
 * dikelilingi gelembung obrolan dan ubin 3D yang melayang. Kokok sedikit
 * memiringkan badan mengikuti arah kursor agar terasa bervolume.
 */
export function KokokHeroStage() {
  const stageRef = useRef<HTMLDivElement | null>(null);

  const gerakBoleh = () =>
    typeof document !== "undefined" && document.documentElement.dataset.motion !== "off";

  const handleGerak = (e: PointerEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el || e.pointerType !== "mouse" || !gerakBoleh()) return;
    const kotak = el.getBoundingClientRect();
    const nx = (e.clientX - kotak.left) / kotak.width - 0.5;
    const ny = (e.clientY - kotak.top) / kotak.height - 0.5;
    el.style.setProperty("--tk-tilt-y", `${(nx * KEMIRINGAN_MAKS * 2).toFixed(2)}deg`);
    el.style.setProperty("--tk-tilt-x", `${(-ny * KEMIRINGAN_MAKS).toFixed(2)}deg`);
  };

  const handleKeluar = () => {
    const el = stageRef.current;
    if (!el) return;
    el.style.setProperty("--tk-tilt-y", "0deg");
    el.style.setProperty("--tk-tilt-x", "0deg");
  };

  return (
    <div
      ref={stageRef}
      className="tk-hero-stage"
      onPointerMove={handleGerak}
      onPointerLeave={handleKeluar}
    >
      <div className="tk-hero-stage__art" aria-hidden="true">
        <span className="tk-hero-stage__sun" />

        <span
          className="tk-hero-float tk-hero-say tk-hero-say--kiri"
          style={gayaMelayang(5.5, 0, -4)}
        >
          Kukuruyuk!
        </span>
        <span
          className="tk-hero-float tk-hero-say tk-hero-say--kanan"
          style={gayaMelayang(6.5, -2, 3)}
        >
          Pakan hemat, gizi cukup
        </span>

        <span
          className="tk-hero-float tk-clay-tile tk-clay-tile--orange tk-hero-tile--1"
          style={gayaMelayang(6, -1, -8)}
        >
          <FeedIcon size={26} />
        </span>
        <span
          className="tk-hero-float tk-clay-tile tk-clay-tile--green tk-hero-tile--2"
          style={gayaMelayang(7, -3, 6)}
        >
          <StoreIcon size={24} />
        </span>
        <span
          className="tk-hero-float tk-clay-tile tk-clay-tile--amber tk-hero-tile--3"
          style={gayaMelayang(5, -2.5, 10)}
        >
          <ChatIcon size={22} />
        </span>

        <span
          className="tk-hero-float tk-clay-egg tk-hero-egg--1"
          style={gayaMelayang(6.2, -1.5, -14)}
        />
        <span
          className="tk-hero-float tk-clay-egg tk-hero-egg--2"
          style={gayaMelayang(5.4, -3.5, 12)}
        />
      </div>

      <KokokMascot size="xl" interactive messages={PESAN_HERO} className="tk-hero-stage__kokok" />
    </div>
  );
}
