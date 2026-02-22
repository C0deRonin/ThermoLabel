# Примеры API

Ниже показаны базовые примеры работы с backend API Infralabel.

## Получение списка проектов

```bash
curl -X GET "http://localhost:8000/api/projects"
```

## Создание проекта

```bash
curl -X POST "http://localhost:8000/api/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Тестовый проект",
    "description": "Проект для разметки"
  }'
```

## Получение настроек

```bash
curl -X GET "http://localhost:8000/api/settings"
```

## Обновление настроек

```bash
curl -X PUT "http://localhost:8000/api/settings" \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "dark",
    "language": "ru"
  }'
```

## Примечание

Точные поля запросов и ответов зависят от текущих Pydantic-схем в `backend/app/schemas/`.
