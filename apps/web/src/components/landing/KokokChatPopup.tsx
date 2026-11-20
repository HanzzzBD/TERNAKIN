import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link, useNavigate } from "react-router";
import { LANDING_KOKOK_CHAT, type KokokChatPilihan } from "../../content/landingContent";
import { db } from "../../db/db";
import { buatTautanWhatsAppTim } from "../../lib/wa";
import { ArrowRightIcon, ArrowUpIcon, CloseIcon, KokokFigure, WhatsAppIcon } from "../ui";
import "./KokokChatPopup.css";

const KUNCI_TEASER = "tk.kokokChat.teaser";
const KUNCI_DRAF_PERTANYAAN = "kokok-pertanyaan";
const JEDA_TEASER_MS = 4000;
const JEDA_KETIK_MS = 650;

type AksiPesan =
  | { jenis: "tautan"; label: string; ke: string }
  | { jenis: "whatsapp"; label: string; href: string }
  | { jenis: "gejala"; label: string; teks: string };

interface PesanObrolan {
  id: number;
  dari: "kokok" | "anda";
  teks: string;
  aksi?: AksiPesan;
}

function aksiDariPilihan(pilihan: KokokChatPilihan): AksiPesan | undefined {
  if (!pilihan.aksi) return undefined;
  if ("ke" in pilihan.aksi) {
    return { jenis: "tautan", label: pilihan.aksi.label, ke: pilihan.aksi.ke };
  }
  return {
    jenis: "whatsapp",
    label: pilihan.aksi.label,
    href: buatTautanWhatsAppTim(pilihan.aksi.whatsapp),
  };
}

function bacaTeaserDitutup(): boolean {
  try {
    return window.sessionStorage.getItem(KUNCI_TEASER) === "tutup";
  } catch {
    return false;
  }
}

/**
 * Popup obrolan Kokok yang mengambang di pojok kanan bawah landing page.
 * Menjawab pertanyaan umum dari isi FAQ secara lokal (tanpa jaringan) dan
 * meneruskan cerita gejala ayam ke halaman Tanya Kokok sebagai draf.
 */
export function KokokChatPopup() {
  const navigate = useNavigate();
  const idDasar = useId();
  const idPanel = `${idDasar}-panel`;
  const idJudul = `${idDasar}-judul`;
  const idInput = `${idDasar}-input`;

  const [terbuka, setTerbuka] = useState(false);
  const [teaserTampil, setTeaserTampil] = useState(false);
  const [sedangMengetik, setSedangMengetik] = useState(false);
  const [teks, setTeks] = useState("");
  const [pesan, setPesan] = useState<PesanObrolan[]>(() =>
    LANDING_KOKOK_CHAT.sapaan.map((isi, idx) => ({ id: idx, dari: "kokok", teks: isi })),
  );

  const idBerikutnya = useRef(LANDING_KOKOK_CHAT.sapaan.length);
  const timerRef = useRef<number[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);

  // Teaser sapaan muncul sebentar setelah halaman dibuka, kecuali sudah ditutup di sesi ini
  useEffect(() => {
    if (bacaTeaserDitutup()) return;
    const t = window.setTimeout(() => setTeaserTampil(true), JEDA_TEASER_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const daftar = timerRef.current;
    return () => {
      daftar.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // Gulir ke pesan terbaru
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [pesan, sedangMengetik, terbuka]);

  const tutupTeaser = () => {
    setTeaserTampil(false);
    try {
      window.sessionStorage.setItem(KUNCI_TEASER, "tutup");
    } catch {
      // Abaikan bila sessionStorage tidak tersedia
    }
  };

  const buka = () => {
    setTerbuka(true);
    tutupTeaser();
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const tutup = useCallback(() => {
    setTerbuka(false);
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  const tambahPesan = (isi: Omit<PesanObrolan, "id">) => {
    const id = idBerikutnya.current;
    idBerikutnya.current += 1;
    setPesan((sebelum) => [...sebelum, { ...isi, id }]);
  };

  const balasKokok = (isi: Omit<PesanObrolan, "id" | "dari">) => {
    setSedangMengetik(true);
    const t = window.setTimeout(() => {
      setSedangMengetik(false);
      tambahPesan({ dari: "kokok", ...isi });
    }, JEDA_KETIK_MS);
    timerRef.current.push(t);
  };

  const handlePilih = (pilihan: KokokChatPilihan) => {
    if (sedangMengetik) return;
    tambahPesan({ dari: "anda", teks: pilihan.label });
    balasKokok({ teks: pilihan.jawaban, aksi: aksiDariPilihan(pilihan) });
  };

  const handleKirim = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const isi = teks.trim();
    if (!isi || sedangMengetik) return;
    setTeks("");
    tambahPesan({ dari: "anda", teks: isi });
    balasKokok({
      teks: LANDING_KOKOK_CHAT.balasanGejala,
      aksi: { jenis: "gejala", label: LANDING_KOKOK_CHAT.tombolLanjutGejala, teks: isi },
    });
  };

  const lanjutKeTanyaKokok = async (isi: string) => {
    try {
      await db.draf.put({
        kunci: KUNCI_DRAF_PERTANYAAN,
        teks: isi,
        diubahPada: new Date().toISOString(),
      });
    } catch {
      // Tetap pindah halaman walau penyimpanan lokal terbatas
    }
    void navigate("/app/tanya");
  };

  const handleTombolPanel = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      tutup();
    }
  };

  return (
    <div className="tk-kchat" data-open={terbuka ? "true" : "false"}>
      <section
        id={idPanel}
        className="tk-kchat__panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby={idJudul}
        hidden={!terbuka}
        onKeyDown={handleTombolPanel}
      >
        <div className="tk-kchat__head">
          <span className="tk-kchat__avatar">
            <KokokFigure size={48} />
          </span>
          <div className="tk-kchat__head-text">
            <h2 id={idJudul} className="tk-kchat__title">
              {LANDING_KOKOK_CHAT.judul}
            </h2>
            <p className="tk-kchat__status">
              <span className="tk-kchat__status-dot" aria-hidden="true" />
              {LANDING_KOKOK_CHAT.status}
            </p>
          </div>
          <button
            type="button"
            className="tk-kchat__close"
            aria-label="Tutup obrolan Kokok"
            onClick={tutup}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div
          ref={logRef}
          className="tk-kchat__log"
          role="log"
          aria-live="polite"
          aria-label="Percakapan dengan Kokok"
          tabIndex={0}
        >
          {pesan.map((p) => (
            <div key={p.id} className={`tk-kchat__msg tk-kchat__msg--${p.dari}`}>
              <span className="tk-sr-only">{p.dari === "kokok" ? "Kokok:" : "Anda:"}</span>
              <p className="tk-kchat__bubble">{p.teks}</p>
              {p.aksi?.jenis === "tautan" && (
                <Link to={p.aksi.ke} className="tk-kchat__action">
                  <span>{p.aksi.label}</span>
                  <ArrowRightIcon size={18} />
                </Link>
              )}
              {p.aksi?.jenis === "whatsapp" && (
                <a
                  href={p.aksi.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tk-kchat__action"
                >
                  <WhatsAppIcon size={18} />
                  <span>{p.aksi.label}</span>
                </a>
              )}
              {p.aksi?.jenis === "gejala" && (
                <button
                  type="button"
                  className="tk-kchat__action"
                  onClick={() => {
                    if (p.aksi?.jenis === "gejala") void lanjutKeTanyaKokok(p.aksi.teks);
                  }}
                >
                  <span>{p.aksi.label}</span>
                  <ArrowRightIcon size={18} />
                </button>
              )}
            </div>
          ))}
          {sedangMengetik && (
            <div className="tk-kchat__msg tk-kchat__msg--kokok">
              <p className="tk-kchat__bubble tk-kchat__typing">
                <span className="tk-sr-only">Kokok sedang mengetik</span>
                <span aria-hidden="true" />
                <span aria-hidden="true" />
                <span aria-hidden="true" />
              </p>
            </div>
          )}
        </div>

        <div className="tk-kchat__chips" role="group" aria-label="Pertanyaan cepat">
          {LANDING_KOKOK_CHAT.pilihan.map((pilihan) => (
            <button
              key={pilihan.id}
              type="button"
              className="tk-kchat__chip"
              onClick={() => handlePilih(pilihan)}
            >
              {pilihan.label}
            </button>
          ))}
        </div>

        <form className="tk-kchat__form" onSubmit={handleKirim}>
          <label htmlFor={idInput} className="tk-sr-only">
            {LANDING_KOKOK_CHAT.labelInput}
          </label>
          <input
            ref={inputRef}
            id={idInput}
            className="tk-kchat__input"
            type="text"
            autoComplete="off"
            maxLength={500}
            placeholder={LANDING_KOKOK_CHAT.placeholderInput}
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
          />
          <button
            type="submit"
            className="tk-kchat__send"
            aria-label="Kirim ke Kokok"
            disabled={teks.trim() === "" || sedangMengetik}
          >
            <ArrowUpIcon size={20} />
          </button>
        </form>
        <p className="tk-kchat__note">{LANDING_KOKOK_CHAT.catatanAman}</p>
      </section>

      {teaserTampil && !terbuka && (
        <div className="tk-kchat__teaser">
          <button type="button" className="tk-kchat__teaser-text" onClick={buka}>
            {LANDING_KOKOK_CHAT.teaser}
          </button>
          <button
            type="button"
            className="tk-kchat__teaser-close"
            aria-label="Tutup sapaan Kokok"
            onClick={tutupTeaser}
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      <button
        ref={launcherRef}
        type="button"
        className="tk-kchat__launcher"
        aria-expanded={terbuka}
        aria-controls={idPanel}
        aria-label={terbuka ? "Tutup obrolan dengan Kokok" : "Buka obrolan dengan Kokok"}
        onClick={terbuka ? tutup : buka}
      >
        <KokokFigure size={64} />
        {!terbuka && <span className="tk-kchat__ping" aria-hidden="true" />}
      </button>
    </div>
  );
}
