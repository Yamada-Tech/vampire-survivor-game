/**
 * Sprite Sheet Utility
 * タイルシートから個別のスプライトを切り出す
 */

class SpriteSheet {
    constructor(image, tileWidth, tileHeight) {
        this.image = image;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
    }

    /**
     * タイルシートから1枚のタイルを切り出す
     * @param {number} x - タイルシート上のX座標（ピクセル）
     * @param {number} y - タイルシート上のY座標（ピクセル）
     * @param {number} width - 幅（ピクセル、デフォルト: tileWidth）
     * @param {number} height - 高さ（ピクセル、デフォルト: tileHeight）
     * @returns {HTMLCanvasElement}
     */
    extractTile(x, y, width = this.tileWidth, height = this.tileHeight) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            this.image,
            x, y, width, height,  // ソース
            0, 0, width, height   // デスティネーション
        );

        return canvas;
    }

    /**
     * タイルシートから複数のタイルを切り出す
     * @param {Object} tileMap - { name: { x, y, width, height }, ... }
     * @returns {Object} - { name: canvas, ... }
     */
    extractTiles(tileMap) {
        const textures = {};

        for (const [name, coords] of Object.entries(tileMap)) {
            textures[name] = this.extractTile(
                coords.x,
                coords.y,
                coords.width || this.tileWidth,
                coords.height || this.tileHeight
            );
        }

        return textures;
    }
}

console.log('SpriteSheet loaded');
