/**
 * Game Object
 * マップ上のすべてのオブジェクトの基底クラス
 */

class GameObject {
    constructor(id, type, x, y, sprite) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.sprite = sprite;
        this.width = sprite ? sprite.width : 16;
        this.height = sprite ? sprite.height : 16;

        this.hasCollision = false;
        this.collisionBox = null;
    }

    /**
     * 当たり判定を設定
     */
    setCollision(enabled, customBox = null) {
        this.hasCollision = enabled;

        if (enabled) {
            if (customBox) {
                this.collisionBox = {
                    x: this.x + customBox.offsetX,
                    y: this.y + customBox.offsetY,
                    width: customBox.width,
                    height: customBox.height
                };
            } else {
                this.collisionBox = {
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height
                };
            }
        }
    }

    /**
     * 描画
     */
    draw(ctx) {
        if (this.sprite) {
            ctx.drawImage(this.sprite, this.x, this.y);
        }
    }

    /**
     * 点が当たり判定内にあるか
     */
    containsPoint(x, y) {
        if (!this.hasCollision || !this.collisionBox) return false;

        const box = this.collisionBox;
        return x >= box.x && x <= box.x + box.width &&
               y >= box.y && y <= box.y + box.height;
    }
}

console.log('GameObject loaded');
