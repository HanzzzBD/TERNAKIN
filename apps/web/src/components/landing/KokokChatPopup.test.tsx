import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { KokokObrolanResponse, PenggunaSaya } from "@ternakin/shared";
import { setelAkunLokal } from "../../lib/akunCache";
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
  vi.restoreAllMocks();
  act(() => setelAkunLokal(null));
});

describe("Popup obrolan Kokok memakai AI", () => {
  beforeEach(() => {
    act(() => setelAkunLokal(PENGGUNA));
  });

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

describe("Popup obrolan Kokok untuk tamu", () => {
  it("tamu tidak bisa mengetik bebas dan diajak masuk, tanpa memanggil server", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    bukaPopup();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Masuk untuk ngobrol/ })).toHaveAttribute(
      "href",
      "/app/masuk?lanjut=%2Fapp%2Ftanya",
    );
    fireEvent.click(screen.getByRole("button", { name: "Biayanya berapa?" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
