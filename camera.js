/**
 * Camera System
 * シンプルで確実なカメラシステム
 */

class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.zoom = 1.0;
    this.minZoom = 0.5;
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
      // ターゲットを画面中央に配置
      this.x = this.target.x - (this.canvas.width / this.zoom) / 2;
      this.y = this.target.y - (this.canvas.height / this.zoom) / 2;
    }
  }
  
  /**
   * ズームを設定
   */
  setZoom(newZoom) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
    // 即座にカメラ位置を更新
    this.update();
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
   * 画面座標をワールド座標に変換
   */
  screenToWorld(screenX, screenY) {
    return {
      x: screenX / this.zoom + this.x,
      y: screenY / this.zoom + this.y
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
  isInView(worldX, worldY, margin = 100) {
    const bounds = this.getViewBounds();
    return worldX > bounds.left - margin &&
           worldX < bounds.right + margin &&
           worldY > bounds.top - margin &&
           worldY < bounds.bottom + margin;
  }
}

console.log('Camera loaded');
