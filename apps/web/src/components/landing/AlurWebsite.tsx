import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { LANDING_ALUR, type IkonAlur, type JalurAlur } from "../../content/alurContent";
import { buatTautanWhatsAppTim } from "../../lib/wa";
import {
  ArrowRightIcon,
  ChatIcon,
  ClipboardIcon,
  FeedIcon,
  KokokFigure,
  MapPinIcon,
  SproutCoinIcon,
  StethoscopeIcon,
  StoreIcon,
  UserIcon,
  WhatsAppIcon,
} from "../ui";

const IKON: Record<IkonAlur, ReactNode> = {
  profil: <UserIcon size={22} />,
  pakan: <FeedIcon size={22} />,
  catatan: <ClipboardIcon size={22} />,
  kokok: <ChatIcon size={22} />,
  toko: <StoreIcon size={22} />,
  masuk: <UserIcon size={22} />,
  peluang: <MapPinIcon size={22} />,
  dokter: <StethoscopeIcon size={22} />,
  modal: <SproutCoinIcon size={22} />,
  panen: <FeedIcon size={22} />,
  whatsapp: <WhatsAppIcon size={22} />,
};

function TautanTujuan({
  tujuan,
  className,
  children,
}: {
  tujuan: string;
  className: string;
  children: ReactNode;
}) {
  if (tujuan.startsWith("wa:")) {
    return (
      <a
        href={buatTautanWhatsAppTim(tujuan.slice(3))}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={tujuan} className={className}>
      {children}
    </Link>
  );
}

function PanelJalur({ jalur }: { jalur: JalurAlur }) {
  return (
    <>
      <p className="tk-alur-ringkas">{jalur.ringkas}</p>
      <ol className="tk-alur-steps">
        {jalur.langkah.map((langkah, idx) => (
          <li key={langkah.judul} className="tk-alur-step">
            <div className="tk-alur-step__head">
              <span className="tk-alur-step__num tk-num" aria-hidden="true">
                {idx + 1}
              </span>
              <span className="tk-alur-step__icon" aria-hidden="true">
                {IKON[langkah.ikon]}
              </span>
            </div>
            <h3 className="tk-alur-step__title">
              <span className="tk-sr-only">Langkah {idx + 1}: </span>
              {langkah.judul}
            </h3>
            <p className="tk-alur-step__text">{langkah.keterangan}</p>
            {langkah.tujuan && (
              <TautanTujuan tujuan={langkah.tujuan} className="tk-alur-step__link">
                <span>{langkah.labelTujuan ?? "Buka"}</span>
                <ArrowRightIcon size={16} />
              </TautanTujuan>
            )}
          </li>
        ))}
      </ol>
      <TautanTujuan
        tujuan={jalur.ajakan.tujuan}
        className="tk-btn tk-btn--primary tk-landing-inline-btn tk-alur-cta"
      >
        <span>{jalur.ajakan.label}</span>
        <ArrowRightIcon size={20} />
      </TautanTujuan>
    </>
  );
}

/**
 * Section "Alur Ternakin": tab per peran (peternak, pemodal, mitra) berisi langkah
 * bernomor yang masing-masing menaut ke halaman aplikasi yang dimaksud.
 */
export function AlurWebsite() {
  const idDasar = useId();
  const [aktif, setAktif] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const jalurList: readonly JalurAlur[] = LANDING_ALUR.jalur;
  const jalurAktif = jalurList[aktif] ?? jalurList[0];

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let tujuan: number | null = null;
    if (e.key === "ArrowRight") tujuan = (idx + 1) % jalurList.length;
    if (e.key === "ArrowLeft") tujuan = (idx - 1 + jalurList.length) % jalurList.length;
    if (e.key === "Home") tujuan = 0;
    if (e.key === "End") tujuan = jalurList.length - 1;
    if (tujuan === null) return;
    e.preventDefault();
    setAktif(tujuan);
    tabRefs.current[tujuan]?.focus();
  };

  if (!jalurAktif) return null;

  return (
    <section id="cara-kerja" className="tk-section tk-section--alur" aria-labelledby="judul-alur">
      <div className="tk-landing-container">
        <div className="tk-alur-head">
          <div>
            <p className="tk-eyebrow">{LANDING_ALUR.eyebrow}</p>
            <h2 id="judul-alur" className="tk-landing-h2">
              {LANDING_ALUR.judulUtama}{" "}
              <span className="tk-accent-italic">{LANDING_ALUR.judulAksen}</span>
            </h2>
            <p className="tk-alur-sub">{LANDING_ALUR.sub}</p>
          </div>
          <div className="tk-alur-kokok" aria-hidden="true">
            <p className="tk-alur-kokok__say">{LANDING_ALUR.sapaanKokok}</p>
            <KokokFigure size={132} sun floating />
          </div>
        </div>

        <div className="tk-alur-tabs" role="tablist" aria-label="Pilih peran Anda">
          {jalurList.map((jalur, idx) => (
            <button
              key={jalur.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              id={`${idDasar}-tab-${jalur.id}`}
              aria-selected={aktif === idx}
              aria-controls={`${idDasar}-panel`}
              tabIndex={aktif === idx ? 0 : -1}
              className="tk-alur-tab"
              onClick={() => setAktif(idx)}
              onKeyDown={(e) => handleKey(e, idx)}
            >
              {jalur.tab}
            </button>
          ))}
        </div>

        <div
          id={`${idDasar}-panel`}
          role="tabpanel"
          aria-labelledby={`${idDasar}-tab-${jalurAktif.id}`}
          className="tk-alur-panel"
        >
          <PanelJalur key={jalurAktif.id} jalur={jalurAktif} />
        </div>
      </div>
    </section>
  );
}
