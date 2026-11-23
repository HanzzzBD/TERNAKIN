import { describe, expect, it } from "vitest";
import { apakahSesiBerakhir } from "./penjagaSesi";

const ASAL = "https://ternakin.code-xpert.my.id/app/pakan";

describe("apakahSesiBerakhir", () => {
  it("401 dari API aplikasi berarti sesi berakhir", () => {
    expect(apakahSesiBerakhir("/v1/kandang", 401, ASAL)).toBe(true);
    expect(apakahSesiBerakhir("/v1/sinkron", 401, ASAL)).toBe(true);
    expect(apakahSesiBerakhir("https://ternakin.code-xpert.my.id/v1/toko", 401, ASAL)).toBe(true);
  });

  it("bukan 401, rute masuk, atau situs lain tidak dianggap sesi berakhir", () => {
    expect(apakahSesiBerakhir("/v1/kandang", 200, ASAL)).toBe(false);
    expect(apakahSesiBerakhir("/v1/kandang", 403, ASAL)).toBe(false);
    expect(apakahSesiBerakhir("/v1/auth/email/masuk", 401, ASAL)).toBe(false);
    expect(apakahSesiBerakhir("https://accounts.google.com/v1/x", 401, ASAL)).toBe(false);
    expect(apakahSesiBerakhir("/health", 401, ASAL)).toBe(false);
  });
});
