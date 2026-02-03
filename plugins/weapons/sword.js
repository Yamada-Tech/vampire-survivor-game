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
      duration: 0.3,
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
    this.activeSlashes.forEach(slash => {
      // ★ワールド座標をスクリーン座標に変換
      const screenPos = camera.worldToScreen(slash.player.x, slash.player.y);
      
      const progress = slash.elapsed / slash.duration;
      const alpha = 1 - progress;
      
      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      ctx.rotate(slash.angle);
      
      const swordLength = this.range * 0.8 * camera.zoom;
      const gripLength = 15 * camera.zoom;
      const swordWidth = 6 * camera.zoom;
      
      // 振りのアニメーション
      const swingProgress = progress;
      const swingAngle = -Math.PI / 2 + (swingProgress * Math.PI);
      
      ctx.save();
      ctx.rotate(swingAngle);
      
      // 剣本体の描画（エフェクトなし）
      
      // グリップ（柄）
      ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
      ctx.fillRect(-swordWidth / 2, -gripLength, swordWidth, gripLength);
      
      // ツバ（鍔）
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.fillRect(-10 * camera.zoom, -gripLength - 3 * camera.zoom, 20 * camera.zoom, 3 * camera.zoom);
      
      // 剣の刃
      const gradient = ctx.createLinearGradient(0, -gripLength, 0, -gripLength - swordLength);
      gradient.addColorStop(0, `rgba(232, 232, 232, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`);
      gradient.addColorStop(1, `rgba(192, 192, 192, ${alpha})`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, -gripLength);
      ctx.lineTo(-swordWidth / 2, -gripLength - 5 * camera.zoom);
      ctx.lineTo(-swordWidth / 3, -gripLength - swordLength + 10 * camera.zoom);
      ctx.lineTo(0, -gripLength - swordLength);
      ctx.lineTo(swordWidth / 3, -gripLength - swordLength + 10 * camera.zoom);
      ctx.lineTo(swordWidth / 2, -gripLength - 5 * camera.zoom);
      ctx.closePath();
      ctx.fill();
      
      // 刃のハイライト
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.lineWidth = 1 * camera.zoom;
      ctx.beginPath();
      ctx.moveTo(-1 * camera.zoom, -gripLength - 5 * camera.zoom);
      ctx.lineTo(-1 * camera.zoom, -gripLength - swordLength + 15 * camera.zoom);
      ctx.stroke();
      
      ctx.restore();
      ctx.restore();
    });
  }
}

// プラグインシステムに登録
if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
  window.PixelApocalypse.WeaponRegistry.register(Sword);
  console.log('Sword weapon registered');
}
