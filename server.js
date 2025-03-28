require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');

// Проверяем обязательные переменные окружения
const requiredEnvs = ['TELEGRAM_BOT_TOKEN', 'WEBAPP_URL', 'PORT', 'WEBHOOK_PATH'];
for (const env of requiredEnvs) {
    if (!process.env[env]) {
        console.error(`Ошибка: Не установлен ${env}`);
        process.exit(1);
    }
}

// Глобальные переменные
const port = process.env.PORT || 443;
const webhookPath = process.env.WEBHOOK_PATH || '/webhook';
let isReady = false;
let startTime = Date.now();
let bot = null;

// Создаем Express приложение
const app = express();
app.use(express.json());

// Базовый healthcheck
app.get('/', (req, res) => {
    console.log('Healthcheck запрошен:', {
        isReady,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        botInitialized: !!bot
    });

    res.status(200).json({
        status: isReady ? 'ready' : 'starting',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        botInitialized: !!bot,
        timestamp: new Date().toISOString()
    });
});

// Webhook endpoint
app.post(webhookPath, express.json(), (req, res) => {
    console.log('Webhook запрос получен');
    
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
        bot.command('start', ctx => {
            return ctx.reply('Привет! Бот работает. Нажми кнопку чтобы начать игру:', {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '🎮 Играть', web_app: { url: process.env.WEBAPP_URL } }
                    ]]
                }
            });
        });

        bot.command('ping', ctx => ctx.reply('pong'));
        
        console.log('Команды бота настроены');

        // Устанавливаем webhook
        const webhookUrl = `${process.env.WEBAPP_URL}${webhookPath}`;
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
console.log('Запуск сервера...');
console.log('Конфигурация:', {
    port,
    webhookPath,
    webappUrl: process.env.WEBAPP_URL
});

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