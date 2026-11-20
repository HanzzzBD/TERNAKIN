import { useState } from "react";
import { KokokFigure } from "./KokokFigure";

export type KokokMascotSize = "sm" | "md" | "lg" | "xl";

const UKURAN_PIKSEL: Record<KokokMascotSize, number> = { sm: 48, md: 96, lg: 168, xl: 320 };
const ALT_KOKOK = "Maskot Kokok, asisten ayam Ternakin";

const PESAN_KOKOK_DEFAULT: readonly string[] = [
  "Kukuruyuk! Saya Kokok, asisten peternak di Ternakin. Ketuk saya lagi untuk tips singkat.",
  "Mau tekan biaya pakan? Coba hitung campuran termurah di menu Pakan.",
  "Sinyal di kandang hilang? Tenang, Catatan harian tetap tersimpan di ponsel Anda.",
  "Ayam tampak lesu atau ngorok? Ceritakan ke saya di menu Kokok untuk cek tingkat urgensinya.",
  "Ingat ya, saya membantu cek urgensi dari pedoman — bukan diagnosis dan tidak memberi dosis obat.",
];

export interface KokokMascotProps {
  size?: KokokMascotSize;
  interactive?: boolean;
  showBubble?: boolean;
  messages?: readonly string[];
  className?: string;
}

export function KokokMascot({
  size = "md",
  interactive = true,
  showBubble = true,
  messages = PESAN_KOKOK_DEFAULT,
  className = "",
}: KokokMascotProps) {
  const [indeksPesan, setIndeksPesan] = useState(0);
  const [sedangSapa, setSedangSapa] = useState(false);

  const daftarPesan = messages.length > 0 ? messages : PESAN_KOKOK_DEFAULT;
  const pesanAktif = daftarPesan[indeksPesan % daftarPesan.length] ?? PESAN_KOKOK_DEFAULT[0];

  const handleInteraksi = () => {
    setIndeksPesan((prev) => (prev + 1) % daftarPesan.length);
    setSedangSapa(false);
    // Picu ulang animasi sapaan ringan pada frame berikutnya
    window.requestAnimationFrame(() => {
      setSedangSapa(true);
    });
  };

  const piksel = UKURAN_PIKSEL[size];
  const besar = size === "lg" || size === "xl";
  // Hero (xl) sudah punya panggung matahari sendiri; ukuran sedang dan besar memakai versi kecil
  const pakaiMatahari = size === "md" || size === "lg";

  if (!interactive) {
    return (
      <div className={`tk-kokok-mascot tk-kokok-mascot--${size} ${className}`.trim()}>
        <KokokFigure
          size={piksel}
          alt={ALT_KOKOK}
          grounded={besar}
          floating={besar}
          sun={pakaiMatahari}
        />
      </div>
    );
  }

  return (
    <div className={`tk-kokok-widget tk-kokok-widget--${size} ${className}`.trim()}>
      <button
        type="button"
        className={`tk-kokok-btn ${sedangSapa ? "tk-kokok-btn--hop" : ""}`.trim()}
        aria-label="Sapa Kokok untuk mendengar pesan atau tips berikutnya"
        onClick={handleInteraksi}
        onAnimationEnd={() => setSedangSapa(false)}
      >
        <KokokFigure
          size={piksel}
          alt={ALT_KOKOK}
          grounded={besar}
          floating={besar}
          sun={pakaiMatahari}
        />
        <span className="tk-kokok-name-tag">Kokok</span>
      </button>

      {showBubble && (
        <div className="tk-kokok-speech" role="status" aria-live="polite">
          <p className="tk-kokok-speech__text">“{pesanAktif}”</p>
        </div>
      )}
    </div>
  );
}
