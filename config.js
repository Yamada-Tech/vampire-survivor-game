// ============================================================================
// Configuration File
// ============================================================================

const CONFIG = {
    // API Keys (set to empty string if not available)
    GOOGLE_STREET_VIEW_API_KEY: '', // Optional: For death screen street view
    
    // Map Settings
    MAP: {
        TILE_SIZE: 256,
        DEFAULT_ZOOM: 17,
        MIN_ZOOM: 15,
        MAX_ZOOM: 19,
        TILE_SERVER: 'https://tile.openstreetmap.org',
        USER_AGENT: 'PixelApocalypse/1.0'
    },
    
    // Game Settings
    GAME: {
        PLAYER_SPEED_MULTIPLIER: 1.5, // Speed multiplier for map-based movement
        ROAD_SNAP_DISTANCE: 50, // Distance to snap to nearest road (meters)
        PROGRESS_UPDATE_INTERVAL: 1000 // Update progress every 1 second (ms)
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
