require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const game = require('./modules/game');

const app = express();

// Проверяем обязательные переменные окружения
if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('Ошибка: Не установлен TELEGRAM_BOT_TOKEN');
    process.exit(1);
}

if (!process.env.WEBAPP_URL) {
    console.error('Ошибка: Не установлен WEBAPP_URL');
    process.exit(1);
}

// Используем только разрешенные Telegram порты
const ALLOWED_PORTS = [443, 80, 88, 8443];
const port = process.env.PORT || 8443;

if (!ALLOWED_PORTS.includes(Number(port))) {
    console.error(`Ошибка: Порт ${port} не поддерживается Telegram. Используйте один из портов: ${ALLOWED_PORTS.join(', ')}`);
    process.exit(1);
}

// Глобальные переменные состояния
let isReady = false;
let startTime = Date.now();
let bot = null;

// Настройка Express
app.use(express.json());

// Простой healthcheck
app.get('/', (req, res) => {
    console.log('Healthcheck запрошен:', {
        isReady,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        botInitialized: !!bot
    });

    // Всегда отвечаем 200, но с разным статусом
    res.status(200).json({
        status: isReady ? 'ready' : 'starting',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        botInitialized: !!bot,
        timestamp: new Date().toISOString()
    });
});

// Webhook endpoint
app.post('/webhook', express.json(), (req, res) => {
    if (!bot || !isReady) {
        console.log('Webhook получен, но бот не готов:', { botInitialized: !!bot, isReady });
        return res.status(200).json({ ok: false, error: 'Bot is starting' });
    }
    bot.handleUpdate(req.body, res);
});

// Функция инициализации бота
async function initializeBot() {
    try {
        console.log('Начинаем инициализацию бота...');
        
        // Создаем бота
        bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
        console.log('Бот создан успешно');

        // Настраиваем базовые команды
        bot.command('start', ctx => ctx.reply('Привет! Бот работает.'));
        bot.command('ping', ctx => ctx.reply('pong'));
        
        console.log('Команды бота настроены');

        // Устанавливаем webhook
        const webhookUrl = `${process.env.WEBAPP_URL}/webhook`;
        await bot.telegram.setWebhook(webhookUrl);
        console.log('Webhook установлен:', webhookUrl);

        // Проверяем webhook
        const webhookInfo = await bot.telegram.getWebhookInfo();
        console.log('Webhook info:', webhookInfo);

        return true;
    } catch (error) {
        console.error('Ошибка при инициализации бота:', error);
        return false;
    }
}

// Запуск сервера
const server = app.listen(port, async () => {
    console.log(`Сервер запущен на порту ${port}`);
    
    try {
        // Инициализируем бота
        const success = await initializeBot();
        
        if (success) {
            isReady = true;
            console.log('Приложение полностью инициализировано и готово к работе');
        } else {
            console.error('Не удалось инициализировать бота');
            process.exit(1);
        }
    } catch (error) {
        console.error('Критическая ошибка при запуске:', error);
        process.exit(1);
    }
});

// Обработка ошибок сервера
server.on('error', (error) => {
    console.error('Ошибка сервера:', error);
    process.exit(1);
});

// Graceful shutdown
const shutdown = () => {
    console.log('Получен сигнал завершения работы');
    isReady = false;
    server.close(() => {
        console.log('Сервер остановлен');
        if (bot) {
            bot.stop('SIGTERM');
            console.log('Бот остановлен');
        }
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown); 