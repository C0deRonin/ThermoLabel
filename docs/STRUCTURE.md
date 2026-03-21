# Структура репозитория

## Корневые директории

- `pages/` — страницы frontend и API proxy.
- `components/` — UI-компоненты интерфейса.
- `lib/` — константы, темы и сервисы frontend.
- `backend/` — серверная часть на FastAPI.
- `public/` — статические ресурсы.
- `styles/` — глобальные стили.
- `docs/` — документация проекта.
- `scripts/` — служебные скрипты.

## Frontend

- `pages/index.js` — основная страница приложения.
- `components/*` — панели, модальные окна и виджеты.
- `lib/services/*` — логика работы с данными на клиенте.

## Backend

- `backend/main.py` — точка входа приложения.
- `backend/app/api/` — маршруты API.
- `backend/app/services/` — сервисная логика.
- `backend/app/repositories/` — слой доступа к данным.
- `backend/app/models/` — SQLAlchemy-модели.
- `backend/tests/` — backend-тесты.
