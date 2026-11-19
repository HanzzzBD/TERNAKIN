import { describe, expect, it } from "vitest";
import { galatApiSchema, kesehatanApiSchema } from "../index.js";

describe("galatApiSchema", () => {
  it("menerima format galat seragam dengan rinci opsional", () => {
    const hasil = galatApiSchema.safeParse({
      kode: "INPUT_TIDAK_VALID",
      pesan: "Isian belum benar.",
      rinci: { fieldErrors: { nama: ["Wajib diisi"] } },
    });

    expect(hasil.success).toBe(true);
  });

  it("menolak objek tanpa kode atau pesan", () => {
    const hasil = galatApiSchema.safeParse({
      kode: "",
      pesan: "Terjadi kesalahan.",
    });

    expect(hasil.success).toBe(false);
  });
});

describe("kesehatanApiSchema", () => {
  it("menerima status ok true", () => {
    expect(kesehatanApiSchema.safeParse({ ok: true }).success).toBe(true);
  });

  it("menolak status ok false", () => {
    expect(kesehatanApiSchema.safeParse({ ok: false }).success).toBe(false);
  });
});
