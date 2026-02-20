@echo off
REM ThermoLabel — запуск только через Docker

echo.
echo ThermoLabel — запуск стека (только Docker)
echo ==========================================

where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Ошибка: Docker не найден. Установите Docker и Docker Compose.
  pause
  exit /b 1
)

docker compose version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  docker-compose version >nul 2>nul
  if %ERRORLEVEL% NEQ 0 (
    echo Ошибка: Docker Compose не найден.
    pause
    exit /b 1
  )
)

echo Запуск контейнеров...
docker compose up -d
if %ERRORLEVEL% NEQ 0 docker-compose up -d

echo.
echo Готово.
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:8000
echo API docs:  http://localhost:8000/docs
echo.
echo Остановка: docker compose down
pause
