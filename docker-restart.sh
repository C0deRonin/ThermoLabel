#!/bin/bash
# docker-restart.sh - Перезапуск Docker контейнеров ThermoLabel c освобождением порта 3000

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}❌ Docker не установлен${NC}"
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo -e "${RED}❌ Docker Compose не установлен${NC}"
  exit 1
fi

stop_publishers_for_port() {
  local port="$1"
  local pids docker_ps

  pids=$(lsof -t -i TCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  killing local pid(s) on :$port => $pids"
    kill -9 $pids 2>/dev/null || true
  fi

  docker_ps=$(docker ps --filter "publish=$port" --format '{{.ID}}')
  if [ -n "$docker_ps" ]; then
    echo "  stopping docker container(s) publishing :$port => $docker_ps"
    docker stop $docker_ps >/dev/null 2>&1 || true
    docker rm -f $docker_ps >/dev/null 2>&1 || true
  fi
}

echo -e "${YELLOW}⏹️ Остановка текущих контейнеров проекта...${NC}"
"${COMPOSE_CMD[@]}" down --remove-orphans 2>/dev/null || true

echo -e "${YELLOW}🧹 Освобождение портов 3000/8000/5432...${NC}"
for port in 3000 8000 5432; do
  stop_publishers_for_port "$port"
done

sleep 2

echo -e "${YELLOW}🚀 Запуск проекта на порту 3000...${NC}"
if ! "${COMPOSE_CMD[@]}" up --build -d --force-recreate; then
  echo -e "${YELLOW}⚠️ Первый запуск не удался, повторно освобождаем порт 3000 и перезапускаем...${NC}"
  stop_publishers_for_port 3000
  sleep 2
  "${COMPOSE_CMD[@]}" up --build -d --force-recreate
fi

echo -e "${GREEN}✅ Статус контейнеров:${NC}"
"${COMPOSE_CMD[@]}" ps

echo -e "\n${GREEN}Frontend: http://localhost:3000${NC}"
