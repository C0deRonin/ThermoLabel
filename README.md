# ThermoLabel - Thermal Image Annotation Tool

**Stable v1.0.0**

Приложение для аннотирования тепловых изображений. **Запуск только через Docker.** Инициализация и перенос данных — **только по дампу** (SQL/бинарный дамп PostgreSQL).

## Требования

- Docker
- Docker Compose
- Git

## Быстрый старт

1. **Клонировать репозиторий**
   ```bash
   git clone https://github.com/C0deRonin/ThermoLabel.git
   cd ThermoLabel
   ```

2. **Подготовить дамп БД (опционально)**
   - Положите файл `database-dump.sql` в корень проекта — он будет применён при первом запуске контейнера БД.
   - Или после запуска создайте дамп: см. раздел «Резервное копирование и восстановление».

3. **Запустить все сервисы (единственный способ запуска)**
   ```bash
   docker compose up -d
   ```
   Или на Windows: `.\start.bat`; на Linux/macOS: `./start.sh`.

4. **Открыть приложение**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Документация API: http://localhost:8000/docs

5. **Остановить**
   ```bash
   docker compose down
   ```

---

## Инициализация БД: только перенос по дампу

Используется **один способ** инициализации и переноса данных — **по дампу**:

1. **При первом запуске Docker**
   - Создаётся БД PostgreSQL.
   - Применяется схема из `backend/init-db.sql` (монтируется в `docker-entrypoint-initdb.d/01-schema.sql`).
   - Применяется дамп данных из `database-dump.sql` (монтируется в `docker-entrypoint-initdb.d/02-data.sql`), если файл есть в корне проекта.

2. **Восстановление из существующего дампа**
   - Положите ваш `database-dump.sql` в корень проекта (или используйте бинарный дамп — см. скрипты ниже).
   - Для «чистого» старта удалите volume БД и снова запустите: `docker compose down -v && docker compose up -d`.

Других способов инициализации БД (миграции Alembic, скрипты вне Docker) в проекте не предусмотрено.

---

## Резервное копирование и восстановление (по дампу)

### Создать бэкап (бинарный дамп)

```bash
./scripts/db-backup.sh
# Создаётся ./backups/thermolabel_YYYYMMDD_HHMMSS.zip
```

### Восстановить из дампа

```bash
./scripts/db-restore.sh /path/to/thermolabel_YYYYMMDD_HHMMSS.zip
# или
./scripts/db-restore.sh /path/to/file.dump
```

Создание SQL-дампа вручную (для `database-dump.sql`):

```bash
docker exec thermolabel-db pg_dump -U thermolabel_user -d thermolabel_db > database-dump.sql
```

---

## Просмотр данных в БД

Чтобы убедиться, что экспорты (YOLO/COCO/Pascal VOC) и другие данные сохранены в БД, можно подключиться к PostgreSQL и выполнить запросы.

**Подключение к БД (psql в контейнере):**

```bash
docker exec -it thermolabel-db psql -U thermolabel_user -d thermolabel_db
```

**Примеры запросов:**

```sql
-- Список проектов
SELECT id, name, created_at, updated_at FROM projects ORDER BY updated_at DESC;

-- Сохранённые экспорты (YOLO/COCO/VOC) по проектам
SELECT project_id, format, length(content) AS content_length, created_at
FROM project_exports
ORDER BY project_id, format;

-- Настройки приложения
SELECT key, value FROM app_settings;
```

Выход из psql: `\q`.

---

## Тесты перед Pull Request

Перед созданием pull request необходимо выполнить тесты. Запуск **только в Docker**:

```bash
# Backend (pytest)
docker exec thermolabel-backend pytest tests/ -v --cov

# Frontend (Jest) — в контейнере frontend или локально при уже поднятом стеке
docker exec thermolabel-frontend npm test -- --coverage --watchAll=false
```

Или одной командой (после `docker compose up -d`):

```bash
./scripts/run-tests.sh
```

Если скрипт отсутствует, выполните обе команды `docker exec` выше по очереди.

---

## Сервисы

| Сервис   | Порт | Назначение        |
|----------|------|-------------------|
| Frontend | 3000 | Next.js приложение |
| Backend  | 8000 | FastAPI REST API  |
| Database | 5432 | PostgreSQL        |

---

## API Endpoints

### Health & Info
- `GET /api/health` - Health check
- `GET /api/supported-formats` - Get supported file formats

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects` - Create/update project
- `DELETE /api/projects/{id}` - Delete project
- `GET /api/projects/{id}/exports` - List saved exports (YOLO/COCO/VOC) for project
- `GET /api/projects/{id}/exports/{format}` - Download saved export (format: yolo, coco, voc)
- `POST /api/projects/{id}/exports` - Save export to DB (body: `{ "format", "content" }`)

### Settings
- `GET /api/settings/classes` - Get class definitions
- `PUT /api/settings/classes` - Update class definitions

### Analysis
- `POST /api/detect-anomalies` - Detect temperature anomalies
- `POST /api/validate-annotations` - Validate annotations
- `POST /api/process-flir` - Process FLIR thermal image

---

## Разработка

### Логи

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Доступ к БД

```bash
docker exec -it thermolabel-db psql -U thermolabel_user -d thermolabel_db
```

---

## Структура проекта

```
ThermoLabel/
├── backend/
│   ├── app/
│   │   ├── api/              # Маршруты API (Presentation)
│   │   ├── core/             # Конфиг, БД, исключения
│   │   ├── models/           # Модели SQLAlchemy
│   │   ├── schemas/          # Схемы Pydantic
│   │   ├── services/         # Бизнес-логика
│   │   ├── repositories/     # Доступ к данным
│   │   └── __init__.py
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── init-db.sql           # Схема БД (для Docker init по дампу)
│   └── main.py
├── pages/, components/, lib/ # Next.js frontend
├── scripts/
│   ├── db-backup.sh          # Бэкап по дампу
│   ├── db-restore.sh         # Восстановление по дампу
│   └── run-tests.sh          # Тесты перед PR
├── docker-compose.yml
├── database-dump.sql         # Данные БД (опционально)
└── README.md
```

---

## Architecture

### Backend (FastAPI + SOLID Principles)

```
Routes (API) → Services (Business Logic) → Repositories (Data Access) → Database
```

**SOLID Implementation:**
- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Repositories are open for extension
- **Liskov Substitution**: Base repository can be replaced by subclasses
- **Interface Segregation**: Interfaces are specific to client needs
- **Dependency Inversion**: Services depend on abstractions (repositories)

### Database Schema

- `projects` — проекты (изображения, аннотации, классы)
- `app_settings` — настройки приложения (классы и др.)
- `project_exports` — сохранённые экспорты YOLO/COCO/Pascal VOC по проектам

---

## Environment Variables

Backend uses environment from docker-compose.yml:

```env
DATABASE_URL=postgresql://thermolabel_user:thermolabel_password@postgres:5432/thermolabel_db
DEBUG=false
```

---

## Troubleshooting

### Port Already in Use

```bash
# Change ports in docker-compose.yml
# Or stop conflicting services:
docker compose down
```

### Database Connection Issues

```bash
# Check database logs
docker compose logs postgres

# Test connection
docker exec thermolabel-db pg_isready
```

### Container Exited

```bash
# View error logs
docker compose logs backend
docker compose logs frontend

# Restart services
docker compose restart
```

---

## Performance Tips

1. **Use PostgreSQL backups** for data preservation
2. **Monitor resource usage**: `docker stats`
3. **Enable production mode** by setting `NODE_ENV=production` in docker-compose.yml
4. **Use named volumes** for database persistence

---

## Support

For issues and questions, please create an issue on GitHub:
https://github.com/C0deRonin/ThermoLabel/issues
