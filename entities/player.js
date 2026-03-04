/**
 * Player
 * プレイヤーキャラクター
 */

class Player {
    constructor(x, y, size = 24) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = 120;

        console.log('[Player] Created at', x, y);
    }

    /**
     * 更新
     */
    update(deltaTime, keys, objectManager) {
        const moveDistance = this.speed * deltaTime;

        let dx = 0;
        let dy = 0;

        if (keys['w'] || keys['W'] || keys['ArrowUp']) dy -= moveDistance;
        if (keys['s'] || keys['S'] || keys['ArrowDown']) dy += moveDistance;
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) dx -= moveDistance;
        if (keys['d'] || keys['D'] || keys['ArrowRight']) dx += moveDistance;

        const newX = this.x + dx;
        const newY = this.y + dy;

        if (objectManager.isPositionPassable(newX, newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            if (objectManager.isPositionPassable(newX, this.y)) {
                this.x = newX;
            }
            if (objectManager.isPositionPassable(this.x, newY)) {
                this.y = newY;
            }
        }
    }

    /**
     * 描画
     */
    draw(ctx) {
        ctx.fillStyle = '#0000ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    }
}

console.log('Player loaded');
