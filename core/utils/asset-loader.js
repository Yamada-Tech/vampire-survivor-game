/**
 * Asset Loader
 * 画像ファイルとタイルマップを読み込む
 */

class AssetLoader {
    constructor() {
        this.images = {};
        this.tilemap = null;
        this.sprites = {};
        this.placeholderDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAFklEQVR42mN4//8/AyUYhmGwYgYGBgAQ+gP9/3fN3QAAAABJRU5ErkJggg==';
    }

    /**
     * 画像を読み込む
     */
    async loadImage(name, path) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                console.log(`[AssetLoader] Loaded image: ${name}`);
                resolve(img);
            };
            img.onerror = (error) => {
                console.error(`[AssetLoader] Failed to load: ${path}`, error);
                console.warn(`[AssetLoader] Using placeholder for: ${name}`);

                // プレースホルダー画像を使用
                const placeholderImg = new Image();
                placeholderImg.onload = () => {
                    this.images[name] = placeholderImg;
                    resolve(placeholderImg);
                };
                placeholderImg.src = this.placeholderDataURL;
            };
            img.src = path;
        });
    }

    /**
     * タイルマップJSONを読み込む
     */
    async loadTilemap(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to fetch tilemap: ${response.status}`);
            }
            this.tilemap = await response.json();
            console.log('[AssetLoader] Tilemap loaded');
            return this.tilemap;
        } catch (error) {
            console.error('[AssetLoader] Failed to load tilemap:', error);
            // フォールバック: 最小限のtilemapを使用
            this.tilemap = {
                "placeholder": {
                    "source": "placeholder.png",
                    "tileSize": 16,
                    "tiles": {
                        "grass": { "x": 0, "y": 0, "w": 16, "h": 16 }
                    }
                }
            };
            return this.tilemap;
        }
    }

    /**
     * すべてのアセットを読み込む
     */
    async loadAll() {
        console.log('[AssetLoader] Loading assets...');

        await this.loadTilemap('assets/textures/tilemap.json');

        const imagePromises = [];
        for (const [setName, setData] of Object.entries(this.tilemap)) {
            const path = `assets/textures/${setData.source}`;
            imagePromises.push(this.loadImage(setName, path));
        }

        await Promise.all(imagePromises);

        this.extractSprites();

        console.log('[AssetLoader] All assets loaded! Sprites:', Object.keys(this.sprites).length);
    }

    /**
     * タイルセットからスプライトを切り出す
     */
    extractSprites() {
        if (!this.tilemap) return;
        for (const [setName, setData] of Object.entries(this.tilemap)) {
            const sourceImage = this.images[setName];
            if (!sourceImage) continue;

            for (const [tileName, coords] of Object.entries(setData.tiles)) {
                const canvas = document.createElement('canvas');
                canvas.width = coords.w;
                canvas.height = coords.h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(
                    sourceImage,
                    coords.x, coords.y, coords.w, coords.h,
                    0, 0, coords.w, coords.h
                );
                this.sprites[tileName] = canvas;
            }
        }
        console.log('[AssetLoader] Extracted sprites:', Object.keys(this.sprites).join(', '));
    }

    /**
     * スプライトを取得
     */
    getSprite(name) {
        const sprite = this.sprites[name];
        if (!sprite) {
            console.warn(`[AssetLoader] Sprite not found: ${name}, using fallback`);
            // フォールバック: グレーの16x16キャンバス
            const canvas = document.createElement('canvas');
            canvas.width = 16;
            canvas.height = 16;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#666666';
            ctx.fillRect(0, 0, 16, 16);
            return canvas;
        }
        return sprite;
    }
}

console.log('AssetLoader loaded');
