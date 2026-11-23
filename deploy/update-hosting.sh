#!/usr/bin/env bash
# Build Ternakin dari hasil git clone di shared hosting CloudLinux (cPanel "Setup Node.js App"),
# lalu salin hasilnya ke folder Application root.
#
# Kenapa tidak langsung dari folder clone: CloudLinux menjalankan npm dari virtual environment-nya
# sendiri sehingga npm workspaces tidak didukung. Jadi build dilakukan di folder clone memakai npm
# asli server, dan Application root (APP_DIR) hanya berisi paket runtime datar dari paket-hosting.mjs.
#
# Pemakaian (dari folder clone):
#   git pull && bash deploy/update-hosting.sh
# Opsional: APP_DIR=~/folder-lain NODE_BIN=/opt/alt/alt-nodejs22/root/usr/bin bash deploy/update-hosting.sh
set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="${APP_DIR:-$HOME/ternakin-app}"
NODE_BIN="${NODE_BIN:-/opt/alt/alt-nodejs22/root/usr/bin}"

if [ ! -x "$NODE_BIN/npm" ]; then
  echo "npm tidak ditemukan di $NODE_BIN. Cek dengan: ls /opt/alt/ | grep nodejs, lalu set NODE_BIN." >&2
  exit 1
fi
# npm asli harus menang dari npm pembungkus milik virtual environment CloudLinux.
export PATH="$NODE_BIN:$PATH"

if [ -L "$SRC_DIR/node_modules" ]; then
  echo "node_modules di $SRC_DIR adalah symlink CloudLinux: folder clone ini masih menjadi" >&2
  echo "Application root. Ubah Application root di panel ke $(basename "$APP_DIR"), lalu hapus" >&2
  echo "symlink-nya dengan: rm \"$SRC_DIR/node_modules\"" >&2
  exit 1
fi
if [ "$(cd "$APP_DIR" 2>/dev/null && pwd)" = "$SRC_DIR" ]; then
  echo "APP_DIR tidak boleh sama dengan folder clone." >&2
  exit 1
fi

cd "$SRC_DIR"
echo "== Node $(node --version), npm $(npm --version)"

echo "== Memasang dependensi (tanpa apps/mobile)"
npm ci -w @ternakin/shared -w @ternakin/api -w @ternakin/web --include-workspace-root \
  --no-audit --no-fund

echo "== Build dan menyusun paket runtime"
node scripts/paket-hosting.mjs

echo "== Menyalin ke $APP_DIR"
mkdir -p "$APP_DIR"
paket_lama="$(cat "$APP_DIR/package.json" 2>/dev/null || true)"
# Hapus hasil build lama agar berkas ber-hash dari versi sebelumnya tidak menumpuk.
# .env, node_modules (symlink CloudLinux), dan database tidak disentuh.
rm -rf "$APP_DIR/apps/api/dist" "$APP_DIR/apps/web/dist" "$APP_DIR/apps/api/node_modules/@ternakin"
cp -a "$SRC_DIR/hosting-bundle/." "$APP_DIR/"

mkdir -p "$APP_DIR/tmp"
touch "$APP_DIR/tmp/restart.txt"

echo
echo "Selesai. Aplikasi dimulai ulang pada permintaan berikutnya (tmp/restart.txt)."
if [ "$paket_lama" != "$(cat "$APP_DIR/package.json")" ]; then
  echo "PERHATIAN: dependensi runtime berubah. Klik 'Run NPM Install' lalu 'Restart' di panel."
fi
