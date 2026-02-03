// ============================================================================
// BackgroundManager - Procedural Multi-Layer Parallax Background System
// ============================================================================

class BackgroundManager {
  constructor() {
    this.layers = [];
    this.biomes = new Map();
    this.objectCache = new Map(); // 生成済みオブジェクトのキャッシュ
    this.CHUNK_SIZE = 500; // チャンクサイズ
    
    this.initializeLayers();
    this.registerBiomes();
  }
  
  initializeLayers() {
    // Layer 0: 空
    this.layers.push({
      id: 'sky',
      parallax: 0,
      render: (ctx, camera) => this.renderSky(ctx, camera)
    });
    
    // Layer 1: 遠景
    this.layers.push({
      id: 'far-background',
      parallax: 0.2,
      render: (ctx, camera) => this.renderFarBackground(ctx, camera)
    });
    
    // Layer 2: オブジェクト（木、建物など）
    this.layers.push({
      id: 'objects',
      parallax: 0.5,
      render: (ctx, camera) => this.renderObjects(ctx, camera)
    });
    
    // Layer 3: 地面
    this.layers.push({
      id: 'ground',
      parallax: 1.0,
      render: (ctx, camera) => this.renderGround(ctx, camera)
    });
    
    // Layer 4: 前景（草）
    this.layers.push({
      id: 'foreground',
      parallax: 1.0,
      render: (ctx, camera) => this.renderForeground(ctx, camera)
    });
  }
  
  registerBiomes() {
    // 草原バイオーム（デフォルト）
    this.biomes.set('grassland', {
      groundColor: '#5a8c3a',
      groundColorAlt: '#4a7c2a',
      objects: ['tree', 'rock'],
      fogColor: null
    });
    
    // 墓地バイオーム
    this.biomes.set('graveyard', {
      groundColor: '#4a4a4a',
      groundColorAlt: '#3a3a3a',
      objects: ['grave', 'dead_tree'],
      fogColor: 'rgba(100, 100, 100, 0.3)'
    });
  }
  
  getBiomeAt(x, y) {
    // 墓地エリア: (1000, 500) から (2000, 1500)
    if (x >= 1000 && x <= 2000 && y >= 500 && y <= 1500) {
      return this.biomes.get('graveyard');
    }
    
    // デフォルト: 草原
    return this.biomes.get('grassland');
  }
  
  renderSky(ctx, camera) {
    // 空のグラデーション
    const gradient = ctx.createLinearGradient(0, 0, 0, camera.canvas.height);
    gradient.addColorStop(0, '#87CEEB'); // 明るい青
    gradient.addColorStop(1, '#E0F6FF'); // 薄い青
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, camera.canvas.width, camera.canvas.height);
  }
  
  renderFarBackground(ctx, camera) {
    // 遠景の山（パララックス 0.2倍）
    const offsetX = camera.x * 0.2;
    const offsetY = camera.y * 0.2;
    
    ctx.save();
    ctx.globalAlpha = 0.4;
    
    // 簡単な山のシルエット
    ctx.fillStyle = '#6b8e92';
    ctx.beginPath();
    
    const mountainWidth = 800;
    const mountainHeight = 200;
    const startX = -offsetX % mountainWidth;
    
    for (let x = startX - mountainWidth; x < camera.canvas.width + mountainWidth; x += mountainWidth) {
      ctx.moveTo(x, camera.canvas.height / 2);
      ctx.lineTo(x + mountainWidth / 2, camera.canvas.height / 2 - mountainHeight);
      ctx.lineTo(x + mountainWidth, camera.canvas.height / 2);
    }
    
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
  
  renderGround(ctx, camera) {
    const TILE_SIZE = 50;
    
    // 表示範囲を計算
    const startX = Math.floor((camera.x - 100) / TILE_SIZE) * TILE_SIZE;
    const startY = Math.floor((camera.y - 100) / TILE_SIZE) * TILE_SIZE;
    const endX = startX + camera.canvas.width + 200;
    const endY = startY + camera.canvas.height + 200;
    
    for (let x = startX; x < endX; x += TILE_SIZE) {
      for (let y = startY; y < endY; y += TILE_SIZE) {
        const biome = this.getBiomeAt(x, y);
        
        // チェッカーボードパターン
        const isAlt = ((x / TILE_SIZE) + (y / TILE_SIZE)) % 2 === 0;
        ctx.fillStyle = isAlt ? biome.groundColor : biome.groundColorAlt;
        
        const screenX = x - camera.x;
        const screenY = y - camera.y;
        
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        
        // グリッド線（薄く）
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }
  }
  
  renderObjects(ctx, camera) {
    const CHUNK_SIZE = this.CHUNK_SIZE;
    
    // 表示範囲のチャンクを計算
    const startChunkX = Math.floor((camera.x - 200) / CHUNK_SIZE);
    const startChunkY = Math.floor((camera.y - 200) / CHUNK_SIZE);
    const endChunkX = Math.ceil((camera.x + camera.canvas.width + 200) / CHUNK_SIZE);
    const endChunkY = Math.ceil((camera.y + camera.canvas.height + 200) / CHUNK_SIZE);
    
    for (let chunkX = startChunkX; chunkX <= endChunkX; chunkX++) {
      for (let chunkY = startChunkY; chunkY <= endChunkY; chunkY++) {
        this.renderChunk(ctx, camera, chunkX, chunkY);
      }
    }
  }
  
  renderChunk(ctx, camera, chunkX, chunkY) {
    const chunkKey = `${chunkX},${chunkY}`;
    
    // キャッシュチェック
    if (!this.objectCache.has(chunkKey)) {
      this.generateChunk(chunkX, chunkY);
    }
    
    const objects = this.objectCache.get(chunkKey);
    
    // パララックス効果（0.5倍速）
    const parallaxOffsetX = camera.x * 0.5;
    const parallaxOffsetY = camera.y * 0.5;
    
    objects.forEach(obj => {
      const screenX = obj.x - parallaxOffsetX;
      const screenY = obj.y - parallaxOffsetY;
      
      // 画面外チェック
      if (screenX < -100 || screenX > camera.canvas.width + 100 ||
          screenY < -100 || screenY > camera.canvas.height + 100) {
        return;
      }
      
      this.drawObject(ctx, obj.type, screenX, screenY, obj.scale);
    });
  }
  
  generateChunk(chunkX, chunkY) {
    const CHUNK_SIZE = this.CHUNK_SIZE;
    const seed = this.hash(chunkX, chunkY);
    const rng = this.createSeededRandom(seed);
    
    const objects = [];
    const centerX = chunkX * CHUNK_SIZE + CHUNK_SIZE / 2;
    const centerY = chunkY * CHUNK_SIZE + CHUNK_SIZE / 2;
    
    const biome = this.getBiomeAt(centerX, centerY);
    
    // オブジェクト数をランダムに決定
    const objectCount = Math.floor(rng() * 5) + 3; // 3-7個
    
    for (let i = 0; i < objectCount; i++) {
      const objectType = biome.objects[Math.floor(rng() * biome.objects.length)];
      const x = chunkX * CHUNK_SIZE + rng() * CHUNK_SIZE;
      const y = chunkY * CHUNK_SIZE + rng() * CHUNK_SIZE;
      const scale = 0.8 + rng() * 0.4; // 0.8-1.2倍
      
      objects.push({ type: objectType, x, y, scale });
    }
    
    this.objectCache.set(`${chunkX},${chunkY}`, objects);
  }
  
  drawObject(ctx, type, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
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
        this.drawRock(ctx);
        break;
      case 'house':
        this.drawHouse(ctx);
        break;
    }
    
    ctx.restore();
  }
  
  drawTree(ctx) {
    // 幹
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-5, -20, 10, 40);
    
    // 葉（3層の円）
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
  
  drawGrave(ctx) {
    // 墓石本体
    ctx.fillStyle = '#888888';
    ctx.fillRect(-10, -25, 20, 30);
    
    // 上部のアーチ
    ctx.beginPath();
    ctx.arc(0, -25, 10, Math.PI, 0);
    ctx.fill();
    
    // 十字
    ctx.fillStyle = '#666666';
    ctx.fillRect(-1, -20, 2, 10);
    ctx.fillRect(-5, -16, 10, 2);
    
    // 影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawDeadTree(ctx) {
    // 幹（暗い）
    ctx.fillStyle = '#4a3c2a';
    ctx.fillRect(-4, -20, 8, 35);
    
    // 枯れた枝
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
  
  drawRock(ctx) {
    // 岩（不規則な楕円）
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // ハイライト
    ctx.fillStyle = '#9a9a9a';
    ctx.beginPath();
    ctx.ellipse(-5, -5, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 5, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawHouse(ctx) {
    // 壁
    ctx.fillStyle = '#d2b48c';
    ctx.fillRect(-30, -25, 60, 50);
    
    // 屋根
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(-35, -25);
    ctx.lineTo(0, -50);
    ctx.lineTo(35, -25);
    ctx.closePath();
    ctx.fill();
    
    // 窓
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-20, -15, 12, 12);
    ctx.fillRect(8, -15, 12, 12);
    
    // 窓枠
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(-20, -15, 12, 12);
    ctx.strokeRect(8, -15, 12, 12);
    
    // ドア
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-8, 0, 16, 25);
    
    // ドアノブ
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(5, 12, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  renderForeground(ctx, camera) {
    // 草のデコレーション
    const GRASS_SPACING = 80;
    
    const startX = Math.floor((camera.x - 100) / GRASS_SPACING) * GRASS_SPACING;
    const startY = Math.floor((camera.y - 100) / GRASS_SPACING) * GRASS_SPACING;
    const endX = startX + camera.canvas.width + 200;
    const endY = startY + camera.canvas.height + 200;
    
    ctx.save();
    ctx.globalAlpha = 0.6;
    
    for (let x = startX; x < endX; x += GRASS_SPACING) {
      for (let y = startY; y < endY; y += GRASS_SPACING) {
        const seed = this.hash(Math.floor(x / 10), Math.floor(y / 10));
        const rng = this.createSeededRandom(seed);
        
        // 50%の確率で草を描画
        if (rng() > 0.5) {
          const screenX = x - camera.x;
          const screenY = y - camera.y;
          
          const biome = this.getBiomeAt(x, y);
          
          // 草原にのみ草を描画
          if (biome === this.biomes.get('grassland')) {
            this.drawGrass(ctx, screenX, screenY);
          }
        }
      }
    }
    
    ctx.restore();
    
    // 墓地エリアに霧を描画
    this.renderFog(ctx, camera);
  }
  
  drawGrass(ctx, x, y) {
    ctx.strokeStyle = '#4a8c2a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // 3本の草
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x - 4, y - 8);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 10);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + 3, y);
    ctx.lineTo(x + 4, y - 7);
    ctx.stroke();
  }
  
  renderFog(ctx, camera) {
    // 墓地エリアに霧エフェクト
    const graveyardX1 = 1000;
    const graveyardY1 = 500;
    const graveyardX2 = 2000;
    const graveyardY2 = 1500;
    
    // カメラが墓地エリアと重なっているかチェック
    if (camera.x + camera.canvas.width < graveyardX1 || camera.x > graveyardX2 ||
        camera.y + camera.canvas.height < graveyardY1 || camera.y > graveyardY2) {
      return; // 墓地エリア外
    }
    
    const screenX1 = graveyardX1 - camera.x;
    const screenY1 = graveyardY1 - camera.y;
    const screenX2 = graveyardX2 - camera.x;
    const screenY2 = graveyardY2 - camera.y;
    
    ctx.save();
    ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
    ctx.fillRect(
      Math.max(0, screenX1),
      Math.max(0, screenY1),
      Math.min(camera.canvas.width, screenX2 - screenX1),
      Math.min(camera.canvas.height, screenY2 - screenY1)
    );
    ctx.restore();
  }
  
  // ユーティリティ関数
  
  hash(x, y) {
    // シンプルなハッシュ関数
    return ((x * 73856093) ^ (y * 19349663)) >>> 0;
  }
  
  createSeededRandom(seed) {
    // シード付き疑似乱数生成器
    let state = seed;
    return function() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return (state >>> 0) / 0xFFFFFFFF;
    };
  }
  
  render(ctx, camera) {
    // 全レイヤーを順番に描画
    this.layers.forEach(layer => {
      layer.render(ctx, camera);
    });
  }
  
  // メモリ管理: 遠いチャンクのキャッシュをクリア
  clearDistantChunks(cameraX, cameraY) {
    const currentChunkX = Math.floor(cameraX / this.CHUNK_SIZE);
    const currentChunkY = Math.floor(cameraY / this.CHUNK_SIZE);
    const MAX_DISTANCE = 5; // 5チャンク以上離れたら削除
    
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
  }
}

// グローバルに登録
if (!window.PixelApocalypse) {
  window.PixelApocalypse = {};
}

window.PixelApocalypse.BackgroundManager = BackgroundManager;

console.log('BackgroundManager loaded');
