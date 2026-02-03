// ============================================================================
// MapLoader - JSON-based Map Definition Loader
// ============================================================================

class MapLoader {
  constructor() {
    this.loadedMaps = new Map();
    this.imageCache = new Map();
  }

  /**
   * Load a map definition from JSON
   * @param {string} mapPath - Path to the map JSON file
   * @returns {Promise<Object>} - Loaded and validated map data
   */
  async loadMap(mapPath) {
    try {
      // Check cache
      if (this.loadedMaps.has(mapPath)) {
        console.log(`[MapLoader] Using cached map: ${mapPath}`);
        return this.loadedMaps.get(mapPath);
      }

      console.log(`[MapLoader] Loading map from: ${mapPath}`);
      
      // Fetch JSON
      const response = await fetch(mapPath);
      if (!response.ok) {
        throw new Error(`Failed to load map: ${response.statusText}`);
      }
      
      const mapData = await response.json();
      
      // Validate map data
      this.validateMapData(mapData);
      
      // Preload images if specified
      await this.preloadImages(mapData);
      
      // Cache the loaded map
      this.loadedMaps.set(mapPath, mapData);
      
      console.log(`[MapLoader] Successfully loaded map: ${mapData.name}`);
      return mapData;
      
    } catch (error) {
      console.error(`[MapLoader] Error loading map:`, error);
      // Return fallback map
      return this.getFallbackMap();
    }
  }

  /**
   * Validate map data structure
   * @param {Object} mapData - Map data to validate
   * @throws {Error} - If validation fails
   */
  validateMapData(mapData) {
    // Required fields
    if (!mapData.name) {
      throw new Error('Map must have a name');
    }
    
    if (!mapData.tileSize || typeof mapData.tileSize !== 'number') {
      throw new Error('Map must have a valid tileSize');
    }
    
    if (!Array.isArray(mapData.biomes) || mapData.biomes.length === 0) {
      throw new Error('Map must have at least one biome');
    }
    
    // Validate biomes
    mapData.biomes.forEach((biome, index) => {
      if (!biome.id) {
        throw new Error(`Biome ${index} must have an id`);
      }
      
      if (!biome.bounds || typeof biome.bounds !== 'object') {
        throw new Error(`Biome ${biome.id} must have bounds`);
      }
      
      const { x, y, width, height } = biome.bounds;
      if (typeof x !== 'number' || typeof y !== 'number' || 
          typeof width !== 'number' || typeof height !== 'number') {
        throw new Error(`Biome ${biome.id} has invalid bounds`);
      }
      
      // Ensure fallback colors exist
      if (!Array.isArray(biome.fallbackColors) || biome.fallbackColors.length === 0) {
        console.warn(`Biome ${biome.id} has no fallback colors, using default`);
        biome.fallbackColors = ['#5a8c3a'];
      }
    });
    
    console.log('[MapLoader] Map validation passed');
  }

  /**
   * Preload images specified in map data
   * @param {Object} mapData - Map data
   * @returns {Promise<void>}
   */
  async preloadImages(mapData) {
    const imagesToLoad = [];
    
    // Collect tileset images
    if (mapData.biomes) {
      mapData.biomes.forEach(biome => {
        if (biome.groundTiles && Array.isArray(biome.groundTiles)) {
          biome.groundTiles.forEach(tile => {
            if (tile.sprite) {
              imagesToLoad.push(tile.sprite);
            }
          });
        }
      });
    }
    
    // Collect object images
    if (mapData.objects) {
      Object.values(mapData.objects).forEach(obj => {
        if (obj.sprite) {
          imagesToLoad.push(obj.sprite);
        }
      });
    }
    
    // Load all images
    const loadPromises = imagesToLoad.map(src => this.loadImage(src));
    const results = await Promise.allSettled(loadPromises);
    
    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[MapLoader] Preloaded ${successful} images, ${failed} failed (will use fallback)`);
  }

  /**
   * Load a single image
   * @param {string} src - Image source path
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(src) {
    // Check cache
    if (this.imageCache.has(src)) {
      return Promise.resolve(this.imageCache.get(src));
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.imageCache.set(src, img);
        console.log(`[MapLoader] Loaded image: ${src}`);
        resolve(img);
      };
      
      img.onerror = () => {
        console.warn(`[MapLoader] Failed to load image: ${src}`);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  }

  /**
   * Get cached image
   * @param {string} src - Image source path
   * @returns {HTMLImageElement|null}
   */
  getImage(src) {
    return this.imageCache.get(src) || null;
  }

  /**
   * Get fallback map for error cases
   * @returns {Object} - Basic fallback map
   */
  getFallbackMap() {
    console.warn('[MapLoader] Using fallback map');
    
    return {
      name: 'Fallback Map',
      tileSize: 32,
      biomes: [
        {
          id: 'grassland',
          bounds: { x: -10000, y: -10000, width: 20000, height: 20000 },
          groundTiles: ['grass1', 'grass2'],
          weights: [0.7, 0.3],
          fallbackColors: ['#5a8c3a', '#4a7c2a'],
          objects: [
            { type: 'tree', density: 0.05 }
          ]
        }
      ],
      objects: {
        tree: {
          width: 64,
          height: 96,
          parallax: 0.5,
          fallbackRender: true
        }
      },
      sky: {
        colors: ['#4a90d9', '#87CEEB', '#b8e0f0'],
        height: 0.3
      },
      farBackground: {
        enabled: true,
        parallax: 0.2
      }
    };
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.loadedMaps.clear();
    this.imageCache.clear();
    console.log('[MapLoader] Cache cleared');
  }
}

// Register globally
if (!window.PixelApocalypse) {
  window.PixelApocalypse = {};
}

window.PixelApocalypse.MapLoader = MapLoader;

console.log('MapLoader loaded');
