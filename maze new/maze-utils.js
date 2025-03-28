/**
 * @fileoverview Классы ошибок для модулей игры.
 * 
 * @module Errors
 * @author Snail to Riches Team
 * @version 1.0.0
 */

/**
 * Базовый класс для всех ошибок в игре
 * @extends Error
 */
export class GameError extends Error {
    /**
     * Создает экземпляр ошибки игры
     * 
     * @param {string} message - Сообщение об ошибке
     * @param {Object} [options={}] - Дополнительные опции
     * @param {string} [options.code] - Код ошибки
     * @param {string} [options.module] - Модуль, в котором произошла ошибка
     * @param {*} [options.data] - Дополнительные данные
     */
    constructor(message, options = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = options.code || 'GAME_ERROR';
        this.module = options.module || 'unknown';
        this.data = options.data;
        this.timestamp = Date.now();
        
        // Для корректной работы стека вызовов в V8
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    
    /**
     * Преобразует ошибку в строку
     * 
     * @returns {string} Строковое представление ошибки
     */
    toString() {
        return `[${this.code}] ${this.name}: ${this.message} (Module: ${this.module})`;
    }
    
    /**
     * Преобразует ошибку в объект
     * 
     * @returns {Object} Объектное представление ошибки
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            module: this.module,
            data: this.data,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

/**
 * Ошибка валидации данных
 * @extends GameError
 */
export class ValidationError extends GameError {
    /**
     * Создает экземпляр ошибки валидации
     * 
     * @param {string} message - Сообщение об ошибке
     * @param {Object} [options={}] - Дополнительные опции
     */
    constructor(message, options = {}) {
        super(message, {
            ...options,
            code: options.code || 'VALIDATION_ERROR'
        });
    }
}

/**
 * Ошибка сетевого взаимодействия
 * @extends GameError
 */
export class NetworkError extends GameError {
    /**
     * Создает экземпляр ошибки сети
     * 
     * @param {string} message - Сообщение об ошибке
     * @param {Object} [options={}] - Дополнительные опции
     */
    constructor(message, options = {}) {
        super(message, {
            ...options,
            code: options.code || 'NETWORK_ERROR'
        });
    }
}

/**
 * Ошибка инициализации
 * @extends GameError
 */
export class InitializationError extends GameError {
    /**
     * Создает экземпляр ошибки инициализации
     * 
     * @param {string} message - Сообщение об ошибке
     * @param {Object} [options={}] - Дополнительные опции
     */
    constructor(message, options = {}) {
        super(message, {
            ...options,
            code: options.code || 'INIT_ERROR'
        });
    }
}

/**
 * Ошибка состояния
 * @extends GameError
 */
export class StateError extends GameError {
    /**
     * Создает экземпляр ошибки состояния
     * 
     * @param {string} message - Сообщение об ошибке
     * @param {Object} [options={}] - Дополнительные опции
     */
    constructor(message, options = {}) {
        super(message, {
            ...options,
            code: options.code || 'STATE_ERROR'
        });
    }
}

/**
 * Ошибка ресурсов
 * @extends GameError
 */
export class ResourceError extends GameError {
    /**
     * Создает экземпляр ошибки ресурсов
     * 
     * @param {string} message - Сообщение об ошибке
     * @param {Object} [options={}] - Дополнительные опции
     */
    constructor(message, options = {}) {
        super(message, {
            ...options,
            code: options.code || 'RESOURCE_ERROR'
        });
    }
}