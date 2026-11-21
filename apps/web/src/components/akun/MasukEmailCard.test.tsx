import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PenggunaSaya } from "@ternakin/shared";
import { setelAkunLokal } from "../../lib/akunCache";
import { MasukEmailCard } from "./MasukEmailCard";

vi.mock("../../db/sync", () => ({
  flushOutbox: vi.fn(async () => true),
  bersihkanDataLokal: vi.fn(async () => {}),
}));
vi.mock("../../db/db", () => ({
  db: {
    meta: { delete: vi.fn(async () => {}) },
    outbox: { count: vi.fn(async () => 0) },
    kandang: { count: vi.fn(async () => 0) },
  },
  getOrCreateDeviceId: vi.fn(async () => "perangkat-uji"),
}));

const PENGGUNA: PenggunaSaya = {
  id: "p-1",
  nomorTersamar: "",
  emailTersamar: "eu***@gmail.com",
  nama: "Bu Euis",
  peran: "peternak",
  isDemo: false,
};

const KODE = {
  ok: true,
  emailTersamar: "eu***@gmail.com",
  berlakuDetik: 900,
  kirimUlangDetik: 60,
  kodeDemo: "135790",
};

type Penangan = (body: Record<string, unknown>) => Response;

function pasangFetch(rute: Record<string, Penangan>) {
  const panggilan: Array<{ url: string; body: Record<string, unknown> }> = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
    panggilan.push({ url, body });
    const penangan = rute[url];
    return penangan ? penangan(body) : new Response(null, { status: 404 });
  });
  return panggilan;
}

function tampilkan(props: Parameters<typeof MasukEmailCard>[0] = {}) {
  return render(
    <MemoryRouter initialEntries={["/app/masuk"]}>
      <Routes>
        <Route path="/app/masuk" element={<MasukEmailCard {...props} />} />
        <Route path="/app" element={<p>Beranda peternak</p>} />
        <Route path="/app/investasi" element={<p>Halaman investasi</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  act(() => setelAkunLokal(null));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MasukEmailCard", () => {
  it("daftar dengan nama, email, sandi, dan peran → kode verifikasi → masuk ke beranda peran", async () => {
    const panggilan = pasangFetch({
      "/v1/auth/email/daftar": () => Response.json(KODE, { status: 201 }),
      "/v1/auth/email/verifikasi": () =>
        Response.json({ pengguna: PENGGUNA, kandangDipindahkan: 0 }),
    });

    tampilkan();
    fireEvent.click(screen.getByRole("tab", { name: "Daftar" }));
    fireEvent.click(screen.getByRole("radio", { name: /Peternak/ }));
    fireEvent.change(screen.getByLabelText("Nama panggilan"), { target: { value: "Bu Euis" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "euis@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Kata sandi"), { target: { value: "sandi-kuat-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Daftar" }));

    expect(await screen.findByText("135790")).toBeInTheDocument();
    expect(panggilan[0]?.body).toEqual({
      nama: "Bu Euis",
      email: "euis@gmail.com",
      sandi: "sandi-kuat-1",
      peran: "peternak",
    });

    fireEvent.change(screen.getByLabelText(/Kode 6 angka/), { target: { value: "135790" } });
    fireEvent.click(screen.getByRole("button", { name: "Verifikasi dan masuk" }));
    expect(await screen.findByText("Beranda peternak")).toBeInTheDocument();
    expect(panggilan.find((p) => p.url === "/v1/auth/email/verifikasi")?.body).toMatchObject({
      email: "euis@gmail.com",
      kode: "135790",
      perangkatId: "perangkat-uji",
    });
  });

  it("daftar menolak sandi pendek dan peran kosong tanpa memanggil server", () => {
    const panggilan = pasangFetch({});
    tampilkan();
    fireEvent.click(screen.getByRole("tab", { name: "Daftar" }));
    fireEvent.click(screen.getByRole("button", { name: "Daftar" }));
    expect(screen.getByText(/Pilih peran/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /Pengguna/ }));
    fireEvent.change(screen.getByLabelText("Kata sandi"), { target: { value: "pendek" } });
    fireEvent.click(screen.getByRole("button", { name: "Daftar" }));
    expect(screen.getByText(/minimal 8 karakter/)).toBeInTheDocument();
    expect(panggilan).toHaveLength(0);
  });

  it("masuk dengan email + sandi; pesan server tampil bila salah", async () => {
    let benar = false;
    pasangFetch({
      "/v1/auth/email/masuk": () =>
        benar
          ? Response.json({ pengguna: { ...PENGGUNA, peran: "pengguna" } })
          : Response.json(
              { kode: "EMAIL_SANDI_SALAH", pesan: "Email atau kata sandi salah." },
              { status: 401 },
            ),
    });

    tampilkan();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "rani@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Kata sandi"), { target: { value: "salah-sandi" } });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect(await screen.findByText("Email atau kata sandi salah.")).toBeInTheDocument();

    benar = true;
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect(await screen.findByText("Halaman investasi")).toBeInTheDocument();
  });

  it("akun yang belum terverifikasi diarahkan ke langkah kode verifikasi", async () => {
    pasangFetch({
      "/v1/auth/email/masuk": () =>
        Response.json(
          {
            kode: "EMAIL_BELUM_TERVERIFIKASI",
            pesan: "Email belum diverifikasi.",
            rinci: KODE,
          },
          { status: 403 },
        ),
    });

    tampilkan();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "euis@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Kata sandi"), { target: { value: "sandi-kuat-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

    expect(await screen.findByRole("button", { name: "Verifikasi dan masuk" })).toBeInTheDocument();
    expect(screen.getByText("135790")).toBeInTheDocument();
  });

  it("lupa kata sandi: kirim kode, lalu sandi baru langsung masuk", async () => {
    const panggilan = pasangFetch({
      "/v1/auth/email/lupa-sandi": () => Response.json(KODE),
      "/v1/auth/email/reset-sandi": () => Response.json({ pengguna: PENGGUNA }),
    });

    tampilkan();
    fireEvent.click(screen.getByRole("button", { name: "Lupa kata sandi?" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "euis@gmail.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Kirim kode" }));

    fireEvent.change(await screen.findByLabelText(/Kode 6 angka/), { target: { value: "135790" } });
    fireEvent.change(screen.getByLabelText("Kata sandi baru"), {
      target: { value: "sandi-baru-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan sandi baru dan masuk" }));

    expect(await screen.findByText("Beranda peternak")).toBeInTheDocument();
    expect(panggilan.find((p) => p.url === "/v1/auth/email/reset-sandi")?.body).toMatchObject({
      email: "euis@gmail.com",
      kode: "135790",
      sandiBaru: "sandi-baru-1",
    });
  });

  it("tombol Google hanya tampil bila server punya Client ID, dan kartu kosong saat sudah masuk", () => {
    pasangFetch({});
    tampilkan();
    expect(screen.queryByText("atau pakai email")).not.toBeInTheDocument();
    cleanup();

    tampilkan({ googleClientId: "uji.apps.googleusercontent.com" });
    expect(screen.getByText("atau pakai email")).toBeInTheDocument();
    cleanup();

    act(() => setelAkunLokal(PENGGUNA));
    tampilkan();
    expect(screen.queryByRole("button", { name: "Masuk" })).not.toBeInTheDocument();
  });
});
