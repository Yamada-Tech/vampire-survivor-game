/**
 * 棒人間キャラクタープラグイン
 * アクション型の基本キャラクター
 */
class StickFigureCharacter extends window.PixelApocalypse.CharacterBase {
  constructor() {
    super({
      id: 'stick-figure',
      name: '棒人間',
      description: 'アクション型の棒人間キャラクター',
      author: 'PixelApocalypse Team',
      version: '1.0.0',
      maxHealth: 100,
      speed: 200,
      size: 20
    });
  }
  
  draw(ctx, x, y, animationState) {
    const headRadius = 5;
    const bodyLength = 15;
    const armLength = 10;
    const legLength = 14;
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    
    const drawY = y + animationState.bodyBounce;
    
    // 頭
    ctx.beginPath();
    ctx.arc(x, drawY - bodyLength - headRadius, headRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // 胴体
    ctx.beginPath();
    ctx.moveTo(x, drawY - bodyLength);
    ctx.lineTo(x, drawY);
    ctx.stroke();
    
    // 腕（アニメーション）
    const leftArmAngle = Math.sin(animationState.armPhase) * 0.5;
    const rightArmAngle = Math.sin(animationState.armPhase + Math.PI) * 0.5;
    
    ctx.beginPath();
    ctx.moveTo(x, drawY - bodyLength * 0.7);
    ctx.lineTo(
      x + Math.sin(leftArmAngle) * armLength,
      drawY - bodyLength * 0.7 + Math.cos(leftArmAngle) * armLength
    );
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x, drawY - bodyLength * 0.7);
    ctx.lineTo(
      x + Math.sin(rightArmAngle) * armLength,
      drawY - bodyLength * 0.7 + Math.cos(rightArmAngle) * armLength
    );
    ctx.stroke();
    
    // 脚（アニメーション）
    const leftLegAngle = Math.sin(animationState.legPhase) * 0.6;
    const rightLegAngle = Math.sin(animationState.legPhase + Math.PI) * 0.6;
    
    ctx.beginPath();
    ctx.moveTo(x, drawY);
    ctx.lineTo(
      x + Math.sin(leftLegAngle) * legLength * 0.5,
      drawY + Math.cos(leftLegAngle) * legLength
    );
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x, drawY);
    ctx.lineTo(
      x + Math.sin(rightLegAngle) * legLength * 0.5,
      drawY + Math.cos(rightLegAngle) * legLength
    );
    ctx.stroke();
  }
}

if (window.PixelApocalypse && window.PixelApocalypse.CharacterRegistry) {
  window.PixelApocalypse.CharacterRegistry.register(StickFigureCharacter);
}
