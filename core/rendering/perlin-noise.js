/**
 * Perlin Noise Generator
 * 自然な地形やテクスチャ生成に使用
 */

class PerlinNoise {
  constructor(seed = Math.random()) {
    this.seed = seed;
    this.permutation = this.generatePermutation(seed);
  }
  
  /**
   * 置換テーブルを生成
   */
  generatePermutation(seed) {
    const p = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    
    // Fisher-Yatesシャッフル（シード付き）
    let rng = this.seededRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    
    // 2倍に拡張
    return [...p, ...p];
  }
  
  /**
   * シード付き乱数生成器
   */
  seededRandom(seed) {
    let state = seed * 2654435761;
    return function() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return (state >>> 0) / 0xFFFFFFFF;
    };
  }
  
  /**
   * 2D Perlinノイズ
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @returns {number} -1.0 ~ 1.0 の値
   */
  noise2D(x, y) {
    // グリッドセルの整数部分
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    // グリッドセル内の小数部分
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    
    // フェード関数（スムーズな補間のため）
    const u = this.fade(xf);
    const v = this.fade(yf);
    
    // ハッシュ値を取得
    const aa = this.permutation[this.permutation[X] + Y];
    const ab = this.permutation[this.permutation[X] + Y + 1];
    const ba = this.permutation[this.permutation[X + 1] + Y];
    const bb = this.permutation[this.permutation[X + 1] + Y + 1];
    
    // グラデーションベクトルとの内積
    const g1 = this.grad(aa, xf, yf);
    const g2 = this.grad(ba, xf - 1, yf);
    const g3 = this.grad(ab, xf, yf - 1);
    const g4 = this.grad(bb, xf - 1, yf - 1);
    
    // 双線形補間
    const x1 = this.lerp(g1, g2, u);
    const x2 = this.lerp(g3, g4, u);
    
    return this.lerp(x1, x2, v);
  }
  
  /**
   * フェード関数: 6t^5 - 15t^4 + 10t^3
   */
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  /**
   * 線形補間
   */
  lerp(a, b, t) {
    return a + t * (b - a);
  }
  
  /**
   * グラデーションベクトルとの内積
   */
  grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  
  /**
   * オクターブノイズ（複数周波数の重ね合わせ）
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} octaves - オクターブ数
   * @param {number} persistence - 振幅の減衰率
   * @param {number} lacunarity - 周波数の増加率
   * @returns {number} 0.0 ~ 1.0 の値
   */
  octaveNoise2D(x, y, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    
    // 0.0 ~ 1.0 に正規化
    return (total / maxValue + 1) / 2;
  }
}

// グローバルに登録
if (!window.PixelApocalypse) {
  window.PixelApocalypse = {};
}

window.PixelApocalypse.PerlinNoise = PerlinNoise;

console.log('PerlinNoise loaded');
