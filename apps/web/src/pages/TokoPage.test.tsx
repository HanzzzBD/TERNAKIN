import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DaftarTokoResponse } from "@ternakin/shared";
import { TokoPage } from "./TokoPage";

const TOKO_RES: DaftarTokoResponse = {
  staleDays: 7,
  diambilPada: "2026-11-19T12:00:00.000Z",
  toko: [
    {
      id: "toko-mitra",
      kode: "TK-01",
      nama: "Toko Mitra Lembang (Contoh)",
      area: "Lembang",
      statusMitra: true,
      isDemo: true,
      nomorWa: null,
      harga: [
        {
          bahanId: "jagung_kuning",
          namaBahan: "Jagung kuning giling",
          harga: 6600,
          asalHarga: "Dikirim toko lewat WhatsApp",
          diperbaruiPada: "2026-11-18T12:00:00.000Z",
        },
      ],
    },
    {
      id: "toko-usang",
      kode: "TK-02",
      nama: "Toko Harga Usang (Contoh)",
      area: "Cicalengka",
      statusMitra: false,
      isDemo: true,
      nomorWa: null,
      harga: [
        {
          bahanId: "jagung_kuning",
          namaBahan: "Jagung kuning giling",
          harga: 6200,
          asalHarga: "Dicatat tim",
          diperbaruiPada: "2026-11-01T12:00:00.000Z",
        },
      ],
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Layar Rujukan Toko (/app/toko)", () => {
  it("menampilkan label mitra/bukan mitra, asal harga, umur harga, data contoh, dan badge Usang", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(TOKO_RES), { status: 200 }),
    );

    render(
      <MemoryRouter initialEntries={["/app/toko"]}>
        <TokoPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Toko Mitra Lembang (Contoh)")).toBeInTheDocument();
      expect(screen.getByText("Toko Harga Usang (Contoh)")).toBeInTheDocument();
    });

    expect(screen.getByText("Toko mitra")).toBeInTheDocument();
    expect(screen.getByText("Bukan mitra")).toBeInTheDocument();
    expect(screen.getByText("Usang")).toBeInTheDocument();
    expect(screen.getByText(/Asal harga: Dikirim toko lewat WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByText(/Asal harga: Dicatat tim/i)).toBeInTheDocument();

    // Pastikan tautan wa.me tidak pernah memakai nomor telepon tak terverifikasi
    const links = screen.getAllByRole("link", { name: /Hubungi lewat WhatsApp/i });
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\?text=/);
    }
  });
});
