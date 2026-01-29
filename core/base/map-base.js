// core/base/map-base.js

/**
 * マッププラグインの基底クラス
 */
class MapBase {
  constructor(config = {}) {
    // 必須プロパティ
    this.id = config.id || 'unknown';
    this.name = config.name || 'Unknown Map';
    this.description = config.description || '';
    this.author = config.author || 'Unknown';
    this.version = config.version || '1.0.0';
    
    // マップパラメータ
    this.width = config.width || 4000; // ピクセル
    this.height = config.height || 4000; // ピクセル
    this.backgroundColor = config.backgroundColor || '#2a2a2a';
    
    // オプション設定
    this.hasGrid = config.hasGrid !== undefined ? config.hasGrid : true;
    this.gridSize = config.gridSize || 100;
    this.gridColor = config.gridColor || '#3a3a3a';
    
    // 障害物・地形（オプション）
    this.obstacles = config.obstacles || [];
    this.spawnZones = config.spawnZones || [];
  }
  
  /**
   * マップ描画（サブクラスでオーバーライド可能）
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {Object} camera - カメラオブジェクト
   */
  draw(ctx, camera) {
    // デフォルト: 単色背景
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, camera.canvas.width, camera.canvas.height);
    
    // グリッド描画
    if (this.hasGrid) {
      this.drawGrid(ctx, camera);
    }
  }
  
  /**
   * グリッド描画
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {Object} camera - カメラオブジェクト
   */
  drawGrid(ctx, camera) {
    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;
    
    const offsetX = (-camera.x) % this.gridSize;
    const offsetY = (-camera.y) % this.gridSize;
    
    // 縦線
    for (let x = offsetX; x < camera.canvas.width; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, camera.canvas.height);
      ctx.stroke();
    }
    
    // 横線
    for (let y = offsetY; y < camera.canvas.height; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(camera.canvas.width, y);
      ctx.stroke();
    }
  }
  
  /**
   * 境界チェック
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @returns {boolean} 境界内の場合true
   */
  isInBounds(x, y) {
    return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
  }
  
  /**
   * 境界にクランプ
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @returns {Object} クランプされた座標 {x, y}
   */
  clamp(x, y) {
    return {
      x: Math.max(0, Math.min(this.width, x)),
      y: Math.max(0, Math.min(this.height, y))
    };
  }
  
  /**
   * ランダムなスポーン位置を取得
   * @returns {Object} スポーン位置 {x, y}
   */
  getRandomSpawnPosition() {
    if (this.spawnZones.length > 0) {
      // スポーンゾーンが定義されている場合
      const zone = this.spawnZones[Math.floor(Math.random() * this.spawnZones.length)];
      return {
        x: zone.x + Math.random() * zone.width,
        y: zone.y + Math.random() * zone.height
      };
    } else {
      // デフォルト: マップ全体からランダム
      return {
        x: Math.random() * this.width,
        y: Math.random() * this.height
      };
    }
  }
  
  /**
   * 障害物との衝突判定
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} size - オブジェクトのサイズ
   * @returns {boolean} 衝突している場合true
   */
  isCollidingWithObstacle(x, y, size) {
    for (const obstacle of this.obstacles) {
      if (this.checkRectCollision(x, y, size, size, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * 矩形衝突判定
   * @private
   */
  checkRectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 &&
           x1 + w1 > x2 &&
           y1 < y2 + h2 &&
           y1 + h1 > y2;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.PixelApocalypse = window.PixelApocalypse || {};
  window.PixelApocalypse.MapBase = MapBase;
}
