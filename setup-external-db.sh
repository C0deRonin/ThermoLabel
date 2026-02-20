#!/bin/bash
# Quick setup script for ThermoLabel with external database

set -e

echo "================================================"
echo "ThermoLabel Setup Script"
echo "================================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "📝 Please edit .env with your database connection details:"
    echo "   - DATABASE_URL"
    echo "   - DB_HOST (IP address of computer with PostgreSQL)"
    echo "   - DB_PASSWORD"
    echo "   - NEXT_PUBLIC_API_URL"
    echo ""
    echo "Run this script again after editing .env"
    exit 0
fi

echo "Checking environment variables..."
source .env

# Validate DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set in .env"
    exit 1
fi

echo "✅ DATABASE_URL: $DATABASE_URL"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ ERROR: Docker is not installed"
    exit 1
fi
echo "✅ Docker found: $(docker --version)"

if ! command -v docker-compose &> /dev/null; then
    echo "❌ ERROR: Docker Compose is not installed"
    exit 1
fi
echo "✅ Docker Compose found: $(docker-compose --version)"
echo ""

# Test database connection
echo "🔍 Testing database connection..."
if docker run --rm postgres:15-alpine psql "$DATABASE_URL" -c "SELECT 1;" &>/dev/null; then
    echo "✅ Database connection successful!"
else
    echo "❌ ERROR: Cannot connect to database"
    echo "   Check DATABASE_URL in .env"
    exit 1
fi
echo ""

# Start services
echo "🚀 Starting ThermoLabel services..."
docker compose -f docker-compose.external-db.yml --env-file .env up -d

echo ""
echo "================================================"
echo "✅ Setup Complete!"
echo "================================================"
echo ""
echo "Services running:"
docker compose -f docker-compose.external-db.yml ps
echo ""
echo "Access application:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo ""
echo "View logs:"
echo "  docker compose -f docker-compose.external-db.yml logs -f backend"
echo "  docker compose -f docker-compose.external-db.yml logs -f frontend"
echo ""
echo "Stop services:"
echo "  docker compose -f docker-compose.external-db.yml down"
echo ""
