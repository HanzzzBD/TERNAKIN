import { act, cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import type { PenggunaSaya } from "@ternakin/shared";
import { setelAkunLokal } from "../../lib/akunCache";
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
});

function HalamanMasuk() {
  const lokasi = useLocation();
  return <p>Halaman masuk {lokasi.search}</p>;
}

function tampilkan(mulai: string) {
  render(
    <MemoryRouter initialEntries={[mulai]}>
      <Routes>
        <Route path="/app/masuk" element={<HalamanMasuk />} />
        <Route element={<WajibMasuk />}>
          <Route path="/app/pakan" element={<p>Isi halaman pakan</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("WajibMasuk (semua fitur aplikasi)", () => {
  it("tamu dialihkan ke halaman Masuk dengan tujuan semula, tanpa melihat isi halaman", () => {
    tampilkan("/app/pakan?bahan=jagung");
    expect(screen.queryByText("Isi halaman pakan")).not.toBeInTheDocument();
    expect(
      screen.getByText(`Halaman masuk ?lanjut=${encodeURIComponent("/app/pakan?bahan=jagung")}`),
    ).toBeInTheDocument();
  });

  it("pengguna yang sudah masuk (termasuk saat offline, dari salinan lokal) melihat isi halaman", () => {
    act(() => setelAkunLokal(PENGGUNA));
    tampilkan("/app/pakan");
    expect(screen.getByText("Isi halaman pakan")).toBeInTheDocument();
  });
});
