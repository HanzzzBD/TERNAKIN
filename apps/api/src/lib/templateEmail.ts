/**
 * Template email Ternakin (kode verifikasi & atur ulang sandi).
 * HTML memakai tabel dan gaya inline agar tampil sama di Gmail, Outlook, dan aplikasi ponsel.
 * Logo Kokok disisipkan sebagai lampiran inline (cid) oleh pengirim SMTP, jadi tidak butuh
 * gambar yang di-hosting di internet.
 */

export const CID_LOGO = "kokok-logo@ternakin";

export interface IsiEmail {
  subjek: string;
  teks: string;
  html: string;
}

const WARNA = {
  oranye: "#F97316",
  tinta: "#1D2A1F",
  samar: "#5B6B5E",
  krem: "#FFF3E8",
  garis: "#E7E2DC",
};

function escapeHtml(teks: string): string {
  return teks
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buatEmailKode(opsi: {
  subjek: string;
  judul: string;
  pembuka: string;
  kode: string;
  berlakuMenit: number;
  catatanKeamanan: string;
}): IsiEmail {
  const judul = escapeHtml(opsi.judul);
  const pembuka = escapeHtml(opsi.pembuka);
  const kode = escapeHtml(opsi.kode);
  const catatan = escapeHtml(opsi.catatanKeamanan);

  const teks = [
    "Ternakin",
    "",
    opsi.judul,
    "",
    opsi.pembuka,
    "",
    `Kode: ${opsi.kode}`,
    `Berlaku ${opsi.berlakuMenit} menit.`,
    "",
    opsi.catatanKeamanan,
    "",
    "Email ini dikirim otomatis oleh Ternakin. Anda tidak perlu membalasnya.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(opsi.subjek)}</title>
</head>
<body style="margin:0;padding:0;background:#F6F4F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F4F1;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:1px solid ${WARNA.garis};border-radius:16px;">
        <tr>
          <td style="padding:24px 28px 8px 28px;font-family:Arial,Helvetica,sans-serif;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;padding-right:10px;">
                  <img src="cid:${CID_LOGO}" width="48" height="48" alt="Kokok, maskot Ternakin" style="display:block;border:0;border-radius:12px;background:${WARNA.krem};">
                </td>
                <td style="vertical-align:middle;font-size:22px;font-weight:bold;color:${WARNA.tinta};">
                  Ternakin<span style="color:${WARNA.oranye};">.</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 0 28px;font-family:Arial,Helvetica,sans-serif;">
            <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:${WARNA.tinta};">${judul}</h1>
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:${WARNA.tinta};">${pembuka}</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 28px;">
            <div style="display:inline-block;padding:14px 24px;background:${WARNA.krem};border:2px solid ${WARNA.oranye};border-radius:12px;font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:bold;letter-spacing:8px;color:${WARNA.tinta};">${kode}</div>
            <p style="margin:10px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${WARNA.samar};">Berlaku ${opsi.berlakuMenit} menit.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px 24px 28px;font-family:Arial,Helvetica,sans-serif;">
            <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:${WARNA.tinta};">${catatan}</p>
            <p style="margin:0;padding-top:16px;border-top:1px solid ${WARNA.garis};font-size:12px;line-height:1.5;color:${WARNA.samar};">Email ini dikirim otomatis oleh Ternakin. Anda tidak perlu membalasnya.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  return { subjek: opsi.subjek, teks, html };
}
