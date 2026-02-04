/**
 * Collision System
 * マップオブジェクトとの衝突判定を管理
 */

class CollisionSystem {
  constructor() {
    this.colliders = [];  // 衝突判定オブジェクトのリスト
  }
  
  /**
   * 衝突判定オブジェクトを追加
   */
  addCollider(x, y, width, height, type = 'rock') {
    this.colliders.push({
      x: x,
      y: y,
      width: width,
      height: height,
      type: type
    });
  }
  
  /**
   * 衝突判定オブジェクトをクリア
   */
  clearColliders() {
    this.colliders = [];
  }
  
  /**
   * 円と矩形の衝突判定
   */
  checkCircleRectCollision(circleX, circleY, radius, rectX, rectY, rectWidth, rectHeight) {
    // 矩形の中心に最も近い点を見つける
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
    
    // その点と円の中心の距離を計算
    const distanceX = circleX - closestX;
    const distanceY = circleY - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    return distanceSquared < radius * radius;
  }
  
  /**
   * 指定位置が衝突するかチェック
   */
  checkCollision(x, y, radius) {
    for (const collider of this.colliders) {
      if (this.checkCircleRectCollision(x, y, radius, collider.x, collider.y, collider.width, collider.height)) {
        return collider;
      }
    }
    return null;
  }
  
  /**
   * 移動先が有効かチェック
   */
  canMoveTo(x, y, radius) {
    return this.checkCollision(x, y, radius) === null;
  }
  
  /**
   * 衝突を避けた移動先を計算
   */
  resolveCollision(oldX, oldY, newX, newY, radius) {
    // 新しい位置で衝突チェック
    if (this.canMoveTo(newX, newY, radius)) {
      return { x: newX, y: newY };
    }
    
    // X軸のみの移動を試す
    if (this.canMoveTo(newX, oldY, radius)) {
      return { x: newX, y: oldY };
    }
    
    // Y軸のみの移動を試す
    if (this.canMoveTo(oldX, newY, radius)) {
      return { x: oldX, y: newY };
    }
    
    // 移動できない場合は元の位置
    return { x: oldX, y: oldY };
  }
  
  /**
   * カメラ範囲内の衝突判定オブジェクトを取得
   */
  getCollidersInView(camera) {
    const bounds = camera.getViewBounds();
    
    return this.colliders.filter(collider => {
      return collider.x + collider.width >= bounds.left &&
             collider.x <= bounds.right &&
             collider.y + collider.height >= bounds.top &&
             collider.y <= bounds.bottom;
    });
  }
  
  /**
   * デバッグ用: 衝突判定を描画
   */
  drawDebug(ctx, camera) {
    const collidersInView = this.getCollidersInView(camera);
    
    collidersInView.forEach(collider => {
      const screenPos1 = camera.worldToScreen(collider.x, collider.y);
      const screenPos2 = camera.worldToScreen(
        collider.x + collider.width,
        collider.y + collider.height
      );
      
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        screenPos1.x,
        screenPos1.y,
        screenPos2.x - screenPos1.x,
        screenPos2.y - screenPos1.y
      );
    });
  }
}

// Register globally
if (!window.PixelApocalypse) {
  window.PixelApocalypse = {};
}

window.PixelApocalypse.CollisionSystem = CollisionSystem;

console.log('CollisionSystem loaded');
