/**
 * @fileoverview Константы для модуля лабиринта.
 * 
 * @module MazeConstants
 * @author Snail to Riches Team
 * @version 1.0.0
 */

/**
 * Типы ячеек в лабиринте
 * @enum {number}
 */
export const CellTypes = {
    /** Пустая ячейка (проход) */
    EMPTY: 0,
    
    /** Стена */
    WALL: 1,
    
    /** Стартовая ячейка */
    START: 2,
    
    /** Финишная ячейка */
    FINISH: 3,
    
    /** Препятствие */
    OBSTACLE: 4,
    
    /** Бонус */
    BONUS: 5,
    
    /** Ловушка */
    TRAP: 6
};

/**
 * Уровни сложности лабиринта
 * @enum {string}
 */
export const DifficultyLevels = {
    /** Легкий уровень - больше проходов, меньше тупиков */
    EASY: 'easy',
    
    /** Средний уровень - сбалансированное количество проходов и стен */
    MEDIUM: 'medium',
    
    /** Сложный уровень - больше стен, сложнее найти путь */
    HARD: 'hard',
    
    /** Экстремальный уровень - очень много стен, минимум проходов */
    EXTREME: 'extreme'
};

/**
 * Направления движения в лабиринте
 * @enum {string}
 */
export const Directions = {
    /** Вверх */
    UP: 'up',
    
    /** Вниз */
    DOWN: 'down',
    
    /** Влево */
    LEFT: 'left',
    
    /** Вправо */
    RIGHT: 'right'
};

/**
 * Смещения для направлений движения
 * @type {Object.<string, {row: number, col: number}>}
 */
export const DirectionOffsets = {
    [Directions.UP]: { row: -1, col: 0 },
    [Directions.DOWN]: { row: 1, col: 0 },
    [Directions.LEFT]: { row: 0, col: -1 },
    [Directions.RIGHT]: { row: 0, col: 1 }
};

/**
 * Настройки алгоритмов поиска пути
 * @type {Object}
 */
export const PathfindingSettings = {
    /** Максимальное количество итераций для предотвращения бесконечных циклов */
    MAX_ITERATIONS: 10000,
    
    /** Вес эвристики для A* (значения > 1 ускоряют поиск, но могут привести к неоптимальным путям) */
    HEURISTIC_WEIGHT: 1.2,
    
    /** Максимальное количество узлов в открытом списке (для ограничения памяти) */
    MAX_OPEN_LIST_SIZE: 1000
};

/**
 * Настройки визуализации лабиринта
 * @type {Object}
 */
export const VisualizationSettings = {
    /** Размер ячейки в пикселях */
    CELL_SIZE: 32,
    
    /** Цвета для разных типов ячеек */
    COLORS: {
        [CellTypes.EMPTY]: '#ffffff',
        [CellTypes.WALL]: '#333333',
        [CellTypes.START]: '#00ff00',
        [CellTypes.FINISH]: '#ff0000',
        [CellTypes.OBSTACLE]: '#666666',
        [CellTypes.BONUS]: '#ffff00',
        [CellTypes.TRAP]: '#ff00ff'
    },
    
    /** Размер границы ячейки в пикселях */
    BORDER_SIZE: 1,
    
    /** Цвет границы ячейки */
    BORDER_COLOR: '#888888'
};