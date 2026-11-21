import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  evaluateAlerts,
  formatAngka,
  galatApiSchema,
  kokokTriaseResponseSchema,
  type DataReferensi,
  type PercakapanKokokLokal,
  type RingkasanKasus,
} from "@ternakin/shared";
import { AppShell } from "../components/layout/AppShell";
import {
  Accordion,
  AlertOctagonIcon,
  Badge,
  Banner,
  Button,
  Card,
  ChatIcon,
  Field,
  KokokMascot,
  Skeleton,
  StethoscopeIcon,
  TextInput,
  UrgencyChip,
  WhatsAppIcon,
} from "../components/ui";
import { DOKTER_HEWAN_MITRA } from "../content/investasiContent";
import { db, getOrCreateDeviceId, type CatatanLokal, type KandangLokal } from "../db/db";
import { useOnlineStatus } from "../lib/pwa";
import { muatReferensiPakan } from "../lib/referensi";
import { TEKS_KOKOK } from "../lib/teks";
import { buatTautanWhatsAppKasus } from "../lib/wa";
import "./KokokPage.css";

const KUNCI_DRAF_PERTANYAAN = "kokok-pertanyaan";
const KUNCI_DRAF_KONTEKS = "kokok-konteks";

function formatWaktuSingkat(iso: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function RingkasanKasusView({ ringkasan }: { ringkasan: RingkasanKasus }) {
  const tautanWa = buatTautanWhatsAppKasus(ringkasan);

  return (
    <Card variant="warm" as="div" className="tk-kokok-summary-card">
      <h3 className="tk-kokok-subheading">{TEKS_KOKOK.judulRingkasanKasus}</h3>
      <dl className="tk-kokok-dl">
        <div className="tk-kokok-dl-row">
          <dt>Kandang</dt>
          <dd>{ringkasan.kandang}</dd>
        </div>
        <div className="tk-kokok-dl-row">
          <dt>Jenis ayam</dt>
          <dd>{ringkasan.jenisAyam}</dd>
        </div>
        <div className="tk-kokok-dl-row">
          <dt>Umur</dt>
          <dd>
            {ringkasan.umurMinggu !== null ? `${ringkasan.umurMinggu} minggu` : "Belum diisi"}
          </dd>
        </div>
        <div className="tk-kokok-dl-row">
          <dt>Populasi</dt>
          <dd className="tk-num">
            {ringkasan.populasiEkor !== null
              ? `${formatAngka(ringkasan.populasiEkor, 0)} ekor`
              : "Belum diisi"}
          </dd>
        </div>
        <div className="tk-kokok-dl-row">
          <dt>Lokasi</dt>
          <dd>{ringkasan.lokasi ?? "Belum diisi"}</dd>
        </div>
        <div className="tk-kokok-dl-row">
          <dt>Sejak kapan</dt>
          <dd>{ringkasan.sejakKapan}</dd>
        </div>
        <div className="tk-kokok-dl-row">
          <dt>Gejala</dt>
          <dd>{ringkasan.gejala}</dd>
        </div>
        <div className="tk-kokok-dl-row">
          <dt>Peringatan 7 hari terakhir</dt>
          <dd>
            {ringkasan.peringatan7Hari.length > 0
              ? ringkasan.peringatan7Hari.join("; ")
              : "Tidak ada peringatan tercatat"}
          </dd>
        </div>
      </dl>

      <a
        className="tk-btn tk-btn--secondary tk-kokok-wa-link"
        href={tautanWa}
        target="_blank"
        rel="noopener noreferrer"
      >
        <WhatsAppIcon size={20} />
        <span>{TEKS_KOKOK.tombolKirimWa}</span>
      </a>
      <p className="tk-kokok-wa-note">{TEKS_KOKOK.catatanWaTanpaNomor}</p>
    </Card>
  );
}

/**
 * Rujukan ke dokter hewan mitra saat urgensi tinggi, agar Kokok tidak berhenti di
 * "hubungi ahli". Mitra yang wilayah layanannya cocok dengan lokasi kandang tampil lebih dulu.
 */
function RujukanDokterMitra({ ringkasan }: { ringkasan: RingkasanKasus }) {
  const lokasi = (ringkasan.lokasi ?? "").toLowerCase();
  const skor = (wilayah: string) => (lokasi && wilayah.toLowerCase().includes(lokasi) ? 0 : 1);
  const urut = [...DOKTER_HEWAN_MITRA].sort(
    (a, b) => skor(a.wilayahLayanan) - skor(b.wilayahLayanan),
  );

  return (
    <div className="tk-kokok-vet">
      <h4 className="tk-kokok-vet__title">
        <StethoscopeIcon size={20} /> {TEKS_KOKOK.judulDokterMitra}
      </h4>
      <ul className="tk-kokok-vet__list">
        {urut.map((dokter) => (
          <li key={dokter.id} className="tk-kokok-vet__item">
            <div>
              <p className="tk-kokok-vet__name">{dokter.nama}</p>
              <p className="tk-kokok-vet__meta">
                {dokter.klinik} · melayani {dokter.wilayahLayanan}
              </p>
            </div>
            <a
              className="tk-btn tk-btn--primary tk-kokok-vet__btn"
              href={buatTautanWhatsAppKasus(ringkasan, {
                nomorWa: dokter.nomorWa,
                sapaan: `Halo ${dokter.nama.replace(" (contoh)", "")}, saya peternak pengguna Ternakin dan dirujuk Kokok karena urgensi tinggi.`,
              })}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Kirim ringkasan kasus ke ${dokter.nama} lewat WhatsApp`}
            >
              <WhatsAppIcon size={18} />
              <span>Kirim ringkasan</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="tk-kokok-vet__note">{TEKS_KOKOK.catatanDokterMitra}</p>
    </div>
  );
}

function KartuPercakapanKokok({ item }: { item: PercakapanKokokLokal }) {
  const { jawaban } = item;

  return (
    <Card as="article" className="tk-kokok-history-card">
      {jawaban.urgensi === "tinggi" && (
        <Card variant="danger" as="div" role="alert">
          <div className="tk-kokok-danger-head">
            <AlertOctagonIcon size={24} />
            <div>
              <h3 className="tk-kokok-danger-title">{TEKS_KOKOK.judulUrgensiTinggi}</h3>
              <p className="tk-kokok-danger-body">
                {jawaban.tujuanRujukan ??
                  "Segera hubungi dokter hewan atau dinas peternakan / puskeswan terdekat."}
              </p>
            </div>
          </div>
          <RujukanDokterMitra ringkasan={jawaban.ringkasanKasus} />
        </Card>
      )}

      <div className="tk-kokok-meta-row">
        <UrgencyChip urgency={jawaban.urgensi} />
        {jawaban.isUjiCoba && <Badge variant="usang" label={TEKS_KOKOK.badgeUjiCoba} />}
        {jawaban.terfilter && <Badge variant="solver" label={TEKS_KOKOK.badgeTerfilter} />}
        {jawaban.tidakTahu && <Badge variant="usang" label={TEKS_KOKOK.badgeTidakTahu} />}
        <span className="tk-kokok-time">{formatWaktuSingkat(item.dibuatPada)}</span>
      </div>

      <div className="tk-kokok-question-box">
        <span className="tk-kokok-question-label">Pertanyaan Anda</span>
        <p className="tk-kokok-question-text">{item.pertanyaan}</p>
      </div>

      {jawaban.jawaban ? (
        <>
          {/* Jawaban langsung Kokok atas cerita peternak; alasan urgensi jadi keterangan. */}
          <p className="tk-kokok-jawaban">{jawaban.jawaban}</p>
          <p className="tk-kokok-alasan">
            <strong>Kenapa urgensinya {jawaban.urgensi}:</strong> {jawaban.alasanUrgensi}
          </p>
        </>
      ) : (
        <p className="tk-prose" style={{ margin: 0 }}>
          {jawaban.alasanUrgensi}
        </p>
      )}

      {jawaban.tujuanRujukan && jawaban.urgensi !== "tinggi" && (
        <p className="tk-kokok-referral">{jawaban.tujuanRujukan}</p>
      )}

      <div>
        <h3 className="tk-kokok-subheading">{TEKS_KOKOK.judulPanduanUmum}</h3>
        <ul className="tk-kokok-steps">
          {jawaban.panduanUmum.map((langkah, idx) => (
            <li key={`${item.id}-langkah-${idx}`}>{langkah}</li>
          ))}
        </ul>
      </div>

      {jawaban.sumber.length > 0 ? (
        <Accordion
          items={[
            {
              id: `${item.id}-sumber`,
              question: `${TEKS_KOKOK.judulSumber} (${jawaban.sumber.length})`,
              answer: (
                <ul className="tk-kokok-source-list">
                  {jawaban.sumber.map((s) => (
                    <li key={s.id} className="tk-kokok-source-item">
                      <p className="tk-kokok-source-title">{s.judul}</p>
                      <p className="tk-kokok-source-meta">
                        {s.sumber} · Versi {s.versi}
                      </p>
                      <p className="tk-kokok-source-quote">{s.ringkasanKutipan}</p>
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
        />
      ) : (
        <p className="tk-muted" style={{ margin: 0 }}>
          {TEKS_KOKOK.tanpaSumber}
        </p>
      )}

      <RingkasanKasusView ringkasan={jawaban.ringkasanKasus} />
    </Card>
  );
}

export function KokokPage() {
  const isOnline = useOnlineStatus();
  const [batas7HariIso] = useState(() =>
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [referensi, setReferensi] = useState<DataReferensi | null>(null);
  const [kandang, setKandang] = useState<KandangLokal | null>(null);
  const [catatanList, setCatatanList] = useState<CatatanLokal[]>([]);
  const [riwayat, setRiwayat] = useState<PercakapanKokokLokal[]>([]);

  const [gejala, setGejala] = useState("");
  const [sejakKapan, setSejakKapan] = useState("");
  const [infoKonteksCatatan, setInfoKonteksCatatan] = useState<string | null>(null);
  const [sedangKirim, setSedangKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [batasHarianPesan, setBatasHarianPesan] = useState<string | null>(null);

  useEffect(() => {
    let aktif = true;
    const muatAwal = async () => {
      const refRes = await muatReferensiPakan(isOnline);
      if (aktif && refRes.data) {
        setReferensi(refRes.data);
      }

      try {
        const [daftarKandang, daftarRiwayat, drafTanya, drafKonteks] = await Promise.all([
          db.kandang.toArray(),
          db.kokok.orderBy("dibuatPada").reverse().toArray(),
          db.draf.get(KUNCI_DRAF_PERTANYAAN),
          db.draf.get(KUNCI_DRAF_KONTEKS),
        ]);
        if (!aktif) return;

        setRiwayat(daftarRiwayat);

        const kandangAktif =
          daftarKandang.sort((a: KandangLokal, b: KandangLokal) =>
            b.diubahPada.localeCompare(a.diubahPada),
          )[0] ?? null;
        setKandang(kandangAktif);

        if (kandangAktif) {
          const semuaCatatan = await db.catatan
            .where("kandangId")
            .equals(kandangAktif.id)
            .toArray();
          if (aktif) {
            setCatatanList(
              semuaCatatan
                .filter((c) => !c.dihapusPada)
                .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
            );
          }
        }

        if (drafKonteks?.teks) {
          setGejala(drafKonteks.teks);
          setInfoKonteksCatatan("Konteks peringatan dari Catatan harian sudah diisi otomatis.");
          await db.draf.delete(KUNCI_DRAF_KONTEKS);
          await db.draf.put({
            kunci: KUNCI_DRAF_PERTANYAAN,
            teks: drafKonteks.teks,
            diubahPada: new Date().toISOString(),
          });
        } else if (drafTanya?.teks) {
          setGejala(drafTanya.teks);
        }
      } catch {
        // Biarkan halaman tetap dapat digunakan walau IndexedDB terbatas
      }
    };

    void muatAwal();
    return () => {
      aktif = false;
    };
  }, [isOnline]);

  const peringatan7Hari = useMemo(() => {
    if (!kandang || !referensi) return [];
    const catatan7Hari = catatanList.filter((c) => c.tanggal >= batas7HariIso);
    const alerts = evaluateAlerts(catatan7Hari, kandang, referensi.ambangPeringatan);
    return alerts.map((a) => `${a.judul}: ${a.alasan}`);
  }, [kandang, catatanList, referensi, batas7HariIso]);

  const simpanDrafPertanyaan = (nilai: string) => {
    setGejala(nilai);
    void db.draf
      .put({
        kunci: KUNCI_DRAF_PERTANYAAN,
        teks: nilai,
        diubahPada: new Date().toISOString(),
      })
      .catch(() => {
        // Abaikan bila penyimpanan lokal tidak tersedia
      });
  };

  const handlePilihGejalaCepat = (teksGejala: string) => {
    const baru = gejala.trim() ? `${gejala.trim()}. ${teksGejala}` : teksGejala;
    simpanDrafPertanyaan(baru);
    setGalat(null);
  };

  const handleKirim = async (e: FormEvent) => {
    e.preventDefault();
    setGalat(null);
    setBatasHarianPesan(null);

    const teksBersih = gejala.trim();
    if (teksBersih.length < 3) {
      setGalat(TEKS_KOKOK.galatMinimalGejala);
      return;
    }

    if (!isOnline) {
      setGalat(TEKS_KOKOK.alasanOffline);
      return;
    }

    setSedangKirim(true);
    try {
      const perangkatId = await getOrCreateDeviceId();
      const res = await fetch("/v1/kokok/triase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": perangkatId,
        },
        body: JSON.stringify({
          gejala: teksBersih,
          sejakKapan: sejakKapan.trim() || undefined,
          perangkatId,
          konteksKandang: kandang
            ? {
                namaKandang: kandang.nama,
                jenisAyam: kandang.jenisAyam,
                umurMinggu: kandang.umurMinggu,
                jumlahEkor: kandang.jumlahEkor,
                lokasi: kandang.lokasi,
                peringatan7Hari,
              }
            : undefined,
        }),
      });

      const body: unknown = await res.json();

      if (res.status === 429) {
        const parsedGalat = galatApiSchema.safeParse(body);
        setBatasHarianPesan(
          parsedGalat.success
            ? parsedGalat.data.pesan
            : "Batas pertanyaan ke Kokok hari ini sudah tercapai. Coba lagi besok.",
        );
        return;
      }

      if (!res.ok) {
        const parsedGalat = galatApiSchema.safeParse(body);
        setGalat(parsedGalat.success ? parsedGalat.data.pesan : TEKS_KOKOK.galatServer);
        return;
      }

      const parsed = kokokTriaseResponseSchema.parse(body);
      const itemBaru: PercakapanKokokLokal = {
        id: parsed.id,
        pertanyaan: teksBersih,
        sejakKapan: sejakKapan.trim() || undefined,
        jawaban: parsed,
        dibuatPada: parsed.dibuatPada,
      };

      try {
        await db.kokok.put(itemBaru);
        await db.draf.delete(KUNCI_DRAF_PERTANYAAN);
      } catch {
        // Tetap tampilkan hasil di layar walau IndexedDB terbatas (mis. jsdom)
      }

      setRiwayat((prev) => [itemBaru, ...prev]);
      setGejala("");
      setSejakKapan("");
      setInfoKonteksCatatan(null);
    } catch {
      setGalat(TEKS_KOKOK.galatServer);
    } finally {
      setSedangKirim(false);
    }
  };

  const gejalaCepat = referensi?.gejalaAwalKokok ?? [];

  return (
    <AppShell pageTitle={TEKS_KOKOK.judulHalaman}>
      <Card variant="warm">
        <div className="tk-kokok-header">
          <KokokMascot
            size="md"
            interactive
            messages={[
              "Halo, saya Kokok! Ceritakan gejala ayam Anda untuk cek urgensi.",
              "Pisahkan ayam sakit sejak dini agar tidak menular ke seluruh kandang.",
              "Saya membantu menyusun ringkasan kasus untuk dikirim ke dokter hewan atau penyuluh.",
            ]}
          />
          <div>
            <p className="tk-eyebrow">{TEKS_KOKOK.eyebrow}</p>
            <h1 className="tk-kokok-title">{TEKS_KOKOK.judul}</h1>
            <p className="tk-kokok-disclaimer">{TEKS_KOKOK.penafianPermanen}</p>
            <div className="tk-kokok-trial-row">
              <Badge variant="usang" label={TEKS_KOKOK.badgeUjiCoba} />
              <span className="tk-muted" style={{ fontSize: "var(--text-sm)" }}>
                {TEKS_KOKOK.catatanUjiCoba}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {!isOnline && <Banner variant="offline">{TEKS_KOKOK.bannerOffline}</Banner>}
      {batasHarianPesan && <Banner variant="info">{batasHarianPesan}</Banner>}
      {infoKonteksCatatan && <Banner variant="info">{infoKonteksCatatan}</Banner>}

      <Card>
        <form onSubmit={(e) => void handleKirim(e)} className="tk-kokok-stack" noValidate>
          {gejalaCepat.length > 0 && (
            <div>
              <p
                style={{
                  margin: "0 0 var(--space-2)",
                  fontWeight: 600,
                  fontSize: "var(--text-sm)",
                }}
              >
                {TEKS_KOKOK.labelGejalaCepat}
              </p>
              <div className="tk-kokok-chips">
                {gejalaCepat.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="tk-kokok-chip"
                    onClick={() => handlePilihGejalaCepat(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Field id="kokok-gejala" label={TEKS_KOKOK.labelTextarea} required>
            <textarea
              id="kokok-gejala"
              className="tk-kokok-textarea"
              placeholder={TEKS_KOKOK.placeholderTextarea}
              value={gejala}
              maxLength={1000}
              onChange={(e) => simpanDrafPertanyaan(e.target.value)}
            />
          </Field>

          <Field id="kokok-sejak" label={TEKS_KOKOK.labelSejakKapan}>
            <TextInput
              id="kokok-sejak"
              placeholder={TEKS_KOKOK.placeholderSejakKapan}
              value={sejakKapan}
              maxLength={100}
              onChange={(e) => setSejakKapan(e.target.value)}
            />
          </Field>

          {kandang && (
            <p className="tk-kokok-context-note">
              Konteks kandang otomatis ikut dikirim: <strong>{kandang.nama}</strong> (
              {formatAngka(kandang.jumlahEkor, 0)} ekor
              {kandang.umurMinggu !== null ? `, umur ${kandang.umurMinggu} minggu` : ""}
              {peringatan7Hari.length > 0
                ? `, ${peringatan7Hari.length} peringatan 7 hari terakhir`
                : ""}
              ).
            </p>
          )}

          {galat && <Banner variant="error">{galat}</Banner>}

          <div>
            <Button
              type="submit"
              variant="primary"
              disabled={!isOnline || sedangKirim}
              iconStart={<ChatIcon size={20} />}
            >
              {sedangKirim ? TEKS_KOKOK.tombolMengirim : TEKS_KOKOK.tombolKirim}
            </Button>
            {!isOnline && (
              <p
                className="tk-muted"
                style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-sm)" }}
              >
                {TEKS_KOKOK.alasanOffline}
              </p>
            )}
          </div>
        </form>
      </Card>

      {sedangKirim && (
        <Card as="div" role="status" aria-busy="true" className="tk-kokok-skeleton-box">
          <Skeleton variant="title" />
          <Skeleton variant="text" />
          <Skeleton variant="card" />
        </Card>
      )}

      <section aria-labelledby="kokok-riwayat-heading" className="tk-kokok-stack">
        <h2 id="kokok-riwayat-heading" className="tk-kokok-section-heading">
          {TEKS_KOKOK.judulRiwayat}
        </h2>

        {riwayat.length === 0 ? (
          <Card>
            <p className="tk-muted tk-prose" style={{ margin: 0 }}>
              {TEKS_KOKOK.kosongRiwayat}
            </p>
          </Card>
        ) : (
          riwayat.map((item) => <KartuPercakapanKokok key={item.id} item={item} />)
        )}
      </section>
    </AppShell>
  );
}
