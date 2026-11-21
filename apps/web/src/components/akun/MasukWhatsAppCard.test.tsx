import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setelAkunLokal } from "../../lib/akunCache";
import { MasukWhatsAppCard } from "./MasukWhatsAppCard";

const sync = vi.hoisted(() => ({
  flushOutbox: vi.fn(async () => true),
  bersihkanDataLokal: vi.fn(async () => {}),
}));
vi.mock("../../db/sync", () => sync);
vi.mock("../../db/db", () => ({
  db: {
    meta: { delete: vi.fn(async () => {}) },
    outbox: { count: vi.fn(async () => 0) },
  },
  getOrCreateDeviceId: vi.fn(async () => "perangkat-uji"),
}));

interface PanggilanFetch {
  url: string;
  body: Record<string, unknown> | null;
}

function pasangFetch(penangan: (url: string, body: Record<string, unknown> | null) => Response) {
  const panggilan: PanggilanFetch[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null;
    panggilan.push({ url, body });
    return penangan(url, body);
  });
  return panggilan;
}

function tampilkan() {
  return render(
    <MemoryRouter>
      <MasukWhatsAppCard />
    </MemoryRouter>,
  );
}

const PENGGUNA = {
  id: "pengguna-1",
  nomorTersamar: "0812****7890",
  nama: null,
  emailTersamar: "",
  peran: "peternak" as const,
  isDemo: false,
};

beforeEach(() => {
  setelAkunLokal(null);
  sync.flushOutbox.mockClear();
  sync.bersihkanDataLokal.mockClear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MasukWhatsAppCard", () => {
  it("meminta kode, menampilkan kode demo, lalu masuk dan menarik data akun", async () => {
    const panggilan = pasangFetch((url) => {
      if (url === "/v1/auth/otp/minta") {
        return Response.json({
          ok: true,
          nomorTersamar: "0812****7890",
          berlakuDetik: 300,
          kirimUlangDetik: 60,
          kodeDemo: "482913",
        });
      }
      if (url === "/v1/auth/otp/verifikasi") {
        return Response.json({ pengguna: PENGGUNA, kandangDipindahkan: 1 });
      }
      return new Response(null, { status: 404 });
    });

    tampilkan();
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp/), {
      target: { value: "0812 3456 7890" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Kirim kode ke WhatsApp/ }));

    expect(await screen.findByText("482913")).toBeInTheDocument();
    expect(screen.getByText(/Kode dikirim ke WhatsApp/)).toBeInTheDocument();
    expect(panggilan[0]?.body).toEqual({ nomorPonsel: "0812 3456 7890" });

    fireEvent.change(screen.getByLabelText(/Kode 6 angka/), { target: { value: "48 29-13" } });
    fireEvent.click(screen.getByRole("button", { name: /^Masuk$/ }));

    // Tunggu pesan sukses dulu: teks nomor juga ada di langkah kode sebelum tampilan berganti.
    expect(
      await screen.findByText(/1 profil kandang dari HP ini sudah tersimpan/),
    ).toBeInTheDocument();
    expect(screen.getByText("0812****7890")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Keluar$/ })).toBeInTheDocument();
    const verifikasi = panggilan.find((p) => p.url === "/v1/auth/otp/verifikasi");
    expect(verifikasi?.body).toMatchObject({ nomorPonsel: "0812 3456 7890", kode: "482913" });
    expect(verifikasi?.body?.perangkatId).toBe("perangkat-uji");
    expect(sync.flushOutbox).toHaveBeenCalled();
  });

  it("menolak nomor yang salah tanpa memanggil server", async () => {
    const panggilan = pasangFetch(() => new Response(null, { status: 500 }));
    tampilkan();
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp/), { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: /Kirim kode ke WhatsApp/ }));

    expect(await screen.findByText(/Nomor WhatsApp belum benar/)).toBeInTheDocument();
    expect(panggilan).toHaveLength(0);
  });

  it("menampilkan pesan server saat kode salah", async () => {
    pasangFetch((url) => {
      if (url === "/v1/auth/otp/minta") {
        return Response.json({
          ok: true,
          nomorTersamar: "0812****7890",
          berlakuDetik: 300,
          kirimUlangDetik: 60,
        });
      }
      return Response.json(
        {
          kode: "OTP_SALAH",
          pesan: "Kode belum cocok. Periksa lagi pesan WhatsApp dari Ternakin.",
        },
        { status: 400 },
      );
    });

    tampilkan();
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp/), {
      target: { value: "081234567890" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Kirim kode ke WhatsApp/ }));
    fireEvent.change(await screen.findByLabelText(/Kode 6 angka/), { target: { value: "111111" } });
    fireEvent.click(screen.getByRole("button", { name: /^Masuk$/ }));

    expect(await screen.findByText(/Kode belum cocok/)).toBeInTheDocument();
    expect(screen.queryByText(/Mode demo/)).not.toBeInTheDocument();
  });

  it("keluar mengirim data dulu, mengakhiri sesi, lalu membersihkan data HP", async () => {
    setelAkunLokal(PENGGUNA);
    const panggilan = pasangFetch((url) =>
      url === "/v1/auth/keluar" ? Response.json({ ok: true }) : new Response(null, { status: 404 }),
    );

    tampilkan();
    expect(screen.getByText("0812****7890")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Keluar$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Ya, keluar/ }));

    await waitFor(() => expect(sync.bersihkanDataLokal).toHaveBeenCalled());
    expect(sync.flushOutbox).toHaveBeenCalled();
    expect(panggilan.map((p) => p.url)).toContain("/v1/auth/keluar");
    expect(await screen.findByLabelText(/Nomor WhatsApp/)).toBeInTheDocument();
  });
});
