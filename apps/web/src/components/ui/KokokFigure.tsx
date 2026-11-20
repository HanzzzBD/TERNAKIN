export interface KokokFigureProps {
  /** Lebar dan tinggi gambar dalam piksel (gambar persegi). */
  size: number;
  /** Teks alternatif; kosongkan bila gambar hanya dekoratif. */
  alt?: string;
  /** Tampilkan bayangan lantai lonjong di bawah kaki Kokok. */
  grounded?: boolean;
  /** Kokok melayang naik-turun perlahan (dimatikan saat gerak dikurangi). */
  floating?: boolean;
  /** Lingkaran matahari oranye di belakang Kokok (gaya panggung hero). */
  sun?: boolean;
  className?: string;
}

/**
 * Gambar maskot Kokok dengan kesan volume 3D: tepi tebal bertumpuk (gaya clay),
 * lapisan cahaya-bayangan yang dipotong mengikuti siluet, dan bayangan lantai.
 * Kemiringan mengikuti kursor dibaca dari variabel CSS --tk-tilt-x / --tk-tilt-y
 * yang diatur oleh elemen induk.
 */
export function KokokFigure({
  size,
  alt = "",
  grounded = false,
  floating = false,
  sun = false,
  className = "",
}: KokokFigureProps) {
  const kelas = [
    "tk-kokok3d",
    floating ? "tk-kokok3d--float" : "",
    grounded ? "tk-kokok3d--grounded" : "",
    sun ? "tk-kokok3d--sun" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={kelas} style={{ ["--tk-kokok-size" as string]: `${size}px` }}>
      {sun && <span className="tk-kokok3d__sun" aria-hidden="true" />}
      <span className="tk-kokok3d__body">
        <img
          src="/images/kokok.webp"
          alt={alt}
          aria-hidden={alt === "" ? true : undefined}
          className="tk-kokok3d__img tk-kokok-mascot__img"
          width={size}
          height={size}
          draggable={false}
        />
        <span className="tk-kokok3d__shade" aria-hidden="true" />
      </span>
      {grounded && <span className="tk-kokok3d__ground" aria-hidden="true" />}
    </span>
  );
}
