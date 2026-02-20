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

print_port_holders() {
  local port="$1"
  echo "  checking listeners on :$port"
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
  elif command -v ss >/dev/null 2>&1; then
    ss -ltnp "( sport = :$port )" 2>/dev/null || true
  else
    echo "  lsof/ss not found"
  fi
}

kill_host_port_holders() {
  local port="$1"
  local pids=""

  if command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  elif command -v ss >/dev/null 2>&1; then
    pids=$(ss -ltnp "( sport = :$port )" 2>/dev/null | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u)
  fi

  if [ -n "$pids" ]; then
    echo "  killing host pid(s) on :$port => $pids"
    kill -9 $pids 2>/dev/null || true
  fi

  # fallback for environments with fuser only
  if command -v fuser >/dev/null 2>&1; then
    fuser -k -n tcp "$port" 2>/dev/null || true
  fi

  # docker-proxy может остаться даже после stop/rm
  local docker_proxy_pids
  docker_proxy_pids=$(ps aux | awk -v p=":$port" '/docker-proxy/ && $0 ~ p {print $2}')
  if [ -n "$docker_proxy_pids" ]; then
    echo "  killing docker-proxy pid(s) on :$port => $docker_proxy_pids"
    kill -9 $docker_proxy_pids 2>/dev/null || true
  fi
}

stop_publishing_containers() {
  local port="$1"
  local docker_ids

  docker_ids=$(docker ps --filter "publish=$port" --format '{{.ID}}' || true)
  if [ -n "$docker_ids" ]; then
    echo "  stopping container(s) publishing :$port => $docker_ids"
    docker stop $docker_ids >/dev/null 2>&1 || true
    docker rm -f $docker_ids >/dev/null 2>&1 || true
  fi
}

free_port() {
  local port="$1"
  print_port_holders "$port"
  stop_publishing_containers "$port"
  kill_host_port_holders "$port"
  sleep 1
  print_port_holders "$port"
}

cleanup_ports() {
  for port in 3000 8000 5432; do
    echo -e "${YELLOW}🧹 Releasing :$port...${NC}"
    free_port "$port"
  done
}

echo -e "${YELLOW}⏹️ Остановка текущих контейнеров проекта...${NC}"
"${COMPOSE_CMD[@]}" down --remove-orphans 2>/dev/null || true

echo -e "${YELLOW}🧹 Полная очистка портов...${NC}"
cleanup_ports

POSTGRES_DATA_PATH="${POSTGRES_DATA_PATH:-./.docker/postgres-data}"
mkdir -p "$POSTGRES_DATA_PATH"
echo -e "${YELLOW}📁 Postgres data dir: ${POSTGRES_DATA_PATH}${NC}"

echo -e "${YELLOW}🧼 Очистка остановленных контейнеров/сирот...${NC}"
docker container prune -f >/dev/null 2>&1 || true

sleep 2

echo -e "${YELLOW}🚀 Запуск проекта на порту 3000...${NC}"
if ! "${COMPOSE_CMD[@]}" up --build -d --force-recreate; then
  echo -e "${YELLOW}⚠️ Первый запуск не удался, повторная очистка и перезапуск...${NC}"
  cleanup_ports
  sleep 2
  "${COMPOSE_CMD[@]}" up --build -d --force-recreate
fi

echo -e "${GREEN}✅ Статус контейнеров:${NC}"
"${COMPOSE_CMD[@]}" ps

echo -e "\n${GREEN}Frontend: http://localhost:3000${NC}"
