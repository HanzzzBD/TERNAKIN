import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { KokokObrolanResponse } from "@ternakin/shared";
import { KokokChatPopup } from "./KokokChatPopup";

vi.mock("../../db/db", () => ({
  db: { draf: { put: vi.fn(async () => {}) } },
  getOrCreateDeviceId: vi.fn(async () => "perangkat-uji"),
}));

function balasan(isi: Partial<KokokObrolanResponse>): KokokObrolanResponse {
  return {
    balasan: "Halo juga!",
    aksi: "tidak_ada",
    urgensi: null,
    sumber: [],
    sumberJawaban: "llm",
    terfilter: false,
    ...isi,
  };
}

function pasangServer(...respons: KokokObrolanResponse[]) {
  const dikirim: Array<Record<string, unknown>> = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
    dikirim.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return Response.json(respons[dikirim.length - 1] ?? respons[respons.length - 1]);
  });
  return dikirim;
}

function bukaPopup() {
  render(
    <MemoryRouter>
      <KokokChatPopup />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Buka obrolan dengan Kokok" }));
}

function ketik(teks: string) {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: teks } });
  fireEvent.submit(screen.getByRole("textbox").closest("form")!);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Popup obrolan Kokok memakai AI", () => {
  it("sapaan dibalas jawaban AI dari server, bukan kalimat tetap", async () => {
    const dikirim = pasangServer(
      balasan({ balasan: "Halo juga, Bapak/Ibu! Ada yang bisa Kokok bantu soal ayam?" }),
    );
    bukaPopup();
    ketik("halo");

    expect(
      await screen.findByText("Halo juga, Bapak/Ibu! Ada yang bisa Kokok bantu soal ayam?"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/saya perlu membaca pedoman/)).not.toBeInTheDocument();
    expect(dikirim[0]).toMatchObject({ pesan: "halo", konteks: "landing" });
  });

  it("riwayat obrolan ikut dikirim dan saran aksi jadi tombol", async () => {
    const dikirim = pasangServer(
      balasan({ balasan: "Halo juga!" }),
      balasan({
        balasan: "Ngorok perlu diwaspadai. Yuk cek gejalanya.",
        aksi: "cek_gejala",
        urgensi: "sedang",
      }),
    );
    bukaPopup();
    ketik("halo");
    await screen.findByText("Halo juga!");
    ketik("ayam saya ngorok");

    expect(
      await screen.findByText("Ngorok perlu diwaspadai. Yuk cek gejalanya."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lanjut cek gejala/ })).toBeInTheDocument();
    const riwayat = dikirim[1]?.riwayat as Array<{ dari: string; teks: string }>;
    expect(riwayat.some((r) => r.dari === "anda" && r.teks === "halo")).toBe(true);
    expect(riwayat.some((r) => r.dari === "kokok" && r.teks === "Halo juga!")).toBe(true);
  });

  it("bila server tidak bisa dihubungi, tetap ada balasan cadangan", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    bukaPopup();
    ketik("ayam saya lesu");
    expect(await screen.findByText(/Terima kasih sudah bercerita/)).toBeInTheDocument();
  });
});
