import { formatAngka } from "@ternakin/shared";

export interface SparklinePoint {
  tanggal: string;
  nilai: number;
}

export interface SparklineProps {
  judul: string;
  satuan: string;
  data: readonly SparklinePoint[];
  aksen?: "oranye" | "hijau";
}

export function Sparkline({ judul, satuan, data, aksen = "oranye" }: SparklineProps) {
  if (data.length === 0) {
    return (
      <div className="tk-sparkline tk-sparkline--kosong">
        <div className="tk-sparkline__head">
          <strong>{judul}</strong>
          <span className="tk-muted">Belum ada data</span>
        </div>
      </div>
    );
  }

  const nilaiArr = data.map((d) => d.nilai);
  const min = Math.min(...nilaiArr);
  const max = Math.max(...nilaiArr);
  const rentang = max - min || 1;
  const terbaru = data[data.length - 1];

  const width = 260;
  const height = 64;
  const padX = 8;
  const padY = 8;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const titik = data.map((d, idx) => {
    const x = data.length === 1 ? width / 2 : padX + (idx / (data.length - 1)) * plotW;
    const y = padY + plotH - ((d.nilai - min) / rentang) * plotH;
    return { x, y, ...d };
  });

  const polylinePoints = titik.map((t) => `${t.x.toFixed(1)},${t.y.toFixed(1)}`).join(" ");
  const warnaGaris = aksen === "hijau" ? "var(--tk-green)" : "var(--tk-orange-dark)";

  return (
    <div className="tk-sparkline">
      <div className="tk-sparkline__head">
        <strong>{judul}</strong>
        <span className="tk-tabular tk-sparkline__nilai">
          {terbaru ? `${formatAngka(terbaru.nilai, 1)} ${satuan}` : "-"}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="tk-sparkline__svg"
        role="img"
        aria-label={`Grafik tren ${judul} (${data.length} hari): terendah ${formatAngka(min, 1)} ${satuan}, tertinggi ${formatAngka(max, 1)} ${satuan}`}
      >
        {titik.length > 1 && (
          <polyline
            fill="none"
            stroke={warnaGaris}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />
        )}
        {titik.map((t) => (
          <circle key={t.tanggal} cx={t.x} cy={t.y} r="3.5" fill={warnaGaris} />
        ))}
      </svg>

      <div className="tk-sparkline__meta tk-tabular">
        <span>
          Min {formatAngka(min, 1)} {satuan}
        </span>
        <span>
          Maks {formatAngka(max, 1)} {satuan}
        </span>
      </div>
    </div>
  );
}
