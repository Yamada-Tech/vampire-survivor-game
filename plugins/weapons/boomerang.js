/**
 * ブーメランプラグイン
 * 往復して複数の敵を攻撃できる中距離武器
 */
class BoomerangWeapon extends window.PixelApocalypse.WeaponBase {
  constructor() {
    super({
      id: 'boomerang',
      name: 'ブーメラン',
      description: '中距離攻撃。往復で複数ヒット',
      author: 'PixelApocalypse Team',
      version: '1.0.0',
      type: 'ranged',
      damage: 20,
      attackSpeed: 2.0,
      range: 300,
      effectColor: '#ffaa00'
    });
    
    this.activeBoomerangs = [];
  }
  
  attack(player, enemies, currentTime) {
    if (!this.canAttack(currentTime)) return [];
    
    this.lastAttackTime = currentTime;
    
    // 最も近い敵の方向
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
    
    const boomerang = {
      x: player.x,
      y: player.y,
      startX: player.x,
      startY: player.y,
      angle: targetAngle,
      speed: 400,
      distance: 0,
      maxDistance: this.range,
      returning: false,
      rotation: 0,
      isAlive: true
    };
    
    this.activeBoomerangs.push(boomerang);
    
    return [];
  }
  
  update(deltaTime, player, enemies) {
    this.activeBoomerangs = this.activeBoomerangs.filter(boomerang => {
      if (!boomerang.isAlive) return false;
      
      boomerang.rotation += deltaTime * 20;
      
      if (!boomerang.returning) {
        // 前進
        boomerang.x += Math.cos(boomerang.angle) * boomerang.speed * deltaTime;
        boomerang.y += Math.sin(boomerang.angle) * boomerang.speed * deltaTime;
        boomerang.distance += boomerang.speed * deltaTime;
        
        if (boomerang.distance >= boomerang.maxDistance) {
          boomerang.returning = true;
        }
      } else {
        // 帰還
        const dx = player.x - boomerang.x;
        const dy = player.y - boomerang.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 20) {
          boomerang.isAlive = false;
          return false;
        }
        
        boomerang.x += (dx / distance) * boomerang.speed * deltaTime;
        boomerang.y += (dy / distance) * boomerang.speed * deltaTime;
      }
      
      // 敵との衝突判定
      enemies.forEach(enemy => {
        const dx = enemy.x - boomerang.x;
        const dy = enemy.y - boomerang.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < enemy.size) {
          enemy.takeDamage(this.damage);
        }
      });
      
      return boomerang.isAlive;
    });
  }
  
  draw(ctx, camera) {
    this.activeBoomerangs.forEach(boomerang => {
      const screenX = boomerang.x - camera.x + camera.canvas.width / 2;
      const screenY = boomerang.y - camera.y + camera.canvas.height / 2;
      
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(boomerang.rotation);
      
      ctx.fillStyle = this.effectColor;
      ctx.beginPath();
      ctx.arc(0, -5, 5, 0, Math.PI, false);
      ctx.arc(0, 5, 5, Math.PI, 0, false);
      ctx.fill();
      
      ctx.restore();
    });
  }
}

if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
  window.PixelApocalypse.WeaponRegistry.register(BoomerangWeapon);
}
