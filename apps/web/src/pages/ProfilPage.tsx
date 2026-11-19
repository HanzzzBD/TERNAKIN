import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { DataReferensi } from "@ternakin/shared";
import { AppShell } from "../components/layout/AppShell";
import {
  ArrowRightIcon,
  Badge,
  Banner,
  Button,
  Card,
  Field,
  NumberInput,
  TextInput,
} from "../components/ui";
import { db, type KandangLokal } from "../db/db";
import { hapusSemuaDataPengguna, simpanKandangLokal } from "../db/sync";
import { useOnlineStatus } from "../lib/pwa";
import { muatReferensiPakan } from "../lib/referensi";

function parseBilanganBulat(teks: string): number | null {
  const bersih = teks.replace(/\./g, "").trim();
  if (!bersih) return null;
  const n = Number(bersih);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export function ProfilPage() {
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();

  const [kandangId, setKandangId] = useState<string | undefined>(undefined);
  const [nama, setNama] = useState("");
  const [jumlahEkorTeks, setJumlahEkorTeks] = useState("");
  const [umurMingguTeks, setUmurMingguTeks] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [bahanTersedia, setBahanTersedia] = useState<string[]>([]);
  const [referensi, setReferensi] = useState<DataReferensi | null>(null);

  const [galat, setGalat] = useState<string | null>(null);
  const [pesanSimpan, setPesanSimpan] = useState<string | null>(null);
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false);
  const [sedangHapus, setSedangHapus] = useState(false);
  const [pesanHapus, setPesanHapus] = useState<string | null>(null);

  useEffect(() => {
    let aktif = true;
    void db.kandang
      .toArray()
      .then((list: KandangLokal[]) => {
        if (!aktif || list.length === 0) return;
        const terbaru = list.sort((a, b) => b.diubahPada.localeCompare(a.diubahPada))[0];
        if (!terbaru) return;
        setKandangId(terbaru.id);
        setNama(terbaru.nama);
        setJumlahEkorTeks(String(terbaru.jumlahEkor));
        setUmurMingguTeks(
          terbaru.umurMinggu !== null && terbaru.umurMinggu !== undefined
            ? String(terbaru.umurMinggu)
            : "",
        );
        setLokasi(terbaru.lokasi ?? "");
        setBahanTersedia(terbaru.bahanTersedia ?? []);
      })
      .catch(() => {});

    void muatReferensiPakan(isOnline).then(({ data }) => {
      if (aktif && data) setReferensi(data);
    });

    return () => {
      aktif = false;
    };
  }, [isOnline]);

  const toggleBahan = (id: string) => {
    setBahanTersedia((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSimpan = async (event: React.FormEvent) => {
    event.preventDefault();
    setGalat(null);
    setPesanSimpan(null);
    setPesanHapus(null);

    if (nama.trim().length === 0) {
      setGalat("Nama kandang wajib diisi.");
      return;
    }

    const jumlahEkor = parseBilanganBulat(jumlahEkorTeks);
    if (jumlahEkor === null) {
      setGalat("Jumlah ayam harus berupa angka bulat 0 atau lebih.");
      return;
    }

    const umurMinggu = umurMingguTeks.trim() ? parseBilanganBulat(umurMingguTeks) : null;
    if (umurMingguTeks.trim() && umurMinggu === null) {
      setGalat("Umur ayam dalam minggu harus berupa angka bulat.");
      return;
    }

    const tersimpan = await simpanKandangLokal({
      id: kandangId,
      nama,
      jumlahEkor,
      umurMinggu,
      lokasi: lokasi.trim() || null,
      bahanTersedia,
    });
    setKandangId(tersimpan.id);
    setPesanSimpan(
      isOnline
        ? "Profil kandang tersimpan dan sedang disinkronkan."
        : "Profil kandang tersimpan di ponsel. Dikirim saat ada sinyal.",
    );
  };

  const handleHapusData = async () => {
    setSedangHapus(true);
    try {
      const { serverDihapus } = await hapusSemuaDataPengguna();
      setKandangId(undefined);
      setNama("");
      setJumlahEkorTeks("");
      setUmurMingguTeks("");
      setLokasi("");
      setBahanTersedia([]);
      setKonfirmasiHapus(false);
      setPesanSimpan(null);
      setPesanHapus(
        serverDihapus
          ? "Seluruh data kandang dan catatan Anda di perangkat dan server telah dihapus."
          : "Seluruh data di perangkat ini telah dihapus. Bila sempat tersinkron saat daring, buka kembali saat tersambung untuk memastikan data server ikut bersih.",
      );
    } finally {
      setSedangHapus(false);
    }
  };

  return (
    <AppShell pageTitle="Profil kandang">
      <Card variant="warm">
        <p className="tk-eyebrow">MODE TAMU · TERSIMPAN LOKAL</p>
        <h1 className="tk-pakan-h1">Profil kandang Anda</h1>
        <p className="tk-muted tk-prose" style={{ marginBottom: 0 }}>
          Data kandang membantu menghitung peringatan dini dan ringkasan kasus. Saat ini antarmuka
          khusus <strong>ayam petelur</strong>.
        </p>
      </Card>

      {pesanHapus && <Banner variant="success">{pesanHapus}</Banner>}

      <Card>
        <form onSubmit={(e) => void handleSimpan(e)} className="tk-pakan-stack" noValidate>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <Badge variant="solver" label="Jenis ayam: Petelur" />
          </div>

          <Field id="profil-nama" label="Nama kandang" required>
            <TextInput
              id="profil-nama"
              placeholder="Contoh: Kandang Blok A"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </Field>

          <Field
            id="profil-populasi"
            label="Jumlah ayam"
            hint="Dipakai untuk menghitung persentase produksi telur dan kematian harian."
            required
          >
            <NumberInput
              id="profil-populasi"
              unit="ekor"
              placeholder="mis. 750"
              value={jumlahEkorTeks}
              onChange={(e) => setJumlahEkorTeks(e.target.value)}
            />
          </Field>

          <Field
            id="profil-umur"
            label="Umur ayam sekarang (opsional)"
            hint="Membantu menilai apakah ayam sudah memasuki fase bertelur."
          >
            <NumberInput
              id="profil-umur"
              unit="minggu"
              placeholder="mis. 28"
              value={umurMingguTeks}
              onChange={(e) => setUmurMingguTeks(e.target.value)}
            />
          </Field>

          <Field
            id="profil-lokasi"
            label="Kecamatan atau kabupaten (opsional)"
            hint="Cukup wilayah umum, tidak perlu alamat lengkap."
          >
            <TextInput
              id="profil-lokasi"
              placeholder="Contoh: Lembang, Bandung Barat"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
            />
          </Field>

          {referensi && referensi.bahan.length > 0 && (
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="tk-field__label" style={{ marginBottom: "var(--space-2)" }}>
                Bahan pakan yang biasa tersedia (opsional)
              </legend>
              <div className="tk-bahan-list" style={{ margin: 0 }}>
                {referensi.bahan.map((b) => (
                  <label key={b.id} className="tk-bahan-item tk-bahan-toggle">
                    <input
                      type="checkbox"
                      className="tk-bahan-checkbox"
                      checked={bahanTersedia.includes(b.id)}
                      onChange={() => toggleBahan(b.id)}
                    />
                    <span className="tk-bahan-nama">{b.nama}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {galat && <Banner variant="error">{galat}</Banner>}
          {pesanSimpan && <Banner variant="success">{pesanSimpan}</Banner>}

          <div className="tk-actions-row">
            <Button type="submit" variant="primary">
              Simpan profil kandang
            </Button>
            {kandangId && (
              <Button
                variant="secondary"
                iconEnd={<ArrowRightIcon size={18} />}
                onClick={() => {
                  void navigate("/app/catatan");
                }}
              >
                Buka catatan harian
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="tk-pakan-h2">Privasi dan hapus data</h2>
        <p className="tk-muted tk-prose">
          Data kandang dan catatan harian adalah milik Anda. Anda dapat menghapus seluruh data yang
          tersimpan di perangkat dan di server kapan saja.
        </p>

        {!konfirmasiHapus ? (
          <Button variant="secondary" onClick={() => setKonfirmasiHapus(true)}>
            Hapus data saya
          </Button>
        ) : (
          <div className="tk-pakan-stack">
            <Banner variant="error" title="Konfirmasi penghapusan">
              Seluruh profil kandang, catatan harian, draf, dan riwayat di perangkat serta server
              akan dihapus permanen.
            </Banner>
            <div className="tk-actions-row">
              <Button
                variant="primary"
                disabled={sedangHapus}
                onClick={() => void handleHapusData()}
              >
                {sedangHapus ? "Menghapus..." : "Ya, hapus semua data saya"}
              </Button>
              <Button variant="secondary" onClick={() => setKonfirmasiHapus(false)}>
                Batal
              </Button>
            </div>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
