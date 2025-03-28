/**
 * @fileoverview Генератор лабиринтов для игры "Snail to Riches".
 * Создает случайные лабиринты различной сложности с использованием алгоритма "Recursive Backtracking".
 * 
 * @module MazeGenerator
 * @author Snail to Riches Team
 * @version 1.1.0
 */

import { CONFIG } from '../../../config.js';
import { Logger } from '../../utils/logger.js';
import { CellTypes } from '../constants.js';
import { ValidationError } from '../../utils/errors.js';

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
     * @param {string} [options.difficulty='medium'] - Уровень сложности лабиринта (easy, medium, hard, extreme)
     * @throws {ValidationError} Если параметры невалидны
     */
    constructor(options = {}) {
        this.logger = new Logger('MazeGenerator');
        this.logger.debug('Initializing maze generator');
        
        // Получаем параметры из опций или конфига
        this.rows = options.rows || CONFIG.MAZE.HEIGHT || 20;
        this.cols = options.cols || CONFIG.MAZE.WIDTH || 20;
        this.difficulty = options.difficulty || CONFIG.MAZE.DIFFICULTY || 'medium';
        
        // Валидация параметров
        this.validateParameters();
        
        // Получаем типы ячеек лабиринта
        this.cellTypes = CellTypes;
        
        this.logger.info(`Maze generator initialized with size ${this.rows}x${this.cols}, difficulty: ${this.difficulty}`);
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
            throw new ValidationError(`Invalid rows value: ${this.rows}. Must be an integer >= 5`);
        }
        
        if (!Number.isInteger(this.cols) || this.cols < 5) {
            throw new ValidationError(`Invalid cols value: ${this.cols}. Must be an integer >= 5`);
        }
        
        // Верхний предел для предотвращения проблем с производительностью
        const maxSize = CONFIG.MAZE.MAX_SIZE || 50;
        if (this.rows > maxSize || this.cols > maxSize) {
            this.logger.warn(`Maze size exceeds recommended maximum (${maxSize}x${maxSize}). Performance may be affected.`);
        }
        
        // Проверка уровня сложности
        const validDifficulties = ['easy', 'medium', 'hard', 'extreme'];
        if (!validDifficulties.includes(this.difficulty)) {
            this.logger.warn(`Invalid difficulty: ${this.difficulty}. Using 'medium' as default.`);
            this.difficulty = 'medium';
        }
    }
    
    /**
     * Генерирует лабиринт с использованием алгоритма "Recursive Backtracking"
     * 
     * @returns {Object} Объект с сгенерированным лабиринтом
     * @property {Array<Array<number>>} grid - Двумерный массив лабиринта
     * @property {Object} start - Координаты стартовой точки {row, col}
     * @property {Object} finish - Координаты финишной точки {row, col}
     * @throws {Error} Если генерация не удалась
     */
    generate() {
        try {
            this.logger.info('Starting maze generation');
            this.logger.debug(`Maze parameters: size=${this.rows}x${this.cols}, difficulty=${this.difficulty}`);
            
            // Инициализируем массив лабиринта стенами
            let maze = new Array(this.rows).fill().map(() => new Array(this.cols).fill(this.cellTypes.WALL));
            
            // Начинаем с случайной точки (нечетные координаты для клеток пути)
            const startRow = 1 + 2 * Math.floor(Math.random() * Math.floor((this.rows - 3) / 2));
            const startCol = 1 + 2 * Math.floor(Math.random() * Math.floor((this.cols - 3) / 2));
            
            maze[startRow][startCol] = this.cellTypes.EMPTY;
            
            // Используем рекурсивный алгоритм построения лабиринта
            this.carvePassages(maze, startRow, startCol);
            
            // Устанавливаем стартовую точку
            maze[startRow][startCol] = this.cellTypes.START;
            
            // Ищем дальнюю точку для финиша
            const finishPoint = this.findDistantPoint(maze, startRow, startCol);
            maze[finishPoint.row][finishPoint.col] = this.cellTypes.FINISH;
            
            // Настраиваем сложность лабиринта
            maze = this.adjustDifficulty(maze, startRow, startCol, finishPoint.row, finishPoint.col);
            
            // Проверяем и обеспечиваем проходимость лабиринта
            maze = this.ensurePathExists(maze, startRow, startCol, finishPoint.row, finishPoint.col);
            
            // Проверяем и обеспечиваем стены по внешним границам
            maze = this.ensureBoundaryWalls(maze);
            
            this.logger.info('Maze generation completed successfully');
            
            return {
                grid: maze,
                start: { row: startRow, col: startCol },
                finish: finishPoint
            };
        } catch (error) {
            this.logger.error('Failed to generate maze:', error);
            throw new Error(`Maze generation failed: ${error.message}`);
        }
    }
    
    /**
     * Рекурсивное построение путей в лабиринте
     * 
     * @private
     * @param {Array<Array<number>>} maze - Двумерный массив лабиринта
     * @param {number} row - Текущая строка
     * @param {number} col - Текущий столбец
     */
    carvePassages(maze, row, col) {
        // Определение возможных направлений движения (смещение на 2 ячейки)
        const directions = [
            [-2, 0], // Вверх
            [2, 0],  // Вниз
            [0, -2], // Влево
            [0, 2]   // Вправо
        ];
        
        // Перемешиваем направления для случайного построения
        let shuffledDirections = this.shuffleArray([...directions]);
        
        // Проходим по всем направлениям
        for (let [dRow, dCol] of shuffledDirections) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            // Проверяем, что новая позиция внутри лабиринта и еще не посещена
            if (this.isInBounds(newRow, newCol, maze.length, maze[0].length) && 
                maze[newRow][newCol] === this.cellTypes.WALL) {
                
                // Прорубаем проход (и промежуточную ячейку)
                maze[row + dRow / 2][col + dCol / 2] = this.cellTypes.EMPTY;
                maze[newRow][newCol] = this.cellTypes.EMPTY;
                
                // Рекурсивно продолжаем с новой позиции
                this.carvePassages(maze, newRow, newCol);
            }
        }
    }
    
    /**
     * Поиск наиболее удаленной точки от старта для размещения финиша
     * 
     * @private
     * @param {Array<Array<number>>} maze - Двумерный массив лабиринта
     * @param {number} startRow - Строка стартовой точки
     * @param {number} startCol - Столбец стартовой точки
     * @returns {Object} Координаты наиболее удаленной точки {row, col, distance}
     */
    findDistantPoint(maze, startRow, startCol) {
        this.logger.debug(`Finding distant point from (${startRow}, ${startCol})`);
        
        // Используем алгоритм поиска в ширину (BFS)
        const queue = [{ row: startRow, col: startCol, distance: 0 }];
        const visited = new Set([`${startRow},${startCol}`]);
        
        let farthestPoint = { row: startRow, col: startCol, distance: 0 };
        
        // Направления для BFS
        const directions = [
            [-1, 0], // Вверх
            [1, 0],  // Вниз
            [0, -1], // Влево
            [0, 1]   // Вправо
        ];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // Если нашли точку дальше предыдущей, обновляем farthestPoint
            if (current.distance > farthestPoint.distance) {
                farthestPoint = current;
            }
            
            // Проверяем все направления
            for (let [dRow, dCol] of directions) {
                const newRow = current.row + dRow;
                const newCol = current.col + dCol;
                const key = `${newRow},${newCol}`;
                
                // Проверяем, что новая позиция внутри лабиринта, проходима и еще не посещена
                if (this.isInBounds(newRow, newCol, maze.length, maze[0].length) && 
                    maze[newRow][newCol] === this.cellTypes.EMPTY && 
                    !visited.has(key)) {
                    
                    visited.add(key);
                    queue.push({ 
                        row: newRow, 
                        col: newCol, 
                        distance: current.distance + 1 
                    });
                }
            }
        }
        
        this.logger.debug(`Found farthest point at (${farthestPoint.row}, ${farthestPoint.col}) with distance ${farthestPoint.distance}`);
        return farthestPoint;
    }
    
    /**
     * Настройка сложности лабиринта
     * 
     * @private
     * @param {Array<Array<number>>} maze - Двумерный массив лабиринта
     * @param {number} startRow - Строка стартовой точки
     * @param {number} startCol - Столбец стартовой точки
     * @param {number} finishRow - Строка финишной точки
     * @param {number} finishCol - Столбец финишной точки
     * @returns {Array<Array<number>>} Модифицированный лабиринт
     */
    adjustDifficulty(maze, startRow, startCol, finishRow, finishCol) {
        this.logger.info(`Adjusting maze difficulty to: ${this.difficulty}`);
        
        let pathCount, wallCount;
        let modifiedMaze = JSON.parse(JSON.stringify(maze)); // Глубокое копирование
        
        switch (this.difficulty) {
            case 'easy':
                // Для легкого уровня делаем больше проходов
                pathCount = Math.floor(this.rows * this.cols * 0.15); // 15% от общего количества клеток
                modifiedMaze = this.addRandomPaths(modifiedMaze, pathCount, startRow, startCol, finishRow, finishCol);
                break;
            case 'medium':
                // Для среднего уровня добавляем умеренное количество проходов
                pathCount = Math.floor(this.rows * this.cols * 0.1); // 10% от общего количества клеток
                modifiedMaze = this.addRandomPaths(modifiedMaze, pathCount, startRow, startCol, finishRow, finishCol);
                break;
            case 'hard':
                // Для сложного уровня добавляем дополнительные стены
                wallCount = Math.floor(this.rows * this.cols * 0.05); // 5% от общего количества клеток
                modifiedMaze = this.addRandomWalls(modifiedMaze, wallCount, startRow, startCol, finishRow, finishCol);
                break;
            case 'extreme':
                // Для экстремального уровня добавляем много дополнительных стен
                wallCount = Math.floor(this.rows * this.cols * 0.1); // 10% от общего количества клеток
                modifiedMaze = this.addRandomWalls(modifiedMaze, wallCount, startRow, startCol, finishRow, finishCol);
                break;
        }
        
        this.logger.debug(`Maze difficulty adjusted to ${this.difficulty}`);
        return modifiedMaze;
    }
    
    /**
     * Добавление случайных проходов для упрощения лабиринта
     * 
     * @private
     * @param {Array<Array<number>>} maze - Двумерный массив лабиринта
     * @param {number} count - Количество проходов для добавления
     * @param {number} startRow - Строка стартовой точки
     * @param {number} startCol - Столбец стартовой точки
     * @param {number} finishRow - Строка финишной точки
     * @param {number} finishCol - Столбец финишной точки
     * @returns {Array<Array<number>>} Модифицированный лабиринт
     */
    addRandomPaths(maze, count, startRow, startCol, finishRow, finishCol) {
        this.logger.debug(`Adding ${count} random paths`);
        
        let modifiedMaze = JSON.parse(JSON.stringify(maze)); // Глубокое копирование
        let pathsAdded = 0;
        let attempts = 0;
        const maxAttempts = count * 3; // Ограничение попыток для предотвращения бесконечных циклов
        
        while (pathsAdded < count && attempts < maxAttempts) {
            // Выбираем случайную стену (не на границе)
            const row = 1 + Math.floor(Math.random() * (this.rows - 2));
            const col = 1 + Math.floor(Math.random() * (this.cols - 2));
            
            attempts++;
            
            // Пропускаем, если это не стена или это старт/финиш
            if (modifiedMaze[row][col] !== this.cellTypes.WALL ||
                (row === startRow && col === startCol) ||
                (row === finishRow && col === finishCol)) {
                continue;
            }
            
            // Проверяем, что есть хотя бы два соседних прохода
            let adjacentEmptyCount = 0;
            
            if (row > 0 && modifiedMaze[row - 1][col] === this.cellTypes.EMPTY) adjacentEmptyCount++;
            if (row < this.rows - 1 && modifiedMaze[row + 1][col] === this.cellTypes.EMPTY) adjacentEmptyCount++;
            if (col > 0 && modifiedMaze[row][col - 1] === this.cellTypes.EMPTY) adjacentEmptyCount++;
            if (col < this.cols - 1 && modifiedMaze[row][col + 1] === this.cellTypes.EMPTY) adjacentEmptyCount++;
            
            // Если рядом есть хотя бы два прохода, делаем проход
            if (adjacentEmptyCount >= 2) {
                modifiedMaze[row][col] = this.cellTypes.EMPTY;
                pathsAdded++;
            }
        }
        
        this.logger.debug(`Added ${pathsAdded} random paths after ${attempts} attempts`);
        return modifiedMaze;
    }
    
    /**
     * Добавление случайных стен для усложнения лабиринта
     * 
     * @private
     * @param {Array<Array<number>>} maze - Двумерный массив лабиринта
     * @param {number} count - Количество стен для добавления
     * @param {number} startRow - Строка стартовой точки
     * @param {number} startCol - Столбец стартовой точки
     * @param {number} finishRow - Строка финишной точки
     * @param {number} finishCol - Столбец финишной точки
     * @returns {Array<Array<number>>} Модифицированный лабиринт
     */
    addRandomWalls(maze, count, startRow, startCol, finishRow, finishCol) {
        this.logger.debug(`Adding ${count} random walls`);
        
        let modifiedMaze = JSON.parse(JSON.stringify(maze)); // Глубокое копирование
        let wallsAdded = 0;
        let attempts = 0;
        const maxAttempts = count * 3; // Ограничение попыток для предотвращения бесконечных циклов
        
        while (wallsAdded < count && attempts < maxAttempts) {
            // Выбираем случайный проход (не на границе, не старт/финиш)
            const row = 1 + Math.floor(Math.random() * (this.rows - 2));
            const col = 1 + Math.floor(Math.random() * (this.cols - 2));
            
            attempts++;
            
            // Пропускаем, если это не проход или это старт/финиш
            if (modifiedMaze[row][col] !== this.cellTypes.EMPTY ||
                (row === startRow && col === startCol) ||
                (row === finishRow && col === finishCol)) {
                continue;
            }
            
            // Временно добавляем стену
            modifiedMaze[row][col] = this.cellTypes.WALL;
            
            // Проверяем, есть ли путь от старта до финиша
            const path = this.findPath(modifiedMaze, startRow, startCol, finishRow, finishCol);
            
            // Если пути нет, возвращаем проход
            if (path.length === 0) {
                modifiedMaze[row][col] = this.cellTypes.EMPTY;
            } else {
                wallsAdded++;
            }
        }
        
        this.logger.debug(`Added ${wallsAdded} random walls after ${attempts} attempts`);
        return modifiedMaze;
    }
    
    /**
     * Проверка и обеспечение проходимости лабиринта
     * 
     * @private
     * @param {Array<Array<number>>} maze - Двумерный массив лабиринта
     * @param {number} startRow - Строка стартовой точки
     * @param {number} startCol - Столбец стартовой точки
     * @param {number} finishRow - Строка финишной точки
     * @param {number} finishCol - Столбец финишной точки
     * @returns {Array<Array<number>>} Модифицированный лабиринт с гарантированным путем
     */
    ensurePathExists(maze, startRow, startCol, finishRow, finishCol) {
        this.logger.debug(`Ensuring path exists from (${startRow},${startCol}) to (${finishRow},${finishCol})`);
        
        let modifiedMaze = JSON.parse(JSON.stringify(maze)); // Глубокое копирование
        
        // Проверяем, есть ли путь от старта до финиша
        const path = this.findPath(modifiedMaze, startRow, startCol, finishRow, finishCol);
        
        // Если пути нет, создаем его
        if (path.length === 0) {
            this.logger.warn('No path found between start and finish. Creating a path...');
            modifiedMaze = this.createPath(modifiedMaze, startRow, startCol, finishRow, finishCol);
            
            // Повторная проверка
            const newPath = this.findPath(modifiedMaze, startRow, startCol, finishRow, finishCol);
            if (newPath.length === 0) {
                this.logger.error('Failed to create path between start and finish');
                throw new Error('Cannot ensure path exists between start and finish');
            } else {
                this.logger.info(`Path successfully created, length: ${newPath.length}`);
            }
        } else {
            this.logger.debug(`Path already exists, length: ${path.length}`);
        }
        
        return modifiedMaze;
    }
    
    /**
     * Создание пути от старта до финиша
     * 
     * @private
     * @param {Array<Array<number>>} maze - Двумерный массив лабиринта
     * @param {number} startRow - Строка стартовой точки
     * @param {number} startCol - Столбец стартовой точки
     * @param {number} finishRow - Строка финишной точки
     * @param {number} finishCol - Столбец финишной точки
     * @returns {Array<Array<number>>} Модифицированный лабиринт с гарантированным путем
     */
    createPath(maze, startRow, startCol, finishRow, finishCol) {
        let modifiedMaze = JSON.parse(JSON.stringify(maze)); // Глубокое копирование
        
        // Используем алгоритм A* для построения пути
        const openSet = [];
        const closedSet = new Set();
        
        // Добавляем стартовую точку в открытый набор
        openSet.push({
            row: startRow,
            col: startCol,
            g: 0, // Стоимость пути от старта
            h: this.heuristic(startRow, startCol, finishRow, finishCol), // Эвристика
            f: this.heuristic(startRow, startCol, finishRow, finishCol), // f = g + h
            path: []
        });
        
        const directions = [
            [-1, 0], // Вверх
            [1, 0],  // Вниз
            [0, -1], // Влево
            [0, 1]   // Вправо
        ];
        
        while (openSet.length > 0) {
            // Находим узел с наименьшим f
            let lowestIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[lowestIndex].f) {
                    lowestIndex = i;
                }
            }
            
            const current = openSet[lowestIndex];
            
            // Проверяем, достигли ли мы цели
            if (current.row === finishRow && current.col === finishCol) {
                // Восстанавливаем путь
                const path = [];
                let temp = current;
                while (temp.parent) {
                    path.push({
                        row: temp.row,
                        col: temp.col
                    });
                    temp = temp.parent;
                }
                path.push({
                    row: startRow,
                    col: startCol
                });
                
                this.logger.debug(`Path found, length: ${path.length}`);
                return path.reverse();
            }
            
            // Удаляем текущий узел из openSet и добавляем в closedSet
            openSet.splice(lowestIndex, 1);
            closedSet.add(`${current.row},${current.col}`);
            
            // Получаем соседей
            const neighbors = this.getNeighbors(maze, current.row, current.col);
            
            for (const neighbor of neighbors) {
                const key = `${neighbor.row},${neighbor.col}`;
                
                // Пропускаем уже проверенные узлы
                if (closedSet.has(key)) continue;
                
                // Вычисляем g, h и f для соседа
                const g = current.g + 1;
                const h = this.heuristic(neighbor.row, neighbor.col, finishRow, finishCol);
                const f = g + h;
                
                // Проверяем, есть ли узел в openSet с лучшим путем
                const openNode = openSet.find(node => node.row === neighbor.row && node.col === neighbor.col);
                
                if (openNode) {
                    if (g < openNode.g) {
                        openNode.g = g;
                        openNode.f = g + h;
                        openNode.parent = current;
                    }
                } else {
                    // Добавляем новый узел в openSet
                    openSet.push({
                        row: neighbor.row,
                        col: neighbor.col,
                        g,
                        h,
                        f,
                        parent: current
                    });
                }
            }
        }
        
        this.logger.warn(`No path found after ${iterations} iterations`);
        return [];
    }
    
    /**
     * Получение соседних проходимых ячеек
     * 
     * @private
     * @param {Array<Array<number>>} maze - Двумерный массив лабиринта
     * @param {number} row - Строка текущей ячейки
     * @param {number} col - Столбец текущей ячейки
     * @returns {Array<Object>} Массив соседних проходимых ячеек, каждая ячейка имеет координаты {row, col, direction}
     */
    getNeighbors(maze, row, col) {
        const neighbors = [];
        const directions = [
            [-1, 0, 'up'],    // Вверх
            [1, 0, 'down'],   // Вниз
            [0, -1, 'left'],  // Влево
            [0, 1, 'right']   // Вправо
        ];
        
        for (const [dRow, dCol, direction] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isInBounds(newRow, newCol, maze.length, maze[0].length) && 
                maze[newRow][newCol] !== this.cellTypes.WALL) {
                
                neighbors.push({ row: newRow, col: newCol, direction });
            }
        }
        
        return neighbors;
    }
    
    /**
     * Эвристическая функция для алгоритма A* (манхэттенское расстояние)
     * 
     * @private
     * @param {number} row1 - Строка первой ячейки
     * @param {number} col1 - Столбец первой ячейки
     * @param {number} row2 - Строка второй ячейки
     * @param {number} col2 - Столбец второй ячейки
     * @returns {number} Манхэттенское расстояние между ячейками
     */
    heuristic(row1, col1, row2, col2) {
        return Math.abs(row1 - row2) + Math.abs(col1 - col2);
    }
    
    /**
     * Получение случайного пути от заданной точки
     * 
     * @param {Array<Array<number>>} maze - Двумерный массив лабиринта
     * @param {number} startRow - Строка стартовой точки
     * @param {number} startCol - Столбец стартовой точки
     * @param {number} steps - Максимальное количество шагов
     * @returns {Array<Object>} Массив точек случайного пути, каждая точка имеет координаты {row, col}
     */
    getRandomPath(maze, startRow, startCol, steps) {
        this.logger.debug(`Generating random path from (${startRow},${startCol}) with max ${steps} steps`);
        
        // Проверка входных данных
        if (!this.isInBounds(startRow, startCol, maze.length, maze[0].length)) {
            this.logger.warn(`Invalid start position (${startRow},${startCol})`);
            return [];
        }
        
        if (steps <= 0) {
            this.logger.warn(`Invalid steps count: ${steps}`);
            return [];
        }
        
        const path = [{ row: startRow, col: startCol }];
        let currentRow = startRow;
        let currentCol = startCol;
        
        // Защита от бесконечных циклов
        const maxAttempts = steps * 2;
        let attempts = 0;
        
        for (let i = 0; i < steps && attempts < maxAttempts; i++) {
            const neighbors = this.getNeighbors(maze, currentRow, currentCol);
            
            if (neighbors.length === 0) {
                this.logger.debug(`No available neighbors at step ${i}`);
                break;
            }
            
            // Выбираем случайного соседа
            const randomIndex = Math.floor(Math.random() * neighbors.length);
            const neighbor = neighbors[randomIndex];
            
            // Добавляем в путь
            path.push({ row: neighbor.row, col: neighbor.col });
            
            // Обновляем текущую позицию
            currentRow = neighbor.row;
            currentCol = neighbor.col;
            
            attempts++;
        }
        
        this.logger.debug(`Random path generated, length: ${path.length}`);
        return path;
    }
    
    /**
     * Проверка, находится ли ячейка внутри лабиринта
     * 
     * @private
     * @param {number} row - Строка ячейки
     * @param {number} col - Столбец ячейки
     * @param {number} rows - Количество строк в лабиринте
     * @param {number} cols - Количество столбцов в лабиринте
     * @returns {boolean} true, если ячейка находится внутри лабиринта
     */
    isInBounds(row, col, rows, cols) {
        return row >= 0 && row < rows && col >= 0 && col < cols;
    }
    
    /**
     * Перемешивание массива (алгоритм Фишера-Йетса)
     * 
     * @private
     * @param {Array} array - Массив для перемешивания
     * @returns {Array} Перемешанный массив
     */
    shuffleArray(array) {
        const result = [...array];
        
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        
        return result;
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
}// Проверяем, достигли ли финиша
            if (current.row === finishRow && current.col === finishCol) {
                // Создаем путь, прорубая стены
                for (const point of current.path) {
                    modifiedMaze[point.row][point.col] = this.cellTypes.EMPTY;
                }
                
                this.logger.debug(`Path created from (${startRow},${startCol}) to (${finishRow},${finishCol})`);
                return modifiedMaze;
            }
            
            // Удаляем текущий узел из openSet и добавляем в closedSet
            openSet.splice(lowestIndex, 1);
            closedSet.add(`${current.row},${current.col}`);
            
            // Проверяем все направления
            for (const [dRow, dCol] of directions) {
                const newRow = current.row + dRow;
                const newCol = current.col + dCol;
                const key = `${newRow},${newCol}`;
                
                // Проверяем, что новая позиция внутри лабиринта и не в закрытом наборе
                if (!this.isInBounds(newRow, newCol, this.rows, this.cols) || closedSet.has(key)) {
                    continue;
                }
                
                // Вычисляем новые стоимости
                const g = current.g + 1;
                const h = this.heuristic(newRow, newCol, finishRow, finishCol);
                const f = g + h;
                
                // Проверяем, есть ли узел в открытом наборе с лучшим путем
                const existingNode = openSet.find(node => node.row === newRow && node.col === newCol);
                
                if (existingNode && g >= existingNode.g) {
                    continue;
                }
                
                // Если узел в открытом наборе с худшим путем, обновляем его
                if (existingNode) {
                    existingNode.g = g;
                    existingNode.f = f;
                    existingNode.path = [...current.path, { row: newRow, col: newCol }];
                } else {
                    // Добавляем новый узел
                    openSet.push({
                        row: newRow,
                        col: newCol,
                        g,
                        h,
                        f,
                        path: [...current.path, { row: newRow, col: newCol }]
                    });
                }
            }
        }
        
        this.logger.warn('Failed to create path using A*. Using alternative method...');
        
        // Резервный метод - создаем прямую линию от старта до финиша
        const dx = finishCol - startCol;
        const dy = finishRow - startRow;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        
        for (let i = 0; i <= steps; i++) {
            const row = Math.round(startRow + (dy * i) / steps);
            const col = Math.round(startCol + (dx * i) / steps);
            
            if (this.isInBounds(row, col, this.rows, this.cols)) {
                modifiedMaze[row][col] = this.cellTypes.EMPTY;
            }
        }
        
        return modifiedMaze;
    }
    
    /**
     * Проверка и обеспечение стен по внешним границам лабиринта
     * 
     * @private
     * @param {Array<Array<number>>} maze - Двумерный массив лабиринта
     * @returns {Array<Array<number>>} Модифицированный лабиринт с гарантированными границами
     */
    ensureBoundaryWalls(maze) {
        let modifiedMaze = JSON.parse(JSON.stringify(maze)); // Глубокое копирование
        
        // Верхняя и нижняя границы
        for (let col = 0; col < this.cols; col++) {
            modifiedMaze[0][col] = this.cellTypes.WALL;
            modifiedMaze[this.rows - 1][col] = this.cellTypes.WALL;
        }
        
        // Левая и правая границы
        for (let row = 0; row < this.rows; row++) {
            modifiedMaze[row][0] = this.cellTypes.WALL;
            modifiedMaze[row][this.cols - 1] = this.cellTypes.WALL;
        }
        
        this.logger.debug('Boundary walls added');
        return modifiedMaze;
    }
    
    /**
     * Нахождение пути от старта до финиша с использованием алгоритма A*
     * 
     * @param {Array<Array<number>>} maze - Двумерный массив лабиринта
     * @param {number} startRow - Строка стартовой точки
     * @param {number} startCol - Столбец стартовой точки
     * @param {number} finishRow - Строка финишной точки
     * @param {number} finishCol - Столбец финишной точки
     * @returns {Array<Object>} Массив точек пути от старта до финиша, каждая точка имеет координаты {row, col}
     */
    findPath(maze, startRow, startCol, finishRow, finishCol) {
        this.logger.debug(`Finding path from (${startRow},${startCol}) to (${finishRow},${finishCol})`);
        
        // Используем A* алгоритм для нахождения пути
        const openSet = [{ 
            row: startRow, 
            col: startCol, 
            g: 0, // Стоимость пути от старта
            h: this.heuristic(startRow, startCol, finishRow, finishCol), // Эвристика
            f: this.heuristic(startRow, startCol, finishRow, finishCol), // f = g + h
            parent: null 
        }];
        
        const closedSet = new Set();
        
        // Максимальное количество итераций для предотвращения бесконечных циклов
        const maxIterations = this.rows * this.cols * 2;
        let iterations = 0;
        
        while (openSet.length > 0 && iterations < maxIterations) {
            iterations++;
            
            // Находим узел с наименьшим f
            let lowestIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[lowestIndex].f) {
                    lowestIndex = i;
                }
            }
            
            const current = openSet[lowestIndex];
            
            