export class RaceRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Настройки отрисовки
    this.options = {
      backgroundColor: '#87CEEB', // Голубое небо
      trackColor: '#228B22',      // Зеленая трава
      finishLineColor: '#FF0000', // Красная финишная линия
      obstacleColor: '#8B4513'    // Коричневые препятствия
    };
  }

  /**
   * Очищает canvas
   */
  clear() {
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Отрисовывает трек
   * @param {Object} track - Параметры трека
   */
  renderTrack(track) {
    // Рисуем траву
    this.ctx.fillStyle = this.options.trackColor;
    this.ctx.fillRect(0, 0, track.width, track.height);
    
    // Рисуем разметку трека
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(50, 0);
    this.ctx.lineTo(50, track.height);
    this.ctx.stroke();
  }

  /**
   * Отрисовывает финишную линию
   * @param {Object} finishLine - Параметры финишной линии
   */
  renderFinishLine(finishLine) {
    this.ctx.fillStyle = this.options.finishLineColor;
    this.ctx.fillRect(finishLine.x - 5, 0, 10, this.canvas.height);
    
    // Добавляем текст "FINISH"
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FINISH', finishLine.x, 30);
  }

  /**
   * Отрисовывает препятствия
   * @param {Array} obstacles - Массив препятствий
   */
  renderObstacles(obstacles) {
    this.ctx.fillStyle = this.options.obstacleColor;
    obstacles.forEach(obstacle => {
      this.ctx.beginPath();
      this.ctx.arc(obstacle.position.x, obstacle.position.y, obstacle.size / 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  /**
   * Отрисовывает улитку
   * @param {Object} snail - Параметры улитки
   */
  renderSnail(snail) {
    // Рисуем тело улитки
    this.ctx.fillStyle = snail.color;
    this.ctx.beginPath();
    this.ctx.arc(snail.position.x, snail.position.y, snail.size / 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Рисуем глаза
    this.ctx.fillStyle = '#FFFFFF';
    const eyeOffset = snail.size / 4;
    this.ctx.beginPath();
    this.ctx.arc(snail.position.x + eyeOffset, snail.position.y - eyeOffset, 2, 0, Math.PI * 2);
    this.ctx.arc(snail.position.x + eyeOffset, snail.position.y + eyeOffset, 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Рисуем имя улитки
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(snail.name, snail.position.x, snail.position.y - snail.size - 5);
  }

  /**
   * Отрисовывает информацию о гонке
   * @param {Object} raceState - Состояние гонки
   */
  renderRaceInfo(raceState) {
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    
    // Время гонки
    this.ctx.fillText(`Время: ${raceState.elapsedTime.toFixed(1)} сек`, 10, 20);
    
    // Информация об улитках
    raceState.snails.forEach((snail, index) => {
      const y = 40 + index * 20;
      this.ctx.fillText(
        `${snail.name}: ${snail.isMoving ? 'В движении' : 'Финишировала'} (${snail.speed.toFixed(1)} ед/с)`,
        10,
        y
      );
    });
  }

  /**
   * Отрисовывает состояние гонки
   * @param {Object} raceState - Состояние гонки
   * @param {Object} track - Параметры трека
   */
  render(raceState, track) {
    this.clear();
    this.renderTrack(track);
    this.renderFinishLine(raceState.finishLine);
    this.renderObstacles(raceState.obstacles);
    
    // Отрисовываем улиток
    raceState.snails.forEach(snail => this.renderSnail(snail));
    
    // Отрисовываем информацию о гонке
    this.renderRaceInfo(raceState);
  }
} 