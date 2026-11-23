// Menjalankan Metro untuk development build Ternakin. Secara bawaan Metro diiklankan lewat
// Cloudflare Tunnel (https://ternakin-dev.orbit4.my.id) agar HP bisa memuat kode dari mana saja.
// Pakai `npm run dev -- --lan` bila HP dan laptop satu WiFi (tanpa tunnel).
import { spawn } from "node:child_process";

const lan = process.argv.includes("--lan");
const env = { ...process.env };
if (!lan) env.EXPO_PACKAGER_PROXY_URL ??= "https://ternakin-dev.orbit4.my.id";
env.EXPO_PUBLIC_API_URL ??= "https://ternakin-api.orbit4.my.id";

console.log(
  lan
    ? "Metro lewat jaringan lokal (LAN)."
    : `Metro diiklankan lewat ${env.EXPO_PACKAGER_PROXY_URL}`,
);
console.log(`API: ${env.EXPO_PUBLIC_API_URL}`);

const args = [
  "expo",
  "start",
  "--dev-client",
  ...process.argv.slice(2).filter((a) => a !== "--lan"),
];
const proses = spawn("npx", args, { stdio: "inherit", env, shell: process.platform === "win32" });
proses.on("exit", (kode) => process.exit(kode ?? 0));
