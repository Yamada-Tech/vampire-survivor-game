// ============================================================================
// Map Renderer
// Renders OpenStreetMap tiles on canvas
// ============================================================================

class MapRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileCache = new Map();
        this.tileSize = CONFIG.MAP.TILE_SIZE;
        this.loadingTiles = new Set();
        
        // Tile loading queue
        this.tileQueue = [];
        this.maxConcurrentLoads = 6;
        this.currentLoads = 0;
    }
    
    // Convert lat/lon to tile coordinates
    latLonToTile(lat, lon, zoom) {
        const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
        const latRad = lat * Math.PI / 180;
        const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * Math.pow(2, zoom));
        return { x, y, zoom };
    }
    
    // Convert lat/lon to pixel coordinates within a tile
    latLonToPixel(lat, lon, zoom) {
        const scale = Math.pow(2, zoom);
        const worldX = ((lon + 180) / 360) * scale;
        const latRad = lat * Math.PI / 180;
        const worldY = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
        
        return {
            x: worldX * this.tileSize,
            y: worldY * this.tileSize
        };
    }
    
    // Load a tile image
    async loadTile(x, y, zoom) {
        const key = `${zoom}/${x}/${y}`;
        
        // Check cache first
        if (this.tileCache.has(key)) {
            return this.tileCache.get(key);
        }
        
        // Check if already loading
        if (this.loadingTiles.has(key)) {
            return null;
        }
        
        this.loadingTiles.add(key);
        
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.tileCache.set(key, img);
                this.loadingTiles.delete(key);
                this.currentLoads--;
                this.processQueue();
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`Failed to load tile: ${key}`);
                this.loadingTiles.delete(key);
                this.currentLoads--;
                this.processQueue();
                resolve(null);
            };
            
            // OpenStreetMap tile server
            img.src = `${CONFIG.MAP.TILE_SERVER}/${zoom}/${x}/${y}.png`;
        });
    }
    
    // Queue tile loading
    queueTileLoad(x, y, zoom) {
        const key = `${zoom}/${x}/${y}`;
        
        if (!this.tileCache.has(key) && !this.loadingTiles.has(key)) {
            this.tileQueue.push({ x, y, zoom });
        }
    }
    
    // Process tile loading queue
    processQueue() {
        while (this.currentLoads < this.maxConcurrentLoads && this.tileQueue.length > 0) {
            const tile = this.tileQueue.shift();
            this.currentLoads++;
            this.loadTile(tile.x, tile.y, tile.zoom);
        }
    }
    
    // Render map centered on given coordinates
    async render(centerLat, centerLon, zoom, canvasWidth, canvasHeight) {
        // Clear canvas
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Calculate center pixel position
        const centerPixel = this.latLonToPixel(centerLat, centerLon, zoom);
        
        // Calculate which tiles are visible (with buffer)
        const bufferTiles = CONFIG.MAP.BUFFER_TILES || 2;
        const tilesX = Math.ceil(canvasWidth / this.tileSize) + bufferTiles * 2;
        const tilesY = Math.ceil(canvasHeight / this.tileSize) + bufferTiles * 2;
        
        const centerTile = this.latLonToTile(centerLat, centerLon, zoom);
        
        // Draw tiles
        for (let dx = -Math.ceil(tilesX/2); dx <= Math.ceil(tilesX/2); dx++) {
            for (let dy = -Math.ceil(tilesY/2); dy <= Math.ceil(tilesY/2); dy++) {
                const tileX = centerTile.x + dx;
                const tileY = centerTile.y + dy;
                
                // Calculate screen position
                const screenX = (canvasWidth / 2) + (tileX - centerTile.x) * this.tileSize - (centerPixel.x % this.tileSize);
                const screenY = (canvasHeight / 2) + (tileY - centerTile.y) * this.tileSize - (centerPixel.y % this.tileSize);
                
                // Queue or draw tile
                const tile = this.tileCache.get(`${zoom}/${tileX}/${tileY}`);
                
                if (tile) {
                    this.ctx.drawImage(tile, screenX, screenY, this.tileSize, this.tileSize);
                } else {
                    // Draw placeholder with better styling
                    this.ctx.fillStyle = '#1a1a2e';
                    this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                    this.ctx.strokeStyle = '#3a3a5c';
                    this.ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
                    
                    // Add loading indicator
                    this.ctx.fillStyle = '#555';
                    this.ctx.font = '12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('Loading...', screenX + this.tileSize / 2, screenY + this.tileSize / 2);
                    
                    // Queue for loading
                    this.queueTileLoad(tileX, tileY, zoom);
                }
            }
        }
        
        // Process loading queue
        this.processQueue();
    }
    
    // Draw a route path on the map
    drawRoutePath(roadData, centerLat, centerLon, zoom, canvasWidth, canvasHeight, color = '#FF0000', lineWidth = 3) {
        if (!roadData || !roadData.ways) return;
        
        const centerPixel = this.latLonToPixel(centerLat, centerLon, zoom);
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        roadData.ways.forEach(way => {
            if (way.nodes.length < 2) return;
            
            this.ctx.beginPath();
            
            way.nodes.forEach((node, index) => {
                const nodePixel = this.latLonToPixel(node.lat, node.lon, zoom);
                const screenX = (canvasWidth / 2) + (nodePixel.x - centerPixel.x);
                const screenY = (canvasHeight / 2) + (nodePixel.y - centerPixel.y);
                
                if (index === 0) {
                    this.ctx.moveTo(screenX, screenY);
                } else {
                    this.ctx.lineTo(screenX, screenY);
                }
            });
            
            this.ctx.stroke();
        });
    }
    
    // Draw a marker on the map
    drawMarker(lat, lon, centerLat, centerLon, zoom, canvasWidth, canvasHeight, color = '#FF0000', size = 10, label = '') {
        const markerPixel = this.latLonToPixel(lat, lon, zoom);
        const centerPixel = this.latLonToPixel(centerLat, centerLon, zoom);
        
        const screenX = (canvasWidth / 2) + (markerPixel.x - centerPixel.x);
        const screenY = (canvasHeight / 2) + (markerPixel.y - centerPixel.y);
        
        // Draw marker
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw border
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw label if provided
        if (label) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(label, screenX, screenY - size - 5);
        }
    }
    
    // Draw roads on the map (for visualization and debugging)
    drawRoads(roadNetwork, centerLat, centerLon, zoom, canvasWidth, canvasHeight) {
        if (!roadNetwork || !CONFIG.GAME.SHOW_ROADS) return;
        
        const segments = roadNetwork.getAllSegments();
        if (!segments || segments.length === 0) return;
        
        const centerPixel = this.latLonToPixel(centerLat, centerLon, zoom);
        
        this.ctx.strokeStyle = CONFIG.GAME.ROAD_COLOR;
        this.ctx.lineWidth = CONFIG.GAME.ROAD_LINE_WIDTH;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        segments.forEach(segment => {
            const startPixel = this.latLonToPixel(segment.start.lat, segment.start.lon, zoom);
            const endPixel = this.latLonToPixel(segment.end.lat, segment.end.lon, zoom);
            
            const startX = (canvasWidth / 2) + (startPixel.x - centerPixel.x);
            const startY = (canvasHeight / 2) + (startPixel.y - centerPixel.y);
            const endX = (canvasWidth / 2) + (endPixel.x - centerPixel.x);
            const endY = (canvasHeight / 2) + (endPixel.y - centerPixel.y);
            
            // Simple on-screen check
            if (this.isSegmentOnScreen(startX, startY, endX, endY, canvasWidth, canvasHeight)) {
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
            }
        });
    }
    
    // Check if a segment is on screen
    isSegmentOnScreen(x1, y1, x2, y2, width, height) {
        // Simple bounding box check
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        
        return maxX >= 0 && minX <= width && maxY >= 0 && minY <= height;
    }
    
    // Clear tile cache
    clearCache() {
        this.tileCache.clear();
        this.loadingTiles.clear();
        this.tileQueue = [];
    }
    
    // Get cache size
    getCacheSize() {
        return this.tileCache.size;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapRenderer;
}
