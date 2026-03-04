/**
 * Texture Loader
 * 画像ファイルからテクスチャを読み込む
 */

class TextureLoader {
    constructor() {
        this.textures = {};
        this.loading = {};
        this.loaded = 0;
        this.total = 0;
    }

    /**
     * テクスチャを読み込む
     * @param {string} name - テクスチャ名
     * @param {string} path - 画像ファイルパス
     * @returns {Promise<HTMLImageElement>}
     */
    load(name, path) {
        // 既に読み込み済み
        if (this.textures[name]) {
            return Promise.resolve(this.textures[name]);
        }

        // 読み込み中
        if (this.loading[name]) {
            return this.loading[name];
        }

        this.total++;

        // 新規読み込み
        const promise = new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                this.textures[name] = img;
                this.loaded++;
                console.log(`[TextureLoader] Loaded: ${name} (${this.loaded}/${this.total})`);
                resolve(img);
            };

            img.onerror = () => {
                // ファイルが存在しない場合も total をカウントしてプログレスを進める
                this.loaded++;
                console.warn(`[TextureLoader] Failed to load: ${name} from ${path}`);
                resolve(null);
            };

            img.src = path;
        });

        this.loading[name] = promise;
        return promise;
    }

    /**
     * 複数のテクスチャを一括読み込み
     * @param {Object} textureMap - { name: path, ... }
     * @returns {Promise<void>}
     */
    async loadAll(textureMap) {
        const promises = Object.entries(textureMap).map(([name, path]) => {
            return this.load(name, path);
        });

        await Promise.all(promises);
        console.log('[TextureLoader] All textures loaded!');
    }

    /**
     * テクスチャを取得
     * @param {string} name - テクスチャ名
     * @returns {HTMLImageElement|null}
     */
    get(name) {
        return this.textures[name] || null;
    }

    /**
     * 読み込み進捗を取得
     * @returns {number} 0.0 ~ 1.0
     */
    getProgress() {
        return this.total > 0 ? this.loaded / this.total : 1.0;
    }
}

// グローバルインスタンス
window.textureLoader = new TextureLoader();

console.log('TextureLoader loaded');
