/**
 * Object Manager (Game)
 * すべてのゲームオブジェクトを管理
 */

class GameObjectManager {
    constructor() {
        this.objects = [];
        this.nextId = 1;
    }

    /**
     * オブジェクトを追加
     */
    addObject(type, x, y, sprite, hasCollision = false, customCollisionBox = null) {
        const obj = new GameObject(this.nextId++, type, x, y, sprite);
        obj.setCollision(hasCollision, customCollisionBox);
        this.objects.push(obj);
        return obj;
    }

    /**
     * オブジェクトを削除
     */
    removeObject(id) {
        this.objects = this.objects.filter(obj => obj.id !== id);
    }

    /**
     * 範囲内のオブジェクトを取得（描画用）
     */
    getObjectsInBounds(left, top, right, bottom) {
        return this.objects.filter(obj => {
            return obj.x + obj.width >= left &&
                   obj.x <= right &&
                   obj.y + obj.height >= top &&
                   obj.y <= bottom;
        });
    }

    /**
     * 位置が通行可能かチェック
     */
    isPositionPassable(x, y) {
        for (const obj of this.objects) {
            if (obj.containsPoint(x, y)) {
                return false;
            }
        }
        return true;
    }

    /**
     * すべてクリア
     */
    clear() {
        this.objects = [];
        this.nextId = 1;
    }
}

console.log('GameObjectManager loaded');
