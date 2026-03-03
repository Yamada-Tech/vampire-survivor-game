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
    this.showCollision = true;  // ★当たり判定の表示
    
    this.fpsHistory = [];
    this.maxFpsHistory = 60;

    // ★描画統計
    this.renderStats = {
      batchCount: 0,
      rectCount: 0,
      lastUpdate: 0
    };
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
   * 描画統計を更新
   * @param {number} batchCount - バッチ数
   * @param {number} rectCount - 矩形数
   */
  updateRenderStats(batchCount, rectCount) {
    this.renderStats.batchCount = batchCount;
    this.renderStats.rectCount = rectCount;
    this.renderStats.lastUpdate = performance.now();
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

    // ★描画統計
    ctx.fillText(`Batches: ${this.renderStats.batchCount}`, 10, y);
    y += lineHeight;
    ctx.fillText(`Rects: ${this.renderStats.rectCount}`, 10, y);
    y += lineHeight;

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

    // ★当たり判定の可視化
    if (this.showCollision && game.mapLayerSystem && game.camera) {
      this.drawCollisionDebug(ctx, game);
    }
    
    ctx.restore();
  }

  /**
   * 当たり判定のデバッグ表示
   */
  drawCollisionDebug(ctx, game) {
    const camera = game.camera;
    const mapSystem = game.mapLayerSystem;
    const tileSize = mapSystem.tileSize;

    const bounds = camera.getViewBounds();
    const startTileX = Math.floor(bounds.left / tileSize);
    const startTileY = Math.floor(bounds.top / tileSize);
    const endTileX = Math.ceil(bounds.right / tileSize);
    const endTileY = Math.ceil(bounds.bottom / tileSize);

    ctx.save();

    for (let tileY = startTileY; tileY <= endTileY; tileY++) {
      for (let tileX = startTileX; tileX <= endTileX; tileX++) {
        const worldX = tileX * tileSize + tileSize / 2;
        const worldY = tileY * tileSize + tileSize / 2;

        const passable = mapSystem.isTilePassable(worldX, worldY);

        if (!passable) {
          const screenPos = camera.worldToScreen(tileX * tileSize, tileY * tileSize);
          const displaySize = tileSize * camera.zoom;

          ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
          ctx.lineWidth = 2;
          ctx.strokeRect(screenPos.x, screenPos.y, displaySize, displaySize);

          // タイル名を表示（小さく）
          const chunkX = Math.floor(tileX / mapSystem.chunkSize);
          const chunkY = Math.floor(tileY / mapSystem.chunkSize);
          const localX = ((tileX % mapSystem.chunkSize) + mapSystem.chunkSize) % mapSystem.chunkSize;
          const localY = ((tileY % mapSystem.chunkSize) + mapSystem.chunkSize) % mapSystem.chunkSize;
          const key = `${chunkX},${chunkY}`;
          const chunk = mapSystem.layers.objects[key];
          const objectTile = chunk && chunk[localY] && chunk[localY][localX];
          if (objectTile) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.font = '8px monospace';
            ctx.fillText(objectTile, screenPos.x + 2, screenPos.y + 10);
          }
        }
      }
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
