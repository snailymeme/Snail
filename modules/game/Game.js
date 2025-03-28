/**
 * Game Module
 * 
 * Основной модуль игры "Snail to Riches", который координирует все компоненты
 * и управляет игровым процессом.
 * 
 * @module Game
 * @author Snail to Riches Team
 * @version 1.0.0
 */

import { SnailFactory } from '../snails/factory.js';
import { MazeGenerator } from './Maze/Generator/mazeGenerator.js';
import { RaceTrack } from '../track/racetrack.js';
import { WalletManager } from '../wallet/manager.js';
import { UIManager } from '../ui/manager.js';
import { SoundManager } from '../sound/manager.js';
import { CONFIG } from '../../config.js';
import { EventEmitter } from '../utils/eventEmitter.js';
import { Logger } from '../utils/logger.js';

/**
 * Константы для состояний игры
 * @enum {string}
 */
const STAGES = {
    SELECTION: 'selection',
    RACING: 'racing',
    RESULTS: 'results',
    ERROR: 'error'
};

export class Game extends EventEmitter {
    /**
     * Создает экземпляр игры
     * @throws {Error} Если CONFIG не определен
     */
    constructor() {
        super();
        
        if (!CONFIG) {
            throw new Error('CONFIG is not defined');
        }
        
        // Валидация конфигурации
        if (!this.validateConfig()) {
            throw new Error('Invalid game configuration');
        }
        
        // Инициализация логгера
        this.logger = new Logger('Game');
        this.logger.info('Initializing game instance');
        
        this.state = {
            stage: STAGES.SELECTION,
            selectedSnail: null,
            betAmount: 0,
            isWalletConnected: false,
            raceStarted: false,
            raceFinished: false,
            isPaused: false,
            winner: null,
            positions: [],
            winnings: 0,
            raceTime: 0,
            maze: null,
            // Статистика игрока
            raceCount: 0,
            wins: 0,
            totalWinnings: 0,
            totalBets: 0
        };
        
        try {
            this.snailFactory = new SnailFactory();
            this.mazeGenerator = new MazeGenerator(
                CONFIG.MAZE.WIDTH || 20, 
                CONFIG.MAZE.HEIGHT || 20
            );
            this.raceTrack = null;
            this.walletManager = new WalletManager();
            this.uiManager = new UIManager(this);
            this.soundManager = new SoundManager();
            
            this.telegramApp = window.Telegram?.WebApp;
            this.snails = [];
            this.timer = null;
        } catch (error) {
            this.logger.error('Error during game construction:', error);
            throw new Error('Failed to initialize game components: ' + error.message);
        }
    }

    /**
     * Инициализирует игру, настраивает обработчики событий и компоненты
     * @returns {Promise<Game>} Экземпляр игры
     * @throws {Error} Если инициализация не удалась
     */
    async init() {
        this.logger.info('Initializing Snail to Riches game...');
        
        try {
            // Проверка на наличие Telegram WebApp
            if (this.telegramApp) {
                try {
                    this.telegramApp.ready();
                    this.telegramApp.expand();
                    
                    // Получение пользовательских данных из Telegram
                    const user = this.telegramApp.initDataUnsafe?.user;
                    if (user) {
                        this.logger.info(`User ${user.username || user.id} started the game`);
                        // Загрузка статистики пользователя, если доступно
                        await this.loadUserStatistics(user.id);
                    }
                } catch (telegramError) {
                    this.logger.error('Telegram WebApp initialization error:', telegramError);
                }
            } else {
                this.logger.warn('Telegram WebApp not detected, running in standalone mode');
            }
            
            // Проверка состояния сети
            const isNetworkAvailable = await this.checkNetworkStatus();
            if (!isNetworkAvailable) {
                this.logger.warn('Network is not fully available, some features may be limited');
            }
            
            // Инициализация компонентов
            await this.walletManager.init();
            this.walletManager.on('connect', () => this.onWalletConnect());
            this.walletManager.on('disconnect', () => this.onWalletDisconnect());
            
            // Генерация улиток
            this.snails = this.snailFactory.generateSnails(CONFIG.RACE.SNAIL_COUNT);
            if (!this.snails || this.snails.length === 0) {
                throw new Error('Failed to generate snails');
            }
            
            // Инициализация UI
            await this.uiManager.init();
            this.uiManager.renderSnailSelection(this.snails);
            
            // Установка обработчиков событий UI
            this.setupEventListeners();
            
            // Установка обработчиков жизненного цикла
            this.setupLifecycleHandlers();
            
            // Загрузка звуков
            await this.soundManager.loadSounds();
            
            // Попытка восстановления после предыдущего сбоя
            const storedState = localStorage.getItem('gameState');
            if (storedState) {
                try {
                    const parsed = JSON.parse(storedState);
                    if (parsed.needsRecovery) {
                        await this.recoverFromCrash();
                    }
                } catch (recoveryError) {
                    this.logger.error('Failed to parse stored game state', recoveryError);
                }
            }
            
            this.emit('game-initialized');
            this.logger.info('Game initialized successfully');
            return this;
        } catch (error) {
            this.logger.error('Game initialization failed:', error);
            this.state.stage = STAGES.ERROR;
            this.uiManager?.showError('Game initialization failed: ' + error.message);
            throw new Error('Game initialization failed: ' + error.message);
        }
    }
    
    /**
     * Загружает статистику пользователя из хранилища
     * @param {string|number} userId - ID пользователя Telegram
     * @returns {Promise<boolean>} Успешность загрузки статистики
     * @private
     */
    async loadUserStatistics(userId) {
        if (!userId) return false;
        
        try {
            // Здесь может быть код для загрузки статистики из базы данных или API
            // Для примера используем localStorage
            const savedStats = localStorage.getItem(`user_stats_${userId}`);
            if (savedStats) {
                const stats = JSON.parse(savedStats);
                this.state.raceCount = stats.races || 0;
                this.state.wins = stats.wins || 0;
                this.state.totalWinnings = stats.totalWinnings || 0;
                this.state.totalBets = stats.totalBets || 0;
                
                this.logger.info(`Loaded statistics for user ${userId}`);
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Failed to load statistics for user ${userId}:`, error);
            return false;
        }
    }
    
    /**
     * Настраивает обработчики событий для пользовательского интерфейса
     * @throws {Error} Если не удалось найти необходимые элементы DOM
     */
    setupEventListeners() {
        try {
            const connectWalletBtn = document.getElementById('connectWallet');
            const startRaceBtn = document.getElementById('startRace');
            const playAgainBtn = document.getElementById('playAgain');
            const betAmountInput = document.getElementById('betAmount');
            const snailGrid = document.querySelector('.snail-grid');
            
            if (!connectWalletBtn || !startRaceBtn || !playAgainBtn || !betAmountInput || !snailGrid) {
                throw new Error('Required UI elements not found');
            }
            
            // Подключение кошелька
            connectWalletBtn.addEventListener('click', () => {
                this.walletManager.connect();
            });
            
            // Начало гонки
            startRaceBtn.addEventListener('click', () => {
                this.startRace().catch(error => {
                    this.logger.error('Error starting race from UI:', error);
                });
            });
            
            // Повторная игра
            playAgainBtn.addEventListener('click', () => {
                this.resetGame();
            });
            
            // Изменение суммы ставки
            betAmountInput.addEventListener('input', (e) => {
                this.updateBetAmount(parseFloat(e.target.value));
            });
            
            // Кнопка отмены гонки (если есть)
            const cancelRaceBtn = document.getElementById('cancelRace');
            if (cancelRaceBtn) {
                cancelRaceBtn.addEventListener('click', () => {
                    this.cancelRace();
                });
            }
            
            // Кнопка паузы (если есть)
            const pauseRaceBtn = document.getElementById('pauseRace');
            if (pauseRaceBtn) {
                pauseRaceBtn.addEventListener('click', () => {
                    if (this.state.isPaused) {
                        this.resumeRace();
                    } else {
                        this.pauseRace();
                    }
                });
            }
            
            // Делегирование события для выбора улитки
            snailGrid.addEventListener('click', (e) => {
                const snailCard = e.target.closest('.snail-card');
                if (snailCard) {
                    const snailId = snailCard.dataset.id;
                    if (snailId) {
                        this.selectSnail(snailId);
                    } else {
                        this.logger.warn('Snail card clicked but no ID found');
                    }
                }
            });
            
            // Обработка событий клавиатуры
            document.addEventListener('keydown', (e) => {
                // Обработка ESC для отмены гонки
                if (e.key === 'Escape' && this.state.raceStarted && !this.state.raceFinished) {
                    this.pauseRace();
                }
                
                // Обработка пробела для паузы/продолжения
                if (e.key === ' ' && this.state.raceStarted) {
                    if (this.state.isPaused) {
                        this.resumeRace();
                    } else {
                        this.pauseRace();
                    }
                    e.preventDefault(); // Предотвращаем прокрутку страницы
                }
            });
            
            // Обработка событий окна
            window.addEventListener('blur', () => {
                // Автоматическая пауза при потере фокуса
                if (this.state.raceStarted && !this.state.raceFinished && !this.state.isPaused) {
                    this.pauseRace();
                }
            });
            
            this.logger.info('Event listeners set up successfully');
        } catch (error) {
            this.logger.error('Failed to set up event listeners:', error);
            throw new Error('Failed to set up UI event handlers: ' + error.message);
        }
    }
    
    /**
     * Обработчик события подключения кошелька
     */
    onWalletConnect() {
        this.state.isWalletConnected = true;
        this.uiManager.updateWalletUI(true, this.walletManager.getBalance());
        this.updateStartButton();
    }
    
    /**
     * Обработчик события отключения кошелька
     */
    onWalletDisconnect() {
        this.state.isWalletConnected = false;
        this.uiManager.updateWalletUI(false);
        this.updateStartButton();
    }
    
    /**
     * Выбирает улитку для ставки
     * @param {string} snailId - ID выбранной улитки
     */
    selectSnail(snailId) {
        const snail = this.snails.find(s => s.id === snailId);
        if (!snail) return;
        
        this.state.selectedSnail = snail;
        this.uiManager.updateSnailSelection(snailId);
        this.updateStartButton();
        this.soundManager.play('select');
    }
    
    /**
     * Обновляет сумму ставки
     * @param {number} amount - Сумма ставки в SOL
     * @returns {number} Итоговая сумма ставки после валидации
     */
    updateBetAmount(amount) {
        if (!amount || isNaN(amount)) {
            this.logger.warn(`Invalid bet amount: ${amount}, setting to minimum`);
            amount = CONFIG.BETTING.MIN_BET;
        }
        
        // Проверка на минимальную и максимальную ставку
        if (amount < CONFIG.BETTING.MIN_BET) {
            this.logger.info(`Bet amount ${amount} below minimum, adjusting to ${CONFIG.BETTING.MIN_BET}`);
            amount = CONFIG.BETTING.MIN_BET;
        } else if (amount > CONFIG.BETTING.MAX_BET) {
            this.logger.info(`Bet amount ${amount} above maximum, adjusting to ${CONFIG.BETTING.MAX_BET}`);
            amount = CONFIG.BETTING.MAX_BET;
        }
        
        // Если подключен кошелек, проверяем баланс
        if (this.state.isWalletConnected) {
            const balance = this.walletManager.getBalance();
            if (balance < amount) {
                this.logger.warn(`Bet amount ${amount} exceeds wallet balance ${balance}`);
                this.uiManager.showWarning(`Your bet exceeds your balance (${balance} SOL)`);
            }
        }
        
        this.state.betAmount = amount;
        this.uiManager.updateBetAmountUI(amount);
        this.updateStartButton();
        
        return amount;
    }
    
    /**
     * Обновляет состояние кнопки "Start Race"
     */
    updateStartButton() {
        const canStart = this.state.isWalletConnected && 
                         this.state.selectedSnail && 
                         this.state.betAmount >= CONFIG.BETTING.MIN_BET;
        
        this.uiManager.updateStartButton(canStart);
    }
    
    /**
     * Размещает ставку через кошелек Phantom
     * @returns {Promise<boolean>} Успешность размещения ставки
     * @throws {Error} Если параметры ставки недействительны или произошла ошибка
     */
    async placeBet() {
        // Валидация параметров
        if (!this.state.isWalletConnected) {
            this.logger.error('Cannot place bet: wallet not connected');
            this.uiManager.showError('Please connect your wallet to place a bet');
            return false;
        }
        
        if (!this.state.selectedSnail) {
            this.logger.error('Cannot place bet: no snail selected');
            this.uiManager.showError('Please select a snail before placing a bet');
            return false;
        }
        
        if (this.state.betAmount <= 0) {
            this.logger.error(`Cannot place bet: invalid bet amount ${this.state.betAmount}`);
            this.uiManager.showError('Please enter a valid bet amount');
            return false;
        }
        
        try {
            // Проверка контракта
            if (!CONFIG.CONTRACT || !CONFIG.CONTRACT.ADDRESS) {
                throw new Error('Contract address not configured');
            }
            
            // Проверка баланса
            const balance = await this.walletManager.getBalance();
            if (balance < this.state.betAmount) {
                this.logger.warn(`Insufficient funds for bet: balance ${balance}, bet ${this.state.betAmount}`);
                this.uiManager.showError(`Insufficient funds for bet. Your balance: ${balance} SOL`);
                return false;
            }
            
            // Информация о транзакции для логирования
            const betInfo = {
                amount: this.state.betAmount,
                snailId: this.state.selectedSnail.id,
                snailName: this.state.selectedSnail.name,
                odds: this.state.selectedSnail.odds,
                contract: CONFIG.CONTRACT.ADDRESS,
                timestamp: new Date().toISOString()
            };
            
            this.logger.info('Placing bet', betInfo);
            
            // Выполнение транзакции
            const success = await this.walletManager.placeBet(
                CONFIG.CONTRACT.ADDRESS,
                this.state.betAmount,
                {
                    snailId: this.state.selectedSnail.id,
                    odds: this.state.selectedSnail.odds,
                    metadata: {
                        gameId: this.generateGameId(),
                        playerInfo: this.getTelegramUserInfo()
                    }
                }
            );
            
            if (success) {
                this.logger.info(`Bet placed successfully: ${this.state.betAmount} SOL on snail ${this.state.selectedSnail.name}`);
                this.soundManager.play('bet');
                this.emit('bet-placed', betInfo);
                return true;
            } else {
                this.logger.error('Failed to place bet, transaction unsuccessful');
                this.uiManager.showError('Failed to place bet. Please try again later.');
                return false;
            }
        } catch (error) {
            this.logger.error('Error placing bet:', error);
            this.uiManager.showError('Transaction error: ' + error.message);
            throw error;
        }
    }
    
    /**
     * Генерирует уникальный ID игры
     * @returns {string} Уникальный ID игры
     * @private
     */
    generateGameId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        return `game_${timestamp}_${random}`;
    }
    
    /**
     * Получает информацию о пользователе Telegram (для метаданных)
     * @returns {Object|null} Информация о пользователе или null
     * @private
     */
    getTelegramUserInfo() {
        if (!this.telegramApp?.initDataUnsafe?.user) {
            return null;
        }
        
        const user = this.telegramApp.initDataUnsafe.user;
        return {
            id: user.id,
            username: user.username || '',
            firstName: user.first_name || '',
            lastName: user.last_name || ''
        };
    }
    
    /**
     * Начинает гонку улиток
     * @returns {Promise<boolean>} Успешность запуска гонки
     * @throws {Error} Если не удалось начать гонку из-за ошибки
     */
    async startRace() {
        if (this.state.raceStarted) {
            this.logger.warn('Race already started, ignoring start request');
            return false;
        }
        
        if (!this.isGameValid()) {
            this.logger.error('Cannot start race: game is in invalid state');
            this.uiManager.showError('Cannot start race: game components not initialized properly');
            return false;
        }
        
        // Проверка состояния сети
        const isNetworkAvailable = await this.checkNetworkStatus();
        if (!isNetworkAvailable) {
            this.logger.error('Cannot start race: network is not available');
            this.uiManager.showError('Cannot start race: network connection issue. Please try again later.');
            return false;
        }
        
        try {
            // Размещение ставки
            const betPlaced = await this.placeBet();
            if (!betPlaced) {
                this.logger.warn('Race not started: bet placement failed');
                return false;
            }
            
            // Обновление статистики ставок
            this.state.totalBets += this.state.betAmount;
            this.state.raceCount++;
            
            // Сохраняем состояние игры для возможного восстановления
            localStorage.setItem('gameState', JSON.stringify({
                timestamp: Date.now(),
                needsRecovery: true,
                stage: 'racing',
                selectedSnailId: this.state.selectedSnail.id,
                betAmount: this.state.betAmount
            }));
            
            // Переключение на экран гонки
            this.state.stage = STAGES.RACING;
            this.state.raceStarted = true;
            this.state.raceTime = 0;
            this.uiManager.switchScreen('raceScreen');
            
            // Генерация лабиринта для гонки
            this.state.maze = this.mazeGenerator.generate(
                CONFIG.MAZE.WIDTH, 
                CONFIG.MAZE.HEIGHT, 
                CONFIG.MAZE.COMPLEXITY
            );
            
            if (!this.state.maze) {
                throw new Error('Failed to generate maze');
            }
            
            // Инициализация трека для гонки
            const canvas = document.getElementById('raceCanvas');
            if (!canvas) {
                throw new Error('Race canvas element not found');
            }
            
            this.raceTrack = new RaceTrack(canvas, this.state.maze, this.snails);
            await this.raceTrack.init();
            
            // Начало гонки
            this.soundManager.play('raceStart');
            this.startRaceTimer();
            
            // Подписка на события гонки
            this.raceTrack.on('position-change', (positions) => {
                this.state.positions = positions;
                this.uiManager.updatePositions(positions);
            });
            
            this.raceTrack.on('race-finished', (results) => {
                this.endRace(results);
                // Очищаем флаг необходимости восстановления
                localStorage.setItem('gameState', JSON.stringify({
                    timestamp: Date.now(),
                    needsRecovery: false
                }));
            });
            
            // Запуск анимации
            await this.raceTrack.startRace();
            
            this.emit('race-started', {
                selectedSnail: this.state.selectedSnail,
                betAmount: this.state.betAmount,
                snailCount: this.snails.length
            });
            
            this.logger.info('Race started successfully');
            return true;
        } catch (error) {
            this.logger.error('Failed to start race:', error);
            this.uiManager.showError('Failed to start race: ' + error.message);
            this.state.raceStarted = false;
            this.state.stage = STAGES.SELECTION;
            this.uiManager.switchScreen('gameSelection');
            throw error;
        }
    }
    
    /**
     * Проверяет валидность состояния игры для запуска гонки
     * @returns {boolean} Готовность игры к запуску гонки
     */
    isGameValid() {
        const isValid = (
            this.snails.length === CONFIG.RACE.SNAIL_COUNT &&
            this.walletManager && this.walletManager.isInitialized &&
            this.state.selectedSnail && 
            this.state.betAmount >= CONFIG.BETTING.MIN_BET
        );
        
        if (!isValid) {
            this.logger.warn('Game state validation failed', {
                snailCount: this.snails.length,
                hasWalletManager: !!this.walletManager,
                walletInitialized: this.walletManager?.isInitialized,
                hasSelectedSnail: !!this.state.selectedSnail,
                betAmount: this.state.betAmount
            });
        }
        
        return isValid;
    }
    
    /**
     * Запускает таймер гонки
     * @returns {number} ID интервала таймера
     */
    startRaceTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        let seconds = this.state.raceTime || 0;
        this.timer = setInterval(() => {
            if (this.state.isPaused) return;
            
            seconds++;
            this.state.raceTime = seconds;
            
            // Форматирование времени (минуты:секунды)
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const formattedTime = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            
            const timerElement = document.getElementById('raceTimer');
            if (timerElement) {
                timerElement.textContent = formattedTime;
            } else {
                this.logger.warn('Race timer element not found');
            }
        }, 1000);
        
        return this.timer;
    }
    
    /**
     * Приостанавливает текущую гонку
     * @returns {boolean} Успешность приостановки гонки
     */
    pauseRace() {
        if (this.state.raceStarted && !this.state.raceFinished) {
            this.state.isPaused = true;
            if (this.raceTrack) {
                this.raceTrack.pause();
            }
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
            this.emit('race-paused');
            this.logger.info('Race paused');
            return true;
        }
        return false;
    }
    
    /**
     * Возобновляет приостановленную гонку
     * @returns {boolean} Успешность возобновления гонки
     */
    resumeRace() {
        if (this.state.isPaused) {
            this.state.isPaused = false;
            if (this.raceTrack) {
                this.raceTrack.resume();
            }
            this.startRaceTimer();
            this.emit('race-resumed');
            this.logger.info('Race resumed');
            return true;
        }
        return false;
    }
    
    /**
     * Отменяет текущую гонку и возвращает в меню выбора
     * @returns {boolean} Успешность отмены гонки
     */
    cancelRace() {
        if (this.state.raceStarted && !this.state.raceFinished) {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
            
            if (this.raceTrack) {
                this.raceTrack.destroy();
                this.raceTrack = null;
            }
            
            this.state.raceStarted = false;
            this.state.isPaused = false;
            this.state.stage = STAGES.SELECTION;
            this.uiManager.switchScreen('gameSelection');
            
            // Возврат ставки (если требуется)
            if (this.state.betAmount > 0 && this.state.isWalletConnected) {
                this.walletManager.refundBet(this.state.betAmount)
                    .catch(error => this.logger.error('Failed to refund bet:', error));
            }
            
            this.emit('race-cancelled');
            this.logger.info('Race cancelled');
            return true;
        }
        return false;
    }
    
    /**
     * Завершает гонку и показывает результаты
     * @param {Object} results - Результаты гонки
     */
    endRace(results) {
        // Остановка таймера
        clearInterval(this.timer);
        
        this.state.raceFinished = true;
        this.state.winner = results.winner;
        
        // Расчет выигрыша
        if (this.state.selectedSnail.id === results.winner.id) {
            this.calculateWinnings();
            this.soundManager.play('win');
        } else {
            this.state.winnings = 0;
            this.soundManager.play('lose');
        }
        
        // Переход к экрану результатов
        setTimeout(() => {
            this.state.stage = 'results';
            this.uiManager.renderResults(results, this.state.winnings, this.state.raceTime);
            this.uiManager.switchScreen('resultsScreen');
        }, CONFIG.RACE.RESULTS_DELAY);
    }
    
    /**
     * Рассчитывает выигрыш на основе ставки и коэффициентов улитки
     * @returns {number} Сумма выигрыша
     */
    calculateWinnings() {
        if (!this.state.selectedSnail) {
            this.logger.error('Cannot calculate winnings: no snail selected');
            return 0;
        }
        
        const odds = this.state.selectedSnail.odds;
        if (!odds || isNaN(odds) || odds <= 0) {
            this.logger.error(`Invalid odds for snail ${this.state.selectedSnail.id}: ${odds}`);
            return 0;
        }
        
        const winnings = this.state.betAmount * odds;
        this.state.winnings = parseFloat(winnings.toFixed(2)); // Округление до 2 знаков
        
        // Обновление статистики
        this.state.wins++;
        this.state.totalWinnings += this.state.winnings;
        
        // Сохранение статистики
        this.saveStatistics().catch(error => {
            this.logger.error('Failed to save statistics:', error);
        });
        
        // Если выигрыш, отправляем токены на кошелек
        if (this.state.winnings > 0 && this.state.isWalletConnected) {
            this.walletManager.processWinnings(this.state.winnings)
                .then(success => {
                    if (!success) {
                        this.logger.error('Failed to process winnings');
                        this.uiManager.showError('Failed to process winnings. Please contact support.');
                    } else {
                        this.logger.info(`Processed winnings: ${this.state.winnings} SOL`);
                    }
                })
                .catch(error => {
                    this.logger.error('Error processing winnings:', error);
                    this.uiManager.showError('Error processing winnings: ' + error.message);
                });
        }
        
        return this.state.winnings;
    }
    
    /**
     * Сохраняет статистику игрока
     * @returns {Promise<boolean>} Успешность сохранения статистики
     */
    async saveStatistics() {
        // Проверка на наличие пользователя Telegram
        const userId = this.telegramApp?.initDataUnsafe?.user?.id;
        
        if (userId) {
            const stats = {
                userId: userId,
                races: this.state.raceCount || 0,
                wins: this.state.wins || 0,
                totalWinnings: this.state.totalWinnings || 0,
                totalBets: this.state.totalBets || 0,
                lastUpdated: new Date().toISOString()
            };
            
            try {
                // Здесь может быть код для сохранения в базу данных или API
                // Для примера используем localStorage
                localStorage.setItem(`user_stats_${userId}`, JSON.stringify(stats));
                
                // Отправка статистики на сервер (если требуется)
                if (CONFIG.API && CONFIG.API.STATS_ENDPOINT) {
                    try {
                        const response = await fetch(CONFIG.API.STATS_ENDPOINT, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(stats)
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error ${response.status}`);
                        }
                    } catch (apiError) {
                        this.logger.error('Failed to send statistics to API:', apiError);
                        // Продолжаем выполнение, так как локальное сохранение все равно выполнено
                    }
                }
                
                this.logger.info(`Statistics saved for user ${userId}`);
                return true;
            } catch (error) {
                this.logger.error(`Failed to save statistics for user ${userId}:`, error);
                return false;
            }
        }
        
        this.logger.warn('Cannot save statistics: no user ID available');
        return false;
    }
    
    /**
     * Возвращает статистику игрока
     * @returns {Object} Объект со статистикой игрока
     */
    getStatistics() {
        return {
            races: this.state.raceCount || 0,
            wins: this.state.wins || 0,
            totalWinnings: this.state.totalWinnings || 0,
            totalBets: this.state.totalBets || 0,
            winRate: this.state.raceCount ? (this.state.wins / this.state.raceCount * 100).toFixed(1) + '%' : '0%',
            averageBet: this.state.raceCount ? (this.state.totalBets / this.state.raceCount).toFixed(2) : '0',
            netProfit: (this.state.totalWinnings - this.state.totalBets).toFixed(2)
        };
    }
    
    /**
     * Сбрасывает игру для начала нового раунда
     * @returns {boolean} Успешность сброса игры
     */
    resetGame() {
        try {
            // Сохранение статистики перед сбросом
            this.saveStatistics().catch(error => {
                this.logger.error('Failed to save statistics during reset:', error);
            });
            
            // Сброс состояния гонки
            this.state.stage = STAGES.SELECTION;
            this.state.selectedSnail = null;
            this.state.raceStarted = false;
            this.state.raceFinished = false;
            this.state.isPaused = false;
            this.state.winner = null;
            this.state.positions = [];
            this.state.winnings = 0;
            this.state.raceTime = 0;
            this.state.maze = null;
            
            // Сохраняем общую статистику (не сбрасываем)
            // this.state.raceCount, this.state.wins, this.state.totalWinnings, this.state.totalBets - остаются
            
            // Сброс UI
            this.uiManager.resetUI();
            this.uiManager.switchScreen('gameSelection');
            
            // Генерация новых улиток с разными характеристиками
            this.snails = this.snailFactory.generateSnails(CONFIG.RACE.SNAIL_COUNT);
            
            if (!this.snails || this.snails.length === 0) {
                throw new Error('Failed to generate new snails');
            }
            
            this.uiManager.renderSnailSelection(this.snails);
            
            // Очистка таймера и трека
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
            
            if (this.raceTrack) {
                this.raceTrack.destroy();
                this.raceTrack = null;
            }
            
            // Оптимизация производительности
            this.optimizePerformance();
            
            this.emit('game-reset');
            this.logger.info('Game reset, ready for new round');
            
            // Если кошелек был подключен, обновляем баланс
            if (this.state.isWalletConnected) {
                this.walletManager.getBalance()
                    .then(balance => {
                        this.uiManager.updateWalletUI(true, balance);
                    })
                    .catch(error => {
                        this.logger.error('Failed to update wallet balance:', error);
                    });
            }
            
            return true;
        } catch (error) {
            this.logger.error('Error resetting game:', error);
            this.uiManager.showError('Failed to reset game: ' + error.message);
            return false;
        }
    }
    
    /**
     * Возвращает текущее состояние игры
     * @returns {Object} Состояние игры
     */
    getState() {
        return { ...this.state };
    }
}

// Экспорт синглтона игры
export default new Game(); 