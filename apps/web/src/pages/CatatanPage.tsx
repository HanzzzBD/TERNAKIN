import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  evaluateAlerts,
  formatAngka,
  type DataReferensi,
  type PeringatanDini,
} from "@ternakin/shared";
import { AppShell } from "../components/layout/AppShell";
import {
  ArrowRightIcon,
  Badge,
  Banner,
  Button,
  Card,
  ChatIcon,
  Field,
  NumberInput,
  Sparkline,
  TextInput,
  UrgencyChip,
} from "../components/ui";
import { db, type CatatanLokal, type KandangLokal } from "../db/db";
import {
  hapusCatatanLokal,
  simpanCatatanLokal,
  simpanKandangLokal,
  useSyncStatus,
} from "../db/sync";
import { muatReferensiPakan } from "../lib/referensi";
import "./CatatanPage.css";

function tanggalHariIni(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseAngkaOpsional(teks: string): number | null {
  const bersih = teks.replace(/\s+/g, "").trim();
  if (!bersih) return null;
  const n = Number(bersih.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseBulatOpsional(teks: string): number | null {
  const n = parseAngkaOpsional(teks);
  if (n === null) return null;
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export function CatatanPage() {
  const navigate = useNavigate();
  const { isOnline, pendingCount } = useSyncStatus();

  const [kandang, setKandang] = useState<KandangLokal | null>(null);
  const [catatanList, setCatatanList] = useState<CatatanLokal[]>([]);
  const [referensi, setReferensi] = useState<DataReferensi | null>(null);

  // Profil cepat bila peternak belum pernah mengisi profil kandang
  const [namaCepat, setNamaCepat] = useState("");
  const [ekorCepat, setEkorCepat] = useState("");
  const [galatProfilCepat, setGalatProfilCepat] = useState<string | null>(null);

  // Formulir catatan harian (1 tanggal, 4 isian)
  const [tanggal, setTanggal] = useState<string>(() => tanggalHariIni());
  const [pakanKgTeks, setPakanKgTeks] = useState("");
  const [telurTeks, setTelurTeks] = useState("");
  const [kematianTeks, setKematianTeks] = useState("");
  const [suhuTeks, setSuhuTeks] = useState("");
  const [galatForm, setGalatForm] = useState<string | null>(null);
  const [pesanSimpan, setPesanSimpan] = useState<string | null>(null);
  const [periodeHari, setPeriodeHari] = useState<7 | 14>(7);

  const muatDataLokal = useCallback(async () => {
    try {
      const semuaKandang = await db.kandang.toArray();
      const aktifKandang =
        semuaKandang.sort((a, b) => b.diubahPada.localeCompare(a.diubahPada))[0] ?? null;
      setKandang(aktifKandang);

      if (aktifKandang) {
        const semuaCatatan = await db.catatan.where("kandangId").equals(aktifKandang.id).toArray();
        const aktif = semuaCatatan
          .filter((c) => !c.dihapusPada)
          .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
        setCatatanList(aktif);
      } else {
        setCatatanList([]);
      }
    } catch {
      // Abaikan bila IndexedDB tidak tersedia
    }
  }, []);

  useEffect(() => {
    let aktif = true;
    void muatReferensiPakan(isOnline).then(({ data }) => {
      if (aktif && data) setReferensi(data);
    });
    return () => {
      aktif = false;
    };
  }, [isOnline]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void muatDataLokal();
    }, 0);
    const onSync = () => {
      void muatDataLokal();
    };
    window.addEventListener("tk:sync-change", onSync);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("tk:sync-change", onSync);
    };
  }, [muatDataLokal, pendingCount]);

  const handleBuatProfilCepat = async (e: React.FormEvent) => {
    e.preventDefault();
    setGalatProfilCepat(null);
    const jumlah = parseBulatOpsional(ekorCepat);
    if (!namaCepat.trim() || jumlah === null) {
      setGalatProfilCepat("Isi nama kandang dan jumlah ayam terlebih dahulu.");
      return;
    }
    const baru = await simpanKandangLokal({
      nama: namaCepat,
      jumlahEkor: jumlah,
      umurMinggu: null,
      lokasi: null,
      bahanTersedia: [],
    });
    setKandang(baru);
    setNamaCepat("");
    setEkorCepat("");
  };

  const handleSimpanCatatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kandang) return;

    setGalatForm(null);
    setPesanSimpan(null);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
      setGalatForm("Pilih tanggal catatan yang valid.");
      return;
    }

    const pakanKg = parseAngkaOpsional(pakanKgTeks);
    const telur = parseBulatOpsional(telurTeks);
    const kematian = parseBulatOpsional(kematianTeks);
    const suhu = parseAngkaOpsional(suhuTeks);

    if (pakanKgTeks.trim() && (pakanKg === null || pakanKg < 0)) {
      setGalatForm("Pakan terpakai harus berupa angka 0 atau lebih.");
      return;
    }
    if (telurTeks.trim() && telur === null) {
      setGalatForm("Jumlah telur harus berupa bilangan bulat 0 atau lebih.");
      return;
    }
    if (kematianTeks.trim() && kematian === null) {
      setGalatForm("Ayam mati harus berupa bilangan bulat 0 atau lebih.");
      return;
    }
    if (suhuTeks.trim() && (suhu === null || suhu < -10 || suhu > 60)) {
      setGalatForm("Suhu kandang harus berupa angka wajar antara -10 sampai 60 °C.");
      return;
    }

    if (pakanKg === null && telur === null && kematian === null && suhu === null) {
      setGalatForm("Isi minimal satu angka catatan (pakan, telur, ayam mati, atau suhu).");
      return;
    }

    const tersimpan = await simpanCatatanLokal({
      kandangId: kandang.id,
      tanggal,
      pakanKg,
      telur,
      kematian,
      suhu,
    });

    // Perbarui daftar di layar segera (tanpa menunggu jaringan).
    setCatatanList((prev) => {
      const tanpaLama = prev.filter(
        (item) => item.id !== tersimpan.id && item.tanggal !== tersimpan.tanggal,
      );
      return [tersimpan, ...tanpaLama].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    });

    setPesanSimpan(
      navigator.onLine
        ? "Catatan tersimpan dan sedang disinkronkan ke server."
        : "Tersimpan di ponsel. Dikirim saat ada sinyal.",
    );
  };

  const handleEditBaris = (item: CatatanLokal) => {
    setTanggal(item.tanggal);
    setPakanKgTeks(item.pakanKg !== null ? String(item.pakanKg) : "");
    setTelurTeks(item.telur !== null ? String(item.telur) : "");
    setKematianTeks(item.kematian !== null ? String(item.kematian) : "");
    setSuhuTeks(item.suhu !== null ? String(item.suhu) : "");
    setPesanSimpan(null);
    setGalatForm(null);
  };

  const handleHapusBaris = async (item: CatatanLokal) => {
    await hapusCatatanLokal(item);
    setCatatanList((prev) => prev.filter((c) => c.id !== item.id));
  };

  const handleTanyaKokok = async (peringatan: PeringatanDini) => {
    try {
      await db.draf.put({
        kunci: "kokok-konteks",
        teks: peringatan.ringkasanKonteks,
        diubahPada: new Date().toISOString(),
      });
    } catch {
      // Abaikan
    }
    void navigate("/app/tanya");
  };

  const riwayat30Hari = useMemo(() => catatanList.slice(0, 30), [catatanList]);

  const peringatanAktif = useMemo(() => {
    if (!kandang || !referensi) return [];
    return evaluateAlerts(catatanList, kandang, referensi.ambangPeringatan);
  }, [catatanList, kandang, referensi]);

  const dataSparklineTelur = useMemo(
    () =>
      catatanList
        .slice(0, periodeHari)
        .reverse()
        .filter((c): c is CatatanLokal & { telur: number } => c.telur !== null)
        .map((c) => ({ tanggal: c.tanggal, nilai: c.telur })),
    [catatanList, periodeHari],
  );

  const dataSparklinePakan = useMemo(
    () =>
      catatanList
        .slice(0, periodeHari)
        .reverse()
        .filter((c): c is CatatanLokal & { pakanKg: number } => c.pakanKg !== null)
        .map((c) => ({ tanggal: c.tanggal, nilai: c.pakanKg })),
    [catatanList, periodeHari],
  );

  return (
    <AppShell pageTitle="Catatan harian">
      <Card variant="warm">
        <p className="tk-eyebrow">CATAT DI KANDANG · JALAN TANPA SINYAL</p>
        <h1 className="tk-pakan-h1">Catatan harian kandang</h1>
        <p className="tk-muted tk-prose" style={{ marginBottom: 0 }}>
          Isi pakan, telur, ayam mati, dan suhu kurang dari satu menit. Semua tersimpan di ponsel
          dulu lalu terkirim saat sinyal kembali.
        </p>
      </Card>

      {!kandang ? (
        <Card>
          <h2 className="tk-pakan-h2">Siapkan profil kandang dulu</h2>
          <p className="tk-muted tk-prose">
            Masukkan nama kandang dan jumlah ayam petelur agar catatan dan peringatan dini bisa
            langsung dihitung.
          </p>
          <form
            onSubmit={(e) => void handleBuatProfilCepat(e)}
            className="tk-pakan-stack"
            noValidate
          >
            <Field id="cepat-nama" label="Nama kandang" required>
              <TextInput
                id="cepat-nama"
                placeholder="Contoh: Kandang Blok A"
                value={namaCepat}
                onChange={(e) => setNamaCepat(e.target.value)}
              />
            </Field>
            <Field id="cepat-ekor" label="Jumlah ayam" required>
              <NumberInput
                id="cepat-ekor"
                unit="ekor"
                placeholder="mis. 750"
                value={ekorCepat}
                onChange={(e) => setEkorCepat(e.target.value)}
              />
            </Field>
            {galatProfilCepat && <Banner variant="error">{galatProfilCepat}</Banner>}
            <div className="tk-actions-row">
              <Button type="submit" variant="primary">
                Mulai mencatat
              </Button>
              <Button
                variant="secondary"
                iconEnd={<ArrowRightIcon size={18} />}
                onClick={() => {
                  void navigate("/app/profil");
                }}
              >
                Isi profil lengkap
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="tk-catatan-layout">
          <div className="tk-pakan-stack">
            <Card>
              <h2 className="tk-pakan-h2">Isi catatan untuk {kandang.nama}</h2>
              <form
                onSubmit={(e) => void handleSimpanCatatan(e)}
                className="tk-pakan-stack"
                noValidate
              >
                <Field
                  id="catatan-tanggal"
                  label="Tanggal catatan"
                  hint="Menyimpan ulang tanggal yang sama akan memperbarui catatan hari itu."
                >
                  <TextInput
                    id="catatan-tanggal"
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                  />
                </Field>

                <div className="tk-catatan-grid-form">
                  <Field id="catatan-pakan" label="Pakan terpakai">
                    <NumberInput
                      id="catatan-pakan"
                      unit="kg"
                      placeholder="0"
                      value={pakanKgTeks}
                      onChange={(e) => setPakanKgTeks(e.target.value)}
                    />
                  </Field>

                  <Field id="catatan-telur" label="Produksi telur">
                    <NumberInput
                      id="catatan-telur"
                      unit="butir"
                      placeholder="0"
                      value={telurTeks}
                      onChange={(e) => setTelurTeks(e.target.value)}
                    />
                  </Field>

                  <Field id="catatan-kematian" label="Ayam mati">
                    <NumberInput
                      id="catatan-kematian"
                      unit="ekor"
                      placeholder="0"
                      value={kematianTeks}
                      onChange={(e) => setKematianTeks(e.target.value)}
                    />
                  </Field>

                  <Field id="catatan-suhu" label="Suhu kandang">
                    <NumberInput
                      id="catatan-suhu"
                      unit="°C"
                      placeholder="28"
                      value={suhuTeks}
                      onChange={(e) => setSuhuTeks(e.target.value)}
                    />
                  </Field>
                </div>

                {galatForm && <Banner variant="error">{galatForm}</Banner>}
                {pesanSimpan && (
                  <Banner variant={isOnline ? "success" : "offline"}>{pesanSimpan}</Banner>
                )}

                <Button type="submit" variant="primary" fullWidth>
                  Simpan catatan
                </Button>
              </form>
            </Card>

            {peringatanAktif.length > 0 && (
              <div className="tk-alert-list" aria-live="polite">
                {peringatanAktif.map((p) => (
                  <Card
                    key={p.id}
                    variant={p.tingkat === "tinggi" ? "danger" : "warm"}
                    as="article"
                  >
                    <div className="tk-alert-card__top">
                      <strong>{p.judul}</strong>
                      <UrgencyChip urgency={p.tingkat} />
                    </div>
                    <p className="tk-prose" style={{ marginBottom: "var(--space-2)" }}>
                      {p.alasan}
                    </p>
                    <p
                      className="tk-muted"
                      style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-3)" }}
                    >
                      Acuan ambang: {p.sumberAmbang}
                    </p>
                    <Button
                      variant="secondary"
                      iconStart={<ChatIcon size={18} />}
                      onClick={() => void handleTanyaKokok(p)}
                    >
                      Tanya Kokok soal ini
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="tk-pakan-stack">
            <Card>
              <div className="tk-catatan-tren-head">
                <h2 className="tk-pakan-h2" style={{ marginBottom: 0 }}>
                  Tren {periodeHari} hari terakhir
                </h2>
                <div className="tk-periode-group" role="group" aria-label="Pilih rentang tren">
                  <button
                    type="button"
                    className={`tk-periode-btn ${periodeHari === 7 ? "tk-periode-btn--aktif" : ""}`.trim()}
                    aria-pressed={periodeHari === 7}
                    onClick={() => setPeriodeHari(7)}
                  >
                    7 hari
                  </button>
                  <button
                    type="button"
                    className={`tk-periode-btn ${periodeHari === 14 ? "tk-periode-btn--aktif" : ""}`.trim()}
                    aria-pressed={periodeHari === 14}
                    onClick={() => setPeriodeHari(14)}
                  >
                    14 hari
                  </button>
                </div>
              </div>

              <div className="tk-sparkline-grid">
                <Sparkline
                  judul="Telur harian"
                  satuan="butir"
                  data={dataSparklineTelur}
                  aksen="hijau"
                />
                <Sparkline
                  judul="Pakan terpakai"
                  satuan="kg"
                  data={dataSparklinePakan}
                  aksen="oranye"
                />
              </div>
            </Card>

            <Card>
              <h2 className="tk-pakan-h2">Riwayat 30 hari terakhir</h2>
              {riwayat30Hari.length === 0 ? (
                <p className="tk-muted tk-prose" style={{ marginBottom: 0 }}>
                  Belum ada catatan tersimpan. Isi formulir di atas untuk mulai mencatat hari ini.
                </p>
              ) : (
                <div className="tk-riwayat-list">
                  {riwayat30Hari.map((item) => (
                    <article key={item.id} className="tk-riwayat-item">
                      <div className="tk-riwayat-item__top">
                        <strong className="tk-tabular">{item.tanggal}</strong>
                        <Badge
                          variant={item.syncState === "synced" ? "solver" : "usang"}
                          label={item.syncState === "synced" ? "Tersinkron" : "Menunggu dikirim"}
                        />
                      </div>

                      <div className="tk-riwayat-item__metrics tk-tabular">
                        <div className="tk-metric-box">
                          <span className="tk-metric-box__label">Pakan</span>
                          <span className="tk-metric-box__val">
                            {item.pakanKg !== null ? `${formatAngka(item.pakanKg, 1)} kg` : "-"}
                          </span>
                        </div>
                        <div className="tk-metric-box">
                          <span className="tk-metric-box__label">Telur</span>
                          <span className="tk-metric-box__val">
                            {item.telur !== null ? `${formatAngka(item.telur, 0)} butir` : "-"}
                          </span>
                        </div>
                        <div className="tk-metric-box">
                          <span className="tk-metric-box__label">Mati</span>
                          <span className="tk-metric-box__val">
                            {item.kematian !== null ? `${formatAngka(item.kematian, 0)} ekor` : "-"}
                          </span>
                        </div>
                        <div className="tk-metric-box">
                          <span className="tk-metric-box__label">Suhu</span>
                          <span className="tk-metric-box__val">
                            {item.suhu !== null ? `${formatAngka(item.suhu, 1)} °C` : "-"}
                          </span>
                        </div>
                      </div>

                      <div className="tk-actions-row">
                        <Button variant="secondary" onClick={() => handleEditBaris(item)}>
                          Ubah
                        </Button>
                        <Button variant="ghost" onClick={() => void handleHapusBaris(item)}>
                          Hapus
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
