import { BUKTI_LAPANGAN } from "../../content/buktiLapangan";
import { buatTautanWhatsAppTim } from "../../lib/wa";
import { Card, WhatsAppIcon } from "../ui";

export function FieldProof() {
  const tautanWaPilot = buatTautanWhatsAppTim(
    "Halo tim Ternakin, saya tertarik bergabung dalam uji pilot Ternakin di wilayah Bandung dan sekitarnya.",
  );

  if (BUKTI_LAPANGAN.length === 0) {
    return (
      <Card variant="warm" className="tk-pilot-card tk-partner-pilot-card">
        <p className="tk-eyebrow">BUKTI DARI LAPANGAN</p>
        <h2 className="tk-landing-h2">
          Kami sedang mencari peternak dan toko untuk pilot di Bandung dan sekitarnya.
        </h2>
        <p className="tk-muted tk-prose">
          Belum ada testimoni atau angka hasil lapangan karena uji pilot belum dimulai. Bila Anda
          peternak ayam petelur mandiri atau pengelola toko pakan di Bandung Raya dan ingin ikut
          menguji langsung, hubungi kami lewat WhatsApp.
        </p>
        <div className="tk-partner-pilot-card__action">
          <a
            className="tk-btn tk-btn--secondary tk-landing-inline-btn"
            href={tautanWaPilot}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon size={20} />
            <span>Ikut pilot lewat WhatsApp</span>
          </a>
        </div>
      </Card>
    );
  }

  return (
    <div className="tk-proof-wrap">
      <p className="tk-eyebrow">BUKTI DARI LAPANGAN</p>
      <h2 className="tk-landing-h2">Catatan nyata dari pilot bersama peternak.</h2>
      <div className="tk-proof-grid">
        {BUKTI_LAPANGAN.map((item) => (
          <article key={item.id} className="tk-proof-note">
            <p className="tk-proof-note__result">{item.ringkasanHasil}</p>
            <blockquote className="tk-proof-note__quote">“{item.kutipan}”</blockquote>
            <p className="tk-proof-note__meta">
              <strong>{item.namaAtauInisial}</strong> · {item.wilayah} · Diverifikasi{" "}
              {item.tanggalVerifikasi}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
