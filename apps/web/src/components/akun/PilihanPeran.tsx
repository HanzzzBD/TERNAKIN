import type { PeranAkun } from "@ternakin/shared";
import { LABEL_PERAN } from "../../lib/peran";
import { HomeIcon, SproutCoinIcon } from "../ui";

const PENJELASAN_PERAN: Record<PeranAkun, string> = {
  peternak: "Hitung pakan, catatan harian, toko pakan, tanya Kokok, dan ajukan peluang modal.",
  pengguna: "Tanya Kokok soal ayam peliharaan dan titip modal ke peternak di sekitar.",
};

/** Pilihan peran Peternak / Pengguna saat masuk atau mendaftar. */
export function PilihanPeran({
  nilai,
  onPilih,
  nama,
}: {
  nilai: PeranAkun | null;
  onPilih: (peran: PeranAkun) => void;
  nama: string;
}) {
  return (
    <fieldset className="tk-masuk-peran">
      <legend className="tk-field__label">Saya masuk sebagai</legend>
      {(["peternak", "pengguna"] as const).map((peran) => (
        <label
          key={peran}
          className={`tk-masuk-peran__opsi ${nilai === peran ? "is-dipilih" : ""}`.trim()}
        >
          <input
            type="radio"
            name={nama}
            value={peran}
            checked={nilai === peran}
            onChange={() => onPilih(peran)}
          />
          <span className="tk-masuk-peran__ikon" aria-hidden="true">
            {peran === "peternak" ? <HomeIcon size={20} /> : <SproutCoinIcon size={20} />}
          </span>
          <span>
            <strong>{LABEL_PERAN[peran]}</strong>
            <span className="tk-masuk-peran__teks">{PENJELASAN_PERAN[peran]}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
