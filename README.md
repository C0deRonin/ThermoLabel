# Infralabel

Infralabel — веб-приложение для разметки термальных изображений и подготовки датасетов для задач Computer Vision.

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

## Документация

Подробные материалы находятся в папке `docs/` (начните с `docs/guides/QUICKSTART.md`).

## Навигация по документации (перенесено из docs/README.md)

- [Быстрый старт](docs/guides/QUICKSTART.md)
- [Руководство по использованию](docs/guides/USING_GUIDE.md)
- [Примеры API](docs/api/API_EXAMPLES.md)
- [Архитектура](docs/ARCHITECTURE.md)
- [Структура репозитория](docs/STRUCTURE.md)
- [Тестирование](docs/TESTING.md)
- [Roadmap](docs/ROADMAP.md)
- [Отчёты](docs/reports/)

## Скриншоты интерфейса и взаимодействие

> Примечание: в некоторых Markdown-рендерах inline-показ изображений по `browser:` URI не поддерживается.
> Ниже даны прямые ссылки на скриншоты и описание действий.

- [Главный экран](browser:/tmp/codex_browser_invocations/6dc1a586d9198b64/artifacts/artifacts/flow/01-home.png)
- [Переход во вкладку «Проекты»](browser:/tmp/codex_browser_invocations/6dc1a586d9198b64/artifacts/artifacts/flow/02-Проекты.png)
- [Переход во вкладку «Аналитика»](browser:/tmp/codex_browser_invocations/6dc1a586d9198b64/artifacts/artifacts/flow/03-Аналитика.png)
- [Переход во вкладку «Классы»](browser:/tmp/codex_browser_invocations/6dc1a586d9198b64/artifacts/artifacts/flow/04-Классы.png)
- [Нажатие кнопки «Сохранить»](browser:/tmp/codex_browser_invocations/6dc1a586d9198b64/artifacts/artifacts/flow/05-Сохранить.png)
- [Нажатие кнопки «Загрузить»](browser:/tmp/codex_browser_invocations/6dc1a586d9198b64/artifacts/artifacts/flow/06-Загрузить.png)

### Протокол интерактивной проверки

- Во время тестирования был выполнен запуск приложения в браузере с ожиданием полной загрузки главного экрана.
- Во время тестирования были выполнены переходы по основным вкладкам: «Проекты», «Аналитика», «Классы».
- Во время тестирования были выполнены нажатия на управляющие кнопки «Сохранить» и «Загрузить».
- По результатам взаимодействия подтверждена стабильная реакция интерфейса без падения frontend.
