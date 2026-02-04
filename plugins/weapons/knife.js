/**
 * Knife Weapon
 * 回転するナイフを投げる
 */

class Knife extends window.PixelApocalypse.WeaponBase {
  constructor() {
    super({
      id: 'knife',
      name: 'ナイフ',
      description: '敵に向かって回転するナイフを投げる',
      author: 'PixelApocalypse Team',
      version: '1.0.0',
      type: 'ranged',
      damage: 20,
      attackSpeed: 0.5,
      range: 300,
      effectColor: '#cccccc'
    });
    
    this.projectileSpeed = 400;
    this.projectiles = [];
  }
  
  attack(player, enemies, currentTime) {
    if (!this.canAttack(currentTime)) {
      return [];
    }
    
    this.lastAttackTime = currentTime;
    
    // 最も近い敵を探す
    let nearestEnemy = null;
    let nearestDist = Infinity;
    
    enemies.forEach(enemy => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    });
    
    if (!nearestEnemy) return [];
    
    const angle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
    
    const projectile = {
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * this.projectileSpeed,
      vy: Math.sin(angle) * this.projectileSpeed,
      damage: this.damage,
      range: this.range,
      distanceTraveled: 0,
      angle: angle,
      rotation: 0,
      radius: 8,  // ★当たり判定の半径
      type: 'knife'
    };
    
    this.projectiles.push(projectile);
    
    return [];
  }
  
  update(deltaTime, player, enemies) {
    // 攻撃実行
    const now = Date.now();
    this.attack(player, enemies, now);
    
    // 発射体の更新
    this.projectiles = this.projectiles.filter(proj => {
      proj.x += proj.vx * deltaTime;
      proj.y += proj.vy * deltaTime;
      
      // 回転アニメーション
      proj.rotation += 15 * deltaTime;
      
      const distance = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy) * deltaTime;
      proj.distanceTraveled += distance;
      
      // ★敵との衝突判定（ヒットフラグで1回のみダメージ）
      let hit = false;
      enemies.forEach(enemy => {
        if (enemy.health > 0 || enemy.hp > 0) {
          const dx = enemy.x - proj.x;
          const dy = enemy.y - proj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // ナイフの半径 + 敵の半径で衝突判定
          const knifeRadius = proj.radius || 8;
          const enemyRadius = enemy.radius || enemy.size / 2 || 10;
          const collisionDistance = knifeRadius + enemyRadius;
          
          if (dist < collisionDistance) {
            // プラグイン敵かどうか判定
            const isPluginEnemy = enemy instanceof window.PixelApocalypse?.EnemyBase;
            
            if (isPluginEnemy) {
              enemy.takeDamage(proj.damage);
            } else if (enemy.hp !== undefined) {
              enemy.hp -= proj.damage;
            }
            
            hit = true;
          }
        }
      });
      
      // ヒットしたか範囲外なら削除
      return proj.distanceTraveled < proj.range && !hit;
    });
  }
  
  draw(ctx, camera) {
    this.projectiles.forEach(proj => {
      if (!camera.isInView(proj.x, proj.y, 50)) return;
      
      const screenPos = camera.worldToScreen(proj.x, proj.y);
      const size = 20 * camera.zoom;
      
      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      ctx.rotate(proj.rotation);
      
      // ナイフの影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.moveTo(size * 0.6, 0);
      ctx.lineTo(-size * 0.3, size * 0.2);
      ctx.lineTo(-size * 0.3, -size * 0.2);
      ctx.closePath();
      ctx.fill();
      
      // ナイフの刃
      ctx.fillStyle = '#cccccc';
      ctx.beginPath();
      ctx.moveTo(size * 0.5, 0);
      ctx.lineTo(-size * 0.2, size * 0.15);
      ctx.lineTo(-size * 0.2, -size * 0.15);
      ctx.closePath();
      ctx.fill();
      
      // ナイフの柄
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-size * 0.5, -size * 0.1, size * 0.3, size * 0.2);
      
      // ハイライト
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(size * 0.3, 0);
      ctx.lineTo(size * 0.1, size * 0.05);
      ctx.lineTo(size * 0.1, -size * 0.05);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    });
  }
}

if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
  window.PixelApocalypse.WeaponRegistry.register(Knife);
}
