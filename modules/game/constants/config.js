/**
 * Конфигурация игры
 * @module CONFIG
 */

export const CONFIG = {
    MAZE: {
        WIDTH: 20,
        HEIGHT: 20,
        COMPLEXITY: 'medium', // 'easy', 'medium', 'hard', 'extreme'
        CELL_SIZE: 32, // размер клетки в пикселях
        WALL_THICKNESS: 2, // толщина стен в пикселях
        START_PADDING: 1, // отступ от края для стартовой точки
        FINISH_PADDING: 1 // отступ от края для финишной точки
    },
    RACE: {
        SNAIL_COUNT: 6,
        RESULTS_DELAY: 2000, // задержка перед показом результатов в мс
        MIN_DURATION: 5000, // минимальная длительность гонки в мс
        MAX_DURATION: 30000 // максимальная длительность гонки в мс
    },
    BETTING: {
        MIN_BET: 0.1,
        MAX_BET: 10,
        DEFAULT_BET: 0.5
    }
}; 