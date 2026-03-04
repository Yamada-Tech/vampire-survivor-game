/**
 * Tile Definitions
 * タイルシート上の各タイルの座標を定義
 *
 * 注意: 実際のタイルシートを確認して座標を調整してください。
 * assets/textures/tileset.png が存在しない場合は、
 * フォールバックとして既存のコード生成テクスチャが使用されます。
 */

const TileDefinitions = {
    // === 地面タイル（16×16） ===
    'grass':      { x: 0,  y: 0,  width: 16, height: 16 },
    'dirt':       { x: 16, y: 0,  width: 16, height: 16 },
    'stone':      { x: 32, y: 0,  width: 16, height: 16 },
    'sand':       { x: 48, y: 0,  width: 16, height: 16 },

    'dirt_path':  { x: 0,  y: 16, width: 16, height: 16 },
    'stone_path': { x: 16, y: 16, width: 16, height: 16 },

    // === 壁（16×16） ===
    'stone_wall':     { x: 0,  y: 32, width: 16, height: 16 },
    'stone_wall_top': { x: 16, y: 32, width: 16, height: 16 },
    'brick_wall':     { x: 32, y: 32, width: 16, height: 16 },
    'wood_wall':      { x: 48, y: 32, width: 16, height: 16 },

    'door':       { x: 0,  y: 48, width: 16, height: 16 },
    'broken_door': { x: 16, y: 48, width: 16, height: 16 },

    // === オブジェクト ===
    'tree':       { x: 0,  y: 64, width: 32, height: 32 },  // 2×2タイル
    'rock':       { x: 32, y: 64, width: 16, height: 16 },
    'large_rock': { x: 48, y: 64, width: 24, height: 24 },

    'barrel':     { x: 0,  y: 96, width: 16, height: 16 },
    'crate':      { x: 16, y: 96, width: 16, height: 16 },
    'table':      { x: 32, y: 96, width: 24, height: 24 },
    'chair':      { x: 56, y: 96, width: 16, height: 16 },

    'gravestone': { x: 0,  y: 112, width: 16, height: 24 },
    'altar':      { x: 16, y: 112, width: 24, height: 24 },
    'fireplace':  { x: 40, y: 112, width: 24, height: 24 }
};

console.log('TileDefinitions loaded');
