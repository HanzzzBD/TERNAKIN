import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PeluangInvestasi, PenggunaSaya, PeranAkun } from "@ternakin/shared";
import { KhususPeternak } from "../components/akun/KhususPeternak";
import { PELUANG_INVESTASI, TEKS_INVESTASI } from "../content/investasiContent";
import { setelAkunLokal } from "../lib/akunCache";
import { InvestasiDetailPage } from "./InvestasiDetailPage";
import { InvestasiPage } from "./InvestasiPage";
import { MasukPage } from "./MasukPage";
import { PeternakPage } from "./PeternakPage";

// IndexedDB tidak tersedia di jsdom: modul data lokal diganti tiruan sederhana.
vi.mock("../db/sync", () => ({
  flushOutbox: vi.fn(async () => true),
  bersihkanDataLokal: vi.fn(async () => {}),
  useSyncStatus: () => ({
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
    namaKandangAktif: null,
  }),
}));
vi.mock("../db/db", () => ({
  db: {
    meta: { delete: vi.fn(async () => {}) },
    outbox: { count: vi.fn(async () => 0) },
    kandang: { count: vi.fn(async () => 0) },
  },
  getOrCreateDeviceId: vi.fn(async () => "perangkat-uji"),
}));

const AKUN: Record<PeranAkun, PenggunaSaya> = {
  pengguna: {
    id: "demo-pengguna",
    nomorTersamar: "",
    emailTersamar: "",
    nama: "Rani",
    peran: "pengguna",
    isDemo: true,
  },
  peternak: {
    id: "demo-peternak",
    nomorTersamar: "",
    emailTersamar: "",
    nama: "Pak Dedi S.",
    peran: "peternak",
    isDemo: true,
  },
};

/** Server tiruan dengan aturan yang sama seperti API: izin data, minat, dan kepemilikan. */
function pasangServerTiruan() {
  let akun: PenggunaSaya | null = null;
  const izin = new Map<string, boolean>();
  const minat: Array<{ peluangId: string; nominal: number }> = [];

  const peluangUntuk = (id: string): PeluangInvestasi | null => {
    const p = PELUANG_INVESTASI.find((x) => x.id === id);
    if (!p) return null;
    const milikSaya = akun?.id === "demo-peternak" && p.id === "pl-ciparay";
    const izinData = izin.get(p.id) ?? true;
    const totalMinat = minat.filter((m) => m.peluangId === p.id).reduce((a, m) => a + m.nominal, 0);
    return {
      ...p,
      modalTerkumpul: p.modalTerkumpul + totalMinat,
      catatan: izinData || milikSaya ? [...p.catatan] : [],
      pemeriksaan: p.pemeriksaan ? { ...p.pemeriksaan, poin: [...p.pemeriksaan.poin] } : null,
      rencanaMulai: null,
      izinData,
      milikSaya,
      minatSaya: akun?.peran === "pengguna" ? totalMinat : 0,
      isDemo: true,
    };
  };

  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};

    if (url === "/v1/auth/demo") {
      akun = AKUN[body.peran as PeranAkun];
      return Response.json({ pengguna: akun });
    }
    if (url === "/v1/auth/keluar") {
      akun = null;
      return Response.json({ ok: true });
    }
    if (url === "/v1/investasi/peluang") {
      return Response.json({ peluang: PELUANG_INVESTASI.map((p) => peluangUntuk(p.id)) });
    }
    if (url === "/v1/investasi/minat-saya") {
      return Response.json({ minat: [] });
    }
    const cocok = url.match(/^\/v1\/investasi\/peluang\/([^/]+)(?:\/(minat|izin))?$/);
    if (cocok) {
      const [, id, aksi] = cocok;
      if (aksi === "minat" && method === "POST") {
        minat.push({ peluangId: id!, nominal: Number(body.nominal) });
        return Response.json({ peluang: peluangUntuk(id!) }, { status: 201 });
      }
      if (aksi === "izin" && method === "PUT") {
        izin.set(id!, Boolean(body.izinData));
        return Response.json({ peluang: peluangUntuk(id!) });
      }
      const p = peluangUntuk(id!);
      return p
        ? Response.json({ peluang: p })
        : Response.json(
            { kode: "TIDAK_DITEMUKAN", pesan: "Peluang tidak ditemukan." },
            { status: 404 },
          );
    }
    return new Response(null, { status: 404 });
  });

  return {
    masukSebagai(peran: PeranAkun) {
      akun = AKUN[peran];
      act(() => setelAkunLokal(akun));
    },
  };
}

function renderDi(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/app"
          element={<KhususPeternak alihkanPengguna>Beranda peternak</KhususPeternak>}
        />
        <Route path="/app/pakan" element={<KhususPeternak>Halaman pakan</KhususPeternak>} />
        <Route path="/app/masuk" element={<MasukPage />} />
        <Route path="/app/investasi" element={<InvestasiPage />} />
        <Route path="/app/investasi/:id" element={<InvestasiDetailPage />} />
        <Route path="/app/peternak" element={<PeternakPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

let server: ReturnType<typeof pasangServerTiruan>;

beforeEach(() => {
  server = pasangServerTiruan();
});

afterEach(() => {
  cleanup();
  act(() => setelAkunLokal(null));
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("Modul 5 — Investasi ternak (simulasi, data dari server)", () => {
  it("menampilkan peluang terurut dari yang terdekat dan penegasan Ternakin tidak memegang uang", async () => {
    renderDi("/app/investasi");

    expect(screen.getByText(TEKS_INVESTASI.ojk)).toBeInTheDocument();
    expect(screen.getByText(TEKS_INVESTASI.catatanPrototipe)).toBeInTheDocument();

    // Dari Kota Bandung, Lembang adalah kandang terdekat
    const kartu = await screen.findAllByRole("article");
    expect(within(kartu[0] as HTMLElement).getByRole("heading")).toHaveTextContent(
      "Kandang Cikole",
    );

    // Ganti wilayah ke Sumedang: Jatinangor jadi terdekat
    fireEvent.change(screen.getByLabelText("Cari peternak di sekitar"), {
      target: { value: "sumedang" },
    });
    const kartuBaru = screen.getAllByRole("article");
    expect(within(kartuBaru[0] as HTMLElement).getByRole("heading")).toHaveTextContent(
      "Kandang Cibeusi",
    );

    // Saring hanya yang dibuka: kandang yang menunggu pemeriksaan disembunyikan
    fireEvent.click(screen.getByRole("button", { name: "Dibuka untuk modal" }));
    expect(screen.queryByText("Kandang Barokah")).not.toBeInTheDocument();

    // Tamu diajak masuk sebagai Pengguna untuk mencatat minat
    expect(screen.getByRole("link", { name: "Masuk sebagai Pengguna" })).toBeInTheDocument();
  });

  it("masuk dengan akun pengguna demo lalu mencatat minat titip modal setelah menyetujui risiko", async () => {
    renderDi("/app/masuk?peran=pengguna&lanjut=/app/investasi/pl-ciparay");

    fireEvent.click(screen.getByRole("button", { name: "Masuk sebagai pengguna" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Kandang Sukamaju" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nominal modal"), { target: { value: "500000" } });
    fireEvent.click(screen.getByRole("button", { name: "Catat minat titip modal" }));
    expect(screen.getByText("Centang pernyataan risiko terlebih dahulu.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Catat minat titip modal" }));
    expect(await screen.findByText(/tercatat \(simulasi\)/)).toBeInTheDocument();
    expect(await screen.findByText(/Minat Anda di kandang ini/)).toBeInTheDocument();
  });

  it("peternak tidak bisa melihat atau mendanai kandang lain; menu Investasi membuka profil peternakannya", async () => {
    server.masukSebagai("peternak");

    renderDi("/app/investasi");
    expect(
      screen.getByRole("heading", { level: 1, name: "Halo, Pak Dedi S." }),
    ).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Profil peternakan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Kandang Sukamaju" })).toBeInTheDocument();
    expect(screen.queryByText("Kandang Cikole")).not.toBeInTheDocument();
    cleanup();

    // Kandang peternak lain juga dialihkan
    renderDi("/app/investasi/pl-lembang");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Halo, Pak Dedi S." }),
    ).toBeInTheDocument();
    cleanup();

    // Kandang sendiri bisa dilihat sebagai pratinjau, tanpa form titip modal
    renderDi("/app/investasi/pl-ciparay");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Kandang Sukamaju" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/seperti yang dilihat pengguna/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Nominal modal")).not.toBeInTheDocument();
  });

  it("kandang yang belum diperiksa dokter hewan tidak bisa didanai", async () => {
    server.masukSebagai("pengguna");
    renderDi("/app/investasi/pl-soreang");

    expect(await screen.findByRole("heading", { name: "Belum bisa didanai" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Nominal modal")).not.toBeInTheDocument();
  });

  it("mengalihkan halaman peternak ke halaman masuk bila belum login", () => {
    renderDi("/app/peternak");
    expect(
      screen.getByRole("heading", { level: 1, name: "Masuk ke Ternakin" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nomor WhatsApp/)).toBeInTheDocument();
    // Peran Peternak sudah terpilih karena datang dari halaman peternak.
    // Peran Peternak terpilih di semua pilihan peran (form daftar email dan WhatsApp).
    for (const radio of screen.getAllByRole("radio", { name: /Peternak/ })) {
      expect(radio).toBeChecked();
    }
    expect(screen.getByRole("button", { name: "Masuk sebagai peternak" })).toBeInTheDocument();
  });

  it("peternak mencabut izin data sehingga catatan harian kandangnya tidak tampil ke pengguna", async () => {
    server.masukSebagai("peternak");
    renderDi("/app/peternak");

    const sakelar = await screen.findByRole("switch");
    expect(sakelar).toBeChecked();
    fireEvent.click(sakelar);
    expect(await screen.findByRole("switch", { checked: false })).toBeInTheDocument();
    cleanup();

    server.masukSebagai("pengguna");
    renderDi("/app/investasi/pl-ciparay");
    expect(
      await screen.findByText(
        /Peternak belum mengizinkan data catatan harian kandang ini ditampilkan/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Bobot rata-rata")).not.toBeInTheDocument();
  });
});

describe("Pembagian peran di antarmuka", () => {
  it("pengguna dialihkan dari beranda peternak dan melihat penjelasan di fitur peternak", async () => {
    server.masukSebagai("pengguna");

    renderDi("/app");
    expect(
      await screen.findByRole("heading", { level: 1, name: /Peluang ayam pedaging/ }),
    ).toBeInTheDocument();
    cleanup();

    renderDi("/app/pakan");
    expect(screen.getByRole("heading", { name: "Fitur ini untuk peternak" })).toBeInTheDocument();
    expect(screen.queryByText("Halaman pakan")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Lihat peluang investasi/ })).toBeInTheDocument();
  });

  it("menu pengguna hanya Investasi dan Kokok; tamu dan peternak melihat fitur peternak", () => {
    server.masukSebagai("pengguna");
    renderDi("/app/pakan");
    const navBawah = screen.getByRole("navigation", { name: "Navigasi bawah" });
    expect(
      within(navBawah)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Investasi", "Kokok"]);
    cleanup();

    act(() => setelAkunLokal(null));
    renderDi("/app/pakan");
    expect(screen.getByText("Halaman pakan")).toBeInTheDocument();
    cleanup();

    server.masukSebagai("peternak");
    renderDi("/app/peternak");
    const navPeternak = screen.getByRole("navigation", { name: "Navigasi bawah" });
    expect(
      within(navPeternak)
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["Beranda", "Pakan", "Catatan", "Kokok", "Toko", "Peluang"]);
  });

  it("akun demo menolak masuk bila HP sudah berisi data kandang tamu", async () => {
    const { db } = await import("../db/db");
    vi.mocked(db.kandang.count).mockResolvedValueOnce(2);

    renderDi("/app/masuk");
    fireEvent.click(screen.getByRole("button", { name: "Masuk sebagai peternak" }));
    expect(await screen.findByText(/HP ini sudah berisi data kandang Anda/)).toBeInTheDocument();
  });
});
