import { formatAngka, formatRupiah } from "@ternakin/shared";
import { Link } from "react-router";
import type { PeluangInvestasi, StatusPeluang } from "../../content/investasiContent";
import { ArrowRightIcon, MapPinIcon, StethoscopeIcon } from "../ui";

const LABEL_STATUS: Record<StatusPeluang, string> = {
  dibuka: "Dibuka untuk modal",
  "menunggu-pemeriksaan": "Menunggu pemeriksaan dokter hewan",
  dipelihara: "Sedang dipelihara",
};

export function StatusPeluangChip({ status }: { status: StatusPeluang }) {
  return (
    <span className={`tk-inv-status tk-inv-status--${status}`}>
      <span className="tk-inv-status__dot" aria-hidden="true" />
      {LABEL_STATUS[status]}
    </span>
  );
}

export function LencanaDokter({ peluang }: { peluang: PeluangInvestasi }) {
  if (!peluang.pemeriksaan) {
    return (
      <span className="tk-inv-vet tk-inv-vet--belum">
        <StethoscopeIcon size={16} />
        Belum diperiksa dokter hewan
      </span>
    );
  }
  return (
    <span className="tk-inv-vet">
      <StethoscopeIcon size={16} />
      Diperiksa {peluang.pemeriksaan.dokter.replace(" (contoh)", "")}
    </span>
  );
}

export function BilahModal({ peluang }: { peluang: PeluangInvestasi }) {
  const persen = Math.min(100, Math.round((peluang.modalTerkumpul / peluang.kebutuhanModal) * 100));
  return (
    <div className="tk-inv-bar">
      <div className="tk-inv-bar__head">
        <span>
          <strong className="tk-num">{formatRupiah(peluang.modalTerkumpul)}</strong> dari{" "}
          {formatRupiah(peluang.kebutuhanModal)}
        </span>
        <span className="tk-num">{persen}%</span>
      </div>
      <div
        className="tk-inv-bar__track"
        role="progressbar"
        aria-label="Modal terkumpul"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={persen}
      >
        <span className="tk-inv-bar__fill" style={{ width: `${persen}%` }} />
      </div>
    </div>
  );
}

export function KartuPeluang({
  peluang,
  jarakKm,
}: {
  peluang: PeluangInvestasi;
  jarakKm: number | null;
}) {
  return (
    <article className="tk-inv-card">
      <div className="tk-inv-card__top">
        <StatusPeluangChip status={peluang.status} />
        {jarakKm !== null && (
          <span className="tk-inv-distance">
            <MapPinIcon size={16} />
            <span className="tk-num">± {formatAngka(jarakKm, 1)} km</span>
          </span>
        )}
      </div>

      <h3 className="tk-inv-card__title">
        <Link to={`/app/investasi/${peluang.id}`} className="tk-inv-card__link">
          {peluang.namaKandang}
        </Link>
      </h3>
      <p className="tk-inv-card__meta">
        {peluang.peternak} · {peluang.kecamatan}, {peluang.wilayah}
      </p>

      <dl className="tk-inv-facts">
        <div>
          <dt>Ayam pedaging</dt>
          <dd className="tk-num">{formatAngka(peluang.jumlahEkor, 0)} ekor</dd>
        </div>
        <div>
          <dt>Siklus</dt>
          <dd className="tk-num">± {peluang.siklusHari} hari</dd>
        </div>
        <div>
          <dt>Bagian pemodal</dt>
          <dd className="tk-num">{peluang.porsiPemodalPersen}% laba</dd>
        </div>
      </dl>

      <BilahModal peluang={peluang} />

      <div className="tk-inv-card__foot">
        <LencanaDokter peluang={peluang} />
        <span className="tk-inv-card__cta" aria-hidden="true">
          Lihat kandang <ArrowRightIcon size={16} />
        </span>
      </div>
    </article>
  );
}
