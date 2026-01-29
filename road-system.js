// ============================================================================
// Road System
// Manages road data loading and caching
// ============================================================================

class RoadSystem {
    constructor() {
        this.roadData = {};
        this.lastOverpassCall = 0;
    }
    
    // Get road data for a route
    getRoadData(routeId) {
        // Check if preset route data exists
        if (typeof ROAD_DATA !== 'undefined' && ROAD_DATA[routeId]) {
            return ROAD_DATA[routeId];
        }
        
        // Check localStorage cache for custom routes
        if (typeof localStorage !== 'undefined') {
            const cached = localStorage.getItem(CONFIG.CACHE_KEYS.ROAD_DATA_PREFIX + routeId);
            if (cached) {
                try {
                    return JSON.parse(cached);
                } catch (e) {
                    console.error('Failed to parse cached road data:', e);
                }
            }
        }
        
        return null;
    }
    
    // Fetch road data from Overpass API (for custom routes)
    async fetchRoadData(bounds) {
        // Rate limiting check
        const now = Date.now();
        const timeSinceLastCall = now - this.lastOverpassCall;
        if (timeSinceLastCall < CONFIG.RATE_LIMIT.OVERPASS_MIN_INTERVAL) {
            await new Promise(resolve => 
                setTimeout(resolve, CONFIG.RATE_LIMIT.OVERPASS_MIN_INTERVAL - timeSinceLastCall)
            );
        }
        
        const query = `
            [out:json][timeout:25];
            (
                way["highway"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
            );
            out geom;
        `;
        
        try {
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            
            this.lastOverpassCall = Date.now();
            
            const data = await response.json();
            
            // Process and simplify the data
            const processedData = this.processOverpassData(data, bounds);
            
            // Cache the data
            if (typeof localStorage !== 'undefined') {
                const cacheKey = `${bounds.south}_${bounds.west}_${bounds.north}_${bounds.east}`;
                localStorage.setItem(
                    CONFIG.CACHE_KEYS.ROAD_DATA_PREFIX + cacheKey,
                    JSON.stringify(processedData)
                );
            }
            
            return processedData;
        } catch (error) {
            console.error('Failed to fetch road data from Overpass API:', error);
            return null;
        }
    }
    
    // Process Overpass API response
    processOverpassData(data, bounds) {
        const ways = [];
        
        if (data.elements) {
            data.elements.forEach(element => {
                if (element.type === 'way' && element.geometry) {
                    ways.push({
                        id: element.id,
                        nodes: element.geometry.map(node => ({
                            lat: node.lat,
                            lon: node.lon
                        }))
                    });
                }
            });
        }
        
        return {
            ways: ways,
            bounds: bounds
        };
    }
    
    // Find nearest road point to given coordinates
    findNearestRoadPoint(lat, lon, roadData) {
        if (!roadData || !roadData.ways) {
            return { lat, lon };
        }
        
        let nearestPoint = { lat, lon };
        let minDistance = Infinity;
        
        roadData.ways.forEach(way => {
            way.nodes.forEach(node => {
                const dist = this.calculateDistance(lat, lon, node.lat, node.lon);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestPoint = { lat: node.lat, lon: node.lon };
                }
            });
        });
        
        return nearestPoint;
    }
    
    // Calculate distance between two points (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }
    
    // Get all road nodes as an array
    getAllRoadNodes(roadData) {
        const nodes = [];
        
        if (roadData && roadData.ways) {
            roadData.ways.forEach(way => {
                way.nodes.forEach(node => {
                    nodes.push(node);
                });
            });
        }
        
        return nodes;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoadSystem;
}
