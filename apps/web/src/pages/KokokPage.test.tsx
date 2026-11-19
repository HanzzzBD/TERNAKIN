import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DataReferensi, KokokTriaseResponse } from "@ternakin/shared";
import { TEKS_KOKOK } from "../lib/teks";
import { KokokPage } from "./KokokPage";

const REF_KOKOK: DataReferensi = {
  versi: "uji-5",
  isDemo: true,
  catatanData: "Data contoh",
  staleDays: 7,
  bahan: [],
  kebutuhanGizi: [],
  ambangPeringatan: [],
  gejalaAwalKokok: ["Kematian mendadak beberapa ekor", "Ngorok, bersin, atau sesak napas"],
};

const RES_TINGGI: KokokTriaseResponse = {
  id: "11111111-1111-4111-8111-111111111111",
  urgensi: "tinggi",
  alasanUrgensi:
    "Gejala mengarah pada tanda bahaya. Pemeriksaan dokter hewan sangat disarankan segera.",
  tujuanRujukan: "Segera hubungi dokter hewan atau dinas peternakan / puskeswan terdekat.",
  panduanUmum: [
    "Pisahkan ayam sakit ke area karantina.",
    "Laporkan ke dokter hewan atau puskeswan dalam 24 jam.",
  ],
  sumber: [
    {
      id: "panduan_kematian_mendadak",
      judul: "Kewaspadaan Kematian Mendadak",
      sumber: "Pedoman Uji Coba Ternakin",
      versi: "uji-coba-0.1",
      ringkasanKutipan: "Kematian mendadak beberapa ekor ayam merupakan tanda bahaya.",
    },
  ],
  ringkasanKasus: {
    kandang: "Kandang petelur",
    jenisAyam: "petelur",
    umurMinggu: null,
    populasiEkor: null,
    lokasi: null,
    gejala: "Kematian mendadak beberapa ekor",
    sejakKapan: "Pagi ini",
    peringatan7Hari: [],
    urgensi: "tinggi",
  },
  tidakTahu: false,
  terfilter: false,
  penafian: "Bukan diagnosis medis dan tidak memberi dosis obat.",
  isUjiCoba: true,
  dibuatPada: "2026-11-19T08:00:00.000Z",
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Layar Kokok (/app/tanya)", () => {
  it("menampilkan penafian permanen, mengirim gejala cepat, menampilkan kartu urgensi tinggi, dan tautan WhatsApp tanpa nomor tujuan", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/v1/referensi")) {
        return new Response(JSON.stringify(REF_KOKOK), { status: 200 });
      }
      if (url.includes("/v1/kokok/triase")) {
        return new Response(JSON.stringify(RES_TINGGI), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });

    render(
      <MemoryRouter initialEntries={["/app/tanya"]}>
        <KokokPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(TEKS_KOKOK.penafianPermanen)).toBeInTheDocument();

    const tombolGejala = await screen.findByRole("button", {
      name: "Kematian mendadak beberapa ekor",
    });
    fireEvent.click(tombolGejala);

    const inputSejak = screen.getByLabelText(TEKS_KOKOK.labelSejakKapan);
    fireEvent.change(inputSejak, { target: { value: "Pagi ini" } });

    fireEvent.click(screen.getByRole("button", { name: TEKS_KOKOK.tombolKirim }));

    await waitFor(() => {
      expect(screen.getByText(TEKS_KOKOK.judulUrgensiTinggi)).toBeInTheDocument();
    });

    expect(screen.getByText(/Lihat sumber pedoman yang dipakai/i)).toBeInTheDocument();
    const tautanWa = screen.getByRole("link", { name: TEKS_KOKOK.tombolKirimWa });
    const href = tautanWa.getAttribute("href") ?? "";
    expect(href.startsWith("https://wa.me/?text=")).toBe(true);
    expect(href).not.toMatch(/wa\.me\/\d+/);
  });

  it("menampilkan pesan batas harian ramah saat menerima status 429", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/v1/referensi")) {
        return new Response(JSON.stringify(REF_KOKOK), { status: 200 });
      }
      if (url.includes("/v1/kokok/triase")) {
        return new Response(
          JSON.stringify({
            kode: "BATAS_HARIAN_LLM",
            pesan: "Batas pertanyaan ke Kokok hari ini sudah tercapai. Coba lagi besok.",
          }),
          { status: 429 },
        );
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });

    render(
      <MemoryRouter initialEntries={["/app/tanya"]}>
        <KokokPage />
      </MemoryRouter>,
    );

    const area = screen.getByLabelText(/Ceritakan gejala yang Anda lihat di kandang/i);
    fireEvent.change(area, { target: { value: "Ayam ngorok sejak pagi" } });
    fireEvent.click(screen.getByRole("button", { name: TEKS_KOKOK.tombolKirim }));

    await waitFor(() => {
      expect(
        screen.getByText(/Batas pertanyaan ke Kokok hari ini sudah tercapai/i),
      ).toBeInTheDocument();
    });
  });
});
