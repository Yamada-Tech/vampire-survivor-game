/**
 * Fireball Weapon
 * 全方向に火の玉を発射
 */

class Fireball extends window.PixelApocalypse.WeaponBase {
  constructor() {
    super({
      id: 'fireball',
      name: 'ファイアボール',
      description: '全方向に火の玉を発射する',
      author: 'PixelApocalypse Team',
      version: '1.0.0',
      type: 'magic',
      damage: 15,
      attackSpeed: 2.0,
      range: 400,
      effectColor: '#ff6600'
    });
    
    this.projectileCount = 8;
    this.projectileSpeed = 200;
    this.currentAngle = 0;
    this.projectiles = [];
  }
  
  attack(player, enemies, currentTime) {
    if (!this.canAttack(currentTime)) {
      return [];
    }
    
    this.lastAttackTime = currentTime;
    
    const projectiles = [];
    const angleStep = (Math.PI * 2) / this.projectileCount;
    
    for (let i = 0; i < this.projectileCount; i++) {
      const angle = angleStep * i + this.currentAngle;
      
      projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * this.projectileSpeed,
        vy: Math.sin(angle) * this.projectileSpeed,
        damage: this.damage,
        range: this.range,
        distanceTraveled: 0,
        radius: 10,
        type: 'fireball'
      });
    }
    
    this.currentAngle += 0.1;
    this.projectiles.push(...projectiles);
    
    return [];
  }
  
  update(deltaTime, player, enemies) {
    // 攻撃実行
    const now = Date.now();
    this.attack(player, enemies, now);
    
    // 発射体の更新
    this.projectiles.forEach(proj => {
      proj.x += proj.vx * deltaTime;
      proj.y += proj.vy * deltaTime;
      
      const distance = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy) * deltaTime;
      proj.distanceTraveled += distance;
      
      // 敵との衝突判定
      enemies.forEach(enemy => {
        const dx = enemy.x - proj.x;
        const dy = enemy.y - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 弾丸の半径 + 敵の半径で衝突判定
        const projectileRadius = proj.radius || 10;
        const collisionDistance = projectileRadius + enemy.radius;
        
        if (dist < collisionDistance) {
          // プラグイン敵かどうか判定
          const isPluginEnemy = enemy instanceof window.PixelApocalypse?.EnemyBase;
          
          if (isPluginEnemy) {
            enemy.takeDamage(proj.damage);
          } else {
            enemy.hp -= proj.damage;
          }
          
          proj.distanceTraveled = proj.range;
        }
      });
    });
    
    // 範囲外の発射体を削除
    this.projectiles = this.projectiles.filter(proj => proj.distanceTraveled < proj.range);
  }
  
  draw(ctx, camera) {
    this.projectiles.forEach(proj => {
      if (!camera.isInView(proj.x, proj.y, 50)) return;
      
      const screenPos = camera.worldToScreen(proj.x, proj.y);
      const radius = 10 * camera.zoom;
      
      ctx.save();
      
      // 外側の光
      ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // 火の玉本体
      ctx.fillStyle = '#ff6600';
      ctx.shadowBlur = 15 * camera.zoom;
      ctx.shadowColor = '#ff6600';
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // 中心の明るい部分
      ctx.fillStyle = '#ffaa00';
      ctx.shadowBlur = 10 * camera.zoom;
      ctx.shadowColor = '#ffaa00';
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }
}

if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
  window.PixelApocalypse.WeaponRegistry.register(Fireball);
}
