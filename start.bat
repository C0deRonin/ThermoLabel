@echo off
REM start.bat - Запуск полного ThermoLabel стека (Windows)

echo.
echo 🌡️  ThermoLabel Startup Script (Windows)
echo ======================================

REM Проверка Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Node.js не найден. Установите Node.js 18+
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js найден: %NODE_VERSION%

REM Проверка Python (опционально)
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
  echo ✓ Python найден: %PYTHON_VERSION%
  set HAS_PYTHON=1
) else (
  echo ⚠ Python не найден (опционально)
  set HAS_PYTHON=0
)

REM Установка зависимостей frontend
echo.
echo 📦 Установка зависимостей frontend...
if not exist "node_modules" (
  call npm install
  echo ✓ Frontend зависимости установлены
) else (
  echo ✓ Frontend зависимости уже установлены
)

REM Установка зависимостей backend
if %HAS_PYTHON% EQU 1 (
  echo.
  echo 🐍 Установка зависимостей backend...
  cd backend
  
  if not exist "venv" (
    python -m venv venv
    echo ✓ Virtual environment создан
  )
  
  REM Активировать venv и установить зависимости
  call venv\Scripts\activate.bat
  pip install -r requirements.txt >nul 2>&1
  echo ✓ Backend зависимости установлены
  
  cd ..
)

echo.
echo ════════════════════════════════════════
echo ✓ Установка завершена
echo ════════════════════════════════════════
echo.
echo Запуск ThermoLabel:
echo   1. Frontend (Next.js):  npm run dev
echo   2. Backend (FastAPI):   cd backend ^&^& python main.py
echo.
echo Frontend будет доступен на: http://localhost:3000
echo Backend будет доступен на:  http://localhost:8000
echo Документация:               README.md, USING_GUIDE.md
echo.
pause
