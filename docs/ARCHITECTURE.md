// ARCHITECTURE.md
# Архитектура ThermoLabel

## 📐 Система конструирования (SOLID принципы)

### Single Responsibility Principle (SRP)

Каждый модуль отвечает за одну и только одну ответственность:

```
lib/services/
├── paletteService.js       → управление палитрами (применение, интерполяция)
├── temperatureService.js   → конверсия температур, гистограммы
├── geometryService.js      → пересечения, IoU, полигоны
├── imageService.js         → загрузка, FLIR parsing
├── exportService.js        → сериализация в форматы (YOLO, COCO, VOC)
├── analyticsService.js     → статистика, анализ датасета
└── historyService.js       → управление историей изменений
```

### Open/Closed Principle (OCP)

Модули открыты для расширения, закрыты для изменений:

```javascript
// Легко добавить новую палитру без изменения кода
const PALETTES = {
  // существующие...
  myCustomPalette: [[0,0,0], [255,0,0], ...], // просто добавить!
};
```

### Interface Segregation Principle (ISP)

Компоненты получают только то, что им нужно:

```javascript
// ToolPanel получает только нужные props
<ToolPanel
  tool={tool}
  setTool={setTool}
  palette={palette}
  // ... только инструменты панели
/>

// Analytics получает только данные для аналитики
<Analytics
  annotations={annotations}
  classes={classes}
  W={W}
  H={H}
/>
```

### Dependency Inversion Principle (DIP)

Высокоуровневые компоненты зависят от абстракций, не от деталей:

```javascript
// pages/index.js использует сервисы через интерфейсы
import { exportYOLO, exportCOCO, exportPascalVOC } from "@/lib/services/exportService";
import { rawToTemp, tempToRaw, getAreaStats } from "@/lib/services/temperatureService";
// Компонент не знает как именно реализована логика
```

---

## 🏗️ Слойная архитектура

```
┌─────────────────────────────────────────────┐
│         UI層 (React Components)             │
│  ToolPanel | AnnotationPanel | Analytics   │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│      Application層 (pages/index.js)          │
│  Logic, State Management, Event Handling    │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│      Services層 (lib/services/)             │
│  PaletteService, TemperatureService, etc   │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│    Data層 (localStorage, API Backend)       │
└─────────────────────────────────────────────┘
```

---

## 📱 Структура данных

### Аннотация (Annotation)

```javascript
{
  id: 1234567890,           // Unique identifier (timestamp)
  type: "bbox" | "polygon", // Тип аннотации
  
  // Для bbox:
  x: Number,                // Левая координата
  y: Number,                // Верхняя координата
  w: Number,                // Ширина
  h: Number,                // Высота
  
  // Для polygon:
  points: [{x: Number, y: Number}, ...],
  
  cls: {                     // Класс объекта
    id: Number,
    name: String,
    color: String,           // HEX цвет (#ff3030)
    tempMin: Number,
    tempMax: Number,
  },
  
  tempStats: {               // Температурная статистика
    mean: Number,            // Средняя температура
    max: Number,             // Максимум
    min: Number,             // Минимум
  }
}
```

### Класс (Class)

```javascript
{
  id: Number,               // 1-based
  name: String,             // Название ("Перегрев")
  color: String,            // HEX цвет (#ff3030)
  tempMin: Number,          // Минимальная рекомендуемая температура
  tempMax: Number,          // Максимальная рекомендуемая температура
}
```

### Сырые тепловые данные (Raw Data)

```javascript
// Uint8ClampedArray в формате RGBA
// Значения 0-255 соответствуют -20°C до +120°C

const raw = new Uint8ClampedArray(width * height * 4);
// [R, G, B, A, R, G, B, A, ...]
// 
// При применении палитры:
// gray = raw[i]
// temperature = -20 + (gray / 255) * 140
```

---

## 🔄 Поток данных

### Загрузка и визуализация

```
File Upload
    ↓
loadImageAsGrayscale()
    ↓
Uint8ClampedArray (raw)
    ↓
applyPalette(raw, palette)
    ↓
ImageData
    ↓
canvas.putImageData()
    ↓
Видимое изображение
```

### Создание аннотации (Bbox)

```
Mouse Down
    ↓
getPos() → {x, y}
    ↓
setIsDrawing(true), setDrawStart(pos)
    ↓
Mouse Drag
    ↓
setDrawCur(pos) → renderOverlay() → Live preview
    ↓
Mouse Up
    ↓
getAreaStats(raw, W, x, y, w, h) → {mean, max, min}
    ↓
createAnnotation({type: "bbox", ...stats})
    ↓
setAnnotations([...]) → trigger re-renders
    ↓
State updated
```

### Экспорт

```
annotations[], classes[], W, H
    ↓
exportYOLO()/exportCOCO()/exportPascalVOC()
    ↓
formatted string/JSON
    ↓
downloadFile() → blob creation
    ↓
User downloads file
```

---

## ⚡ Оптимизации производительности

### Canvas Rendering

```javascript
// Используем RAF для batch updates
useCallback(() => {
  // все рисование в одном вызове renderer
  renderImage();  // основное изображение
  renderOverlay();  // аннотации
  renderHeatmap();  // тепловая карта (если включена)
}, [dependencies]);
```

### State Management

```javascript
// Отдельные состояния для отдельных батонов
const [tool, setTool] = useState("bbox");      // быстро изменяется
const [annotations, setAnnotations] = useState([]); // основные данные
const [polyPts, setPolyPts] = useState([]);    // временное состояние
```

### Отложенно (Deferred) обновления

```javascript
// После загрузки файла отложим обновление UI
await loadImageAsGrayscale(file);
setLoaded(false);
setTimeout(() => setLoaded(true), 10);  // Дает браузеру время для перерисовки
```

---

## 🔌 API Backend Интеграция

### Структура запроса

```javascript
POST /api/detect-anomalies
{
  "annotations": [
    {
      "tempStats": {"mean": 25.0, "max": 30.0, "min": 20.0}
    },
    // ...
  ]
}

// Ответ
{
  "anomalies": [
    {"index": 5, "temperature": 85.0, "z_score": 2.5, "deviation": "high"}
  ],
  "mean_temperature": 45.2,
  "std_deviation": 12.3
}
```

### CORS Configuration

```javascript
// backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  // для development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📈 Масштабируемость

### Текущие ограничения

- **Canvas размер**: обычно не > 4K (3840x2160)
- **Аннотации**: оптимально < 1000 на изображении
- **История**: 50 уровней undo максимум (configurable)

### Для будущего расширения

```
// Планы:
- WebWorkers для тяжелых вычислений
- Virtual scrolling для больших списков аннотаций
- IndexedDB для хранения больших датасетов
- Streaming API для обработки больших FLIR файлов
```

---

## 🔐 Безопасность

### Что защищено

- ✅ XSS: использование React (auto-escaping)
- ✅ JSON.parse: безопасен для localStorage
- ✅ File uploads: проверка расширений файлов

### Что требует внимания

- ⚠️ Backend CORS: настроить для production
- ⚠️ Data validation: добавить на backend
- ⚠️ File size limits: реализовать

---

## 🧪 Тестирование

### Unit тесты (будущее)

```
lib/services/__tests__/
├── temperatureService.test.js
├── geometryService.test.js
├── paletteService.test.js
└── analyticsService.test.js
```

### Integration тесты

```
__tests__/
├── e2e/
│   ├── annotation.test.js
│   ├── export.test.js
│   └── analytics.test.js
```

---

## 📊 Метрики производительности

### Целевые значения

```
Rendering:
- Initial load: < 500ms ✓
- Palette switch: < 16ms ✓
- Canvas redraw (60fps): < 16.67ms ✓
- Overlay render: < 10ms ✓

Analytics:
- Compute stats: < 50ms ✓
- Find anomalies: < 100ms ✓
- Duplicate detection: < 500ms (требует оптимизации)
```

---

## 🚀 Deployment стратегия

### Development
```bash
npm run dev  # Next.js dev server с HMR
```

### Production
```bash
npm run build  # Static export
npm start      # Production server
```

### Docker
```dockerfile
# Фронтенд
FROM node:18-alpine
RUN npm run build
EXPOSE 3000

# Backend
FROM python:3.9-slim
RUN pip install -r requirements.txt
EXPOSE 8000
```

---

**Architecture Version**: 2.0.0  
**Last Updated**: 2024
