/**
 * Editor System - Map & Weapon Editor
 * マップと武器のエディター機能
 */

class Editor {
    constructor(game) {
        this.game = game;
        
        // エディターモード: 'map' | 'weapon' | 'character'
        this.mode = 'map';
        
        // サブモード: 'placement' | 'texture' (map), 'params' | 'icon' (weapon), 'stats' | 'sprite' (character)
        this.subMode = 'placement';
        
        // マップレイヤーシステム
        this.layerSystem = new MapLayerSystem();
        this.currentLayer = 'ground';  // 'ground', 'path', 'objects'
        
        // タイルタイプ（地面用）
        this.groundTileTypes = [
            { name: '草原', icon: '🟩', type: 'grass_tile' },
            { name: '土', icon: '🟫', type: 'dirt_tile' },
            { name: '石畳', icon: '🛣️', type: 'stone_tile' },
            { name: '砂', icon: '🌾', type: 'sand_tile' },
            { name: '雪', icon: '❄️', type: 'snow_tile' },
            { name: '木の床', icon: '🪵', type: 'wood_floor' }
        ];
        
        // タイルタイプ（道用）
        this.pathTileTypes = [
            { name: '土の道', icon: '🛣️', type: 'path_tile' },
            { name: '石畳', icon: '🪨', type: 'stone_tile' }
        ];
        
        // マップエディター用
        this.selectedObjectType = 0;
        this.selectedTileType = 0;
        this.objectTypes = [
            { name: '岩', icon: '🗿', type: 'rock', size: 25, color: '#6b6b6b', hasCollision: true },
            { name: '木', icon: '🌲', type: 'tree', size: 30, color: '#228b22', hasCollision: true },
            { name: '茂み', icon: '🌳', type: 'bush', size: 20, color: '#2d5016', hasCollision: false },
            { name: 'サボテン', icon: '🌵', type: 'cactus', size: 22, color: '#7cb342', hasCollision: true },
            { name: '草', icon: '🌿', type: 'grass', size: 15, color: '#90ee90', hasCollision: false },
            { name: '石壁', icon: '🧱', type: 'stone_wall', size: 16, color: '#7a7a7a', hasCollision: true },
            { name: '壊れた壁', icon: '💥', type: 'broken_wall', size: 16, color: '#7a7a7a', hasCollision: false },
            { name: '椅子', icon: '🪑', type: 'chair', size: 16, color: '#8b6f47', hasCollision: false },
            { name: '樽', icon: '🛢️', type: 'barrel', size: 16, color: '#8b6f47', hasCollision: true },
            { name: '墓石', icon: '🪦', type: 'gravestone', size: 20, color: '#6a6a6a', hasCollision: true }
        ];
        this.placedObjects = [];
        this.showGrid = true;
        this.gridSize = 64;  // タイルサイズに合わせる
        
        // カメラ操作用
        this.cameraMoveSpeed = 300;
        this.cameraZoomSpeed = 0.1;
        
        // 武器エディター用
        this.selectedWeaponIndex = 0;
        this.selectedParamIndex = 0;
        this.weaponList = ['fireball', 'knife', 'lightning'];
        this.weaponParams = {
            fireball: { damage: 15, cooldown: 2.0, range: 400 },
            knife: { damage: 20, cooldown: 0.5, range: 300 },
            lightning: { damage: 25, cooldown: 3.0, range: 400 }
        };
        this.weaponNames = {
            fireball: 'ファイアボール',
            knife: 'ナイフ',
            lightning: 'ライトニング'
        };
        this.weaponIcons = {
            fireball: '🔥',
            knife: '🔪',
            lightning: '⚡'
        };
        
        // キャラクターエディター用
        this.selectedCharacterIndex = 0;
        this.characterList = ['player', 'zombie'];
        this.characterParams = {
            player: { maxHealth: 100, speed: 200, regen: 0 },
            zombie: { maxHealth: 50, speed: 60, damage: 10 }
        };
        this.characterNames = {
            player: 'プレイヤー',
            zombie: 'ゾンビ'
        };
        this.selectedCharParamIndex = 0;
        
        // ★キャラクタープレビュー
        this.previewAnimation = 'idle';  // 'idle', 'walk', 'death'
        this.previewFrame = 0;
        this.previewFrameTime = 0;
        this.previewFacingRight = true;
        
        // キャラクタータイプ一覧
        this.characterTypes = ['warrior', 'mage', 'hunter'];
        this.characterPaletteIndex = 0;
        
        // トップメニュー
        this.selectedMenuIndex = 0;
        this.menuItems = [
            { name: 'マップ', action: () => this.switchMode('map') },
            { name: '武器', action: () => this.switchMode('weapon') },
            { name: 'キャラクター', action: () => this.switchMode('character') },
            { name: '保存', action: () => this.saveToLocalStorage() },
            { name: '読込', action: () => this.loadFromLocalStorage() },
            { name: 'リセット', action: () => this.resetMap() },
            { name: '戻る', action: () => this.exit() }
        ];
        
        // ピクセルアートエディター（統合用）
        this.editingTexture = null;  // 現在編集中のテクスチャタイプ
        
        // デフォルトテクスチャの初期化
        this.initializeTextures();
        
        // ★デフォルトスプライトシートを作成
        this.createDefaultCharacterSprites();
    }
    
    /**
     * モード切り替え
     */
    switchMode(newMode) {
        this.mode = newMode;
        // デフォルトサブモード
        if (newMode === 'map') {
            this.subMode = 'placement';
        } else if (newMode === 'weapon') {
            this.subMode = 'params';
        } else if (newMode === 'character') {
            this.subMode = 'sprite';  // Start with sprite editor for character preview
        }
    }
    
    /**
     * デフォルトテクスチャの初期化
     */
    initializeTextures() {
        this.textures = {
            // マップオブジェクト
            grass: this.createGrassTexture(),
            tree: this.createTreeTexture(),
            rock: this.createRockTexture(),
            bush: this.createBushTexture(),
            cactus: this.createCactusTexture(),
            // タイル（地面・道）
            grass_tile: this.createGrassTile(),
            dirt_tile: this.createDirtTile(),
            stone_tile: this.createStoneTile(),
            sand_tile: this.createSandTile(),
            snow_tile: this.createSnowTile(),
            path_tile: this.createPathTile(),
            // 建物タイル
            wood_floor: this.createWoodFloorTile(),
            stone_wall: this.createStoneWallTile(),
            broken_wall: this.createBrokenWallTile(),
            broken_door: this.createBrokenDoorTile(),
            chair: this.createChairTile(),
            barrel: this.createBarrelTile(),
            gravestone: this.createGravestoneTile(),
            broken_bed: this.createBrokenBedTile(),
            fireplace: this.createFireplaceTile(),
            door: this.createDoorTile(),
            altar: this.createAltarTile(),
            bench: this.createBenchTile(),
            debris: this.createDebrisTile(),
            wood_debris: this.createWoodDebrisTile(),
            // 武器アイコン
            fireball_icon: this.createFireballIcon(),
            knife_icon: this.createKnifeIcon(),
            lightning_icon: this.createLightningIcon(),
            // キャラクタースプライト
            player_sprite: this.createPlayerSprite(),
            zombie_sprite: this.createZombieSprite()
        };
    }
    
    // ========== テクスチャ作成メソッド ==========
    
    createGrassTexture() {
        const pixels = [];
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // ベース色（緑）
                if (Math.random() > 0.2) {
                    row.push('#4a7c2c');
                } else {
                    // アクセント（明るい緑）
                    row.push('#5a9c3c');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createTreeTexture() {
        const pixels = [];
        for (let y = 0; y < 32; y++) {
            const row = [];
            for (let x = 0; x < 24; x++) {
                if (y < 20) {
                    // 葉の部分（円形）
                    const dx = x - 12;
                    const dy = y - 10;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 10) {
                        row.push('#2d5016');
                    } else {
                        row.push('transparent');
                    }
                } else {
                    // 幹の部分
                    if (x >= 10 && x <= 14) {
                        row.push('#5d4037');
                    } else {
                        row.push('transparent');
                    }
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createRockTexture() {
        const pixels = [];
        const centerX = 12;
        const centerY = 12;
        
        for (let y = 0; y < 24; y++) {
            const row = [];
            for (let x = 0; x < 24; x++) {
                // 六角形の岩
                const angle = Math.atan2(y - centerY, x - centerX);
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                
                // 六角形の判定
                const hexRadius = 10;
                const hexAngle = Math.floor((angle + Math.PI) / (Math.PI / 3));
                const hexDist = hexRadius / Math.cos((angle + Math.PI) - hexAngle * (Math.PI / 3));
                
                if (distance < hexDist) {
                    // 岩の色（茶色系）
                    if (distance < hexDist * 0.3) {
                        row.push('#a0826d');  // 明るい部分
                    } else if (distance < hexDist * 0.7) {
                        row.push('#8b7355');  // 中間
                    } else {
                        row.push('#6b5d4f');  // 暗い部分
                    }
                } else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createBushTexture() {
        const pixels = [];
        const centerX = 8;
        const centerY = 8;
        
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                
                if (distance < 7) {
                    // 茂みの色（暗い緑）
                    if (Math.random() > 0.3) {
                        row.push('#3a5c1c');
                    } else {
                        row.push('#4a6c2c');
                    }
                } else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createCactusTexture() {
        const pixels = [];
        
        for (let y = 0; y < 24; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // 本体
                if (x >= 6 && x <= 10 && y >= 4 && y <= 20) {
                    row.push('#5a8c3a');
                }
                // 左の腕
                else if (x >= 2 && x <= 5 && y >= 8 && y <= 12) {
                    row.push('#5a8c3a');
                }
                // 右の腕
                else if (x >= 11 && x <= 14 && y >= 12 && y <= 16) {
                    row.push('#5a8c3a');
                }
                else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createFireballIcon() {
        const pixels = [];
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                const dx = x - 8;
                const dy = y - 8;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 6) {
                    if (distance < 3) {
                        row.push('#ffff00');  // 中心（黄色）
                    } else if (distance < 5) {
                        row.push('#ff8800');  // 中間（オレンジ）
                    } else {
                        row.push('#ff0000');  // 外側（赤）
                    }
                } else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createKnifeIcon() {
        const pixels = [];
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // 刃
                if ((x >= 2 && x <= 10 && y >= 6 && y <= 8) ||
                    (x >= 8 && x <= 12 && y >= 4 && y <= 10)) {
                    row.push('#c0c0c0');
                }
                // 柄
                else if (x >= 10 && x <= 13 && y >= 8 && y <= 12) {
                    row.push('#8b4513');
                }
                else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createLightningIcon() {
        const pixels = [];
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // 稲妻の形
                if ((x === 8 && y >= 2 && y <= 6) ||
                    (x === 9 && y === 6) ||
                    (x === 10 && y === 7) ||
                    (x === 9 && y === 8) ||
                    (x === 8 && y >= 9 && y <= 13)) {
                    row.push('#00ffff');
                } else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createPlayerSprite() {
        const pixels = [];
        for (let y = 0; y < 32; y++) {
            const row = [];
            for (let x = 0; x < 32; x++) {
                // 頭（円形）
                if (y >= 4 && y <= 12) {
                    const dx = x - 16;
                    const dy = y - 8;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 6) {
                        row.push('#ffcc99');  // 肌色
                    } else {
                        row.push('transparent');
                    }
                }
                // 体
                else if (y >= 12 && y <= 24 && x >= 10 && x <= 22) {
                    row.push('#0088ff');  // 青い服
                }
                // 腕
                else if (y >= 14 && y <= 22 && ((x >= 6 && x <= 9) || (x >= 23 && x <= 26))) {
                    row.push('#ffcc99');  // 肌色
                }
                // 脚
                else if (y >= 24 && y <= 30 && ((x >= 12 && x <= 14) || (x >= 18 && x <= 20))) {
                    row.push('#0044aa');  // 濃い青
                }
                else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createZombieSprite() {
        const pixels = [];
        for (let y = 0; y < 32; y++) {
            const row = [];
            for (let x = 0; x < 32; x++) {
                // 頭
                if (y >= 4 && y <= 12) {
                    const dx = x - 16;
                    const dy = y - 8;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 6) {
                        row.push('#88cc88');  // 緑色の肌
                    } else {
                        row.push('transparent');
                    }
                }
                // 体
                else if (y >= 12 && y <= 24 && x >= 10 && x <= 22) {
                    row.push('#666666');  // グレーの服
                }
                // 腕（ボロボロ）
                else if (y >= 14 && y <= 22 && ((x >= 6 && x <= 9) || (x >= 23 && x <= 26))) {
                    if (Math.random() > 0.3) {
                        row.push('#88cc88');
                    } else {
                        row.push('transparent');
                    }
                }
                // 脚
                else if (y >= 24 && y <= 30 && ((x >= 12 && x <= 14) || (x >= 18 && x <= 20))) {
                    row.push('#444444');
                }
                else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * ★デフォルトのキャラクタースプライトを作成
     */
    createDefaultCharacterSprites() {
        this.characterTypes.forEach(charType => {
            const key = `character_${charType}`;
            
            if (!this.textures[key]) {
                // 192×128のスプライトシート（6列×4行、各32×32）
                const spriteSheet = [];
                const color = CHARACTERS[charType].color;
                
                for (let y = 0; y < 128; y++) {
                    const row = [];
                    for (let x = 0; x < 192; x++) {
                        // 簡易的な人型を描画
                        const localX = x % 32;
                        const localY = y % 32;
                        
                        // 頭
                        if (localY >= 4 && localY <= 12 && localX >= 12 && localX <= 20) {
                            row.push(color);
                        }
                        // 体
                        else if (localY >= 12 && localY <= 22 && localX >= 10 && localX <= 22) {
                            row.push(color);
                        }
                        // 脚
                        else if (localY >= 22 && localY <= 28) {
                            if ((localX >= 11 && localX <= 14) || (localX >= 18 && localX <= 21)) {
                                row.push(color);
                            } else {
                                row.push('transparent');
                            }
                        }
                        else {
                            row.push('transparent');
                        }
                    }
                    spriteSheet.push(row);
                }
                
                this.textures[key] = spriteSheet;
                console.log('Created default sprite for', charType);
            }
        });
    }
    
    // ========== タイル作成メソッド ==========
    
    /**
     * 草原タイル（16×16）
     */
    createGrassTile() {
        const pixels = [];
        const baseColors = ['#4a7c2c', '#5a8c3c', '#3a6c1c'];
        
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                const rand = Math.random();
                if (rand > 0.9) {
                    row.push('#6aac4c');  // 明るい草
                } else if (rand > 0.7) {
                    row.push('#3a6c1c');  // 暗い草
                } else {
                    row.push('#4a7c2c');  // 基本色
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 土タイル（16×16）
     */
    createDirtTile() {
        const pixels = [];
        const baseColors = ['#8b6f47', '#a0826d', '#6b5d4f'];
        
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                const rand = Math.random();
                if (rand > 0.8) {
                    row.push('#a0826d');  // 明るい土
                } else if (rand > 0.6) {
                    row.push('#6b5d4f');  // 暗い土
                } else {
                    row.push('#8b6f47');  // 基本色
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 石畳タイル（16×16）
     */
    createStoneTile() {
        const pixels = [];
        
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // 石畳のブロックパターン
                const blockX = Math.floor(x / 8);
                const blockY = Math.floor(y / 8);
                const isEdge = (x % 8 === 0 || y % 8 === 0 || x % 8 === 7 || y % 8 === 7);
                
                if (isEdge) {
                    row.push('#4a4a4a');  // 目地（暗い）
                } else {
                    const rand = Math.random();
                    if (rand > 0.8) {
                        row.push('#9a9a9a');  // 明るい石
                    } else if (rand > 0.6) {
                        row.push('#6a6a6a');  // 暗い石
                    } else {
                        row.push('#7a7a7a');  // 基本色
                    }
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 砂タイル（16×16）
     */
    createSandTile() {
        const pixels = [];
        
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                const rand = Math.random();
                if (rand > 0.9) {
                    row.push('#f4e4c4');  // 明るい砂
                } else if (rand > 0.7) {
                    row.push('#c4b494');  // 暗い砂
                } else {
                    row.push('#e4d4b4');  // 基本色
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 雪タイル（16×16）
     */
    createSnowTile() {
        const pixels = [];
        
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                const rand = Math.random();
                if (rand > 0.95) {
                    row.push('#ffffff');  // 真っ白
                } else if (rand > 0.8) {
                    row.push('#d0d0e0');  // やや青白い
                } else {
                    row.push('#e8e8f0');  // 基本色
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 道タイル（16×16）
     */
    createPathTile() {
        const pixels = [];
        
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // 道の中心部分
                if (x >= 4 && x <= 11 && y >= 4 && y <= 11) {
                    const rand = Math.random();
                    if (rand > 0.8) {
                        row.push('#b0a090');  // 明るい道
                    } else {
                        row.push('#a09080');  // 基本色
                    }
                }
                // 道の端（草と混じる）
                else if (x >= 2 && x <= 13 && y >= 2 && y <= 13) {
                    const rand = Math.random();
                    if (rand > 0.5) {
                        row.push('#8b7355');  // 土色
                    } else {
                        row.push('#5a7c3c');  // 草色
                    }
                }
                // 外側（透明）
                else {
                    row.push('transparent');  // 透明（下のレイヤーが見える）
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 木の床タイル（16×16）
     */
    createWoodFloorTile() {
        const pixels = [];
        const woodColors = ['#8b6f47', '#9b7f57', '#7b5f37'];
        
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // 木の板パターン（横方向）
                const boardIndex = Math.floor(y / 4);
                const baseColor = woodColors[boardIndex % 3];
                
                // ランダムなノイズ
                const rand = Math.random();
                if (rand > 0.9) {
                    row.push('#6b4f37');  // 暗い部分
                } else if (rand > 0.8) {
                    row.push('#ab8f67');  // 明るい部分
                } else {
                    row.push(baseColor);
                }
                
                // 板の境界線
                if (y % 4 === 0) {
                    row[row.length - 1] = '#5b4f37';
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 石壁（16×16）
     */
    createStoneWallTile() {
        const pixels = [];
        
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // レンガパターン
                const brickY = Math.floor(y / 4);
                const brickX = Math.floor((x + (brickY % 2) * 8) / 8);
                
                // 境界線
                if (y % 4 === 0 || x % 8 === 0) {
                    row.push('#4a4a4a');  // モルタル
                } else {
                    // レンガの色
                    const rand = Math.random();
                    if (rand > 0.8) {
                        row.push('#8a8a8a');  // 明るいレンガ
                    } else if (rand > 0.6) {
                        row.push('#6a6a6a');  // 暗いレンガ
                    } else {
                        row.push('#7a7a7a');  // 基本色
                    }
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 壊れた壁（16×16）
     */
    createBrokenWallTile() {
        const pixels = [];
        
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // ランダムに欠けた壁
                const rand = Math.random();
                if (rand > 0.6) {
                    // 壁がある部分
                    if (rand > 0.8) {
                        row.push('#8a8a8a');
                    } else {
                        row.push('#7a7a7a');
                    }
                } else {
                    // 欠けた部分（透明）
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * ドア（壊れた）（16×16）
     */
    createBrokenDoorTile() {
        const pixels = [];
        
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // ドア枠
                if (x === 0 || x === 15 || y === 0) {
                    row.push('#5d4037');
                }
                // ドアの板（一部欠けている）
                else if (x >= 4 && x <= 12) {
                    const rand = Math.random();
                    if (rand > 0.4) {
                        row.push('#8b6f47');
                    } else {
                        row.push('transparent');
                    }
                } else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 椅子（16×16）
     */
    createChairTile() {
        const pixels = [];
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // 背もたれ
                if (y >= 2 && y <= 10 && x >= 6 && x <= 10) {
                    row.push('#8b6f47');
                }
                // 座面
                else if (y >= 8 && y <= 11 && x >= 4 && x <= 12) {
                    row.push('#9b7f57');
                }
                // 脚
                else if (y >= 11 && y <= 14 && (x === 5 || x === 11)) {
                    row.push('#7b5f37');
                }
                else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 樽（16×16）
     */
    createBarrelTile() {
        const pixels = [];
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                const centerX = 8;
                const centerY = 10;
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                
                // 樽の形（楕円形）
                if (distance < 6 && y >= 4) {
                    // 金属のタガ
                    if (y === 7 || y === 13) {
                        row.push('#888888');
                    } else {
                        row.push('#8b6f47');
                    }
                } else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 墓石（16×24）
     */
    createGravestoneTile() {
        const pixels = [];
        for (let y = 0; y < 24; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // 墓石の上部（丸み）
                if (y >= 2 && y <= 6) {
                    const centerX = 8;
                    const dx = x - centerX;
                    const dy = (y - 2) * 1.5;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 5) {
                        row.push('#6a6a6a');
                    } else {
                        row.push('transparent');
                    }
                }
                // 墓石の本体
                else if (y >= 6 && y <= 18 && x >= 4 && x <= 12) {
                    if (x === 4 || x === 12) {
                        row.push('#5a5a5a');  // 影
                    } else {
                        row.push('#7a7a7a');
                    }
                }
                // 台座
                else if (y >= 18 && y <= 20 && x >= 3 && x <= 13) {
                    row.push('#6a6a6a');
                }
                else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 壊れたベッド（24×24）
     */
    createBrokenBedTile() {
        const pixels = [];
        for (let y = 0; y < 24; y++) {
            const row = [];
            for (let x = 0; x < 24; x++) {
                // ベッドフレーム
                if ((y >= 10 && y <= 14 && x >= 2 && x <= 22) ||
                    (y >= 6 && y <= 10 && (x >= 2 && x <= 5 || x >= 19 && x <= 22))) {
                    const rand = Math.random();
                    if (rand > 0.7) {
                        row.push('transparent');  // 壊れた部分
                    } else {
                        row.push('#8b6f47');
                    }
                }
                // 脚
                else if (y >= 14 && y <= 18 && (x === 3 || x === 21)) {
                    row.push('#7b5f37');
                }
                else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 暖炉（24×32）
     */
    createFireplaceTile() {
        const pixels = [];
        for (let y = 0; y < 32; y++) {
            const row = [];
            for (let x = 0; x < 24; x++) {
                // 煙突
                if (y >= 0 && y <= 10 && x >= 8 && x <= 16) {
                    row.push('#5a5a5a');
                }
                // 暖炉本体
                else if (y >= 10 && y <= 28 && x >= 2 && x <= 22) {
                    if (x === 2 || x === 22 || y === 10) {
                        row.push('#4a4a4a');  // 枠
                    } else if (y >= 16 && y <= 24 && x >= 8 && x <= 16) {
                        // 火の部分（黒く焦げた）
                        row.push('#2a2a2a');
                    } else {
                        row.push('#6a6a6a');
                    }
                }
                else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * ドア（16×16）
     */
    createDoorTile() {
        const pixels = [];
        
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // ドア枠
                if (x === 0 || x === 15 || y === 0) {
                    row.push('#5d4037');
                }
                // ドアの板
                else if (x >= 3 && x <= 12 && y >= 2) {
                    if (x === 3 || x === 12 || y % 4 === 0) {
                        row.push('#6b5037');
                    } else {
                        row.push('#8b6f47');
                    }
                } else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 祭壇（24×24）
     */
    createAltarTile() {
        const pixels = [];
        for (let y = 0; y < 24; y++) {
            const row = [];
            for (let x = 0; x < 24; x++) {
                // 十字架
                if ((x >= 10 && x <= 14 && y >= 2 && y <= 16) ||
                    (x >= 6 && x <= 18 && y >= 6 && y <= 10)) {
                    row.push('#8a8a8a');
                }
                // 台座
                else if (y >= 16 && y <= 22 && x >= 4 && x <= 20) {
                    row.push('#7a7a7a');
                }
                else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * ベンチ（24×16）
     */
    createBenchTile() {
        const pixels = [];
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 24; x++) {
                // 座面
                if (y >= 6 && y <= 9 && x >= 2 && x <= 22) {
                    row.push('#8b6f47');
                }
                // 脚
                else if (y >= 9 && y <= 14 && (x === 4 || x === 12 || x === 20)) {
                    row.push('#7b5f37');
                }
                else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 瓦礫（16×16）
     */
    createDebrisTile() {
        const pixels = [];
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                if (Math.random() > 0.7) {
                    row.push('#6a6a6a');
                } else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * 木の瓦礫（16×16）
     */
    createWoodDebrisTile() {
        const pixels = [];
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                if (Math.random() > 0.6) {
                    row.push('#7b5f37');
                } else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * エディターモード開始
     */
    enter() {
        console.log('[Editor] Entering editor mode');
        this.loadFromLocalStorage();
        
        // カメラをリセット
        this.game.camera.x = -this.game.canvas.width / 2;
        this.game.camera.y = -this.game.canvas.height / 2;
        this.game.camera.zoom = 1.0;
        this.game.camera.target = null;
        
        // UI オーバーレイを非表示
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.style.display = 'none';
        }
    }
    
    /**
     * エディターモード終了
     */
    exit() {
        console.log('[Editor] Exiting editor mode');
        this.game.state = 'title';
        this.game.menuIndex = 0;
        
        // UI オーバーレイを表示
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.style.display = 'block';
        }
    }
    
    /**
     * エディターの更新
     */
    update(deltaTime) {
        // カメラ移動
        if (this.mode === 'map') {
            const speed = this.cameraMoveSpeed * deltaTime;
            if (this.game.keys['w'] || this.game.keys['W']) {
                this.game.camera.y -= speed;
            }
            if (this.game.keys['s'] || this.game.keys['S']) {
                this.game.camera.y += speed;
            }
            if (this.game.keys['a'] || this.game.keys['A']) {
                this.game.camera.x -= speed;
            }
            if (this.game.keys['d'] || this.game.keys['D']) {
                this.game.camera.x += speed;
            }
        }
    }
    
    /**
     * エディターの描画
     */
    draw(ctx, canvas) {
        // 背景クリア
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // モードに応じて描画
        if (this.mode === 'map') {
            if (this.subMode === 'placement') {
                this.drawMapPlacement(ctx, canvas);
            } else if (this.subMode === 'texture') {
                this.drawTextureEditor(ctx, canvas);
            }
        } else if (this.mode === 'weapon') {
            if (this.subMode === 'params') {
                this.drawWeaponParams(ctx, canvas);
            } else if (this.subMode === 'icon') {
                this.drawIconEditor(ctx, canvas);
            }
        } else if (this.mode === 'character') {
            if (this.subMode === 'stats') {
                this.drawCharacterStats(ctx, canvas);
            } else if (this.subMode === 'sprite') {
                this.drawSpriteEditor(ctx, canvas);
            }
        }
        
        // トップメニュー
        this.drawTopMenu(ctx, canvas);
        
        // サブモード切り替えボタン
        this.drawSubModeButtons(ctx, canvas);
    }
    
    /**
     * サブモード切り替えボタン
     */
    drawSubModeButtons(ctx, canvas) {
        const buttonY = 70;
        const buttonWidth = 150;
        const buttonHeight = 35;
        const buttonX = 200;
        
        let buttons = [];
        if (this.mode === 'map') {
            buttons = [
                { name: '配置モード', subMode: 'placement' },
                { name: 'テクスチャ編集', subMode: 'texture' }
            ];
        } else if (this.mode === 'weapon') {
            buttons = [
                { name: 'パラメーター', subMode: 'params' },
                { name: 'アイコン編集', subMode: 'icon' }
            ];
        } else if (this.mode === 'character') {
            buttons = [
                { name: 'ステータス', subMode: 'stats' },
                { name: 'スプライト編集', subMode: 'sprite' }
            ];
        }
        
        buttons.forEach((btn, index) => {
            const x = buttonX + index * (buttonWidth + 10);
            const isActive = btn.subMode === this.subMode;
            
            ctx.fillStyle = isActive ? 'rgba(106, 90, 205, 0.8)' : 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, buttonY, buttonWidth, buttonHeight);
            
            ctx.strokeStyle = isActive ? '#ffff00' : '#666666';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, buttonY, buttonWidth, buttonHeight);
            
            ctx.fillStyle = isActive ? '#ffffff' : '#aaaaaa';
            ctx.font = isActive ? 'bold 14px Arial' : '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(btn.name, x + buttonWidth / 2, buttonY + 22);
        });
    }
    
    /**
     * マップ配置モードの描画
     */
    drawMapPlacement(ctx, canvas) {
        ctx.save();
        
        // グリッド描画
        if (this.showGrid) {
            this.drawGrid(ctx, canvas);
        }
        
        // レイヤーシステムを使用して描画
        this.layerSystem.render(ctx, this.game.camera, this.textures);
        
        ctx.restore();
        
        // レイヤータブ（上部）
        const tabStartX = 20;
        const tabY = 110;
        const tabWidth = 120;
        const tabHeight = 35;
        const layers = [
            { name: '地面', key: 'ground' },
            { name: '道', key: 'path' },
            { name: 'オブジェクト', key: 'objects' }
        ];
        
        layers.forEach((layer, index) => {
            const x = tabStartX + index * (tabWidth + 5);
            const isActive = layer.key === this.currentLayer;
            
            ctx.fillStyle = isActive ? 'rgba(106, 90, 205, 0.8)' : 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, tabY, tabWidth, tabHeight);
            
            ctx.strokeStyle = isActive ? '#ffff00' : '#666666';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, tabY, tabWidth, tabHeight);
            
            ctx.fillStyle = isActive ? '#ffffff' : '#aaaaaa';
            ctx.font = isActive ? 'bold 16px Arial' : '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(layer.name, x + tabWidth / 2, tabY + 23);
        });
        
        // パレット（左側）
        const paletteX = 20;
        const paletteY = 160;
        const paletteWidth = 280;
        const itemHeight = 70;
        
        // パレット内容はレイヤーによって変わる
        if (this.currentLayer === 'ground' || this.currentLayer === 'path') {
            // タイルパレット
            const tileTypes = this.currentLayer === 'ground' ? this.groundTileTypes : this.pathTileTypes;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(paletteX, paletteY, paletteWidth, tileTypes.length * itemHeight);
            
            tileTypes.forEach((tileType, index) => {
                const y = paletteY + index * itemHeight;
                const isSelected = index === this.selectedTileType;
                
                if (isSelected) {
                    ctx.fillStyle = 'rgba(106, 90, 205, 0.8)';
                    ctx.fillRect(paletteX, y, paletteWidth, itemHeight);
                }
                
                // タイルのプレビュー表示
                const texture = this.textures[tileType.type];
                if (texture) {
                    this.renderPixelTexture(ctx, texture, paletteX + 35, y + 35, 2.5);
                }
                
                // 名前
                ctx.font = '18px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'left';
                ctx.fillText(tileType.name, paletteX + 75, y + 40);
            });
        } else {
            // オブジェクトパレット
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(paletteX, paletteY, paletteWidth, this.objectTypes.length * itemHeight);
            
            this.objectTypes.forEach((objType, index) => {
                const y = paletteY + index * itemHeight;
                const isSelected = index === this.selectedObjectType;
                
                if (isSelected) {
                    ctx.fillStyle = 'rgba(106, 90, 205, 0.8)';
                    ctx.fillRect(paletteX, y, paletteWidth, itemHeight);
                }
                
                // ★実際のピクセルアート画像をプレビュー表示
                const texture = this.textures[objType.type];
                if (texture) {
                    this.renderPixelTexture(ctx, texture, paletteX + 35, y + 35, 2);
                } else {
                    // フォールバック: アイコン
                    ctx.font = '32px Arial';
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'left';
                    ctx.fillText(objType.icon, paletteX + 10, y + 40);
                }
                
                // 名前
                ctx.font = '18px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'left';
                ctx.fillText(objType.name, paletteX + 75, y + 25);
                
                // 📝編集ボタン
                const editBtnX = paletteX + 75;
                const editBtnY = y + 35;
                const editBtnWidth = 60;
                const editBtnHeight = 25;
                
                ctx.fillStyle = 'rgba(100, 100, 255, 0.5)';
                ctx.fillRect(editBtnX, editBtnY, editBtnWidth, editBtnHeight);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(editBtnX, editBtnY, editBtnWidth, editBtnHeight);
                
                ctx.font = '14px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText('📝編集', editBtnX + editBtnWidth / 2, editBtnY + 17);
                
                // 当たり判定チェックボックス
                const checkboxX = paletteX + 150;
                const checkboxY = y + 35;
                const checkboxSize = 20;
                
                ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
                ctx.fillRect(checkboxX, checkboxY, checkboxSize, checkboxSize);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(checkboxX, checkboxY, checkboxSize, checkboxSize);
                
                if (objType.hasCollision) {
                    ctx.font = 'bold 18px Arial';
                    ctx.fillStyle = '#00ff00';
                    ctx.textAlign = 'center';
                    ctx.fillText('✓', checkboxX + checkboxSize / 2, checkboxY + 16);
                }
                
                ctx.font = '12px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'left';
                ctx.fillText('当判定', checkboxX + 25, checkboxY + 15);
            });
        }
        
        // 操作説明
        const helpX = 20;
        const helpY = canvas.height - 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(helpX, helpY, 350, 80);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('W/A/S/D: カメラ移動 | G: グリッド切替', helpX + 10, helpY + 20);
        
        if (this.currentLayer === 'objects') {
            ctx.fillText('↑↓: オブジェクト選択', helpX + 10, helpY + 40);
            ctx.fillText('クリック: 配置 / 右クリック: 削除', helpX + 10, helpY + 60);
        } else {
            ctx.fillText('↑↓: タイル選択', helpX + 10, helpY + 40);
            ctx.fillText('クリック: 配置 / 右クリック: 削除', helpX + 10, helpY + 60);
        }
    }
    
    /**
     * 武器パラメーター調整の描画
     */
    drawWeaponParams(ctx, canvas) {
        const leftPanelWidth = 200;
        const leftPanelX = 20;
        const leftPanelY = 120;  // ★サブモードボタンのため下げた
        
        // 左パネル: 武器リスト
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(leftPanelX, leftPanelY, leftPanelWidth, this.weaponList.length * 80);
        
        this.weaponList.forEach((weaponId, index) => {
            const y = leftPanelY + index * 80;
            const isSelected = index === this.selectedWeaponIndex;
            
            if (isSelected) {
                ctx.fillStyle = 'rgba(106, 90, 205, 0.8)';
                ctx.fillRect(leftPanelX, y, leftPanelWidth, 80);
            }
            
            // アイコン
            ctx.font = '40px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(this.weaponIcons[weaponId], leftPanelX + 50, y + 50);
            
            // 名前
            ctx.font = '16px Arial';
            ctx.fillText(this.weaponNames[weaponId], leftPanelX + 130, y + 40);
        });
        
        // 右パネル: パラメーター調整
        const rightPanelX = 250;
        const rightPanelY = 80;
        const rightPanelWidth = canvas.width - rightPanelX - 20;
        const rightPanelHeight = 400;
        
        const selectedWeaponId = this.weaponList[this.selectedWeaponIndex];
        const params = this.weaponParams[selectedWeaponId];
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(rightPanelX, rightPanelY, rightPanelWidth, rightPanelHeight);
        
        // タイトル
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${this.weaponNames[selectedWeaponId]} の設定`, rightPanelX + 20, rightPanelY + 40);
        
        // パラメーター表示
        const paramNames = ['攻撃力', 'クールダウン', '射程'];
        const paramKeys = ['damage', 'cooldown', 'range'];
        const paramMaxValues = [100, 5.0, 800];
        
        paramKeys.forEach((key, index) => {
            const y = rightPanelY + 100 + index * 80;
            const isSelected = index === this.selectedParamIndex;
            const value = params[key];
            const maxValue = paramMaxValues[index];
            
            // パラメーター名
            ctx.fillStyle = isSelected ? '#ffff00' : '#ffffff';
            ctx.font = isSelected ? 'bold 20px Arial' : '18px Arial';
            ctx.fillText(`${paramNames[index]}:`, rightPanelX + 20, y);
            
            // 値
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            const valueText = key === 'cooldown' ? value.toFixed(1) : Math.round(value);
            ctx.fillText(valueText, rightPanelX + 200, y);
            
            // プログレスバー
            const barX = rightPanelX + 300;
            const barY = y - 20;
            const barWidth = 300;
            const barHeight = 25;
            const fillWidth = (value / maxValue) * barWidth;
            
            // バー背景
            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // バー前景
            ctx.fillStyle = isSelected ? '#ffaa00' : '#6a5acd';
            ctx.fillRect(barX, barY, fillWidth, barHeight);
            
            // バー枠線
            ctx.strokeStyle = isSelected ? '#ffff00' : '#888888';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        });
        
        // 操作説明
        const helpX = rightPanelX;
        const helpY = canvas.height - 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(helpX, helpY, 500, 80);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Shift+↑↓: 武器選択', helpX + 10, helpY + 20);
        ctx.fillText('↑↓: パラメーター選択', helpX + 10, helpY + 40);
        ctx.fillText('[/]: 値を変更', helpX + 10, helpY + 60);
    }
    
    /**
     * テクスチャエディターの描画（マップオブジェクト）
     */
    drawTextureEditor(ctx, canvas) {
        const leftPanelWidth = 200;
        const leftPanelX = 20;
        const leftPanelY = 120;
        
        // 左パネル: テクスチャリスト
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(leftPanelX, leftPanelY, leftPanelWidth, this.objectTypes.length * 60);
        
        this.objectTypes.forEach((objType, index) => {
            const y = leftPanelY + index * 60;
            const isSelected = index === this.selectedObjectType;
            
            if (isSelected) {
                ctx.fillStyle = 'rgba(106, 90, 205, 0.8)';
                ctx.fillRect(leftPanelX, y, leftPanelWidth, 60);
            }
            
            ctx.font = '32px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(objType.icon, leftPanelX + 10, y + 40);
            
            ctx.font = '16px Arial';
            ctx.fillText(objType.name, leftPanelX + 55, y + 35);
        });
        
        // ピクセルエディター領域
        this.drawPixelEditor(ctx, canvas, 250, 120);
    }
    
    /**
     * アイコンエディターの描画（武器）
     */
    drawIconEditor(ctx, canvas) {
        const leftPanelWidth = 200;
        const leftPanelX = 20;
        const leftPanelY = 120;
        
        // 左パネル: 武器リスト
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(leftPanelX, leftPanelY, leftPanelWidth, this.weaponList.length * 80);
        
        this.weaponList.forEach((weaponId, index) => {
            const y = leftPanelY + index * 80;
            const isSelected = index === this.selectedWeaponIndex;
            
            if (isSelected) {
                ctx.fillStyle = 'rgba(106, 90, 205, 0.8)';
                ctx.fillRect(leftPanelX, y, leftPanelWidth, 80);
            }
            
            ctx.font = '40px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(this.weaponIcons[weaponId], leftPanelX + 50, y + 50);
            
            ctx.font = '16px Arial';
            ctx.fillText(this.weaponNames[weaponId], leftPanelX + 130, y + 40);
        });
        
        // ピクセルエディター領域
        this.drawPixelEditor(ctx, canvas, 250, 120);
    }
    
    /**
     * キャラクターステータスの描画
     */
    drawCharacterStats(ctx, canvas) {
        const leftPanelWidth = 200;
        const leftPanelX = 20;
        const leftPanelY = 120;
        
        // 左パネル: キャラクターリスト
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(leftPanelX, leftPanelY, leftPanelWidth, this.characterList.length * 80);
        
        this.characterList.forEach((charId, index) => {
            const y = leftPanelY + index * 80;
            const isSelected = index === this.selectedCharacterIndex;
            
            if (isSelected) {
                ctx.fillStyle = 'rgba(106, 90, 205, 0.8)';
                ctx.fillRect(leftPanelX, y, leftPanelWidth, 80);
            }
            
            ctx.font = '32px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(charId === 'player' ? '👤' : '🧟', leftPanelX + 50, y + 50);
            
            ctx.font = '16px Arial';
            ctx.fillText(this.characterNames[charId], leftPanelX + 130, y + 40);
        });
        
        // 右パネル: パラメーター調整
        const rightPanelX = 250;
        const rightPanelY = 120;
        const rightPanelWidth = canvas.width - rightPanelX - 20;
        const rightPanelHeight = 400;
        
        const selectedCharId = this.characterList[this.selectedCharacterIndex];
        const params = this.characterParams[selectedCharId];
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(rightPanelX, rightPanelY, rightPanelWidth, rightPanelHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${this.characterNames[selectedCharId]} の設定`, rightPanelX + 20, rightPanelY + 40);
        
        // パラメーター表示
        const paramNames = selectedCharId === 'player' ? 
            ['最大HP', '移動速度', 'HP回復'] : 
            ['最大HP', '移動速度', '攻撃力'];
        const paramKeys = selectedCharId === 'player' ? 
            ['maxHealth', 'speed', 'regen'] : 
            ['maxHealth', 'speed', 'damage'];
        const paramMaxValues = [200, 400, 20];
        
        paramKeys.forEach((key, index) => {
            const y = rightPanelY + 100 + index * 80;
            const isSelected = index === this.selectedCharParamIndex;
            const value = params[key];
            const maxValue = paramMaxValues[index];
            
            ctx.fillStyle = isSelected ? '#ffff00' : '#ffffff';
            ctx.font = isSelected ? 'bold 20px Arial' : '18px Arial';
            ctx.fillText(`${paramNames[index]}:`, rightPanelX + 20, y);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            const valueText = key === 'regen' ? value.toFixed(1) : Math.round(value);
            ctx.fillText(valueText, rightPanelX + 200, y);
            
            const barX = rightPanelX + 300;
            const barY = y - 20;
            const barWidth = 300;
            const barHeight = 25;
            const fillWidth = (value / maxValue) * barWidth;
            
            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = isSelected ? '#ffaa00' : '#6a5acd';
            ctx.fillRect(barX, barY, fillWidth, barHeight);
            
            ctx.strokeStyle = isSelected ? '#ffff00' : '#888888';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        });
        
        // 操作説明
        const helpX = rightPanelX;
        const helpY = canvas.height - 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(helpX, helpY, 500, 80);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Shift+↑↓: キャラ選択', helpX + 10, helpY + 20);
        ctx.fillText('↑↓: パラメーター選択', helpX + 10, helpY + 40);
        ctx.fillText('[/]: 値を変更', helpX + 10, helpY + 60);
    }
    
    /**
     * スプライトエディターの描画（キャラクター）
     */
    drawSpriteEditor(ctx, canvas) {
        const topMenuHeight = 60;
        const sidebarWidth = 250;
        
        // 背景
        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(0, topMenuHeight, canvas.width, canvas.height - topMenuHeight);
        
        // 左サイドバー（キャラクター選択）
        this.drawCharacterSidebar(ctx, topMenuHeight, sidebarWidth, canvas.height);
        
        // 中央: ピクセルエディター
        const editorX = sidebarWidth + 50;
        const editorY = topMenuHeight + 80;
        this.drawPixelEditor(ctx, canvas, editorX, editorY, 192, 128);  // スプライトシート全体 (6列×4行)
        
        // ★右側: プレビューエリア
        const previewX = editorX + 700;
        const previewY = topMenuHeight + 80;
        this.drawCharacterPreview(ctx, previewX, previewY);
    }
    
    /**
     * キャラクター選択サイドバー
     */
    drawCharacterSidebar(ctx, topY, width, canvasHeight) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, topY, width, canvasHeight - topY);
        
        // タイトル
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('キャラクター', 20, topY + 40);
        
        // キャラクターリスト
        const startY = topY + 80;
        this.characterTypes.forEach((charType, index) => {
            const y = startY + index * 80;
            const isSelected = index === this.characterPaletteIndex;
            
            // 背景
            ctx.fillStyle = isSelected ? '#4a4a6a' : '#3a3a5a';
            ctx.fillRect(10, y, width - 20, 70);
            
            // 枠線
            ctx.strokeStyle = isSelected ? '#ffff00' : '#666666';
            ctx.lineWidth = isSelected ? 3 : 1;
            ctx.strokeRect(10, y, width - 20, 70);
            
            // キャラクター名
            const charNames = {
                warrior: '戦士',
                mage: '魔法使い',
                hunter: '狩人'
            };
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(charNames[charType], 30, y + 30);
            
            // 簡易アイコン
            const color = CHARACTERS[charType].color;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(30, y + 50, 10, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    /**
     * ★キャラクタープレビューエリア
     */
    drawCharacterPreview(ctx, x, y) {
        // 背景パネル
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(x, y, 320, 480);
        
        // 枠線
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, 320, 480);
        
        // タイトル
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('プレビュー', x + 160, y + 35);
        
        // ★アニメーション切り替えボタン
        const animations = [
            { name: 'idle', label: '待機', row: 0, frames: 4 },
            { name: 'walk', label: '歩行', row: 1, frames: 6 },
            { name: 'death', label: '死亡', row: 3, frames: 6 }
        ];
        
        animations.forEach((anim, index) => {
            const buttonX = x + 15 + index * 95;
            const buttonY = y + 55;
            const isSelected = this.previewAnimation === anim.name;
            
            // ボタン背景
            ctx.fillStyle = isSelected ? '#6a5acd' : '#444444';
            ctx.fillRect(buttonX, buttonY, 90, 40);
            
            // ボタン枠
            ctx.strokeStyle = isSelected ? '#ffff00' : '#666666';
            ctx.lineWidth = 2;
            ctx.strokeRect(buttonX, buttonY, 90, 40);
            
            // ボタンテキスト
            ctx.fillStyle = isSelected ? '#ffffff' : '#aaaaaa';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(anim.label, buttonX + 45, buttonY + 26);
        });
        
        // ★キャラクターアニメーション表示エリア
        const displayX = x + 160;
        const displayY = y + 280;
        const scale = 4;  // 4倍拡大
        
        // チェッカーボード背景
        const bgSize = 64 * scale;
        for (let py = -bgSize / 2; py < bgSize / 2; py += 8 * scale) {
            for (let px = -bgSize / 2; px < bgSize / 2; px += 8 * scale) {
                const isEven = (Math.floor(px / (8 * scale)) + Math.floor(py / (8 * scale))) % 2 === 0;
                ctx.fillStyle = isEven ? '#888888' : '#666666';
                ctx.fillRect(displayX + px, displayY + py, 8 * scale, 8 * scale);
            }
        }
        
        // 枠線
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(displayX - bgSize / 2, displayY - bgSize / 2, bgSize, bgSize);
        
        // ★編集中のキャラクターをアニメーション表示
        this.renderAnimatedCharacter(ctx, displayX, displayY, scale);
        
        // 説明テキスト
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('編集中のキャラクターが', x + 160, y + 420);
        ctx.fillText('実際に動いている様子', x + 160, y + 445);
    }
    
    /**
     * ★アニメーションを描画
     */
    renderAnimatedCharacter(ctx, x, y, scale) {
        // フレーム更新（60FPS想定）
        const deltaTime = 1 / 60;
        this.previewFrameTime += deltaTime;
        
        const animConfigs = {
            idle: { row: 0, frames: 4, fps: 8 },
            walk: { row: 1, frames: 6, fps: 12 },
            death: { row: 3, frames: 6, fps: 10 }
        };
        
        const currentAnim = animConfigs[this.previewAnimation];
        const frameDuration = 1 / currentAnim.fps;
        
        if (this.previewFrameTime >= frameDuration) {
            this.previewFrameTime = 0;
            
            if (this.previewAnimation === 'death') {
                // 死亡アニメーションは最後のフレームで止まる
                if (this.previewFrame < currentAnim.frames - 1) {
                    this.previewFrame++;
                }
            } else if (this.previewAnimation === 'walk') {
                // 歩行アニメーション
                this.previewFrame = (this.previewFrame + 1) % currentAnim.frames;
                // 左右に揺れる
                if (this.previewFrame === 0) {
                    this.previewFacingRight = !this.previewFacingRight;
                }
            } else {
                // 待機アニメーション
                this.previewFrame = (this.previewFrame + 1) % currentAnim.frames;
            }
        }
        
        // スプライトシートから該当フレームを取得して描画
        const selectedCharacter = this.characterTypes[this.characterPaletteIndex];
        const pixels = this.getCharacterFramePixels(selectedCharacter, currentAnim.row, this.previewFrame);
        
        if (pixels) {
            ctx.save();
            
            // 左右反転
            if (!this.previewFacingRight && this.previewAnimation === 'walk') {
                ctx.translate(x, y);
                ctx.scale(-1, 1);
                ctx.translate(-x, -y);
            }
            
            // ピクセルアートを描画
            for (let py = 0; py < 32; py++) {
                for (let px = 0; px < 32; px++) {
                    const color = pixels[py][px];
                    if (color && color !== 'transparent') {
                        ctx.fillStyle = color;
                        ctx.fillRect(
                            x + (px - 16) * scale,
                            y + (py - 16) * scale,
                            scale,
                            scale
                        );
                    }
                }
            }
            
            ctx.restore();
        } else {
            // フォールバック（円）
            ctx.fillStyle = CHARACTERS[selectedCharacter].color;
            ctx.beginPath();
            ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
    
    /**
     * ★スプライトシートから指定フレームを取得
     */
    getCharacterFramePixels(characterType, row, frame) {
        const spriteSheetKey = `character_${characterType}`;
        const spriteSheet = this.textures[spriteSheetKey];
        
        if (!spriteSheet) {
            console.log('No sprite sheet for', spriteSheetKey);
            return null;
        }
        
        const frameWidth = 32;
        const frameHeight = 32;
        const startY = row * frameHeight;
        const startX = frame * frameWidth;
        
        const framePixels = [];
        for (let y = 0; y < frameHeight; y++) {
            const rowPixels = [];
            for (let x = 0; x < frameWidth; x++) {
                const pixelY = startY + y;
                const pixelX = startX + x;
                
                if (spriteSheet[pixelY] && spriteSheet[pixelY][pixelX]) {
                    rowPixels.push(spriteSheet[pixelY][pixelX]);
                } else {
                    rowPixels.push('transparent');
                }
            }
            framePixels.push(rowPixels);
        }
        
        return framePixels;
    }
    
    /**
     * ピクセルエディターの描画（統合版）
     */
    drawPixelEditor(ctx, canvas, startX, startY, forceWidth = null, forceHeight = null) {
        // 編集中のテクスチャを取得
        let textureKey = null;
        let pixels = null;
        let width = forceWidth || 16;
        let height = forceHeight || 16;
        let pixelSize = 20;
        
        if (this.mode === 'map') {
            const objType = this.objectTypes[this.selectedObjectType];
            textureKey = objType.type;
            pixels = this.textures[textureKey];
        } else if (this.mode === 'weapon') {
            const weaponId = this.weaponList[this.selectedWeaponIndex];
            textureKey = weaponId + '_icon';
            pixels = this.textures[textureKey];
        } else if (this.mode === 'character') {
            // Use character types for sprite sheet
            const charType = this.characterTypes[this.characterPaletteIndex];
            textureKey = `character_${charType}`;
            pixels = this.textures[textureKey];
            // Character sprite sheets are 192x128
            if (!forceWidth) width = 192;
            if (!forceHeight) height = 128;
            pixelSize = 3;  // Smaller pixel size for sprite sheet
        }
        
        if (!pixels) return;
        
        // Use actual dimensions if not forced
        if (!forceWidth || !forceHeight) {
            height = pixels.length;
            width = pixels[0] ? pixels[0].length : width;
        }
        
        // グリッド背景
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(startX, startY, width * pixelSize, height * pixelSize);
        
        // ピクセル描画
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const color = pixels[y] ? pixels[y][x] : 'transparent';
                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        startX + x * pixelSize,
                        startY + y * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
        
        // グリッド線(only for non-character or smaller grids)
        if (this.mode !== 'character' || pixelSize >= 10) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= width; i++) {
                ctx.beginPath();
                ctx.moveTo(startX + i * pixelSize, startY);
                ctx.lineTo(startX + i * pixelSize, startY + height * pixelSize);
                ctx.stroke();
            }
            for (let i = 0; i <= height; i++) {
                ctx.beginPath();
                ctx.moveTo(startX, startY + i * pixelSize);
                ctx.lineTo(startX + width * pixelSize, startY + i * pixelSize);
                ctx.stroke();
            }
        }
        
        // 枠線
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(startX, startY, width * pixelSize, height * pixelSize);
        
        // プレビュー
        const previewX = startX + width * pixelSize + 50;
        const previewY = startY + 50;
        const scale = 4;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('プレビュー', previewX, previewY - 20);
        
        // チェッカーボード背景
        const previewWidth = width * scale;
        const previewHeight = height * scale;
        
        for (let y = 0; y < previewHeight; y += 8) {
            for (let x = 0; x < previewWidth; x += 8) {
                ctx.fillStyle = ((x / 8 + y / 8) % 2 === 0) ? '#cccccc' : '#999999';
                ctx.fillRect(previewX + x, previewY + y, 8, 8);
            }
        }
        
        // プレビューピクセル描画
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const color = pixels[y][x];
                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.fillRect(previewX + x * scale, previewY + y * scale, scale, scale);
                }
            }
        }
        
        // プレビュー枠線
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(previewX, previewY, previewWidth, previewHeight);
        
        // 操作説明
        const helpX = startX;
        const helpY = canvas.height - 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(helpX, helpY, 600, 80);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('※テクスチャ編集機能は次の更新で実装予定', helpX + 10, helpY + 20);
        ctx.fillText('現在はプレビューのみ表示されます', helpX + 10, helpY + 40);
        ctx.fillText('↑↓: オブジェクト/武器/キャラクター選択', helpX + 10, helpY + 60);
    }
    
    /**
     * トップメニューの描画
     */
    drawTopMenu(ctx, canvas) {
        const menuHeight = 60;
        const menuItemWidth = 100;
        const menuStartX = (canvas.width - menuItemWidth * this.menuItems.length) / 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, menuHeight);
        
        this.menuItems.forEach((item, index) => {
            const x = menuStartX + index * menuItemWidth;
            const isSelected = index === this.selectedMenuIndex;
            const isCurrentMode = (item.name === 'マップ' && this.mode === 'map') || 
                                 (item.name === '武器' && this.mode === 'weapon') ||
                                 (item.name === 'キャラクター' && this.mode === 'character');
            
            // 背景
            if (isSelected) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                ctx.fillRect(x, 10, menuItemWidth - 10, 40);
            } else if (isCurrentMode) {
                ctx.fillStyle = 'rgba(106, 90, 205, 0.5)';
                ctx.fillRect(x, 10, menuItemWidth - 10, 40);
            }
            
            // テキスト
            ctx.fillStyle = isSelected ? '#ffff00' : (isCurrentMode ? '#ffffff' : '#aaaaaa');
            ctx.font = isSelected ? 'bold 18px Arial' : '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.name, x + menuItemWidth / 2 - 5, 35);
        });
        
        // 操作説明（右上）
        ctx.fillStyle = '#888888';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('←→: メニュー選択  Enter: 実行  ESC: タイトルに戻る', canvas.width - 20, 35);
    }
    
    /**
     * グリッドの描画
     */
    drawGrid(ctx, canvas) {
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1;
        
        const camera = this.game.camera;
        const viewBounds = camera.getViewBounds();
        
        // 縦線
        const startX = Math.floor(viewBounds.left / this.gridSize) * this.gridSize;
        const endX = Math.ceil(viewBounds.right / this.gridSize) * this.gridSize;
        for (let x = startX; x <= endX; x += this.gridSize) {
            const screenPos = camera.worldToScreen(x, 0);
            ctx.beginPath();
            ctx.moveTo(screenPos.x, 0);
            ctx.lineTo(screenPos.x, canvas.height);
            ctx.stroke();
        }
        
        // 横線
        const startY = Math.floor(viewBounds.top / this.gridSize) * this.gridSize;
        const endY = Math.ceil(viewBounds.bottom / this.gridSize) * this.gridSize;
        for (let y = startY; y <= endY; y += this.gridSize) {
            const screenPos = camera.worldToScreen(0, y);
            ctx.beginPath();
            ctx.moveTo(0, screenPos.y);
            ctx.lineTo(canvas.width, screenPos.y);
            ctx.stroke();
        }
        
        // 原点を強調
        const originScreen = camera.worldToScreen(0, 0);
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(originScreen.x, 0);
        ctx.lineTo(originScreen.x, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, originScreen.y);
        ctx.lineTo(canvas.width, originScreen.y);
        ctx.stroke();
    }
    
    /**
     * マウスクリックの処理
     */
    handleClick(screenX, screenY, button) {
        console.log('Editor click at:', screenX, screenY, 'Mode:', this.mode);
        
        // サブモードボタンのクリック
        const buttonY = 70;
        const buttonWidth = 150;
        const buttonHeight = 35;
        const buttonX = 200;
        
        if (screenY >= buttonY && screenY <= buttonY + buttonHeight) {
            if (this.mode === 'map') {
                if (screenX >= buttonX && screenX < buttonX + buttonWidth) {
                    this.subMode = 'placement';
                    return;
                } else if (screenX >= buttonX + buttonWidth + 10 && screenX < buttonX + 2 * buttonWidth + 10) {
                    this.subMode = 'texture';
                    return;
                }
            } else if (this.mode === 'weapon') {
                if (screenX >= buttonX && screenX < buttonX + buttonWidth) {
                    this.subMode = 'params';
                    return;
                } else if (screenX >= buttonX + buttonWidth + 10 && screenX < buttonX + 2 * buttonWidth + 10) {
                    this.subMode = 'icon';
                    return;
                }
            } else if (this.mode === 'character') {
                if (screenX >= buttonX && screenX < buttonX + buttonWidth) {
                    this.subMode = 'stats';
                    return;
                } else if (screenX >= buttonX + buttonWidth + 10 && screenX < buttonX + 2 * buttonWidth + 10) {
                    this.subMode = 'sprite';
                    return;
                }
            }
        }
        
        // ★キャラクターエディターのクリック処理
        if (this.mode === 'character' && this.subMode === 'sprite') {
            const topMenuHeight = 60;
            
            // プレビューエリアのアニメーションボタンクリック判定
            const previewX = 950;  // プレビューエリアのX座標
            const previewY = topMenuHeight + 80;
            
            const animations = ['idle', 'walk', 'death'];
            animations.forEach((anim, index) => {
                const buttonX = previewX + 15 + index * 95;
                const buttonY = previewY + 55;
                
                if (screenX >= buttonX && screenX < buttonX + 90 &&
                    screenY >= buttonY && screenY < buttonY + 40) {
                    this.previewAnimation = anim;
                    this.previewFrame = 0;
                    this.previewFrameTime = 0;
                    this.previewFacingRight = true;
                    console.log('Preview animation changed to:', anim);
                    return;
                }
            });
            
            // 左サイドバーのキャラクター選択クリック判定
            const sidebarWidth = 250;
            const startY = topMenuHeight + 80;
            
            this.characterTypes.forEach((charType, index) => {
                const itemY = startY + index * 80;
                
                if (screenX >= 10 && screenX < sidebarWidth - 10 &&
                    screenY >= itemY && screenY < itemY + 70) {
                    this.characterPaletteIndex = index;
                    this.previewFrame = 0;
                    this.previewFrameTime = 0;
                    console.log('Character changed to:', charType);
                    return;
                }
            });
        }
        
        // マップ配置モードのクリック処理
        if (this.mode === 'map' && this.subMode === 'placement') {
            // レイヤータブのクリック
            const tabStartX = 20;
            const tabY = 110;
            const tabWidth = 120;
            const tabHeight = 35;
            const layers = ['ground', 'path', 'objects'];
            
            if (screenY >= tabY && screenY <= tabY + tabHeight) {
                const tabIndex = Math.floor((screenX - tabStartX) / (tabWidth + 5));
                if (tabIndex >= 0 && tabIndex < layers.length) {
                    const clickX = tabStartX + tabIndex * (tabWidth + 5);
                    if (screenX >= clickX && screenX < clickX + tabWidth) {
                        this.currentLayer = layers[tabIndex];
                        console.log(`[Editor] Switched to layer: ${this.currentLayer}`);
                        return;
                    }
                }
            }
            
            // パレットのクリック処理
            const paletteX = 20;
            const paletteY = 160;
            const paletteWidth = 280;
            const itemHeight = 70;
            
            if (this.currentLayer === 'objects') {
                // オブジェクトパレットのクリック
                if (screenX >= paletteX && screenX <= paletteX + paletteWidth &&
                    screenY >= paletteY && screenY <= paletteY + this.objectTypes.length * itemHeight) {
                    
                    const index = Math.floor((screenY - paletteY) / itemHeight);
                    if (index >= 0 && index < this.objectTypes.length) {
                        const y = paletteY + index * itemHeight;
                        
                        // 📝編集ボタンのクリック
                        const editBtnX = paletteX + 75;
                        const editBtnY = y + 35;
                        const editBtnWidth = 60;
                        const editBtnHeight = 25;
                        
                        if (screenX >= editBtnX && screenX <= editBtnX + editBtnWidth &&
                            screenY >= editBtnY && screenY <= editBtnY + editBtnHeight) {
                            console.log(`[Editor] Edit button clicked for ${this.objectTypes[index].name}`);
                            this.selectedObjectType = index;
                            this.subMode = 'texture';
                            return;
                        }
                        
                        // 当たり判定チェックボックスのクリック
                        const checkboxX = paletteX + 150;
                        const checkboxY = y + 35;
                        const checkboxSize = 20;
                        
                        if (screenX >= checkboxX && screenX <= checkboxX + checkboxSize &&
                            screenY >= checkboxY && screenY <= checkboxY + checkboxSize) {
                            this.objectTypes[index].hasCollision = !this.objectTypes[index].hasCollision;
                            console.log(`[Editor] Toggled collision for ${this.objectTypes[index].name}: ${this.objectTypes[index].hasCollision}`);
                            return;
                        }
                        
                        // パレット項目選択
                        this.selectedObjectType = index;
                        return;
                    }
                }
            } else {
                // タイルパレットのクリック
                const tileTypes = this.currentLayer === 'ground' ? this.groundTileTypes : this.pathTileTypes;
                
                if (screenX >= paletteX && screenX <= paletteX + paletteWidth &&
                    screenY >= paletteY && screenY <= paletteY + tileTypes.length * itemHeight) {
                    
                    const index = Math.floor((screenY - paletteY) / itemHeight);
                    if (index >= 0 && index < tileTypes.length) {
                        this.selectedTileType = index;
                        console.log(`[Editor] Selected tile: ${tileTypes[index].name}`);
                        return;
                    }
                }
            }
            
            // マップ上のクリック処理
            const worldPos = this.game.camera.screenToWorld(screenX, screenY);
            
            if (this.currentLayer === 'objects') {
                // オブジェクトレイヤー
                if (button === 0) {
                    // 左クリック: オブジェクト配置
                    const objType = this.objectTypes[this.selectedObjectType];
                    
                    // グリッドスナップ
                    const snappedX = Math.round(worldPos.x / this.gridSize) * this.gridSize;
                    const snappedY = Math.round(worldPos.y / this.gridSize) * this.gridSize;
                    
                    // レイヤーシステムに配置
                    this.layerSystem.placeObject({
                        x: snappedX,
                        y: snappedY,
                        type: objType.type,
                        size: objType.size,
                        color: objType.color,
                        hasCollision: objType.hasCollision
                    });
                    console.log(`[Editor] Placed ${objType.type} at (${snappedX}, ${snappedY})`);
                } else if (button === 2) {
                    // 右クリック: オブジェクト削除
                    this.layerSystem.removeObject(worldPos.x, worldPos.y, 30);
                }
            } else {
                // タイルレイヤー（ground or path）
                const tileTypes = this.currentLayer === 'ground' ? this.groundTileTypes : this.pathTileTypes;
                const tileType = tileTypes[this.selectedTileType];
                
                if (button === 0) {
                    // 左クリック: タイル配置
                    const tileCoords = this.layerSystem.worldToTile(worldPos.x, worldPos.y);
                    this.layerSystem.placeTile(this.currentLayer, tileCoords.tileX, tileCoords.tileY, tileType.type);
                    console.log(`[Editor] Placed tile ${tileType.name} at (${tileCoords.tileX}, ${tileCoords.tileY})`);
                } else if (button === 2) {
                    // 右クリック: タイル削除
                    const tileCoords = this.layerSystem.worldToTile(worldPos.x, worldPos.y);
                    this.layerSystem.removeTile(this.currentLayer, tileCoords.tileX, tileCoords.tileY);
                }
            }
        }
    }
    
    /**
     * キー入力の処理
     */
    handleKeyDown(key) {
        // トップメニュー操作
        if (key === 'ArrowLeft') {
            this.selectedMenuIndex = Math.max(0, this.selectedMenuIndex - 1);
            return true;
        } else if (key === 'ArrowRight') {
            this.selectedMenuIndex = Math.min(this.menuItems.length - 1, this.selectedMenuIndex + 1);
            return true;
        } else if (key === 'Enter') {
            this.menuItems[this.selectedMenuIndex].action();
            return true;
        } else if (key === 'Escape') {
            this.exit();
            return true;
        }
        
        // マップエディター操作
        if (this.mode === 'map') {
            if (this.subMode === 'placement') {
                if (key === 'g' || key === 'G') {
                    this.showGrid = !this.showGrid;
                    return true;
                } else if (key === '+' || key === '=') {
                    this.game.camera.setZoom(this.game.camera.zoom + this.cameraZoomSpeed);
                    return true;
                } else if (key === '-' || key === '_') {
                    this.game.camera.setZoom(this.game.camera.zoom - this.cameraZoomSpeed);
                    return true;
                }
            }
            if (key === 'ArrowUp') {
                if (this.currentLayer === 'objects') {
                    this.selectedObjectType = Math.max(0, this.selectedObjectType - 1);
                } else {
                    this.selectedTileType = Math.max(0, this.selectedTileType - 1);
                }
                return true;
            } else if (key === 'ArrowDown') {
                if (this.currentLayer === 'objects') {
                    this.selectedObjectType = Math.min(this.objectTypes.length - 1, this.selectedObjectType + 1);
                } else {
                    const maxTileIndex = (this.currentLayer === 'ground' ? this.groundTileTypes.length : this.pathTileTypes.length) - 1;
                    this.selectedTileType = Math.min(maxTileIndex, this.selectedTileType + 1);
                }
                return true;
            } else if (key === 't' || key === 'T') {
                // Tキーでサブモード切り替え
                this.subMode = this.subMode === 'placement' ? 'texture' : 'placement';
                return true;
            }
        }
        
        // 武器エディター操作
        if (this.mode === 'weapon') {
            if (this.subMode === 'params') {
                const selectedWeaponId = this.weaponList[this.selectedWeaponIndex];
                const params = this.weaponParams[selectedWeaponId];
                const paramKeys = ['damage', 'cooldown', 'range'];
                const selectedParamKey = paramKeys[this.selectedParamIndex];
                
                if (key === 'ArrowUp') {
                    if (this.game.keys['Shift']) {
                        this.selectedWeaponIndex = Math.max(0, this.selectedWeaponIndex - 1);
                    } else {
                        this.selectedParamIndex = Math.max(0, this.selectedParamIndex - 1);
                    }
                    return true;
                } else if (key === 'ArrowDown') {
                    if (this.game.keys['Shift']) {
                        this.selectedWeaponIndex = Math.min(this.weaponList.length - 1, this.selectedWeaponIndex + 1);
                    } else {
                        this.selectedParamIndex = Math.min(paramKeys.length - 1, this.selectedParamIndex + 1);
                    }
                    return true;
                } else if (key === '[') {
                    if (selectedParamKey === 'damage') {
                        params[selectedParamKey] = Math.max(1, params[selectedParamKey] - 1);
                    } else if (selectedParamKey === 'cooldown') {
                        params[selectedParamKey] = Math.max(0.1, params[selectedParamKey] - 0.1);
                    } else if (selectedParamKey === 'range') {
                        params[selectedParamKey] = Math.max(50, params[selectedParamKey] - 10);
                    }
                    return true;
                } else if (key === ']') {
                    if (selectedParamKey === 'damage') {
                        params[selectedParamKey] = Math.min(100, params[selectedParamKey] + 1);
                    } else if (selectedParamKey === 'cooldown') {
                        params[selectedParamKey] = Math.min(5.0, params[selectedParamKey] + 0.1);
                    } else if (selectedParamKey === 'range') {
                        params[selectedParamKey] = Math.min(800, params[selectedParamKey] + 10);
                    }
                    return true;
                }
            }
            if (key === 'ArrowUp' && !this.game.keys['Shift']) {
                this.selectedWeaponIndex = Math.max(0, this.selectedWeaponIndex - 1);
                return true;
            } else if (key === 'ArrowDown' && !this.game.keys['Shift']) {
                this.selectedWeaponIndex = Math.min(this.weaponList.length - 1, this.selectedWeaponIndex + 1);
                return true;
            } else if (key === 't' || key === 'T') {
                this.subMode = this.subMode === 'params' ? 'icon' : 'params';
                return true;
            }
        }
        
        // キャラクターエディター操作
        if (this.mode === 'character') {
            if (this.subMode === 'stats') {
                const selectedCharId = this.characterList[this.selectedCharacterIndex];
                const params = this.characterParams[selectedCharId];
                const paramKeys = selectedCharId === 'player' ? 
                    ['maxHealth', 'speed', 'regen'] : 
                    ['maxHealth', 'speed', 'damage'];
                const selectedParamKey = paramKeys[this.selectedCharParamIndex];
                
                if (key === 'ArrowUp') {
                    if (this.game.keys['Shift']) {
                        this.selectedCharacterIndex = Math.max(0, this.selectedCharacterIndex - 1);
                    } else {
                        this.selectedCharParamIndex = Math.max(0, this.selectedCharParamIndex - 1);
                    }
                    return true;
                } else if (key === 'ArrowDown') {
                    if (this.game.keys['Shift']) {
                        this.selectedCharacterIndex = Math.min(this.characterList.length - 1, this.selectedCharacterIndex + 1);
                    } else {
                        this.selectedCharParamIndex = Math.min(paramKeys.length - 1, this.selectedCharParamIndex + 1);
                    }
                    return true;
                } else if (key === '[') {
                    if (selectedParamKey === 'maxHealth') {
                        params[selectedParamKey] = Math.max(10, params[selectedParamKey] - 5);
                    } else if (selectedParamKey === 'speed') {
                        params[selectedParamKey] = Math.max(50, params[selectedParamKey] - 10);
                    } else if (selectedParamKey === 'damage') {
                        params[selectedParamKey] = Math.max(1, params[selectedParamKey] - 1);
                    } else if (selectedParamKey === 'regen') {
                        params[selectedParamKey] = Math.max(0, params[selectedParamKey] - 0.1);
                    }
                    return true;
                } else if (key === ']') {
                    if (selectedParamKey === 'maxHealth') {
                        params[selectedParamKey] = Math.min(200, params[selectedParamKey] + 5);
                    } else if (selectedParamKey === 'speed') {
                        params[selectedParamKey] = Math.min(400, params[selectedParamKey] + 10);
                    } else if (selectedParamKey === 'damage') {
                        params[selectedParamKey] = Math.min(20, params[selectedParamKey] + 1);
                    } else if (selectedParamKey === 'regen') {
                        params[selectedParamKey] = Math.min(10, params[selectedParamKey] + 0.1);
                    }
                    return true;
                }
            }
            if (key === 'ArrowUp' && !this.game.keys['Shift']) {
                this.selectedCharacterIndex = Math.max(0, this.selectedCharacterIndex - 1);
                return true;
            } else if (key === 'ArrowDown' && !this.game.keys['Shift']) {
                this.selectedCharacterIndex = Math.min(this.characterList.length - 1, this.selectedCharacterIndex + 1);
                return true;
            } else if (key === 't' || key === 'T') {
                this.subMode = this.subMode === 'stats' ? 'sprite' : 'stats';
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * LocalStorageに保存
     */
    saveToLocalStorage() {
        try {
            // レイヤーシステムのデータを保存
            this.layerSystem.save();
            
            const data = {
                objects: this.placedObjects,  // レガシー互換性のため残す（将来削除予定）
                weapons: this.weaponParams,
                characters: this.characterParams,
                textures: this.textures
            };
            localStorage.setItem('editor_data', JSON.stringify(data));
            console.log('[Editor] Saved to LocalStorage:', data);
            console.log('[Editor] Layer system saved');
            
            alert('保存しました！');
        } catch (error) {
            console.error('[Editor] Failed to save:', error);
            alert('保存に失敗しました');
        }
    }
    
    /**
     * LocalStorageから読み込み
     */
    loadFromLocalStorage() {
        try {
            // レイヤーシステムのデータを読み込み
            this.layerSystem.load();
            
            const dataStr = localStorage.getItem('editor_data');
            if (dataStr) {
                const data = JSON.parse(dataStr);
                if (data.objects) {
                    this.placedObjects = data.objects;
                }
                if (data.weapons) {
                    // 武器パラメーターの検証とサニタイズ
                    const validatedWeapons = {};
                    for (const weaponId in data.weapons) {
                        if (this.weaponParams[weaponId]) {
                            const params = data.weapons[weaponId];
                            validatedWeapons[weaponId] = {
                                damage: Math.max(1, Math.min(100, Number(params.damage) || 15)),
                                cooldown: Math.max(0.1, Math.min(5.0, Number(params.cooldown) || 1.0)),
                                range: Math.max(50, Math.min(800, Number(params.range) || 400))
                            };
                        }
                    }
                    this.weaponParams = { ...this.weaponParams, ...validatedWeapons };
                }
                if (data.characters) {
                    // キャラクターパラメーターの検証とサニタイズ
                    const validatedChars = {};
                    for (const charId in data.characters) {
                        if (this.characterParams[charId]) {
                            const params = data.characters[charId];
                            if (charId === 'player') {
                                validatedChars[charId] = {
                                    maxHealth: Math.max(10, Math.min(200, Number(params.maxHealth) || 100)),
                                    speed: Math.max(50, Math.min(400, Number(params.speed) || 200)),
                                    regen: Math.max(0, Math.min(10, Number(params.regen) || 0))
                                };
                            } else {
                                validatedChars[charId] = {
                                    maxHealth: Math.max(10, Math.min(200, Number(params.maxHealth) || 50)),
                                    speed: Math.max(50, Math.min(400, Number(params.speed) || 60)),
                                    damage: Math.max(1, Math.min(20, Number(params.damage) || 10))
                                };
                            }
                        }
                    }
                    this.characterParams = { ...this.characterParams, ...validatedChars };
                }
                if (data.textures) {
                    // テクスチャデータを復元
                    this.textures = { ...this.textures, ...data.textures };
                }
                console.log('[Editor] Loaded from LocalStorage:', data);
            }
        } catch (error) {
            console.error('[Editor] Failed to load:', error);
        }
    }
    
    /**
     * マウス移動処理
     */
    handleMouseMove(x, y) {
        // 必要に応じて実装
    }
    
    /**
     * テクスチャを保存
     */
    saveTextures() {
        try {
            localStorage.setItem('editorTextures', JSON.stringify(this.textures));
            console.log('[Editor] Textures saved');
        } catch (error) {
            console.error('[Editor] Failed to save textures:', error);
        }
    }
    
    /**
     * テクスチャを読み込み
     */
    loadTextures() {
        try {
            const data = localStorage.getItem('editorTextures');
            if (data) {
                this.textures = JSON.parse(data);
                console.log('[Editor] Textures loaded');
            }
        } catch (error) {
            console.error('[Editor] Failed to load textures:', error);
        }
    }
    
    /**
     * マップをリセット
     */
    resetMap() {
        if (confirm('マップをリセットして新しいマップを生成しますか？\nこの操作は取り消せません。')) {
            this.game.mapLayerSystem.reset();
            this.layerSystem.reset();
            this.game.state = 'title';
            console.log('[Editor] Map reset confirmed. Returning to title screen.');
        }
    }
    
    /**
     * ピクセルテクスチャのレンダリング（静的メソッド）
     */
    static renderPixelTexture(ctx, pixels, x, y, zoom = 1.0) {
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
     * ピクセルテクスチャのレンダリング（インスタンスメソッド）
     */
    renderPixelTexture(ctx, pixels, x, y, zoom = 1.0) {
        Editor.renderPixelTexture(ctx, pixels, x, y, zoom);
    }
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.Editor = Editor;
}

console.log('Editor loaded');
