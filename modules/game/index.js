/**
 * Основной модуль игры
 * Инициализирует все компоненты игры и предоставляет интерфейс для взаимодействия
 */

import BaseSnail from './snails/Core/BaseSnail.js';
import { SnailFactory } from './snails/factory.js';
import { RaceManager } from './Race/raceManager.js';
import { RaceRenderer } from './Race/raceRenderer.js';

class Game {
    constructor() {
        this.raceManager = null;
        this.renderer = null;
        this.isRunning = false;
        this.lastUpdate = 0;
    }

    /**
     * Инициализирует игру
     * @param {Object} options - Опции инициализации
     * @param {HTMLElement} options.canvas - Canvas элемент для отрисовки
     * @param {number} options.snailCount - Количество улиток в гонке
     */
    initialize(options) {
        // Создаем менеджер гонки
        this.raceManager = new RaceManager({
            snailCount: options.snailCount || 5,
            trackWidth: 800,
            trackHeight: 400,
            finishLine: { x: 750, y: 200 }
        });

        // Создаем рендерер
        this.renderer = new RaceRenderer(options.canvas);
        
        // Инициализируем гонку
        this.raceManager.initializeRace();
        
        console.log('Игра инициализирована');
    }

    /**
     * Запускает игровой цикл
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastUpdate = performance.now();
        
        // Запускаем гонку
        this.raceManager.startRace();
        
        // Запускаем игровой цикл
        this.gameLoop();
        
        console.log('Игра запущена');
    }

    /**
     * Останавливает игру
     */
    stop() {
        this.isRunning = false;
        this.raceManager.endRace();
        console.log('Игра остановлена');
    }

    /**
     * Основной игровой цикл
     */
    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdate) / 1000; // Конвертируем в секунды
        this.lastUpdate = currentTime;

        // Обновляем состояние игры
        this.raceManager.update(deltaTime);

        // Отрисовываем состояние
        this.renderer.render(this.raceManager.getRaceState(), {
            width: 800,
            height: 400,
            finishLine: { x: 750, y: 200 }
        });

        // Планируем следующий кадр
        requestAnimationFrame(() => this.gameLoop());
    }
}

export default Game; 