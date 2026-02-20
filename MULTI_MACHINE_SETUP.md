# Multi-Machine Deployment Setup

Я создал полную систему для бесшовного запуска ThermoLabel с существующей БД на другом компьютере.

## 📊 Что было добавлено

### 1. **Файлы конфигурации**

#### `.env.example`
- Шаблон для всех переменных окружения
- Примеры для локальной разработки и production
- Документированные переменные

#### `docker-compose.external-db.yml`
- Compose файл для подключения к внешней БД
- Без PostgreSQL контейнера (используется внешний)
- Использует переменные из `.env`
- Гибкая конфигурация портов и хостов

### 2. **Документация**

#### `DEPLOYMENT.md` (10+ KB)
Полное руководство с 8 разделами:
- Обзор всех способов запуска
- Пошаговая инструкция для двух компьютеров
- Миграция данных между БД
- Troubleshooting с решениями
- Чек-лист перед развертыванием
- Production рекомендации
- Полезные команды

#### `QUICKSTART.md` (6 KB)
Быстрая справка:
- 3 основных сценария
- Таблицы команд
- Объяснение файлов
- Примеры для разных конфигураций

### 3. **Автоматизированные скрипты**

#### `setup-external-db.sh` (Linux/Mac)
```bash
bash setup-external-db.sh
```
- Проверка Docker/Docker Compose
- Создание .env если не существует
- Тестирование подключения к БД
- Автозапуск сервисов
- Вывод информации о доступе

#### `setup-external-db.bat` (Windows)
```cmd
setup-external-db.bat
```
- То же самое, но для Windows
- PowerShell compatible

## 🚀 Быстрый старт

### Сценарий 1: Локальная разработка (все на одном ПК)

```bash
git clone https://github.com/C0deRonin/ThermoLabel.git
cd ThermoLabel
docker compose up -d
# Готово! Frontend: http://localhost:3000
```

### Сценарий 2: Существующая БД на другом компьютере

**На Computer B (где запускаем приложение):**

```bash
git clone https://github.com/C0deRonin/ThermoLabel.git
cd ThermoLabel

# Вариант A: Автоматический setup
bash setup-external-db.sh        # Linux/Mac
setup-external-db.bat           # Windows

# Вариант B: Ручной setup
cp .env.example .env
# Отредактируйте .env с параметрами вашей БД на Computer A

docker compose -f docker-compose.external-db.yml --env-file .env up -d
```

**На Computer A (где PostgreSQL):**

Убедитесь, что PostgreSQL доступна по сети:
```bash
# Linux
sudo nano /etc/postgresql/15/main/postgresql.conf
# Найти: listen_addresses = '*'

sudo systemctl restart postgresql

# Проверить доступность
psql -h 0.0.0.0 -U thermolabel_user -d thermolabel_db -c "SELECT version();"
```

## 📝 Структура конфигурации

```
.env.example          ← Template (в git)
.env                  ← Ваша конфигурация (gitignored)
                         ↓
docker-compose.yml                ← Локальная разработка с встроенной БД
docker-compose.external-db.yml    ← Подключение к внешней БД
```

## 🔄 Переменные окружения

Создайте `.env` для вашей конфигурации:

```env
# DATABASE_URL для подключения (пример с IP адресом другого компьютера)
DATABASE_URL=postgresql://thermolabel_user:password@192.168.1.100:5432/thermolabel_db

# Или для локального подключения
# DATABASE_URL=postgresql://thermolabel_user:password@postgres:5432/thermolabel_db

# Frontend API (для браузера)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Internal URL (для Docker сети)
BACKEND_INTERNAL_URL=http://thermolabel-backend:8000

# Порты
FRONTEND_PORT=3000
BACKEND_PORT=8000
```

## 🧪 Проверка подключения

Перед запуском проверьте подключение к БД:

```bash
# Docker способ
docker run --rm postgres:15-alpine \
  psql postgresql://user:pass@192.168.1.100:5432/thermolabel_db \
  -c "SELECT version();"

# Или локально
psql postgresql://user:pass@192.168.1.100:5432/thermolabel_db -c "SELECT version();"
```

## 📋 Команды

| Команда | Назначение |
|---------|-----------|
| `docker compose up -d` | Локальная разработка |
| `docker compose -f docker-compose.external-db.yml up -d` | С внешней БД |
| `bash setup-external-db.sh` | Auto setup (Linux/Mac) |
| `docker compose logs -f backend` | Логи backend |
| `docker compose down` | Остановить |

## 🔧 Troubleshooting

### "Connection refused"
- Проверьте IP адрес Computer A: `hostname -I`
- Проверьте файервол: `sudo ufw allow 5432`

### "password authentication failed"
- Проверьте пароль в `.env`
- Убедитесь, что pg_hba.conf содержит:
  ```
  host    all             all             0.0.0.0/0               md5
  ```

### "Backend is unhealthy"
- Проверьте логи: `docker compose logs backend`
- Убедитесь, что DATABASE_URL правильный

## 📦 Pull Requests

Два PR созданы для GitHub:

1. **`fix/docker-backend-frontend-communication`**
   - Исправление 502 ошибок
   - Добавление BACKEND_INTERNAL_URL
   - Фикс Dockerfile

2. **`feat/multi-machine-deployment`** (текущая)
   - Поддержка внешней БД
   - Документация и скрипты
   - Готовые примеры конфигурации

## 🎯 Используйте для

✅ Локальная разработка
✅ Тестирование на разных машинах
✅ Дежурная служба (staging)
✅ Production с отдельным БД сервером
✅ Распределенные команды
✅ CI/CD pipeline

## 📚 Дополнительные ресурсы

- `DEPLOYMENT.md` — Полное руководство (10KB+)
- `QUICKSTART.md` — Быстрая справка
- `docker-compose.external-db.yml` — Production-ready конфиг
- `.env.example` — Все доступные переменные

## ✅ Итоговый чек-лист

- [x] Поддержка подключения к внешней БД
- [x] Автоматизированные скрипты setup
- [x] Полная документация
- [x] Примеры конфигурации
- [x] Troubleshooting раздел
- [x] Поддержка Windows/Linux/Mac
- [x] Миграция данных между БД
- [x] Production-ready решение

---

## Быстрый старт (для нетерпеливых)

```bash
# На Computer B с ThermoLabel
git clone https://github.com/C0deRonin/ThermoLabel.git
cd ThermoLabel
cp .env.example .env

# Отредактируйте .env
nano .env  # или используйте editor по выбору
# Важные переменные:
# DATABASE_URL=postgresql://user:pass@COMPUTER_A_IP:5432/thermolabel_db
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Запустите
docker compose -f docker-compose.external-db.yml --env-file .env up -d

# Проверьте
docker compose -f docker-compose.external-db.yml ps

# Откройте в браузере
# http://localhost:3000
```

**Все готово к использованию!** 🎉
