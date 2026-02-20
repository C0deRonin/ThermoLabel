#!/usr/bin/env bash
# Запуск тестов перед Pull Request. Требует поднятый стек: docker compose up -d

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo -e "${RED}docker compose / docker-compose not found${NC}"
  exit 1
fi

BACKEND_CONTAINER="thermolabel-backend"
FRONTEND_CONTAINER="thermolabel-frontend"

run_backend_tests() {
  if ! docker ps --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER}$"; then
    echo -e "${YELLOW}Backend container not running. Start stack: docker compose up -d${NC}"
    return 1
  fi
  echo -e "${YELLOW}Running backend tests (pytest)...${NC}"
  docker exec "$BACKEND_CONTAINER" pytest tests/ -v --cov
}

run_frontend_tests() {
  if ! docker ps --format '{{.Names}}' | grep -q "^${FRONTEND_CONTAINER}$"; then
    echo -e "${YELLOW}Frontend container not running. Start stack: docker compose up -d${NC}"
    return 1
  fi
  echo -e "${YELLOW}Running frontend tests (Jest)...${NC}"
  docker exec "$FRONTEND_CONTAINER" npm test -- --coverage --watchAll=false
}

FAILED=0
run_backend_tests || FAILED=1
run_frontend_tests || FAILED=1

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}All tests passed.${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi
