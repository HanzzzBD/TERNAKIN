import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PenggunaSaya } from "@ternakin/shared";
import { App } from "./App";
import { setelAkunLokal } from "./lib/akunCache";
import { TEKS } from "./lib/teks";

const PETERNAK: PenggunaSaya = {
  id: "peternak-uji",
  nomorTersamar: "0812****7890",
  nama: "Peternak Uji",
  emailTersamar: "",
  peran: "peternak",
  isDemo: false,
};

beforeEach(() => {
  window.history.pushState({}, "", "/app");
  // Semua fitur aplikasi wajib masuk.
  act(() => setelAkunLokal(PETERNAK));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  act(() => setelAkunLokal(null));
});

describe("Semua fitur aplikasi wajib masuk", () => {
  it("tamu yang membuka /app/pakan dialihkan ke halaman Masuk dengan tujuan semula", () => {
    act(() => setelAkunLokal(null));
    window.history.pushState({}, "", "/app/pakan");
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Masuk ke Ternakin" }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/app/masuk");
    expect(new URLSearchParams(window.location.search).get("lanjut")).toBe("/app/pakan");
  });
});

describe("Halaman beranda aplikasi PWA (/app)", () => {
  it("menampilkan tautan lewati ke konten dan judul utama", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: TEKS.lewatiKeKonten })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: TEKS.judulFondasi })).toBeInTheDocument();
    expect(screen.getByText("Tersinkron")).toBeInTheDocument();
  });

  it("menampilkan banner offline dan menonaktifkan cek server saat jaringan putus", () => {
    render(<App />);

    fireEvent(window, new Event("offline"));

    expect(screen.getByRole("alert")).toHaveTextContent(TEKS.bannerOffline);
    expect(screen.getByRole("button", { name: TEKS.tombolCekServer })).toBeDisabled();
  });

  it("memeriksa endpoint /health dan menampilkan pesan sukses saat daring", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: TEKS.tombolCekServer }));

    await waitFor(() => {
      expect(screen.getByText(TEKS.cekServerBerhasil)).toBeInTheDocument();
    });
  });

  it("menampilkan pesan galat ramah saat server tidak terjangkau", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 503 }));

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: TEKS.tombolCekServer }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(TEKS.cekServerGagal);
    });
  });
});
