import { Link } from "react-router";
import { formatAngka, formatRupiah } from "@ternakin/shared";
import { LANDING_INVESTASI, PELUANG_INVESTASI } from "../../content/investasiContent";
import {
  ArrowRightIcon,
  ClipboardIcon,
  KokokFigure,
  MapPinIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UserIcon,
} from "../ui";

const IKON_JAMINAN = {
  uang: <ShieldCheckIcon size={22} />,
  data: <ClipboardIcon size={22} />,
  dokter: <StethoscopeIcon size={22} />,
} as const;

/** Kartu peluang tiruan sebagai visual section; memakai data contoh pertama. */
function KartuPeluangMock() {
  const p = PELUANG_INVESTASI[0];
  if (!p) return null;
  const persen = Math.round((p.modalTerkumpul / p.kebutuhanModal) * 100);

  return (
    <div className="tk-invhl-visual" aria-hidden="true">
      <span className="tk-invhl-visual__kokok">
        <KokokFigure size={120} floating />
      </span>

      <div className="tk-invhl-mock">
        <div className="tk-invhl-mock__top">
          <span className="tk-invhl-mock__status">
            <span className="tk-invhl-mock__dot" />
            Dibuka untuk modal
          </span>
          <span className="tk-invhl-mock__jarak">
            <MapPinIcon size={14} /> ± 14 km
          </span>
        </div>
        <p className="tk-invhl-mock__title">{p.namaKandang}</p>
        <p className="tk-invhl-mock__meta">
          {p.peternak} · {p.kecamatan}
        </p>
        <div className="tk-invhl-mock__facts">
          <span>
            <strong>{formatAngka(p.jumlahEkor, 0)}</strong> ekor pedaging
          </span>
          <span>
            <strong>{p.porsiPemodalPersen}%</strong> laba untuk pemodal
          </span>
        </div>
        <div className="tk-invhl-mock__bar">
          <span style={{ width: `${persen}%` }} />
        </div>
        <p className="tk-invhl-mock__meta">
          {formatRupiah(p.modalTerkumpul)} dari {formatRupiah(p.kebutuhanModal)} · {persen}%
        </p>
        <p className="tk-invhl-mock__vet">
          <StethoscopeIcon size={16} /> Diperiksa dokter hewan mitra
        </p>
      </div>

      <span className="tk-invhl-chip tk-invhl-chip--1">Data dari catatan harian</span>
      <span className="tk-invhl-chip tk-invhl-chip--2">Contoh tampilan</span>
    </div>
  );
}

export function InvestasiHighlight() {
  return (
    <section
      id="investasi"
      className="tk-section tk-section--investasi"
      aria-labelledby="judul-investasi"
    >
      <div className="tk-landing-container">
        <div className="tk-invhl-layout">
          <div className="tk-invhl-copy">
            <p className="tk-eyebrow">{LANDING_INVESTASI.eyebrow}</p>
            <h2 id="judul-investasi" className="tk-landing-h2">
              {LANDING_INVESTASI.judulUtama}{" "}
              <span className="tk-accent-italic">{LANDING_INVESTASI.judulAksen}</span>
            </h2>
            <p className="tk-invhl-sub">{LANDING_INVESTASI.sub}</p>

            <div className="tk-invhl-actions">
              <Link to="/app/investasi" className="tk-btn tk-btn--primary tk-landing-inline-btn">
                <span>{LANDING_INVESTASI.tombolLihat}</span>
                <ArrowRightIcon size={20} />
              </Link>
              <Link to="/app/masuk" className="tk-btn tk-btn--secondary tk-landing-inline-btn">
                <UserIcon size={20} />
                <span>{LANDING_INVESTASI.tombolMasuk}</span>
              </Link>
            </div>
          </div>

          <KartuPeluangMock />
        </div>

        <ul className="tk-invhl-trust">
          {LANDING_INVESTASI.jaminanJujur.map((j) => (
            <li key={j.id}>
              <span className="tk-invhl-trust__icon" aria-hidden="true">
                {IKON_JAMINAN[j.id]}
              </span>
              <div>
                <h3>{j.judul}</h3>
                <p>{j.keterangan}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="tk-invhl-risk">{LANDING_INVESTASI.catatanRisiko}</p>
      </div>
    </section>
  );
}
