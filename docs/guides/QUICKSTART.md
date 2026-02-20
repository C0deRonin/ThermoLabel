# Быстрый старт — ThermoLabel

Запуск приложения **только через Docker**. Инициализация БД — **только по дампу**.

## 1. Запуск (5 минут)

### Требования

- Docker и Docker Compose
- Git

### Шаги

```bash
git clone https://github.com/C0deRonin/ThermoLabel.git
cd ThermoLabel
docker compose up -d
```

Или используйте скрипты: `./start.sh` (Linux/macOS), `start.bat` (Windows).

Откройте:

- **Приложение:** http://localhost:3000  
- **API:** http://localhost:8000  
- **Документация API:** http://localhost:8000/docs  

Остановка: `docker compose down`.

---

## 2. База данных (перенос по дампу)

Инициализация и перенос данных выполняются **только по дампу**:

- При первом запуске Docker применяются:
  - схема из `backend/init-db.sql`;
  - данные из `database-dump.sql` (если файл лежит в корне проекта).
- Резервная копия и восстановление — скрипты в `scripts/`:
  - `./scripts/db-backup.sh` — создать бэкап;
  - `./scripts/db-restore.sh <путь к .zip или .dump>` — восстановить.

Подробнее: корневой **README.md**, раздел «Инициализация БД: только перенос по дампу».

---

## 3. Тесты перед Pull Request

Перед созданием PR запустите тесты в Docker:

```bash
docker compose up -d
./scripts/run-tests.sh
```

Или вручную:

```bash
docker exec thermolabel-backend pytest tests/ -v --cov
docker exec thermolabel-frontend npm test -- --coverage --watchAll=false
```

---

## 4. Полезные команды

| Действие        | Команда |
|-----------------|--------|
| Запуск         | `docker compose up -d` |
| Остановка      | `docker compose down` |
| Логи           | `docker compose logs -f backend` |
| Тесты          | `./scripts/run-tests.sh` |
| Перезапуск с очисткой портов | `./docker-restart.sh` (Linux/macOS) |

---

Документация: **docs/README.md**, **docs/guides/USING_GUIDE.md**, **docs/TESTING.md**.
