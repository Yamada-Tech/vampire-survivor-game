// ============================================================================
// TilesetRenderer - Tile Rendering with Image/Fallback Support
// ============================================================================

class TilesetRenderer {
  constructor(mapLoader) {
    this.mapLoader = mapLoader;
    this.tileCache = new Map();
  }

  /**
   * Render ground tiles for visible area
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   * @param {Object} biome - Biome data
   * @param {number} tileSize - Size of each tile
   */
  renderGround(ctx, camera, biome, tileSize) {
    // Calculate visible tile range
    const startX = Math.floor((camera.x - 100) / tileSize) * tileSize;
    const startY = Math.floor((camera.y - 100) / tileSize) * tileSize;
    const endX = startX + camera.canvas.width + 200;
    const endY = startY + camera.canvas.height + 200;
    
    for (let x = startX; x < endX; x += tileSize) {
      for (let y = startY; y < endY; y += tileSize) {
        this.renderTile(ctx, camera, biome, x, y, tileSize);
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
    const screenX = x - camera.x;
    const screenY = y - camera.y;
    
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
          ctx.drawImage(img, screenX, screenY, tileSize, tileSize);
          return;
        }
      }
    }
    
    // Fallback to programmatic rendering
    this.renderFallbackTile(ctx, screenX, screenY, tileSize, biome, tileType, rng);
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
   * @param {number} tileSize - Size of tile
   * @param {Object} biome - Biome data
   * @param {number} tileType - Tile type index
   * @param {Function} rng - Random number generator
   */
  renderFallbackTile(ctx, screenX, screenY, tileSize, biome, tileType, rng) {
    // Get fallback colors
    const fallbackColors = biome.fallbackColors || ['#5a8c3a'];
    
    // Add random variation
    let color;
    const rand = rng();
    
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
    
    ctx.fillStyle = color;
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
