/**
 * Collision Definitions
 * 各オブジェクトの当たり判定を定義
 *
 * collisionType の値:
 *   'full'   - オブジェクトの矩形全体が当たり判定
 *   'custom' - collisionRect で指定したカスタム矩形（木の幹など）
 *   'image'  - 画像の不透過部分を当たり判定とする（現状は 'full' と同等）
 */

const CollisionDefinitions = {
    // === 地面タイル（通行可能） ===
    'grass': {
        size: { width: 16, height: 16 },
        collision: false
    },
    'dirt': {
        size: { width: 16, height: 16 },
        collision: false
    },
    'stone': {
        size: { width: 16, height: 16 },
        collision: false
    },
    'dirt_path': {
        size: { width: 16, height: 16 },
        collision: false
    },
    'stone_path': {
        size: { width: 16, height: 16 },
        collision: false
    },
    'sand': {
        size: { width: 16, height: 16 },
        collision: false
    },

    // === 壁（通行不可） ===
    'stone_wall': {
        size: { width: 16, height: 16 },
        collision: true,
        collisionType: 'full'
    },
    'broken_wall': {
        size: { width: 16, height: 16 },
        collision: true,
        collisionType: 'full'
    },
    'wood_wall': {
        size: { width: 16, height: 16 },
        collision: true,
        collisionType: 'full'
    },
    'brick_wall': {
        size: { width: 16, height: 16 },
        collision: true,
        collisionType: 'full'
    },
    'door': {
        size: { width: 16, height: 16 },
        collision: true,
        collisionType: 'full'
    },
    'broken_door': {
        size: { width: 16, height: 16 },
        collision: true,
        collisionType: 'full'
    },

    // === 木（通行不可、幹のみ） ===
    'tree': {
        size: { width: 32, height: 32 },
        collision: true,
        collisionType: 'custom',
        // 幹の部分のみ（下部16×16ピクセル）
        collisionRect: {
            offsetX: 8,
            offsetY: 16,
            width: 16,
            height: 16
        }
    },

    // === 岩（通行不可） ===
    'rock': {
        size: { width: 24, height: 24 },
        collision: true,
        collisionType: 'image'
    },
    'large_rock': {
        size: { width: 32, height: 32 },
        collision: true,
        collisionType: 'image'
    },
    'boulder': {
        size: { width: 32, height: 32 },
        collision: true,
        collisionType: 'image'
    },
    'bush': {
        size: { width: 16, height: 16 },
        collision: true,
        collisionType: 'full'
    },

    // === 家具（通行不可） ===
    'fireplace': {
        size: { width: 24, height: 24 },
        collision: true,
        collisionType: 'full'
    },
    'altar': {
        size: { width: 24, height: 24 },
        collision: true,
        collisionType: 'full'
    },
    'table': {
        size: { width: 24, height: 24 },
        collision: true,
        collisionType: 'full'
    },
    'bed': {
        size: { width: 32, height: 24 },
        collision: true,
        collisionType: 'full'
    },
    'broken_bed': {
        size: { width: 32, height: 24 },
        collision: true,
        collisionType: 'full'
    },
    'bookshelf': {
        size: { width: 24, height: 24 },
        collision: true,
        collisionType: 'full'
    },
    'chest': {
        size: { width: 16, height: 16 },
        collision: true,
        collisionType: 'full'
    },
    'barrel': {
        size: { width: 16, height: 16 },
        collision: true,
        collisionType: 'full'
    },
    'crate': {
        size: { width: 16, height: 16 },
        collision: true,
        collisionType: 'full'
    },
    'pillar': {
        size: { width: 16, height: 16 },
        collision: true,
        collisionType: 'full'
    },
    'statue': {
        size: { width: 24, height: 24 },
        collision: true,
        collisionType: 'full'
    },
    'well': {
        size: { width: 24, height: 24 },
        collision: true,
        collisionType: 'full'
    },
    'fence': {
        size: { width: 16, height: 16 },
        collision: true,
        collisionType: 'full'
    },
    'wooden_fence': {
        size: { width: 16, height: 16 },
        collision: true,
        collisionType: 'full'
    },
    'stone_fence': {
        size: { width: 16, height: 16 },
        collision: true,
        collisionType: 'full'
    },

    // === 墓石（通行不可） ===
    'gravestone': {
        size: { width: 16, height: 24 },
        collision: true,
        collisionType: 'full'
    },
    'tombstone': {
        size: { width: 16, height: 24 },
        collision: true,
        collisionType: 'full'
    },

    // === 小物（通行可能） ===
    'chair': {
        size: { width: 16, height: 16 },
        collision: false
    },
    'bench': {
        size: { width: 16, height: 16 },
        collision: false
    },
    'flower': {
        size: { width: 16, height: 16 },
        collision: false
    },
    'mushroom': {
        size: { width: 16, height: 16 },
        collision: false
    },
    'small_rock': {
        size: { width: 16, height: 16 },
        collision: false
    },
    'debris': {
        size: { width: 16, height: 16 },
        collision: false
    },
    'small_debris': {
        size: { width: 16, height: 16 },
        collision: false
    },
    'wood_debris': {
        size: { width: 16, height: 16 },
        collision: false
    }
};

console.log('CollisionDefinitions loaded');
