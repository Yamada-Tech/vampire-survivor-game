// ============================================================================
// TilesetRenderer - Tile Rendering with Image/Fallback Support
// ============================================================================

class TilesetRenderer {
  constructor(mapLoader) {
    this.mapLoader = mapLoader;
    this.tileCache = new Map();
    this.textureGenerator = new window.PixelApocalypse.TextureGenerator();
    this.textures = new Map();
  }
  
  /**
   * マップ用のテクスチャを初期化
   */
  initTextures() {
    console.log('Initializing map textures...');
    
    // 草原テクスチャ
    const grasslandTexture = this.textureGenerator.generateGrasslandTexture(512, 12345);
    this.textures.set('grassland', grasslandTexture);
    
    // 墓地テクスチャ
    const graveyardTexture = this.textureGenerator.generateGraveyardTexture(512, 67890);
    this.textures.set('graveyard', graveyardTexture);
    
    console.log('Map textures initialized');
  }

  /**
   * Render ground tiles for visible area
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   * @param {Object} biome - Biome data
   * @param {number} tileSize - Size of each tile
   */
  renderGround(ctx, camera, biome, tileSize) {
    // テクスチャが未初期化なら初期化
    if (this.textures.size === 0) {
      this.initTextures();
    }
    
    const bounds = camera.getViewBounds();
    const TEXTURE_SIZE = 512;
    
    // 表示範囲のタイル座標を計算
    const startTileX = Math.floor(bounds.left / TEXTURE_SIZE);
    const startTileY = Math.floor(bounds.top / TEXTURE_SIZE);
    const endTileX = Math.ceil(bounds.right / TEXTURE_SIZE);
    const endTileY = Math.ceil(bounds.bottom / TEXTURE_SIZE);
    
    // 各タイルを描画
    for (let tileX = startTileX; tileX <= endTileX; tileX++) {
      for (let tileY = startTileY; tileY <= endTileY; tileY++) {
        const worldX = tileX * TEXTURE_SIZE;
        const worldY = tileY * TEXTURE_SIZE;
        
        // このタイルのバイオームを判定
        const centerX = worldX + TEXTURE_SIZE / 2;
        const centerY = worldY + TEXTURE_SIZE / 2;
        const tileBiome = this.mapLoader.getBiomeAt(centerX, centerY);
        
        // バイオームに応じたテクスチャを取得
        let texture;
        if (tileBiome && tileBiome.id === 'graveyard') {
          texture = this.textures.get('graveyard');
        } else {
          texture = this.textures.get('grassland');
        }
        
        if (texture) {
          // ★重要: applyTransform内で描画するので、ワールド座標をそのまま使用
          ctx.drawImage(texture, worldX, worldY, TEXTURE_SIZE, TEXTURE_SIZE);
        } else {
          // フォールバック: 旧方式で描画
          this.renderTile(ctx, camera, biome, worldX, worldY, TEXTURE_SIZE);
        }
      }
    }
  }

  /**
   * Render a single tile
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   * @param {Object} biome - Biome data
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {number} tileSize - Size of tile
   */
  renderTile(ctx, camera, biome, x, y, tileSize) {
    const zoom = camera.zoom || 1.0;
    
    // ★ズームを考慮した画面座標
    const screenX = (x - camera.x) * zoom;
    const screenY = (y - camera.y) * zoom;
    
    // Generate seeded random for this tile
    const seed = this.hash(Math.floor(x / tileSize), Math.floor(y / tileSize));
    const rng = this.createSeededRandom(seed);
    
    // Select tile type based on weights
    const tileType = this.selectWeightedTile(biome, rng);
    
    // Try to render with image first
    if (biome.groundTiles && Array.isArray(biome.groundTiles)) {
      const tile = biome.groundTiles[tileType];
      if (tile && typeof tile === 'object' && tile.sprite) {
        const img = this.mapLoader.getImage(tile.sprite);
        if (img && img.complete) {
          ctx.drawImage(img, screenX, screenY, tileSize * zoom, tileSize * zoom);
          return;
        }
      }
    }
    
    // Fallback to programmatic rendering (pass world coordinates)
    this.renderFallbackTile(ctx, screenX, screenY, tileSize * zoom, biome, tileType, rng, x, y);
  }

  /**
   * Select a tile type based on weighted random
   * @param {Object} biome - Biome data
   * @param {Function} rng - Random number generator
   * @returns {number} - Selected tile index
   */
  selectWeightedTile(biome, rng) {
    if (!biome.weights || biome.weights.length === 0) {
      return 0;
    }
    
    const rand = rng();
    let cumulative = 0;
    
    for (let i = 0; i < biome.weights.length; i++) {
      cumulative += biome.weights[i];
      if (rand < cumulative) {
        return i;
      }
    }
    
    return biome.weights.length - 1;
  }

  /**
   * Render tile using fallback colors
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @param {number} tileSize - Size of tile (zoomed)
   * @param {Object} biome - Biome data
   * @param {number} tileType - Tile type index
   * @param {Function} rng - Random number generator
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   */
  renderFallbackTile(ctx, screenX, screenY, tileSize, biome, tileType, rng, worldX = 0, worldY = 0) {
    // Get fallback colors
    const fallbackColors = biome.fallbackColors || ['#5a8c3a'];
    
    // ★Perlinノイズ風のパターン（世界座標ベース）
    const noiseX = Math.floor(worldX / 64);
    const noiseY = Math.floor(worldY / 64);
    const noiseSeed = this.hash(noiseX, noiseY);
    const noiseRng = this.createSeededRandom(noiseSeed);
    const noiseValue = noiseRng();
    
    // Add random variation
    let color;
    const rand = rng();
    
    // ★草原バイオームの判定（fallbackColorsから）
    const isGrassland = biome.id === 'grassland' || 
                        (fallbackColors[0] && fallbackColors[0].startsWith('#5')) || 
                        (fallbackColors[0] && fallbackColors[0].startsWith('#6'));
    
    if (isGrassland) {
      // ★草原: より自然な草原
      if (noiseValue < 0.1) {
        // 10%の確率で土の塊（パッチ）
        color = rand < 0.5 ? '#8B7355' : '#7a6345';
      } else if (rand < 0.05) {
        // 5%の確率で明るい草
        color = '#7aac4a';
      } else if (rand < 0.15) {
        // 10%の確率で濃い草
        color = '#3a6c1a';
      } else if (rand < 0.40) {
        // 25%の確率でやや明るい草
        color = '#6a9c3a';
      } else if (rand < 0.70) {
        // 30%の確率で基本の草
        color = '#5a8c3a';
      } else {
        // 30%の確率でやや暗い草
        color = '#4a7c2a';
      }
    } else {
      // ★墓地バイオーム
      if (fallbackColors.length === 1) {
        // Single color - add subtle variations
        const variations = [
          fallbackColors[0],
          this.adjustBrightness(fallbackColors[0], -10),
          this.adjustBrightness(fallbackColors[0], 10)
        ];
        
        if (rand < 0.05) {
          color = this.adjustBrightness(fallbackColors[0], -20);
        } else if (rand < 0.3) {
          color = variations[1];
        } else if (rand < 0.55) {
          color = variations[2];
        } else {
          color = variations[0];
        }
      } else {
        // Multiple colors - select based on weights
        if (tileType < fallbackColors.length) {
          color = fallbackColors[tileType];
        } else {
          color = fallbackColors[0];
        }
        
        // Add subtle variation
        if (rand < 0.05) {
          color = this.adjustBrightness(color, -10);
        } else if (rand > 0.95) {
          color = this.adjustBrightness(color, 10);
        }
      }
    }
    
    ctx.fillStyle = color;
    ctx.fillRect(screenX, screenY, tileSize, tileSize);
    
    // ★わずかな影とハイライトを追加（立体感）
    const brightness = (rng() - 0.5) * 0.1;
    if (brightness > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
    } else {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.abs(brightness)})`;
    }
    ctx.fillRect(screenX, screenY, tileSize, tileSize);
  }

  /**
   * Adjust color brightness
   * @param {string} color - Hex color
   * @param {number} amount - Brightness adjustment (-255 to 255)
   * @returns {string} - Adjusted hex color
   */
  adjustBrightness(color, amount) {
    // Parse hex color
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Hash function for seeded random
   * Uses large prime numbers for spatial hashing to ensure good distribution
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} - Hash value
   */
  hash(x, y) {
    // Large prime numbers for good spatial distribution
    return ((x * 73856093) ^ (y * 19349663)) >>> 0;
  }

  /**
   * Create seeded random number generator
   * @param {number} seed - Seed value
   * @returns {Function} - Random number generator function
   */
  createSeededRandom(seed) {
    let state = seed;
    return function() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return (state >>> 0) / 0xFFFFFFFF;
    };
  }

  /**
   * Clear tile cache
   */
  clearCache() {
    this.tileCache.clear();
    console.log('[TilesetRenderer] Cache cleared');
  }
}

// Register globally
if (!window.PixelApocalypse) {
  window.PixelApocalypse = {};
}

window.PixelApocalypse.TilesetRenderer = TilesetRenderer;

console.log('TilesetRenderer loaded');
