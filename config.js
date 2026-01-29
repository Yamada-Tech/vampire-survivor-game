// ============================================================================
// Configuration File
// ============================================================================

const CONFIG = {
    // API Keys (set to empty string if not available)
    GOOGLE_STREET_VIEW_API_KEY: '', // Optional: For death screen street view
    
    // Map Settings
    MAP: {
        TILE_SIZE: 256,
        DEFAULT_ZOOM: 19, // Very detailed street level (close-up view)
        MIN_ZOOM: 17, // Minimum zoom (wider area)
        MAX_ZOOM: 21, // Maximum zoom (very close)
        TILE_SERVER: 'https://tile.openstreetmap.org',
        USER_AGENT: 'PixelApocalypse/1.0',
        BUFFER_TILES: 2 // Number of tiles to buffer outside visible area
    },
    
    // Game Settings
    GAME: {
        // Real-world sizes in meters
        PLAYER_SIZE_METERS: 0.5, // Human shoulder width (actual size)
        ENEMY_SIZE_METERS: 0.5, // Same as player
        
        // Character sizes (pixels) - will be calculated dynamically based on zoom
        PLAYER_SIZE: 4, // Fallback for non-map mode
        ENEMY_SIZE_NORMAL: 4,
        ENEMY_SIZE_FAST: 3,
        ENEMY_SIZE_TANK: 5,
        
        // Movement speeds (meters per second)
        PLAYER_SPEED_MS: 2.5, // 2.5 m/s = ~9 km/h (jogging speed)
        ENEMY_SPEED_NORMAL_MS: 1.8, // 1.8 m/s = ~6.5 km/h (walking speed)
        ENEMY_SPEED_FAST_MS: 2.8, // 2.8 m/s = ~10 km/h
        ENEMY_SPEED_TANK_MS: 1.2, // 1.2 m/s = ~4.3 km/h (slow walk)
        
        // Road restriction settings (strict when building data available, lenient otherwise)
        ROAD_TOLERANCE_METERS: 8.0, // Allow 8 meters from road (stricter with buildings)
        ROAD_TOLERANCE_METERS_STRICT: 2.0, // Only 2 meters when buildings are present
        ROAD_SNAP_DISTANCE: 0.00008, // Distance to snap to nearest road (degrees, ~9m)
        ROAD_TOLERANCE: 0.00005, // Tolerance for being "on road" (degrees, ~5.5m)
        PROGRESS_UPDATE_INTERVAL: 1000, // Update progress every 1 second (ms)
        
        // Road and building visualization
        SHOW_ROADS: true, // Whether to highlight roads visually
        ROAD_COLOR: 'rgba(0, 255, 0, 0.3)', // Green highlight for roads
        ROAD_LINE_WIDTH: 2,
        SHOW_BUILDINGS: true, // Whether to show buildings
        BUILDING_COLOR: 'rgba(255, 0, 0, 0.2)', // Red fill for buildings
        BUILDING_STROKE_COLOR: 'rgba(255, 0, 0, 0.5)', // Red border for buildings
        DEBUG_MODE: false // Enable debug visualization (set to true to see road/building overlays)
    },
    
    // API Rate Limiting
    RATE_LIMIT: {
        NOMINATIM_MIN_INTERVAL: 1000, // 1 second between Nominatim requests
        OVERPASS_MIN_INTERVAL: 5000, // 5 seconds between Overpass requests
        TILE_CACHE_DURATION: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    },
    
    // Cache Keys
    CACHE_KEYS: {
        ROAD_DATA_PREFIX: 'roadData_',
        TILE_CACHE_PREFIX: 'tileCache_',
        LAST_ROUTE: 'lastSelectedRoute'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
