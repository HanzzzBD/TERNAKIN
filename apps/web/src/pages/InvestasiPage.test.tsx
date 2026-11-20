import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { TEKS_INVESTASI } from "../content/investasiContent";
import { aturIzinDataPeternak, keluarDemo, masukDemo } from "../lib/akunDemo";
import { InvestasiDetailPage } from "./InvestasiDetailPage";
import { InvestasiPage } from "./InvestasiPage";
import { MasukPage } from "./MasukPage";
import { PeternakPage } from "./PeternakPage";

function renderDi(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/masuk" element={<MasukPage />} />
        <Route path="/app/investasi" element={<InvestasiPage />} />
        <Route path="/app/investasi/:id" element={<InvestasiDetailPage />} />
        <Route path="/app/peternak" element={<PeternakPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  act(() => keluarDemo());
  window.localStorage.clear();
});

describe("Modul 5 — Investasi ternak (prototipe)", () => {
  it("menampilkan peluang terurut dari yang terdekat dan penegasan Ternakin tidak memegang uang", () => {
    renderDi("/app/investasi");

    expect(screen.getByText(TEKS_INVESTASI.ojk)).toBeInTheDocument();
    expect(screen.getByText(TEKS_INVESTASI.catatanPrototipe)).toBeInTheDocument();

    // Dari Kota Bandung, Lembang adalah kandang terdekat
    const kartu = screen.getAllByRole("article");
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
  });

  it("masuk dengan akun pengguna demo lalu mencatat minat titip modal setelah menyetujui risiko", () => {
    renderDi("/app/masuk?peran=pengguna&lanjut=/app/investasi/pl-ciparay");

    fireEvent.click(screen.getByRole("button", { name: "Masuk sebagai pengguna" }));

    expect(screen.getByRole("heading", { level: 1, name: "Kandang Sukamaju" })).toBeInTheDocument();

    const nominal = screen.getByLabelText("Nominal modal");
    fireEvent.change(nominal, { target: { value: "500000" } });
    fireEvent.click(screen.getByRole("button", { name: "Catat minat titip modal" }));
    expect(screen.getByText("Centang pernyataan risiko terlebih dahulu.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Catat minat titip modal" }));
    expect(screen.getByText(/tercatat \(simulasi\)/)).toBeInTheDocument();
    expect(screen.getByText(/Minat Anda di kandang ini/)).toBeInTheDocument();
  });

  it("peternak tidak bisa melihat atau mendanai kandang lain; menu Investasi membuka profil peternakannya", () => {
    act(() => masukDemo("peternak"));

    // Daftar peluang dialihkan ke profil peternakan sendiri
    renderDi("/app/investasi");
    expect(screen.getByRole("heading", { level: 1, name: "Halo, Pak Dedi" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Profil peternakan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Kandang Sukamaju" })).toBeInTheDocument();
    expect(screen.queryByText("Kandang Cikole")).not.toBeInTheDocument();
    cleanup();

    // Kandang peternak lain juga dialihkan
    renderDi("/app/investasi/pl-lembang");
    expect(screen.getByRole("heading", { level: 1, name: "Halo, Pak Dedi" })).toBeInTheDocument();
    cleanup();

    // Kandang sendiri bisa dilihat sebagai pratinjau, tanpa form titip modal
    renderDi("/app/investasi/pl-ciparay");
    expect(screen.getByRole("heading", { level: 1, name: "Kandang Sukamaju" })).toBeInTheDocument();
    expect(screen.getByText(/seperti yang dilihat pengguna/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Nominal modal")).not.toBeInTheDocument();
  });

  it("kandang yang belum diperiksa dokter hewan tidak bisa didanai", () => {
    act(() => masukDemo("pengguna"));
    renderDi("/app/investasi/pl-soreang");

    expect(screen.getByRole("heading", { name: "Belum bisa didanai" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Nominal modal")).not.toBeInTheDocument();
  });

  it("menolak akun yang tidak cocok dan mengalihkan halaman peternak ke masuk bila belum login", () => {
    renderDi("/app/peternak");
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "orang@contoh.id" } });
    fireEvent.change(screen.getByLabelText("Kata sandi"), { target: { value: "salah" } });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect(screen.getByText(/tidak cocok dengan akun demo/)).toBeInTheDocument();
  });

  it("bisa keluar lewat menu akun lalu masuk dengan akun demo lain", () => {
    renderDi("/app/masuk");

    // Masuk manual sebagai pengguna demo
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "pengguna@demo.ternakin.id" },
    });
    fireEvent.change(screen.getByLabelText("Kata sandi"), { target: { value: "demo1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect(
      screen.getByRole("heading", { level: 1, name: /Peluang ayam pedaging/ }),
    ).toBeInTheDocument();

    // Menu akun di bilah atas: Keluar
    fireEvent.click(screen.getByRole("button", { name: /Rani · Pengguna/ }));
    fireEvent.click(screen.getByRole("button", { name: "Keluar" }));
    expect(screen.getByRole("link", { name: "Masuk" })).toBeInTheDocument();
    cleanup();

    // Ganti ke peternak demo langsung dari halaman masuk
    renderDi("/app/masuk");
    fireEvent.click(screen.getByRole("button", { name: "Masuk sebagai peternak" }));
    expect(screen.getByRole("heading", { level: 1, name: "Halo, Pak Dedi" })).toBeInTheDocument();

    // Dari halaman masuk saat sudah login, tombol Keluar tersedia dan tombol ganti akun berfungsi
    cleanup();
    renderDi("/app/masuk");
    expect(screen.getByText(/Sedang masuk sebagai/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Masuk sebagai pengguna" }));
    expect(
      screen.getByRole("heading", { level: 1, name: /Peluang ayam pedaging/ }),
    ).toBeInTheDocument();
  });

  it("peternak mencabut izin data sehingga catatan harian kandangnya tidak tampil ke pengguna", () => {
    act(() => masukDemo("peternak"));
    renderDi("/app/peternak");

    const sakelar = screen.getByRole("switch");
    expect(sakelar).toBeChecked();
    fireEvent.click(sakelar);
    expect(sakelar).not.toBeChecked();
    cleanup();

    renderDi("/app/investasi/pl-ciparay");
    expect(
      screen.getByText(/Peternak belum mengizinkan data catatan harian kandang ini ditampilkan/),
    ).toBeInTheDocument();

    act(() => aturIzinDataPeternak(true));
    expect(screen.getByText("Bobot rata-rata")).toBeInTheDocument();
  });
});
