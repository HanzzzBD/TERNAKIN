import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "../lib/logger.js";
import { CID_LOGO, type IsiEmail } from "../lib/templateEmail.js";

/**
 * Pengirim email kode verifikasi dan reset sandi lewat SMTP (Resend, Gmail + App Password,
 * atau email domain sendiri). Mode demo tidak mengirim apa pun dan kode ditampilkan lewat
 * respons API (hanya di luar production).
 */
export interface PengirimEmail {
  readonly mode: "smtp" | "demo";
  kirim(ke: string, isi: IsiEmail): Promise<void>;
}

export class GalatPengirimEmail extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GalatPengirimEmail";
  }
}

export interface OpsiSmtp {
  host: string;
  port: number;
  user: string;
  pass: string;
  dari: string;
}

/** Logo Kokok (PNG kecil) yang disisipkan inline; sama di src/ maupun dist/ (apps/api/assets). */
const PATH_LOGO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../assets/kokok-email.png",
);

export class SmtpPengirimEmail implements PengirimEmail {
  readonly mode = "smtp" as const;
  private readonly transport: Transporter;
  private readonly adaLogo = fs.existsSync(PATH_LOGO);

  constructor(private readonly opsi: OpsiSmtp) {
    this.transport = nodemailer.createTransport({
      host: opsi.host,
      port: opsi.port,
      secure: opsi.port === 465,
      auth: { user: opsi.user, pass: opsi.pass },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
    if (!this.adaLogo) logger.warn("Logo email tidak ditemukan; email dikirim tanpa logo");
  }

  async kirim(ke: string, isi: IsiEmail): Promise<void> {
    const pakaiLogo = this.adaLogo && isi.html.includes(`cid:${CID_LOGO}`);
    try {
      await this.transport.sendMail({
        from: this.opsi.dari,
        to: ke,
        subject: isi.subjek,
        text: isi.teks,
        // Tanpa file logo, HTML tetap dikirim tetapi gambar dibuang agar tidak tampil rusak.
        html: pakaiLogo ? isi.html : isi.html.replace(/<img [^>]*cid:[^>]*>/g, ""),
        attachments: pakaiLogo
          ? [
              {
                filename: "kokok.png",
                path: PATH_LOGO,
                cid: CID_LOGO,
                contentDisposition: "inline",
              },
            ]
          : [],
      });
    } catch (err) {
      // Pesan galat SMTP bisa memuat detail server; cukup jenisnya untuk log.
      const kode = (err as { code?: string }).code ?? "tidak diketahui";
      throw new GalatPengirimEmail(`Gagal mengirim email (${kode}).`);
    }
  }
}

export class DemoPengirimEmail implements PengirimEmail {
  readonly mode = "demo" as const;

  async kirim(): Promise<void> {
    logger.warn("Mode demo email: kode tidak dikirim, ditampilkan di layar");
  }
}
