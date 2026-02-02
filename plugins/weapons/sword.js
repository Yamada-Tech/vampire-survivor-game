/**
 * 剣プラグイン
 * 三日月型の斬撃エフェクトを持つ近接武器
 */
class SwordWeapon extends window.PixelApocalypse.WeaponBase {
  constructor() {
    super({
      id: 'sword',
      name: '剣',
      description: '近接攻撃。高ダメージ、狭範囲',
      author: 'PixelApocalypse Team',
      version: '1.0.0',
      type: 'melee',
      damage: 30,
      attackSpeed: 1.5,
      range: 60,
      effectColor: '#ffffff'
    });
    
    this.activeSlashes = [];
  }
  
  attack(player, enemies, currentTime) {
    if (!this.canAttack(currentTime)) return [];
    
    this.lastAttackTime = currentTime;
    
    // 最も近い敵の方向に攻撃
    let targetAngle = 0;
    let minDistance = Infinity;
    
    enemies.forEach(enemy => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        targetAngle = Math.atan2(dy, dx);
      }
    });
    
    // 敵がいない場合は右方向
    if (minDistance === Infinity) {
      targetAngle = 0;
    }
    
    // 斬撃エフェクトを作成
    const slash = {
      x: player.x,
      y: player.y,
      angle: targetAngle,
      duration: 0.3,
      elapsed: 0
    };
    
    this.activeSlashes.push(slash);
    
    // 範囲内の敵にダメージ
    const hitEnemies = [];
    enemies.forEach(enemy => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      // 角度差を正しく計算（±πの境界を考慮）
      const angleDiff = Math.abs(Math.atan2(Math.sin(angle - targetAngle), Math.cos(angle - targetAngle)));
      
      if (distance <= this.range && angleDiff < Math.PI / 3) {
        enemy.takeDamage(this.damage);
        hitEnemies.push(enemy);
      }
    });
    
    return hitEnemies;
  }
  
  update(deltaTime, player, enemies) {
    // 斬撃エフェクトの更新
    this.activeSlashes = this.activeSlashes.filter(slash => {
      slash.elapsed += deltaTime;
      return slash.elapsed < slash.duration;
    });
  }
  
  draw(ctx, camera) {
    this.activeSlashes.forEach(slash => {
      const screenX = slash.x - camera.x;
      const screenY = slash.y - camera.y;
      
      const alpha = 1 - (slash.elapsed / slash.duration);
      
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(slash.angle);
      
      // 剣の本体を描画
      const swordLength = this.range * 0.8; // 剣の長さ
      const swordWidth = 6; // 剣の幅
      const gripLength = 15; // 柄の長さ
      
      // 剣の振りアニメーション（-90度から+90度まで振る）
      const swingProgress = slash.elapsed / slash.duration;
      const swingAngle = -Math.PI / 2 + (swingProgress * Math.PI); // -90度から+90度
      
      ctx.save();
      ctx.rotate(swingAngle);
      
      // ★重要：グリップを中心点(0, 0)に配置
      // グリップ（柄）は原点から上に伸びる
      ctx.fillStyle = '#8B4513'; // 茶色
      ctx.fillRect(-swordWidth / 2, -gripLength, swordWidth, gripLength);
      
      // ツバ（鍔）- グリップの上端
      ctx.fillStyle = '#FFD700'; // 金色
      ctx.fillRect(-10, -gripLength - 3, 20, 3);
      
      // 剣の刃（グリップの上から伸びる）
      const gradient = ctx.createLinearGradient(0, -gripLength, 0, -gripLength - swordLength);
      gradient.addColorStop(0, '#E8E8E8'); // 明るい銀色
      gradient.addColorStop(0.5, '#FFFFFF'); // 白（反射）
      gradient.addColorStop(1, '#C0C0C0'); // 銀色
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, -gripLength); // 刃の始点（ツバの上）
      ctx.lineTo(-swordWidth / 2, -gripLength - 5); // 左側
      ctx.lineTo(-swordWidth / 3, -gripLength - swordLength + 10); // 左側（先端手前）
      ctx.lineTo(0, -gripLength - swordLength); // 先端
      ctx.lineTo(swordWidth / 3, -gripLength - swordLength + 10); // 右側（先端手前）
      ctx.lineTo(swordWidth / 2, -gripLength - 5); // 右側
      ctx.closePath();
      ctx.fill();
      
      // 刃のハイライト
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-1, -gripLength - 5);
      ctx.lineTo(-1, -gripLength - swordLength + 15);
      ctx.stroke();
      
      ctx.restore();
      
      // 軌跡エフェクト（淡い弧）
      ctx.strokeStyle = `rgba(200, 220, 255, ${alpha * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, swordLength, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      
      ctx.restore();
    });
  }
}

// 自動登録
if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
  window.PixelApocalypse.WeaponRegistry.register(SwordWeapon);
}
