import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Обработчик команды /start
bot.command('start', async (ctx) => {
    try {
        await ctx.reply(
            'Привет! Я бот для игры Snail to Riches 🐌\n\n' +
            'Доступные команды:\n' +
            '/race - Начать новую гонку\n' +
            '/stats - Статистика гонок\n' +
            '/help - Помощь',
            {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '🎮 Начать гонку', callback_data: 'start_race' }
                    ]]
                }
            }
        );
    } catch (error) {
        console.error('Ошибка в команде /start:', error);
        await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
});

// Обработчик команды /race
bot.command('race', async (ctx) => {
    try {
        await ctx.reply(
            'Выберите тип гонки:',
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🏃 Обычная гонка', callback_data: 'race_normal' },
                            { text: '🎯 Турнир', callback_data: 'race_tournament' }
                        ]
                    ]
                }
            }
        );
    } catch (error) {
        console.error('Ошибка в команде /race:', error);
        await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
});

// Обработчик команды /stats
bot.command('stats', async (ctx) => {
    try {
        await ctx.reply(
            '📊 Статистика гонок:\n\n' +
            'Всего гонок: 0\n' +
            'Победы: 0\n' +
            'Проигрыши: 0\n' +
            'Коэффициент: 0.0'
        );
    } catch (error) {
        console.error('Ошибка в команде /stats:', error);
        await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
});

// Обработчик команды /help
bot.command('help', async (ctx) => {
    try {
        await ctx.reply(
            '❓ Помощь по игре:\n\n' +
            '1. Используйте /race для начала новой гонки\n' +
            '2. Выберите тип гонки\n' +
            '3. Сделайте ставку\n' +
            '4. Следите за гонкой\n' +
            '5. Получите выигрыш!\n\n' +
            'Для поддержки: @support'
        );
    } catch (error) {
        console.error('Ошибка в команде /help:', error);
        await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
});

// Обработчик callback-запросов
bot.on('callback_query', async (ctx) => {
    try {
        const action = ctx.callbackQuery.data;
        
        switch (action) {
            case 'start_race':
                await ctx.reply('Используйте команду /race для начала гонки');
                break;
            case 'race_normal':
                await ctx.reply('Выберите улитку для ставки:', {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '🐌 RacerSlug', callback_data: 'bet_racer' },
                                { text: '🌿 ExplorerSlug', callback_data: 'bet_explorer' }
                            ],
                            [
                                { text: '🐍 SnakeSlug', callback_data: 'bet_snake' },
                                { text: '💪 StubbornSlug', callback_data: 'bet_stubborn' }
                            ]
                        ]
                    }
                });
                break;
            case 'race_tournament':
                await ctx.reply('Турнирная система в разработке');
                break;
            default:
                if (action.startsWith('bet_')) {
                    await ctx.reply('Введите сумму ставки (например: 100)');
                }
        }
        
        await ctx.answerCallbackQuery();
    } catch (error) {
        console.error('Ошибка в обработке callback:', error);
        await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
});

export default bot; 