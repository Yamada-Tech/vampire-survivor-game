/**
 * Map Generator
 * 5分マップを自動生成
 */

class MapGenerator {
  constructor(mapLayerSystem, editor) {
    this.mapLayerSystem = mapLayerSystem;
    this.editor = editor;
    this.villageGenerator = new VillageGenerator(mapLayerSystem);
  }
  
  /**
   * マップを生成
   */
  async generate(config) {
    const { size, biomes, villages, ruins, onProgress } = config;
    
    console.log('Starting map generation...');
    
    // 1. 地形生成（30%）
    onProgress(0, '地形を生成中...');
    await this.generateTerrain(size, biomes);
    await this.sleep(100);
    onProgress(30, '地形生成完了');
    
    // 2. バイオーム配置（50%）
    onProgress(30, 'バイオームを配置中...');
    await this.placeBiomes(size, biomes);
    await this.sleep(100);
    onProgress(50, 'バイオーム配置完了');
    
    // 3. 道の生成（60%）
    onProgress(50, '道を生成中...');
    await this.generateMainRoads(size);
    await this.sleep(100);
    onProgress(60, '道生成完了');
    
    // 4. 村の廃墟配置（80%）
    onProgress(60, '村の廃墟を配置中...');
    await this.placeVillages(size, villages);
    await this.sleep(100);
    onProgress(80, '村配置完了');
    
    // 5. オブジェクト配置（95%）
    onProgress(80, 'オブジェクトを配置中...');
    await this.placeObjects(size);
    await this.sleep(100);
    onProgress(95, 'オブジェクト配置完了');
    
    // 6. 完了（100%）
    onProgress(100, 'マップ生成完了！');
    console.log('Map generation complete!');
  }
  
  /**
   * 地形生成
   */
  async generateTerrain(size, biomes) {
    const tileSize = this.mapLayerSystem.tileSize;
    const chunkSize = this.mapLayerSystem.chunkSize;
    
    // 各チャンクにベース地形を配置
    for (let chunkY = -size / 2; chunkY < size / 2; chunkY++) {
      for (let chunkX = -size / 2; chunkX < size / 2; chunkX++) {
        // バイオームをランダムに決定（後でスムーズに）
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
      if (chunkY % 5 === 0) {
        await this.sleep(10);
      }
    }
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
   * バイオーム配置（より自然に）
   */
  async placeBiomes(size, biomes) {
    // Perlin Noiseやランダムウォークで自然なバイオーム配置
    // ここでは簡略化
    console.log('Biomes placed naturally');
  }
  
  /**
   * メインロードを生成
   */
  async generateMainRoads(size) {
    const tileSize = this.mapLayerSystem.tileSize;
    const chunkSize = this.mapLayerSystem.chunkSize;
    const halfSize = size / 2;
    
    // 十字路（中央を通る道）
    for (let i = -halfSize * chunkSize; i < halfSize * chunkSize; i++) {
      // 横の道
      this.mapLayerSystem.placeTile('path', i, 0, 'path_tile');
      this.mapLayerSystem.placeTile('path', i, 1, 'path_tile');
      this.mapLayerSystem.placeTile('path', i, -1, 'path_tile');
      
      // 縦の道
      this.mapLayerSystem.placeTile('path', 0, i, 'path_tile');
      this.mapLayerSystem.placeTile('path', 1, i, 'path_tile');
      this.mapLayerSystem.placeTile('path', -1, i, 'path_tile');
      
      if (i % 100 === 0) {
        await this.sleep(1);
      }
    }
  }
  
  /**
   * 村を配置
   */
  async placeVillages(size, villageCount) {
    const tileSize = this.mapLayerSystem.tileSize;
    const chunkSize = this.mapLayerSystem.chunkSize;
    const halfSize = size / 2;
    
    for (let i = 0; i < villageCount; i++) {
      // ランダムな位置
      const x = (Math.random() - 0.5) * size * chunkSize * tileSize * 0.8;
      const y = (Math.random() - 0.5) * size * chunkSize * tileSize * 0.8;
      
      // 村のサイズをランダムに
      const villageSize = ['small', 'medium', 'large'][Math.floor(Math.random() * 3)];
      
      this.villageGenerator.generateRuinedVillage(x, y, villageSize);
      
      await this.sleep(100);
    }
  }
  
  /**
   * オブジェクト配置
   */
  async placeObjects(size) {
    const tileSize = this.mapLayerSystem.tileSize;
    const chunkSize = this.mapLayerSystem.chunkSize;
    const halfSize = size / 2;
    
    // ランダムに木、岩、茂みを配置
    const objectTypes = ['tree', 'rock', 'bush'];
    const objectCount = size * size * 10;  // チャンクあたり10個
    
    for (let i = 0; i < objectCount; i++) {
      const x = Math.floor((Math.random() - 0.5) * size * chunkSize);
      const y = Math.floor((Math.random() - 0.5) * size * chunkSize);
      
      const objectType = objectTypes[Math.floor(Math.random() * objectTypes.length)];
      
      this.mapLayerSystem.placeTile('objects', x, y, objectType);
      
      if (i % 500 === 0) {
        await this.sleep(10);
      }
    }
  }
  
  /**
   * スリープ（非同期処理のため）
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

console.log('MapGenerator loaded');
