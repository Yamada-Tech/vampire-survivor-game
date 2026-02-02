/**
 * 基本ゾンビ敵プラグイン
 */
class BasicZombieEnemy extends window.PixelApocalypse.EnemyBase {
  constructor(x, y) {
    super(x, y, {
      id: 'basic-zombie',
      name: 'ゾンビ',
      description: '基本的な敵。プレイヤーを追跡する',
      author: 'PixelApocalypse Team',
      version: '1.0.0',
      maxHealth: 50,
      speed: 150,
      size: 20,
      damage: 10,
      expValue: 10,
      color: '#ff0000'
    });
  }
  
  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    
    const y = screenY + Math.sin(this.animationState.legPhase * 2) * 2;
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    
    // 頭
    ctx.beginPath();
    ctx.arc(screenX, y - 15 - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // 胴体
    ctx.beginPath();
    ctx.moveTo(screenX, y - 15);
    ctx.lineTo(screenX, y);
    ctx.stroke();
    
    // 腕（ゾンビっぽく前に伸ばす）
    ctx.beginPath();
    ctx.moveTo(screenX, y - 10);
    ctx.lineTo(screenX + 8, y - 5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(screenX, y - 10);
    ctx.lineTo(screenX - 8, y - 5);
    ctx.stroke();
    
    // 脚
    const leftLeg = Math.sin(this.animationState.legPhase) * 0.5;
    const rightLeg = Math.sin(this.animationState.legPhase + Math.PI) * 0.5;
    
    ctx.beginPath();
    ctx.moveTo(screenX, y);
    ctx.lineTo(screenX + Math.sin(leftLeg) * 7, y + Math.cos(leftLeg) * 14);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(screenX, y);
    ctx.lineTo(screenX + Math.sin(rightLeg) * 7, y + Math.cos(rightLeg) * 14);
    ctx.stroke();
    
    // 体力バー
    if (this.health < this.maxHealth) {
      const barWidth = this.size;
      const barHeight = 4;
      const barY = y - 30;
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(screenX - barWidth / 2, barY, barWidth, barHeight);
      
      const healthPercent = this.health / this.maxHealth;
      ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(screenX - barWidth / 2, barY, barWidth * healthPercent, barHeight);
    }
  }
}

if (window.PixelApocalypse && window.PixelApocalypse.EnemyRegistry) {
  window.PixelApocalypse.EnemyRegistry.register(BasicZombieEnemy);
}
