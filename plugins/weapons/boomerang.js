/**
 * ブーメランプラグイン
 * 往復して複数の敵を攻撃できる中距離武器
 */
class Boomerang extends window.PixelApocalypse.WeaponBase {
  constructor() {
    super({
      id: 'boomerang',
      name: 'ブーメラン',
      description: '投げると戻ってくる中距離武器',
      author: 'PixelApocalypse Team',
      version: '1.0.0',
      type: 'ranged',
      damage: 15,  // ★30→15に変更（往復で2回当たるので合計30）
      attackSpeed: 2.2, // ★1.5→2.2に変更（1.5秒飛行 + 0.7秒待機）
      range: 250,
      pierce: 999,
      effectColor: '#d2691e'
    });
    
    this.activeBoomerangs = [];
    this.boomerangCount = 1; // ★初期は1本のみ
    this.cooldownAfterReturn = 700; // ★戻ってから次を投げるまでの待機時間（ミリ秒）
    this.lastReturnTime = -Infinity; // ★最後に戻ってきた時刻（初回は即座に投げられる）
  }
  
  attack(player, enemies, currentTime) {
    if (!this.canAttack(currentTime)) return [];
    
    // 既にブーメランが飛んでいる場合は投げない
    if (this.activeBoomerangs.length > 0) {
      return [];
    }
    
    // ★両方ともDate.now()を使用して時刻を統一
    const now = Date.now();
    if (now - this.lastReturnTime < this.cooldownAfterReturn) {
      return [];
    }
    
    this.lastAttackTime = currentTime;
    
    // 最も近い敵の方向に投げる
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
    
    // ★1本だけ生成
    const boomerang = {
      x: player.x,
      y: player.y,
      startX: player.x,
      startY: player.y,
      angle: targetAngle,
      speed: 250,
      distance: 0,
      maxDistance: this.range,
      returning: false,
      rotation: 0,
      isAlive: true,
      outwardHitEnemies: new Set(), // ★往路でヒットした敵
      returnHitEnemies: new Set()   // ★復路でヒットした敵
    };
    
    this.activeBoomerangs.push(boomerang);
    
    return [];
  }
  
  update(deltaTime, player, enemies) {
    this.activeBoomerangs.forEach(boomerang => {
      if (!boomerang.isAlive) return;
      
      // 回転アニメーション
      boomerang.rotation += deltaTime * 10;
      
      if (!boomerang.returning) {
        // 往路: 進む
        boomerang.x += Math.cos(boomerang.angle) * boomerang.speed * deltaTime;
        boomerang.y += Math.sin(boomerang.angle) * boomerang.speed * deltaTime;
        
        const dx = boomerang.x - boomerang.startX;
        const dy = boomerang.y - boomerang.startY;
        boomerang.distance = Math.sqrt(dx * dx + dy * dy);
        
        // 最大距離に達したら戻る
        if (boomerang.distance >= boomerang.maxDistance) {
          boomerang.returning = true;
        }
        
        // ★往路の当たり判定
        enemies.forEach(enemy => {
          if (boomerang.outwardHitEnemies.has(enemy)) {
            return; // すでにヒットした敵はスキップ
          }
          
          const dx = enemy.x - boomerang.x;
          const dy = enemy.y - boomerang.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 30) {
            // 敵にダメージを与える
            const isPluginEnemy = enemy instanceof window.PixelApocalypse?.EnemyBase;
            
            if (isPluginEnemy) {
              enemy.takeDamage(this.damage);
            } else {
              enemy.hp -= this.damage;
            }
            
            // この敵を往路ヒット済みとしてマーク
            boomerang.outwardHitEnemies.add(enemy);
          }
        });
      } else {
        // 復路: プレイヤーに向かって戻る
        const dx = player.x - boomerang.x;
        const dy = player.y - boomerang.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 20) {
          // プレイヤーに到達したら消滅
          boomerang.isAlive = false;
          // ★単純に現在時刻をミリ秒で記録
          this.lastReturnTime = Date.now();
          return;
        }
        
        boomerang.angle = Math.atan2(dy, dx);
        boomerang.x += Math.cos(boomerang.angle) * boomerang.speed * deltaTime;
        boomerang.y += Math.sin(boomerang.angle) * boomerang.speed * deltaTime;
        
        // ★復路の当たり判定
        enemies.forEach(enemy => {
          if (boomerang.returnHitEnemies.has(enemy)) {
            return; // すでにヒットした敵はスキップ
          }
          
          const dx = enemy.x - boomerang.x;
          const dy = enemy.y - boomerang.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 30) {
            // 敵にダメージを与える
            const isPluginEnemy = enemy instanceof window.PixelApocalypse?.EnemyBase;
            
            if (isPluginEnemy) {
              enemy.takeDamage(this.damage);
            } else {
              enemy.hp -= this.damage;
            }
            
            // この敵を復路ヒット済みとしてマーク
            boomerang.returnHitEnemies.add(enemy);
          }
        });
      }
    });
    
    // 消滅したブーメランを削除
    this.activeBoomerangs = this.activeBoomerangs.filter(b => b.isAlive);
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
          // ★ワールド座標をスクリーン座標に変換
          const screenPos = camera.worldToScreen(firstBoomerang.startX, firstBoomerang.startY);
          
          const throwProgress = timeSinceLastAttack / throwDuration;
          const armExtension = throwProgress * 30 * camera.zoom; // 腕を伸ばす距離
          
          ctx.save();
          ctx.translate(screenPos.x, screenPos.y);
          ctx.rotate(firstBoomerang.angle);
          
          // 投げる腕
          ctx.strokeStyle = `rgba(255, 255, 255, ${1 - throwProgress})`;
          ctx.lineWidth = 3 * camera.zoom;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(armExtension, 0);
          ctx.stroke();
          
          // 手
          ctx.fillStyle = `rgba(255, 200, 150, ${1 - throwProgress})`;
          ctx.beginPath();
          ctx.arc(armExtension, 0, 5 * camera.zoom, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      }
    }
    
    // ブーメラン本体の描画
    this.activeBoomerangs.forEach(boomerang => {
      // ★ワールド座標をスクリーン座標に変換
      const screenPos = camera.worldToScreen(boomerang.x, boomerang.y);
      
      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      ctx.rotate(boomerang.rotation);
      
      // ★ズームを考慮したサイズ
      const size = camera.zoom;
      
      // ブーメラン本体（より立体的に）
      const gradient = ctx.createLinearGradient(-15 * size, 0, 15 * size, 0);
      gradient.addColorStop(0, '#D2691E'); // 茶色
      gradient.addColorStop(0.5, '#F4A460'); // 明るい茶色
      gradient.addColorStop(1, '#D2691E'); // 茶色
      
      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2 * size;
      
      // ブーメラン形状（湾曲した二つの腕）
      ctx.beginPath();
      ctx.moveTo(0, -10 * size);
      ctx.bezierCurveTo(15 * size, -8 * size, 18 * size, -3 * size, 20 * size, 5 * size);
      ctx.lineTo(15 * size, 8 * size);
      ctx.bezierCurveTo(12 * size, 5 * size, 8 * size, 3 * size, 0, 0);
      ctx.bezierCurveTo(-8 * size, 3 * size, -12 * size, 5 * size, -15 * size, 8 * size);
      ctx.lineTo(-20 * size, 5 * size);
      ctx.bezierCurveTo(-18 * size, -3 * size, -15 * size, -8 * size, 0, -10 * size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // 装飾ライン
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1 * size;
      ctx.beginPath();
      ctx.moveTo(-10 * size, 0);
      ctx.lineTo(10 * size, 0);
      ctx.stroke();
      
      ctx.restore();
    });
  }
  
  levelUp() {
    super.levelUp();
    
    // 3レベルごとにブーメラン+1（最大4本）
    if (this.level % 3 === 0 && this.boomerangCount < 4) {
      this.boomerangCount++;
      console.log(`Boomerang count increased: ${this.boomerangCount}`);
    }
  }
}

if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
  window.PixelApocalypse.WeaponRegistry.register(Boomerang);
}
