# Infralabel

Infralabel — веб-приложение для разметки тепловизионных изображений и подготовки датасетов для задач Computer Vision.

## Назначение

Проект помогает:
- загружать термальные изображения;
- создавать и редактировать аннотации;
- управлять классами объектов;
- экспортировать результаты в распространённые форматы;
- работать с проектами через backend API.

## Основные возможности

- Разметка изображений в браузере.
- История действий (undo/redo).
- Управление цветовой палитрой и параметрами отображения температуры.
- Аналитика по датасету.
- Экспорт аннотаций.

## Технологии

- Frontend: Next.js, React.
- Backend: Python, FastAPI, SQLAlchemy.
- Хранение данных: PostgreSQL.
- Контейнеризация: Docker, docker-compose.
- Тестирование: Jest, Pytest.

## Быстрый запуск

1. Установите зависимости frontend:
   ```bash
   npm install
   ```
2. Запустите frontend в режиме разработки:
   ```bash
   npm run dev
   ```
3. Для полного стека используйте Docker:
   ```bash
   docker-compose up --build
   ```

## Полезные команды

```bash
npm run lint
npm test -- --runInBand
```

## Структура проекта

- `pages/` — страницы Next.js и API proxy.
- `components/` — UI-компоненты.
- `lib/` — сервисы и вспомогательные модули frontend.
- `backend/` — серверная часть.
- `docs/` — документация, гайды и отчёты.
- `docs/images/` — скриншоты для README (см. [`docs/images/README.md`](docs/images/README.md)).

## Документация

Подробные материалы находятся в папке `docs/` (начните с `docs/guides/QUICKSTART.md`).

## Навигация по документации

- [Обзор `docs/` и галерея скриншотов](docs/README.md)
- [Быстрый старт](docs/guides/QUICKSTART.md)
- [Руководство по использованию](docs/guides/USING_GUIDE.md)
- [Примеры API](docs/api/API_EXAMPLES.md)
- [Архитектура](docs/ARCHITECTURE.md)
- [Структура репозитория](docs/STRUCTURE.md)
- [Тестирование](docs/TESTING.md)
- [Roadmap](docs/ROADMAP.md)
- [Отчёты](docs/reports/)

## Скриншоты интерфейса

| Аннотация: инструменты, палитра, классы, список объектов | Меню «Сохранённые проекты» |
|:---:|:---:|
| ![Аннотация](docs/images/01-annotation.jpg) | ![Проекты](docs/images/02-projects-modal.jpg) |

| Дамп БД: экспорт/импорт SQL | Аналитика: графики и статистика |
|:---:|:---:|
| ![Дамп БД](docs/images/03-db-dump.jpg) | ![Аналитика](docs/images/04-analytics.jpg) |

| Управление классами | Рабочая область (детали) |
|:---:|:---:|
| ![Классы](docs/images/05-classes.jpg) | ![Детали](docs/images/06-annotation-detail.jpg) |

*Файлы лежат в [`docs/images/`](docs/images/). Подписи к файлам — [`docs/images/README.md`](docs/images/README.md).*
