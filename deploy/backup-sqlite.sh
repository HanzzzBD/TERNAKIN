#!/usr/bin/env sh
# Skrip cadangan harian basis data SQLite Ternakin (jalankan lewat cron di VPS)
set -eu

DB_PATH="${DATABASE_PATH:-/data/ternakin.sqlite}"
BACKUP_DIR="${BACKUP_DIR:-/data/backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$BACKUP_DIR"
sqlite3 "$DB_PATH" ".backup '${BACKUP_DIR}/ternakin-${STAMP}.sqlite'"

# Pertahankan cadangan 14 hari terakhir
find "$BACKUP_DIR" -name 'ternakin-*.sqlite' -mtime +14 -delete
echo "Cadangan SQLite selesai: ${BACKUP_DIR}/ternakin-${STAMP}.sqlite"
