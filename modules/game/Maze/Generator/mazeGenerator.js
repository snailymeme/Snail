/**
 * @fileoverview Генератор лабиринтов для игры "Snail to Riches".
 * Создает случайные лабиринты различной сложности с использованием алгоритма "Recursive Backtracking".
 * 
 * @module MazeGenerator
 * @author Snail to Riches Team
 * @version 1.2.0
 */

import { CONFIG } from '../../constants/config.js';
import { Logger } from '../../common/utils/logger.js';
import { 
    CellTypes, 
    DifficultyLevels, 
    Directions, 
    DirectionOffsets, 
    PathfindingSettings 
} from '../../constants/assets.js';
import { ValidationError, InitializationError } from '../../common/utils/errors.js';

/**
 * Класс для генерации лабиринтов
 */
export class MazeGenerator {
    /**
     * Создает экземпляр генератора лабиринта
     * 
     * @param {Object} options - Опции для генерации лабиринта
     * @param {number} [options.rows] - Количество строк в лабиринте
     * @param {number} [options.cols] - Количество столбцов в лабиринте
     * @param {string} [options.difficulty='medium'] - Уровень сложности лабиринта
     * @throws {ValidationError} Если параметры невалидны
     * @throws {InitializationError} Если не удалось инициализировать генератор
     */
    constructor(options = {}) {
        try {
            this.logger = new Logger('MazeGenerator', {
                level: CONFIG?.LOGGER?.LEVEL || 1,
                useColors: true,
                showTimestamp: true
            });
            
            this.logger.debug('Initializing maze generator');
            
            // Получаем параметры из опций или конфига
            this.rows = options.rows || CONFIG.MAZE.HEIGHT || 20;
            this.cols = options.cols || CONFIG.MAZE.WIDTH || 20;
            this.difficulty = options.difficulty || CONFIG.MAZE.DIFFICULTY || DifficultyLevels.MEDIUM;
            
            // Валидация параметров
            this.validateParameters();
            
            // Получаем настройки поиска пути
            this.pathfindingSettings = PathfindingSettings;
            
            this.logger.info(`Maze generator initialized with size ${this.rows}x${this.cols}, difficulty: ${this.difficulty}`);
            
        } catch (error) {
            throw new InitializationError(`Failed to initialize maze generator: ${error.message}`, {
                module: 'MazeGenerator',
                data: { options }
            });
        }
    }
    
    /**
     * Валидирует параметры лабиринта
     * 
     * @private
     * @throws {ValidationError} Если параметры невалидны
     */
    validateParameters() {
        // Проверка размеров
        if (!Number.isInteger(this.rows) || this.rows < 5) {
            throw new ValidationError(`Invalid rows value: ${this.rows}. Must be an integer >= 5`, {
                module: 'MazeGenerator'
            });
        }
        
        if (!Number.isInteger(this.cols) || this.cols < 5) {
            throw new ValidationError(`Invalid cols value: ${this.cols}. Must be an integer >= 5`, {
                module: 'MazeGenerator'
            });
        }
        
        // Верхний предел для предотвращения проблем с производительностью
        const maxSize = CONFIG.MAZE.MAX_SIZE || 50;
        if (this.rows > maxSize || this.cols > maxSize) {
            this.logger.warn(`Maze size exceeds recommended maximum (${maxSize}x${maxSize}). Performance may be affected.`);
        }
        
        // Проверка уровня сложности
        const validDifficulties = Object.values(DifficultyLevels);
        if (!validDifficulties.includes(this.difficulty)) {
            this.logger.warn(`Invalid difficulty: ${this.difficulty}. Using '${DifficultyLevels.MEDIUM}' as default.`);
            this.difficulty = DifficultyLevels.MEDIUM;
        }
    }
    
    /**
     * Генерирует новый лабиринт
     * 
     * @returns {number[][]} Матрица лабиринта
     * @throws {Error} Если не удалось сгенерировать валидный лабиринт
     */
    generate() {
        this.logger.debug('Starting maze generation');
        
        try {
            // Инициализируем пустой лабиринт
            this.maze = Array(this.rows).fill().map(() => Array(this.cols).fill(CellTypes.WALL));
            
            // Генерируем базовый лабиринт
            this.generateBaseMaze();
            
            // Добавляем старт и финиш
            this.addStartAndFinish();
            
            // Настраиваем сложность
            this.adjustDifficulty();
            
            // Проверяем существование пути
            if (!this.ensurePathExists()) {
                throw new Error('Failed to generate valid maze: no path exists');
            }
            
            // Обеспечиваем стены по границам
            this.ensureBoundaryWalls();
            
            this.logger.info('Maze generated successfully');
            return this.maze;
            
        } catch (error) {
            this.logger.error('Failed to generate maze:', error);
            throw error;
        }
    }
    
    /**
     * Генерирует базовый лабиринт используя алгоритм Recursive Backtracking
     * 
     * @private
     */
    generateBaseMaze() {
        const stack = [];
        const start = [1, 1];
        
        // Начинаем с начальной точки
        this.maze[start[0]][start[1]] = CellTypes.EMPTY;
        stack.push(start);
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current[0], current[1]);
            
            if (neighbors.length === 0) {
                stack.pop();
                continue;
            }
            
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            this.createPath(current, next);
            stack.push(next);
        }
    }
    
    /**
     * Получает непосещенных соседей для текущей ячейки
     * 
     * @private
     * @param {number} row - Номер строки
     * @param {number} col - Номер столбца
     * @returns {Array<[number, number]>} Массив координат непосещенных соседей
     */
    getUnvisitedNeighbors(row, col) {
        const neighbors = [];
        
        for (const [direction, offset] of Object.entries(DirectionOffsets)) {
            const newRow = row + offset.row * 2;
            const newCol = col + offset.col * 2;
            
            if (this.isValidCell(newRow, newCol) && 
                this.maze[newRow][newCol] === CellTypes.WALL) {
                neighbors.push([newRow, newCol]);
            }
        }
        
        return neighbors;
    }
    
    /**
     * Создает путь между двумя ячейками
     * 
     * @private
     * @param {[number, number]} from - Начальная ячейка
     * @param {[number, number]} to - Конечная ячейка
     */
    createPath(from, to) {
        const [row1, col1] = from;
        const [row2, col2] = to;
        
        // Создаем путь между ячейками
        this.maze[row1 + (row2 - row1) / 2][col1 + (col2 - col1) / 2] = CellTypes.EMPTY;
        this.maze[row2][col2] = CellTypes.EMPTY;
    }
    
    /**
     * Добавляет старт и финиш в лабиринт
     * 
     * @private
     */
    addStartAndFinish() {
        // Добавляем старт
        this.maze[1][1] = CellTypes.START;
        
        // Находим дальнюю точку для финиша
        const finish = this.findDistantPoint(1, 1);
        this.maze[finish[0]][finish[1]] = CellTypes.FINISH;
    }
    
    /**
     * Находит дальнюю точку от заданной
     * 
     * @private
     * @param {number} startRow - Начальная строка
     * @param {number} startCol - Начальный столбец
     * @returns {[number, number]} Координаты дальней точки
     */
    findDistantPoint(startRow, startCol) {
        const distances = Array(this.rows).fill().map(() => Array(this.cols).fill(Infinity));
        distances[startRow][startCol] = 0;
        
        const queue = [[startRow, startCol]];
        let maxDist = 0;
        let maxPoint = [startRow, startCol];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
            for (const offset of Object.values(DirectionOffsets)) {
                const newRow = row + offset.row;
                const newCol = col + offset.col;
                
                if (this.isValidCell(newRow, newCol) && 
                    this.maze[newRow][newCol] !== CellTypes.WALL &&
                    distances[newRow][newCol] === Infinity) {
                    
                    distances[newRow][newCol] = distances[row][col] + 1;
                    queue.push([newRow, newCol]);
                    
                    if (distances[newRow][newCol] > maxDist) {
                        maxDist = distances[newRow][newCol];
                        maxPoint = [newRow, newCol];
                    }
                }
            }
        }
        
        return maxPoint;
    }
    
    /**
     * Настраивает сложность лабиринта
     * 
     * @private
     */
    adjustDifficulty() {
        const difficultySettings = {
            [DifficultyLevels.EASY]: { wallCount: 0.1, pathCount: 0.2 },
            [DifficultyLevels.MEDIUM]: { wallCount: 0.2, pathCount: 0.1 },
            [DifficultyLevels.HARD]: { wallCount: 0.3, pathCount: 0.05 },
            [DifficultyLevels.EXTREME]: { wallCount: 0.4, pathCount: 0.02 }
        };
        
        const settings = difficultySettings[this.difficulty];
        
        // Добавляем случайные стены
        this.addRandomWalls(settings.wallCount);
        
        // Добавляем случайные пути
        this.addRandomPaths(settings.pathCount);
    }
    
    /**
     * Добавляет случайные стены в лабиринт
     * 
     * @private
     * @param {number} ratio - Доля ячеек, которые нужно превратить в стены
     */
    addRandomWalls(ratio) {
        const cells = this.rows * this.cols;
        const wallCount = Math.floor(cells * ratio);
        
        for (let i = 0; i < wallCount; i++) {
            const row = Math.floor(Math.random() * (this.rows - 2)) + 1;
            const col = Math.floor(Math.random() * (this.cols - 2)) + 1;
            
            if (this.maze[row][col] === CellTypes.EMPTY) {
                this.maze[row][col] = CellTypes.WALL;
            }
        }
    }
    
    /**
     * Добавляет случайные пути в лабиринт
     * 
     * @private
     * @param {number} ratio - Доля ячеек, которые нужно превратить в пути
     */
    addRandomPaths(ratio) {
        const cells = this.rows * this.cols;
        const pathCount = Math.floor(cells * ratio);
        
        for (let i = 0; i < pathCount; i++) {
            const row = Math.floor(Math.random() * (this.rows - 2)) + 1;
            const col = Math.floor(Math.random() * (this.cols - 2)) + 1;
            
            if (this.maze[row][col] === CellTypes.WALL) {
                this.maze[row][col] = CellTypes.EMPTY;
            }
        }
    }
    
    /**
     * Проверяет существование пути от старта к финишу
     * 
     * @private
     * @returns {boolean} true если путь существует
     */
    ensurePathExists() {
        const start = this.findCell(CellTypes.START);
        const finish = this.findCell(CellTypes.FINISH);
        
        if (!start || !finish) {
            return false;
        }
        
        const path = this.findPath(start[0], start[1], finish[0], finish[1]);
        return path !== null;
    }
    
    /**
     * Находит ячейку заданного типа
     * 
     * @private
     * @param {number} type - Тип ячейки
     * @returns {[number, number]|null} Координаты ячейки или null если не найдена
     */
    findCell(type) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.maze[row][col] === type) {
                    return [row, col];
                }
            }
        }
        return null;
    }
    
    /**
     * Находит путь между двумя точками используя A*
     * 
     * @private
     * @param {number} startRow - Начальная строка
     * @param {number} startCol - Начальный столбец
     * @param {number} endRow - Конечная строка
     * @param {number} endCol - Конечный столбец
     * @returns {Array<[number, number]>|null} Путь или null если путь не найден
     */
    findPath(startRow, startCol, endRow, endCol) {
        const openSet = new Set([[startRow, startCol]]);
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        gScore.set(`${startRow},${startCol}`, 0);
        fScore.set(`${startRow},${startCol}`, this.heuristic(startRow, startCol, endRow, endCol));
        
        let iterations = 0;
        
        while (openSet.size > 0 && iterations < this.pathfindingSettings.MAX_ITERATIONS) {
            iterations++;
            
            // Находим ячейку с минимальным fScore в открытом множестве
            let current = null;
            let minFScore = Infinity;
            
            for (const [row, col] of openSet) {
                const f = fScore.get(`${row},${col}`);
                if (f < minFScore) {
                    minFScore = f;
                    current = [row, col];
                }
            }
            
            if (!current) {
                break;
            }
            
            const [row, col] = current;
            
            // Если достигли цели
            if (row === endRow && col === endCol) {
                return this.reconstructPath(cameFrom, current);
            }
            
            openSet.delete(current);
            closedSet.add(current);
            
            // Проверяем соседей
            for (const offset of Object.values(DirectionOffsets)) {
                const neighbor = [row + offset.row, col + offset.col];
                
                if (!this.isValidCell(neighbor[0], neighbor[1]) || 
                    this.maze[neighbor[0]][neighbor[1]] === CellTypes.WALL ||
                    closedSet.has(neighbor)) {
                    continue;
                }
                
                const tentativeGScore = gScore.get(`${row},${col}`) + 1;
                
                if (!openSet.has(neighbor)) {
                    openSet.add(neighbor);
                    gScore.set(`${neighbor[0]},${neighbor[1]}`, tentativeGScore);
                    fScore.set(`${neighbor[0]},${neighbor[1]}`, 
                        tentativeGScore + this.heuristic(neighbor[0], neighbor[1], endRow, endCol));
                    cameFrom.set(`${neighbor[0]},${neighbor[1]}`, current);
                } else if (tentativeGScore < gScore.get(`${neighbor[0]},${neighbor[1]}`)) {
                    gScore.set(`${neighbor[0]},${neighbor[1]}`, tentativeGScore);
                    fScore.set(`${neighbor[0]},${neighbor[1]}`, 
                        tentativeGScore + this.heuristic(neighbor[0], neighbor[1], endRow, endCol));
                    cameFrom.set(`${neighbor[0]},${neighbor[1]}`, current);
                }
            }
        }
        
        return null;
    }
    
    /**
     * Восстанавливает путь из карты предшественников
     * 
     * @private
     * @param {Map} cameFrom - Карта предшественников
     * @param {[number, number]} current - Текущая точка
     * @returns {Array<[number, number]>} Путь
     */
    reconstructPath(cameFrom, current) {
        const path = [current];
        
        while (cameFrom.has(`${current[0]},${current[1]}`)) {
            current = cameFrom.get(`${current[0]},${current[1]}`);
            path.unshift(current);
        }
        
        return path;
    }
    
    /**
     * Вычисляет эвристическую оценку для A*
     * 
     * @private
     * @param {number} row1 - Первая строка
     * @param {number} col1 - Первый столбец
     * @param {number} row2 - Вторая строка
     * @param {number} col2 - Второй столбец
     * @returns {number} Эвристическая оценка
     */
    heuristic(row1, col1, row2, col2) {
        return Math.abs(row2 - row1) + Math.abs(col2 - col1) * this.pathfindingSettings.HEURISTIC_WEIGHT;
    }
    
    /**
     * Проверяет валидность координат ячейки
     * 
     * @private
     * @param {number} row - Номер строки
     * @param {number} col - Номер столбца
     * @returns {boolean} true если координаты валидны
     */
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    
    /**
     * Проверка и обеспечение стен по внешним границам лабиринта
     * 
     * @private
     */
    ensureBoundaryWalls() {
        // Верхняя и нижняя границы
        for (let col = 0; col < this.cols; col++) {
            this.maze[0][col] = CellTypes.WALL;
            this.maze[this.rows - 1][col] = CellTypes.WALL;
        }
        
        // Левая и правая границы
        for (let row = 0; row < this.rows; row++) {
            this.maze[row][0] = CellTypes.WALL;
            this.maze[row][this.cols - 1] = CellTypes.WALL;
        }
        
        this.logger.debug('Boundary walls added');
    }
    
    /**
     * Сериализация лабиринта для сохранения или передачи
     * 
     * @param {Object} mazeData - Объект с данными лабиринта
     * @returns {string} JSON-строка с данными лабиринта
     */
    serializeMaze(mazeData) {
        try {
            return JSON.stringify({
                grid: mazeData.grid,
                start: mazeData.start,
                finish: mazeData.finish,
                metadata: {
                    rows: this.rows,
                    cols: this.cols,
                    difficulty: this.difficulty,
                    timestamp: Date.now()
                }
            });
        } catch (error) {
            this.logger.error('Failed to serialize maze:', error);
            throw new Error(`Failed to serialize maze: ${error.message}`);
        }
    }
    
    /**
     * Десериализация лабиринта из JSON-строки
     * 
     * @param {string} serializedMaze - JSON-строка с данными лабиринта
     * @returns {Object} Объект с данными лабиринта
     * @throws {Error} Если десериализация не удалась
     */
    deserializeMaze(serializedMaze) {
        try {
            const mazeData = JSON.parse(serializedMaze);
            
            if (!mazeData.grid || !mazeData.start || !mazeData.finish) {
                throw new Error('Invalid maze data: missing required fields');
            }
            
            return mazeData;
        } catch (error) {
            this.logger.error('Failed to deserialize maze:', error);
            throw new Error(`Failed to deserialize maze: ${error.message}`);
        }
    }
}