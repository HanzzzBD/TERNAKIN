import { Badge, UrgencyChip } from "../ui";

export type PhonePreviewKind = "pakan" | "catatan" | "kokok" | "toko";

export interface PhoneFrameProps {
  kind: PhonePreviewKind;
  caption?: string;
}

function IsiPratinjau({ kind }: { kind: PhonePreviewKind }) {
  if (kind === "pakan") {
    return (
      <div className="tk-phone__screen">
        <div className="tk-phone__header-row">
          <span className="tk-phone__app-label">Penyusun pakan</span>
          <Badge variant="solver" />
        </div>
        <div className="tk-phone__metric-box">
          <span className="tk-phone__metric-label">Biaya campuran contoh</span>
          <strong className="tk-phone__metric-value tk-num">Rp 7.450 / kg</strong>
        </div>
        <ul className="tk-phone__list">
          <li>
            <span>Jagung kuning</span>
            <strong className="tk-num">52,0 kg</strong>
          </li>
          <li>
            <span>Konsentrat petelur</span>
            <strong className="tk-num">28,0 kg</strong>
          </li>
          <li>
            <span>Dedak padi</span>
            <strong className="tk-num">12,5 kg</strong>
          </li>
          <li>
            <span>Tepung batu kapur</span>
            <strong className="tk-num">7,5 kg</strong>
          </li>
        </ul>
      </div>
    );
  }

  if (kind === "catatan") {
    return (
      <div className="tk-phone__screen">
        <div className="tk-phone__header-row">
          <span className="tk-phone__app-label">Catatan harian</span>
          <Badge variant="offline" label="Simpan lokal" />
        </div>
        <div className="tk-phone__grid-2">
          <div className="tk-phone__stat">
            <span>Pakan</span>
            <strong className="tk-num">84 kg</strong>
          </div>
          <div className="tk-phone__stat">
            <span>Telur</span>
            <strong className="tk-num">620 butir</strong>
          </div>
          <div className="tk-phone__stat">
            <span>Ayam mati</span>
            <strong className="tk-num">0 ekor</strong>
          </div>
          <div className="tk-phone__stat">
            <span>Suhu</span>
            <strong className="tk-num">27 °C</strong>
          </div>
        </div>
        <p className="tk-phone__note">Tersimpan di ponsel. Dikirim otomatis saat ada sinyal.</p>
      </div>
    );
  }

  if (kind === "kokok") {
    return (
      <div className="tk-phone__screen">
        <div className="tk-phone__header-row">
          <span className="tk-phone__app-label">Kokok · Uji coba</span>
          <UrgencyChip urgency="sedang" />
        </div>
        <div className="tk-phone__bubble">Ayam mulai ngorok dan bersin sejak kemarin sore.</div>
        <p className="tk-phone__note">
          Pisahkan ayam bergejala ke karantina, periksa ventilasi kandang, lalu bagikan ringkasan
          kasus ke penyuluh atau puskeswan.
        </p>
        <p className="tk-phone__disclaimer">Bukan diagnosis dan tidak memberi dosis obat.</p>
      </div>
    );
  }

  return (
    <div className="tk-phone__screen">
      <div className="tk-phone__header-row">
        <span className="tk-phone__app-label">Rujukan toko</span>
        <Badge variant="mitra" />
      </div>
      <div className="tk-phone__store-card">
        <strong>Toko Contoh Lembang</strong>
        <span className="tk-phone__store-meta">Asal harga: Dikirim toko · 1 hari lalu</span>
        <strong className="tk-phone__metric-value tk-num">Rp 745.000 / 100 kg</strong>
      </div>
      <div className="tk-phone__store-card">
        <div className="tk-phone__header-row">
          <strong>Toko Contoh Soreang</strong>
          <Badge variant="usang" />
        </div>
        <span className="tk-phone__store-meta">Asal harga: Dicatat tim · 11 hari lalu</span>
      </div>
    </div>
  );
}

export function PhoneFrame({ kind, caption }: PhoneFrameProps) {
  return (
    <figure className="tk-phone-figure">
      <div className="tk-phone" aria-label={`Pratinjau tampilan ${kind} (data contoh)`}>
        <div className="tk-phone__status" aria-hidden="true">
          <span className="tk-num">9:41</span>
          <span className="tk-phone__pill" />
          <span>4G</span>
        </div>
        <IsiPratinjau kind={kind} />
      </div>
      {caption && <figcaption className="tk-phone-caption">{caption}</figcaption>}
    </figure>
  );
}
