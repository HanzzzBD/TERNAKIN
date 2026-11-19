import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  formatAngka,
  formatPersen,
  formatRupiah,
  galatApiSchema,
  pakanJelaskanResponseSchema,
  pakanUraiResponseSchema,
  type DataReferensi,
  type FaseAyam,
  type ItemUraiPakan,
  type PakanHitungLayak,
  type PakanHitungResult,
} from "@ternakin/shared";
import { AppShell } from "../components/layout/AppShell";
import {
  Accordion,
  ArrowRightIcon,
  Badge,
  Banner,
  Button,
  Card,
  CheckIcon,
  Field,
  NumberInput,
  PlusIcon,
  RefreshIcon,
  Skeleton,
  StoreIcon,
} from "../components/ui";
import { db, getOrCreateDeviceId } from "../db/db";
import { useOnlineStatus } from "../lib/pwa";
import { muatReferensiPakan } from "../lib/referensi";
import { runFeedSolver } from "../lib/runSolver";
import { TEKS_PAKAN } from "../lib/teks";
import "./PakanPage.css";

const KUNCI_DRAF_TEKS = "pakan-teks";

const PILIHAN_FASE: readonly { id: FaseAyam; nama: string; sub: string }[] = [
  { id: "starter", nama: "Starter", sub: "0–6 mgg" },
  { id: "grower", nama: "Grower", sub: "7–18 mgg" },
  { id: "layer", nama: "Layer", sub: "Produksi" },
];

interface BarisKonfirmasiUrai {
  kunci: string;
  bahanId: string;
  namaMentah: string;
  hargaTeks: string;
}

type StatusPenjelasan =
  | { state: "diam" }
  | { state: "memuat" }
  | { state: "offline" }
  | { state: "tampil"; teks: string }
  | { state: "ditolak"; alasan: string }
  | { state: "batas"; pesan: string }
  | { state: "galat" };

function parseInputHarga(teks: string): number | null {
  const bersih = teks.replace(/\s+/g, "").trim();
  if (!bersih) return null;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(bersih)) {
    const n = Number(bersih.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const n = Number(bersih.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function hitungPersenBar(nilai: number, batasMin: number | null, batasMaks: number | null): number {
  const acuan = batasMaks ?? (batasMin ? batasMin * 1.25 : 100);
  if (acuan <= 0) return 0;
  return Math.max(4, Math.min(100, Math.round((nilai / acuan) * 100)));
}

export function PakanPage() {
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();

  const [referensi, setReferensi] = useState<DataReferensi | null>(null);
  const [memuatRef, setMemuatRef] = useState(true);
  const [galatRef, setGalatRef] = useState(false);

  const [fase, setFase] = useState<FaseAyam>("layer");
  const [dipilih, setDipilih] = useState<Record<string, boolean>>({});
  const [hargaTeks, setHargaTeks] = useState<Record<string, string>>({});
  const [biayaSekarangTeks, setBiayaSekarangTeks] = useState("");
  const [galatForm, setGalatForm] = useState<string | null>(null);

  const [teksBebas, setTeksBebas] = useState("");
  const [sedangUrai, setSedangUrai] = useState(false);
  const [galatUrai, setGalatUrai] = useState<string | null>(null);
  const [catatanUrai, setCatatanUrai] = useState<string[]>([]);
  const [konfirmasiUrai, setKonfirmasiUrai] = useState<BarisKonfirmasiUrai[] | null>(null);

  const [sedangHitung, setSedangHitung] = useState(false);
  const [hasilSolver, setHasilSolver] = useState<PakanHitungResult | null>(null);
  const [penjelasan, setPenjelasan] = useState<StatusPenjelasan>({ state: "diam" });

  useEffect(() => {
    let aktif = true;
    void muatReferensiPakan(isOnline).then(({ data }) => {
      if (!aktif) return;
      if (!data) {
        setGalatRef(true);
        setMemuatRef(false);
        return;
      }
      setReferensi(data);
      setGalatRef(false);
      setMemuatRef(false);
    });
    return () => {
      aktif = false;
    };
  }, [isOnline]);

  const muatUlangData = async () => {
    setMemuatRef(true);
    setGalatRef(false);
    const { data } = await muatReferensiPakan(isOnline);
    if (!data) {
      setGalatRef(true);
      setMemuatRef(false);
      return;
    }
    setReferensi(data);
    setMemuatRef(false);
  };

  // Pulihkan draf teks bebas dari IndexedDB agar tidak hilang saat offline.
  useEffect(() => {
    let aktif = true;
    db.draf
      .get(KUNCI_DRAF_TEKS)
      .then((item) => {
        if (aktif && item?.teks) {
          setTeksBebas(item.teks);
        }
      })
      .catch(() => {
        // Abaikan bila IndexedDB tidak tersedia
      });
    return () => {
      aktif = false;
    };
  }, []);

  const ubahTeksBebas = (nilai: string) => {
    setTeksBebas(nilai);
    setGalatUrai(null);
    void db.draf
      .put({ kunci: KUNCI_DRAF_TEKS, teks: nilai, diubahPada: new Date().toISOString() })
      .catch(() => {});
  };

  const handleUraiTeks = async () => {
    if (!isOnline) {
      setGalatUrai(TEKS_PAKAN.alasanUraiOffline);
      return;
    }
    if (teksBebas.trim().length < 2) {
      setGalatUrai("Tulis minimal satu bahan dan harganya dulu.");
      return;
    }

    setSedangUrai(true);
    setGalatUrai(null);
    setCatatanUrai([]);

    try {
      const perangkatId = await getOrCreateDeviceId();
      const res = await fetch("/v1/pakan/urai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teks: teksBebas, perangkatId }),
      });

      const json: unknown = await res.json();
      if (!res.ok) {
        const galat = galatApiSchema.safeParse(json);
        setGalatUrai(
          galat.success ? galat.data.pesan : "Gagal membaca teks. Coba lagi sebentar lagi.",
        );
        return;
      }

      const parsed = pakanUraiResponseSchema.safeParse(json);
      if (!parsed.success) {
        setGalatUrai(
          "Format jawaban server tidak dikenali. Silakan pilih bahan langsung di bawah.",
        );
        return;
      }

      setCatatanUrai(parsed.data.catatan);
      setKonfirmasiUrai(
        parsed.data.item.map((it: ItemUraiPakan, idx: number) => ({
          kunci: `${idx}-${it.namaMentah}`,
          bahanId: it.bahanId ?? "",
          namaMentah: it.namaMentah,
          hargaTeks: String(it.hargaPerKg),
        })),
      );
    } catch {
      setGalatUrai("Tidak dapat menjangkau server. Tulisan Anda tetap tersimpan sebagai draf.");
    } finally {
      setSedangUrai(false);
    }
  };

  const terapkanKonfirmasi = () => {
    if (!konfirmasiUrai) return;
    const dipilihBaru = { ...dipilih };
    const hargaBaru = { ...hargaTeks };
    for (const baris of konfirmasiUrai) {
      if (!baris.bahanId) continue;
      dipilihBaru[baris.bahanId] = true;
      hargaBaru[baris.bahanId] = baris.hargaTeks;
    }
    setDipilih(dipilihBaru);
    setHargaTeks(hargaBaru);
    setKonfirmasiUrai(null);
    setGalatForm(null);
  };

  const mintaPenjelasan = useCallback(
    async (hasilLayak: PakanHitungLayak) => {
      if (!isOnline) {
        setPenjelasan({ state: "offline" });
        return;
      }

      setPenjelasan({ state: "memuat" });
      try {
        const perangkatId = await getOrCreateDeviceId();
        const res = await fetch("/v1/pakan/jelaskan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hasilSolver: hasilLayak, perangkatId }),
        });

        const json: unknown = await res.json();
        if (res.status === 429) {
          const galat = galatApiSchema.safeParse(json);
          setPenjelasan({
            state: "batas",
            pesan: galat.success ? galat.data.pesan : TEKS_PAKAN.penjelasanGagal,
          });
          return;
        }
        if (!res.ok) {
          setPenjelasan({ state: "galat" });
          return;
        }

        const parsed = pakanJelaskanResponseSchema.safeParse(json);
        if (!parsed.success) {
          setPenjelasan({ state: "galat" });
          return;
        }
        if (!parsed.data.terverifikasi || !parsed.data.penjelasan) {
          setPenjelasan({
            state: "ditolak",
            alasan: parsed.data.ditolakAlasan ?? TEKS_PAKAN.penjelasanDitolak,
          });
          return;
        }
        setPenjelasan({ state: "tampil", teks: parsed.data.penjelasan });
      } catch {
        setPenjelasan(navigator.onLine ? { state: "galat" } : { state: "offline" });
      }
    },
    [isOnline],
  );

  const handleHitung = async () => {
    if (!referensi) return;
    setGalatForm(null);

    const daftarBahan = referensi.bahan
      .filter((b) => dipilih[b.id])
      .map((b) => ({
        bahanId: b.id,
        hargaPerKg: parseInputHarga(hargaTeks[b.id] ?? ""),
      }));

    if (daftarBahan.length === 0 || daftarBahan.some((d) => d.hargaPerKg === null)) {
      setGalatForm(TEKS_PAKAN.galatPilihBahan);
      return;
    }

    const bahanValid = daftarBahan.map((d) => ({
      bahanId: d.bahanId,
      hargaPerKg: d.hargaPerKg as number,
    }));

    const biayaSekarang = parseInputHarga(biayaSekarangTeks) ?? undefined;

    setSedangHitung(true);
    setPenjelasan({ state: "diam" });

    try {
      const hasil = await runFeedSolver({
        request: {
          jenisAyam: "petelur",
          fase,
          bahan: bahanValid,
          biayaSekarangPerKg: biayaSekarang,
        },
        katalogBahan: referensi.bahan,
        kebutuhanGizi: referensi.kebutuhanGizi,
        catatanData: referensi.catatanData,
        isDemo: referensi.isDemo,
      });

      setHasilSolver(hasil);
      if (hasil.status === "layak") {
        void db.komposisi
          .put({ kunci: "terakhir", hasil, disimpanPada: new Date().toISOString() })
          .catch(() => {});
        void mintaPenjelasan(hasil);
      }
    } finally {
      setSedangHitung(false);
    }
  };

  const tambahSaranBahan = (bahanId: string) => {
    setDipilih((prev) => ({ ...prev, [bahanId]: true }));
    setGalatForm(null);
  };

  const rincianPerhitungan = useMemo(() => {
    if (!hasilSolver || hasilSolver.status !== "layak") return null;
    return [
      {
        id: "rincian-solver",
        question: TEKS_PAKAN.judulLihatPerhitungan,
        answer: (
          <div className="tk-pakan-stack">
            <p>
              <strong>Status solver LP:</strong> {hasilSolver.statusSolver} (jenis ayam:{" "}
              {hasilSolver.jenisAyam}, fase: {hasilSolver.fase}).
            </p>
            <div>
              <strong>Harga bahan yang dipakai:</strong>
              <ul className="tk-rincian-list">
                {hasilSolver.komposisi.map((item) => (
                  <li key={item.bahanId} className="tk-tabular">
                    {item.nama}: {formatRupiah(item.hargaPerKg)}/kg ({formatPersen(item.persentase)}
                    )
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Batasan gizi dan sumber:</strong>
              <ul className="tk-rincian-list">
                {hasilSolver.pemenuhanGizi.map((g) => (
                  <li key={g.zatGizi} className="tk-tabular">
                    {g.label}: {formatAngka(g.nilai, 2)} {g.satuan} (target{" "}
                    {g.batasMin !== null ? `min ${formatAngka(g.batasMin, 2)}` : "tanpa min"}
                    {g.batasMaks !== null ? `, maks ${formatAngka(g.batasMaks, 2)}` : ""}) —{" "}
                    {g.sumber}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ),
      },
    ];
  }, [hasilSolver]);

  return (
    <AppShell pageTitle={TEKS_PAKAN.judulHalaman}>
      <Card variant="warm">
        <p className="tk-eyebrow">{TEKS_PAKAN.eyebrow}</p>
        <h1 className="tk-pakan-h1">{TEKS_PAKAN.judul}</h1>
        <p className="tk-muted tk-prose" style={{ marginBottom: 0 }}>
          {TEKS_PAKAN.deskripsi}
        </p>
      </Card>

      {referensi?.isDemo && (
        <Banner variant="info" title={TEKS_PAKAN.labelDataContoh}>
          {referensi.catatanData}
        </Banner>
      )}

      {memuatRef && (
        <Card>
          <div
            className="tk-pakan-stack"
            role="status"
            aria-busy="true"
            aria-label="Memuat daftar bahan pakan"
          >
            <Skeleton variant="title" />
            <Skeleton variant="text" />
            <Skeleton variant="card" />
            <Skeleton variant="button" />
          </div>
        </Card>
      )}

      {galatRef && (
        <Banner
          variant="error"
          title="Gagal memuat data bahan"
          action={
            <Button
              variant="secondary"
              iconStart={<RefreshIcon size={18} />}
              onClick={() => void muatUlangData()}
            >
              {TEKS_PAKAN.tombolMuatUlang}
            </Button>
          }
        >
          {TEKS_PAKAN.galatMemuatReferensi}
        </Banner>
      )}

      {!memuatRef && referensi && (
        <div className="tk-pakan-layout">
          <div className="tk-pakan-stack">
            <Card>
              <h2 className="tk-pakan-h2">{TEKS_PAKAN.labelFase}</h2>
              <div className="tk-fase-group" role="group" aria-label={TEKS_PAKAN.labelFase}>
                {PILIHAN_FASE.map((item) => {
                  const aktif = fase === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`tk-fase-btn ${aktif ? "tk-fase-btn--aktif" : ""}`.trim()}
                      aria-pressed={aktif}
                      onClick={() => setFase(item.id)}
                    >
                      <span className="tk-fase-btn__nama">{item.nama}</span>
                      <span className="tk-fase-btn__sub">{item.sub}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card>
              <h2 className="tk-pakan-h2">{TEKS_PAKAN.judulTeksBebas}</h2>
              <div className="tk-pakan-stack">
                <Field
                  id="pakan-teks-bebas"
                  label="Tulis daftar bahan dan harga"
                  hint={TEKS_PAKAN.petunjukTeksBebas}
                >
                  <textarea
                    id="pakan-teks-bebas"
                    className="tk-textarea"
                    value={teksBebas}
                    placeholder={TEKS_PAKAN.petunjukTeksBebas}
                    onChange={(e) => ubahTeksBebas(e.target.value)}
                  />
                </Field>

                {!isOnline && <Banner variant="offline">{TEKS_PAKAN.alasanUraiOffline}</Banner>}

                {galatUrai && <Banner variant="error">{galatUrai}</Banner>}

                <div className="tk-actions-row">
                  <Button
                    variant="secondary"
                    disabled={!isOnline || sedangUrai || teksBebas.trim().length < 2}
                    onClick={() => void handleUraiTeks()}
                  >
                    {sedangUrai ? TEKS_PAKAN.uraiMemuat : TEKS_PAKAN.tombolUraiTeks}
                  </Button>
                </div>

                {konfirmasiUrai && (
                  <Card variant="warm" as="div">
                    <h3 className="tk-pakan-h2">{TEKS_PAKAN.judulKonfirmasiUrai}</h3>
                    <p className="tk-muted" style={{ fontSize: "var(--text-sm)" }}>
                      {TEKS_PAKAN.subKonfirmasiUrai}
                    </p>

                    {catatanUrai.length > 0 && (
                      <div style={{ marginBottom: "var(--space-3)" }}>
                        <Banner variant="info">{catatanUrai.join(" ")}</Banner>
                      </div>
                    )}

                    <div className="tk-urai-list">
                      {konfirmasiUrai.map((baris, index) => (
                        <div key={baris.kunci} className="tk-urai-row">
                          <div className="tk-urai-row__bahan">
                            <label className="tk-sr-only" htmlFor={`urai-bahan-${index}`}>
                              Padanan bahan untuk {baris.namaMentah}
                            </label>
                            <select
                              id={`urai-bahan-${index}`}
                              className="tk-select"
                              value={baris.bahanId}
                              onChange={(e) => {
                                const nilai = e.target.value;
                                setKonfirmasiUrai((prev) =>
                                  prev
                                    ? prev.map((row, idx) =>
                                        idx === index ? { ...row, bahanId: nilai } : row,
                                      )
                                    : null,
                                );
                              }}
                            >
                              <option value="">-- Pilih bahan ({baris.namaMentah}) --</option>
                              {referensi.bahan.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.nama}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="tk-urai-row__harga">
                            <NumberInput
                              aria-label={`Harga ${baris.namaMentah} per kg`}
                              unit="Rp/kg"
                              value={baris.hargaTeks}
                              onChange={(e) => {
                                const nilai = e.target.value;
                                setKonfirmasiUrai((prev) =>
                                  prev
                                    ? prev.map((row, idx) =>
                                        idx === index ? { ...row, hargaTeks: nilai } : row,
                                      )
                                    : null,
                                );
                              }}
                            />
                          </div>

                          <Button
                            variant="ghost"
                            onClick={() =>
                              setKonfirmasiUrai((prev) =>
                                prev ? prev.filter((_, idx) => idx !== index) : null,
                              )
                            }
                          >
                            Hapus
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="tk-actions-row">
                      <Button variant="primary" onClick={terapkanKonfirmasi}>
                        {TEKS_PAKAN.tombolTerapkanUrai}
                      </Button>
                      <Button variant="secondary" onClick={() => setKonfirmasiUrai(null)}>
                        {TEKS_PAKAN.tombolBatalUrai}
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="tk-pakan-h2">{TEKS_PAKAN.judulPilihBahan}</h2>
              <p className="tk-muted" style={{ fontSize: "var(--text-sm)", marginBottom: 0 }}>
                {TEKS_PAKAN.petunjukPilihBahan}
              </p>

              <div className="tk-bahan-list">
                {referensi.bahan.map((bahan) => {
                  const aktif = Boolean(dipilih[bahan.id]);
                  const inputId = `harga-${bahan.id}`;
                  return (
                    <div
                      key={bahan.id}
                      className={`tk-bahan-item ${aktif ? "tk-bahan-item--dipilih" : ""}`.trim()}
                    >
                      <label className="tk-bahan-toggle">
                        <input
                          type="checkbox"
                          className="tk-bahan-checkbox"
                          checked={aktif}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setDipilih((prev) => ({ ...prev, [bahan.id]: checked }));
                            setGalatForm(null);
                          }}
                        />
                        <span className="tk-bahan-info">
                          <span className="tk-bahan-nama">{bahan.nama}</span>
                          <span className="tk-bahan-meta tk-tabular">
                            PK {formatAngka(bahan.nutrisi.protein_kasar ?? 0, 1)}% · EM{" "}
                            {formatAngka(bahan.nutrisi.energi_metabolis ?? 0, 0)} · Maks{" "}
                            {formatPersen(bahan.batasMaksPersen, 0)}
                          </span>
                        </span>
                      </label>

                      {aktif && (
                        <div className="tk-bahan-harga">
                          <label className="tk-sr-only" htmlFor={inputId}>
                            Harga {bahan.nama} per kg
                          </label>
                          <NumberInput
                            id={inputId}
                            unit="Rp/kg"
                            placeholder="mis. 6500"
                            value={hargaTeks[bahan.id] ?? ""}
                            onChange={(e) => {
                              setHargaTeks((prev) => ({ ...prev, [bahan.id]: e.target.value }));
                              setGalatForm(null);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="tk-pakan-stack">
                <Field
                  id="biaya-ransum-sekarang"
                  label={TEKS_PAKAN.labelBiayaSekarang}
                  hint={TEKS_PAKAN.petunjukBiayaSekarang}
                >
                  <NumberInput
                    id="biaya-ransum-sekarang"
                    unit="Rp/kg"
                    placeholder="mis. 8500"
                    value={biayaSekarangTeks}
                    onChange={(e) => setBiayaSekarangTeks(e.target.value)}
                  />
                </Field>

                {galatForm && <Banner variant="error">{galatForm}</Banner>}

                <Button
                  variant="primary"
                  fullWidth
                  disabled={sedangHitung}
                  onClick={() => void handleHitung()}
                >
                  {sedangHitung ? TEKS_PAKAN.hitungMemuat : TEKS_PAKAN.tombolHitung}
                </Button>
              </div>
            </Card>
          </div>

          <div className="tk-pakan-stack" aria-live="polite">
            {!hasilSolver && (
              <Card>
                <p className="tk-eyebrow">HASIL CAMPURAN</p>
                <p className="tk-muted tk-prose" style={{ marginBottom: 0 }}>
                  Pilih minimal beberapa bahan sumber energi, protein, dan kalsium lalu tekan{" "}
                  <strong>{TEKS_PAKAN.tombolHitung}</strong> untuk melihat komposisi termurah per
                  100 kg.
                </p>
              </Card>
            )}

            {hasilSolver?.status === "tak_layak" && (
              <Card variant="danger">
                <div className="tk-hasil-head">
                  <Badge variant="solver" />
                  {hasilSolver.isDemo && (
                    <Badge variant="usang" label={TEKS_PAKAN.labelDataContoh} />
                  )}
                </div>

                <Banner variant="error" title={TEKS_PAKAN.judulTakLayak}>
                  {hasilSolver.pesan}
                </Banner>

                {hasilSolver.zatBermasalah.length > 0 && (
                  <div style={{ marginTop: "var(--space-4)" }}>
                    <h2 className="tk-pakan-h2">{TEKS_PAKAN.judulZatBermasalah}</h2>
                    <ul className="tk-rincian-list">
                      {hasilSolver.zatBermasalah.map((z) => (
                        <li key={z.zatGizi} className="tk-tabular">
                          <strong>{z.label}</strong>:{" "}
                          {z.alasan === "kurang"
                            ? `maksimal baru mencapai ${formatAngka(z.nilaiTercapai ?? 0, 2)} ${z.satuan} (butuh minimal ${formatAngka(z.batasTarget, 2)} ${z.satuan})`
                            : z.alasan === "berlebih"
                              ? `minimal masih ${formatAngka(z.nilaiTercapai ?? 0, 2)} ${z.satuan} (batas maksimal ${formatAngka(z.batasTarget, 2)} ${z.satuan})`
                              : `tidak bisa dipenuhi bersamaan dengan target zat lain (target ${formatAngka(z.batasTarget, 2)} ${z.satuan})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {hasilSolver.saranBahan.length > 0 && (
                  <div style={{ marginTop: "var(--space-4)" }}>
                    <h2 className="tk-pakan-h2">{TEKS_PAKAN.judulSaranBahan}</h2>
                    <div className="tk-saran-list">
                      {hasilSolver.saranBahan.map((saran) => (
                        <div key={saran.bahanId} className="tk-saran-item">
                          <div>
                            <strong>{saran.nama}</strong>
                            <div className="tk-bahan-meta">
                              Membantu: {saran.membantuZat.join(", ")}
                            </div>
                          </div>
                          <Button
                            variant="secondary"
                            iconStart={<PlusIcon size={18} />}
                            onClick={() => tambahSaranBahan(saran.bahanId)}
                          >
                            {TEKS_PAKAN.tombolTambahSaran}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {hasilSolver?.status === "layak" && (
              <>
                <Card variant="trust">
                  <div className="tk-hasil-head">
                    <Badge variant="solver" />
                    {hasilSolver.isDemo && (
                      <Badge variant="usang" label={TEKS_PAKAN.labelDataContoh} />
                    )}
                  </div>

                  <div className="tk-hasil-angka-grid">
                    <div className="tk-hasil-kpi">
                      <p className="tk-hasil-kpi__label">{TEKS_PAKAN.labelBiayaPerKg}</p>
                      <p className="tk-hasil-kpi__nilai tk-tabular">
                        {formatRupiah(hasilSolver.biayaPerKg)}
                      </p>
                    </div>
                    <div className="tk-hasil-kpi">
                      <p className="tk-hasil-kpi__label">{TEKS_PAKAN.labelTotal100Kg}</p>
                      <p className="tk-hasil-kpi__nilai tk-tabular">
                        {formatRupiah(hasilSolver.totalBiayaPer100Kg)}
                      </p>
                    </div>
                  </div>

                  {hasilSolver.selisihPerKg !== undefined && (
                    <div style={{ marginBottom: "var(--space-4)" }}>
                      <Banner variant={hasilSolver.selisihPerKg >= 0 ? "success" : "info"}>
                        {hasilSolver.selisihPerKg >= 0 ? (
                          <span className="tk-tabular">
                            Selisih lebih rendah{" "}
                            <strong>{formatRupiah(hasilSolver.selisihPerKg)}/kg</strong> dibanding
                            biaya ransum Anda sekarang.
                          </span>
                        ) : (
                          <span className="tk-tabular">
                            Lebih tinggi{" "}
                            <strong>{formatRupiah(Math.abs(hasilSolver.selisihPerKg))}/kg</strong>{" "}
                            dari ransum Anda sekarang agar seluruh target gizi terpenuhi.
                          </span>
                        )}
                      </Banner>
                    </div>
                  )}

                  <h2 className="tk-pakan-h2">{TEKS_PAKAN.judulKomposisi}</h2>
                  <div className="tk-komposisi-list">
                    {hasilSolver.komposisi.map((item) => (
                      <div key={item.bahanId} className="tk-komposisi-row">
                        <div className="tk-komposisi-row__top">
                          <span className="tk-komposisi-row__nama">{item.nama}</span>
                          <span className="tk-komposisi-row__kg tk-tabular">
                            {formatAngka(item.kgPer100Kg, 1)} kg ({formatPersen(item.persentase, 1)}
                            )
                          </span>
                        </div>
                        <div className="tk-komposisi-row__sub tk-tabular">
                          <span>Harga {formatRupiah(item.hargaPerKg)}/kg</span>
                          <span>Subtotal {formatRupiah(item.subtotalPer100Kg)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <h2 className="tk-pakan-h2">{TEKS_PAKAN.judulGizi}</h2>
                  <div className="tk-gizi-list">
                    {hasilSolver.pemenuhanGizi.map((g) => (
                      <div key={g.zatGizi} className="tk-gizi-row">
                        <div className="tk-gizi-row__head">
                          <strong>{g.label}</strong>
                          <span className="tk-tabular">
                            {formatAngka(g.nilai, 2)} {g.satuan} ·{" "}
                            {g.terpenuhi && (
                              <span
                                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                              >
                                <CheckIcon size={14} />
                                {TEKS_PAKAN.statusTerpenuhi}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="tk-gizi-bar" aria-hidden="true">
                          <div
                            className={`tk-gizi-bar__fill ${g.terpenuhi ? "" : "tk-gizi-bar__fill--kurang"}`.trim()}
                            style={{
                              width: `${hitungPersenBar(g.nilai, g.batasMin, g.batasMaks)}%`,
                            }}
                          />
                        </div>
                        <span className="tk-bahan-meta tk-tabular">
                          Target:{" "}
                          {g.batasMin !== null
                            ? `min ${formatAngka(g.batasMin, 2)} ${g.satuan}`
                            : "tanpa batas min"}
                          {g.batasMaks !== null
                            ? ` · maks ${formatAngka(g.batasMaks, 2)} ${g.satuan}`
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <div className="tk-penjelasan-box">
                    <div>
                      <Badge variant="offline" label={TEKS_PAKAN.badgePenjelasanAi} />
                    </div>

                    {penjelasan.state === "memuat" && (
                      <div
                        className="tk-pakan-stack"
                        role="status"
                        aria-busy="true"
                        aria-label={TEKS_PAKAN.penjelasanMemuat}
                      >
                        <Skeleton variant="text" />
                        <Skeleton variant="text" />
                      </div>
                    )}

                    {penjelasan.state === "tampil" && (
                      <p className="tk-prose" style={{ marginBottom: 0 }}>
                        {penjelasan.teks}
                      </p>
                    )}

                    {penjelasan.state === "offline" && (
                      <p className="tk-muted tk-prose" style={{ marginBottom: 0 }}>
                        {TEKS_PAKAN.penjelasanOffline}
                      </p>
                    )}

                    {penjelasan.state === "ditolak" && (
                      <p className="tk-muted tk-prose" style={{ marginBottom: 0 }}>
                        {penjelasan.alasan}
                      </p>
                    )}

                    {penjelasan.state === "batas" && (
                      <p className="tk-muted tk-prose" style={{ marginBottom: 0 }}>
                        {penjelasan.pesan}
                      </p>
                    )}

                    {penjelasan.state === "galat" && (
                      <p className="tk-muted tk-prose" style={{ marginBottom: 0 }}>
                        {TEKS_PAKAN.penjelasanGagal}
                      </p>
                    )}
                  </div>
                </Card>

                {rincianPerhitungan && <Accordion items={rincianPerhitungan} />}

                <Button
                  variant="primary"
                  fullWidth
                  iconStart={<StoreIcon size={20} />}
                  iconEnd={<ArrowRightIcon size={18} />}
                  onClick={() => {
                    void navigate("/app/toko");
                  }}
                >
                  {TEKS_PAKAN.tombolLihatToko}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
