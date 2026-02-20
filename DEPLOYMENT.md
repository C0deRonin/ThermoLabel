# ThermoLabel Deployment Guide

## Overview

ThermoLabel можно запустить несколькими способами:
1. **Local Development** — с встроенной PostgreSQL (для разработки)
2. **External Database** — с подключением к существующей БД на другом компьютере/сервере
3. **Production** — со всеми оптимизациями для production

---

## 1. Локальная разработка (с встроенной БД)

### Требования
- Docker & Docker Compose
- Git

### Установка

```bash
git clone https://github.com/C0deRonin/ThermoLabel.git
cd ThermoLabel
docker compose up -d
```

**Доступ:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Database: localhost:5432

**Остановка:**
```bash
docker compose down
```

---

## 2. Запуск с существующей БД (другой компьютер)

### Сценарий
Вы уже имеете PostgreSQL базу на сервере/компьютере A, и хотите запустить ThermoLabel на компьютере B.

### Требования
- Docker & Docker Compose на компьютере B
- Доступная PostgreSQL база на компьютере A
- Сетевое соединение между компьютерами A и B

### Шаг 1: Подготовка на компьютере с БД (Computer A)

#### Вариант A: Если БД уже работает в Docker

Проверьте, что контейнер с PostgreSQL доступен по сети:

```bash
# На компьютере A
docker ps | grep postgres

# Проверьте IP адрес контейнера или используйте имя сервиса
docker inspect <container_id> | grep IPAddress
```

#### Вариант B: Если БД работает на хосте

Убедитесь, что PostgreSQL слушает все интерфейсы (0.0.0.0):

```bash
# Проверьте postgresql.conf
sudo cat /etc/postgresql/15/main/postgresql.conf | grep listen_addresses

# Должно быть: listen_addresses = '*'
# Если нет, отредактируйте и перезагрузите PostgreSQL

sudo systemctl restart postgresql

# Проверьте доступность
psql -h <IP_ADDRESS_OF_COMPUTER_A> -U thermolabel_user -d thermolabel_db -c "SELECT version();"
```

---

### Шаг 2: Настройка на компьютере B (где запускаем ThermoLabel)

#### 2.1 Клонируйте репозиторий

```bash
git clone https://github.com/C0deRonin/ThermoLabel.git
cd ThermoLabel
```

#### 2.2 Создайте файл .env

```bash
cp .env.example .env
```

Отредактируйте `.env` с параметрами вашей БД:

```bash
# .env

# Database connection (укажите IP адрес Computer A)
DATABASE_URL=postgresql://thermolabel_user:thermolabel_password@192.168.1.100:5432/thermolabel_db
DB_HOST=192.168.1.100
DB_PORT=5432
DB_NAME=thermolabel_db
DB_USER=thermolabel_user
DB_PASSWORD=thermolabel_password

# Frontend API
NEXT_PUBLIC_API_URL=http://192.168.1.200:8000  # IP Computer B или localhost если локально
BACKEND_INTERNAL_URL=http://thermolabel-backend:8000

# Application
NODE_ENV=development
DEBUG=false
RUNNING_IN_DOCKER=1

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

**Важно:** Замените IP адреса на реальные:
- `192.168.1.100` — IP адрес Computer A (где БД)
- `192.168.1.200` — IP адрес Computer B (где запускаем приложение) или `localhost`

#### 2.3 Проверьте подключение к БД

```bash
# Убедитесь, что Computer B может достучаться до БД на Computer A
docker run --rm postgres:15-alpine \
  psql -h 192.168.1.100 -U thermolabel_user -d thermolabel_db -c "SELECT version();"

# Должно вывести версию PostgreSQL
```

#### 2.4 Запустите ThermoLabel с внешней БД

```bash
docker compose -f docker-compose.external-db.yml --env-file .env up -d
```

**Проверка статуса:**

```bash
docker compose -f docker-compose.external-db.yml ps
```

**Логи:**

```bash
docker compose -f docker-compose.external-db.yml logs -f backend
docker compose -f docker-compose.external-db.yml logs -f frontend
```

#### 2.5 Доступ к приложению

- Frontend: http://192.168.1.200:3000 (или http://localhost:3000 локально)
- Backend API: http://192.168.1.200:8000

#### 2.6 Остановка

```bash
docker compose -f docker-compose.external-db.yml down
```

---

## 3. Миграция данных между компьютерами

### Если вы хотите перенести данные со старой БД на новую

#### Экспортирование БД (Computer A)

```bash
# Создайте dump текущей БД
pg_dump -h localhost -U thermolabel_user -d thermolabel_db > thermolabel_backup.sql

# Или через Docker контейнер
docker exec <postgres_container_id> pg_dump -U thermolabel_user -d thermolabel_db > thermolabel_backup.sql
```

#### Импортирование на новый сервер (Computer B)

```bash
# Если у вас уже есть пустая БД
psql -h 192.168.1.100 -U thermolabel_user -d thermolabel_db < thermolabel_backup.sql

# Или через Docker
docker exec <postgres_container_id> psql -U thermolabel_user -d thermolabel_db < thermolabel_backup.sql
```

---

## 4. Troubleshooting

### Проблема: "Connection refused"

```
ERROR: could not connect to server: Connection refused
```

**Решение:**
1. Проверьте IP адрес Computer A:
   ```bash
   # На Computer A
   hostname -I
   ```

2. Проверьте файервол:
   ```bash
   # На Computer A (разрешить порт 5432)
   sudo ufw allow 5432/tcp
   ```

3. Проверьте postgresql.conf:
   ```bash
   sudo cat /etc/postgresql/15/main/postgresql.conf | grep listen_addresses
   # Должно быть: listen_addresses = '*'
   ```

### Проблема: "password authentication failed"

```
FATAL: password authentication failed for user "thermolabel_user"
```

**Решение:**
1. Проверьте пароль в `.env` файле
2. Проверьте pg_hba.conf на Computer A:
   ```bash
   sudo cat /etc/postgresql/15/main/pg_hba.conf | grep -A 5 "host"
   ```
   Должна быть строка вроде:
   ```
   host    all             all             0.0.0.0/0               md5
   ```

### Проблема: Frontend не может достичь Backend

```
GET /api/proxy/projects 502 Bad Gateway
```

**Решение:**
- Проверьте, что `BACKEND_INTERNAL_URL` указывает на `http://thermolabel-backend:8000` (внутри Docker сети)
- Проверьте, что Backend контейнер запущен:
  ```bash
  docker compose -f docker-compose.external-db.yml ps
  ```

### Проблема: "no such file or directory"

```
Error: Could not find postgres data directory
```

**Решение:**
- При использовании `docker-compose.external-db.yml` БД предполагается внешней
- Не нужно создавать локальные volumes для PostgreSQL
- Просто убедитесь, что `.env` содержит правильный `DATABASE_URL`

---

## 5. Чек-лист для развертывания

- [ ] PostgreSQL доступна на Computer A
- [ ] Сетевое соединение между Computer A и B (ping -c 1 192.168.1.100)
- [ ] Docker & Docker Compose установлены на Computer B
- [ ] `.env` файл создан с правильными IP адресами
- [ ] Подключение к БД проверено (`docker run ... psql ...`)
- [ ] `docker compose -f docker-compose.external-db.yml up -d` запущен
- [ ] Frontend доступен на http://localhost:3000
- [ ] Backend доступен на http://localhost:8000/api/health (200 OK)
- [ ] Тестовый проект создан и сохранен в БД

---

## 6. Команды для быстрого запуска

### Локальная разработка
```bash
docker compose up -d
```

### С внешней БД
```bash
# Сначала создайте .env
cp .env.example .env
# Отредактируйте .env

# Запустите
docker compose -f docker-compose.external-db.yml --env-file .env up -d
```

### Просмотр логов
```bash
docker compose logs -f
# или с внешней БД
docker compose -f docker-compose.external-db.yml logs -f
```

### Остановка
```bash
docker compose down
# или с внешней БД
docker compose -f docker-compose.external-db.yml down
```

### Перестройка контейнеров
```bash
docker compose up -d --build
# или с внешней БД
docker compose -f docker-compose.external-db.yml up -d --build
```

---

## 7. Производство (Production)

Для production развертывания рекомендуется:

1. Использовать environment variables вместо `.env` файла
2. Отключить hot-reload в Backend/Frontend
3. Использовать production версию Next.js (`npm run build && npm start`)
4. Добавить SSL/TLS сертификаты
5. Использовать reverse proxy (nginx)
6. Настроить логирование и мониторинг

Создайте `docker-compose.prod.yml` на основе `docker-compose.external-db.yml` с этими изменениями.

---

## 8. Дополнительные ресурсы

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect-string.html)
- [Next.js Deployment](https://nextjs.org/docs/deployment/docker)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
