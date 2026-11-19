import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { TEKS } from "./lib/teks";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Halaman fondasi PWA", () => {
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
