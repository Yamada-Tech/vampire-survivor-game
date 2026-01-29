// core/base/weapon-base.js

/**
 * 武器プラグインの基底クラス
 * すべての武器はこのクラスを継承する
 */
class WeaponBase {
  constructor(config = {}) {
    // 必須プロパティ
    this.id = config.id || 'unknown';
    this.name = config.name || 'Unknown Weapon';
    this.description = config.description || '';
    this.author = config.author || 'Unknown';
    this.version = config.version || '1.0.0';
    this.category = config.category || 'default';
    
    // 武器パラメータ
    this.type = config.type || 'melee'; // 'melee', 'ranged', 'magic'
    this.damage = config.damage || 10;
    this.attackSpeed = config.attackSpeed || 1.0; // 秒
    this.range = config.range || 100; // ピクセル
    this.knockback = config.knockback || 5;
    this.pierce = config.pierce || 1; // 貫通数
    
    // エフェクト設定
    this.effectColor = config.effectColor || '#ffffff';
    this.effectSize = config.effectSize || 1.0;
    this.particleEffect = config.particleEffect || null;
    
    // 内部状態
    this.lastAttackTime = 0;
    this.projectiles = [];
  }
  
  /**
   * 攻撃可能かチェック
   * @param {number} currentTime - 現在時刻（ミリ秒）
   * @returns {boolean} 攻撃可能な場合true
   */
  canAttack(currentTime) {
    return currentTime - this.lastAttackTime >= this.attackSpeed * 1000;
  }
  
  /**
   * 攻撃実行（サブクラスでオーバーライド必須）
   * @abstract
   * @param {Object} player - プレイヤーオブジェクト
   * @param {Array} enemies - 敵の配列
   * @param {number} currentTime - 現在時刻（ミリ秒）
   * @returns {Array} 攻撃でヒットした敵の配列
   */
  attack(player, enemies, currentTime) {
    throw new Error('WeaponBase.attack() must be implemented by subclass');
  }
  
  /**
   * 更新処理
   * @param {number} deltaTime - フレーム間の経過時間（秒）
   * @param {Object} player - プレイヤーオブジェクト
   * @param {Array} enemies - 敵の配列
   */
  update(deltaTime, player, enemies) {
    // 弾丸の更新（サブクラスで使用可能）
    if (this.projectiles && this.projectiles.length > 0) {
      this.projectiles = this.projectiles.filter(projectile => {
        if (projectile.update) {
          projectile.update(deltaTime, enemies);
        }
        return projectile.isAlive !== false;
      });
    }
  }
  
  /**
   * 描画処理
   * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
   * @param {Object} camera - カメラオブジェクト
   */
  draw(ctx, camera) {
    // 弾丸の描画（サブクラスで使用可能）
    if (this.projectiles && this.projectiles.length > 0) {
      this.projectiles.forEach(projectile => {
        if (projectile.draw) {
          projectile.draw(ctx, camera);
        }
      });
    }
  }
  
  /**
   * レベルアップ時のステータス向上
   */
  levelUp() {
    const DAMAGE_MULTIPLIER = 1.1;
    const ATTACK_SPEED_MULTIPLIER = 0.95;
    const MIN_ATTACK_SPEED = 0.1;
    
    this.damage *= DAMAGE_MULTIPLIER;
    this.attackSpeed = Math.max(MIN_ATTACK_SPEED, this.attackSpeed * ATTACK_SPEED_MULTIPLIER); // 速くなる（最小0.1秒）
  }
  
  /**
   * 武器のクローンを作成
   * @returns {WeaponBase} クローンされた武器
   */
  clone() {
    return new this.constructor();
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.PixelApocalypse = window.PixelApocalypse || {};
  window.PixelApocalypse.WeaponBase = WeaponBase;
}
