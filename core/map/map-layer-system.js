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
     * レンダリング
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} camera - カメラオブジェクト
     * @param {Object} textures - テクスチャオブジェクト
     */
    render(ctx, camera, textures) {
        // レイヤー順に描画
        this.renderLayer(ctx, camera, textures, 'ground');
        this.renderLayer(ctx, camera, textures, 'path');
        this.renderObjectLayer(ctx, camera, textures);
    }
    
    /**
     * タイルレイヤーのレンダリング
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} camera - カメラオブジェクト
     * @param {Object} textures - テクスチャオブジェクト
     * @param {string} layerName - レイヤー名
     */
    renderLayer(ctx, camera, textures, layerName) {
        const layer = this.layers[layerName];
        
        // カメラ範囲内のチャンクを取得
        const cameraChunkX = Math.floor(camera.x / (this.chunkSize * this.tileSize));
        const cameraChunkY = Math.floor(camera.y / (this.chunkSize * this.tileSize));
        
        // 周囲2チャンクを描画
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                const chunkX = cameraChunkX + dx;
                const chunkY = cameraChunkY + dy;
                const key = `${chunkX},${chunkY}`;
                
                const chunk = layer[key];
                if (!chunk) continue;
                
                // チャンク内のタイルを描画
                for (let localY = 0; localY < this.chunkSize; localY++) {
                    for (let localX = 0; localX < this.chunkSize; localX++) {
                        const tileType = chunk[localY][localX];
                        if (!tileType) continue;
                        
                        const worldX = (chunkX * this.chunkSize + localX) * this.tileSize;
                        const worldY = (chunkY * this.chunkSize + localY) * this.tileSize;
                        
                        // カメラの視界チェック
                        if (!this.isInView(camera, worldX, worldY)) continue;
                        
                        const screenPos = camera.worldToScreen(worldX, worldY);
                        const texture = textures[tileType];
                        
                        if (texture) {
                            this.renderTileTexture(ctx, texture, screenPos.x, screenPos.y, this.tileSize * camera.zoom);
                        }
                    }
                }
            }
        }
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
