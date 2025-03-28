/**
 * BaseSnail - Базовый класс улитки с основными характеристиками и поведением
 */
class BaseSnail {
  /**
   * Создает экземпляр улитки
   * @param {Object} options - Опции для инициализации улитки
   * @param {string} options.color - Цвет улитки
   * @param {number} options.speed - Скорость улитки (единиц в секунду)
   * @param {Object} options.position - Начальная позиция улитки
   * @param {number} options.position.x - Координата X
   * @param {number} options.position.y - Координата Y
   * @param {number} options.size - Размер улитки
   * @param {string} options.name - Имя улитки (опционально)
   */
  constructor(options = {}) {
    // Установка значений по умолчанию и проверка параметров
    this.color = this._validateColor(options.color || '#8B4513');
    this.speed = this._validateSpeed(options.speed || 1);
    this.position = this._validatePosition(options.position || { x: 0, y: 0 });
    this.size = this._validateSize(options.size || 10);
    this.name = options.name || `Snail_${Math.floor(Math.random() * 1000)}`;
    
    // Внутренние свойства
    this._direction = { x: 0, y: 0 }; // Текущее направление движения
    this._isMoving = false;
    this._collisions = []; // История столкновений
    
    this._log('Улитка создана');
  }
  
  /**
   * Устанавливает направление движения улитки
   * @param {number} dirX - Компонент направления по оси X (-1 до 1)
   * @param {number} dirY - Компонент направления по оси Y (-1 до 1)
   * @returns {BaseSnail} - Текущий экземпляр для цепочки вызовов
   */
  setDirection(dirX, dirY) {
    // Нормализация вектора направления
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length > 0) {
      this._direction = {
        x: dirX / length,
        y: dirY / length
      };
    } else {
      this._direction = { x: 0, y: 0 };
    }
    
    this._log(`Направление изменено на [${this._direction.x.toFixed(2)}, ${this._direction.y.toFixed(2)}]`);
    return this;
  }
  
  /**
   * Запускает движение улитки
   * @returns {BaseSnail} - Текущий экземпляр для цепочки вызовов
   */
  startMoving() {
    this._isMoving = true;
    this._log('Движение начато');
    return this;
  }
  
  /**
   * Останавливает движение улитки
   * @returns {BaseSnail} - Текущий экземпляр для цепочки вызовов
   */
  stopMoving() {
    this._isMoving = false;
    this._log('Движение остановлено');
    return this;
  }
  
  /**
   * Обновляет положение улитки на основе прошедшего времени
   * @param {number} deltaTime - Время, прошедшее с последнего обновления (в секундах)
   * @returns {BaseSnail} - Текущий экземпляр для цепочки вызовов
   */
  update(deltaTime) {
    if (!this._isMoving) return this;
    
    // Расчет нового положения
    const newPosition = {
      x: this.position.x + this._direction.x * this.speed * deltaTime,
      y: this.position.y + this._direction.y * this.speed * deltaTime
    };
    
    // Обновление положения
    this.position = this._validatePosition(newPosition);
    return this;
  }
  
  /**
   * Обрабатывает столкновение с другим объектом
   * @param {Object} object - Объект, с которым произошло столкновение
   * @returns {BaseSnail} - Текущий экземпляр для цепочки вызовов
   */
  handleCollision(object) {
    // Запись информации о столкновении
    const collision = {
      timestamp: Date.now(),
      objectType: object.constructor.name,
      position: { ...this.position }
    };
    
    this._collisions.push(collision);
    this._log(`Столкновение с ${object.constructor.name}`);
    
    // Базовая реакция - остановка
    this.stopMoving();
    
    return this;
  }
  
  /**
   * Проверяет, сталкивается ли улитка с другим объектом
   * @param {Object} object - Объект для проверки столкновения
   * @param {Object} object.position - Позиция объекта
   * @param {number} object.position.x - Координата X
   * @param {number} object.position.y - Координата Y
   * @param {number} object.size - Размер объекта
   * @returns {boolean} - true если есть столкновение, иначе false
   */
  checkCollision(object) {
    // Проверка наличия необходимых свойств
    if (!object || !object.position || typeof object.size !== 'number') {
      return false;
    }
    
    // Расчет расстояния между центрами
    const dx = this.position.x - object.position.x;
    const dy = this.position.y - object.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Сумма радиусов (принимая размер за диаметр)
    const sumRadii = (this.size + object.size) / 2;
    
    // Есть столкновение, если расстояние меньше суммы радиусов
    return distance < sumRadii;
  }
  
  /**
   * Получает историю столкновений
   * @returns {Array} - Массив столкновений
   */
  getCollisionHistory() {
    return [...this._collisions];
  }
  
  /**
   * Валидирует и форматирует цвет
   * @param {string} color - Цвет для проверки
   * @returns {string} - Проверенный цвет
   * @private
   */
  _validateColor(color) {
    // Проверка формата цвета (простая)
    const validColorRegex = /^#([0-9A-F]{3}){1,2}$/i;
    if (typeof color === 'string' && validColorRegex.test(color)) {
      return color;
    }
    
    this._log('Недопустимый цвет, используется цвет по умолчанию', 'warn');
    return '#8B4513'; // Коричневый цвет по умолчанию
  }
  
  /**
   * Валидирует скорость
   * @param {number} speed - Скорость для проверки
   * @returns {number} - Проверенная скорость
   * @private
   */
  _validateSpeed(speed) {
    if (typeof speed === 'number' && speed >= 0 && speed <= 100) {
      return speed;
    }
    
    this._log('Недопустимая скорость, используется скорость по умолчанию', 'warn');
    return 1; // Скорость по умолчанию
  }
  
  /**
   * Валидирует позицию
   * @param {Object} position - Позиция для проверки
   * @returns {Object} - Проверенная позиция
   * @private
   */
  _validatePosition(position) {
    if (position && typeof position.x === 'number' && typeof position.y === 'number') {
      return { x: position.x, y: position.y };
    }
    
    this._log('Недопустимая позиция, используется позиция по умолчанию', 'warn');
    return { x: 0, y: 0 }; // Позиция по умолчанию
  }
  
  /**
   * Валидирует размер
   * @param {number} size - Размер для проверки
   * @returns {number} - Проверенный размер
   * @private
   */
  _validateSize(size) {
    if (typeof size === 'number' && size > 0 && size <= 100) {
      return size;
    }
    
    this._log('Недопустимый размер, используется размер по умолчанию', 'warn');
    return 10; // Размер по умолчанию
  }
  
  /**
   * Логирует сообщение
   * @param {string} message - Сообщение для логирования
   * @param {string} level - Уровень логирования (log, warn, error)
   * @private
   */
  _log(message, level = 'log') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}][Улитка ${this.name}]`;
    
    switch (level) {
      case 'warn':
        console.warn(`${prefix} ПРЕДУПРЕЖДЕНИЕ: ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ОШИБКА: ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
}

export default BaseSnail;
