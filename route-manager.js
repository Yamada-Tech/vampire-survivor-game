// ============================================================================
// Route Manager
// Manages route selection, preset routes, and custom routes
// ============================================================================

const PRESET_ROUTES = [
    {
        id: 'tokyo-shibuya-shinjuku',
        name: '渋谷 → 新宿',
        location: '東京',
        start: { lat: 35.6580, lon: 139.7016, name: '渋谷駅' },
        goal: { lat: 35.6896, lon: 139.6917, name: '新宿駅' },
        distance: 3500, // meters
        estimatedTime: '5-8分',
        difficulty: { stars: 2, label: '普通' },
        description: '都心の賑やかな街を駆け抜けろ！'
    },
    {
        id: 'osaka-umeda-namba',
        name: '梅田 → 難波',
        location: '大阪',
        start: { lat: 34.7024, lon: 135.4959, name: '梅田駅' },
        goal: { lat: 34.6681, lon: 135.5010, name: '難波駅' },
        distance: 4200,
        estimatedTime: '6-10分',
        difficulty: { stars: 3, label: 'やや難' },
        description: '大阪の中心部を縦断するハードコース'
    },
    {
        id: 'kyoto-station-kiyomizu',
        name: '京都駅 → 清水寺',
        location: '京都',
        start: { lat: 34.9851, lon: 135.7589, name: '京都駅' },
        goal: { lat: 34.9949, lon: 135.7850, name: '清水寺' },
        distance: 2800,
        estimatedTime: '4-6分',
        difficulty: { stars: 2, label: '簡単' },
        description: '古都の風情を感じながら生き残れ'
    },
    {
        id: 'tokyo-tower-skytree',
        name: '東京タワー → スカイツリー',
        location: '東京',
        start: { lat: 35.6586, lon: 139.7454, name: '東京タワー' },
        goal: { lat: 35.7101, lon: 139.8107, name: 'スカイツリー' },
        distance: 8500,
        estimatedTime: '12-18分',
        difficulty: { stars: 5, label: '超難' },
        description: '東京横断！最難関の長距離サバイバル'
    },
    {
        id: 'yokohama-station-chinatown',
        name: '横浜駅 → 中華街',
        location: '神奈川',
        start: { lat: 35.4657, lon: 139.6220, name: '横浜駅' },
        goal: { lat: 35.4437, lon: 139.6458, name: '中華街' },
        distance: 3200,
        estimatedTime: '5-7分',
        difficulty: { stars: 2, label: '普通' },
        description: '港町を疾走するミッドレンジコース'
    },
    {
        id: 'custom',
        name: 'カスタムルート',
        location: '自由設定',
        isCustom: true,
        description: '好きな場所でプレイしよう！'
    }
];

class RouteManager {
    constructor() {
        this.currentRoute = null;
        this.customRoute = {
            start: null,
            goal: null,
            distance: 0,
            difficulty: null,
            estimatedTime: null
        };
        this.lastNominatimCall = 0;
    }
    
    // Get all preset routes
    getPresetRoutes() {
        return PRESET_ROUTES;
    }
    
    // Calculate distance using Haversine formula
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
        
        return R * c; // Distance in meters
    }
    
    // Calculate route statistics (difficulty and estimated time)
    calculateRouteStats(distance) {
        let difficulty;
        if (distance < 3000) {
            difficulty = { stars: 1, label: '簡単' };
        } else if (distance < 4000) {
            difficulty = { stars: 2, label: '普通' };
        } else if (distance < 6000) {
            difficulty = { stars: 3, label: 'やや難' };
        } else if (distance < 8000) {
            difficulty = { stars: 4, label: '難しい' };
        } else {
            difficulty = { stars: 5, label: '超難' };
        }
        
        // Play time calculation (assuming average speed of 100m/min)
        const minMinutes = Math.floor(distance / 1200);
        const maxMinutes = Math.ceil(distance / 600);
        const estimatedTime = `${minMinutes}-${maxMinutes}分`;
        
        return { difficulty, estimatedTime };
    }
    
    // Select a route
    selectRoute(route) {
        this.currentRoute = route;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(CONFIG.CACHE_KEYS.LAST_ROUTE, route.id);
        }
        return route;
    }
    
    // Get current route
    getCurrentRoute() {
        return this.currentRoute;
    }
    
    // Geocode address using Nominatim API (with rate limiting)
    async geocodeAddress(address) {
        // Rate limiting check
        const now = Date.now();
        const timeSinceLastCall = now - this.lastNominatimCall;
        if (timeSinceLastCall < CONFIG.RATE_LIMIT.NOMINATIM_MIN_INTERVAL) {
            await new Promise(resolve => 
                setTimeout(resolve, CONFIG.RATE_LIMIT.NOMINATIM_MIN_INTERVAL - timeSinceLastCall)
            );
        }
        
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `format=json&q=${encodeURIComponent(address)}&limit=1`,
                {
                    headers: {
                        'User-Agent': CONFIG.MAP.USER_AGENT
                    }
                }
            );
            
            this.lastNominatimCall = Date.now();
            
            const results = await response.json();
            if (results.length > 0) {
                return {
                    lat: parseFloat(results[0].lat),
                    lon: parseFloat(results[0].lon),
                    name: address,
                    display_name: results[0].display_name
                };
            }
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }
    
    // Update custom route point
    setCustomPoint(type, location) {
        if (type === 'start') {
            this.customRoute.start = location;
        } else if (type === 'goal') {
            this.customRoute.goal = location;
        }
        
        // Update route info if both points are set
        if (this.customRoute.start && this.customRoute.goal) {
            const distance = this.calculateDistance(
                this.customRoute.start.lat,
                this.customRoute.start.lon,
                this.customRoute.goal.lat,
                this.customRoute.goal.lon
            );
            
            const stats = this.calculateRouteStats(distance);
            
            this.customRoute.distance = distance;
            this.customRoute.difficulty = stats.difficulty;
            this.customRoute.estimatedTime = stats.estimatedTime;
            
            return this.customRoute;
        }
        
        return null;
    }
    
    // Create custom route object
    createCustomRoute() {
        if (!this.customRoute.start || !this.customRoute.goal) {
            return null;
        }
        
        return {
            id: 'custom-' + Date.now(),
            name: `${this.customRoute.start.name} → ${this.customRoute.goal.name}`,
            location: 'カスタム',
            start: this.customRoute.start,
            goal: this.customRoute.goal,
            distance: this.customRoute.distance,
            estimatedTime: this.customRoute.estimatedTime,
            difficulty: this.customRoute.difficulty,
            description: 'カスタムルート',
            isCustom: true
        };
    }
    
    // Reset custom route
    resetCustomRoute() {
        this.customRoute = {
            start: null,
            goal: null,
            distance: 0,
            difficulty: null,
            estimatedTime: null
        };
    }
    
    // Render route selection UI
    renderRouteSelection(containerId, onRouteSelect) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        PRESET_ROUTES.forEach(route => {
            const card = document.createElement('div');
            card.className = 'route-card';
            
            let starsHTML = '';
            if (!route.isCustom) {
                starsHTML = '★'.repeat(route.difficulty.stars) + 
                           '☆'.repeat(5 - route.difficulty.stars);
            }
            
            card.innerHTML = `
                <h3>${route.name}</h3>
                <p class="location">📍 ${route.location}</p>
                ${!route.isCustom ? `
                    <div class="route-info">
                        <p><strong>距離:</strong> ${(route.distance / 1000).toFixed(1)} km</p>
                        <p><strong>予想時間:</strong> ${route.estimatedTime}</p>
                        <p class="difficulty"><strong>難易度:</strong> ${starsHTML} ${route.difficulty.label}</p>
                    </div>
                ` : ''}
                <p class="description">${route.description}</p>
            `;
            
            card.onclick = () => {
                if (route.isCustom) {
                    onRouteSelect(route, true);
                } else {
                    onRouteSelect(route, false);
                }
            };
            
            container.appendChild(card);
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RouteManager, PRESET_ROUTES };
}
