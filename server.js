require('dotenv').config();
const { Telegraf } = require('telegraf');
const game = require('./modules/game');

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

// Инициализация игры
game.initialize().catch(error => {
    console.error('Failed to initialize game:', error);
    process.exit(1);
});

try {
    // Создаем бота
    bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    console.log('Telegram bot initialized successfully');
} catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
    process.exit(1);
}

// URL для веб-приложения
const webAppUrl = process.env.WEBAPP_URL;

// Настройка бота
bot.telegram.setMyCommands([
    { command: 'start', description: 'Запустить бота' },
    { command: 'play', description: 'Начать игру' }
]).catch(error => {
    console.error('Ошибка при установке команд:', error);
});

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

// Запуск бота
bot.launch().catch(error => {
    console.error('Failed to launch bot:', error);
    process.exit(1);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 