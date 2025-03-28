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

// Используем порт из Railway
const port = process.env.PORT || 3000;

// Флаг готовности приложения
let isReady = false;
let bot;

// Настройка Express
app.use(express.json());

// Healthcheck endpoint с проверкой готовности
app.get('/', (req, res) => {
    if (!isReady) {
        return res.status(503).json({
            status: 'error',
            message: 'Application is starting'
        });
    }
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime()
    });
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
    if (bot) {
        bot.handleUpdate(req.body, res);
    } else {
        res.status(500).json({ error: 'Bot not initialized' });
    }
});

// Запуск сервера
const server = app.listen(port, async () => {
    try {
        console.log(`Server is running on port ${port}`);

        // Инициализация игры
        await game.initialize();
        console.log('Game initialized successfully');

        // Создаем бота
        bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
        console.log('Telegram bot created successfully');

        // Настройка команд бота
        await bot.telegram.setMyCommands([
            { command: 'start', description: 'Запустить бота' },
            { command: 'play', description: 'Начать игру' }
        ]);

        // Команда /start
        bot.command('start', async (ctx) => {
            try {
                await ctx.reply('🎮 Добро пожаловать в Snail Game!\n\nВыберите действие:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '🎮 НАЧАТЬ ИГРУ 🎮', web_app: { url: process.env.WEBAPP_URL } }
                        ]]
                    }
                });
            } catch (error) {
                console.error('Ошибка при отправке приветствия:', error);
                await ctx.reply('Произошла ошибка. Попробуйте позже.');
            }
        });

        // Команда /play
        bot.command('play', async (ctx) => {
            try {
                await ctx.reply('🎮 Нажмите кнопку чтобы начать игру:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '🎮 НАЧАТЬ ИГРУ 🎮', web_app: { url: process.env.WEBAPP_URL } }
                        ]]
                    }
                });
            } catch (error) {
                console.error('Ошибка при отправке кнопки игры:', error);
                await ctx.reply('Произошла ошибка. Попробуйте позже.');
            }
        });

        // Обработка данных от веб-приложения
        bot.on('web_app_data', async (ctx) => {
            try {
                const data = ctx.webAppData.data;
                const bet = JSON.parse(data);
                
                // Запуск гонки
                const result = await game.startRace(bet);
                
                // Отправка результата пользователю
                await ctx.reply(`🎉 Результат гонки:\nПобедитель: ${result.winner}\nВремя: ${result.time}с`);
            } catch (error) {
                console.error('Error processing web app data:', error);
                await ctx.reply('Произошла ошибка при обработке данных. Попробуйте позже.');
            }
        });

        // Запускаем бота с webhook
        const webhookUrl = `${process.env.WEBAPP_URL}/webhook`;
        await bot.telegram.setWebhook(webhookUrl);
        console.log(`Webhook set to ${webhookUrl}`);
        
        // Помечаем приложение как готовое
        isReady = true;
        console.log('Application is ready to handle requests');
    } catch (error) {
        console.error('Failed to initialize:', error);
        server.close(() => {
            process.exit(1);
        });
    }
});

// Обработка ошибок сервера
server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
});

// Graceful shutdown
process.once('SIGINT', () => {
    isReady = false;
    if (bot) bot.stop('SIGINT');
    process.exit(0);
});

process.once('SIGTERM', () => {
    isReady = false;
    if (bot) bot.stop('SIGTERM');
    process.exit(0);
}); 