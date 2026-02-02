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
    // 投げる腕のアニメーション（攻撃直後の短い時間だけ表示）
    const throwDuration = 0.2; // 投げモーションの表示時間
    const timeSinceLastAttack = (Date.now() - this.lastAttackTime) / 1000;
    
    if (timeSinceLastAttack < throwDuration) {
      // プレイヤー位置を取得（game.jsから渡される想定）
      // この部分はゲームループから呼ばれる際にプレイヤー情報が必要
      // 一旦、activeBoomerangsの最初の発射位置を参照
      if (this.activeBoomerangs.length > 0) {
        const firstBoomerang = this.activeBoomerangs[0];
        if (firstBoomerang.distance < 50) { // 発射直後のみ
          const screenX = firstBoomerang.startX - camera.x;
          const screenY = firstBoomerang.startY - camera.y;
          
          const throwProgress = timeSinceLastAttack / throwDuration;
          const armExtension = throwProgress * 30; // 腕を伸ばす距離
          
          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.rotate(firstBoomerang.angle);
          
          // 投げる腕
          ctx.strokeStyle = `rgba(255, 255, 255, ${1 - throwProgress})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(armExtension, 0);
          ctx.stroke();
          
          // 手
          ctx.fillStyle = `rgba(255, 200, 150, ${1 - throwProgress})`;
          ctx.beginPath();
          ctx.arc(armExtension, 0, 5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      }
    }
    
    // ブーメラン本体の描画
    this.activeBoomerangs.forEach(boomerang => {
      const screenX = boomerang.x - camera.x;
      const screenY = boomerang.y - camera.y;
      
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(boomerang.rotation);
      
      // ブーメラン本体（より立体的に）
      const gradient = ctx.createLinearGradient(-15, 0, 15, 0);
      gradient.addColorStop(0, '#D2691E'); // 茶色
      gradient.addColorStop(0.5, '#F4A460'); // 明るい茶色
      gradient.addColorStop(1, '#D2691E'); // 茶色
      
      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      
      // ブーメラン形状（湾曲した二つの腕）
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.bezierCurveTo(15, -8, 18, -3, 20, 5);
      ctx.lineTo(15, 8);
      ctx.bezierCurveTo(12, 5, 8, 3, 0, 0);
      ctx.bezierCurveTo(-8, 3, -12, 5, -15, 8);
      ctx.lineTo(-20, 5);
      ctx.bezierCurveTo(-18, -3, -15, -8, 0, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // 装飾ライン
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();
      
      ctx.restore();
    });
  }
}

if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
  window.PixelApocalypse.WeaponRegistry.register(BoomerangWeapon);
}
