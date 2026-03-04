/**
 * Debug Utilities
 * デバッグ情報の表示と管理
 */

class DebugUtils {
    constructor() {
        this.enabled = false;
    }

    toggle() {
        this.enabled = !this.enabled;
        console.log('[Debug]', this.enabled ? 'ON' : 'OFF');
    }

    draw(ctx, game) {
        if (!this.enabled) return;

        const camera = game.camera;

        ctx.save();
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-camera.x, -camera.y);

        const bounds = camera.getViewBounds();
        const visibleObjects = game.objectManager.getObjectsInBounds(
            bounds.left, bounds.top, bounds.right, bounds.bottom
        );

        visibleObjects.forEach(obj => {
            if (!obj.hasCollision) return;

            const box = obj.collisionBox;

            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2 / camera.zoom;
            ctx.strokeRect(box.x, box.y, box.width, box.height);

            ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
            ctx.font = `${10 / camera.zoom}px monospace`;
            ctx.fillText(obj.type, box.x + 2, box.y + 10);
        });

        if (game.player) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2 / camera.zoom;
            ctx.beginPath();
            ctx.moveTo(game.player.x - 5, game.player.y);
            ctx.lineTo(game.player.x + 5, game.player.y);
            ctx.moveTo(game.player.x, game.player.y - 5);
            ctx.lineTo(game.player.x, game.player.y + 5);
            ctx.stroke();
        }

        ctx.restore();

        ctx.fillStyle = '#00ff00';
        ctx.font = '14px monospace';
        ctx.fillText(`Objects: ${game.objectManager.objects.length}`, 10, 20);
        ctx.fillText(`Zoom: ${camera.zoom.toFixed(2)}x`, 10, 40);
        if (game.player) {
            ctx.fillText(`Player: (${Math.round(game.player.x)}, ${Math.round(game.player.y)})`, 10, 60);
        }
    }
}

// グローバルに登録
if (!window.PixelApocalypse) {
    window.PixelApocalypse = {};
}

window.PixelApocalypse.DebugUtils = DebugUtils;

console.log('DebugUtils loaded');
