/**
 * Map Builder
 * フリー素材を使ってマップを構築
 */

class MapBuilder {
    constructor(objectManager, assetLoader) {
        this.objectManager = objectManager;
        this.assetLoader = assetLoader;
    }

    /**
     * シンプルな村を生成
     */
    buildSimpleVillage(centerX, centerY) {
        console.log('[MapBuilder] Building village...');

        const tileSize = 16;
        const mapSize = 60;
        const startX = centerX - (mapSize * tileSize) / 2;
        const startY = centerY - (mapSize * tileSize) / 2;

        // 地面を敷き詰める
        const grassVariants = ['grass_1', 'grass_2', 'grass_3'];
        for (let ty = 0; ty < mapSize; ty++) {
            for (let tx = 0; tx < mapSize; tx++) {
                const x = startX + tx * tileSize;
                const y = startY + ty * tileSize;

                const grassVariant = grassVariants[Math.floor(Math.random() * grassVariants.length)];
                const sprite = this.assetLoader.getSprite(grassVariant);

                if (sprite) {
                    this.objectManager.addObject('grass', x, y, sprite, false);
                }
            }
        }

        // 木を配置
        this.placeTree(startX + 10 * tileSize, startY + 10 * tileSize);
        this.placeTree(startX + 15 * tileSize, startY + 12 * tileSize);
        this.placeTree(startX + 45 * tileSize, startY + 10 * tileSize);
        this.placeTree(startX + 20 * tileSize, startY + 40 * tileSize);
        this.placeTree(startX + 50 * tileSize, startY + 45 * tileSize);

        // 建物を配置
        this.buildHouse(startX + 20 * tileSize, startY + 20 * tileSize, 6, 6);
        this.buildHouse(startX + 35 * tileSize, startY + 15 * tileSize, 5, 7);

        // 岩を配置
        this.placeRock(startX + 25 * tileSize, startY + 35 * tileSize);
        this.placeRock(startX + 40 * tileSize, startY + 30 * tileSize);
        this.placeRock(startX + 12 * tileSize, startY + 48 * tileSize);

        // その他のオブジェクト
        this.placeBarrel(startX + 30 * tileSize, startY + 25 * tileSize);
        this.placeCrate(startX + 32 * tileSize, startY + 25 * tileSize);

        console.log('[MapBuilder] Village complete!');
    }

    placeTree(x, y) {
        const tileSize = 16;
        const tl = this.assetLoader.getSprite('tree_tl');
        const tr = this.assetLoader.getSprite('tree_tr');
        const bl = this.assetLoader.getSprite('tree_bl');
        const br = this.assetLoader.getSprite('tree_br');

        if (tl && tr && bl && br) {
            this.objectManager.addObject('tree_part', x, y, tl, false);
            this.objectManager.addObject('tree_part', x + tileSize, y, tr, false);
            this.objectManager.addObject('tree_trunk', x, y + tileSize, bl, true);
            this.objectManager.addObject('tree_trunk', x + tileSize, y + tileSize, br, true);
        }
    }

    buildHouse(startX, startY, width, height) {
        const tileSize = 16;
        const wallSprite = this.assetLoader.getSprite('stone_wall');
        const doorSprite = this.assetLoader.getSprite('door');

        if (!wallSprite) return;

        for (let ty = 0; ty < height; ty++) {
            for (let tx = 0; tx < width; tx++) {
                const isEdge = tx === 0 || tx === width - 1 || ty === 0 || ty === height - 1;

                if (isEdge) {
                    const x = startX + tx * tileSize;
                    const y = startY + ty * tileSize;

                    if (ty === height - 1 && tx === Math.floor(width / 2) && doorSprite) {
                        this.objectManager.addObject('door', x, y, doorSprite, true);
                    } else {
                        this.objectManager.addObject('wall', x, y, wallSprite, true);
                    }
                }
            }
        }
    }

    placeRock(x, y) {
        const sprite = this.assetLoader.getSprite('rock');
        if (sprite) {
            this.objectManager.addObject('rock', x, y, sprite, true);
        }
    }

    placeBarrel(x, y) {
        const sprite = this.assetLoader.getSprite('barrel');
        if (sprite) {
            this.objectManager.addObject('barrel', x, y, sprite, true);
        }
    }

    placeCrate(x, y) {
        const sprite = this.assetLoader.getSprite('crate');
        if (sprite) {
            this.objectManager.addObject('crate', x, y, sprite, true);
        }
    }
}

console.log('MapBuilder loaded');
