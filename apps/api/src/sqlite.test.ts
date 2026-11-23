import { describe, expect, it } from "vitest";
import { Database } from "./db/sqlite.js";

function buatDb(): Database {
  const db = new Database(":memory:");
  db.exec("CREATE TABLE t (id INTEGER PRIMARY KEY, nama TEXT NOT NULL UNIQUE, data BLOB)");
  return db;
}

const jumlah = (db: Database): number =>
  (db.prepare("SELECT COUNT(*) AS n FROM t").get() as { n: number }).n;

describe("lapisan node:sqlite (pengganti better-sqlite3)", () => {
  it("run/get/all dengan parameter positional dan bernama, termasuk kunci yang tidak dipakai", () => {
    const db = buatDb();
    const info = db.prepare("INSERT INTO t (nama) VALUES (?)").run("a");
    expect(info).toEqual({ changes: 1, lastInsertRowid: 1 });

    db.prepare("INSERT INTO t (nama) VALUES (@nama)").run({ nama: "b", tidakDipakai: 1 });
    expect(db.prepare("SELECT nama FROM t WHERE id = ?").get(2)).toEqual({ nama: "b" });
    expect(db.prepare("SELECT nama FROM t ORDER BY id").all()).toEqual([
      { nama: "a" },
      { nama: "b" },
    ]);
    expect(db.prepare("SELECT nama FROM t WHERE id = ?").get(99)).toBeUndefined();
  });

  it("baris dikembalikan sebagai objek biasa dan BLOB terbaca utuh", () => {
    const db = buatDb();
    const vektor = Float32Array.from([0.5, -1.25]);
    db.prepare("INSERT INTO t (nama, data) VALUES (?, ?)").run("v", new Uint8Array(vektor.buffer));
    const baris = db.prepare("SELECT data FROM t").get() as { data: Uint8Array };
    expect(Object.getPrototypeOf(baris)).toBe(Object.prototype);
    expect(Array.from(new Float32Array(baris.data.slice().buffer))).toEqual([0.5, -1.25]);
  });

  it("transaction melakukan commit, mengembalikan nilai, dan rollback saat galat", () => {
    const db = buatDb();
    const tambah = db.transaction((nama: string) => {
      db.prepare("INSERT INTO t (nama) VALUES (?)").run(nama);
      return nama.length;
    });
    expect(tambah("abc")).toBe(3);

    const gagal = db.transaction(() => {
      db.prepare("INSERT INTO t (nama) VALUES (?)").run("x");
      throw new Error("batal");
    });
    expect(() => gagal()).toThrow("batal");
    expect(jumlah(db)).toBe(1);

    // Koneksi tetap bisa memulai transaksi baru setelah rollback.
    tambah("lagi");
    expect(jumlah(db)).toBe(2);
  });

  it("transaksi bersarang memakai savepoint: galat dalam yang ditangkap hanya membatalkan bagian dalam", () => {
    const db = buatDb();
    const dalam = db.transaction(() => {
      db.prepare("INSERT INTO t (nama) VALUES (?)").run("dalam");
      throw new Error("dalam gagal");
    });
    const luar = db.transaction(() => {
      db.prepare("INSERT INTO t (nama) VALUES (?)").run("luar");
      expect(() => dalam()).toThrow("dalam gagal");
    });
    luar();
    expect(db.prepare("SELECT nama FROM t").all()).toEqual([{ nama: "luar" }]);
  });

  it("galat di transaksi dalam yang tidak ditangkap membatalkan seluruh transaksi luar", () => {
    const db = buatDb();
    const luar = db.transaction(() => {
      db.prepare("INSERT INTO t (nama) VALUES (?)").run("luar");
      db.transaction(() => {
        db.prepare("INSERT INTO t (nama) VALUES (?)").run("luar"); // melanggar UNIQUE
      })();
    });
    expect(() => luar()).toThrow();
    expect(jumlah(db)).toBe(0);
  });

  it("pragma diteruskan ke SQLite", () => {
    const db = buatDb();
    db.pragma("foreign_keys = ON");
    expect(db.prepare("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
  });
});
