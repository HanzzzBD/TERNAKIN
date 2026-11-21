import { describe, expect, it } from "vitest";
import { normalisasiNomorPonsel, samarkanNomorPonsel } from "./nomorPonsel.js";

describe("normalisasiNomorPonsel", () => {
  it.each([
    ["081234567890", "6281234567890"],
    ["0812-3456-7890", "6281234567890"],
    ["+62 812 3456 7890", "6281234567890"],
    ["6281234567890", "6281234567890"],
    ["81234567890", "6281234567890"],
    ["0812345678", "62812345678"],
  ])("%s → %s", (masukan, hasil) => {
    expect(normalisasiNomorPonsel(masukan)).toBe(hasil);
  });

  it.each(["0212345678", "08123", "0812345678901234", "08abc4567890", "", "+1 555 123 4567"])(
    "menolak %s",
    (masukan) => {
      expect(normalisasiNomorPonsel(masukan)).toBeNull();
    },
  );
});

describe("samarkanNomorPonsel", () => {
  it("menampilkan 4 digit awal dan akhir dalam format lokal", () => {
    expect(samarkanNomorPonsel("6281234567890")).toBe("0812****7890");
    expect(samarkanNomorPonsel("62812345678")).toBe("0812**5678");
  });
});
