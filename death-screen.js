// ============================================================================
// Death Screen
// Enhanced death screen with real-world location and statistics
// ============================================================================

class DeathScreen {
    constructor(game) {
        this.game = game;
        this.lastNominatimCall = 0;
    }
    
    // Show death screen with location and stats
    async show(playerLat, playerLon, stats) {
        // Get location name
        const locationName = await this.getLocationName(playerLat, playerLon);
        
        // Get street view or map image URL
        const imageUrl = this.getLocationImageUrl(playerLat, playerLon);
        
        // Create or get death modal
        const modal = document.getElementById('death-modal') || this.createDeathModal();
        
        // Format stats
        const survivalTimeStr = this.formatTime(stats.survivalTime);
        const progressPercent = (stats.progress * 100).toFixed(1);
        
        // Build the death screen HTML
        modal.innerHTML = `
            <div class="death-screen">
                <h1 class="death-title">GAME OVER</h1>
                <p class="death-subtitle">あなたはここで力尽きた...</p>
                
                <div class="death-location">
                    <h2>死亡地点</h2>
                    <img src="${imageUrl}" alt="死亡地点の実景" class="location-image" onerror="this.style.display='none'">
                    <p class="location-name">${locationName}</p>
                    <p class="coordinates">
                        緯度: ${playerLat.toFixed(6)}, 経度: ${playerLon.toFixed(6)}
                    </p>
                </div>
                
                <div class="death-stats">
                    <h3>ゲーム結果</h3>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <span class="stat-label">⏱️ 生存時間</span>
                            <span class="stat-value">${survivalTimeStr}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">💀 倒した敵</span>
                            <span class="stat-value">${stats.enemiesKilled}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">⬆️ 到達レベル</span>
                            <span class="stat-value">Lv.${stats.level}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">📍 移動距離</span>
                            <span class="stat-value">${stats.distanceTraveled.toFixed(0)}m / ${stats.totalDistance}m</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">📊 進捗率</span>
                            <span class="stat-value">${progressPercent}%</span>
                        </div>
                    </div>
                    
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <p class="progress-text">ゴールまであと ${(stats.totalDistance - stats.distanceTraveled).toFixed(0)}m</p>
                    </div>
                </div>
                
                <div class="death-buttons">
                    <button onclick="window.gameInstance.retry()" class="btn-primary">リトライ</button>
                    <button onclick="window.gameInstance.backToRouteSelection()" class="btn-secondary">ルート選択に戻る</button>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
    }
    
    // Get location image URL (Street View or static map)
    getLocationImageUrl(lat, lon) {
        const apiKey = CONFIG.GOOGLE_STREET_VIEW_API_KEY;
        
        if (apiKey && apiKey.length > 0) {
            // Use Google Street View Static API
            return `https://maps.googleapis.com/maps/api/streetview?` +
                `size=800x400` +
                `&location=${lat},${lon}` +
                `&fov=90` +
                `&pitch=0` +
                `&key=${apiKey}`;
        } else {
            // Use OpenStreetMap static map
            return `https://staticmap.openstreetmap.de/staticmap.php?` +
                `center=${lat},${lon}` +
                `&zoom=17` +
                `&size=800x400` +
                `&markers=${lat},${lon},red-pushpin`;
        }
    }
    
    // Get location name using reverse geocoding
    async getLocationName(lat, lon) {
        try {
            // Rate limiting check
            const now = Date.now();
            const timeSinceLastCall = now - this.lastNominatimCall;
            if (timeSinceLastCall < CONFIG.RATE_LIMIT.NOMINATIM_MIN_INTERVAL) {
                await new Promise(resolve => 
                    setTimeout(resolve, CONFIG.RATE_LIMIT.NOMINATIM_MIN_INTERVAL - timeSinceLastCall)
                );
            }
            
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?` +
                `format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': CONFIG.MAP.USER_AGENT
                    }
                }
            );
            
            this.lastNominatimCall = Date.now();
            
            const data = await response.json();
            
            // Build Japanese-friendly address
            if (data.address) {
                const parts = [];
                if (data.address.city) parts.push(data.address.city);
                if (data.address.town) parts.push(data.address.town);
                if (data.address.suburb) parts.push(data.address.suburb);
                if (data.address.road) parts.push(data.address.road);
                
                if (parts.length > 0) {
                    return parts.join(' ');
                }
            }
            
            return data.display_name || '不明な場所';
        } catch (error) {
            console.error('Failed to get location name:', error);
            return '不明な場所';
        }
    }
    
    // Format time in MM:SS format
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Create death modal element
    createDeathModal() {
        const modal = document.createElement('div');
        modal.id = 'death-modal';
        modal.className = 'modal';
        modal.style.display = 'none';
        document.body.appendChild(modal);
        return modal;
    }
    
    // Hide death screen
    hide() {
        const modal = document.getElementById('death-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeathScreen;
}
