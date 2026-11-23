// Preload untuk build di shared hosting (dipasang lewat NODE_OPTIONS oleh deploy/update-hosting.sh).
//
// Workbox memadatkan service worker dengan @rollup/plugin-terser, yang membuat worker thread
// sebanyak os.cpus().length. Server bersama melaporkan puluhan CPU, padahal CloudLinux membatasi
// jumlah proses/thread per akun, sehingga build gagal dengan "Unable to write the service worker
// file. 'EAGAIN'". Preload ini membatasi jumlah CPU yang terlihat (bawaan 2, atur lewat
// TERNAKIN_MAKS_CPU). Hasil build tidak berubah, hanya jumlah thread saat build.
const os = require("node:os");
const { syncBuiltinESMExports } = require("node:module");

const batas = Math.max(1, Number.parseInt(process.env.TERNAKIN_MAKS_CPU ?? "", 10) || 2);
const cpusAsli = os.cpus;
os.cpus = () => cpusAsli().slice(0, batas);
if (typeof os.availableParallelism === "function") {
  const paralelAsli = os.availableParallelism;
  os.availableParallelism = () => Math.min(paralelAsli(), batas);
}
// Agar `import { cpus } from "node:os"` di modul ES ikut memakai versi yang dibatasi.
syncBuiltinESMExports();
