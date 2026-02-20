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

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-dump-or-zip>"
  exit 1
fi

INPUT="$1"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

if [[ "$INPUT" == *.zip ]]; then
  unzip -q "$INPUT" -d "$WORK_DIR"
  DUMP_FILE="$(find "$WORK_DIR" -maxdepth 1 -name '*.dump' | head -n 1)"
else
  DUMP_FILE="$INPUT"
fi

if [ ! -f "$DUMP_FILE" ]; then
  echo "❌ Dump file not found"
  exit 1
fi

echo "♻️ Restoring database from $DUMP_FILE ..."
"${COMPOSE[@]}" cp "$DUMP_FILE" postgres:/tmp/thermolabel.restore.dump
"${COMPOSE[@]}" exec -T postgres pg_restore -U thermolabel_user -d thermolabel_db --clean --if-exists /tmp/thermolabel.restore.dump

echo "✅ Restore completed"
