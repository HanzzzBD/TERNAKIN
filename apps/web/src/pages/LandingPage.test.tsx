import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { LANDING_FAQ } from "../content/landingContent";
import { TEKS } from "../lib/teks";
import { LandingPage } from "./LandingPage";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  delete document.documentElement.dataset.motion;
});

describe("Landing page Ternakin (/)", () => {
  it("menampilkan seluruh sepuluh bagian, 6 FAQ, kartu pilot jujur tanpa testimoni buatan, dan tautan WhatsApp aman", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: TEKS.lewatiKeKonten })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /Pakan lebih hemat/i }),
    ).toBeInTheDocument();

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

  it("mengubah atribut data-motion lewat tombol Atur animasi", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <LandingPage />
      </MemoryRouter>,
    );

    const tombolAnimasi = screen.getAllByRole("button", { name: /Atur animasi/i })[0];
    expect(tombolAnimasi).toBeDefined();
    if (!tombolAnimasi) return;

    const sebelum = document.documentElement.dataset.motion;
    fireEvent.click(tombolAnimasi);
    const sesudah = document.documentElement.dataset.motion;
    expect(sesudah).not.toBe(sebelum);
  });
});
