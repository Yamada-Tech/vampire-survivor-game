/**
 * Character Data
 * キャラクターの定義
 */

const CHARACTERS = {
  warrior: {
    id: 'warrior',
    name: '戦士',
    description: '近接戦闘のスペシャリスト',
    initialWeapon: 'knife',
    stats: {
      maxHp: 150,
      baseSpeed: 200,
      damageMultiplier: 1.2,
      defenseMultiplier: 1.0
    },
    color: '#ff4444'  // 表示用の色
  },
  
  mage: {
    id: 'mage',
    name: '魔法使い',
    description: '強力な魔法攻撃',
    initialWeapon: 'fireball',
    stats: {
      maxHp: 100,
      baseSpeed: 180,
      damageMultiplier: 1.5,
      defenseMultiplier: 0.8
    },
    color: '#4444ff'
  },
  
  hunter: {
    id: 'hunter',
    name: '狩人',
    description: '素早い動きと遠距離攻撃',
    initialWeapon: 'lightning',
    stats: {
      maxHp: 120,
      baseSpeed: 220,
      damageMultiplier: 1.0,
      defenseMultiplier: 0.9
    },
    color: '#44ff44'
  }
};

console.log('Character data loaded');
