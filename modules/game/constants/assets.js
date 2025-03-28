/**
 * @fileoverview Константы для игровых ассетов
 */

export const ASSETS = {
    CELL_TYPES: {
        EMPTY: 0,    // Пустая ячейка (проход)
        WALL: 1,     // Стена
        START: 2,    // Стартовая ячейка
        FINISH: 3,   // Финишная ячейка
        OBSTACLE: 4, // Препятствие
        BONUS: 5,    // Бонус
        TRAP: 6      // Ловушка
    },
    
    DIFFICULTY: {
        EASY: 'easy',
        MEDIUM: 'medium',
        HARD: 'hard',
        EXTREME: 'extreme'
    },
    
    DIRECTIONS: {
        UP: 'up',
        DOWN: 'down',
        LEFT: 'left',
        RIGHT: 'right'
    },
    
    DIRECTION_OFFSETS: {
        up: { row: -1, col: 0 },
        down: { row: 1, col: 0 },
        left: { row: 0, col: -1 },
        right: { row: 0, col: 1 }
    },
    
    PATHFINDING: {
        MAX_ITERATIONS: 10000,
        HEURISTIC_WEIGHT: 1.2,
        MAX_OPEN_LIST_SIZE: 1000
    },
    
    VISUALIZATION: {
        CELL_SIZE: 32,
        COLORS: {
            0: '#ffffff', // EMPTY
            1: '#333333', // WALL
            2: '#00ff00', // START
            3: '#ff0000', // FINISH
            4: '#666666', // OBSTACLE
            5: '#ffff00', // BONUS
            6: '#ff00ff'  // TRAP
        },
        BORDER_SIZE: 1,
        BORDER_COLOR: '#888888'
    }
}; 