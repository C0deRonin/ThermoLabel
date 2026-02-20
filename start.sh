#!/bin/bash
# start.sh - Запуск полного ThermoLabel стека

set -e

echo "🌡️  ThermoLabel Startup Script"
echo "=============================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js не найден. Установите Node.js 18+${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js найден: $(node --version)${NC}"

# Проверка Python (опционально)
if command -v python3 &> /dev/null; then
  echo -e "${GREEN}✓ Python3 найден: $(python3 --version)${NC}"
  HAS_PYTHON=true
else
  echo -e "${YELLOW}⚠ Python3 не найден (опционально)${NC}"
  HAS_PYTHON=false
fi

# Установка зависимостей frontend
echo ""
echo -e "${YELLOW}📦 Установка зависимостей frontend...${NC}"
if [ ! -d "node_modules" ]; then
  npm install
  echo -e "${GREEN}✓ Frontend зависимости установлены${NC}"
else
  echo -e "${GREEN}✓ Frontend зависимости уже установлены${NC}"
fi

# Установка зависимостей backend
if [ "$HAS_PYTHON" = true ]; then
  echo ""
  echo -e "${YELLOW}🐍 Установка зависимостей backend...${NC}"
  cd backend
  if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment создан${NC}"
  fi
  
  # Активировать venv и установить зависимости
  source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
  pip install -r requirements.txt > /dev/null 2>&1
  echo -e "${GREEN}✓ Backend зависимости установлены${NC}"
  cd ..
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Установка завершена${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "Запуск ThermoLabel:"
echo -e "  1. Frontend (Next.js):  npm run dev"
echo -e "  2. Backend (FastAPI):   cd backend && python main.py"
echo ""
echo -e "Frontend будет доступен на: ${YELLOW}http://localhost:3000${NC}"
echo -e "Backend будет доступен на:  ${YELLOW}http://localhost:8000${NC}"
echo -e "Документация:               ${YELLOW}README.md, USING_GUIDE.md${NC}"
echo ""
