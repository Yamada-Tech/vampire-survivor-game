class Sword extends window.PixelApocalypse.WeaponBase {
  constructor() {
    super({
      id: 'sword',
      name: '剣',
      description: '近接攻撃武器。高ダメージ',
      author: 'PixelApocalypse Team',
      version: '1.0.0',
      type: 'melee',
      damage: 35,
      attackSpeed: 1.5,
      range: 80,  // ★60→80に拡大
      effectColor: '#4db8ff'
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
    
    // 斬撃エフェクトを作成（プレイヤーへの参照を保持）
    const slash = {
      player: player,
      angle: targetAngle,
      duration: 0.4,  // 少し長めに
      elapsed: 0
    };
    
    this.activeSlashes.push(slash);
    
    // 扇形全体の当たり判定
    const hitEnemies = [];
    const swordLength = this.range * 0.8;
    const swingAngleRange = Math.PI * 1.2; // 216度の扇形（より広く）
    const swingStartAngle = targetAngle - swingAngleRange / 2;
    const swingEndAngle = targetAngle + swingAngleRange / 2;
    
    enemies.forEach(enemy => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distanceToEnemy = Math.sqrt(dx * dx + dy * dy);
      const angleToEnemy = Math.atan2(dy, dx);
      
      // 角度差を正規化（-πからπの範囲に）
      let angleDiff = angleToEnemy - targetAngle;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      // 扇形の範囲内かチェック
      const isInAngleRange = Math.abs(angleDiff) <= swingAngleRange / 2;
      
      // 剣の長さの範囲内かチェック
      const isInDistanceRange = distanceToEnemy <= swordLength;
      
      if (isInAngleRange && isInDistanceRange) {
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
      // プレイヤーの現在位置を使用
      const screenX = slash.player.x - camera.x;
      const screenY = slash.player.y - camera.y;
      
      const progress = slash.elapsed / slash.duration;
      const alpha = 1 - progress;
      
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(slash.angle);
      
      const swordLength = this.range * 0.8;
      const swingAngleRange = Math.PI * 1.2;
      
      // 振りのアニメーション（-108度から+108度）
      const swingProgress = progress;
      const currentSwingAngle = -swingAngleRange / 2 + (swingProgress * swingAngleRange);
      
      ctx.save();
      ctx.rotate(currentSwingAngle);
      
      // ★発光エフェクト - 複数の光の軌跡
      const trailCount = 5; // 軌跡の数
      const trailSpacing = 8; // 軌跡の間隔
      
      for (let i = 0; i < trailCount; i++) {
        const trailOffset = (i - trailCount / 2) * trailSpacing;
        const trailAlpha = alpha * (1 - Math.abs(i - trailCount / 2) / trailCount * 0.5);
        
        // 軌跡の色（青→白のグラデーション）
        const colors = [
          { r: 77, g: 184, b: 255, a: trailAlpha * 0.3 },   // 外側：薄い青
          { r: 150, g: 220, b: 255, a: trailAlpha * 0.6 },  // 中間：明るい青
          { r: 200, g: 240, b: 255, a: trailAlpha * 0.8 },  // 内側：ほぼ白
          { r: 255, g: 255, b: 255, a: trailAlpha }         // 中心：純白
        ];
        
        // グロー効果（外側の光）
        for (let glowLayer = 3; glowLayer >= 0; glowLayer--) {
          const color = colors[glowLayer];
          const glowWidth = 3 + glowLayer * 2;
          
          ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
          ctx.lineWidth = glowWidth;
          ctx.lineCap = 'round';
          
          // 曲線パス（ベジェ曲線で滑らかに）
          ctx.beginPath();
          ctx.moveTo(0, trailOffset);
          
          // 3つの制御点で滑らかな弧を描く
          const cp1X = swordLength * 0.3;
          const cp1Y = trailOffset - 10;
          const cp2X = swordLength * 0.6;
          const cp2Y = trailOffset - 15;
          const endX = swordLength;
          const endY = trailOffset - 5;
          
          ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
          ctx.stroke();
        }
      }
      
      // 剣本体の描画（光の中心に）
      const gripLength = 15;
      const swordWidth = 6;
      
      // グリップ（柄）
      ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
      ctx.fillRect(-swordWidth / 2, -gripLength, swordWidth, gripLength);
      
      // ツバ（鍔）
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.fillRect(-10, -gripLength - 3, 20, 3);
      
      // 剣の刃
      const gradient = ctx.createLinearGradient(0, -gripLength, 0, -gripLength - swordLength);
      gradient.addColorStop(0, `rgba(232, 232, 232, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`);
      gradient.addColorStop(1, `rgba(192, 192, 192, ${alpha})`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, -gripLength);
      ctx.lineTo(-swordWidth / 2, -gripLength - 5);
      ctx.lineTo(-swordWidth / 3, -gripLength - swordLength + 10);
      ctx.lineTo(0, -gripLength - swordLength);
      ctx.lineTo(swordWidth / 3, -gripLength - swordLength + 10);
      ctx.lineTo(swordWidth / 2, -gripLength - 5);
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
      ctx.restore();
    });
  }
}

// プラグインシステムに登録
if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
  window.PixelApocalypse.WeaponRegistry.register(Sword);
}
