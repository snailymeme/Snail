import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bot from './modules/bot/index.js';

// Загружаем переменные окружения
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware для парсинга JSON
app.use(express.json());

// Раздаем статические файлы
app.use(express.static(__dirname));

// Маршрут для главной страницы
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Webhook для Telegram
app.post(`/webhook/${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// Запускаем сервер
app.listen(port, async () => {
  console.log(`Сервер запущен на порту ${port}`);
  console.log(`Откройте http://localhost:${port} в браузере`);

  try {
    // Устанавливаем webhook для бота
    const webhookUrl = `${process.env.WEBAPP_URL}/webhook/${process.env.TELEGRAM_BOT_TOKEN}`;
    await bot.telegram.setWebhook(webhookUrl);
    console.log('Webhook установлен:', webhookUrl);

    // Проверяем webhook
    const webhookInfo = await bot.telegram.getWebhookInfo();
    console.log('Webhook info:', webhookInfo);

    // Запускаем бота
    await bot.launch();
    console.log('Бот запущен');

    // Graceful shutdown
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    console.error('Ошибка при запуске бота:', error);
    process.exit(1);
  }
}); 