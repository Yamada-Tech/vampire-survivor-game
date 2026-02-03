// ============================================================================
// BiomeManager - Biome Effects and Management
// ============================================================================

class BiomeManager {
  constructor(mapData) {
    this.mapData = mapData;
    this.currentBiome = null;
  }

  /**
   * Get biome at specific world coordinates
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @returns {Object|null} - Biome data or null
   */
  getBiomeAt(x, y) {
    if (!this.mapData || !this.mapData.biomes) {
      return null;
    }
    
    // Find biome that contains this position
    for (const biome of this.mapData.biomes) {
      const { x: bx, y: by, width, height } = biome.bounds;
      
      if (x >= bx && x < bx + width && y >= by && y < by + height) {
        return biome;
      }
    }
    
    // Return first biome as default
    return this.mapData.biomes[0];
  }

  /**
   * Render biome effects (fog, lighting, etc.)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   * @param {Object} biome - Biome data
   */
  renderBiomeEffects(ctx, camera, biome) {
    if (!biome || !biome.effects) {
      return;
    }
    
    // Render fog effect
    if (biome.effects.fog) {
      this.renderFog(ctx, camera, biome);
    }
    
    // Render lighting effect
    if (biome.effects.lighting) {
      this.renderLighting(ctx, camera, biome);
    }
    
    // Render overlay effect
    if (biome.effects.overlay) {
      this.renderOverlay(ctx, camera, biome);
    }
  }

  /**
   * Render fog effect
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   * @param {Object} biome - Biome data
   */
  renderFog(ctx, camera, biome) {
    const fogConfig = biome.effects.fog;
    
    if (!fogConfig || !fogConfig.color) {
      return;
    }
    
    const { x: bx, y: by, width, height } = biome.bounds;
    
    // Check if camera overlaps with biome
    if (camera.x + camera.canvas.width < bx || camera.x > bx + width ||
        camera.y + camera.canvas.height < by || camera.y > by + height) {
      return; // Not visible
    }
    
    // Calculate screen coordinates
    const screenX1 = bx - camera.x;
    const screenY1 = by - camera.y;
    const screenX2 = screenX1 + width;
    const screenY2 = screenY1 + height;
    
    ctx.save();
    
    // Apply fog with opacity
    const opacity = fogConfig.opacity || 0.3;
    const color = fogConfig.color;
    
    // Parse color and add opacity
    let fogColor;
    if (color.startsWith('rgba')) {
      fogColor = color;
    } else if (color.startsWith('rgb')) {
      fogColor = color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    } else {
      // Hex color
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      fogColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    ctx.fillStyle = fogColor;
    ctx.fillRect(
      Math.max(0, screenX1),
      Math.max(0, screenY1),
      Math.min(camera.canvas.width, screenX2 - Math.max(0, screenX1)),
      Math.min(camera.canvas.height, screenY2 - Math.max(0, screenY1))
    );
    
    ctx.restore();
  }

  /**
   * Render lighting effect
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   * @param {Object} biome - Biome data
   */
  renderLighting(ctx, camera, biome) {
    const lightingConfig = biome.effects.lighting;
    
    if (!lightingConfig || !lightingConfig.type) {
      return;
    }
    
    ctx.save();
    
    if (lightingConfig.type === 'darken') {
      // amount represents brightness level (0.0 = completely dark, 1.0 = no darkening)
      // For intuitive configuration, users can specify darkness intensity
      ctx.globalCompositeOperation = 'multiply';
      const brightness = lightingConfig.amount || 0.7;
      ctx.fillStyle = `rgba(0, 0, 0, ${1 - brightness})`;
      ctx.fillRect(0, 0, camera.canvas.width, camera.canvas.height);
    } else if (lightingConfig.type === 'brighten') {
      ctx.globalCompositeOperation = 'screen';
      const amount = lightingConfig.amount || 0.3;
      ctx.fillStyle = `rgba(255, 255, 255, ${amount})`;
      ctx.fillRect(0, 0, camera.canvas.width, camera.canvas.height);
    }
    
    ctx.restore();
  }

  /**
   * Render overlay effect
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   * @param {Object} biome - Biome data
   */
  renderOverlay(ctx, camera, biome) {
    const overlayConfig = biome.effects.overlay;
    
    if (!overlayConfig || !overlayConfig.color) {
      return;
    }
    
    ctx.save();
    ctx.fillStyle = overlayConfig.color;
    ctx.fillRect(0, 0, camera.canvas.width, camera.canvas.height);
    ctx.restore();
  }

  /**
   * Check if position is in biome bounds
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {Object} biome - Biome data
   * @returns {boolean}
   */
  isInBiome(x, y, biome) {
    if (!biome || !biome.bounds) {
      return false;
    }
    
    const { x: bx, y: by, width, height } = biome.bounds;
    return x >= bx && x < bx + width && y >= by && y < by + height;
  }

  /**
   * Get all biomes
   * @returns {Array<Object>}
   */
  getAllBiomes() {
    return this.mapData.biomes || [];
  }

  /**
   * Update map data
   * @param {Object} mapData - New map data
   */
  updateMapData(mapData) {
    this.mapData = mapData;
    this.currentBiome = null;
  }
}

// Register globally
if (!window.PixelApocalypse) {
  window.PixelApocalypse = {};
}

window.PixelApocalypse.BiomeManager = BiomeManager;

console.log('BiomeManager loaded');
