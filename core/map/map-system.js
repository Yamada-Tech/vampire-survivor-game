// ============================================================================
// MapSystem - Integrated Tile-Based Map System
// ============================================================================

class MapSystem {
  constructor() {
    this.mapLoader = new window.PixelApocalypse.MapLoader();
    this.tilesetRenderer = null;
    this.biomeManager = null;
    this.objectSpawner = null;
    this.mapData = null;
    this.layers = [];
    this.clearTimer = 0;
    this.RENDER_BUFFER = 200; // Buffer zone around camera for rendering
  }

  /**
   * Initialize the map system
   * @param {string} mapPath - Path to map JSON file
   * @returns {Promise<void>}
   */
  async initialize(mapPath) {
    console.log('[MapSystem] Initializing map system...');
    
    try {
      // Load map data
      this.mapData = await this.mapLoader.loadMap(mapPath);
      
      // Initialize subsystems
      this.tilesetRenderer = new window.PixelApocalypse.TilesetRenderer(this.mapLoader);
      this.biomeManager = new window.PixelApocalypse.BiomeManager(this.mapData);
      this.objectSpawner = new window.PixelApocalypse.ObjectSpawner(this.mapLoader, this.mapData);
      
      // Setup rendering layers
      this.initializeLayers();
      
      console.log(`[MapSystem] Initialized successfully: ${this.mapData.name}`);
      
    } catch (error) {
      console.error('[MapSystem] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize rendering layers
   */
  initializeLayers() {
    this.layers = [
      {
        id: 'sky',
        parallax: 0,
        render: (ctx, camera) => this.renderSky(ctx, camera)
      },
      {
        id: 'far-background',
        parallax: 0.2,
        render: (ctx, camera) => this.renderFarBackground(ctx, camera)
      },
      {
        id: 'objects',
        parallax: 0.5,
        render: (ctx, camera) => this.renderObjects(ctx, camera)
      },
      {
        id: 'ground',
        parallax: 1.0,
        render: (ctx, camera) => this.renderGround(ctx, camera)
      },
      {
        id: 'foreground',
        parallax: 1.0,
        render: (ctx, camera) => this.renderForeground(ctx, camera)
      },
      {
        id: 'effects',
        parallax: 1.0,
        render: (ctx, camera) => this.renderEffects(ctx, camera)
      }
    ];
  }

  /**
   * Main render method
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   */
  render(ctx, camera) {
    if (!this.mapData) {
      console.warn('[MapSystem] No map data loaded');
      return;
    }
    
    // Render all layers in order
    this.layers.forEach(layer => {
      layer.render(ctx, camera);
    });
  }

  /**
   * Render sky layer
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   */
  renderSky(ctx, camera) {
    if (!this.mapData.sky) {
      return;
    }
    
    const skyHeight = camera.canvas.height * (this.mapData.sky.height || 0.3);
    const colors = this.mapData.sky.colors || ['#4a90d9', '#87CEEB', '#b8e0f0'];
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, skyHeight);
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, camera.canvas.width, skyHeight);
  }

  /**
   * Render far background layer
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   */
  renderFarBackground(ctx, camera) {
    if (!this.mapData.farBackground || !this.mapData.farBackground.enabled) {
      return;
    }
    
    const zoom = camera.zoom || 1.0;
    const skyHeight = camera.canvas.height * (this.mapData.sky?.height || 0.3);
    const parallax = this.mapData.farBackground.parallax || 0.2;
    
    // ★ズームを考慮したオフセット
    const offsetX = camera.x * parallax * zoom;
    
    ctx.save();
    ctx.globalAlpha = this.mapData.farBackground.opacity || 0.5;
    
    // Draw mountain silhouettes
    const color = this.mapData.farBackground.color || '#5a7a8e';
    ctx.fillStyle = color;
    ctx.beginPath();
    
    const mountainWidth = 400;
    const mountainHeight = skyHeight * 0.6;
    const baseY = skyHeight;
    const startX = -offsetX % mountainWidth;
    
    for (let x = startX - mountainWidth; x < camera.canvas.width + mountainWidth; x += mountainWidth) {
      ctx.moveTo(x, baseY);
      ctx.lineTo(x + mountainWidth * 0.3, baseY - mountainHeight * 0.6);
      ctx.lineTo(x + mountainWidth * 0.5, baseY - mountainHeight);
      ctx.lineTo(x + mountainWidth * 0.7, baseY - mountainHeight * 0.7);
      ctx.lineTo(x + mountainWidth, baseY);
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Render ground layer
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   */
  renderGround(ctx, camera) {
    if (!this.tilesetRenderer || !this.biomeManager) {
      return;
    }
    
    const zoom = camera.zoom || 1.0;
    const tileSize = this.mapData.tileSize || 32;
    
    // ★ズームを考慮した実際の表示範囲を計算
    const visibleWorldWidth = camera.canvas.width / zoom;
    const visibleWorldHeight = camera.canvas.height / zoom;
    
    // Render tiles for all visible biomes
    const buffer = this.RENDER_BUFFER;
    const startX = Math.floor((camera.x - buffer) / tileSize) * tileSize;
    const startY = Math.floor((camera.y - buffer) / tileSize) * tileSize;
    const endX = Math.ceil((camera.x + visibleWorldWidth + buffer) / tileSize) * tileSize;
    const endY = Math.ceil((camera.y + visibleWorldHeight + buffer) / tileSize) * tileSize;
    
    // Group tiles by biome for efficiency
    const biomeCache = new Map();
    
    for (let x = startX; x < endX; x += tileSize) {
      for (let y = startY; y < endY; y += tileSize) {
        // Get biome for this position
        const biome = this.biomeManager.getBiomeAt(x, y);
        
        if (biome) {
          this.tilesetRenderer.renderTile(ctx, camera, biome, x, y, tileSize);
        }
      }
    }
  }

  /**
   * Render objects layer
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   */
  renderObjects(ctx, camera) {
    if (!this.objectSpawner || !this.biomeManager) {
      return;
    }
    
    this.objectSpawner.renderObjects(ctx, camera, this.biomeManager);
  }

  /**
   * Render foreground layer
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   */
  renderForeground(ctx, camera) {
    if (!this.mapData.foreground || !this.mapData.foreground.enabled) {
      return;
    }
    
    const grassConfig = this.mapData.foreground.grass;
    if (!grassConfig) {
      return;
    }
    
    const zoom = camera.zoom || 1.0;
    const spacing = grassConfig.spacing || 80;
    const opacity = grassConfig.opacity || 0.6;
    const allowedBiomes = grassConfig.biomes || [];
    
    // ★ズームを考慮した実際の表示範囲を計算
    const visibleWorldWidth = camera.canvas.width / zoom;
    const visibleWorldHeight = camera.canvas.height / zoom;
    
    const buffer = this.RENDER_BUFFER;
    const startX = Math.floor((camera.x - buffer) / spacing) * spacing;
    const startY = Math.floor((camera.y - buffer) / spacing) * spacing;
    const endX = Math.ceil((camera.x + visibleWorldWidth + buffer) / spacing) * spacing;
    const endY = Math.ceil((camera.y + visibleWorldHeight + buffer) / spacing) * spacing;
    
    ctx.save();
    ctx.globalAlpha = opacity;
    
    for (let x = startX; x < endX; x += spacing) {
      for (let y = startY; y < endY; y += spacing) {
        const seed = this.hash(Math.floor(x / 10), Math.floor(y / 10));
        const rng = this.createSeededRandom(seed);
        
        // ★70%の確率で草を描画（密度を上げる）
        if (rng() < 0.7) {
          const biome = this.biomeManager.getBiomeAt(x, y);
          
          // Check if grass is allowed in this biome
          if (biome && allowedBiomes.includes(biome.id)) {
            const screenX = (x - camera.x) * zoom;
            const screenY = (y - camera.y) * zoom;
            this.drawGrass(ctx, screenX, screenY, zoom, rng());
          }
        }
      }
    }
    
    ctx.restore();
  }

  /**
   * Render effects layer
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   */
  renderEffects(ctx, camera) {
    if (!this.biomeManager) {
      return;
    }
    
    // Get all biomes visible in camera
    const visibleBiomes = new Set();
    
    this.biomeManager.getAllBiomes().forEach(biome => {
      const { x, y, width, height } = biome.bounds;
      
      // Check if biome is visible
      if (camera.x + camera.canvas.width >= x && camera.x <= x + width &&
          camera.y + camera.canvas.height >= y && camera.y <= y + height) {
        visibleBiomes.add(biome);
      }
    });
    
    // Render effects for each visible biome
    visibleBiomes.forEach(biome => {
      this.biomeManager.renderBiomeEffects(ctx, camera, biome);
    });
  }

  /**
   * Draw grass decoration
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Screen X position
   * @param {number} y - Screen Y position
   * @param {number} zoom - Zoom level
   * @param {number} randomSeed - Random seed for variety
   */
  drawGrass(ctx, x, y, zoom = 1.0, randomSeed = 0.5) {
    const rng = this.createSeededRandom(randomSeed * 1000000);
    
    // ★ランダムな草の色（より自然に）
    ctx.strokeStyle = rng() < 0.5 ? '#4a8c2a' : '#3a7c1a';
    ctx.lineWidth = 1.5 * zoom;
    ctx.lineCap = 'round';
    
    // ★ランダムな高さ
    const height = (6 + rng() * 6) * zoom;
    
    // 3 blades of grass
    ctx.beginPath();
    ctx.moveTo(x - 2 * zoom, y);
    ctx.lineTo(x - 3 * zoom, y - height * 0.8);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + 2 * zoom, y);
    ctx.lineTo(x + 3 * zoom, y - height * 0.7);
    ctx.stroke();
  }

  /**
   * Update method (called each frame)
   * @param {number} deltaTime - Time since last frame
   * @param {Object} camera - Camera object
   */
  update(deltaTime, camera) {
    // Clear distant chunks periodically
    this.clearTimer += deltaTime;
    if (this.clearTimer >= 5.0) {
      if (this.objectSpawner) {
        this.objectSpawner.clearDistantChunks(camera.x, camera.y);
      }
      this.clearTimer = 0;
    }
  }

  /**
   * Hash function for seeded random
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} - Hash value
   */
  hash(x, y) {
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
   * Clean up resources
   */
  dispose() {
    if (this.mapLoader) {
      this.mapLoader.clearCache();
    }
    if (this.tilesetRenderer) {
      this.tilesetRenderer.clearCache();
    }
    if (this.objectSpawner) {
      this.objectSpawner.clearCache();
    }
    
    this.mapData = null;
    console.log('[MapSystem] Disposed');
  }
}

// Register globally
if (!window.PixelApocalypse) {
  window.PixelApocalypse = {};
}

window.PixelApocalypse.MapSystem = MapSystem;

console.log('MapSystem loaded');
