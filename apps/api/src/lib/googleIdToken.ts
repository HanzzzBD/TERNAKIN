import crypto from "node:crypto";

/**
 * Verifikasi ID token "Masuk dengan Google" (Google Identity Services) tanpa dependensi:
 * tanda tangan RS256 dicek dengan kunci publik Google (JWKS), lalu iss, aud, dan exp.
 */

const URL_JWKS = "https://www.googleapis.com/oauth2/v3/certs";
const PENERBIT_SAH = new Set(["accounts.google.com", "https://accounts.google.com"]);

export interface ProfilGoogle {
  sub: string;
  email: string;
  emailTerverifikasi: boolean;
  nama: string | null;
}

export type VerifikasiGoogle = (idToken: string) => Promise<ProfilGoogle>;

export class GalatTokenGoogle extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GalatTokenGoogle";
  }
}

interface JwkRsa {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg?: string;
}

function dekodeBagian<T>(bagian: string): T {
  try {
    return JSON.parse(Buffer.from(bagian, "base64url").toString("utf8")) as T;
  } catch {
    throw new GalatTokenGoogle("Token Google rusak.");
  }
}

export function buatVerifikasiGoogle(
  clientId: string,
  fetchFn: typeof fetch = fetch,
  sekarang: () => number = Date.now,
): VerifikasiGoogle {
  let cacheKunci: { kunci: Map<string, crypto.KeyObject>; kedaluwarsa: number } | null = null;

  const ambilKunci = async (kid: string): Promise<crypto.KeyObject> => {
    if (!cacheKunci || cacheKunci.kedaluwarsa < sekarang() || !cacheKunci.kunci.has(kid)) {
      let res: Response;
      try {
        res = await fetchFn(URL_JWKS, { signal: AbortSignal.timeout(10000) });
      } catch {
        throw new GalatTokenGoogle("Tidak bisa menghubungi Google untuk memeriksa token.");
      }
      if (!res.ok) throw new GalatTokenGoogle("Kunci publik Google tidak tersedia.");
      const json = (await res.json()) as { keys?: JwkRsa[] };
      const maxAge = Number(
        /max-age=(\d+)/.exec(res.headers.get("cache-control") ?? "")?.[1] ?? 3600,
      );
      const kunci = new Map<string, crypto.KeyObject>();
      for (const jwk of json.keys ?? []) {
        if (jwk.kty === "RSA")
          kunci.set(jwk.kid, crypto.createPublicKey({ key: jwk, format: "jwk" }));
      }
      cacheKunci = { kunci, kedaluwarsa: sekarang() + maxAge * 1000 };
    }
    const kunci = cacheKunci.kunci.get(kid);
    if (!kunci) throw new GalatTokenGoogle("Kunci penanda tangan token tidak dikenal.");
    return kunci;
  };

  return async (idToken: string): Promise<ProfilGoogle> => {
    const bagian = idToken.split(".");
    if (bagian.length !== 3) throw new GalatTokenGoogle("Format token Google tidak sah.");
    const [kepalaB64, isiB64, tandaB64] = bagian as [string, string, string];

    const kepala = dekodeBagian<{ alg?: string; kid?: string }>(kepalaB64);
    if (kepala.alg !== "RS256" || !kepala.kid) {
      throw new GalatTokenGoogle("Algoritma token Google tidak didukung.");
    }

    const kunci = await ambilKunci(kepala.kid);
    const sah = crypto.verify(
      "RSA-SHA256",
      Buffer.from(`${kepalaB64}.${isiB64}`),
      kunci,
      Buffer.from(tandaB64, "base64url"),
    );
    if (!sah) throw new GalatTokenGoogle("Tanda tangan token Google tidak sah.");

    const isi = dekodeBagian<{
      iss?: string;
      aud?: string;
      exp?: number;
      sub?: string;
      email?: string;
      email_verified?: boolean | string;
      name?: string;
    }>(isiB64);

    if (!isi.iss || !PENERBIT_SAH.has(isi.iss)) throw new GalatTokenGoogle("Penerbit token salah.");
    if (isi.aud !== clientId) throw new GalatTokenGoogle("Token bukan untuk aplikasi ini.");
    if (!isi.exp || isi.exp * 1000 < sekarang())
      throw new GalatTokenGoogle("Token Google kedaluwarsa.");
    if (!isi.sub || !isi.email) throw new GalatTokenGoogle("Token Google tidak memuat email.");

    return {
      sub: isi.sub,
      email: isi.email.trim().toLowerCase(),
      emailTerverifikasi: isi.email_verified === true || isi.email_verified === "true",
      nama: isi.name?.trim() || null,
    };
  };
}
