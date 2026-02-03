/**
 * Camera System
 * ズーム対応の完全なカメラシステム
 */

class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.zoom = 1.0;
    this.minZoom = 0.3;
    this.maxZoom = 2.0;
    this.target = null;
  }
  
  /**
   * ターゲットを設定（通常はプレイヤー）
   */
  setTarget(target) {
    this.target = target;
  }
  
  /**
   * カメラを更新
   */
  update() {
    if (this.target) {
      // カメラをターゲットの中心に配置
      this.x = this.target.x - (this.canvas.width / 2) / this.zoom;
      this.y = this.target.y - (this.canvas.height / 2) / this.zoom;
    }
  }
  
  /**
   * ズームを設定（ターゲット中心）
   */
  setZoom(newZoom) {
    const oldZoom = this.zoom;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
    
    // ターゲットがある場合は自動的に中心維持
    if (this.target) {
      // ターゲット中心を維持するようにカメラ位置を調整
      const screenCenterX = this.canvas.width / 2;
      const screenCenterY = this.canvas.height / 2;
      
      // 新しいズームでターゲットを中心に保つ
      this.x = this.target.x - screenCenterX / this.zoom;
      this.y = this.target.y - screenCenterY / this.zoom;
    }
  }
  
  /**
   * Canvas の transform を適用
   * これにより、すべての描画が自動的にズーム対応になる
   */
  applyTransform(ctx) {
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }
  
  /**
   * Transform を解除
   */
  resetTransform(ctx) {
    ctx.restore();
  }
  
  /**
   * 画面座標をワールド座標に変換
   */
  screenToWorld(screenX, screenY) {
    return {
      x: screenX / this.zoom + this.x,
      y: screenY / this.zoom + this.y
    };
  }
  
  /**
   * ワールド座標を画面座標に変換
   */
  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.x) * this.zoom,
      y: (worldY - this.y) * this.zoom
    };
  }
  
  /**
   * 現在の表示範囲（ワールド座標）を取得
   */
  getViewBounds() {
    const width = this.canvas.width / this.zoom;
    const height = this.canvas.height / this.zoom;
    
    return {
      left: this.x,
      top: this.y,
      right: this.x + width,
      bottom: this.y + height,
      width: width,
      height: height
    };
  }
  
  /**
   * オブジェクトが画面内にあるか判定
   */
  isInView(x, y, margin = 100) {
    const bounds = this.getViewBounds();
    return x > bounds.left - margin &&
           x < bounds.right + margin &&
           y > bounds.top - margin &&
           y < bounds.bottom + margin;
  }
}

console.log('Camera loaded');
