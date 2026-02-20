#!/usr/bin/env bash
set -euo pipefail

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "❌ docker compose/docker-compose not found"
  exit 1
fi

OUT_DIR="${1:-./backups}"
TS="$(date +%Y%m%d_%H%M%S)"
DUMP_NAME="thermolabel_${TS}.dump"
ZIP_NAME="thermolabel_${TS}.zip"

mkdir -p "$OUT_DIR"

echo "📦 Creating database dump..."
"${COMPOSE[@]}" exec -T postgres pg_dump -U thermolabel_user -d thermolabel_db -Fc -f "/tmp/${DUMP_NAME}"
"${COMPOSE[@]}" cp "postgres:/tmp/${DUMP_NAME}" "${OUT_DIR}/${DUMP_NAME}"
zip -j "${OUT_DIR}/${ZIP_NAME}" "${OUT_DIR}/${DUMP_NAME}" >/dev/null
rm -f "${OUT_DIR:?}/${DUMP_NAME}"

echo "✅ Backup created: ${OUT_DIR}/${ZIP_NAME}"
