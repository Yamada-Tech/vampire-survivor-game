/**
 * Village Generator
 * 村の廃墟を生成
 */

class VillageGenerator {
  constructor(mapLayerSystem) {
    this.mapLayerSystem = mapLayerSystem;
    
    // 建物のテンプレート
    this.buildingTemplates = {
      small_house: {
        width: 5,
        height: 5,
        floor: [
          ['wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor'],
          ['wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor'],
          ['wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor'],
          ['wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor'],
          ['wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor']
        ],
        walls: [
          ['stone_wall', 'stone_wall', 'broken_door', 'stone_wall', 'stone_wall'],
          ['stone_wall', null, null, null, 'stone_wall'],
          ['broken_wall', null, null, null, 'broken_wall'],
          ['stone_wall', null, null, null, 'stone_wall'],
          ['stone_wall', 'stone_wall', 'stone_wall', 'stone_wall', 'stone_wall']
        ],
        furniture: [
          { type: 'chair', x: 2, y: 2 },
          { type: 'barrel', x: 1, y: 3 },
          { type: 'broken_bed', x: 3, y: 1 }
        ],
        hasCollision: true
      },
      
      large_house: {
        width: 7,
        height: 7,
        floor: [
          ['wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor'],
          ['wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor'],
          ['wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor'],
          ['wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor'],
          ['wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor'],
          ['wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor'],
          ['wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor']
        ],
        walls: [
          ['stone_wall', 'stone_wall', 'stone_wall', 'broken_door', 'stone_wall', 'stone_wall', 'stone_wall'],
          ['stone_wall', null, null, null, null, null, 'stone_wall'],
          ['stone_wall', null, null, null, null, null, 'stone_wall'],
          ['broken_wall', null, null, null, null, null, 'broken_wall'],
          ['stone_wall', null, null, null, null, null, 'stone_wall'],
          ['stone_wall', null, null, null, null, null, 'stone_wall'],
          ['stone_wall', 'stone_wall', 'stone_wall', 'stone_wall', 'stone_wall', 'stone_wall', 'stone_wall']
        ],
        furniture: [
          { type: 'fireplace', x: 1, y: 3 },
          { type: 'chair', x: 4, y: 3 },
          { type: 'chair', x: 5, y: 3 },
          { type: 'barrel', x: 6, y: 1 },
          { type: 'broken_bed', x: 2, y: 5 }
        ],
        hasCollision: true
      },
      
      destroyed_house: {
        width: 5,
        height: 5,
        floor: [
          [null, null, 'wood_floor', 'wood_floor', null],
          [null, 'wood_floor', 'wood_floor', 'wood_floor', 'wood_floor'],
          ['wood_floor', 'wood_floor', 'wood_floor', 'wood_floor', null],
          ['wood_floor', 'wood_floor', 'wood_floor', null, null],
          [null, 'wood_floor', null, null, null]
        ],
        walls: [
          ['broken_wall', null, null, null, null],
          [null, null, null, null, 'broken_wall'],
          ['broken_wall', null, null, null, null],
          [null, null, null, null, null],
          [null, 'stone_wall', null, null, null]
        ],
        furniture: [
          { type: 'broken_bed', x: 2, y: 2 }
        ],
        hasCollision: false  // 完全に壊れているので通れる
      },
      
      church: {
        width: 9,
        height: 12,
        floor: [
          ['stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile'],
          ['stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile'],
          ['stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile'],
          ['stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile'],
          ['stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile'],
          ['stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile'],
          ['stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile'],
          ['stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile'],
          ['stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile'],
          ['stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile'],
          ['stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile'],
          ['stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile', 'stone_tile']
        ],
        walls: [
          ['stone_wall', 'stone_wall', 'stone_wall', 'stone_wall', 'door', 'stone_wall', 'stone_wall', 'stone_wall', 'stone_wall'],
          ['stone_wall', null, null, null, null, null, null, null, 'stone_wall'],
          ['stone_wall', null, null, null, null, null, null, null, 'stone_wall'],
          ['stone_wall', null, null, null, null, null, null, null, 'stone_wall'],
          ['stone_wall', null, null, null, null, null, null, null, 'stone_wall'],
          ['stone_wall', null, null, null, null, null, null, null, 'stone_wall'],
          ['stone_wall', null, null, null, null, null, null, null, 'stone_wall'],
          ['stone_wall', null, null, null, null, null, null, null, 'stone_wall'],
          ['stone_wall', null, null, null, null, null, null, null, 'stone_wall'],
          ['stone_wall', null, null, null, null, null, null, null, 'stone_wall'],
          ['stone_wall', null, null, null, null, null, null, null, 'stone_wall'],
          ['stone_wall', 'stone_wall', 'stone_wall', 'stone_wall', 'stone_wall', 'stone_wall', 'stone_wall', 'stone_wall', 'stone_wall']
        ],
        furniture: [
          { type: 'altar', x: 4, y: 2 },
          { type: 'bench', x: 2, y: 5 },
          { type: 'bench', x: 6, y: 5 },
          { type: 'bench', x: 2, y: 7 },
          { type: 'bench', x: 6, y: 7 }
        ],
        hasCollision: true
      }
    };
  }
  
  /**
   * 村の廃墟を生成
   */
  generateRuinedVillage(centerX, centerY, size = 'medium') {
    console.log(`Generating ruined village at (${centerX}, ${centerY})`);
    
    const config = {
      small: { buildings: 3, radius: 8 },
      medium: { buildings: 6, radius: 12 },
      large: { buildings: 12, radius: 20 }
    };
    
    const { buildings: buildingCount, radius } = config[size];
    
    // 1. 村の地面を整地（土または石畳）
    this.clearVillageGround(centerX, centerY, radius);
    
    // 2. 村の中心に井戸
    this.placeWell(centerX, centerY);
    
    // 3. 道を生成
    this.generateVillagePaths(centerX, centerY, radius);
    
    // 4. 建物を配置
    this.placeBuildings(centerX, centerY, buildingCount, radius);
    
    // 5. 墓地
    this.generateGraveyard(centerX + radius + 5, centerY + radius + 5);
    
    // 6. ランダムなオブジェクト（樽、箱など）
    this.scatterDebris(centerX, centerY, radius);
  }
  
  /**
   * 村の地面を整地
   */
  clearVillageGround(centerX, centerY, radius) {
    const tileSize = this.mapLayerSystem.tileSize;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < radius) {
          const tileX = Math.floor((centerX + dx * tileSize) / tileSize);
          const tileY = Math.floor((centerY + dy * tileSize) / tileSize);
          
          // 土または石畳をランダムに配置
          const tileType = Math.random() > 0.7 ? 'stone_tile' : 'dirt_tile';
          this.mapLayerSystem.placeTile('ground', tileX, tileY, tileType);
        }
      }
    }
  }
  
  /**
   * 井戸を配置
   */
  placeWell(centerX, centerY) {
    const tileSize = this.mapLayerSystem.tileSize;
    const tileX = Math.floor(centerX / tileSize);
    const tileY = Math.floor(centerY / tileSize);
    
    // 簡易的に石で井戸を表現
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) {
          // 中心は空洞
          continue;
        }
        this.mapLayerSystem.placeTile('objects', tileX + dx, tileY + dy, 'stone_wall');
      }
    }
  }
  
  /**
   * 村の道を生成
   */
  generateVillagePaths(centerX, centerY, radius) {
    const tileSize = this.mapLayerSystem.tileSize;
    
    // 十字路
    for (let i = -radius; i <= radius; i++) {
      // 横の道
      const tileX1 = Math.floor((centerX + i * tileSize) / tileSize);
      const tileY1 = Math.floor(centerY / tileSize);
      this.mapLayerSystem.placeTile('path', tileX1, tileY1, 'path_tile');
      this.mapLayerSystem.placeTile('path', tileX1, tileY1 - 1, 'path_tile');
      this.mapLayerSystem.placeTile('path', tileX1, tileY1 + 1, 'path_tile');
      
      // 縦の道
      const tileX2 = Math.floor(centerX / tileSize);
      const tileY2 = Math.floor((centerY + i * tileSize) / tileSize);
      this.mapLayerSystem.placeTile('path', tileX2, tileY2, 'path_tile');
      this.mapLayerSystem.placeTile('path', tileX2 - 1, tileY2, 'path_tile');
      this.mapLayerSystem.placeTile('path', tileX2 + 1, tileY2, 'path_tile');
    }
  }
  
  /**
   * 建物を配置
   */
  placeBuildings(centerX, centerY, count, radius) {
    const tileSize = this.mapLayerSystem.tileSize;
    const buildingTypes = Object.keys(this.buildingTemplates);
    
    for (let i = 0; i < count; i++) {
      // ランダムな角度と距離
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const distance = radius * 0.5 + Math.random() * radius * 0.3;
      
      const buildingX = centerX + Math.cos(angle) * distance * tileSize;
      const buildingY = centerY + Math.sin(angle) * distance * tileSize;
      
      // ランダムな建物タイプ
      const buildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
      
      this.placeBuilding(buildingX, buildingY, buildingType);
    }
  }
  
  /**
   * 1つの建物を配置
   */
  placeBuilding(x, y, templateName) {
    const template = this.buildingTemplates[templateName];
    const tileSize = this.mapLayerSystem.tileSize;
    
    // 床を配置
    for (let row = 0; row < template.height; row++) {
      for (let col = 0; col < template.width; col++) {
        const floorType = template.floor[row][col];
        if (floorType) {
          const tileX = Math.floor((x + col * tileSize) / tileSize);
          const tileY = Math.floor((y + row * tileSize) / tileSize);
          this.mapLayerSystem.placeTile('ground', tileX, tileY, floorType);
        }
      }
    }
    
    // 壁を配置
    for (let row = 0; row < template.height; row++) {
      for (let col = 0; col < template.width; col++) {
        const wallType = template.walls[row][col];
        if (wallType) {
          const tileX = Math.floor((x + col * tileSize) / tileSize);
          const tileY = Math.floor((y + row * tileSize) / tileSize);
          this.mapLayerSystem.placeTile('objects', tileX, tileY, wallType);
        }
      }
    }
    
    // 家具を配置
    template.furniture.forEach(item => {
      const tileX = Math.floor((x + item.x * tileSize) / tileSize);
      const tileY = Math.floor((y + item.y * tileSize) / tileSize);
      this.mapLayerSystem.placeTile('objects', tileX, tileY, item.type);
    });
  }
  
  /**
   * 墓地を生成
   */
  generateGraveyard(x, y) {
    const tileSize = this.mapLayerSystem.tileSize;
    const rows = 3;
    const cols = 4;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tileX = Math.floor((x + col * 2 * tileSize) / tileSize);
        const tileY = Math.floor((y + row * 3 * tileSize) / tileSize);
        
        // ランダムに墓石を配置（全てではない）
        if (Math.random() > 0.3) {
          this.mapLayerSystem.placeTile('objects', tileX, tileY, 'gravestone');
        }
      }
    }
  }
  
  /**
   * 瓦礫を散乱
   */
  scatterDebris(centerX, centerY, radius) {
    const tileSize = this.mapLayerSystem.tileSize;
    const debrisTypes = ['barrel', 'chair', 'debris', 'wood_debris'];
    const count = radius * 2;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      
      const debrisX = Math.floor((centerX + Math.cos(angle) * distance * tileSize) / tileSize);
      const debrisY = Math.floor((centerY + Math.sin(angle) * distance * tileSize) / tileSize);
      
      const debrisType = debrisTypes[Math.floor(Math.random() * debrisTypes.length)];
      this.mapLayerSystem.placeTile('objects', debrisX, debrisY, debrisType);
    }
  }
}

console.log('VillageGenerator loaded');
