# Snail to Riches

Telegram WebApp игра с интеграцией Solana. Игроки делают ставки на улиток, которые соревнуются в лабиринте.

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/snail-to-riches.git
cd snail-to-riches
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл .env и добавьте необходимые переменные окружения:
```
TELEGRAM_BOT_TOKEN=your_bot_token
SOLANA_RPC_URL=your_solana_rpc_url
```

4. Запустите проект:
```bash
npm start
```

## Структура проекта

```
modules/
├── game/                        # Основной игровой модуль
│   ├── Snails/                 # Логика улиток
│   ├── Maze/                   # Генерация и отрисовка лабиринта
│   ├── Race/                   # Логика гонки
│   ├── Betting/                # Логика ставок
│   └── blockchain/             # Интеграция с Solana
├── common/                     # Общие утилиты
└── bot/                        # Telegram бот
```

## Разработка

- Используйте `npm test` для запуска тестов
- Следуйте правилам в `SnailToRichesRules.md`
- Используйте ESLint для проверки кода

## Лицензия

MIT 