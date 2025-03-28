# Используем официальный образ Node.js
FROM node:20-alpine

# Создаем директорию приложения
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Healthcheck configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Открываем порт
EXPOSE 443

# Запускаем приложение
CMD ["npm", "start"] 