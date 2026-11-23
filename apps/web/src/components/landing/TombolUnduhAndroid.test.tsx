import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UnduhanResponse } from "@ternakin/shared";
import { resetInfoUnduhan } from "../../lib/unduhan";
import { TombolUnduhAndroid } from "./TombolUnduhAndroid";

function pasangServer(android: UnduhanResponse["android"]) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ android }));
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetInfoUnduhan();
});

describe("TombolUnduhAndroid", () => {
  it("APK tersedia: tautan unduh ke /unduh/ternakin.apk dengan ukuran", async () => {
    pasangServer({
      tersedia: true,
      url: "/unduh/ternakin.apk",
      ukuranByte: 58 * 1024 * 1024,
      diperbaruiPada: "2026-11-23T10:00:00.000Z",
    });
    render(<TombolUnduhAndroid />);
    const tautan = await screen.findByRole("link", { name: /Unduh untuk Android \(58 MB\)/ });
    expect(tautan).toHaveAttribute("href", "/unduh/ternakin.apk");
    expect(tautan).toHaveAttribute("download", "Ternakin.apk");
  });

  it("APK belum ada atau server gagal: tombol tidak tampil", async () => {
    pasangServer({
      tersedia: false,
      url: "/unduh/ternakin.apk",
      ukuranByte: null,
      diperbaruiPada: null,
    });
    render(<TombolUnduhAndroid />);
    await vi.waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    cleanup();
    resetInfoUnduhan();
    vi.restoreAllMocks();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
    render(<TombolUnduhAndroid />);
    await vi.waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
