#!/usr/bin/env bash
# Memasang APK Android Ternakin di server agar bisa diunduh dari website (tombol "Unduh untuk Android",
# berkas di /unduh/ternakin.apk). Jalankan di server setelah `eas build --profile preview` selesai.
#
# Pemakaian:
#   bash deploy/pasang-apk.sh https://expo.dev/artifacts/eas/xxxx.apk   (link APK dari hasil eas build)
#   bash deploy/pasang-apk.sh ~/Ternakin.apk                             (berkas yang sudah diunggah)
#
# Folder tujuan harus sama dengan UNDUHAN_DIR server. Bawaan server: <folder database>/unduhan,
# yaitu ~/ternakin-data/unduhan untuk DATABASE_PATH=/home/<user>/ternakin-data/ternakin.sqlite.
set -euo pipefail

SUMBER="${1:-}"
TUJUAN_DIR="${UNDUHAN_DIR:-$HOME/ternakin-data/unduhan}"
TUJUAN="$TUJUAN_DIR/ternakin.apk"

if [ -z "$SUMBER" ]; then
  echo "Pakai: bash deploy/pasang-apk.sh <link APK dari eas build | path berkas APK>" >&2
  exit 1
fi

mkdir -p "$TUJUAN_DIR"
# Unduh/salin ke berkas sementara di folder yang sama, lalu ganti sekaligus (mv) agar pengunjung
# tidak pernah mengunduh APK setengah jadi.
SEMENTARA="$(mktemp "$TUJUAN_DIR/.ternakin-apk.XXXXXX")"
trap 'rm -f "$SEMENTARA"' EXIT

case "$SUMBER" in
  http://* | https://*)
    echo "== Mengunduh APK dari $SUMBER"
    if command -v curl >/dev/null 2>&1; then
      curl -fL --retry 3 --progress-bar -o "$SEMENTARA" "$SUMBER"
    else
      wget -q --show-progress -O "$SEMENTARA" "$SUMBER"
    fi
    ;;
  *)
    if [ ! -f "$SUMBER" ]; then
      echo "Berkas tidak ditemukan: $SUMBER" >&2
      exit 1
    fi
    cp "$SUMBER" "$SEMENTARA"
    ;;
esac

# APK adalah arsip ZIP: harus diawali "PK" dan berukuran wajar (bukan halaman galat HTML).
UKURAN="$(wc -c < "$SEMENTARA" | tr -d ' ')"
if [ "$(head -c 2 "$SEMENTARA")" != "PK" ] || [ "$UKURAN" -lt 1048576 ]; then
  echo "Berkas bukan APK yang sah (ukuran $UKURAN byte). Periksa link atau berkasnya." >&2
  exit 1
fi

chmod 644 "$SEMENTARA"
mv -f "$SEMENTARA" "$TUJUAN"
trap - EXIT

echo "APK terpasang: $TUJUAN ($((UKURAN / 1024 / 1024)) MB)"
echo "Tombol unduh di website muncul otomatis (cek: /v1/unduhan)."
