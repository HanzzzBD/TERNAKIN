import { describe, expect, it } from "vitest";
import { formatAngka, formatPersen, formatRupiah } from "./format.js";

describe("Utilitas format Indonesia", () => {
  it("memformat Rupiah dengan pemisah ribuan titik", () => {
    expect(formatRupiah(9754)).toBe("Rp 9.754");
    expect(formatRupiah(800000)).toBe("Rp 800.000");
    expect(formatRupiah(0)).toBe("Rp 0");
    expect(formatRupiah(-450)).toBe("-Rp 450");
  });

  it("memformat angka dan persen memakai koma desimal", () => {
    expect(formatAngka(66.67, 1)).toBe("66,7");
    expect(formatPersen(33.33, 1)).toBe("33,3%");
    expect(formatAngka(2750, 0)).toBe("2.750");
  });
});
