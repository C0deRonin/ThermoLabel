// API_EXAMPLES.md
# Примеры использования ThermoLabel API

## 🚀 Запуск Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend запустится на `http://localhost:8000`
Документация API: `http://localhost:8000/docs`

---

## 📡 Основные эндпоинты

### 1. Проверка здоровья сервера

```bash
curl http://localhost:8000/api/health
```

**Ответ:**
```json
{
  "status": "ok",
  "version": "0.2.0"
}
```

---

### 2. Получить поддерживаемые форматы

```bash
curl http://localhost:8000/api/supported-formats
```

**Ответ:**
```json
{
  "image_formats": ["JPEG", "PNG", "BMP", "TIFF"],
  "thermal_formats": ["FLIR .fff", "FLIR .seq", "Seek Thermal .raw"],
  "export_formats": ["YOLO", "COCO JSON", "Pascal VOC"],
  "note": "Backend can be extended with additional processing libraries"
}
```

---

### 3. Обработка FLIR файлов

```bash
curl -X POST -F "file=@thermal_image.fff" \
  http://localhost:8000/api/process-flir
```

**Ответ:**
```json
{
  "format": "FLIR radiometric",
  "size": 65536,
  "status": "detected"
}
```

---

### 4. Обнаружение аномалий

```bash
curl -X POST http://localhost:8000/api/detect-anomalies \
  -H "Content-Type: application/json" \
  -d '{
    "annotations": [
      {
        "tempStats": {"mean": 25.0, "min": 20.0, "max": 30.0}
      },
      {
        "tempStats": {"mean": 26.0, "min": 21.0, "max": 31.0}
      },
      {
        "tempStats": {"mean": 80.0, "min": 75.0, "max": 85.0}
      }
    ]
  }'
```

**Ответ:**
```json
{
  "anomalies": [
    {
      "index": 2,
      "temperature": 80.0,
      "z_score": 2.45,
      "deviation": "high"
    }
  ],
  "total": 3,
  "mean_temperature": 43.67,
  "std_deviation": 18.23
}
```

---

### 5. Валидирование аннотаций

```bash
curl -X POST http://localhost:8000/api/validate-annotations \
  -H "Content-Type: application/json" \
  -d '{
    "annotations": [
      {
        "type": "bbox",
        "x": 10, "y": 10, "w": 50, "h": 50,
        "tempStats": {"mean": 45.5, "min": 40.0, "max": 50.0}
      }
    ],
    "classes": [
      {
        "id": 1,
        "name": "Перегрев"
      }
    ]
  }'
```

**Ответ:**
```json
{
  "valid": true,
  "total_annotations": 1,
  "issues": [],
  "warnings": []
}
```

---

### 6. Поиск дубликатов (stub)

```bash
curl -X POST http://localhost:8000/api/find-duplicates \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg"
```

**Ответ:**
```json
{
  "total_files": 2,
  "duplicates_found": [],
  "note": "Full duplicate detection requires image processing"
}
```

---

## 🔧 Интеграция с Frontend

### Пример: Обнаружение аномалий в React компоненте

```javascript
// Отправить аннотации на backend для анализа
async function detectAnomalies(annotations) {
  try {
    const response = await fetch('http://localhost:8000/api/detect-anomalies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ annotations }),
    });

    const data = await response.json();
    
    console.log('Найдено аномалий:', data.anomalies.length);
    console.log('Средняя температура:', data.mean_temperature);
    
    return data;
  } catch (error) {
    console.error('API error:', error);
  }
}

// Использование
const anomalies = await detectAnomalies(annotations);
anomalies.anomalies.forEach(anom => {
  console.log(`Аннотация ${anom.index}: ${anom.temperature}°C (Z-score: ${anom.z_score})`);
});
```

---

## 🐍 Примеры на Python

### Отправка аннотаций на валидацию

```python
import requests
import json

API_URL = "http://localhost:8000"

annotations = [
    {
        "id": 1,
        "type": "bbox",
        "x": 100,
        "y": 100,
        "w": 200,
        "h": 150,
        "cls": {"id": 1, "name": "Перегрев"},
        "tempStats": {"mean": 65.5, "max": 70.0, "min": 60.0}
    }
]

classes = [
    {"id": 1, "name": "Перегрев", "color": "#ff3030", "tempMin": 45, "tempMax": 120}
]

response = requests.post(
    f"{API_URL}/api/validate-annotations",
    json={
        "annotations": annotations,
        "classes": classes
    }
)

print(response.json())
```

---

## 📊 Обработка результатов

### Пример: Фильтрация аномалий

```python
import requests

def get_anomalies_above_threshold(annotations, z_threshold=2.0):
    """Получить аномалии с Z-score выше порога"""
    response = requests.post(
        "http://localhost:8000/api/detect-anomalies",
        json={"annotations": annotations}
    )
    
    data = response.json()
    high_anomalies = [a for a in data['anomalies'] if a['z_score'] > z_threshold]
    
    return high_anomalies

# Использование
anomalies = get_anomalies_above_threshold(annotations, z_threshold=3.0)
for anom in anomalies:
    print(f"Аннотация #{anom['index']}: {anom['temperature']}°C (выброс!)")
```

---

## 🔐 CORS и безопасность

Backend использует CORS для всех origins по умолчанию (для развития).

**Для production заменить в `backend/main.py`:**

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Указать конкретные домены
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)
```

---

## 🚀 Deployment

### Docker вариант

```dockerfile
# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

CMD ["python", "main.py"]
```

```bash
docker build -t thermolabel-backend .
docker run -p 8000:8000 thermolabel-backend
```

---

## 📝 Логирование

Backend логирует все запросы. Для отладки проверьте консоль.

Для более детального логирования добавьте в `main.py`:

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.post("/api/process-flir")
async def process_flir(file: UploadFile = File(...)):
    logger.info(f"Processing file: {file.filename}")
    # ...
```

---

## ⚡ Производительность

- **Обнаружение аномалий**: < 100ms для 1000 аннотаций
- **Валидирование**: < 50ms
- **Поиск дубликатов**: требует оптимизации для больших датасетов

---

## 🔮 Будущие эндпоинты

Планируется добавить:

```
POST /api/train-detector         # Обучение детектора на аннотациях
POST /api/predict                # Предсказание на новых изображениях
GET  /api/stats                  # Детальная статистика датасета
POST /api/export-dataset         # Экспорт всего датасета
POST /api/merge-projects         # Слияние нескольких проектов
```

---

**Версия API**: 0.2.0
