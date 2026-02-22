# Архитектура Infralabel

## Общая схема

Infralabel состоит из двух основных частей:
- Frontend (Next.js/React) — интерфейс разметки и аналитики.
- Backend (FastAPI) — бизнес-логика, работа с проектами и настройками, доступ к базе данных.

## Frontend

Frontend отвечает за:
- отображение изображения и слоёв аннотаций;
- инструменты разметки и редактирования;
- локальные сервисы (history, export, analytics, palette, storage);
- вызовы backend API через proxy-маршрут.

Ключевые директории:
- `pages/`
- `components/`
- `lib/services/`

## Backend

Backend реализует:
- REST API для проектов и настроек;
- сервисный слой с бизнес-правилами;
- репозитории для доступа к данным;
- SQLAlchemy-модели.

Ключевые директории:
- `backend/app/api/`
- `backend/app/services/`
- `backend/app/repositories/`
- `backend/app/models/`

## Данные

- Основная СУБД: PostgreSQL.
- Миграции: Alembic.
- Конфигурация подключения: `backend/app/core/config.py`.

## Инфраструктура

- Локальный запуск: npm и Python-окружение.
- Контейнерный запуск: Docker и docker-compose.
- Скрипты обслуживания БД: `scripts/db-backup.sh`, `scripts/db-restore.sh`.

## Принципы

- Разделение ответственности по слоям.
- Минимальная связность между UI и данными.
- Тестируемость сервисов отдельно от UI.
