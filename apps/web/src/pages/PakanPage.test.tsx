import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DataReferensi } from "@ternakin/shared";
import { TEKS_PAKAN } from "../lib/teks";
import { PakanPage } from "./PakanPage";

const REF_UJI: DataReferensi = {
  versi: "uji-1",
  isDemo: true,
  catatanData: "Data contoh untuk tes.",
  staleDays: 7,
  bahan: [
    {
      id: "jagung_kuning",
      nama: "Jagung kuning giling",
      satuan: "kg",
      sinonim: ["jagung"],
      batasMinPersen: 0,
      batasMaksPersen: 65,
      nutrisi: { protein_kasar: 8.8, energi_metabolis: 3350, kalsium: 0.02, fosfor: 0.28 },
      sumberNutrisi: "Data contoh",
      isDemo: true,
    },
    {
      id: "dedak_padi",
      nama: "Dedak padi halus",
      satuan: "kg",
      sinonim: ["dedak"],
      batasMinPersen: 0,
      batasMaksPersen: 20,
      nutrisi: { protein_kasar: 12, energi_metabolis: 2400, kalsium: 0.08, fosfor: 1.4 },
      sumberNutrisi: "Data contoh",
      isDemo: true,
    },
    {
      id: "konsentrat_petelur",
      nama: "Konsentrat ayam petelur",
      satuan: "kg",
      sinonim: ["konsentrat"],
      batasMinPersen: 0,
      batasMaksPersen: 45,
      nutrisi: { protein_kasar: 36, energi_metabolis: 2700, kalsium: 6.5, fosfor: 1.3 },
      sumberNutrisi: "Data contoh",
      isDemo: true,
    },
    {
      id: "tepung_batu_kapur",
      nama: "Tepung batu kapur (CaCO3)",
      satuan: "kg",
      sinonim: ["kapur"],
      batasMinPersen: 0,
      batasMaksPersen: 10,
      nutrisi: { protein_kasar: 0, energi_metabolis: 0, kalsium: 38, fosfor: 0.02 },
      sumberNutrisi: "Data contoh",
      isDemo: true,
    },
  ],
  kebutuhanGizi: [
    {
      jenisAyam: "petelur",
      fase: "layer",
      zatGizi: "protein_kasar",
      label: "Protein kasar",
      satuan: "%",
      batasMin: 16.5,
      batasMaks: 21,
      sumber: "Data contoh",
      isDemo: true,
    },
    {
      jenisAyam: "petelur",
      fase: "layer",
      zatGizi: "energi_metabolis",
      label: "Energi metabolis",
      satuan: "kkal/kg",
      batasMin: 2650,
      batasMaks: 3050,
      sumber: "Data contoh",
      isDemo: true,
    },
    {
      jenisAyam: "petelur",
      fase: "layer",
      zatGizi: "kalsium",
      label: "Kalsium",
      satuan: "%",
      batasMin: 3.25,
      batasMaks: 4.25,
      sumber: "Data contoh",
      isDemo: true,
    },
    {
      jenisAyam: "petelur",
      fase: "layer",
      zatGizi: "fosfor",
      label: "Fosfor",
      satuan: "%",
      batasMin: 0.45,
      batasMaks: 1.1,
      sumber: "Data contoh",
      isDemo: true,
    },
  ],
  ambangPeringatan: [],
  gejalaAwalKokok: [],
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Layar Penyusun Pakan (/app/pakan)", () => {
  it("menghitung campuran layak dan menampilkan badge Dihitung solver serta Penjelasan ditulis AI", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/v1/referensi")) {
        return new Response(JSON.stringify(REF_UJI), { status: 200 });
      }
      if (url.includes("/v1/pakan/jelaskan")) {
        return new Response(
          JSON.stringify({
            penjelasan: "Campuran 100 kg ini memenuhi target gizi ayam petelur.",
            terverifikasi: true,
            dariCache: false,
            sumber: "mock",
          }),
          { status: 200 },
        );
      }
      return new Response(null, { status: 404 });
    });

    render(
      <MemoryRouter initialEntries={["/app/pakan"]}>
        <PakanPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Jagung kuning giling")).toBeInTheDocument();
    });

    const pilihan: Array<[string, string]> = [
      ["Jagung kuning giling", "6500"],
      ["Dedak padi halus", "4000"],
      ["Konsentrat ayam petelur", "12000"],
      ["Tepung batu kapur (CaCO3)", "1500"],
    ];

    for (const [nama, harga] of pilihan) {
      const pola = new RegExp(nama.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      fireEvent.click(screen.getByRole("checkbox", { name: pola }));
      const input = screen.getByLabelText(`Harga ${nama} per kg`);
      fireEvent.change(input, { target: { value: harga } });
    }

    fireEvent.click(screen.getByRole("button", { name: TEKS_PAKAN.tombolHitung }));

    await waitFor(() => {
      expect(screen.getByText("Dihitung solver")).toBeInTheDocument();
      expect(screen.getByText(TEKS_PAKAN.badgePenjelasanAi)).toBeInTheDocument();
      expect(screen.getByText(TEKS_PAKAN.judulKomposisi)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText("Campuran 100 kg ini memenuhi target gizi ayam petelur."),
      ).toBeInTheDocument();
    });
  });

  it("menampilkan pesan tak layak beserta zat kurang dan saran bahan tambahan", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(REF_UJI), { status: 200 }),
    );

    render(
      <MemoryRouter initialEntries={["/app/pakan"]}>
        <PakanPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Jagung kuning giling")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("checkbox", { name: /Jagung kuning giling/ }));
    fireEvent.change(screen.getByLabelText("Harga Jagung kuning giling per kg"), {
      target: { value: "6500" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /Dedak padi halus/ }));
    fireEvent.change(screen.getByLabelText("Harga Dedak padi halus per kg"), {
      target: { value: "4000" },
    });

    fireEvent.click(screen.getByRole("button", { name: TEKS_PAKAN.tombolHitung }));

    await waitFor(() => {
      expect(screen.getByText(TEKS_PAKAN.judulTakLayak)).toBeInTheDocument();
      expect(screen.getByText(TEKS_PAKAN.judulSaranBahan)).toBeInTheDocument();
    });
  });

  it("menambah bahan lewat baris Lainnya dengan konfirmasi wajib Cek dulu bacaan kami", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/v1/referensi")) {
        return new Response(JSON.stringify(REF_UJI), { status: 200 });
      }
      if (url.includes("/v1/pakan/urai")) {
        return new Response(
          JSON.stringify({
            item: [
              {
                bahanId: "jagung_kuning",
                namaMentah: "Jagung",
                namaBahan: "Jagung kuning giling",
                hargaPerKg: 6500,
                satuan: "kg",
              },
            ],
            catatan: [],
            sumber: "mock",
            dariCache: false,
          }),
          { status: 200 },
        );
      }
      return new Response(null, { status: 404 });
    });

    render(
      <MemoryRouter initialEntries={["/app/pakan"]}>
        <PakanPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Jagung kuning giling")).toBeInTheDocument();
    });

    // Bahan di luar daftar ditulis lewat baris "Lainnya" di dalam daftar bahan
    fireEvent.click(screen.getByRole("checkbox", { name: /Lainnya/ }));
    fireEvent.change(screen.getByLabelText(TEKS_PAKAN.labelInputLainnya), {
      target: { value: "Jagung 6.500 per kg" },
    });
    fireEvent.click(screen.getByRole("button", { name: TEKS_PAKAN.tombolUraiTeks }));

    await waitFor(() => {
      expect(screen.getByText(TEKS_PAKAN.judulKonfirmasiUrai)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: TEKS_PAKAN.tombolTerapkanUrai }));

    expect(screen.getByRole("checkbox", { name: /Jagung kuning giling/ })).toBeChecked();
    expect(screen.getByLabelText("Harga Jagung kuning giling per kg")).toHaveValue("6500");
  });
});
