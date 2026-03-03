/**
 * MapLayerSystem - Vampire Survivor風の3レイヤーマップシステム
 * 地面、道、オブジェクトの3つのレイヤーを管理
 */

class MapLayerSystem {
    constructor() {
        this.layers = {
            ground: {},     // レイヤー1: 地面（草原、土、砂など）
            path: {},       // レイヤー2: 道（石畳、土の道など）
            objects: {},    // レイヤー3: オブジェクト（木、岩など）- now chunk-based for tiles
            objectsArray: [] // レイヤー3b: 大きなオブジェクト（後方互換性のため）
        };
        
        this.tileSize = 64;      // ワールド座標でのタイルサイズ
        this.chunkSize = 16;     // 1チャンクあたり16×16タイル
        this.currentLayer = 'ground'; // 現在編集中のレイヤー
        
        // ★描画統計
        this.lastBatchCount = 0;
        this.lastRectCount = 0;
        
        // ★通行不可能なタイル（solid）を完全に定義
        this.solidTiles = new Set([
            // === 建物の壁 ===
            'stone_wall',
            'broken_wall',
            'wood_wall',
            'brick_wall',
            'door',
            'broken_door',

            // === 自然オブジェクト ===
            'tree',
            'rock',
            'large_rock',
            'boulder',
            'bush',

            // === 大型家具 ===
            'fireplace',
            'altar',
            'table',
            'bed',
            'broken_bed',
            'bookshelf',
            'chest',
            'barrel',
            'crate',

            // === 墓地 ===
            'gravestone',
            'tombstone',

            // === その他の障害物 ===
            'pillar',
            'statue',
            'well',
            'fence',
            'wooden_fence',
            'stone_fence'
        ]);

        // ★通行可能なタイル（passable）を明示的に定義
        this.passableTiles = new Set([
            // === 地面 ===
            'grass',
            'dirt',
            'stone',
            'sand',
            'snow',
            'mud',

            // === 道 ===
            'path',
            'dirt_path',
            'stone_path',
            'cobblestone',

            // === 床 ===
            'wood_floor',
            'stone_floor',
            'tile_floor',

            // === 小さいオブジェクト（通り抜け可能） ===
            'chair',
            'bench',
            'small_debris',
            'wood_debris',
            'debris',
            'flower',
            'mushroom',
            'small_rock',

            // === 水（通れることにする、後で変更可能） ===
            'water',
            'shallow_water'
        ]);

        console.log('[MapLayerSystem] Initialized');
        console.log('[MapLayerSystem] Solid tiles:', this.solidTiles.size, 'types');
        console.log('[MapLayerSystem] Passable tiles:', this.passableTiles.size, 'types');

        // ★未知のタイルタイプを一度だけ警告するためのSet
        this._warnedTiles = new Set();
        
        // ★タイル名の短縮マッピング
        this.tileCodeMap = {
            // 地形
            'grass': 'g',
            'grass_tile': 'g',
            'dirt': 'd',
            'dirt_tile': 'd',
            'stone': 's',
            'stone_tile': 's',
            'sand': 'sa',
            'sand_tile': 'sa',
            'snow': 'sn',
            'snow_tile': 'sn',
            'water': 'w',
            'water_tile': 'w',
            'path': 'p',
            'path_tile': 'p',
            
            // 建物
            'wood_floor': 'wf',
            'stone_wall': 'sw',
            'broken_wall': 'bw',
            'door': 'dr',
            'broken_door': 'bd',
            
            // 家具
            'chair': 'ch',
            'barrel': 'br',
            'gravestone': 'gs',
            'broken_bed': 'bb',
            'fireplace': 'fp',
            'altar': 'al',
            'bench': 'bn',
            
            // 瓦礫
            'debris': 'db',
            'wood_debris': 'wd',
            
            // 自然
            'tree': 't',
            'rock': 'r',
            'bush': 'bu'
        };
        
        // 逆マッピング
        this.codeToTileMap = {};
        Object.keys(this.tileCodeMap).forEach(key => {
            this.codeToTileMap[this.tileCodeMap[key]] = key;
        });
    }
    
    /**
     * タイルを配置
     * @param {string} layer - レイヤー名 ('ground', 'path', or 'objects')
     * @param {number} tileX - タイルのX座標
     * @param {number} tileY - タイルのY座標
     * @param {string} tileType - タイルタイプ ('grass_tile', 'dirt_tile', etc.)
     */
    placeTile(layer, tileX, tileY, tileType) {
        if (layer === 'objects' || layer === 'ground' || layer === 'path') {
            const chunkX = Math.floor(tileX / this.chunkSize);
            const chunkY = Math.floor(tileY / this.chunkSize);
            const localX = tileX - chunkX * this.chunkSize;
            const localY = tileY - chunkY * this.chunkSize;
            
            const key = `${chunkX},${chunkY}`;
            
            if (!this.layers[layer][key]) {
                this.layers[layer][key] = this.createEmptyChunk();
            }
            
            this.layers[layer][key][localY][localX] = tileType;
        }
    }
    
    /**
     * タイルを削除
     * @param {string} layer - レイヤー名
     * @param {number} tileX - タイルのX座標
     * @param {number} tileY - タイルのY座標
     */
    removeTile(layer, tileX, tileY) {
        const chunkX = Math.floor(tileX / this.chunkSize);
        const chunkY = Math.floor(tileY / this.chunkSize);
        const localX = tileX - chunkX * this.chunkSize;
        const localY = tileY - chunkY * this.chunkSize;
        
        const key = `${chunkX},${chunkY}`;
        
        if (this.layers[layer][key]) {
            this.layers[layer][key][localY][localX] = null;
        }
    }
    
    /**
     * 空のチャンクを作成
     * @returns {Array} 16×16のnull配列
     */
    createEmptyChunk() {
        const chunk = [];
        for (let y = 0; y < this.chunkSize; y++) {
            const row = [];
            for (let x = 0; x < this.chunkSize; x++) {
                row.push(null);
            }
            chunk.push(row);
        }
        return chunk;
    }
    
    /**
     * オブジェクトを配置
     * @param {Object} obj - オブジェクト {x, y, type, size, color, hasCollision}
     */
    placeObject(obj) {
        this.layers.objectsArray.push(obj);
    }
    
    /**
     * オブジェクトを削除
     * @param {number} worldX - ワールドX座標
     * @param {number} worldY - ワールドY座標
     * @param {number} radius - 削除半径
     */
    removeObject(worldX, worldY, radius) {
        this.layers.objectsArray = this.layers.objectsArray.filter(obj => {
            const dist = Math.sqrt((obj.x - worldX) ** 2 + (obj.y - worldY) ** 2);
            return dist > radius;
        });
    }
    
    /**
     * タイルが通行可能かチェック（ワールド座標）
     */
    isTilePassable(worldX, worldY) {
        const tileX = Math.floor(worldX / this.tileSize);
        const tileY = Math.floor(worldY / this.tileSize);
        
        const chunkX = Math.floor(tileX / this.chunkSize);
        const chunkY = Math.floor(tileY / this.chunkSize);
        const localX = ((tileX % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localY = ((tileY % this.chunkSize) + this.chunkSize) % this.chunkSize;
        
        const key = `${chunkX},${chunkY}`;
        const chunk = this.layers.objects[key];
        
        if (!chunk) return true;
        
        const tileType = chunk[localY] && chunk[localY][localX];
        
        if (tileType) {
            if (this.solidTiles.has(tileType)) {
                return false;
            }
            if (this.passableTiles.has(tileType)) {
                return true;
            }
            // ★定義されていないタイルは一度だけ警告を出す（デバッグ用）
            if (!this._warnedTiles.has(tileType)) {
                this._warnedTiles.add(tileType);
                console.warn('[MapLayerSystem] Unknown tile type:', tileType, 'at', tileX, tileY, '- assuming passable');
            }
        }

        return true;
    }
    
    /**
     * 矩形が通行可能かチェック（プレイヤーの当たり判定用）
     * ★中心点のみチェック（引っかかりを防ぐ）
     * width/height は後方互換性のため残しているが使用しない
     */
    isRectPassable(worldX, worldY, width, height) {
        return this.isTilePassable(worldX, worldY);
    }
    
    /**
     * マップを描画（バッチ描画版）
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} camera - カメラオブジェクト
     * @param {Object} textures - テクスチャオブジェクト
     */
    render(ctx, camera, textures) {
        // ★描画統計をリセット
        this.lastBatchCount = 0;
        this.lastRectCount = 0;

        const batches = {};
        const layerOrder = ['ground', 'path', 'objects'];

        // 各レイヤーを順番にバッチ収集→描画→クリアする（batches を再利用）
        layerOrder.forEach(layerName => {
            // 1. タイルをスキャンしてバッチに追加
            this.collectLayerBatches(batches, camera, textures, layerName);

            // 2. バッチを描画
            this.renderBatches(ctx, batches);

            // 次のレイヤーのためにバッチをクリア
            Object.keys(batches).forEach(key => delete batches[key]);
        });

        // レイヤー3b: 大きなオブジェクト（objectsArray）を描画
        this.layers.objectsArray.forEach(obj => {
            const screenPos = camera.worldToScreen(obj.x, obj.y);
            const screenSize = obj.size * camera.zoom;

            if (!this.isInView(camera, obj.x, obj.y)) return;

            const texture = textures[obj.type];
            if (texture) {
                const zoom = camera.zoom * 2;
                this.renderPixelTexture(ctx, texture, screenPos.x, screenPos.y, zoom);
            } else {
                ctx.fillStyle = obj.color;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, screenSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }

            if (obj.hasCollision) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3 * camera.zoom;
                const boxSize = screenSize * 2;
                ctx.strokeRect(
                    screenPos.x - boxSize / 2,
                    screenPos.y - boxSize / 2,
                    boxSize,
                    boxSize
                );
            }
        });
    }

    /**
     * レイヤーのタイルをスキャンしてバッチに追加
     * @param {Object} batches - バッチオブジェクト
     * @param {Object} camera - カメラオブジェクト
     * @param {Object} textures - テクスチャオブジェクト
     * @param {string} layerName - レイヤー名
     */
    collectLayerBatches(batches, camera, textures, layerName) {
        const layer = this.layers[layerName];

        const cameraChunkX = Math.floor(camera.x / (this.chunkSize * this.tileSize));
        const cameraChunkY = Math.floor(camera.y / (this.chunkSize * this.tileSize));

        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                const chunkX = cameraChunkX + dx;
                const chunkY = cameraChunkY + dy;
                const key = `${chunkX},${chunkY}`;

                const chunk = layer[key];
                if (!chunk) continue;

                for (let localY = 0; localY < this.chunkSize; localY++) {
                    for (let localX = 0; localX < this.chunkSize; localX++) {
                        const tileType = chunk[localY][localX];
                        if (!tileType) continue;

                        const worldX = (chunkX * this.chunkSize + localX) * this.tileSize;
                        const worldY = (chunkY * this.chunkSize + localY) * this.tileSize;

                        if (!this.isInView(camera, worldX, worldY)) continue;

                        const screenPos = camera.worldToScreen(worldX, worldY);
                        const displaySize = this.tileSize * camera.zoom;
                        const texture = textures[tileType];

                        if (texture) {
                            this.addTextureToBatch(batches, texture, screenPos, displaySize);
                        } else {
                            const color = this.getFallbackColor(tileType);
                            this.addRectToBatch(batches, color, screenPos, displaySize);
                        }
                    }
                }
            }
        }
    }

    /**
     * タイルレイヤーのレンダリング（後方互換性のため残す）
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} camera - カメラオブジェクト
     * @param {Object} textures - テクスチャオブジェクト
     * @param {string} layerName - レイヤー名
     */
    renderLayer(ctx, camera, textures, layerName) {
        const batches = {};
        this.collectLayerBatches(batches, camera, textures, layerName);
        this.renderBatches(ctx, batches);
    }
    
    /**
     * タイルレイヤーのレンダリング（汎用）
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} camera - カメラオブジェクト
     * @param {Object} textures - テクスチャオブジェクト
     * @param {string} layerName - レイヤー名
     */
    renderTileLayer(ctx, camera, textures, layerName) {
        this.renderLayer(ctx, camera, textures, layerName);
    }
    
    /**
     * オブジェクトレイヤーのレンダリング
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} camera - カメラオブジェクト
     * @param {Object} textures - テクスチャオブジェクト
     */
    renderObjectLayer(ctx, camera, textures) {
        // Render tile-based objects (from chunks)
        this.renderTileLayer(ctx, camera, textures, 'objects');
        
        // Render large objects (from array)
        this.layers.objectsArray.forEach(obj => {
            const screenPos = camera.worldToScreen(obj.x, obj.y);
            const screenSize = obj.size * camera.zoom;
            
            // 視界チェック
            if (!this.isInView(camera, obj.x, obj.y)) return;
            
            // ピクセルアート画像を表示
            const texture = textures[obj.type];
            if (texture) {
                const zoom = camera.zoom * 2;
                this.renderPixelTexture(ctx, texture, screenPos.x, screenPos.y, zoom);
            } else {
                // フォールバック: 円で表示
                ctx.fillStyle = obj.color;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, screenSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
            
            // 当たり判定があるオブジェクトには白い枠
            if (obj.hasCollision) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3 * camera.zoom;
                const boxSize = screenSize * 2;
                ctx.strokeRect(
                    screenPos.x - boxSize / 2,
                    screenPos.y - boxSize / 2,
                    boxSize,
                    boxSize
                );
            }
        });
    }
    
    /**
     * タイルテクスチャのレンダリング
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} pixels - ピクセルデータ
     * @param {number} x - 中心X座標
     * @param {number} y - 中心Y座標
     * @param {number} displaySize - 表示サイズ
     */
    renderTileTexture(ctx, pixels, x, y, displaySize) {
        if (!pixels || pixels.length === 0) return;
        
        const pixelHeight = pixels.length;
        const pixelWidth = pixels[0] ? pixels[0].length : 0;
        if (pixelWidth === 0) return;
        
        const pixelSize = displaySize / pixelWidth;
        
        for (let py = 0; py < pixelHeight; py++) {
            for (let px = 0; px < pixelWidth; px++) {
                const color = pixels[py][px];
                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        x + px * pixelSize - displaySize / 2,
                        y + py * pixelSize - displaySize / 2,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
    }
    
    /**
     * ピクセルテクスチャのレンダリング
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} pixels - ピクセルデータ
     * @param {number} x - 中心X座標
     * @param {number} y - 中心Y座標
     * @param {number} zoom - ズーム倍率
     */
    renderPixelTexture(ctx, pixels, x, y, zoom) {
        if (!pixels || pixels.length === 0) return;
        
        const height = pixels.length;
        const width = pixels[0] ? pixels[0].length : 0;
        
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const color = pixels[py][px];
                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        x + (px - width / 2) * zoom,
                        y + (py - height / 2) * zoom,
                        zoom,
                        zoom
                    );
                }
            }
        }
    }
    
    /**
     * テクスチャをバッチに追加
     * @param {Object} batches - バッチオブジェクト（色→矩形配列）
     * @param {Array} texture - ピクセルデータ
     * @param {Object} screenPos - スクリーン座標 {x, y}
     * @param {number} displaySize - 表示サイズ（tileSize * zoom）
     */
    addTextureToBatch(batches, texture, screenPos, displaySize) {
        const textureHeight = texture.length;
        const textureWidth = texture[0] ? texture[0].length : 0;
        if (textureWidth === 0) return;

        const pixelSize = displaySize / textureWidth;
        // ズームアウト時に1px未満にならないよう最小サイズを1に制限
        const size = Math.max(1, Math.ceil(pixelSize));

        for (let py = 0; py < textureHeight; py++) {
            for (let px = 0; px < textureWidth; px++) {
                const color = texture[py][px];
                if (color && color !== 'transparent') {
                    const x = Math.floor(screenPos.x + px * pixelSize - displaySize / 2);
                    const y = Math.floor(screenPos.y + py * pixelSize - displaySize / 2);

                    if (!batches[color]) {
                        batches[color] = [];
                    }
                    batches[color].push({ x, y, width: size, height: size });
                }
            }
        }
    }

    /**
     * 矩形をバッチに追加（テクスチャなし単色タイル用）
     * @param {Object} batches - バッチオブジェクト（色→矩形配列）
     * @param {string} color - 色
     * @param {Object} screenPos - スクリーン座標 {x, y}
     * @param {number} displaySize - 表示サイズ（tileSize * zoom）
     */
    addRectToBatch(batches, color, screenPos, displaySize) {
        const size = Math.ceil(displaySize);
        const x = Math.floor(screenPos.x - displaySize / 2);
        const y = Math.floor(screenPos.y - displaySize / 2);

        if (!batches[color]) {
            batches[color] = [];
        }
        batches[color].push({ x, y, width: size, height: size });
    }

    /**
     * バッチを描画（同じ色の矩形をまとめて描画）
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} batches - バッチオブジェクト（色→矩形配列）
     */
    renderBatches(ctx, batches) {
        const entries = Object.entries(batches);

        // 描画前に統計を集計（レンダリングループへの影響を最小化）
        for (const [, rects] of entries) {
            if (rects.length === 0) continue;
            this.lastBatchCount++;
            this.lastRectCount += rects.length;
        }

        for (const [color, rects] of entries) {
            if (rects.length === 0) continue;

            ctx.fillStyle = color;

            for (const rect of rects) {
                ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            }
        }
    }

    /**
     * タイルタイプのフォールバックカラーを取得
     * @param {string} tileType - タイルタイプ
     * @returns {string} カラーコード
     */
    getFallbackColor(tileType) {
        const fallbackColors = {
            grass: '#4a7c4e',
            dirt: '#8b6f47',
            stone: '#7a7a7a',
            sand: '#d4c4a0',
            snow: '#e8e8e8',
            water: '#4a7aaa',
            path: '#9b7f57',
            tree: '#2a5a2a',
            rock: '#6a6a6a',
            bush: '#3a6c3e',
            wood_floor: '#8b6f47',
            stone_wall: '#7a7a7a',
            broken_wall: '#6a6a6a',
            door: '#8b6f47',
            broken_door: '#7b5f37',
            chair: '#8b6f47',
            barrel: '#8b6f47',
            gravestone: '#7a7a7a',
            broken_bed: '#8b6f47',
            fireplace: '#6a6a6a',
            altar: '#8a8a8a',
            bench: '#8b6f47',
            debris: '#6a6a6a',
            wood_debris: '#7b5f37'
        };

        return fallbackColors[tileType] || '#888888';
    }

    /**
     * カメラの視界チェック
     * @param {Object} camera - カメラオブジェクト
     * @param {number} worldX - ワールドX座標
     * @param {number} worldY - ワールドY座標
     * @returns {boolean} 視界内ならtrue
     */
    isInView(camera, worldX, worldY) {
        const buffer = 200; // バッファ
        const bounds = camera.getViewBounds();
        
        return worldX >= bounds.left - buffer &&
               worldX <= bounds.right + buffer &&
               worldY >= bounds.top - buffer &&
               worldY <= bounds.bottom + buffer;
    }
    
    /**
     * ワールド座標からタイル座標を取得
     * @param {number} worldX - ワールドX座標
     * @param {number} worldY - ワールドY座標
     * @returns {Object} {tileX, tileY}
     */
    worldToTile(worldX, worldY) {
        return {
            tileX: Math.floor(worldX / this.tileSize),
            tileY: Math.floor(worldY / this.tileSize)
        };
    }
    
    /**
     * タイル座標からワールド座標を取得
     * @param {number} tileX - タイルX座標
     * @param {number} tileY - タイルY座標
     * @returns {Object} {worldX, worldY}
     */
    tileToWorld(tileX, tileY) {
        return {
            worldX: tileX * this.tileSize,
            worldY: tileY * this.tileSize
        };
    }
    
    /**
     * タイル名を短縮コードに変換
     */
    encodeType(tileType) {
        return this.tileCodeMap[tileType] || tileType;
    }
    
    /**
     * 短縮コードをタイル名に変換
     */
    decodeType(code) {
        return this.codeToTileMap[code] || code;
    }
    
    /**
     * チャンクをランレングス圧縮
     */
    compressChunk(chunk) {
        if (!chunk || !Array.isArray(chunk) || chunk.length === 0) {
            return null;  // 空チャンクはスキップ
        }
        
        const compressed = {};
        
        // 各タイルを短縮コードに変換
        for (let y = 0; y < chunk.length; y++) {
            for (let x = 0; x < chunk[y].length; x++) {
                const tileType = chunk[y][x];
                if (tileType !== null) {
                    const key = `${x},${y}`;
                    compressed[key] = this.encodeType(tileType);
                }
            }
        }
        
        // 空の場合はnullを返す
        return Object.keys(compressed).length > 0 ? compressed : null;
    }
    
    /**
     * チャンクを解凍
     */
    decompressChunk(compressed) {
        if (!compressed) return this.createEmptyChunk();
        
        const chunk = this.createEmptyChunk();
        
        Object.keys(compressed).forEach(tileKey => {
            const [x, y] = tileKey.split(',').map(Number);
            const code = compressed[tileKey];
            chunk[y][x] = this.decodeType(code);
        });
        
        return chunk;
    }
    
    /**
     * LocalStorageに保存
     */
    save() {
        try {
            console.log('[MapLayerSystem] Starting save with compression...');
            
            const compressedLayers = {};
            
            // 各レイヤーを圧縮
            Object.keys(this.layers).forEach(layerName => {
                if (layerName === 'objectsArray') {
                    // objectsArray はそのまま保存
                    return;
                }
                
                const layer = this.layers[layerName];
                const compressedLayer = {};
                
                Object.keys(layer).forEach(chunkKey => {
                    const compressed = this.compressChunk(layer[chunkKey]);
                    if (compressed) {  // 空でない場合のみ保存
                        compressedLayer[chunkKey] = compressed;
                    }
                });
                
                compressedLayers[layerName] = compressedLayer;
            });
            
            const data = {
                layers: compressedLayers,
                objectsArray: this.layers.objectsArray,
                version: 2
            };
            
            const jsonString = JSON.stringify(data);
            console.log('[MapLayerSystem] JSON size:', (jsonString.length / 1024).toFixed(2), 'KB');
            
            // LZString で圧縮
            const compressed = LZString.compress(jsonString);
            console.log('[MapLayerSystem] Compressed size:', (compressed.length / 1024).toFixed(2), 'KB');
            console.log('[MapLayerSystem] Compression ratio:', ((1 - compressed.length / jsonString.length) * 100).toFixed(1), '%');
            
            localStorage.setItem('mapLayerData_v2', compressed);
            console.log('[MapLayerSystem] Saved to localStorage (v2, compressed)');
        } catch (error) {
            console.error('[MapLayerSystem] Save failed:', error);
            
            // フォールバック: より積極的な圧縮
            try {
                console.log('[MapLayerSystem] Attempting aggressive compression...');
                const minimalData = {
                    layers: this.layers,
                    version: 2
                };
                const compressed = LZString.compress(JSON.stringify(minimalData));
                localStorage.setItem('mapLayerData_v2', compressed);
                console.log('[MapLayerSystem] Saved with aggressive compression');
            } catch (fallbackError) {
                console.error('[MapLayerSystem] Aggressive compression also failed:', fallbackError);
                alert('マップデータが大きすぎて保存できませんでした。\nゲーム終了時にマップは失われます。');
            }
        }
    }
    
    /**
     * LocalStorageから読み込み
     */
    load() {
        try {
            const compressed = localStorage.getItem('mapLayerData_v2');  // ← キー変更
            if (!compressed) {
                console.log('[MapLayerSystem] No data to load');
                return false;
            }
            
            console.log('[MapLayerSystem] Loading compressed data...');
            
            // LZString で解凍
            const jsonString = LZString.decompress(compressed);
            const parsed = JSON.parse(jsonString);
            
            // 各レイヤーを解凍
            const decompressedLayers = {};
            Object.keys(parsed.layers).forEach(layerName => {
                const compressedLayer = parsed.layers[layerName];
                const layer = {};
                
                Object.keys(compressedLayer).forEach(chunkKey => {
                    layer[chunkKey] = this.decompressChunk(compressedLayer[chunkKey]);
                });
                
                decompressedLayers[layerName] = layer;
            });
            
            this.layers.ground = decompressedLayers.ground || {};
            this.layers.path = decompressedLayers.path || {};
            this.layers.objects = decompressedLayers.objects || {};
            this.layers.objectsArray = parsed.objectsArray || [];
            
            console.log('[MapLayerSystem] Loaded from localStorage (v2, decompressed)');
            return true;
        } catch (error) {
            console.error('[MapLayerSystem] Load failed:', error);
            return false;
        }
    }
    
    /**
     * レイヤーをクリア
     * @param {string} layerName - レイヤー名
     */
    clearLayer(layerName) {
        if (layerName === 'objectsArray') {
            this.layers.objectsArray = [];
        } else {
            this.layers[layerName] = {};
        }
        console.log(`[MapLayerSystem] Cleared layer: ${layerName}`);
    }
    
    /**
     * データの存在確認
     */
    hasData() {
        const data = localStorage.getItem('mapLayerData_v2');  // ← キー変更
        const exists = data !== null && data !== undefined && data !== 'undefined';
        console.log('[MapLayerSystem] hasData:', exists);
        return exists;
    }
    
    /**
     * マップをリセット
     */
    reset() {
        this.layers = {
            ground: {},
            path: {},
            objects: {},
            objectsArray: []
        };
        localStorage.removeItem('mapLayerData_v2');  // ← キー変更
        // ★古いキーも削除
        localStorage.removeItem('mapLayerData');
        console.log('[MapLayerSystem] Map data reset (v2)');
    }
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.MapLayerSystem = MapLayerSystem;
}

console.log('MapLayerSystem loaded');
