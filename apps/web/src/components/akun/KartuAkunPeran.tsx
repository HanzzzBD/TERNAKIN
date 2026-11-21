import { useState } from "react";
import { Link, useNavigate } from "react-router";
import type { PeranAkun } from "@ternakin/shared";
import { GalatAkun, aturPeran } from "../../lib/akun";
import { BERANDA_PERAN, LABEL_PERAN, namaTampil, usePeranAktif } from "../../lib/peran";
import { Banner, Button, Card, HomeIcon, SproutCoinIcon } from "../ui";

const KETERANGAN: Record<PeranAkun, string> = {
  peternak: "Hitung pakan, catatan harian, toko pakan, tanya Kokok, dan ajukan peluang modal.",
  pengguna: "Tanya Kokok soal ayam peliharaan dan titip modal ke peternak di sekitar.",
};

/** Status akun dan ganti peran (satu peran per akun, bisa diganti; data kandang tetap tersimpan). */
export function KartuAkunPeran() {
  const { akun, peran } = usePeranAktif();
  const navigate = useNavigate();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [sedang, setSedang] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  if (!akun) {
    return (
      <Card>
        <h2 className="tk-pakan-h2">Akun</h2>
        <p className="tk-muted tk-prose">
          Anda memakai Ternakin tanpa akun sebagai peternak; data tersimpan di HP ini.
        </p>
        <div className="tk-actions-row">
          <Link to="/app/masuk" className="tk-btn tk-btn--primary">
            Masuk dengan WhatsApp
          </Link>
          <Link to="/app/masuk?peran=pengguna" className="tk-btn tk-btn--secondary">
            Ingin titip modal? Masuk sebagai Pengguna
          </Link>
        </div>
      </Card>
    );
  }

  const peranSaatIni: PeranAkun = akun.peran ?? "peternak";
  const peranLain: PeranAkun = peranSaatIni === "peternak" ? "pengguna" : "peternak";

  const ganti = async () => {
    setGalat(null);
    setSedang(true);
    try {
      await aturPeran(peranLain);
      setKonfirmasi(false);
      void navigate(BERANDA_PERAN[peranLain]);
    } catch (err) {
      setGalat(err instanceof GalatAkun ? err.message : "Peran belum bisa diganti. Coba lagi.");
    } finally {
      setSedang(false);
    }
  };

  return (
    <Card>
      <h2 className="tk-pakan-h2">Akun dan peran</h2>
      <p className="tk-prose" style={{ marginTop: 0 }}>
        <strong>{namaTampil(akun)}</strong>
        {akun.isDemo && " (akun demo)"} · Peran{" "}
        <strong>{peran === "tamu" ? "belum dipilih" : LABEL_PERAN[peranSaatIni]}</strong>
      </p>
      <p className="tk-muted tk-prose">{KETERANGAN[peranSaatIni]}</p>

      {akun.isDemo ? (
        <p className="tk-muted tk-prose" style={{ marginBottom: 0 }}>
          Peran akun demo tetap. Untuk mencoba peran lain, keluar lalu pilih akun demo lainnya.
        </p>
      ) : !konfirmasi ? (
        <Button
          variant="secondary"
          iconStart={
            peranLain === "peternak" ? <HomeIcon size={18} /> : <SproutCoinIcon size={18} />
          }
          onClick={() => setKonfirmasi(true)}
        >
          Ganti peran ke {LABEL_PERAN[peranLain]}
        </Button>
      ) : (
        <div className="tk-pakan-stack">
          <Banner variant="info" title={`Ganti ke ${LABEL_PERAN[peranLain]}?`}>
            {peranLain === "pengguna"
              ? "Menu pakan, catatan, dan toko akan disembunyikan. Data kandang Anda tetap tersimpan di akun dan kembali saat Anda berganti ke Peternak."
              : "Menu pakan, catatan, toko, dan peluang kandang akan tampil. Minat titip modal Anda tetap tersimpan."}
          </Banner>
          <div className="tk-actions-row">
            <Button disabled={sedang} onClick={() => void ganti()}>
              {sedang ? "Mengganti..." : `Ya, jadi ${LABEL_PERAN[peranLain]}`}
            </Button>
            <Button variant="secondary" onClick={() => setKonfirmasi(false)}>
              Batal
            </Button>
          </div>
        </div>
      )}
      {galat && <Banner variant="error">{galat}</Banner>}
    </Card>
  );
}
