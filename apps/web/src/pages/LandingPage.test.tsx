import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

    // Modul 05 investasi ternak disorot, tanpa klaim Ternakin memegang uang, dan empat peran
    expect(
      screen.getByRole("heading", { level: 2, name: /Titip modal, ayam tumbuh/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ternakin tidak memegang uang/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Lihat peluang di dekat Anda/i })).toHaveAttribute(
      "href",
      "/app/investasi",
    );
    // Peran pengunjung dipilih lewat tab di section Alur
    for (const tab of ["Saya peternak", "Saya ingin titip modal", "Saya mitra"]) {
      expect(screen.getByRole("tab", { name: tab })).toBeInTheDocument();
    }

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

  it("membuka popup obrolan Kokok, menjawab pertanyaan cepat dari FAQ, dan menutup dengan Escape", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <LandingPage />
      </MemoryRouter>,
    );

    const peluncur = screen.getByRole("button", { name: "Buka obrolan dengan Kokok" });
    expect(peluncur).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(peluncur);

    const panel = screen.getByRole("dialog", { name: "Kokok" });
    expect(panel).toBeVisible();
    expect(screen.getByRole("button", { name: "Tutup obrolan dengan Kokok" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Biayanya berapa?" }));
    const jawabanBayar = LANDING_FAQ.find((f) => f.id === "faq-bayar")?.jawaban ?? "";
    await waitFor(() => expect(screen.getAllByText(jawabanBayar)).toHaveLength(2));

    fireEvent.keyDown(panel, { key: "Escape" });
    expect(panel).not.toBeVisible();
  });

  it("menampilkan alur website per peran lewat tab yang bisa dipindah dengan panah", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <LandingPage />
      </MemoryRouter>,
    );

    const tabPeternak = screen.getByRole("tab", { name: "Saya peternak" });
    expect(tabPeternak).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("link", { name: /Buka Pakan/ })).toHaveAttribute("href", "/app/pakan");

    fireEvent.click(screen.getByRole("tab", { name: "Saya ingin titip modal" }));
    expect(
      screen.getByRole("heading", { level: 3, name: /Lihat peluang terdekat/ }),
    ).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("tab", { name: "Saya ingin titip modal" }), {
      key: "ArrowRight",
    });
    const tabMitra = screen.getByRole("tab", { name: "Saya mitra" });
    expect(tabMitra).toHaveAttribute("aria-selected", "true");
    expect(tabMitra).toHaveFocus();
    expect(screen.getByRole("link", { name: /Buka WhatsApp/ }).getAttribute("href")).toMatch(
      /^https:\/\/wa\.me\/\?text=/,
    );
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
