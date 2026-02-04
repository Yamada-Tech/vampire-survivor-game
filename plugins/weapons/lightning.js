/**
 * Lightning Weapon
 * チェインライトニング
 */

class Lightning extends window.PixelApocalypse.WeaponBase {
  constructor() {
    super({
      id: 'lightning',
      name: 'ライトニング',
      description: '敵から敵へと連鎖する稲妻攻撃',
      author: 'PixelApocalypse Team',
      version: '1.0.0',
      type: 'magic',
      damage: 25,
      attackSpeed: 3.0,
      range: 400,
      effectColor: '#00ffff'
    });
    
    this.chainCount = 5;
    this.chainRange = 200;
    this.projectiles = [];
    this.lightningEffect = null;
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
      
      if (dist < nearestDist && dist < this.range) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    });
    
    if (!nearestEnemy) return [];
    
    // チェインライトニング
    const hitEnemies = [nearestEnemy];
    const hitEnemiesSet = new Set([nearestEnemy]);
    let currentTarget = nearestEnemy;
    
    for (let i = 1; i < this.chainCount; i++) {
      let nextTarget = null;
      let nextDist = Infinity;
      
      enemies.forEach(enemy => {
        if (hitEnemiesSet.has(enemy)) return;
        
        const dx = enemy.x - currentTarget.x;
        const dy = enemy.y - currentTarget.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.chainRange && dist < nextDist) {
          nextDist = dist;
          nextTarget = enemy;
        }
      });
      
      if (!nextTarget) break;
      
      hitEnemies.push(nextTarget);
      hitEnemiesSet.add(nextTarget);
      currentTarget = nextTarget;
    }
    
    // ダメージを与える
    hitEnemies.forEach(enemy => {
      // プラグイン敵かどうか判定
      const isPluginEnemy = enemy instanceof window.PixelApocalypse?.EnemyBase;
      
      if (isPluginEnemy) {
        enemy.takeDamage(this.damage);
      } else {
        enemy.hp -= this.damage;
      }
    });
    
    // 稲妻のビジュアルエフェクトを保存
    this.lightningEffect = {
      player: { x: player.x, y: player.y },
      targets: hitEnemies.map(e => ({ x: e.x, y: e.y })),
      time: currentTime,
      duration: 200
    };
    
    return [];
  }
  
  update(deltaTime, player, enemies) {
    // 攻撃実行
    this.attack(player, enemies, Date.now());
  }
  
  draw(ctx, camera) {
    // 稲妻エフェクトを描画
    if (this.lightningEffect) {
      const elapsed = Date.now() - this.lightningEffect.time;
      
      if (elapsed < this.lightningEffect.duration) {
        const alpha = 1 - (elapsed / this.lightningEffect.duration);
        
        ctx.save();
        ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
        ctx.lineWidth = 4 * camera.zoom;
        ctx.shadowBlur = 15 * camera.zoom;
        ctx.shadowColor = '#00ffff';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // プレイヤーから最初のターゲットへ
        const playerScreen = camera.worldToScreen(
          this.lightningEffect.player.x,
          this.lightningEffect.player.y
        );
        
        if (this.lightningEffect.targets.length > 0) {
          const firstTarget = camera.worldToScreen(
            this.lightningEffect.targets[0].x,
            this.lightningEffect.targets[0].y
          );
          
          this.drawLightningBolt(ctx, playerScreen.x, playerScreen.y, firstTarget.x, firstTarget.y, camera.zoom);
          
          // チェイン
          for (let i = 0; i < this.lightningEffect.targets.length - 1; i++) {
            const from = camera.worldToScreen(
              this.lightningEffect.targets[i].x,
              this.lightningEffect.targets[i].y
            );
            const to = camera.worldToScreen(
              this.lightningEffect.targets[i + 1].x,
              this.lightningEffect.targets[i + 1].y
            );
            
            // チェインは細くする
            ctx.lineWidth = 3 * camera.zoom;
            ctx.strokeStyle = `rgba(150, 220, 255, ${alpha * 0.8})`;
            this.drawLightningBolt(ctx, from.x, from.y, to.x, to.y, camera.zoom);
          }
          
          // ヒットエフェクト
          this.lightningEffect.targets.forEach(target => {
            const targetScreen = camera.worldToScreen(target.x, target.y);
            
            ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(targetScreen.x, targetScreen.y, 20 * camera.zoom, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        
        ctx.restore();
      } else {
        this.lightningEffect = null;
      }
    }
  }
  
  drawLightningBolt(ctx, x1, y1, x2, y2, zoom) {
    const segments = 10;
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;
    const jitter = 15 * zoom;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    
    for (let i = 1; i < segments; i++) {
      const offsetX = (Math.random() - 0.5) * jitter;
      const offsetY = (Math.random() - 0.5) * jitter;
      ctx.lineTo(x1 + dx * i + offsetX, y1 + dy * i + offsetY);
    }
    
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // 細い枝を追加
    for (let i = 0; i < 3; i++) {
      const branchPoint = Math.random();
      const branchX = x1 + dx * segments * branchPoint;
      const branchY = y1 + dy * segments * branchPoint;
      const branchLength = jitter * 2;
      const branchAngle = Math.random() * Math.PI * 2;
      
      ctx.beginPath();
      ctx.moveTo(branchX, branchY);
      ctx.lineTo(
        branchX + Math.cos(branchAngle) * branchLength,
        branchY + Math.sin(branchAngle) * branchLength
      );
      ctx.stroke();
    }
  }
}

if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
  window.PixelApocalypse.WeaponRegistry.register(Lightning);
}
