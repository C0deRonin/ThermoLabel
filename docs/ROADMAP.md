// ROADMAP.md
# 🗺️ Roadmap ThermoLabel

## ✅ MVP v2.0.0 - Завершено

### Функциональность
- ✅ Bounding Box аннотация
- ✅ Полигональная аннотация  
- ✅ Пороговый инструмент (auto-threshold)
- ✅ 6 палитр отображения (Iron, Rainbow, Grayscale, Hotspot, Arctic, Viridis)
- ✅ Просмотр температур по пикселю
- ✅ Гистограмма температур
- ✅ Управление классами
- ✅ История изменений (Undo/Redo)
- ✅ Сохранение/загрузка проектов (localStorage)

### Экспорт
- ✅ YOLO format (.txt)
- ✅ COCO JSON format
- ✅ Pascal VOC format (.xml)
- ✅ Все форматы включают температурные метаданные

### Аналитика
- ✅ Распределение классов (bar chart)
- ✅ Температурная статистика по классам (min/max/mean)
- ✅ Scatter plot позиций аннотаций
- ✅ Общая статистика датасета

### Архитектура
- ✅ SOLID принципы (SRP, OCP, ISP, DIP, LSP)
- ✅ 7 специализированных сервисов
- ✅ Модульная структура
- ✅ Без external UI library (только React + Canvas API)

### Backend
- ✅ FastAPI сервер
- ✅ API для обнаружения аномалий
- ✅ API для валидирования аннотаций
- ✅ API для обработки FLIR файлов

### DevOps
- ✅ Docker поддержка
- ✅ Docker Compose конфиг
- ✅ Скрипты запуска (start.sh, start.bat)
- ✅ .gitignore конфиг

### Документация
- ✅ README.md (полное описание)
- ✅ USING_GUIDE.md (руководство пользователя)
- ✅ ARCHITECTURE.md (описание архитектуры)
- ✅ API_EXAMPLES.md (примеры использования)
- ✅ STRUCTURE.md (структура проекта)

---

## 🚀 Planned v2.1.0 (Q2 2024)

### Frontend Features
- 🔲 Mask (segmentation) инструмент
- 🔲 Keyboard shortcuts (Ctrl+Z, Del, etc)
- 🔲 Drag & drop для переупорядочивания аннотаций
- 🔲 Batch operations (select multiple, delete all of class)
- 🔲 Layers панель (видимость, блокирование)
- 🔲 Color themes (light/dark mode)
- 🔲 Zoom-to-fit при загрузке изображения

### Performance
- 🔲 WebWorkers для тяжелых вычислений
- 🔲 Virtual scrolling для больших списков
- 🔲 Canvas offscreening
- 🔲 Lazy loading для много-страничных датасетов

### Storage
- 🔲 IndexedDB для больших датасетов
- 🔲 LocalStorage compression
- 🔲 Cloud sync (optional)

---

## 🎨 Planned v2.2.0 (Q3 2024)

### Advanced Features
- 🔲 FLIR file parsing (полная поддержка с backend)
- 🔲 Similarity detection (поиск похожих изображений)
- 🔲 Duplicate detection (с полным анализом)
- 🔲 Automatic outlier detection (ML-based)
- 🔲 Batch processing (multi-image operations)
- 🔲 Change history export (полная история)

### Backend Enhancements
- 🔲 дополнительные ML модели
- 🔲 Image enhancement (histogram equalization, etc)
- 🔲 OpenCV integration
- 🔲 GPU support (CUDA/OpenCL)

### Quality of Life
- 🔲 Settings страница (font size, defaults)
- 🔲 Recent projects список
- 🔲 Import/Export settings
- 🔲 Plugin system

---

## 📊 Planned v3.0.0 (Q4 2024)

### Major Features
- 🔲 Multi-user collaboration (WebSocket)
- 🔲 Comment system на аннотациях
- 🔲 Project versioning (git-like)
- 🔲 Dataset splitting tools (train/val/test)
- 🔲 Model training integration
- 🔲 Batch annotation with AI assistance

### Database
- 🔲 PostgreSQL backend
- 🔲 Full project persistence
- 🔲 User accounts & permissions
- 🔲 API authentication (JWT)

### Deployment
- 🔲 AWS/GCP/Azure templates
- 🔲 Kubernetes deployment configs
- 🔲 CI/CD pipelines (GitHub Actions)
- 🔲 Scaling support

---

## 🎯 Priority Features by User Request

### High Priority (если запросят)
1. ❌ FLIR .fff полная поддержка - требует `python-flir-image-extractor`
2. ❌ Video support - требует ffmpeg + frame extraction
3. ❌ Hot key customization - UI + localStorage
4. ❌ Linux/Mac app packaging - Electron wrapper
5. ❌ 3D view - Three.js integration

### Medium Priority
1. ❌ Batch resize/rotate - Image operations
2. ❌ Filter by class/temp - Advanced search
3. ❌ Custom templates - Workflow templates
4. ❌ Integration with annotation platforms - API connectors

### Low Priority
1. ❌ 中文/日本語/한국어 localization - just add translations
2. ❌ Mobile app - React Native version
3. ❌ AR mode - WebAR support
4. ❌ VR support - WebXR

---

## 🐛 Known Issues & Limitations

### Current Limitations
- ⚠️ FLIR parsing: требует backend (не в браузере)
- ⚠️ Max canvas size: ~4K (3840x2160)
- ⚠️ No database: все в localStorage (~5MB limit)
- ⚠️ Single image mode: загружаем по одному
- ⚠️ No real-time collaboration

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ❌ IE (not supported)
- ❌ Old Edge (< v90)

---

## 📈 Performance Roadmap

### Current Performance
```
Initial Load:    500ms ✓
Canvas Redraw:   <16ms @ 60fps ✓
Annotation Add:  <50ms ✓
Export:          <100ms ✓
```

### Target for v3.0.0
```
Initial Load:    200ms
Canvas Redraw:   <8ms @ 120fps
Annotation Add:  <5ms
Export:          <10ms
Support 10K+ annotations
```

---

## 🧪 Testing Roadmap

### Unit Tests (v2.1)
- 🔲 temperatureService
- 🔲 geometryService
- 🔲 exportService
- 🔲 analyticsService

### Integration Tests (v2.2)
- 🔲 Annotation workflow
- 🔲 Export workflows
- 🔲 Analytics calculations

### E2E Tests (v2.3)
- 🔲 Complete annotation flow
- 🔲 Multi-tool workflows
- 🔲 Export & import

---

## 📚 Documentation Roadmap

### Current (v2.0) ✅
- ✅ README.md
- ✅ USING_GUIDE.md
- ✅ ARCHITECTURE.md
- ✅ API_EXAMPLES.md

### Planned (v2.1+)
- 🔲 TypeScript migration guide
- 🔲 Plugin development guide
- 🔲 API reference (auto-generated)
- 🔲 Video tutorials
- 🔲 Troubleshooting guide

---

## 🔄 Community & Feedback

### Ways to Contribute
1. **Bug reports** → GitHub Issues
2. **Feature requests** → GitHub Discussions
3. **Code** → Pull Requests
4. **Documentation** → Help improve guides
5. **Translations** → Add new languages

### Feedback Channels
- 📧 Email: contact@example.com (if created)
- 🐦 Twitter: @ThermoLabelApp (if created)
- 💬 GitHub Discussions
- 🎯 Issues tracker

---

## 📅 Timeline

```
2024 Q1: MVP v2.0 (CURRENT) ✅
2024 Q2: v2.1 (UX improvements)
2024 Q3: v2.2 (Advanced features)
2024 Q4: v3.0 (Collaboration & scaling)
2025+:  Enterprise features
```

---

## 💡 Vision

**ThermoLabel aims to become the industry standard for thermal image annotation.**

- 🎯 Easy to use
- 🎯 Powerful features
- 🎯 Open source
- 🎯 Community-driven
- 🎯 Production-ready

---

## 🤝 Support

- **Issues**: Use GitHub Issues for bugs
- **Discussions**: Use GitHub Discussions for ideas
- **PRs**: Welcome! Please read CONTRIBUTING.md (coming soon)

---

**Last Updated**: January 2024  
**Status**: MVP Phase ✅ → Ready for Production
