/**
 * Object Manager
 * マップ上の全オブジェクトをワールド座標で管理する。
 * タイルグリッドに依存しないオブジェクトベースの当たり判定を提供する。
 */

class MapObject {
    constructor(id, type, x, y, texture, collisionDef) {
        this.id = id;
        this.type = type;
        this.x = x;  // ワールド座標（ピクセル）
        this.y = y;
        this.texture = texture;  // HTMLCanvasElement, HTMLImageElement, or null
        this.width  = (texture != null && texture.width  != null) ? texture.width  : (collisionDef.size ? collisionDef.size.width  : 16);
        this.height = (texture != null && texture.height != null) ? texture.height : (collisionDef.size ? collisionDef.size.height : 16);

        // 当たり判定
        this.hasCollision   = collisionDef.collision     || false;
        this.collisionType  = collisionDef.collisionType || 'full';
        this.collisionBox   = this._buildCollisionBox(collisionDef);
    }

    _buildCollisionBox(def) {
        if (!this.hasCollision) return null;

        if (def.collisionType === 'custom' && def.collisionRect) {
            // カスタム矩形（木の幹など）
            return {
                x: this.x + def.collisionRect.offsetX,
                y: this.y + def.collisionRect.offsetY,
                width:  def.collisionRect.width,
                height: def.collisionRect.height
            };
        }

        // 全体（full / image）
        return {
            x: this.x,
            y: this.y,
            width:  this.width,
            height: this.height
        };
    }
}

class ObjectManager {
    constructor() {
        this.objects = [];
        this.nextId  = 1;
    }

    /**
     * オブジェクトを追加
     * @param {string} type - オブジェクトタイプ（CollisionDefinitions のキー）
     * @param {number} x    - ワールドX座標（ピクセル）
     * @param {number} y    - ワールドY座標（ピクセル）
     * @param {HTMLCanvasElement|HTMLImageElement|null} texture - テクスチャ
     * @returns {MapObject}
     */
    addObject(type, x, y, texture) {
        const collisionDef = (typeof CollisionDefinitions !== 'undefined' && CollisionDefinitions[type])
            ? CollisionDefinitions[type]
            : { collision: false };

        const obj = new MapObject(this.nextId++, type, x, y, texture, collisionDef);
        this.objects.push(obj);
        return obj;
    }

    /**
     * オブジェクトを削除
     * @param {number} id - オブジェクトID
     */
    removeObject(id) {
        this.objects = this.objects.filter(obj => obj.id !== id);
    }

    /**
     * 全オブジェクトを取得
     * @returns {MapObject[]}
     */
    getAllObjects() {
        return this.objects;
    }

    /**
     * 表示範囲内のオブジェクトを取得（描画カリング用）
     * @param {number} left
     * @param {number} top
     * @param {number} right
     * @param {number} bottom
     * @returns {MapObject[]}
     */
    getObjectsInBounds(left, top, right, bottom) {
        return this.objects.filter(obj =>
            obj.x + obj.width  >= left &&
            obj.x              <= right &&
            obj.y + obj.height >= top  &&
            obj.y              <= bottom
        );
    }

    /**
     * 指定ワールド座標が通行可能かチェック（点判定）
     * @param {number} x - ワールドX座標
     * @param {number} y - ワールドY座標
     * @returns {boolean} true: 通行可能、false: 衝突あり
     */
    isPositionPassable(x, y) {
        for (const obj of this.objects) {
            if (!obj.hasCollision) continue;

            const box = obj.collisionBox;
            if (x >= box.x && x < box.x + box.width &&
                y >= box.y && y < box.y + box.height) {
                return false;  // 衝突
            }
        }
        return true;  // 通行可能
    }

    /**
     * 全オブジェクトをクリア
     */
    clear() {
        this.objects = [];
        this.nextId  = 1;
    }
}

console.log('ObjectManager loaded');
