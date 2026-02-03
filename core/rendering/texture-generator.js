/**
 * Texture Generator
 * Perlinノイズを使用して自然な草原テクスチャを生成
 */

class TextureGenerator {
  constructor() {
    this.cache = new Map();
  }
  
  /**
   * 草原テクスチャを生成
   * @param {number} size - テクスチャサイズ（通常512）
   * @param {number} seed - シード値
   * @returns {HTMLCanvasElement} 生成されたテクスチャ
   */
  generateGrasslandTexture(size = 512, seed = Math.random()) {
    const cacheKey = `grassland_${size}_${seed}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    console.log(`Generating grassland texture (${size}x${size})...`);
    
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Perlinノイズ生成器
    const noise = new window.PixelApocalypse.PerlinNoise(seed);
    
    // 1. ベースレイヤー（地形）
    this.drawBaseLayer(ctx, size, noise);
    
    // 2. 土のパッチ
    this.drawDirtPatches(ctx, size, noise, seed);
    
    // 3. 暗い草のレイヤー
    this.drawDarkGrass(ctx, size, noise);
    
    // 4. 個別の草を描画（メイン）
    this.drawGrassBlades(ctx, size, seed);
    
    // 5. 明るいハイライト草
    this.drawHighlightGrass(ctx, size, seed);
    
    // 6. 微細なディテール
    this.drawFineDetails(ctx, size, noise);
    
    // 7. エッジのぼかし（シームレス対応）
    this.applySeamlessBlending(ctx, size);
    
    console.log('Grassland texture generated');
    
    this.cache.set(cacheKey, canvas);
    return canvas;
  }
  
  /**
   * ベースレイヤー（地形の起伏）
   */
  drawBaseLayer(ctx, size, noise) {
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Perlinノイズで地形を生成
        const noiseValue = noise.octaveNoise2D(
          x / size * 4,
          y / size * 4,
          4,
          0.5,
          2.0
        );
        
        // 草原の色（緑のグラデーション）
        const baseGreen = 0x5a + Math.floor(noiseValue * 40);
        const r = baseGreen - 30;
        const g = baseGreen + 40;
        const b = baseGreen - 30;
        
        const index = (y * size + x) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * 土のパッチ
   */
  drawDirtPatches(ctx, size, noise, seed) {
    const rng = this.createSeededRandom(seed * 1.5);
    
    // 大きな土のパッチ（5-8個）
    const patchCount = 5 + Math.floor(rng() * 4);
    
    for (let i = 0; i < patchCount; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const radius = 20 + rng() * 40;
      
      // 不規則な形のパッチ
      const points = [];
      const segments = 8 + Math.floor(rng() * 8);
      
      for (let j = 0; j < segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        const r = radius * (0.6 + rng() * 0.4);
        points.push({
          x: x + Math.cos(angle) * r,
          y: y + Math.sin(angle) * r
        });
      }
      
      // パッチを描画
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(139, 115, 85, 0.8)');
      gradient.addColorStop(0.6, 'rgba(122, 99, 69, 0.4)');
      gradient.addColorStop(1, 'rgba(139, 115, 85, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let j = 1; j < points.length; j++) {
        ctx.lineTo(points[j].x, points[j].y);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
  
  /**
   * 暗い草のレイヤー
   */
  drawDarkGrass(ctx, size, noise) {
    ctx.globalAlpha = 0.3;
    
    for (let y = 0; y < size; y += 4) {
      for (let x = 0; x < size; x += 4) {
        const noiseValue = noise.octaveNoise2D(x / 50, y / 50, 3, 0.6, 2.0);
        
        if (noiseValue > 0.5) {
          ctx.fillStyle = '#2d5016';
          ctx.fillRect(x, y, 4, 4);
        }
      }
    }
    
    ctx.globalAlpha = 1.0;
  }
  
  /**
   * 個別の草を描画（メイン）
   */
  drawGrassBlades(ctx, size, seed) {
    const rng = this.createSeededRandom(seed * 2);
    const grassCount = 400 + Math.floor(rng() * 200); // 400-600本
    
    for (let i = 0; i < grassCount; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const height = 3 + rng() * 6;
      const angle = (rng() - 0.5) * 0.4;
      const thickness = 1 + rng() * 0.5;
      
      // 草の色バリエーション
      const colorType = rng();
      let color;
      if (colorType < 0.4) {
        color = '#4a8c2a';
      } else if (colorType < 0.7) {
        color = '#3a7c1a';
      } else {
        color = '#5a9c3a';
      }
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      // 草の影
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = thickness + 0.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -height);
      ctx.stroke();
      
      // 草本体
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -height);
      ctx.stroke();
      
      ctx.restore();
    }
  }
  
  /**
   * ハイライト草
   */
  drawHighlightGrass(ctx, size, seed) {
    const rng = this.createSeededRandom(seed * 3);
    const highlightCount = 100 + Math.floor(rng() * 100);
    
    ctx.globalAlpha = 0.6;
    
    for (let i = 0; i < highlightCount; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const height = 2 + rng() * 4;
      
      ctx.strokeStyle = '#7aac4a';
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - height);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0;
  }
  
  /**
   * 微細なディテール
   */
  drawFineDetails(ctx, size, noise) {
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // 微細なノイズ
        const noiseValue = noise.noise2D(x / 10, y / 10);
        const brightness = noiseValue * 15;
        
        const index = (y * size + x) * 4;
        data[index] = Math.max(0, Math.min(255, data[index] + brightness));
        data[index + 1] = Math.max(0, Math.min(255, data[index + 1] + brightness));
        data[index + 2] = Math.max(0, Math.min(255, data[index + 2] + brightness));
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * シームレスブレンディング（エッジをぼかす）
   */
  applySeamlessBlending(ctx, size) {
    const blendWidth = 32;
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let alpha = 1.0;
        
        // 左右のエッジ
        if (x < blendWidth) {
          alpha = Math.min(alpha, x / blendWidth);
        } else if (x > size - blendWidth) {
          alpha = Math.min(alpha, (size - x) / blendWidth);
        }
        
        // 上下のエッジ
        if (y < blendWidth) {
          alpha = Math.min(alpha, y / blendWidth);
        } else if (y > size - blendWidth) {
          alpha = Math.min(alpha, (size - y) / blendWidth);
        }
        
        if (alpha < 1.0) {
          const index = (y * size + x) * 4;
          
          // 対向するピクセルとブレンド
          const oppositeX = (x + size / 2) % size;
          const oppositeY = (y + size / 2) % size;
          const oppositeIndex = (oppositeY * size + oppositeX) * 4;
          
          data[index] = data[index] * alpha + data[oppositeIndex] * (1 - alpha);
          data[index + 1] = data[index + 1] * alpha + data[oppositeIndex + 1] * (1 - alpha);
          data[index + 2] = data[index + 2] * alpha + data[oppositeIndex + 2] * (1 - alpha);
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * 墓地テクスチャを生成
   */
  generateGraveyardTexture(size = 512, seed = Math.random()) {
    const cacheKey = `graveyard_${size}_${seed}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    console.log(`Generating graveyard texture (${size}x${size})...`);
    
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const noise = new window.PixelApocalypse.PerlinNoise(seed);
    
    // グレーの石畳ベース
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const noiseValue = noise.octaveNoise2D(x / size * 3, y / size * 3, 3, 0.5, 2.0);
        
        const baseGray = 0x4a + Math.floor(noiseValue * 30);
        
        const index = (y * size + x) * 4;
        data[index] = baseGray;
        data[index + 1] = baseGray;
        data[index + 2] = baseGray;
        data[index + 3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // 暗いパッチ
    ctx.globalAlpha = 0.4;
    const rng = this.createSeededRandom(seed);
    
    for (let i = 0; i < 20; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const radius = 10 + rng() * 30;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, '#2a2a2a');
      gradient.addColorStop(1, 'rgba(42, 42, 42, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1.0;
    
    this.applySeamlessBlending(ctx, size);
    
    console.log('Graveyard texture generated');
    
    this.cache.set(cacheKey, canvas);
    return canvas;
  }
  
  /**
   * シード付き乱数生成器
   */
  createSeededRandom(seed) {
    let state = seed * 2654435761;
    return function() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return (state >>> 0) / 0xFFFFFFFF;
    };
  }
}

// グローバルに登録
if (!window.PixelApocalypse) {
  window.PixelApocalypse = {};
}

window.PixelApocalypse.TextureGenerator = TextureGenerator;

console.log('TextureGenerator loaded');
