import { useEffect, useRef, useState } from "react";

/**
 * Tombol resmi "Masuk dengan Google" (Google Identity Services). Google mengembalikan ID token
 * (JWT) yang diperiksa server; aplikasi tidak pernah menerima kata sandi Google.
 */

interface CredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize(opsi: {
    client_id: string;
    callback: (respons: CredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(
    elemen: HTMLElement,
    opsi: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      locale?: string;
      width?: number;
    },
  ): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const URL_SKRIP = "https://accounts.google.com/gsi/client";
let muatSkrip: Promise<void> | null = null;

function muatSkripGoogle(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  muatSkrip ??= new Promise<void>((selesai, gagal) => {
    const skrip = document.createElement("script");
    skrip.src = URL_SKRIP;
    skrip.async = true;
    skrip.defer = true;
    skrip.onload = () => selesai();
    skrip.onerror = () => {
      muatSkrip = null;
      gagal(new Error("Skrip Google gagal dimuat."));
    };
    document.head.appendChild(skrip);
  });
  return muatSkrip;
}

export function TombolGoogle({
  clientId,
  onCredential,
  nonaktif = false,
}: {
  clientId: string;
  onCredential: (credential: string) => void;
  nonaktif?: boolean;
}) {
  const wadahRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onCredential);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let aktif = true;
    muatSkripGoogle()
      .then(() => {
        const google = window.google;
        if (!aktif || !google || !wadahRef.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "popup",
          cancel_on_tap_outside: true,
          callback: (respons) => {
            if (respons.credential) callbackRef.current(respons.credential);
          },
        });
        const lebar = Math.min(400, Math.max(220, wadahRef.current.clientWidth || 320));
        google.accounts.id.renderButton(wadahRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          locale: "id",
          width: lebar,
        });
      })
      .catch(() => {
        if (aktif) setGalat("Tombol Google belum bisa dimuat. Periksa sinyal, atau pakai email.");
      });
    return () => {
      aktif = false;
    };
  }, [clientId]);

  return (
    <div
      className={`tk-tombol-google ${nonaktif ? "is-nonaktif" : ""}`.trim()}
      aria-busy={nonaktif}
    >
      <div ref={wadahRef} />
      {galat && (
        <p className="tk-muted" role="status">
          {galat}
        </p>
      )}
    </div>
  );
}
