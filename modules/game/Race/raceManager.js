import { SnailFactory } from '../snails/factory.js';

export class RaceManager {
  constructor(options = {}) {
    this.snails = [];
    this.isRaceActive = false;
    this.startTime = null;
    this.finishLine = options.finishLine || { x: 750, y: 200 };
    this.obstacles = [];
    this.raceConfig = {
      trackWidth: options.trackWidth || 800,
      trackHeight: options.trackHeight || 400,
      snailCount: options.snailCount || 5
    };
  }

  /**
   * Инициализирует гонку
   */
  initializeRace() {
    // Создаем набор улиток
    this.snails = SnailFactory.createRaceSet(this.raceConfig.snailCount);
    
    // Располагаем улиток на стартовой линии
    const startSpacing = this.raceConfig.trackHeight / (this.snails.length + 1);
    this.snails.forEach((snail, index) => {
      snail.position = {
        x: 50,
        y: startSpacing * (index + 1)
      };
    });

    this.isRaceActive = false;
    this.startTime = null;
    console.log('Гонка инициализирована');
  }

  /**
   * Начинает гонку
   */
  startRace() {
    if (this.isRaceActive) return;
    
    this.isRaceActive = true;
    this.startTime = Date.now();
    
    // Запускаем движение всех улиток
    this.snails.forEach(snail => {
      snail.setDirection(1, 0); // Движение вправо
      snail.startMoving();
    });
    
    console.log('Гонка началась');
  }

  /**
   * Обновляет состояние гонки
   * @param {number} deltaTime - Время, прошедшее с последнего обновления
   */
  update(deltaTime) {
    if (!this.isRaceActive) return;

    // Обновляем положение каждой улитки
    this.snails.forEach(snail => {
      snail.update(deltaTime);
      
      // Проверяем пересечение финишной линии
      if (this.checkFinishLine(snail)) {
        this.handleFinish(snail);
      }
      
      // Проверяем столкновения с препятствиями
      this.obstacles.forEach(obstacle => {
        if (snail.checkCollision(obstacle)) {
          snail.handleCollision(obstacle);
        }
      });
    });
  }

  /**
   * Проверяет, пересекла ли улитка финишную линию
   * @param {BaseSnail} snail - Улитка для проверки
   * @returns {boolean} - true если улитка пересекла финишную линию
   */
  checkFinishLine(snail) {
    return snail.position.x >= this.finishLine.x;
  }

  /**
   * Обрабатывает финиш улитки
   * @param {BaseSnail} snail - Улитка, которая финишировала
   */
  handleFinish(snail) {
    snail.stopMoving();
    const finishTime = Date.now() - this.startTime;
    console.log(`${snail.name} финишировала за ${(finishTime / 1000).toFixed(2)} секунд`);
    
    // Проверяем, все ли улитки финишировали
    if (this.snails.every(s => !s._isMoving)) {
      this.endRace();
    }
  }

  /**
   * Завершает гонку
   */
  endRace() {
    this.isRaceActive = false;
    console.log('Гонка завершена');
  }

  /**
   * Возвращает текущее состояние гонки
   * @returns {Object} - Состояние гонки
   */
  getRaceState() {
    return {
      isActive: this.isRaceActive,
      elapsedTime: this.startTime ? (Date.now() - this.startTime) / 1000 : 0,
      snails: this.snails.map(snail => ({
        name: snail.name,
        position: { ...snail.position },
        color: snail.color,
        speed: snail.speed,
        isMoving: snail._isMoving
      })),
      finishLine: { ...this.finishLine },
      obstacles: [...this.obstacles]
    };
  }

  /**
   * Добавляет улитку в гонку
   * @param {string} type - Тип улитки
   * @param {Object} options - Опции для создания улитки
   */
  addSnail(type, options = {}) {
    if (!SnailFactory.isValidType(type)) {
      console.warn(`Неизвестный тип улитки: ${type}`);
      return;
    }

    const snail = SnailFactory.create(type, options);
    this.snails.push(snail);
    console.log(`Добавлена улитка: ${snail.name}`);
  }
} 