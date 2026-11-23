// Menjalankan Cloudflare Tunnel pengembangan Ternakin (API + Metro) dengan konfigurasi di
// ~/.cloudflared/ternakin-dev.yml. Lihat deploy/cloudflared/ternakin-dev.example.yml.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const config =
  process.env.TERNAKIN_TUNNEL_CONFIG ?? path.join(homedir(), ".cloudflared", "ternakin-dev.yml");

if (!existsSync(config)) {
  console.error(`Konfigurasi tunnel tidak ditemukan: ${config}`);
  console.error(
    "Salin deploy/cloudflared/ternakin-dev.example.yml ke lokasi itu lalu isi ID tunnel Anda.",
  );
  process.exit(1);
}

const proses = spawn("cloudflared", ["tunnel", "--config", config, "run"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
proses.on("exit", (kode) => process.exit(kode ?? 0));
