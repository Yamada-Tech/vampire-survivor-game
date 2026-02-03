/**
 * Debug Utilities
 * デバッグ情報の表示と管理
 */

class DebugUtils {
  constructor() {
    this.enabled = false;
    this.showFPS = true;
    this.showCameraInfo = true;
    this.showEntityCount = true;
    
    this.fpsHistory = [];
    this.maxFpsHistory = 60;
  }
  
  /**
   * デバッグモードを切り替え
   */
  toggle() {
    this.enabled = !this.enabled;
    console.log('Debug mode:', this.enabled ? 'ON' : 'OFF');
  }
  
  /**
   * FPSを記録
   */
  recordFPS(fps) {
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.maxFpsHistory) {
      this.fpsHistory.shift();
    }
  }
  
  /**
   * 平均FPSを取得
   */
  getAverageFPS() {
    if (this.fpsHistory.length === 0) return 0;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.fpsHistory.length);
  }
  
  /**
   * デバッグ情報を描画
   */
  draw(ctx, game) {
    if (!this.enabled) return;
    
    ctx.save();
    ctx.font = '14px monospace';
    ctx.fillStyle = '#00ff00';
    
    let y = 150;
    const lineHeight = 20;
    
    // FPS
    if (this.showFPS) {
      const avgFPS = this.getAverageFPS();
      ctx.fillText(`FPS: ${avgFPS}`, 10, y);
      y += lineHeight;
    }
    
    // カメラ情報
    if (this.showCameraInfo && game.camera) {
      ctx.fillText(`Camera: (${Math.round(game.camera.x)}, ${Math.round(game.camera.y)})`, 10, y);
      y += lineHeight;
      ctx.fillText(`Zoom: ${game.camera.zoom.toFixed(2)}x`, 10, y);
      y += lineHeight;
    }
    
    // エンティティ数
    if (this.showEntityCount) {
      ctx.fillText(`Enemies: ${game.enemies.length}`, 10, y);
      y += lineHeight;
      ctx.fillText(`Particles: ${game.particles.length}`, 10, y);
      y += lineHeight;
    }
    
    // プレイヤー位置
    if (game.player) {
      ctx.fillText(`Player: (${Math.round(game.player.x)}, ${Math.round(game.player.y)})`, 10, y);
      y += lineHeight;
    }
    
    ctx.restore();
  }
}

// グローバルに登録
if (!window.PixelApocalypse) {
  window.PixelApocalypse = {};
}

window.PixelApocalypse.DebugUtils = DebugUtils;

console.log('DebugUtils loaded');
