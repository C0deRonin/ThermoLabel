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

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/api/health')"

# Run app
CMD ["python", "main.py"]
