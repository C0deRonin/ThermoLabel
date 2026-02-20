#!/bin/bash
# docker-restart.sh - Скрипт для перезапуска Docker контейнеров

set -e

echo "🐳 ThermoLabel Docker Manager"
echo "═══════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if docker and docker-compose installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

# Stop existing containers
echo -e "${YELLOW}⏹️  Stopping existing containers...${NC}"
docker-compose down --remove-orphans 2>/dev/null || true

# Kill any processes on the ports
echo -e "${YELLOW}🔒 Freeing ports 3000, 8000, 5432...${NC}"

# Kill processes on port 3000
if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "  Killing process on port 3000..."
    kill -9 $(lsof -t -i :3000) 2>/dev/null || true
fi

# Kill processes on port 8000
if lsof -i :8000 > /dev/null 2>&1; then
    echo -e "  Killing process on port 8000..."
    kill -9 $(lsof -t -i :8000) 2>/dev/null || true
fi

# Kill processes on port 5432
if lsof -i :5432 > /dev/null 2>&1; then
    echo -e "  Killing process on port 5432..."
    kill -9 $(lsof -t -i :5432) 2>/dev/null || true
fi

# Wait a moment
sleep 2

# Build and start containers
echo ""
echo -e "${YELLOW}🚀 Starting containers...${NC}"
docker-compose up --build -d

# Wait for services to be ready
echo ""
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if containers are running
echo ""
echo -e "${GREEN}✅ Checking container status...${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Services Started Successfully!${NC}"
echo ""
echo -e "Frontend:   ${GREEN}http://localhost:3000${NC}"
echo -e "Backend API: ${GREEN}http://localhost:8000${NC}"
echo -e "API Docs:    ${GREEN}http://localhost:8000/docs${NC}"
echo -e "Database:    ${GREEN}postgresql://localhost:5432${NC}"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "  docker-compose logs -f frontend"
echo "  docker-compose logs -f backend"
echo "  docker-compose logs -f postgres"
echo ""
echo -e "${YELLOW}To stop containers:${NC}"
echo "  docker-compose down"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
