# TypeScript Error Fixing Scripts

Набір скриптів для автоматичного виправлення TypeScript помилок великими пачками.

## 📊 Огляд

Ці скрипти аналізують і автоматично виправляють поширені TypeScript помилки в проекті:

- **TS6133, TS6196**: Невикористані змінні та імпорти (44 errors)
- **TS2300**: Дублікати ідентифікаторів (6 errors)
- **TS18047, TS18048, TS2532**: Перевірки null/undefined (16 errors)
- **TS2305, TS2307**: Проблеми з імпортами в тестах (9 errors)

**Загальна ефективність**: ~30% помилок можна виправити автоматично (75 з 258)

## 🚀 Швидкий старт

### Метод 1: Все разом (рекомендовано)

```bash
cd ui
./scripts/batch-fix-errors.sh
```

Цей скрипт:
1. Аналізує всі помилки
2. Показує класифікацію
3. Питає підтвердження
4. Автоматично виправляє ~75 помилок
5. Показує прогрес після кожного кроку

### Метод 2: Покрокове виправлення

```bash
cd ui

# Крок 1: Аналіз помилок
node scripts/analyze-ts-errors.js

# Крок 2: Виправити невикористані змінні
node scripts/fix-unused-vars.js

# Крок 3: Виправити null checks
node scripts/fix-null-checks.js

# Крок 4: Виправити імпорти в тестах
node scripts/fix-test-imports.js

# Перевірити результат
npm run typecheck
```

## 📋 Докладний опис скриптів

### 1. analyze-ts-errors.js

**Що робить:**
- Запускає `npm run typecheck`
- Парсить усі помилки
- Класифікує за типом, файлом, категорією
- Показує статистику
- Зберігає детальний звіт у `.type-errors-report.json`

**Вивід:**
```
ERROR CLASSIFICATION BY TYPE
TS2339: Property does not exist on type
  Count: 59
  Auto-fixable: ❌ NO

ERROR CLASSIFICATION BY FILE
./tests/e2e/user-workflows.spec.ts
  Errors: 32
  Types: TS2353, TS2322

ERROR CLASSIFICATION BY CATEGORY
TESTS: 180 errors
RENDERER: 42 errors
MAIN: 36 errors
```

### 2. fix-unused-vars.js

**Виправляє:** TS6133, TS6196 (44 помилки)

**Стратегії:**
- Видаляє невикористані імпорти
- Додає `_` префікс до невикористаних параметрів функцій
- Очищає порожні рядки імпортів
- Зберігає форматування коду

**Приклад:**
```typescript
// До:
import { foo, bar, baz } from 'module';
function test(unusedParam, usedParam) { ... }

// Після:
import { bar, baz } from 'module';
function test(_unusedParam, usedParam) { ... }
```

### 3. fix-null-checks.js

**Виправляє:** TS18047, TS18048, TS2532 (16 помилок)

**Стратегії:**
- Додає optional chaining (`?.`)
- Додає non-null assertion (`!`) де безпечно
- Додає перевірки для array access

**Приклад:**
```typescript
// До:
const value = obj.property.nested;
const item = array[index];

// Після:
const value = obj?.property?.nested;
const item = array?.[index];
```

**⚠️ Увага:** Деякі виправлення потребують перевірки!

### 4. fix-test-imports.js

**Виправляє:** TS2305, TS2307 в тестах (9 помилок)

**Стратегії:**
- Оновлює шляхи імпортів на правильні
- Видаляє імпорти неіснуючих типів
- Додає відсутні імпорти з `@shared/types`

**Mapping:**
```
ElectronAPI: '../contexts/ElectronContext' → '@shared/types'
EngineStatus: '../contexts/EngineContext' → '@shared/engine'
UISettings: '../contexts/SettingsContext' → '@shared/core'
SettingsPreset: → видалити (type не існує)
```

## 📈 Очікувані результати

### До виправлення
```
Found 258 TypeScript errors

By category:
- Tests: 180 errors
- Renderer: 42 errors  
- Main: 36 errors

By type:
- TS2339 (Property does not exist): 59
- TS6133 (Unused variable): 39
- TS2322 (Type mismatch): 33
- TS2353 (Unknown property): 32
```

### Після batch-fix-errors.sh
```
Initial errors:   258
Fixed errors:     75
Remaining errors: 183
Success rate:     29%

Remaining errors require manual fixes:
- TS2339: Property does not exist (59)
- TS2322: Type assignment mismatch (33)
- TS2353: Unknown properties (32)
```

## 🔧 Що залишається робити вручну

Після автоматичних виправлень залишається ~183 помилки, які потребують ручного виправлення:

### 1. Type mismatches (TS2339, TS2322, TS2353) - 124 errors

**Проблема:** UISettings має іншу структуру ніж очікують компоненти

**Рішення:** 
- Узгодити структуру UISettings в `@shared/core.ts`
- Додати відсутні поля: `animation`, `performance`, `interface`, `watermark`
- АБО оновити всі компоненти під нову структуру

### 2. Test mock mismatches - 45 errors

**Проблема:** ElectronAPI мокі в тестах не відповідають реальному інтерфейсу

**Рішення:**
- Створити shared mock factory: `tests/helpers/createElectronAPIMock.ts`
- Оновити всі тести на використання цього factory
- Синхронізувати з реальним ElectronAPI interface

### 3. Missing exports (TS2305) - 14 errors

**Проблема:** Деякі типи ще не експортуються з модулів

**Рішення:**
- Перевірити `@shared/index.ts` та додати відсутні експорти
- Створити відсутні типи якщо потрібно

## 📝 Best Practices

1. **Завжди робіть backup перед batch-fix:**
   ```bash
   git add -A
   git commit -m "WIP: before batch fixes"
   ```

2. **Перевіряйте зміни після кожного скрипта:**
   ```bash
   git diff
   npm run typecheck
   ```

3. **Тестуйте після виправлень:**
   ```bash
   npm test
   npm run lint
   ```

4. **Для складних випадків використовуйте поетапний підхід:**
   - Спочатку виправте прості помилки (unused vars)
   - Потім перевірте що нічого не зламалось
   - Тоді переходьте до складніших (null checks)

## 🐛 Troubleshooting

### "Error report not found"
```bash
# Спочатку запустіть analyze
node scripts/analyze-ts-errors.js
```

### "File not found"
Можливо файл було перейменовано/видалено. Звіт застарів:
```bash
# Оновіть звіт
node scripts/analyze-ts-errors.js
```

### Скрипт пропустив помилки
Деякі помилки занадто складні для автоматичного виправлення. Це нормально.

### Після виправлень з'явились нові помилки
Іноді виправлення однієї помилки відкриває іншу. Запустіть скрипт повторно:
```bash
./scripts/batch-fix-errors.sh
```

## 📦 Структура файлів

```
ui/scripts/
├── analyze-ts-errors.js      # Аналізатор помилок
├── fix-unused-vars.js         # Виправлення unused
├── fix-null-checks.js         # Виправлення null checks
├── fix-test-imports.js        # Виправлення імпортів
├── batch-fix-errors.sh        # Master скрипт
└── README-FIXING-SCRIPTS.md   # Ця документація

ui/
└── .type-errors-report.json   # Детальний JSON звіт (генерується)
```

## 🎯 Roadmap

Майбутні покращення:

- [ ] Автоматичне виправлення TS2322 (type mismatches)
- [ ] Генерація test mocks із реальних інтерфейсів
- [ ] Інтеграція з pre-commit hook
- [ ] Додати dry-run режим для preview змін
- [ ] Rollback функція якщо щось пішло не так

## 📚 Додаткові ресурси

- [TypeScript Error Reference](https://typescript.tv/errors/)
- [Project Type System Documentation](../specs/002-ui/TYPE_REFACTORING_PROGRESS.md)
- [Implementation Status](../specs/002-ui/IMPLEMENTATION_STATUS.md)
