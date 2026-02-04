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
}

console.log('MapGenerator loaded');
