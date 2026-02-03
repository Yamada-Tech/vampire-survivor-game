/**
 * 魔法弾プラグイン
 * 複数の敵を同時に追尾する遠距離武器
 */
class Magic extends window.PixelApocalypse.WeaponBase {
  constructor() {
    super({
      id: 'magic',
      name: '魔法',
      description: '魔法弾を発射する遠距離武器',
      author: 'PixelApocalypse Team',
      version: '1.0.0',
      type: 'ranged',
      damage: 20,
      attackSpeed: 2.0,
      range: 500,
      pierce: 0,  // ★初期は貫通なし（1体で消える）
      effectColor: '#aa44ff'
    });
    
    this.activeBullets = [];
    this.projectileCount = 1;  // ★初期は1発のみ
  }
  
  attack(player, enemies, currentTime) {
    if (!this.canAttack(currentTime)) return [];
    
    this.lastAttackTime = currentTime;
    
    // 最も近い敵に向けて発射（projectileCount数だけ）
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
      .slice(0, this.projectileCount);  // ★projectileCount数だけ取得
    
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
        startX: player.x,
        startY: player.y,
        angle: angle,
        speed: 300,  // ★速度を500→300に減速
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
    // 杖を掲げるアニメーション（詠唱モーション）
    const castDuration = 0.3;
    const timeSinceLastAttack = (Date.now() - this.lastAttackTime) / 1000;
    
    if (timeSinceLastAttack < castDuration && this.activeBullets.length > 0) {
      // 最初の弾の発射位置から描画
      const firstBullet = this.activeBullets[0];
      const playerX = firstBullet.startX;
      const playerY = firstBullet.startY;
      
      // ★ワールド座標をスクリーン座標に変換
      const screenPos = camera.worldToScreen(playerX, playerY);
      
      const castProgress = timeSinceLastAttack / castDuration;
      const staffRaiseHeight = (40 - (castProgress * 20)) * camera.zoom;
      
      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      
      // 杖の柄（茶色の棒）
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 4 * camera.zoom;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -staffRaiseHeight);
      ctx.stroke();
      
      // 杖の先端（宝石）
      const gemSize = (8 + Math.sin(castProgress * Math.PI * 4) * 2) * camera.zoom;
      const gemGlow = ctx.createRadialGradient(0, -staffRaiseHeight, 0, 0, -staffRaiseHeight, gemSize);
      gemGlow.addColorStop(0, '#FF00FF');
      gemGlow.addColorStop(0.5, '#AA44FF');
      gemGlow.addColorStop(1, 'rgba(170, 68, 255, 0)');
      
      ctx.fillStyle = gemGlow;
      ctx.beginPath();
      ctx.arc(0, -staffRaiseHeight, gemSize, 0, Math.PI * 2);
      ctx.fill();
      
      // 宝石の輝き（中心）
      ctx.fillStyle = `rgba(255, 255, 255, ${(1 - castProgress) * 0.8})`;
      ctx.beginPath();
      ctx.arc(0, -staffRaiseHeight, gemSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // 魔法陣エフェクト
      const circleRadius = castProgress * 30 * camera.zoom;
      ctx.strokeStyle = `rgba(170, 68, 255, ${1 - castProgress})`;
      ctx.lineWidth = 2 * camera.zoom;
      ctx.beginPath();
      ctx.arc(0, -staffRaiseHeight, circleRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // 魔法の粒子
      for (let i = 0; i < 6; i++) {
        const angle = (Date.now() / 100 + i * Math.PI / 3) % (Math.PI * 2);
        const particleRadius = 20 * camera.zoom;
        const px = Math.cos(angle) * particleRadius;
        const py = -staffRaiseHeight + Math.sin(angle) * particleRadius;
        
        ctx.fillStyle = `rgba(170, 68, 255, ${(1 - castProgress) * 0.6})`;
        ctx.beginPath();
        ctx.arc(px, py, 3 * camera.zoom, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
    
    // 魔法弾の描画
    this.activeBullets.forEach(bullet => {
      // ★ワールド座標をスクリーン座標に変換
      const screenPos = camera.worldToScreen(bullet.x, bullet.y);
      
      // 魔法弾本体（グロー効果）
      const glowRadius = 10 * camera.zoom;
      const glowGradient = ctx.createRadialGradient(screenPos.x, screenPos.y, 0, screenPos.x, screenPos.y, glowRadius);
      glowGradient.addColorStop(0, this.effectColor);
      glowGradient.addColorStop(0.5, 'rgba(170, 68, 255, 0.6)');
      glowGradient.addColorStop(1, 'rgba(170, 68, 255, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // 中心の明るい点
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 4 * camera.zoom, 0, Math.PI * 2);
      ctx.fill();
      
      // 軌跡エフェクト
      ctx.strokeStyle = this.effectColor;
      ctx.lineWidth = 2 * camera.zoom;
      ctx.beginPath();
      ctx.moveTo(screenPos.x, screenPos.y);
      ctx.lineTo(
        screenPos.x - Math.cos(bullet.angle) * 20 * camera.zoom,
        screenPos.y - Math.sin(bullet.angle) * 20 * camera.zoom
      );
      ctx.stroke();
      
      // 小さな星型の装飾
      ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
      for (let i = 0; i < 4; i++) {
        const starAngle = bullet.angle + (Math.PI / 2) * i;
        const starDist = 3 * camera.zoom;
        const sx = screenPos.x + Math.cos(starAngle) * starDist;
        const sy = screenPos.y + Math.sin(starAngle) * starDist;
        const starSize = 2 * camera.zoom;
        ctx.fillRect(sx - starSize / 2, sy - starSize / 2, starSize, starSize);
      }
    });
  }
  
  levelUp() {
    // 親クラスのlevelUp（ダメージ・攻撃速度向上）
    super.levelUp();
    
    // 魔法特有のレベルアップ
    // 3レベルごとに発射数+1（最大5発）
    if (this.level % 3 === 0 && this.projectileCount < 5) {
      this.projectileCount++;
      console.log(`Magic projectile count increased: ${this.projectileCount}`);
    }
    
    // 2レベルごとに貫通+1（最大3）
    if (this.level % 2 === 0 && this.pierce < 3) {
      this.pierce++;
      console.log(`Magic pierce increased: ${this.pierce}`);
    }
  }
}

if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
  window.PixelApocalypse.WeaponRegistry.register(Magic);
}
