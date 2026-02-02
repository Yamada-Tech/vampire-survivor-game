/**
 * 魔法弾プラグイン
 * 複数の敵を同時に追尾する遠距離武器
 */
class MagicWeapon extends window.PixelApocalypse.WeaponBase {
  constructor() {
    super({
      id: 'magic',
      name: '魔法弾',
      description: '遠距離攻撃。高速、広範囲',
      author: 'PixelApocalypse Team',
      version: '1.0.0',
      type: 'magic',
      damage: 15,
      attackSpeed: 1.0,
      range: 600,
      effectColor: '#00ffff',
      pierce: 3
    });
    
    this.activeBullets = [];
  }
  
  attack(player, enemies, currentTime) {
    if (!this.canAttack(currentTime)) return [];
    
    this.lastAttackTime = currentTime;
    
    // 最も近い3体の敵に向けて発射
    const targets = enemies
      .map(enemy => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        return {
          enemy,
          distance: Math.sqrt(dx * dx + dy * dy)
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
    
    // 敵がいない場合は右方向に発射
    if (targets.length === 0) {
      targets.push({
        enemy: { x: player.x + 100, y: player.y },
        distance: 100
      });
    }
    
    targets.forEach(target => {
      const dx = target.enemy.x - player.x;
      const dy = target.enemy.y - player.y;
      const angle = Math.atan2(dy, dx);
      
      const bullet = {
        x: player.x,
        y: player.y,
        angle: angle,
        speed: 500,
        pierceCount: 0,
        maxPierce: this.pierce,
        isAlive: true,
        hitEnemies: new Set()
      };
      
      this.activeBullets.push(bullet);
    });
    
    return [];
  }
  
  update(deltaTime, player, enemies) {
    this.activeBullets = this.activeBullets.filter(bullet => {
      if (!bullet.isAlive) return false;
      
      bullet.x += Math.cos(bullet.angle) * bullet.speed * deltaTime;
      bullet.y += Math.sin(bullet.angle) * bullet.speed * deltaTime;
      
      // 画面外チェック
      const dx = bullet.x - player.x;
      const dy = bullet.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > this.range) {
        bullet.isAlive = false;
        return false;
      }
      
      // 敵との衝突
      enemies.forEach(enemy => {
        if (bullet.hitEnemies.has(enemy)) return;
        
        const dx = enemy.x - bullet.x;
        const dy = enemy.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < enemy.size) {
          enemy.takeDamage(this.damage);
          bullet.hitEnemies.add(enemy);
          bullet.pierceCount++;
          
          if (bullet.pierceCount >= bullet.maxPierce) {
            bullet.isAlive = false;
          }
        }
      });
      
      return bullet.isAlive;
    });
  }
  
  draw(ctx, camera) {
    this.activeBullets.forEach(bullet => {
      const screenX = bullet.x - camera.x;
      const screenY = bullet.y - camera.y;
      
      ctx.fillStyle = this.effectColor;
      ctx.beginPath();
      ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // 軌跡エフェクト
      ctx.strokeStyle = this.effectColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(
        screenX - Math.cos(bullet.angle) * 20,
        screenY - Math.sin(bullet.angle) * 20
      );
      ctx.stroke();
    });
  }
}

if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
  window.PixelApocalypse.WeaponRegistry.register(MagicWeapon);
}
