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
      range: 150,
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
    // 三日月型の斬撃エフェクトを描画
    this.activeSlashes.forEach(slash => {
      const screenX = slash.x - camera.x + camera.canvas.width / 2;
      const screenY = slash.y - camera.y + camera.canvas.height / 2;
      
      const alpha = 1 - (slash.elapsed / slash.duration);
      
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(slash.angle);
      
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 3;
      
      // 三日月の弧
      ctx.beginPath();
      ctx.arc(0, 0, this.range, -Math.PI / 4, Math.PI / 4);
      ctx.stroke();
      
      ctx.restore();
    });
  }
}

// 自動登録
if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
  window.PixelApocalypse.WeaponRegistry.register(SwordWeapon);
}
