/**
 * @fileoverview Модуль для логирования в игре.
 * 
 * @module Logger
 * @author Snail to Riches Team
 * @version 1.0.0
 */

import { CONFIG } from '../../config.js';

// Уровни логирования
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

/**
 * Цвета для разных уровней логирования
 * @type {Object.<string, string>}
 */
const LOG_COLORS = {
    DEBUG: '#9e9e9e', // Серый
    INFO: '#2196f3',  // Синий
    WARN: '#ff9800',  // Оранжевый
    ERROR: '#f44336', // Красный
};

/**
 * Класс для логирования
 */
export class Logger {
    /**
     * Создает экземпляр логгера
     * 
     * @param {string} moduleName - Имя модуля, из которого происходит логирование
     * @param {Object} [options={}] - Опции логгера
     * @param {number} [options.level] - Уровень логирования (0-4)
     * @param {boolean} [options.useColors=true] - Использовать ли цвета в консоли
     * @param {boolean} [options.showTimestamp=true] - Показывать ли временную метку
     * @param {Function} [options.customHandler] - Пользовательский обработчик логов
     */
    constructor(moduleName, options = {}) {
        this.moduleName = moduleName || 'Unknown';
        
        // Получаем настройки логгера из конфигурации или переданных опций
        const logConfig = CONFIG?.LOGGER || {};
        
        this.level = options.level !== undefined ? options.level : (logConfig.LEVEL || LOG_LEVELS.INFO);
        this.useColors = options.useColors !== undefined ? options.useColors : (logConfig.USE_COLORS !== false);
        this.showTimestamp = options.showTimestamp !== undefined ? options.showTimestamp : (logConfig.SHOW_TIMESTAMP !== false);
        this.customHandler = options.customHandler || logConfig.CUSTOM_HANDLER;
        
        // Определяем, нужно ли сохранять логи
        this.saveLogs = logConfig.SAVE_LOGS === true;
        this.maxSavedLogs = logConfig.MAX_SAVED_LOGS || 1000;
        
        // Массив для хранения логов (если включено сохранение)
        this.logs = this.saveLogs ? [] : null;
        
        // Проверяем, находимся ли мы в режиме разработки
        this.isDevelopment = CONFIG?.IS_DEVELOPMENT === true || 
                             window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
    }
    
    /**
     * Логирование с уровнем DEBUG
     * 
     * @param {string} message - Сообщение для логирования
     * @param {...*} args - Дополнительные аргументы
     */
    debug(message, ...args) {
        this.log(LOG_LEVELS.DEBUG, message, ...args);
    }
    
    /**
     * Логирование с уровнем INFO
     * 
     * @param {string} message - Сообщение для логирования
     * @param {...*} args - Дополнительные аргументы
     */
    info(message, ...args) {
        this.log(LOG_LEVELS.INFO, message, ...args);
    }
    
    /**
     * Логирование с уровнем WARN
     * 
     * @param {string} message - Сообщение для логирования
     * @param {...*} args - Дополнительные аргументы
     */
    warn(message, ...args) {
        this.log(LOG_LEVELS.WARN, message, ...args);
    }
    
    /**
     * Логирование с уровнем ERROR
     * 
     * @param {string} message - Сообщение для логирования
     * @param {...*} args - Дополнительные аргументы
     */
    error(message, ...args) {
        this.log(LOG_LEVELS.ERROR, message, ...args);
    }
    
    /**
     * Логирование с указанным уровнем
     * 
     * @private
     * @param {number} level - Уровень логирования
     * @param {string} message - Сообщение для логирования
     * @param {...*} args - Дополнительные аргументы
     */
    log(level, message, ...args) {
        // Проверяем, нужно ли логировать это сообщение
        if (level < this.level || level === LOG_LEVELS.NONE) {
            return;
        }
        
        // Получаем имя уровня логирования
        const levelName = Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level) || 'UNKNOWN';
        
        // Формируем временную метку
        const timestamp = this.showTimestamp ? new Date().toISOString() : '';
        
        // Формируем префикс
        const prefix = `[${timestamp}] [${levelName}] [${this.moduleName}]:`;
        
        // Сохраняем лог, если нужно
        if (this.saveLogs && this.logs) {
            this.logs.push({
                level: levelName,
                timestamp: timestamp || new Date().toISOString(),
                module: this.moduleName,
                message,
                args: args.length > 0 ? args : undefined
            });
            
            // Ограничиваем количество сохраненных логов
            if (this.logs.length > this.maxSavedLogs) {
                this.logs.shift();
            }
        }
        
        // Если есть пользовательский обработчик, вызываем его
        if (typeof this.customHandler === 'function') {
            try {
                this.customHandler(levelName, this.moduleName, timestamp, message, ...args);
                return;
            } catch (error) {
                // В случае ошибки в пользовательском обработчике, продолжаем стандартное логирование
                console.error('Error in custom log handler:', error);
            }
        }
        
        // В production режиме не логируем отладочные сообщения в консоль
        if (!this.isDevelopment && level === LOG_LEVELS.DEBUG) {
            return;
        }
        
        // Выбираем метод консоли в зависимости от уровня
        let consoleMethod;
        switch (level) {
            case LOG_LEVELS.DEBUG:
                consoleMethod = console.debug || console.log;
                break;
            case LOG_LEVELS.INFO:
                consoleMethod = console.info || console.log;
                break;
            case LOG_LEVELS.WARN:
                consoleMethod = console.warn || console.log;
                break;
            case LOG_LEVELS.ERROR:
                consoleMethod = console.error || console.log;
                break;
            default:
                consoleMethod = console.log;
        }
        
        // Логируем в консоль
        if (this.useColors && typeof window !== 'undefined' && window.console) {
            const color = LOG_COLORS[levelName] || '#000000';
            consoleMethod(`%c${prefix}`, `color: ${color}; font-weight: bold;`, message, ...args);
        } else {
            consoleMethod(prefix, message, ...args);
        }
    }
    
    /**
     * Получение сохраненных логов
     * 
     * @returns {Array|null} Массив сохраненных логов или null, если сохранение отключено
     */
    getSavedLogs() {
        return this.logs ? [...this.logs] : null;
    }
    
    /**
     * Очистка сохраненных логов
     */
    clearSavedLogs() {
        if (this.logs) {
            this.logs = [];
        }
    }
    
    /**
     * Экспорт сохраненных логов в формате JSON
     * 
     * @returns {string|null} JSON-строка с логами или null, если сохранение отключено
     */
    exportLogs() {
        if (!this.logs) {
            return null;
        }
        
        try {
            return JSON.stringify(this.logs, null, 2);
        } catch (error) {
            console.error('Failed to export logs:', error);
            return null;
        }
    }
    
    /**
     * Изменение уровня логирования
     * 
     * @param {number|string} newLevel - Новый уровень логирования (число или строка)
     */
    setLevel(newLevel) {
        if (typeof newLevel === 'string') {
            const level = LOG_LEVELS[newLevel.toUpperCase()];
            if (level !== undefined) {
                this.level = level;
            }
        } else if (typeof newLevel === 'number' && newLevel >= 0 && newLevel <= 4) {
            this.level = newLevel;
        }
    }
}

// Экспортируем константы
export { LOG_LEVELS };