/**
 * Фабрика для создания улиток
 * @module SnailFactory
 */

import { CONFIG } from '../../../config.js';
import { Logger } from '../../utils/logger.js';

export class SnailFactory {
    constructor() {
        this.logger = new Logger('SnailFactory');
    }

    /**
     * Генерирует указанное количество улиток с уникальными характеристиками
     * @param {number} count - Количество улиток для генерации
     * @returns {Array<Object>} Массив сгенерированных улиток
     */
    generateSnails(count) {
        this.logger.info(`Generating ${count} snails`);
        
        const snails = [];
        const names = this.getSnailNames();
        const usedNames = new Set();
        
        for (let i = 0; i < count; i++) {
            let name;
            do {
                name = names[Math.floor(Math.random() * names.length)];
            } while (usedNames.has(name));
            
            usedNames.add(name);
            
            const snail = {
                id: `snail_${Date.now()}_${i}`,
                name: name,
                speed: this.generateSpeed(),
                acceleration: this.generateAcceleration(),
                stamina: this.generateStamina(),
                odds: this.calculateOdds(),
                color: this.generateColor(),
                pattern: this.generatePattern(),
                specialAbility: this.generateSpecialAbility()
            };
            
            snails.push(snail);
        }
        
        return snails;
    }
    
    /**
     * Генерирует случайную скорость улитки
     * @returns {number} Скорость улитки
     * @private
     */
    generateSpeed() {
        return (
            CONFIG.SNAILS.MIN_SPEED +
            Math.random() * (CONFIG.SNAILS.MAX_SPEED - CONFIG.SNAILS.MIN_SPEED)
        ).toFixed(2);
    }
    
    /**
     * Генерирует случайное ускорение улитки
     * @returns {number} Ускорение улитки
     * @private
     */
    generateAcceleration() {
        return (
            CONFIG.SNAILS.MIN_ACCELERATION +
            Math.random() * (CONFIG.SNAILS.MAX_ACCELERATION - CONFIG.SNAILS.MIN_ACCELERATION)
        ).toFixed(2);
    }
    
    /**
     * Генерирует случайную выносливость улитки
     * @returns {number} Выносливость улитки
     * @private
     */
    generateStamina() {
        return (
            CONFIG.SNAILS.MIN_STAMINA +
            Math.random() * (CONFIG.SNAILS.MAX_STAMINA - CONFIG.SNAILS.MIN_STAMINA)
        ).toFixed(2);
    }
    
    /**
     * Рассчитывает коэффициент ставок для улитки
     * @returns {number} Коэффициент ставок
     * @private
     */
    calculateOdds() {
        // Базовый коэффициент от 1.5 до 10
        const baseOdds = 1.5 + Math.random() * 8.5;
        return parseFloat(baseOdds.toFixed(2));
    }
    
    /**
     * Генерирует случайный цвет улитки
     * @returns {string} Цвет в формате HEX
     * @private
     */
    generateColor() {
        const colors = [
            '#FF6B6B', // Красный
            '#4ECDC4', // Бирюзовый
            '#45B7D1', // Голубой
            '#96CEB4', // Мятный
            '#FFEEAD', // Бежевый
            '#D4A5A5', // Розовый
            '#9A8C98', // Серый
            '#C3B299', // Коричневый
            '#A8E6CF', // Светло-зеленый
            '#FFD3B6'  // Персиковый
        ];
        
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Генерирует случайный узор для улитки
     * @returns {string} Название узора
     * @private
     */
    generatePattern() {
        const patterns = [
            'spiral',
            'dots',
            'stripes',
            'waves',
            'zigzag',
            'solid',
            'gradient',
            'spotted',
            'swirl',
            'geometric'
        ];
        
        return patterns[Math.floor(Math.random() * patterns.length)];
    }
    
    /**
     * Генерирует специальную способность улитки
     * @returns {Object} Объект с описанием способности
     * @private
     */
    generateSpecialAbility() {
        const abilities = [
            {
                name: 'Sprint Burst',
                description: 'Может совершить короткий рывок на высокой скорости',
                effect: 'speed_boost'
            },
            {
                name: 'Steady Pace',
                description: 'Поддерживает постоянную скорость без усталости',
                effect: 'stamina_boost'
            },
            {
                name: 'Slime Trail',
                description: 'Оставляет скользкий след, замедляющий других улиток',
                effect: 'slow_others'
            },
            {
                name: 'Shell Shield',
                description: 'Временно становится неуязвимой к препятствиям',
                effect: 'immunity'
            },
            {
                name: 'Lucky Charm',
                description: 'Имеет шанс найти короткий путь в лабиринте',
                effect: 'pathfinding'
            }
        ];
        
        return abilities[Math.floor(Math.random() * abilities.length)];
    }
    
    /**
     * Возвращает список имен для улиток
     * @returns {Array<string>} Массив имен
     * @private
     */
    getSnailNames() {
        return [
            'Турбо',
            'Молния',
            'Спринтер',
            'Ракета',
            'Вспышка',
            'Зигзаг',
            'Стрела',
            'Вихрь',
            'Комета',
            'Метеор',
            'Шторм',
            'Ветер',
            'Буря',
            'Гром',
            'Искра',
            'Звезда',
            'Луч',
            'Волна',
            'Поток',
            'Вираж'
        ];
    }
} 