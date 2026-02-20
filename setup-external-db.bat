@echo off
REM Quick setup script for ThermoLabel with external database (Windows)

setlocal enabledelayedexpansion

echo.
echo ================================================
echo ThermoLabel Setup Script (Windows)
echo ================================================
echo.

REM Check if .env exists
if not exist .env (
    echo Warning: .env file not found. Creating from .env.example...
    copy .env.example .env
    echo Created .env file
    echo.
    echo Please edit .env with your database connection details:
    echo   - DATABASE_URL
    echo   - DB_HOST (IP address of computer with PostgreSQL)
    echo   - DB_PASSWORD
    echo   - NEXT_PUBLIC_API_URL
    echo.
    echo Run this script again after editing .env
    pause
    exit /b 0
)

echo Checking environment...

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not installed
    pause
    exit /b 1
)
echo OK: Docker found

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker Compose is not installed
    pause
    exit /b 1
)
echo OK: Docker Compose found
echo.

REM Load .env (basic parsing)
for /f "tokens=1,2 delims==" %%A in (.env) do (
    if "%%A"=="DATABASE_URL" set DATABASE_URL=%%B
    if "%%A"=="DB_HOST" set DB_HOST=%%B
)

echo Database URL: !DATABASE_URL!
echo.

REM Start services
echo Starting ThermoLabel services...
docker compose -f docker-compose.external-db.yml --env-file .env up -d

if errorlevel 1 (
    echo Error: Failed to start services
    pause
    exit /b 1
)

echo.
echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo Services running:
docker compose -f docker-compose.external-db.yml ps
echo.
echo Access application:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo.
echo View logs:
echo   docker compose -f docker-compose.external-db.yml logs -f backend
echo.
echo Stop services:
echo   docker compose -f docker-compose.external-db.yml down
echo.
pause
