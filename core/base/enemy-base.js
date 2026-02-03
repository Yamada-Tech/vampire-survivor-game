// core/base/enemy-base.js

/**
 * 敵プラグインの基底クラス
 */
class EnemyBase {
  constructor(x, y, config = {}) {
    // 必須プロパティ
    this.id = config.id || 'unknown';
    this.name = config.name || 'Unknown Enemy';
    this.description = config.description || '';
    this.author = config.author || 'Unknown';
    this.version = config.version || '1.0.0';
    
    // 位置
    this.x = x;
    this.y = y;
    
    // パラメータ
    this.maxHealth = config.maxHealth || 50;
    this.health = this.maxHealth;
    this.speed = config.speed || 150; // ピクセル/秒
    this.size = config.size || 20; // ピクセル
    this.damage = config.damage || 10;
    this.expValue = config.expValue || 10; // 倒した時の経験値
    
    // 色・見た目
    this.color = config.color || '#ff0000';
    
    // AI設定
    this.aiType = config.aiType || 'chase'; // 'chase', 'patrol', 'ranged'
    this.detectionRange = config.detectionRange || 500;
    
    // アニメーション
    this.animationState = {
      legPhase: Math.random() * Math.PI * 2,
      frame: 0
    };
    
    // 状態
    this.isAlive = true;
  }
  
  /**
   * 更新処理（基本的なAI）
   * @param {Object} player - プレイヤーオブジェクト
   * @param {number} deltaTime - フレーム間の経過時間（秒）
   */
  update(player, deltaTime) {
    if (!this.isAlive) return;
    
    // プレイヤーとの距離
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 検知範囲内ならプレイヤーを追跡
    if (distance <= this.detectionRange && distance > 0) {
      this.x += (dx / distance) * this.speed * deltaTime;
      this.y += (dy / distance) * this.speed * deltaTime;
      
      // アニメーション更新
      this.animationState.legPhase += deltaTime * 8;
    }
    
    this.animationState.frame += deltaTime;
  }
  
  /**
   * ダメージを受ける
   * @param {number} damage - ダメージ量
   * @returns {boolean} 死亡した場合true
   */
  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
      return true;
    }
    return false;
  }
  
  /**
   * 描画処理（サブクラスでオーバーライド可能）
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {Object} camera - カメラオブジェクト
   */
  draw(ctx, camera) {
    // ★ワールド座標で描画（applyTransform内なのでそのまま）
    ctx.save();
    
    // 敵の本体
    ctx.fillStyle = this.color || '#ff0000';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // HPバー
    if (this.health < this.maxHealth) {
      const barWidth = this.size;
      const barHeight = 4;
      const barY = this.y - this.size / 2 - 8;
      
      // 背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);
      
      // HP
      const hpPercent = this.health / this.maxHealth;
      ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(this.x - barWidth / 2, barY, barWidth * hpPercent, barHeight);
    }
    
    ctx.restore();
  }
  
  /**
   * 画面座標で描画（ズーム対応）
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {number} screenX - 画面X座標
   * @param {number} screenY - 画面Y座標
   * @param {number} zoom - ズーム倍率
   */
  drawAtPosition(ctx, screenX, screenY, zoom) {
    ctx.save();
    
    // 敵の本体
    ctx.fillStyle = this.color || '#ff0000';
    ctx.beginPath();
    ctx.arc(screenX, screenY, (this.size / 2) * zoom, 0, Math.PI * 2);
    ctx.fill();
    
    // HPバー
    if (this.health < this.maxHealth) {
      const barWidth = this.size * zoom;
      const barHeight = 4 * zoom;
      const barY = screenY - (this.size / 2) * zoom - 8 * zoom;
      
      // 背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(screenX - barWidth / 2, barY, barWidth, barHeight);
      
      // HP
      const hpPercent = this.health / this.maxHealth;
      ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(screenX - barWidth / 2, barY, barWidth * hpPercent, barHeight);
    }
    
    ctx.restore();
  }
  
  /**
   * プレイヤーとの衝突判定
   * @param {Object} player - プレイヤーオブジェクト
   * @returns {boolean} 衝突している場合true
   */
  isCollidingWithPlayer(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (this.size + player.size) / 2;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.PixelApocalypse = window.PixelApocalypse || {};
  window.PixelApocalypse.EnemyBase = EnemyBase;
}
