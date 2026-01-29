/**
 * デフォルトマッププラグイン
 * シンプルなグリッド背景のマップ
 */
class DefaultMap extends window.PixelApocalypse.MapBase {
  constructor() {
    super({
      id: 'default',
      name: 'デフォルトマップ',
      description: 'シンプルな広いマップ',
      author: 'PixelApocalypse Team',
      version: '1.0.0',
      width: 4000,
      height: 4000,
      backgroundColor: '#2a2a2a',
      hasGrid: true,
      gridSize: 100,
      gridColor: '#3a3a3a'
    });
  }
}

if (window.PixelApocalypse && window.PixelApocalypse.MapRegistry) {
  window.PixelApocalypse.MapRegistry.register(DefaultMap);
}
