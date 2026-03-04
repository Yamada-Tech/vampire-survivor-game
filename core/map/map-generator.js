/**
 * Map Generator
 * 30×30チャンクマップを自動生成（データ圧縮対応）
 */

class MapGenerator {
  constructor(mapLayerSystem, editor) {
    this.mapLayerSystem = mapLayerSystem;
    this.editor = editor;
    this.villageGenerator = new VillageGenerator(mapLayerSystem);
    this.tileSize = 16;
  }
  
  /**
   * マップを生成
   */
  async generate(config) {
    const { size, biomes, villages, ruins, onProgress } = config;
    
    console.log('[MapGenerator] Starting map generation... Size:', size);
    
    // 1. 地形生成（30%）
    onProgress(0, '地形を生成中...');
    await this.generateTerrain(size, biomes);
    await this.sleep(50);
    onProgress(30, '地形生成完了');
    
    // 2. 道の生成（50%）
    onProgress(30, '道を生成中...');
    await this.generateMainRoads(size);
    await this.sleep(50);
    onProgress(50, '道生成完了');
    
    // 3. 村の廃墟配置（80%）
    onProgress(50, '村の廃墟を配置中...');
    await this.placeVillages(size, villages);
    await this.sleep(50);
    onProgress(80, '村配置完了');
    
    // 4. オブジェクト配置（95%）
    onProgress(80, 'オブジェクトを配置中...');
    await this.placeObjects(size);
    await this.sleep(50);
    onProgress(95, 'オブジェクト配置完了');
    
    // 5. 完了（100%）
    onProgress(100, 'マップ生成完了！');
    console.log('[MapGenerator] Map generation complete!');
  }
  
  /**
   * 地形生成（最適化版）
   */
  async generateTerrain(size, biomes) {
    const chunkSize = this.mapLayerSystem.chunkSize;
    const halfSize = Math.floor(size / 2);
    
    console.log('[MapGenerator] Generating terrain for', size, 'x', size, 'chunks');
    
    for (let chunkY = -halfSize; chunkY < halfSize; chunkY++) {
      for (let chunkX = -halfSize; chunkX < halfSize; chunkX++) {
        // バイオームをランダムに決定
        const biome = biomes[Math.floor(Math.random() * biomes.length)];
        const tileType = this.getBiomeGroundType(biome);
        
        // チャンク内の全タイルに配置
        for (let localY = 0; localY < chunkSize; localY++) {
          for (let localX = 0; localX < chunkSize; localX++) {
            const tileX = chunkX * chunkSize + localX;
            const tileY = chunkY * chunkSize + localY;
            
            this.mapLayerSystem.placeTile('ground', tileX, tileY, tileType);
          }
        }
      }
      
      // 定期的にawaitで処理を譲る
      if (chunkY % 3 === 0) {
        await this.sleep(1);
      }
    }
    
    console.log('[MapGenerator] Terrain generation complete');
  }
  
  getBiomeGroundType(biome) {
    const groundTypes = {
      forest: 'grass_tile',
      plains: 'grass_tile',
      desert: 'sand_tile',
      snow: 'snow_tile'
    };
    return groundTypes[biome] || 'grass_tile';
  }
  
  /**
   * メインロードを生成
   */
  async generateMainRoads(size) {
    const chunkSize = this.mapLayerSystem.chunkSize;
    const halfSize = Math.floor(size / 2);
    
    console.log('[MapGenerator] Generating main roads');
    
    // 十字路（中央を通る道）
    for (let i = -halfSize * chunkSize; i < halfSize * chunkSize; i++) {
      // 横の道（幅3タイル）
      for (let offset = -1; offset <= 1; offset++) {
        this.mapLayerSystem.placeTile('path', i, offset, 'path_tile');
      }
      
      // 縦の道（幅3タイル）
      for (let offset = -1; offset <= 1; offset++) {
        this.mapLayerSystem.placeTile('path', offset, i, 'path_tile');
      }
      
      if (i % 50 === 0) {
        await this.sleep(1);
      }
    }
    
    console.log('[MapGenerator] Main roads complete');
  }
  
  /**
   * 村を配置
   */
  async placeVillages(size, villageCount) {
    const chunkSize = this.mapLayerSystem.chunkSize;
    const halfSize = Math.floor(size / 2);
    
    console.log('[MapGenerator] Placing', villageCount, 'villages');
    
    for (let i = 0; i < villageCount; i++) {
      // ランダムな位置
      const x = (Math.random() - 0.5) * size * chunkSize * this.tileSize * 0.8;
      const y = (Math.random() - 0.5) * size * chunkSize * this.tileSize * 0.8;
      
      // 村のサイズをランダムに
      const villageSize = ['small', 'medium', 'large'][Math.floor(Math.random() * 3)];
      
      console.log('[MapGenerator] Generating village', i + 1, 'at', x, y, 'size:', villageSize);
      this.villageGenerator.generateRuinedVillage(x, y, villageSize);
      
      await this.sleep(50);
    }
    
    console.log('[MapGenerator] Villages placement complete');
  }
  
  /**
   * オブジェクト配置（最適化版）
   */
  async placeObjects(size) {
    const chunkSize = this.mapLayerSystem.chunkSize;
    const halfSize = Math.floor(size / 2);
    
    // ランダムに木、岩、茂みを配置
    const objectTypes = ['tree', 'rock', 'bush'];
    const objectCount = size * size * 8;  // 密度を少し減らす
    
    console.log('[MapGenerator] Placing', objectCount, 'objects');
    
    for (let i = 0; i < objectCount; i++) {
      const x = Math.floor((Math.random() - 0.5) * size * chunkSize);
      const y = Math.floor((Math.random() - 0.5) * size * chunkSize);
      
      const objectType = objectTypes[Math.floor(Math.random() * objectTypes.length)];
      
      this.mapLayerSystem.placeTile('objects', x, y, objectType);
      
      if (i % 200 === 0) {
        await this.sleep(1);
      }
    }
    
    console.log('[MapGenerator] Objects placement complete');
  }
  
  /**
   * スリープ（非同期処理のため）
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================
  // ObjectManager ベースの村生成（オブジェクトベース新システム）
  // ============================================================

  /**
   * ObjectManager を使用した廃墟の村を生成
   * @param {ObjectManager} objectManager - オブジェクト管理インスタンス
   * @param {Object} textures - { type: canvas/image, ... } テクスチャマップ
   * @param {number} centerX - 中心ワールドX座標
   * @param {number} centerY - 中心ワールドY座標
   * @param {number} size    - タイル数（辺のタイル数）
   */
  generateRuinedVillage(objectManager, textures, centerX, centerY, size = 50) {
    console.log('[MapGenerator] Generating object-based ruined village...');

    const tileSize = 16;
    const halfPx   = (size * tileSize) / 2;
    const startX   = centerX - halfPx;
    const startY   = centerY - halfPx;

    // 1. 地面を敷き詰める
    for (let tileY = 0; tileY < size; tileY++) {
      for (let tileX = 0; tileX < size; tileX++) {
        const wx = startX + tileX * tileSize;
        const wy = startY + tileY * tileSize;
        const groundType = Math.random() < 0.7 ? 'grass' : 'dirt';
        objectManager.addObject(groundType, wx, wy, textures[groundType] || null);
      }
    }

    // 2. 十字の道
    const mid = Math.floor(size / 2);
    for (let i = 5; i < size - 5; i++) {
      objectManager.addObject('stone_path', startX + i * tileSize, startY + mid * tileSize, textures['stone_path'] || null);
      objectManager.addObject('stone_path', startX + mid * tileSize, startY + i * tileSize, textures['stone_path'] || null);
    }

    // 3. 建物（壁のみ）
    const buildings = [
      { tx: 10, ty: 10, w: 8, h: 6 },
      { tx: 35, ty: 10, w: 6, h: 8 },
      { tx: 10, ty: 35, w: 7, h: 7 },
      { tx: 35, ty: 35, w: 5, h: 6 }
    ];
    buildings.forEach(b => {
      for (let row = 0; row < b.h; row++) {
        for (let col = 0; col < b.w; col++) {
          const isEdge = col === 0 || col === b.w - 1 || row === 0 || row === b.h - 1;
          if (!isEdge) continue;
          const wx = startX + (b.tx + col) * tileSize;
          const wy = startY + (b.ty + row) * tileSize;
          if (row === b.h - 1 && col === Math.floor(b.w / 2)) {
            objectManager.addObject('door', wx, wy, textures['door'] || null);
          } else {
            objectManager.addObject('stone_wall', wx, wy, textures['stone_wall'] || null);
          }
        }
      }
    });

    // 4. 木
    for (let i = 0; i < 20; i++) {
      const wx = startX + (Math.floor(Math.random() * (size - 4)) + 2) * tileSize;
      const wy = startY + (Math.floor(Math.random() * (size - 4)) + 2) * tileSize;
      if (objectManager.isPositionPassable(wx + 16, wy + 24)) {
        objectManager.addObject('tree', wx, wy, textures['tree'] || null);
      }
    }

    // 5. 岩
    for (let i = 0; i < 15; i++) {
      const wx = startX + (Math.floor(Math.random() * (size - 2)) + 1) * tileSize;
      const wy = startY + (Math.floor(Math.random() * (size - 2)) + 1) * tileSize;
      if (objectManager.isPositionPassable(wx + 8, wy + 8)) {
        objectManager.addObject('rock', wx, wy, textures['rock'] || null);
      }
    }

    // 6. 装飾（墓石・樽・箱）
    const decorTypes = ['gravestone', 'barrel', 'crate'];
    for (let i = 0; i < 10; i++) {
      const type = decorTypes[Math.floor(Math.random() * decorTypes.length)];
      const wx = startX + (Math.floor(Math.random() * (size - 2)) + 1) * tileSize;
      const wy = startY + (Math.floor(Math.random() * (size - 2)) + 1) * tileSize;
      if (objectManager.isPositionPassable(wx + 8, wy + 12)) {
        objectManager.addObject(type, wx, wy, textures[type] || null);
      }
    }

    console.log('[MapGenerator] Object-based village generated! Objects:', objectManager.objects.length);
  }
}

console.log('MapGenerator loaded');
