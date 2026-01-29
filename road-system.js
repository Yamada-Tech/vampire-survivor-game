// ============================================================================
// Road System
// Manages road data loading and caching
// ============================================================================

// ============================================================================
// Road Network Class
// Handles road data processing, spatial indexing, and movement restriction
// ============================================================================

class RoadNetwork {
    constructor(roadData, hasBuildingData = false) {
        this.roads = [];
        this.roadSegments = [];
        this.spatialIndex = new Map(); // Spatial grid for fast lookups
        this.gridSize = 0.0005; // Smaller grid size for better precision (~55m)
        this.hasBuildingData = hasBuildingData; // Whether building data is available
        
        if (roadData) {
            this.buildRoadNetwork(roadData);
        }
    }
    
    // Convert road tolerance from meters to degrees
    getRoadToleranceDegrees(lat) {
        const metersPerDegree = 111320 * Math.cos(lat * Math.PI / 180);
        // Use strict tolerance only when building data is available
        const toleranceMeters = this.hasBuildingData ? 
            CONFIG.GAME.ROAD_TOLERANCE_METERS_STRICT : 
            CONFIG.GAME.ROAD_TOLERANCE_METERS;
        return toleranceMeters / metersPerDegree;
    }
    
    buildRoadNetwork(roadData) {
        if (!roadData || !roadData.ways) {
            console.warn('No road data to build network from');
            return;
        }
        
        // Process each way (road) from the data
        roadData.ways.forEach(way => {
            if (!way.nodes || way.nodes.length < 2) return;
            
            const road = {
                id: way.id,
                nodes: way.nodes,
                segments: []
            };
            
            // Split road into segments
            for (let i = 0; i < way.nodes.length - 1; i++) {
                const segment = {
                    start: { lat: way.nodes[i].lat, lon: way.nodes[i].lon },
                    end: { lat: way.nodes[i + 1].lat, lon: way.nodes[i + 1].lon },
                    roadId: road.id
                };
                
                road.segments.push(segment);
                this.roadSegments.push(segment);
                this.addToSpatialIndex(segment);
            }
            
            this.roads.push(road);
        });
        
        console.log(`[ROAD NETWORK] Built road network: ${this.roads.length} roads, ${this.roadSegments.length} segments`);
    }
    
    addToSpatialIndex(segment) {
        const minLat = Math.min(segment.start.lat, segment.end.lat);
        const maxLat = Math.max(segment.start.lat, segment.end.lat);
        const minLon = Math.min(segment.start.lon, segment.end.lon);
        const maxLon = Math.max(segment.start.lon, segment.end.lon);
        
        const startGridX = Math.floor(minLon / this.gridSize);
        const endGridX = Math.floor(maxLon / this.gridSize);
        const startGridY = Math.floor(minLat / this.gridSize);
        const endGridY = Math.floor(maxLat / this.gridSize);
        
        // Add segment to all grid cells it intersects
        for (let gx = startGridX; gx <= endGridX; gx++) {
            for (let gy = startGridY; gy <= endGridY; gy++) {
                const key = `${gx},${gy}`;
                if (!this.spatialIndex.has(key)) {
                    this.spatialIndex.set(key, []);
                }
                this.spatialIndex.get(key).push(segment);
            }
        }
    }
    
    // Find nearest road segment to a given point (more strict)
    findNearestRoad(lat, lon, maxDistance = null) {
        // Use configured tolerance if no maxDistance specified
        if (maxDistance === null) {
            maxDistance = this.getRoadToleranceDegrees(lat);
        }
        
        const gridX = Math.floor(lon / this.gridSize);
        const gridY = Math.floor(lat / this.gridSize);
        
        let nearestSegment = null;
        let nearestDistance = Infinity;
        let nearestPoint = null;
        
        // Search surrounding grid cells (5x5 for better coverage)
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                const key = `${gridX + dx},${gridY + dy}`;
                const segments = this.spatialIndex.get(key);
                
                if (segments) {
                    segments.forEach(segment => {
                        const result = this.pointToSegmentDistance(lat, lon, segment);
                        if (result.distance < nearestDistance) {
                            nearestDistance = result.distance;
                            nearestSegment = segment;
                            nearestPoint = result.point;
                        }
                    });
                }
            }
        }
        
        if (nearestDistance <= maxDistance) {
            return { 
                segment: nearestSegment, 
                point: nearestPoint, 
                distance: nearestDistance 
            };
        }
        
        return null;
    }
    
    // Calculate distance from point to line segment
    pointToSegmentDistance(lat, lon, segment) {
        const x = lon;
        const y = lat;
        const x1 = segment.start.lon;
        const y1 = segment.start.lat;
        const x2 = segment.end.lon;
        const y2 = segment.end.lat;
        
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return { 
            distance, 
            point: { lat: yy, lon: xx }
        };
    }
    
    // Check if a point is on a road (strict checking)
    isOnRoad(lat, lon, tolerance = null) {
        if (tolerance === null) {
            tolerance = this.getRoadToleranceDegrees(lat);
        }
        const nearest = this.findNearestRoad(lat, lon, tolerance);
        
        if (!nearest && CONFIG.GAME.DEBUG_MODE) {
            console.log(`[ROAD CHECK] Position (${lat.toFixed(6)}, ${lon.toFixed(6)}) is NOT on road`);
        }
        
        return nearest !== null;
    }
    
    // Get all segments for rendering
    getAllSegments() {
        return this.roadSegments;
    }
}

// ============================================================================
// Building System Class
// Handles building collision detection
// ============================================================================

class BuildingSystem {
    constructor(buildingData) {
        this.buildings = [];
        
        if (buildingData) {
            this.buildBuildings(buildingData);
        }
    }
    
    buildBuildings(data) {
        if (!data || !data.elements) {
            console.warn('No building data to build from');
            return;
        }
        
        data.elements.forEach(element => {
            // Building polygons (ways with building tag)
            if (element.type === 'way' && element.tags && element.tags.building) {
                const building = {
                    id: element.id,
                    type: element.tags.building,
                    name: element.tags.name || 'Building',
                    polygon: []
                };
                
                // Get polygon coordinates
                if (element.geometry && element.geometry.length >= 3) {
                    building.polygon = element.geometry.map(node => ({
                        lat: node.lat,
                        lon: node.lon
                    }));
                } else if (element.nodes && element.nodes.length >= 3) {
                    // If nodes are just IDs, we need the node data (usually in elements)
                    building.polygon = element.nodes.map(nodeId => {
                        const node = data.elements.find(e => e.type === 'node' && e.id === nodeId);
                        return node ? { lat: node.lat, lon: node.lon } : null;
                    }).filter(n => n !== null);
                }
                
                if (building.polygon.length >= 3) {
                    this.buildings.push(building);
                }
            }
        });
        
        console.log(`[BUILDING SYSTEM] Loaded ${this.buildings.length} buildings`);
    }
    
    // Check if a point is inside a polygon using Ray Casting Algorithm
    isPointInPolygon(lat, lon, polygon) {
        let inside = false;
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].lon;
            const yi = polygon[i].lat;
            const xj = polygon[j].lon;
            const yj = polygon[j].lat;
            
            const intersect = ((yi > lat) !== (yj > lat)) &&
                (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
            
            if (intersect) inside = !inside;
        }
        
        return inside;
    }
    
    // Check if a position is inside any building
    isInsideBuilding(lat, lon) {
        for (const building of this.buildings) {
            if (this.isPointInPolygon(lat, lon, building.polygon)) {
                if (CONFIG.GAME.DEBUG_MODE) {
                    console.log(`[COLLISION] Inside building: ${building.name}`);
                }
                return true;
            }
        }
        return false;
    }
    
    // Get all buildings for rendering
    getAllBuildings() {
        return this.buildings;
    }
}

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
        
        // Fetch both roads and buildings
        const query = `
            [out:json][timeout:25];
            (
                way["highway"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
                way["building"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
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
                // Only process highways (roads), not buildings
                if (element.type === 'way' && element.geometry && element.tags && element.tags.highway) {
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
            bounds: bounds,
            elements: data.elements // Keep raw elements for building processing
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
