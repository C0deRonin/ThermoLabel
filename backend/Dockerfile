# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Установить системные зависимости
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Копировать requirements
COPY requirements.txt .

# Установить зависимости Python
RUN pip install --no-cache-dir -r requirements.txt

# Копировать код
COPY . .

# Expose порт
EXPOSE 8000

# Run app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
