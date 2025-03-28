# Changelog

Все значимые изменения в проекте будут документироваться в этом файле.

## [Unreleased]

### Added
- Создан файл RULES.md с правилами обновления документации
- Добавлены правила для CHANGELOG.md, PROMPT.md и SnailToRichesRules.md
- Определены форматы обновлений и ответственность за документацию
- Создана базовая структура проекта
- Добавлены основные директории и файлы
- Создан базовый Telegram бот с командами /start и /play
- Добавлена интеграция с веб-приложением
- Создан основной модуль игры (modules/game/index.js)

### Changed
- Обновлен package.json с необходимыми зависимостями
- Адаптирована структура проекта под существующий бот

### Project Structure
```
modules/
├── game/                        # Основной игровой модуль
│   ├── Snails/                 # Логика улиток
│   │   ├── RacerSlug/         # Подмодуль для racerSlug
│   │   ├── ExplorerSlug/      # Подмодуль для explorerSlug
│   │   ├── SnakeSlug/         # Подмодуль для snakeSlug
│   │   ├── StubbornSlug/      # Подмодуль для stubbornSlug
│   │   ├── DefaultSlug/       # Подмодуль для defaultSlug
│   │   └── Core/              # Общая логика для всех улиток
│   ├── Maze/                  # Генерация и отрисовка лабиринта
│   ├── Race/                  # Логика гонки
│   ├── Betting/               # Логика ставок
│   └── blockchain/            # Интеграция с Solana
├── common/                    # Общие утилиты
└── bot/                       # Telegram бот
```

### Current State
- Бот успешно запускается и отвечает на команды
- Интегрирована базовая структура для веб-приложения
- Подготовлена структура для игровой логики

### Next Steps
1. Реализация базового класса улитки
2. Генерация лабиринта
3. Логика гонки
4. Интеграция с Solana

### Dependencies
```json
{
  "dependencies": {
    "@solana/web3.js": "^1.87.6",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "telegraf": "^4.12.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "eslint": "^8.56.0",
    "nodemon": "^3.0.2"
  }
}
```

### Environment Variables
```
TELEGRAM_BOT_TOKEN=your_bot_token
WEBAPP_URL=your_webapp_url
``` 