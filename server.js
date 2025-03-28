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

// Флаг готовности приложения
let isReady = false;
let bot;

// Настройка Express
app.use(express.json());

// Healthcheck endpoint с проверкой готовности и соединения с Telegram
app.get('/', async (req, res) => {
    try {
        if (!isReady || !bot) {
            return res.status(503).json({
                status: 'error',
                message: 'Application is starting',
                ready: false,
                uptime: process.uptime()
            });
        }

        // Проверяем соединение с Telegram
        await bot.telegram.getMe();
        
        res.status(200).json({
            status: 'ok',
            ready: true,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Healthcheck failed:', error);
        res.status(503).json({
            status: 'error',
            message: 'Failed to connect to Telegram',
            ready: false,
            error: error.message
        });
    }
});

// Webhook endpoint с проверкой подписи
app.post('/webhook', express.json(), (req, res) => {
    if (!bot) {
        return res.status(503).json({ error: 'Bot not initialized' });
    }
    
    if (!isReady) {
        return res.status(503).json({ error: 'Application is starting' });
    }

    bot.handleUpdate(req.body, res);
});

// Запуск сервера
const startServer = async () => {
    try {
        // Создаем бота до запуска сервера
        bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
        console.log('Telegram bot created successfully');

        // Инициализация игры
        await game.initialize();
        console.log('Game initialized successfully');

        // Настройка команд бота
        await bot.telegram.setMyCommands([
            { command: 'start', description: 'Запустить бота' },
            { command: 'play', description: 'Начать игру' }
        ]);

        // Настраиваем обработчики команд
        setupBotHandlers(bot);

        // Запускаем сервер только после успешной инициализации бота
        const server = app.listen(port, async () => {
            try {
                console.log(`Server is running on port ${port}`);
                
                // Устанавливаем webhook только после запуска сервера
                const webhookUrl = `${process.env.WEBAPP_URL}/webhook`;
                await bot.telegram.setWebhook(webhookUrl);
                console.log(`Webhook set to ${webhookUrl}`);

                // Проверяем webhook
                const webhookInfo = await bot.telegram.getWebhookInfo();
                console.log('Webhook info:', webhookInfo);

                // Помечаем приложение как готовое
                isReady = true;
                console.log('Application is ready to handle requests');
            } catch (error) {
                console.error('Failed to set webhook:', error);
                server.close(() => process.exit(1));
            }
        });

        // Обработка ошибок сервера
        server.on('error', (error) => {
            console.error('Server error:', error);
            isReady = false;
            process.exit(1);
        });

        // Graceful shutdown
        const shutdown = () => {
            isReady = false;
            if (bot) {
                bot.stop('SIGTERM');
            }
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        };

        process.once('SIGINT', shutdown);
        process.once('SIGTERM', shutdown);

    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
};

// Выносим обработчики бота в отдельную функцию
function setupBotHandlers(bot) {
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
}

// Запускаем приложение
startServer().catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
}); 