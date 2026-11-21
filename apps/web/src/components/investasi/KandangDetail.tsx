import { formatAngka, type PeluangInvestasi } from "@ternakin/shared";
import { Card, ShieldCheckIcon, Sparkline, StethoscopeIcon } from "../ui";
import { BilahModal, LencanaDokter, StatusPeluangChip } from "./PeluangUi";

/** Ringkasan profil peternakan: nama kandang, lokasi, populasi, siklus, bagi hasil, modal. */
export function ProfilPeternakan({
  peluang,
  judulLevel = 1,
}: {
  peluang: PeluangInvestasi;
  judulLevel?: 1 | 2;
}) {
  const Judul = judulLevel === 1 ? "h1" : "h2";
  return (
    <Card variant="warm" className="tk-inv-hero">
      <StatusPeluangChip status={peluang.status} />
      <Judul className="tk-inv-title">{peluang.namaKandang}</Judul>
      <p className="tk-inv-card__meta">
        {peluang.peternak} · {peluang.kecamatan}, {peluang.wilayah} · beternak{" "}
        {peluang.pengalamanTahun} tahun
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
          <dt>Bagi hasil</dt>
          <dd className="tk-num">
            {peluang.porsiPemodalPersen}% pemodal · {100 - peluang.porsiPemodalPersen}% peternak
          </dd>
        </div>
      </dl>
      <BilahModal peluang={peluang} />
      <LencanaDokter peluang={peluang} />
    </Card>
  );
}

export function KartuPemeriksaan({ peluang }: { peluang: PeluangInvestasi }) {
  return (
    <Card className="tk-inv-vet-card">
      <h2 className="tk-inv-h2">
        <StethoscopeIcon size={22} /> Pemeriksaan dokter hewan mitra
      </h2>
      {peluang.pemeriksaan ? (
        <>
          <p className="tk-inv-vet-card__who">
            <strong>{peluang.pemeriksaan.dokter}</strong> · {peluang.pemeriksaan.klinik}
          </p>
          <p className="tk-inv-vet-card__hasil">
            <ShieldCheckIcon size={18} />
            {peluang.pemeriksaan.hasil === "layak" ? "Layak dibuka" : "Layak dengan catatan"} ·
            diperiksa{" "}
            {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
              new Date(peluang.pemeriksaan.tanggal),
            )}
          </p>
          <ul className="tk-inv-list">
            {peluang.pemeriksaan.poin.map((poin) => (
              <li key={poin}>{poin}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className="tk-muted">
          Belum diperiksa. Peluang dibuka untuk modal setelah dokter hewan mitra memeriksa kandang.
        </p>
      )}
    </Card>
  );
}

export function DataKandang({
  peluang,
  sudutPeternak = false,
}: {
  peluang: PeluangInvestasi;
  /** Teks untuk peternak pemilik kandang, bukan untuk pengguna. */
  sudutPeternak?: boolean;
}) {
  // Bila izin dimatikan, server tidak mengirim catatan ke orang lain; pemilik melihat pesan ini.
  if (!peluang.izinData) {
    return (
      <Card>
        <h2 className="tk-inv-h2">Data kandang dari catatan harian</h2>
        <p className="tk-muted">
          {sudutPeternak
            ? "Data ini sedang disembunyikan dari pengguna karena izin tampilkan data dimatikan."
            : "Peternak belum mengizinkan data catatan harian kandang ini ditampilkan."}
        </p>
      </Card>
    );
  }

  const berjalan = peluang.status === "dipelihara";
  const titik = (pilih: (t: PeluangInvestasi["catatan"][number]) => number) =>
    peluang.catatan.map((t) => ({ tanggal: `Hari ${t.hari}`, nilai: pilih(t) }));

  return (
    <Card>
      <h2 className="tk-inv-h2">Data kandang dari catatan harian</h2>
      <p className="tk-muted tk-prose">
        {berjalan
          ? `Siklus berjalan hari ke-${peluang.hariBerjalan ?? 0} dari sekitar ${peluang.siklusHari} hari. Diisi peternak setiap hari di Ternakin.`
          : sudutPeternak
            ? "Rekam jejak siklus sebelumnya dari catatan harian Anda. Inilah yang dilihat pengguna."
            : "Rekam jejak siklus sebelumnya, diisi peternak setiap hari di Ternakin."}
      </p>

      {!berjalan && !peluang.siklusLalu && (
        <p className="tk-muted">
          {sudutPeternak
            ? "Belum ada rekam jejak siklus di Ternakin. Catat harian setiap hari agar pengguna bisa melihat perkembangan kandang Anda."
            : "Peternak ini baru bergabung; rekam jejak siklus belum tersedia."}
        </p>
      )}

      {!berjalan && peluang.siklusLalu && (
        <dl className="tk-inv-stats">
          <div>
            <dt>Kematian</dt>
            <dd className="tk-num">{formatAngka(peluang.siklusLalu.mortalitasPersen, 1)}%</dd>
          </div>
          <div>
            <dt>Bobot panen</dt>
            <dd className="tk-num">{formatAngka(peluang.siklusLalu.bobotPanenKg, 2)} kg</dd>
          </div>
          <div>
            <dt>FCR</dt>
            <dd className="tk-num">{formatAngka(peluang.siklusLalu.fcr, 2)}</dd>
          </div>
          <div>
            <dt>Lama siklus</dt>
            <dd className="tk-num">{peluang.siklusLalu.hariPanen} hari</dd>
          </div>
        </dl>
      )}

      {peluang.catatan.length > 0 && (
        <div className="tk-inv-sparks">
          <Sparkline judul="Bobot rata-rata" satuan="g" data={titik((t) => t.bobotGram)} />
          <Sparkline judul="Pakan per hari" satuan="kg" data={titik((t) => t.pakanKg)} />
          <Sparkline
            judul="Kematian kumulatif"
            satuan="%"
            aksen="hijau"
            data={titik((t) => t.mortalitasPersen)}
          />
        </div>
      )}
      {peluang.isDemo && <p className="tk-inv-footnote">Data contoh untuk prototipe.</p>}
    </Card>
  );
}
