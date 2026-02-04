# 🧟 Pixel Apocalypse - Vampire Survivors風ゲーム

Canvas APIで作られた、Vampire Survivors風のサバイバルアクションゲーム。

## 🎮 特徴

- **プラグインシステム**: 武器と敵を簡単に追加可能
- **マップシステム**: JSON定義でカスタムマップ作成
- **テクスチャ生成**: Perlinノイズで美しい背景
- **ズーム機能**: 0.3x-2.0xのズーム対応
- **拡張性**: モジュール化された設計

## 🚀 クイックスタート

1. ブラウザで `index.html` を開く
2. 武器を選択
3. プレイ開始！

## 🎯 操作方法

### 移動
- W/↑: 上
- S/↓: 下
- A/←: 左
- D/→: 右

### ズーム
- マウスホイール: 拡大/縮小
- = キー: 拡大
- - キー: 縮小

### その他
- ESC: ポーズ

## 🔧 カスタマイズ

### カスタム武器の追加

`plugins/weapons/` に新しいファイルを作成:

```javascript
class MyWeapon extends WeaponBase {
  constructor() {
    super({
      name: 'My Weapon',
      damage: 10,
      cooldown: 1.0
    });
  }
  
  fire(player, enemies) {
    // 攻撃ロジック
  }
}

registerWeapon('my_weapon', MyWeapon);
```

### カスタムマップの追加

`plugins/maps/` に新しいフォルダを作成し、`map.json` を配置。

詳細は `maps/mad_forest/README.md` を参照。

## 📁 ファイル構造

```
pixel-apocalypse/
├── index.html
├── game.js
├── camera.js
├── core/
│   ├── base/
│   │   ├── weapon-base.js
│   │   ├── enemy-base.js
│   │   ├── character-base.js
│   │   └── map-base.js
│   ├── rendering/
│   │   ├── perlin-noise.js
│   │   └── texture-generator.js
│   ├── map/
│   │   ├── collision-system.js
│   │   ├── map-layer-system.js
│   │   ├── map-generator.js
│   │   └── village-generator.js
│   ├── editor/
│   │   ├── editor.js
│   │   └── pixel-art-editor.js
│   ├── character/
│   │   └── character-data.js
│   ├── utils/
│   │   └── debug.js
│   ├── registry.js
│   └── custom-weapon-loader.js
├── plugins/
│   ├── weapons/
│   ├── characters/
│   ├── enemies/
│   └── maps/
└── maps/
    └── mad_forest/
```

## 🎨 テクスチャプレビュー

`texture-preview.html` をブラウザで開くと、生成されたテクスチャを確認できます。

## 📝 ライセンス

MIT License

## 📝 ライセンス

MIT License