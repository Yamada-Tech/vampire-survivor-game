// ============================================================================
// ObjectSpawner - Procedural Object Generation with Chunk-Based Placement
// ============================================================================

class ObjectSpawner {
  constructor(mapLoader, mapData) {
    this.mapLoader = mapLoader;
    this.mapData = mapData;
    this.objectCache = new Map();
    this.CHUNK_SIZE = 500;
    this.DENSITY_SCALE_FACTOR = 1000; // Normalizes density values across different chunk sizes
  }

  /**
   * Render objects for visible area
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   * @param {Object} biomeManager - Biome manager
   * @param {Object} collisionSystem - Collision system (optional)
   */
  renderObjects(ctx, camera, biomeManager, collisionSystem = null) {
    const bounds = camera.getViewBounds();
    const buffer = 200;
    
    // Calculate visible chunk range
    const startChunkX = Math.floor((bounds.left - buffer) / this.CHUNK_SIZE);
    const startChunkY = Math.floor((bounds.top - buffer) / this.CHUNK_SIZE);
    const endChunkX = Math.ceil((bounds.right + buffer) / this.CHUNK_SIZE);
    const endChunkY = Math.ceil((bounds.bottom + buffer) / this.CHUNK_SIZE);
    
    for (let chunkX = startChunkX; chunkX <= endChunkX; chunkX++) {
      for (let chunkY = startChunkY; chunkY <= endChunkY; chunkY++) {
        this.renderChunk(ctx, camera, chunkX, chunkY, biomeManager, collisionSystem);
      }
    }
  }

  /**
   * Render objects in a chunk
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   * @param {number} chunkX - Chunk X coordinate
   * @param {number} chunkY - Chunk Y coordinate
   * @param {Object} biomeManager - Biome manager
   * @param {Object} collisionSystem - Collision system (optional)
   */
  renderChunk(ctx, camera, chunkX, chunkY, biomeManager, collisionSystem = null) {
    const chunkKey = `${chunkX},${chunkY}`;
    
    // Generate chunk if not cached
    if (!this.objectCache.has(chunkKey)) {
      this.generateChunk(chunkX, chunkY, biomeManager, collisionSystem);
    }
    
    const objects = this.objectCache.get(chunkKey);
    if (!objects || objects.length === 0) {
      return;
    }
    
    // Render each object
    objects.forEach(obj => {
      // 画面内チェック（ワールド座標で）
      if (!camera.isInView(obj.x, obj.y, 100)) {
        return;
      }
      
      // 画面座標に変換
      const screenPos = camera.worldToScreen(obj.x, obj.y);
      
      const objDef = this.mapData.objects && this.mapData.objects[obj.type] ? this.mapData.objects[obj.type] : null;
      const image = this.mapLoader.getImage(`object_${obj.type}`);
      
      if (image && objDef) {
        this.drawObjectImage(ctx, image, objDef, screenPos.x, screenPos.y, obj.scale * camera.zoom, obj.hasCollision);
      } else {
        this.drawObjectFallback(ctx, obj.type, screenPos.x, screenPos.y, obj.scale * camera.zoom, obj.hasCollision, camera.zoom);
      }
    });
  }

  /**
   * Generate objects for a chunk
   * @param {number} chunkX - Chunk X coordinate
   * @param {number} chunkY - Chunk Y coordinate
   * @param {Object} biomeManager - Biome manager
   * @param {Object} collisionSystem - Collision system (optional)
   */
  generateChunk(chunkX, chunkY, biomeManager, collisionSystem = null) {
    const chunkKey = `${chunkX},${chunkY}`;
    const seed = this.hash(chunkX, chunkY);
    const rng = this.createSeededRandom(seed);
    
    const objects = [];
    const centerX = chunkX * this.CHUNK_SIZE + this.CHUNK_SIZE / 2;
    const centerY = chunkY * this.CHUNK_SIZE + this.CHUNK_SIZE / 2;
    
    // Get biome for this chunk
    const biome = biomeManager.getBiomeAt(centerX, centerY);
    
    if (!biome || !biome.objects || biome.objects.length === 0) {
      this.objectCache.set(chunkKey, objects);
      return;
    }
    
    // Generate objects based on biome configuration
    biome.objects.forEach(objConfig => {
      const density = objConfig.density || 0.05;
      const baseCount = Math.floor(density * this.CHUNK_SIZE * this.CHUNK_SIZE / this.DENSITY_SCALE_FACTOR);
      const objectCount = baseCount + Math.floor(rng() * (baseCount + 1));
      
      for (let i = 0; i < objectCount; i++) {
        const x = chunkX * this.CHUNK_SIZE + rng() * this.CHUNK_SIZE;
        const y = chunkY * this.CHUNK_SIZE + rng() * this.CHUNK_SIZE;
        const scale = 0.8 + rng() * 0.4; // 0.8-1.2x
        
        // Get object definition from map data
        const objDef = this.mapData.objects?.[objConfig.type];
        if (objDef) {
          // ★衝突判定フラグを追加（岩のみ通れない）
          const hasCollision = objConfig.type === 'rock';
          
          const obj = {
            type: objConfig.type,
            x,
            y,
            scale,
            width: objDef.width || 64,
            height: objDef.height || 96,
            parallax: objDef.parallax || 0.5,
            sprite: objDef.sprite,
            fallbackRender: objDef.fallbackRender !== false,
            hasCollision: hasCollision
          };
          
          objects.push(obj);
          
          // ★衝突判定を登録
          if (hasCollision && collisionSystem) {
            // オブジェクトの中心を基準に、サイズの約60%を衝突判定として使用
            const colliderSize = Math.max(objDef.width, objDef.height) * scale * 0.6;
            collisionSystem.addCollider(
              x - colliderSize / 2,
              y - colliderSize / 2,
              colliderSize,
              colliderSize,
              objConfig.type
            );
          }
        }
      }
    });
    
    this.objectCache.set(chunkKey, objects);
  }

  /**
   * Draw a single object
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} obj - Object data
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @param {number} scale - Scale with zoom applied
   */
  drawObject(ctx, obj, screenX, screenY, scale) {
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.scale(scale, scale);
    
    // Try to render with sprite image
    if (obj.sprite) {
      const img = this.mapLoader.getImage(obj.sprite);
      if (img && img.complete) {
        ctx.drawImage(img, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
        ctx.restore();
        return;
      }
    }
    
    // Fallback to programmatic rendering
    if (obj.fallbackRender) {
      this.drawFallbackObject(ctx, obj.type);
    }
    
    ctx.restore();
  }
  
  drawObjectImage(ctx, image, objDef, screenX, screenY, scale, hasCollision = false) {
    const width = objDef.width * scale;
    const height = objDef.height * scale;
    
    const anchor = objDef.anchor || { x: 0.5, y: 1 };
    const drawX = screenX - width * anchor.x;
    const drawY = screenY - height * anchor.y;
    
    ctx.drawImage(image, drawX, drawY, width, height);
    
    // ★衝突判定オブジェクトの強調表示（白枠）
    if (hasCollision) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(drawX, drawY, width, height);
      
      // 内側に影
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX + 2, drawY + 2, width - 4, height - 4);
    }
  }
  
  drawObjectFallback(ctx, type, screenX, screenY, scale, hasCollision = false, zoom = 1.0) {
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.scale(scale, scale);
    
    switch (type) {
      case 'tree':
        this.drawTree(ctx);
        break;
      case 'grave':
        this.drawGrave(ctx);
        break;
      case 'dead_tree':
        this.drawDeadTree(ctx);
        break;
      case 'rock':
        this.drawRock(ctx, hasCollision, zoom);
        break;
      default:
        this.drawPlaceholder(ctx);
    }
    
    ctx.restore();
  }

  /**
   * Draw object using fallback rendering
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} type - Object type
   */
  drawFallbackObject(ctx, type) {
    switch (type) {
      case 'tree':
        this.drawTree(ctx);
        break;
      case 'rock':
        this.drawRock(ctx);
        break;
      case 'grave':
        this.drawGrave(ctx);
        break;
      case 'dead_tree':
        this.drawDeadTree(ctx);
        break;
      case 'house':
        this.drawHouse(ctx);
        break;
      default:
        // Generic object
        ctx.fillStyle = '#888888';
        ctx.fillRect(-10, -10, 20, 20);
    }
  }

  // ========== Fallback Object Drawing Methods ==========

  drawTree(ctx) {
    // Trunk
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-5, -20, 10, 40);
    
    // Leaves (3 layers)
    ctx.fillStyle = '#2d5016';
    ctx.beginPath();
    ctx.arc(0, -35, 25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#3a6b1f';
    ctx.beginPath();
    ctx.arc(-10, -30, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(10, -30, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#4a8c2a';
    ctx.beginPath();
    ctx.arc(0, -25, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRock(ctx, hasCollision = false, zoom = 1.0) {
    // Rock (irregular ellipse)
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = '#9a9a9a';
    ctx.beginPath();
    ctx.ellipse(-5, -5, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // ★岩の強調表示（太い白枠）
    if (hasCollision) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      // 内側に影
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 13, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 5, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGrave(ctx) {
    // Gravestone body
    ctx.fillStyle = '#888888';
    ctx.fillRect(-10, -25, 20, 30);
    
    // Top arch
    ctx.beginPath();
    ctx.arc(0, -25, 10, Math.PI, 0);
    ctx.fill();
    
    // Cross
    ctx.fillStyle = '#666666';
    ctx.fillRect(-1, -20, 2, 10);
    ctx.fillRect(-5, -16, 10, 2);
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawDeadTree(ctx) {
    // Trunk (dark)
    ctx.fillStyle = '#4a3c2a';
    ctx.fillRect(-4, -20, 8, 35);
    
    // Dead branches
    ctx.strokeStyle = '#3a2c1a';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(-15, -25);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(12, -22);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(-10, -10);
    ctx.stroke();
  }

  drawHouse(ctx) {
    // Walls
    ctx.fillStyle = '#d2b48c';
    ctx.fillRect(-30, -25, 60, 50);
    
    // Roof
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(-35, -25);
    ctx.lineTo(0, -50);
    ctx.lineTo(35, -25);
    ctx.closePath();
    ctx.fill();
    
    // Windows
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-20, -15, 12, 12);
    ctx.fillRect(8, -15, 12, 12);
    
    // Window frames
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(-20, -15, 12, 12);
    ctx.strokeRect(8, -15, 12, 12);
    
    // Door
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-8, 0, 16, 25);
    
    // Door knob
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(5, 12, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawPlaceholder(ctx) {
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(-10, -10, 20, 20);
  }

  // ========== Utility Methods ==========

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
   * Clear distant chunks from cache
   * @param {number} cameraX - Camera X position
   * @param {number} cameraY - Camera Y position
   */
  clearDistantChunks(cameraX, cameraY) {
    const currentChunkX = Math.floor(cameraX / this.CHUNK_SIZE);
    const currentChunkY = Math.floor(cameraY / this.CHUNK_SIZE);
    const MAX_DISTANCE = 5; // 5 chunks away
    
    const keysToDelete = [];
    
    this.objectCache.forEach((value, key) => {
      const [chunkX, chunkY] = key.split(',').map(Number);
      const distance = Math.max(
        Math.abs(chunkX - currentChunkX),
        Math.abs(chunkY - currentChunkY)
      );
      
      if (distance > MAX_DISTANCE) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.objectCache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`[ObjectSpawner] Cleared ${keysToDelete.length} distant chunks`);
    }
  }

  /**
   * Clear all cached objects
   */
  clearCache() {
    this.objectCache.clear();
    console.log('[ObjectSpawner] Cache cleared');
  }

  /**
   * Update map data
   * @param {Object} mapData - New map data
   */
  updateMapData(mapData) {
    this.mapData = mapData;
    this.clearCache();
  }
}

// Register globally
if (!window.PixelApocalypse) {
  window.PixelApocalypse = {};
}

window.PixelApocalypse.ObjectSpawner = ObjectSpawner;

console.log('ObjectSpawner loaded');
