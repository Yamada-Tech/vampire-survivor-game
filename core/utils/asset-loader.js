/**
 * Asset Loader
 * 画像ファイルとタイルマップを読み込む
 */

class AssetLoader {
    constructor() {
        this.images = {};
        this.tilemap = null;
        this.sprites = {};
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
            img.onerror = () => {
                console.warn(`[AssetLoader] Failed to load: ${path}`);
                resolve(null);
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
            this.tilemap = await response.json();
            console.log('[AssetLoader] Tilemap loaded');
            return this.tilemap;
        } catch (e) {
            console.warn('[AssetLoader] Failed to load tilemap:', e);
            this.tilemap = {};
            return this.tilemap;
        }
    }

    /**
     * すべてのアセットを読み込む
     */
    async loadAll() {
        console.log('[AssetLoader] Loading assets...');

        await this.loadTilemap('assets/textures/tilemap.json');

        if (this.tilemap) {
            const imagePromises = [];
            for (const [setName, setData] of Object.entries(this.tilemap)) {
                const path = `assets/textures/${setData.source}`;
                imagePromises.push(this.loadImage(setName, path));
            }
            await Promise.all(imagePromises);
            this.extractSprites();
        }

        console.log('[AssetLoader] All assets loaded!');
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
        console.log('[AssetLoader] Extracted', Object.keys(this.sprites).length, 'sprites');
    }

    /**
     * スプライトを取得
     */
    getSprite(name) {
        return this.sprites[name] || null;
    }
}

console.log('AssetLoader loaded');
