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
      // プレイヤーの現在位置を使用
      const screenX = slash.player.x - camera.x;
      const screenY = slash.player.y - camera.y;
      
      const progress = slash.elapsed / slash.duration;
      const alpha = 1 - progress;
      
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(slash.angle);
      
      const swordLength = this.range * 0.8;
      const gripLength = 15;
      const swordWidth = 6;
      
      // 振りのアニメーション（-108度から+108度）
      const swingProgress = progress;
      const swingAngle = -Math.PI * 0.6 + (swingProgress * Math.PI * 1.2); // -108度から+108度
      
      ctx.save();
      ctx.rotate(swingAngle);
      
      // 剣本体の描画（シンプルに）
      
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
      
      // ★★★ 剣先の三日月型発光エフェクト（剣と一緒に回転） ★★★
      
      const tipY = -gripLength - swordLength; // 剣先のY座標
      const crescentRadius = swordLength * 0.5; // 三日月の半径
      
      // 三日月の角度（剣先を中心に±60度の弧）
      const crescentStartAngle = -Math.PI / 3; // -60度
      const crescentEndAngle = Math.PI / 3; // +60度
      
      // 複数のグロー層で発光効果
      const glowLayers = [
        { width: 10, alpha: alpha * 0.15, color: '77, 184, 255' },   // 最外層（太く薄く）
        { width: 7, alpha: alpha * 0.3, color: '120, 200, 255' },    // 外層
        { width: 5, alpha: alpha * 0.5, color: '180, 230, 255' },    // 中層
        { width: 3, alpha: alpha * 0.7, color: '220, 245, 255' },    // 内層
        { width: 1.5, alpha: alpha * 1.0, color: '255, 255, 255' }   // 中心（純白）
      ];
      
      glowLayers.forEach(layer => {
        ctx.strokeStyle = `rgba(${layer.color}, ${layer.alpha})`;
        ctx.lineWidth = layer.width;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        // 剣先を中心に三日月型の弧を描画
        ctx.arc(0, tipY, crescentRadius, crescentStartAngle, crescentEndAngle);
        ctx.stroke();
      });
      
      // スパークル効果（剣と一緒に回転）
      if (progress < 0.5) {
        const sparkleCount = 3;
        for (let i = 0; i < sparkleCount; i++) {
          const sparkleAngle = crescentStartAngle + (crescentEndAngle - crescentStartAngle) * (i / (sparkleCount - 1));
          const sparkleX = Math.cos(sparkleAngle) * crescentRadius;
          const sparkleY = tipY + Math.sin(sparkleAngle) * crescentRadius;
          
          const sparkleSize = 3 + Math.sin(progress * Math.PI * 4) * 2;
          const sparkleAlpha = alpha * (1 - progress * 2);
          
          const sparkleGradient = ctx.createRadialGradient(sparkleX, sparkleY, 0, sparkleX, sparkleY, sparkleSize);
          sparkleGradient.addColorStop(0, `rgba(255, 255, 255, ${sparkleAlpha})`);
          sparkleGradient.addColorStop(0.5, `rgba(180, 230, 255, ${sparkleAlpha * 0.7})`);
          sparkleGradient.addColorStop(1, `rgba(77, 184, 255, 0)`);
          
          ctx.fillStyle = sparkleGradient;
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
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
