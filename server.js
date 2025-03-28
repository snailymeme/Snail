require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const game = require('./modules/game');

const app = express();
const port = process.env.PORT || 443;

let bot;

// Проверяем обязательные переменные окружения
if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('Ошибка: Не установлен TELEGRAM_BOT_TOKEN');
    process.exit(1);
}

if (!process.env.WEBAPP_URL) {
    console.error('Ошибка: Не установлен WEBAPP_URL');
    process.exit(1);
}

// URL для веб-приложения
const webAppUrl = process.env.WEBAPP_URL;

// Настройка Express
app.use(express.json());

// Healthcheck endpoint
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString()
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
                            { text: '🎮 НАЧАТЬ ИГРУ 🎮', web_app: { url: webAppUrl } }
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
                            { text: '🎮 НАЧАТЬ ИГРУ 🎮', web_app: { url: webAppUrl } }
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
        await bot.launch({
            webhook: {
                domain: process.env.WEBAPP_URL,
                hookPath: '/webhook',
                port: port
            }
        });
        
        console.log('Bot successfully launched with webhook');
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
    if (bot) bot.stop('SIGINT');
    process.exit(0);
});
process.once('SIGTERM', () => {
    if (bot) bot.stop('SIGTERM');
    process.exit(0);
}); 