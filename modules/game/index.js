/**
 * Основной модуль игры
 * Инициализирует все компоненты игры и предоставляет интерфейс для взаимодействия
 */

const { initializeSnails } = require('./Snails/Core/SnailFactory');
const { initializeMaze } = require('./Maze/Generator/mazeGenerator');
const { initializeRace } = require('./Race/race');
const { initializeBetting } = require('./Betting/betting');
const { initializeBlockchain } = require('./blockchain/Wallet/wallet');

class Game {
    constructor() {
        this.snails = null;
        this.maze = null;
        this.race = null;
        this.betting = null;
        this.blockchain = null;
    }

    /**
     * Инициализирует все компоненты игры
     */
    async initialize() {
        try {
            // Инициализация компонентов
            this.snails = await initializeSnails();
            this.maze = await initializeMaze();
            this.race = await initializeRace(this.snails, this.maze);
            this.betting = await initializeBetting(this.race);
            this.blockchain = await initializeBlockchain();

            console.log('Game initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize game:', error);
            return false;
        }
    }

    /**
     * Начинает новую гонку
     * @param {Object} bet - Информация о ставке
     * @returns {Promise<Object>} Результат гонки
     */
    async startRace(bet) {
        try {
            // Проверка ставки через blockchain
            const isValidBet = await this.blockchain.validateBet(bet);
            if (!isValidBet) {
                throw new Error('Invalid bet');
            }

            // Начало гонки
            const result = await this.race.start();
            
            // Обработка результата и выплата выигрыша
            if (result.winner === bet.snailColor) {
                await this.blockchain.processWin(bet);
            }

            return result;
        } catch (error) {
            console.error('Error during race:', error);
            throw error;
        }
    }
}

// Создаем единственный экземпляр игры
const game = new Game();

module.exports = game; 