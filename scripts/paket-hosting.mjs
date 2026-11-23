// Menyusun paket siap unggah untuk shared hosting CloudLinux (cPanel "Setup Node.js App").
//
// CloudLinux menjalankan npm dari virtual environment-nya sendiri (~/nodevenv/<app>/<versi>/lib),
// sehingga npm workspaces tidak didukung ("No workspaces found"). Skrip ini meniru tahap runner di
// Dockerfile: hasil build + package.json datar tanpa workspaces, lalu dikemas jadi satu arsip.
//
// Pemakaian: npm run paket:hosting            (build dulu, lalu kemas)
//            npm run paket:hosting -- --tanpa-build
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NAMA_FOLDER = "hosting-bundle";
const NAMA_ARSIP = "ternakin-hosting.tar.gz";
const OUT_DIR = path.join(ROOT, NAMA_FOLDER);

const bacaJson = (relatif) => JSON.parse(fs.readFileSync(path.join(ROOT, relatif), "utf-8"));

if (!process.argv.includes("--tanpa-build")) {
  execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
}

for (const folder of ["packages/shared/dist", "apps/api/dist", "apps/web/dist"]) {
  if (!fs.existsSync(path.join(ROOT, folder))) {
    console.error(`Folder ${folder} belum ada. Jalankan "npm run build" terlebih dahulu.`);
    process.exit(1);
  }
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
const salin = (dari, ke = dari) =>
  fs.cpSync(path.join(ROOT, dari), path.join(OUT_DIR, ke), { recursive: true });

// apps/api/package.json dibawa agar Node tahu file di apps/api/dist adalah ES module ("type": "module").
salin("apps/api/package.json");
salin("apps/api/dist");
salin("apps/api/migrations");
salin("apps/api/seed");
salin("apps/api/assets");
salin("apps/web/dist");

// @ternakin/shared disalin sebagai folder biasa di apps/api/node_modules, bukan di node_modules akar
// (yang berupa symlink milik CloudLinux dan bisa dibersihkan saat "Run NPM Install").
// Resolusi modul Node mencari apps/api/node_modules lebih dulu, jadi impornya tetap ketemu.
const tujuanShared = "apps/api/node_modules/@ternakin/shared";
salin("packages/shared/package.json", `${tujuanShared}/package.json`);
salin("packages/shared/dist", `${tujuanShared}/dist`);

// Kunci versi dependensi ke versi yang terpasang dan teruji di lokal (package.json memakai "latest").
function versiTerpasang(nama, cadangan) {
  const file = path.join(ROOT, "node_modules", nama, "package.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf-8")).version : cadangan;
}

const depApi = bacaJson("apps/api/package.json").dependencies ?? {};
const depShared = bacaJson("packages/shared/package.json").dependencies ?? {};
const dependencies = Object.fromEntries(
  Object.entries({ ...depShared, ...depApi })
    .filter(([nama]) => !nama.startsWith("@ternakin/"))
    .map(([nama, versi]) => [nama, versiTerpasang(nama, versi)])
    .sort(([a], [b]) => a.localeCompare(b)),
);

const paketDatar = {
  name: "ternakin-hosting",
  version: bacaJson("package.json").version,
  private: true,
  type: "module",
  main: "apps/api/dist/server.js",
  scripts: { start: "node apps/api/dist/server.js" },
  engines: { node: ">=22.12" },
  dependencies,
};
fs.writeFileSync(path.join(OUT_DIR, "package.json"), `${JSON.stringify(paketDatar, null, 2)}\n`);

// Path relatif + cwd agar tar di Windows tidak membaca "C:" sebagai nama host.
fs.rmSync(path.join(ROOT, NAMA_ARSIP), { force: true });
execFileSync("tar", ["-czf", NAMA_ARSIP, "-C", NAMA_FOLDER, "."], { cwd: ROOT, stdio: "inherit" });

console.log(`\nPaket hosting siap: ${NAMA_ARSIP} (isi juga ada di folder ${NAMA_FOLDER}/)`);
console.log("Dependensi runtime:", dependencies);
