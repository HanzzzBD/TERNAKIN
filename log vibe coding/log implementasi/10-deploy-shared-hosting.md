# Deploy ke Shared Hosting

| Commit | Tanggal | Penulis | Model (trailer) | Pesan |
|---|---|---|---|---|
| `68c80e9` | 23 Nov | HanzzzBD | tidak tercatat | setup deploy |
| `b0cdc09` | 23 Nov | HanzzzBD | tidak tercatat | setup deployv2 |
| `34d2d69` | 23 Nov | HanzzzBD | tidak tercatat | setup deployv2.1 |
| `6c0206c` | 23 Nov | HanzzzBD | tidak tercatat | setup.deployv2.1.1 |
| `f7dfa72` | 23 Nov | HanzzzBD | Claude Opus 5.5 | chore(lint): mengenali scripts/*.cjs sebagai CommonJS Node |
| `76b8669` | 23 Nov | HanzzzBD | Claude Opus 5.5 | fix(deploy): membangun service worker tanpa terser saat build di shared hosting |

Commit `68c80e9` sampai `6c0206c` tidak mencantumkan trailer `Co-Authored-By`. Kodenya dibuat dalam satu sesi Claude Code: `scripts/paket-hosting.mjs` dengan Claude Haiku 5.5, lalu `deploy/update-hosting.sh` dan migrasi ke `node:sqlite` dengan Claude Opus 5.5, begitu juga `scripts/batasi-cpu.cjs` di `6c0206c`. Keterangan ini berasal dari sesi pengerjaan, bukan dari pesan commit.

## Latar

Ternakin dipasang di shared hosting jagoanhosting (cPanel, CloudLinux Node.js Selector, LiteSpeed, Node 22.23) di `https://ternakin.code-xpert.my.id`. Repo disiapkan untuk VPS dengan Docker dan nginx, sehingga ada tiga masalah saat dipasang di hosting ini:

1. **npm workspaces tidak jalan.** CloudLinux menjalankan npm dari virtual environment miliknya (`~/nodevenv/<app>/22/lib`). Dari sana folder `apps/*` dan `packages/*` tidak terlihat, sehingga `npm install` gagal dengan `No workspaces found`. Selain itu, `node_modules` di Application root wajib berupa symlink ke virtual environment tersebut.
2. **Startup file belum ada.** `apps/api/dist` tidak ikut di Git. Saat startup file diisi `apps/api/dist/server.js`, panel membuat berkas "hello world" CommonJS di path itu. Berkas tersebut langsung crash (`require is not defined in ES module scope`) karena `apps/api` memakai `"type": "module"`, dan situs menampilkan 503.
3. **Modul native tidak bisa dimuat.** Berkas biner bawaan `better-sqlite3` butuh GLIBC 2.29, sedangkan server memakai GLIBC 2.28. Kompilasi ulang dengan `npm rebuild better-sqlite3 --build-from-source` juga tidak menghasilkan berkas `.node`. Server crash dengan `ERR_DLOPEN_FAILED` saat membuka database.

## Isi

**Paket runtime datar (`68c80e9`).** `scripts/paket-hosting.mjs` (`npm run paket:hosting`) meniru tahap runner di `Dockerfile`. Skrip ini menjalankan build, lalu menyusun `hosting-bundle/` dan `ternakin-hosting.tar.gz`.
- Isi paket: `apps/api/dist`, `migrations`, `seed`, `assets`, dan `apps/web/dist`.
- `package.json` di akar paket tidak memakai workspaces. Isinya hanya dependensi runtime API dan shared, dengan versi dikunci ke versi yang terpasang di mesin build.
- `@ternakin/shared` disalin sebagai folder biasa ke `apps/api/node_modules/@ternakin/shared`, bukan ke `node_modules` akar yang dikelola CloudLinux. Resolusi modul Node mencari folder itu lebih dulu.
- `.gitignore` mengabaikan `hosting-bundle/` dan arsipnya.

**Skrip update dari git clone (`b0cdc09`).** `deploy/update-hosting.sh` dijalankan di folder hasil clone (`~/TERNAKIN`), bukan di Application root (`~/ternakin-app`).
- Memakai npm asli server (`/opt/alt/alt-nodejs22/root/usr/bin`) agar tidak tertimpa npm milik virtual environment.
- `npm ci` hanya untuk `shared`, `api`, dan `web`. `apps/mobile` (Expo) tidak dipasang.
- Menjalankan `paket-hosting.mjs`, menyalin hasilnya ke Application root, lalu memicu restart lewat `tmp/restart.txt`.
- Berkas `.env`, symlink `node_modules`, dan database tidak disentuh. Bila daftar dependensi berubah, skrip meminta "Run NPM Install" di panel.
- Skrip berhenti bila folder clone masih menjadi Application root.

**SQLite bawaan Node dan pembersihan (`34d2d69`).**
- `apps/api/src/db/sqlite.ts` (baru) adalah lapisan tipis di atas `node:sqlite` dengan API seperti better-sqlite3: `prepare().get/all/run`, `exec`, `pragma`, dan `transaction`. Sekitar 120 kueri di 12 berkas tidak perlu diubah, cukup import-nya saja.
- `transaction` bersarang memakai SAVEPOINT seperti better-sqlite3. Ini dibutuhkan karena `hapusAkun` memanggil `deleteAllDataByDevice`, yang membuka transaksinya sendiri.
- Kunci objek parameter yang tidak dipakai kueri diabaikan (`setAllowUnknownNamedParameters`), dan baris dikembalikan sebagai objek biasa.
- `better-sqlite3` dan `@types/better-sqlite3` dihapus dari `apps/api`. Tipe kolom vektor embedding diganti dari `Buffer` ke `Uint8Array`.
- `apps/api/src/sqlite.test.ts` (baru) berisi 6 tes: parameter positional dan bernama, BLOB, commit, rollback, transaksi bersarang, dan pragma.
- `paket-hosting.mjs` menaikkan syarat menjadi Node `>=22.16`.
- `update-hosting.sh` menghapus `node_modules` dan hasil paket dari folder clone setelah build, untuk menghemat kuota disk dan inode. `npm ci` selalu memasang ulang dari nol, jadi pembersihan ini tidak membuat update berikutnya lebih lambat.
- Dokumen SDD diperbarui: basis data memakai `node:sqlite`.

**Batas thread saat build di server (`6c0206c`, `f7dfa72`).** Build web di server gagal dengan `Unable to write the service worker file. 'EAGAIN'`. Workbox memadatkan service worker dengan `@rollup/plugin-terser`, yang membuat worker thread sebanyak `os.cpus().length`. Server bersama melaporkan puluhan CPU, sedangkan CloudLinux membatasi jumlah proses/thread per akun.
- `scripts/batasi-cpu.cjs` (baru) adalah preload Node yang membatasi `os.cpus()` dan `os.availableParallelism()` menjadi 2 (atur lewat `TERNAKIN_MAKS_CPU`), termasuk untuk `import { cpus }` di modul ES.
- `update-hosting.sh` memasang preload itu lewat `NODE_OPTIONS` hanya saat build di server. Build di laptop dan Docker tidak terpengaruh.
- Hasil build tidak berubah: dengan batas 1 CPU, `sw.js` dan `workbox-ccc5761b.js` tetap sama hash dan ukurannya, dan tetap dipadatkan.
- `f7dfa72`: `eslint.config.js` mengenali `scripts/**/*.cjs` sebagai CommonJS Node, karena berkas preload itu membuat `npm run lint` gagal.

**Koreksi: service worker tanpa terser di server (`76b8669`).** Setelah `6c0206c` dipasang, build di server tetap gagal dengan `EAGAIN` yang sama. Diagnosis di atas ternyata tidak tepat. Plugin terser membuat worker secara bertahap, sebanyak tugas yang ada, yaitu 1–2 worker, bukan sebanyak `os.cpus()`. Pesan `EAGAIN` adalah galat Node saat gagal membuat **satu** worker thread itu, karena proses build (rolldown memakai thread sebanyak inti CPU server) sudah dekat batas thread akun CloudLinux.
- `vite.config.ts`: bila `TERNAKIN_SW_TANPA_TERSER=1`, workbox memakai mode `development`, sehingga tidak memanggil terser dan tidak membuat worker thread. `disableDevLogs: true` menjaga service worker tanpa log debug.
- `update-hosting.sh` mengisi variabel itu. Preload `scripts/batasi-cpu.cjs` dan aturan eslint `*.cjs` dari `6c0206c`/`f7dfa72` dihapus.
- Uji dengan meniru server, yaitu pembuatan worker thread dipaksa gagal dengan `EAGAIN`: tanpa perbaikan, galat yang persis sama muncul. Dengan perbaikan, langkah build `update-hosting.sh` berhasil dan paket hosting terbentuk.
- Build laptop dan Docker tetap dipadatkan (`workbox-ccc5761b.js`, 22 KB). Di server, runtime workbox tidak dipadatkan (178 KB), dan hanya diunduh sekali lalu disimpan di cache service worker.

## Hasil verifikasi

Dijalankan di mesin pengembang (Windows, Node 26) sebelum commit:
- Tes API: 129 dari 129 lolos, termasuk 6 tes baru `sqlite.test.ts`. Typecheck dan eslint lolos.
- Paket diekstrak ke folder kosong, lalu `npm install` tanpa workspaces. `/health` membalas `{"ok":true}`, dan `/v1/referensi` mengembalikan data dari database.
- `update-hosting.sh` diuji dari clone bersih: `apps/mobile` tidak terpasang, dan folder clone tetap bersih (`git status` kosong) setelah build.

Tidak diuji di mesin pengembang: Node 22.23 itu sendiri. Situs kemudian berjalan di server produksi.

## Keputusan yang tercatat

- Folder clone (`~/TERNAKIN`) hanya untuk build. Application root di panel adalah `~/ternakin-app`, yang berisi paket runtime.
- Database disimpan di `~/ternakin-data/`, di luar folder aplikasi, agar tidak tertimpa saat update.
- Aplikasi dipasang di akar subdomain, bukan subfolder seperti `/ternakin`, karena SPA dan API mengandalkan path `/`.
- Document root subdomain tidak boleh mengarah ke folder clone, agar `.git` tidak bisa diunduh.
- Memakai `node:sqlite` alih-alih modul native, agar aplikasi jalan di server dengan GLIBC lama. Format berkas database tidak berubah.
- Alur update: `cd ~/TERNAKIN && git pull && bash deploy/update-hosting.sh`.
- Di server, service worker dibangun tanpa terser (mode workbox `development` dengan `disableDevLogs`), karena pembuatan worker thread ditolak CloudLinux. Keputusan awal di `6c0206c` (membatasi jumlah CPU lewat preload) dibatalkan di `76b8669` karena tidak menyelesaikan masalah.

---

## Detail perubahan per commit

Bagian ini dibuat dari `git show` untuk setiap commit: jumlah baris berubah per file, status file (baru atau diubah), dan isi pesan commit.

### `68c80e9` — setup deploy

- **Tanggal:** 2026-11-23 · **Penulis:** HanzzzBD · **Model:** tidak tercatat
- **Ringkasan:** 3 file, +87 / -1 baris

**Isi pesan commit:**

> setup deploy

| File | + | − | Status |
|---|---:|---:|---|
| `.gitignore` | 2 | 0 | diubah |
| `package.json` | 2 | 1 | diubah |
| `scripts/paket-hosting.mjs` | 83 | 0 | baru |

### `b0cdc09` — setup deployv2

- **Tanggal:** 2026-11-23 · **Penulis:** HanzzzBD · **Model:** tidak tercatat
- **Ringkasan:** 1 file, +61 / -0 baris

**Isi pesan commit:**

> setup deployv2

| File | + | − | Status |
|---|---:|---:|---|
| `deploy/update-hosting.sh` | 61 | 0 | baru |

### `34d2d69` — setup deployv2.1

- **Tanggal:** 2026-11-23 · **Penulis:** HanzzzBD · **Model:** tidak tercatat
- **Ringkasan:** 19 file, +264 / -107 baris

**Isi pesan commit:**

> setup deployv2.1

| File | + | − | Status |
|---|---:|---:|---|
| `Ternakin SDD Website (PWA).md` | 1 | 1 | diubah |
| `apps/api/package.json` | 0 | 2 | diubah |
| `apps/api/src/adapters/embeddingGuidelineRetriever.ts` | 4 | 4 | diubah |
| `apps/api/src/adapters/penyediaLlm.ts` | 2 | 2 | diubah |
| `apps/api/src/adapters/sqliteGuidelineRetriever.ts` | 2 | 2 | diubah |
| `apps/api/src/db/akunRepo.ts` | 13 | 13 | diubah |
| `apps/api/src/db/catatanRepo.ts` | 10 | 10 | diubah |
| `apps/api/src/db/database.ts` | 6 | 6 | diubah |
| `apps/api/src/db/emailRepo.ts` | 10 | 10 | diubah |
| `apps/api/src/db/investasiRepo.ts` | 8 | 8 | diubah |
| `apps/api/src/db/sqlite.ts` | 96 | 0 | baru |
| `apps/api/src/db/tokoRepo.ts` | 5 | 5 | diubah |
| `apps/api/src/lib/llmGuard.ts` | 5 | 5 | diubah |
| `apps/api/src/lib/sesiMasuk.ts` | 2 | 2 | diubah |
| `apps/api/src/middleware/sesi.ts` | 2 | 2 | diubah |
| `apps/api/src/sqlite.test.ts` | 88 | 0 | baru |
| `deploy/update-hosting.sh` | 9 | 0 | diubah |
| `package-lock.json` | 0 | 34 | diubah |
| `scripts/paket-hosting.mjs` | 1 | 1 | diubah |

### `6c0206c` — setup.deployv2.1.1

- **Tanggal:** 2026-11-23 · **Penulis:** HanzzzBD · **Model:** tidak tercatat
- **Ringkasan:** 2 file, +24 / -1 baris

**Isi pesan commit:**

> setup.deployv2.1.1

| File | + | − | Status |
|---|---:|---:|---|
| `deploy/update-hosting.sh` | 5 | 1 | diubah |
| `scripts/batasi-cpu.cjs` | 19 | 0 | baru |

### `f7dfa72` — chore(lint): mengenali scripts/*.cjs sebagai CommonJS Node

- **Tanggal:** 2026-11-23 · **Penulis:** HanzzzBD · **Model:** Claude Opus 5.5
- **Ringkasan:** 1 file, +9 / -0 baris

**Isi pesan commit:**

> scripts/batasi-cpu.cjs (preload build di shared hosting) membuat npm run lint gagal karena require dan process belum dikenali.

| File | + | − | Status |
|---|---:|---:|---|
| `eslint.config.js` | 9 | 0 | diubah |

### `76b8669` — fix(deploy): membangun service worker tanpa terser saat build di shared hosting

- **Tanggal:** 2026-11-23 · **Penulis:** HanzzzBD · **Model:** Claude Opus 5.5
- **Ringkasan:** 4 file, +15 / -33 baris

**Isi pesan commit:**

> Build di server masih gagal dengan "Unable to write the service worker file. 'EAGAIN'" setelah 6c0206c. Pesan itu berasal dari Node yang gagal membuat satu worker thread untuk terser (workbox memadatkan service worker), karena proses build sudah dekat batas thread akun CloudLinux. Membatasi os.cpus() tidak membantu: terser hanya membuat 1-2 worker.
> - vite.config.ts: bila TERNAKIN_SW_TANPA_TERSER=1, workbox memakai mode "development" sehingga tidak memanggil terser (tanpa worker thread). disableDevLogs menjaga service worker tanpa log. Build laptop/Docker tetap dipadatkan seperti sebelumnya.
> - update-hosting.sh mengisi TERNAKIN_SW_TANPA_TERSER=1 dan tidak lagi memasang preload.
> - scripts/batasi-cpu.cjs dan aturan eslint untuk *.cjs dihapus. Diuji dengan meniru server (pembuatan worker thread dipaksa gagal "EAGAIN"): tanpa perbaikan galat yang sama muncul, dengan perbaikan paket hosting terbentuk.

| File | + | − | Status |
|---|---:|---:|---|
| `apps/web/vite.config.ts` | 11 | 0 | diubah |
| `deploy/update-hosting.sh` | 4 | 5 | diubah |
| `eslint.config.js` | 0 | 9 | diubah |
| `scripts/batasi-cpu.cjs` | 0 | 19 | dihapus |
