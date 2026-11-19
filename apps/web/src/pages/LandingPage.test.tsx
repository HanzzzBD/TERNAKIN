import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { LANDING_FAQ } from "../content/landingContent";
import { TEKS } from "../lib/teks";
import { LandingPage } from "./LandingPage";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("Landing page Ternakin (/)", () => {
  it("menampilkan seluruh bagian, 6 FAQ, kartu pilot jujur tanpa testimoni buatan, tautan WhatsApp aman, dan tanpa tombol Atur animasi", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: TEKS.lewatiKeKonten })).toHaveClass("skip-link");
    expect(
      screen.getByRole("heading", { level: 1, name: /Pakan lebih hemat/i }),
    ).toBeInTheDocument();

    // Tombol Atur animasi sudah dihapus sesuai keputusan pemilik
    expect(screen.queryByRole("button", { name: /Atur animasi/i })).not.toBeInTheDocument();

    // Bagian masalah & sumber
    expect(screen.getByText("70–80%")).toBeInTheDocument();
    expect(screen.getByText("1.691 puskeswan, 971 dokter hewan")).toBeInTheDocument();
    expect(screen.getByText(/BRMP Jawa Timur/i)).toBeInTheDocument();

    // Empat modul
    expect(screen.getByText("HITUNG PAKAN")).toBeInTheDocument();
    expect(screen.getByText("CATAT HARIAN")).toBeInTheDocument();
    expect(screen.getByText("TANYA KOKOK")).toBeInTheDocument();
    expect(screen.getByText("TOKO PAKAN")).toBeInTheDocument();

    // FieldProof kosong -> tampil kartu pencarian pilot Bandung
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Kami sedang mencari peternak dan toko untuk pilot di Bandung dan sekitarnya/i,
      }),
    ).toBeInTheDocument();

    // Enam pertanyaan FAQ
    for (const item of LANDING_FAQ) {
      expect(screen.getByText(item.pertanyaan)).toBeInTheDocument();
    }

    // Semua tautan WhatsApp valid dan tidak mengandung nomor palsu ketika VITE_WA_NUMBER kosong
    const tautanWa = screen
      .getAllByRole("link")
      .filter((el) => (el.getAttribute("href") ?? "").includes("wa.me"));
    expect(tautanWa.length).toBeGreaterThanOrEqual(4);
    for (const link of tautanWa) {
      const href = link.getAttribute("href") ?? "";
      expect(href.startsWith("https://wa.me/?text=")).toBe(true);
    }

    // Tautan privasi dan hak cipta
    expect(screen.getByRole("link", { name: /Baca kebijakan privasi/i })).toHaveAttribute(
      "href",
      "/privasi",
    );
    expect(screen.getByText("© 2026 Ternakin")).toBeInTheDocument();
  });

  it("menampilkan maskot Kokok yang dapat diklik untuk berganti pesan", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <LandingPage />
      </MemoryRouter>,
    );

    const tombolKokok = screen.getAllByRole("button", { name: /Sapa Kokok/i })[0];
    expect(tombolKokok).toBeDefined();
    if (!tombolKokok) return;

    expect(screen.getByText(/Halo! Saya Kokok, teman kandang Anda/i)).toBeInTheDocument();
    fireEvent.click(tombolKokok);
    expect(
      screen.getByText(/Hitung pakan dan catatan harian tetap jalan walau sinyal/i),
    ).toBeInTheDocument();
  });
});
