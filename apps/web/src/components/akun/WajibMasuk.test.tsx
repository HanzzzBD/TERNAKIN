import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import type { PenggunaSaya } from "@ternakin/shared";
import { setelAkunLokal } from "../../lib/akunCache";
import { PengingatMasuk } from "./PengingatMasuk";
import { WajibMasuk } from "./WajibMasuk";

const PENGGUNA: PenggunaSaya = {
  id: "pengguna-uji",
  nomorTersamar: "",
  nama: "Peternak Uji",
  emailTersamar: "u***@contoh.id",
  peran: "peternak",
  isDemo: false,
};

afterEach(() => {
  cleanup();
  act(() => setelAkunLokal(null));
  window.localStorage.clear();
});

function tampilkanKokok() {
  render(
    <MemoryRouter>
      <WajibMasuk
        pageTitle="Tanya Kokok"
        judul="Masuk untuk bertanya ke Kokok"
        deskripsi="Kokok khusus akun."
        lanjut="/app/tanya"
      >
        <p>Isi halaman Kokok</p>
      </WajibMasuk>
    </MemoryRouter>,
  );
}

describe("WajibMasuk (halaman Kokok)", () => {
  it("tamu melihat ajakan masuk yang kembali ke halaman Kokok, bukan isi halaman", () => {
    tampilkanKokok();
    expect(screen.queryByText("Isi halaman Kokok")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Masuk atau daftar/ })).toHaveAttribute(
      "href",
      "/app/masuk?lanjut=%2Fapp%2Ftanya",
    );
    expect(screen.getByRole("link", { name: /Hitung pakan/ })).toHaveAttribute(
      "href",
      "/app/pakan",
    );
  });

  it("pengguna yang sudah masuk langsung melihat isi halaman", () => {
    act(() => setelAkunLokal(PENGGUNA));
    tampilkanKokok();
    expect(screen.getByText("Isi halaman Kokok")).toBeInTheDocument();
  });
});

describe("PengingatMasuk (Beranda)", () => {
  const tampilkan = () =>
    render(
      <MemoryRouter>
        <PengingatMasuk />
      </MemoryRouter>,
    );

  it("tampil untuk tamu, dan 'Nanti saja' menyembunyikannya walau halaman dibuka ulang", () => {
    tampilkan();
    expect(screen.getByText("Data Anda hanya tersimpan di perangkat ini")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nanti saja" }));
    expect(
      screen.queryByText("Data Anda hanya tersimpan di perangkat ini"),
    ).not.toBeInTheDocument();

    cleanup();
    tampilkan();
    expect(
      screen.queryByText("Data Anda hanya tersimpan di perangkat ini"),
    ).not.toBeInTheDocument();
  });

  it("tidak tampil untuk pengguna yang sudah masuk", () => {
    act(() => setelAkunLokal(PENGGUNA));
    tampilkan();
    expect(
      screen.queryByText("Data Anda hanya tersimpan di perangkat ini"),
    ).not.toBeInTheDocument();
  });
});
