# 🚀 QUICK START GUIDE - ThermoLabel v0.3.0

## 📋 Что изменилось в версии 0.3.0

✅ **Полное тестирование** - 73 теста для всех сервисов  
✅ **PostgreSQL интеграция** - готов к подключению БД  
✅ **Сохранение проектов** - меню ProjectsMenu  
✅ **Загрузка без палитры** - ImageLoadModal с двумя режимами  
✅ **Светлая тема** - переключение ☀️/🌙  
✅ **Русский интерфейс** - полный перевод  
✅ **Исправлены все баги** - состояние сохраняется  

---

## 🎯 Быстрый старт (5 минут)

### 1️⃣ Запустить дев сервер
```bash
cd /workspaces/ThermoLabel
npm run dev
# Откроется на http://localhost:3001
```

### 2️⃣ Использовать основные функции

#### Сохранение проекта
```
1. Сделайте аннотации
2. Нажмите кнопку "💾 Сохранить проект"
3. Откройте меню "📁 Проекты" чтобы загрузить сохраненный
```

#### Загрузить новое изображение
```
1. Нажмите "+ Загрузить изображение"
2. Выберите режим:
   - С палитрой (для тепловых снимков)
   - Без палитры (для обычных фото)
3. Выберите файл
```

#### Переключить тему
```
1. Нажмите ☀️ (светлая) или 🌙 (темная)
2. Интерфейс пересчитается в реal-time
```

#### Выбрать язык
```
1. Нажмите "RU" или "EN" в правом углу
2. Весь интерфейс переведется
```

---

## 🧪 Запуск тестов

```bash
# Все тесты с покрытием
npm test

# Отслеживание изменений
npm run test:watch

# Только unit тесты
npm run test:unit
```

---

## 🗄️ Работа с PostgreSQL (опционально)

### Локальная БД
```bash
cd backend

# Установить зависимости
pip install -r requirements.txt

# Инициализировать БД
bash init-db.sh

# Запустить backend
python main.py
# В другом терминале
npm run dev
```

### Docker (рекомендуется)
```bash
# Из корневой папки
docker-compose up

# Система автоматически:
# 1. Запустит PostgreSQL
# 2. Применит миграции
# 3. Запустит Backend (8000)
# 4. Запустит Frontend (3000)
```

---

## 📁 Новые компоненты

### `ProjectsMenu` - Меню сохраненных проектов
```javascript
<ProjectsMenu onProjectOpen={handleProjectOpen} />
```

**Функции**:
- Просмотр всех сохраненных проектов
- Быстрое открытие проекта
- Удаление проектов

### `ImageLoadModal` - Диалог загрузки с режимами
```javascript
<ImageLoadModal 
  isOpen={showImageModal}
  onLoad={handleImageLoad}
  onCancel={() => setShowImageModal(false)}
/>
```

**Режимы**:
1. С палитрой - для тепловых изображений
2. Без палитры - для обычных изображений

---

## 💾 Локальное хранилище

### `storageService.js` - API для сохранения состояния
```javascript
import storageService from '@/lib/services/storageService'

// Сохранить состояние
storageService.setClasses(classes)
storageService.setPalette('rainbow')
storageService.setLanguage('ru')
storageService.setTheme('light')

// Загрузить состояние
const classes = storageService.getClasses()
const palette = storageService.getPalette()

// Управление проектами
storageService.saveProject(project)
const project = storageService.loadProject(projectId)
storageService.deleteProject(projectId)
```

---

## 🎨 Интернационализация

### Поддерживаемые языки:
- **RU** - Русский (полный перевод)
- **EN** - English (fallback)

### Использование:
```javascript
import { translations } from '@/lib/i18n'

const t = (key) => translations[language][key]

// В компонентах
<button>{t('save_project')}</button>
```

---

## 🌙 Система тем

### Поддерживаемые темы:
- **dark** - Темная тема (по умолчанию)
- **light** - Светлая тема

### CSS переменные которые изменяются:
```css
--color-primary         /* Основной цвет */
--color-background      /* Фон */
--color-text           /* Текст */
--color-surface        /* Панели */
--color-border         /* Границы */
/* + еще 7 переменных */
```

---

## 📊 Структура БД

### Таблицы (созданы с помощью Alembic миграций)

- **projects** - Проекты с тепловыми изображениями
- **annotation_classes** - Классы (Перегрев, Норма и т.д.)
- **annotations** - Конкретные аннотации (бокс/полигон)
- **analytics** - Кэшированная статистика
- **export_logs** - Логи всех экспортов

### Связи:
```
Project (1) --- (M) AnnotationClass
Project (1) --- (M) Annotation
Project (1) --- (1) Analytics
Project (1) --- (M) ExportLog
```

---

## 🐛 Исправленные проблемы

| Проблема | Решение |
|---------|---------|
| Файл не скачивается | Исправлена функция downloadFile() |
| Не знаю где лежит файл | Добавлено меню ProjectsMenu |
| Только с палитрой | Добавлен ImageLoadModal с режимами |
| Темный экран | Исправлена инициализация canvas |
| Аналитика не сохраняется | Добавлен storageService |
| Только русский | Добавлена интернационализация |
| Только темная тема | Добавлена система тем |

---

## 🔗 Полезные ссылки на документацию

- **[FINAL_REPORT_v0.3.0.md](./FINAL_REPORT_v0.3.0.md)** - Подробный отчет о всех обновлениях
- **[UPDATES_v0.3.0.md](./UPDATES_v0.3.0.md)** - Детальное описание всех изменений
- **[USING_GUIDE.md](./USING_GUIDE.md)** - Руководство пользователя
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Архитектура проекта
- **[API_EXAMPLES.md](./API_EXAMPLES.md)** - Примеры API
- **[TESTING.md](./TESTING.md)** - Руководство по тестированию

---

## 📞 Часто задаваемые вопросы

### Q: Где мой проект сохраняется?
**A**: В `localStorage` браузера. Откройте меню "📁 Проекты" чтобы увидеть все.

### Q: Могу ли я загрузить обычное фото?
**A**: Да! Нажмите "+ Загрузить изображение" и выберите режим "Без палитры".

### Q: Как переключить на английский?
**A**: Нажмите "EN" в правом углу заголовка.

### Q: Как включить светлую тему?
**A**: Нажмите кнопку "☀️" (солнышко) в правом углу.

### Q: Как использовать PostgreSQL?
**A**: Запустите `docker-compose up` или следуйте инструкциям в разделе "Работа с PostgreSQL".

### Q: Есть ли тесты?
**A**: Да! Запустите `npm test` или `npm run test:watch`.

---

## 🛠️ Полезные команды

```bash
# Разработка
npm run dev              # Запустить dev сервер

# Сборка
npm run build            # Собрать для production
npm start                # Запустить production сборку

# Тестирование
npm test                 # Все тесты с покрытием
npm run test:watch      # Отслеживание изменений

# Линтинг
npm run lint             # Проверить код

# Docker
docker-compose up        # Запустить полную систему
docker-compose down      # Остановить
docker-compose logs      # Логи
```

---

## 📋 Минимальные требования

- **Node.js** v18+
- **npm** v9+
- **Python** 3.9+ (для backend опционально)
- **PostgreSQL** 13+ (опционально, для production)

---

## ✨ Что нового в этой версии

### 🎁 Новые компоненты
- `ProjectsMenu.js` - Меню проектов
- `ImageLoadModal.js` - Модаль загрузки

### 🛠️ Новые сервисы
- `storageService.js` - Локальное хранилище

### 🎨 Новые системы
- `theme.js` - Система тем
- `i18n.js` - Интернационализация
- `globals.css` - Глобальные стили

### 🗄️ Новые БД компоненты
- `config.py`, `database.py`, `models.py`
- Alembic миграции
- Docker Compose обновления

### 🧪 Новые тесты
- 6 файлов тестов (73 теста)
- Jest конфигурация

---

## 🎉 Готово!

Приложение полностью обновлено и готово к использованию.

**Запустите**: `npm run dev`  
**Откройте**: http://localhost:3001  
**Наслаждайтесь! 🚀**

---

**Версия**: 0.3.0  
**Дата**: 20 февраля 2025  
**Статус**: ✅ Полностью завершено
