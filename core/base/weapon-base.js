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
    
    // 武器パラメータ - ベース値
    this.type = config.type || 'melee'; // 'melee', 'ranged', 'magic'
    this.baseDamage = config.damage || 10;
    this.baseAttackSpeed = config.attackSpeed || 1.0; // 秒（クールダウン）
    this.baseRange = config.range || 100; // ピクセル
    this.knockback = config.knockback || 5;
    this.pierce = config.pierce || 1; // 貫通数
    
    // ★武器レベルシステム
    this.level = 1;
    this.damageMultiplier = 1.0;      // 攻撃力倍率
    this.cooldownMultiplier = 1.0;    // クールダウン倍率
    this.rangeMultiplier = 1.0;       // 射程倍率
    
    // 計算後のステータス（後方互換性のため damage, attackSpeed, range も保持）
    this.updateStats();
    
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
   * ステータスを再計算
   */
  updateStats() {
    this.damage = Math.floor(this.baseDamage * this.damageMultiplier);
    this.attackSpeed = this.baseAttackSpeed * this.cooldownMultiplier;
    this.range = this.baseRange * this.rangeMultiplier;
  }
  
  /**
   * 武器を強化
   */
  upgrade(upgradeType) {
    this.level++;
    
    switch (upgradeType) {
      case 'damage':
        this.damageMultiplier *= 1.2;  // +20%
        break;
      case 'speed':
        this.cooldownMultiplier *= 0.85;  // -15%
        break;
      case 'range':
        this.rangeMultiplier *= 1.25;  // +25%
        break;
    }
    
    this.updateStats();
    console.log(`${this.name} upgraded to level ${this.level}`);
  }
  
  /**
   * 武器情報を取得
   */
  getInfo() {
    return {
      name: this.name,
      level: this.level,
      damage: this.damage,
      cooldown: this.attackSpeed.toFixed(2),
      range: Math.floor(this.range)
    };
  }
  
  /**
   * レベルアップ時のステータス向上（後方互換性のため残す）
   */
  levelUp() {
    this.level++;
    
    const DAMAGE_MULTIPLIER = 1.1;
    const ATTACK_SPEED_MULTIPLIER = 0.95;
    const MIN_ATTACK_SPEED = 0.1;
    
    this.damage *= DAMAGE_MULTIPLIER;
    this.attackSpeed = Math.max(MIN_ATTACK_SPEED, this.attackSpeed * ATTACK_SPEED_MULTIPLIER);
    
    console.log(`${this.name} leveled up to ${this.level}`);
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
