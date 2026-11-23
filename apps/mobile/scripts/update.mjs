// Mengirim update OTA (EAS Update) ke APK yang sudah terpasang, tanpa build/pasang ulang.
//
//   npm run update -w @ternakin/mobile -- "Pesan singkat perubahan"               (channel preview)
//   npm run update -w @ternakin/mobile -- --production "Pesan singkat perubahan"  (channel production)
//
// Alamat API dipaksa ke server produksi. Tanpa ini, EXPO_PUBLIC_API_URL bisa terbaca dari
// apps/mobile/.env lokal (tunnel laptop) dan ikut tertanam di update yang diterima pengguna.
// Hanya perubahan JS/aset yang bisa dikirim lewat update; perubahan native butuh build APK baru
// (runtimeVersion "fingerprint" mencegah update dikirim ke APK yang tidak cocok).
import { execSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AKAR_REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const URL_PRODUKSI = "https://ternakin.code-xpert.my.id";

const argumen = process.argv.slice(2);
const channel = argumen.includes("--production") ? "production" : "preview";
const pesan = argumen
  .filter((a) => !a.startsWith("--"))
  .join(" ")
  .trim();

if (!pesan) {
  console.error(
    'Tulis pesan update, contoh: npm run update -w @ternakin/mobile -- "Perbaiki Kokok"',
  );
  process.exit(1);
}

const env = { ...process.env, EXPO_PUBLIC_API_URL: URL_PRODUKSI };
const windows = process.platform === "win32";
// Dengan shell (Windows), argumen bersepasi harus dikutip manual.
const kutip = (nilai) => (windows ? `"${nilai.replace(/"/g, '\\"')}"` : nilai);

// @ternakin/shared dipakai dari dist/ (tidak ikut git): bangun ulang agar update tidak memakai
// hasil build lama.
console.log("Membangun @ternakin/shared...");
execSync("npm run build -w @ternakin/shared", { cwd: AKAR_REPO, stdio: "inherit" });

console.log(`Channel: ${channel}`);
console.log(`API: ${URL_PRODUKSI}`);

const proses = spawn(
  "npx",
  [
    "eas-cli@latest",
    "update",
    "--channel",
    channel,
    "--environment",
    channel,
    "--platform",
    "android",
    "--message",
    kutip(pesan),
  ],
  { stdio: "inherit", env, shell: windows },
);
proses.on("exit", (kode) => process.exit(kode ?? 0));
