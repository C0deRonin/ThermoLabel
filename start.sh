#!/bin/bash
# ThermoLabel — запуск только через Docker

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "ThermoLabel — запуск стека (только Docker)"
echo "=========================================="

if ! command -v docker &>/dev/null; then
  echo -e "${RED}Ошибка: Docker не найден. Установите Docker и Docker Compose.${NC}"
  exit 1
fi

if docker compose version &>/dev/null; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose &>/dev/null; then
  COMPOSE_CMD=(docker-compose)
else
  echo -e "${RED}Ошибка: Docker Compose не найден.${NC}"
  exit 1
fi

echo -e "${GREEN}Запуск контейнеров...${NC}"
"${COMPOSE_CMD[@]}" up -d

echo ""
echo -e "${GREEN}Готово.${NC}"
echo -e "Frontend:  ${YELLOW}http://localhost:3000${NC}"
echo -e "Backend:   ${YELLOW}http://localhost:8000${NC}"
echo -e "API docs:  ${YELLOW}http://localhost:8000/docs${NC}"
echo ""
echo "Остановка: ${COMPOSE_CMD[*]} down"
