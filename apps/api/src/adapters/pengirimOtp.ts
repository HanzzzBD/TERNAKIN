import { logger } from "../lib/logger.js";

/**
 * Pengirim pesan OTP. Implementasi utama lewat Fonnte (gateway WhatsApp);
 * mode demo hanya mencatat bahwa kode dibuat, kode ditampilkan lewat respons API.
 */
export interface PengirimOtp {
  readonly mode: "fonnte" | "demo";
  kirim(nomor628: string, pesan: string): Promise<void>;
}

export class GalatPengirimOtp extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GalatPengirimOtp";
  }
}

const URL_FONNTE = "https://api.fonnte.com/send";

interface ResponsFonnte {
  status?: boolean;
  Status?: boolean;
  reason?: string;
  detail?: string;
}

export interface FonnteOptions {
  token: string;
  timeoutMs: number;
  url?: string;
  fetchFn?: typeof fetch;
}

export class FonntePengirimOtp implements PengirimOtp {
  readonly mode = "fonnte" as const;
  private readonly fetchFn: typeof fetch;

  constructor(private readonly opsi: FonnteOptions) {
    if (!opsi.token) throw new GalatPengirimOtp("Token Fonnte kosong.");
    this.fetchFn = opsi.fetchFn ?? fetch;
  }

  async kirim(nomor628: string, pesan: string): Promise<void> {
    const form = new FormData();
    form.set("target", nomor628);
    form.set("message", pesan);
    // Nomor sudah berawalan 62; "0" mematikan penambahan kode negara otomatis di Fonnte.
    form.set("countryCode", "0");

    let res: Response;
    try {
      res = await this.fetchFn(this.opsi.url ?? URL_FONNTE, {
        method: "POST",
        headers: { Authorization: this.opsi.token },
        body: form,
        signal: AbortSignal.timeout(this.opsi.timeoutMs),
      });
    } catch {
      throw new GalatPengirimOtp("Gagal menghubungi Fonnte.");
    }

    let json: ResponsFonnte = {};
    try {
      json = (await res.json()) as ResponsFonnte;
    } catch {
      // isi bukan JSON
    }

    const berhasil = res.ok && (json.status ?? json.Status) === true;
    if (!berhasil) {
      throw new GalatPengirimOtp(
        `Fonnte menolak pengiriman (HTTP ${res.status}${json.reason ? `: ${json.reason.slice(0, 120)}` : ""}).`,
      );
    }
  }
}

/** Mode demo: tidak mengirim apa pun. Hanya boleh aktif di luar production. */
export class DemoPengirimOtp implements PengirimOtp {
  readonly mode = "demo" as const;

  async kirim(): Promise<void> {
    logger.warn("Mode demo OTP: kode tidak dikirim ke WhatsApp, ditampilkan di layar Masuk");
  }
}
