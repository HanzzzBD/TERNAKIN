import { DatabaseSync, type SQLInputValue, type StatementSync } from "node:sqlite";

/**
 * Lapisan tipis di atas SQLite bawaan Node (`node:sqlite`) dengan bentuk API seperti better-sqlite3
 * (prepare/get/all/run, exec, pragma, transaction) yang dipakai seluruh repo.
 *
 * Kenapa tidak better-sqlite3: modul native-nya butuh GLIBC >= 2.29, sedangkan shared hosting
 * CloudLinux 8 hanya punya GLIBC 2.28 dan GCC 8 (tidak bisa mengompilasi ulang untuk Node 22).
 * `node:sqlite` ikut di dalam Node (tanpa flag sejak 22.13), jadi tidak ada berkas biner terpisah.
 */

/** Nilai parameter: positional (`?`) atau satu objek parameter bernama (`@nama`/`:nama`/`$nama`). */
type Parameter = unknown;

export interface HasilRun {
  changes: number;
  lastInsertRowid: number | bigint;
}

export class Statement {
  constructor(private readonly stmt: StatementSync) {
    // better-sqlite3 mengabaikan kunci objek yang tidak dipakai kueri; samakan perilakunya.
    stmt.setAllowUnknownNamedParameters(true);
  }

  run(...params: Parameter[]): HasilRun {
    const hasil = this.stmt.run(...(params as SQLInputValue[]));
    return { changes: Number(hasil.changes), lastInsertRowid: hasil.lastInsertRowid };
  }

  /** Baris pertama sebagai objek biasa, atau undefined bila tidak ada. Ketik dengan `as`. */
  get(...params: Parameter[]): unknown {
    const baris = this.stmt.get(...(params as SQLInputValue[]));
    return baris === undefined ? undefined : { ...baris };
  }

  /** Semua baris sebagai objek biasa. Ketik dengan `as`. */
  all(...params: Parameter[]): unknown[] {
    return this.stmt.all(...(params as SQLInputValue[])).map((baris) => ({ ...baris }));
  }
}

export class Database {
  private readonly raw: DatabaseSync;
  private kedalamanTransaksi = 0;

  constructor(lokasi: string) {
    this.raw = new DatabaseSync(lokasi);
  }

  prepare(sql: string): Statement {
    return new Statement(this.raw.prepare(sql));
  }

  exec(sql: string): void {
    this.raw.exec(sql);
  }

  /** Mis. `pragma("foreign_keys = ON")`. */
  pragma(perintah: string): void {
    this.raw.exec(`PRAGMA ${perintah}`);
  }

  /**
   * Seperti better-sqlite3: mengembalikan fungsi yang menjalankan `fn` di dalam transaksi.
   * Commit bila `fn` selesai, rollback bila melempar galat. Panggilan bersarang memakai SAVEPOINT
   * sehingga hanya bagian dalam yang dibatalkan bila galatnya ditangkap di luar.
   */
  transaction<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
    return (...args: A): R => {
      const bersarang = this.kedalamanTransaksi > 0;
      const savepoint = `sp_ternakin_${this.kedalamanTransaksi}`;
      this.raw.exec(bersarang ? `SAVEPOINT ${savepoint}` : "BEGIN");
      this.kedalamanTransaksi += 1;
      try {
        const hasil = fn(...args);
        this.raw.exec(bersarang ? `RELEASE ${savepoint}` : "COMMIT");
        return hasil;
      } catch (galat) {
        if (bersarang) {
          this.raw.exec(`ROLLBACK TO ${savepoint}`);
          this.raw.exec(`RELEASE ${savepoint}`);
        } else if (this.raw.isTransaction) {
          this.raw.exec("ROLLBACK");
        }
        throw galat;
      } finally {
        this.kedalamanTransaksi -= 1;
      }
    };
  }

  close(): void {
    this.raw.close();
  }
}
