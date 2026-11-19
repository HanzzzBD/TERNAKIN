import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DataReferensi } from "@ternakin/shared";
import { CatatanPage } from "./CatatanPage";

const REF_AMBANG: DataReferensi = {
  versi: "uji-3",
  isDemo: true,
  catatanData: "Data contoh",
  staleDays: 7,
  bahan: [],
  kebutuhanGizi: [],
  ambangPeringatan: [
    {
      jenisAyam: "petelur",
      kematianPersenMaks: 0.5,
      suhuMinC: 18,
      suhuMaksC: 32,
      produksiTelurMinPersen: 60,
      sumber: "Ambang uji contoh",
      isDemo: true,
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Layar Catatan Harian (/app/catatan)", () => {
  it("membuat profil cepat, menyimpan catatan, memperbarui tanggal sama tanpa menggandakan, dan memunculkan peringatan dari ambang referensi", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(REF_AMBANG), { status: 200 }),
    );

    render(
      <MemoryRouter initialEntries={["/app/catatan"]}>
        <CatatanPage />
      </MemoryRouter>,
    );

    // Buat profil kandang cepat
    fireEvent.change(screen.getByLabelText(/Nama kandang/i), {
      target: { value: "Kandang Lembang" },
    });
    fireEvent.change(screen.getByLabelText(/Jumlah ayam/i), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Mulai mencatat" }));

    await waitFor(() => {
      expect(screen.getByText(/Isi catatan untuk Kandang Lembang/i)).toBeInTheDocument();
    });

    // Simpan catatan pertama dengan kematian dan suhu di atas ambang
    fireEvent.change(screen.getByLabelText("Tanggal catatan"), {
      target: { value: "2026-11-19" },
    });
    fireEvent.change(screen.getByLabelText("Pakan terpakai"), { target: { value: "55" } });
    fireEvent.change(screen.getByLabelText("Produksi telur"), { target: { value: "380" } });
    fireEvent.change(screen.getByLabelText("Ayam mati"), { target: { value: "6" } });
    fireEvent.change(screen.getByLabelText("Suhu kandang"), { target: { value: "35" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan catatan" }));

    await waitFor(() => {
      expect(screen.getByText("Kematian harian di atas ambang")).toBeInTheDocument();
      expect(screen.getByText("Suhu kandang terlalu panas")).toBeInTheDocument();
      expect(screen.getAllByText("2026-11-19")).toHaveLength(1);
    });

    // Simpan ulang tanggal yang sama dengan telur diperbarui -> harus memperbarui, bukan menggandakan
    fireEvent.change(screen.getByLabelText("Produksi telur"), { target: { value: "410" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan catatan" }));

    await waitFor(() => {
      expect(screen.getAllByText("2026-11-19")).toHaveLength(1);
      expect(screen.getAllByText("410 butir").length).toBeGreaterThanOrEqual(1);
    });
  });
});
