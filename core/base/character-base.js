// core/base/character-base.js

/**
 * キャラクタープラグインの基底クラス
 */
class CharacterBase {
  constructor(config = {}) {
    // 必須プロパティ
    this.id = config.id || 'unknown';
    this.name = config.name || 'Unknown Character';
    this.description = config.description || '';
    this.author = config.author || 'Unknown';
    this.version = config.version || '1.0.0';
    
    // キャラクターパラメータ
    this.maxHealth = config.maxHealth || 100;
    this.speed = config.speed || 200; // ピクセル/秒
    this.size = config.size || 20; // ピクセル
    
    // 特殊能力（オプション）
    this.specialAbility = config.specialAbility || null;
    this.passiveBonus = config.passiveBonus || {};
    
    // アニメーション状態
    this.animationState = {
      frame: 0,
      legPhase: 0,
      armPhase: 0,
      bodyBounce: 0,
      isMoving: false,
      direction: 0
    };
  }
  
  /**
   * アニメーション更新（サブクラスでオーバーライド可能）
   * @param {number} deltaTime - フレーム間の経過時間（秒）
   * @param {boolean} isMoving - 移動中かどうか
   * @param {number} direction - 移動方向（ラジアン）
   */
  updateAnimation(deltaTime, isMoving, direction = 0) {
    this.animationState.isMoving = isMoving;
    this.animationState.direction = direction;
    
    if (isMoving) {
      this.animationState.legPhase += deltaTime * 8;
      this.animationState.armPhase = this.animationState.legPhase;
      this.animationState.bodyBounce = Math.sin(this.animationState.legPhase * 2) * 2;
    } else {
      // 停止時は自然な位置に戻る
      this.animationState.legPhase *= 0.9;
      this.animationState.armPhase *= 0.9;
      this.animationState.bodyBounce *= 0.9;
    }
    
    this.animationState.frame += deltaTime;
  }
  
  /**
   * 描画処理（サブクラスでオーバーライド必須）
   * @abstract
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {number} x - 描画X座標（スクリーン座標）
   * @param {number} y - 描画Y座標（スクリーン座標）
   * @param {Object} animationState - アニメーション状態
   */
  draw(ctx, x, y, animationState) {
    throw new Error('CharacterBase.draw() must be implemented by subclass');
  }
  
  /**
   * 特殊能力の実行（オプション）
   * @param {Object} player - プレイヤーオブジェクト
   * @param {Array} enemies - 敵の配列
   */
  useSpecialAbility(player, enemies) {
    if (this.specialAbility && typeof this.specialAbility === 'function') {
      this.specialAbility(player, enemies);
    }
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.PixelApocalypse = window.PixelApocalypse || {};
  window.PixelApocalypse.CharacterBase = CharacterBase;
}
