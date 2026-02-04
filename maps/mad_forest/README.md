# Mad Forest Map - カスタムマップ作成ガイド

## 概要

このディレクトリには **Mad Forest** マップの定義ファイルが含まれています。
このガイドを参考に、独自のマップを作成できます。

## マップの構成

### ファイル構造

```
maps/
└── mad_forest/
    ├── map.json          # マップ定義（必須）
    ├── README.md         # このファイル
    └── assets/           # 画像リソース（オプション）
        ├── tiles/        # タイル画像
        └── objects/      # オブジェクト画像
```

## map.json 仕様

### 基本情報

```json
{
  "name": "マップ名",
  "version": "1.0",
  "author": "作者名",
  "description": "マップの説明",
  "tileSize": 32
}
```

- **name**: マップの表示名
- **version**: マップのバージョン
- **author**: 作者名
- **description**: マップの説明
- **tileSize**: タイルのサイズ（ピクセル）

### 空と遠景

```json
{
  "sky": {
    "colors": ["#4a90d9", "#87CEEB", "#b8e0f0"],
    "height": 0.3
  },
  "farBackground": {
    "enabled": true,
    "parallax": 0.2,
    "color": "#5a7a8e",
    "opacity": 0.5
  }
}
```

- **sky.colors**: 空のグラデーション色（上から下）
- **sky.height**: 空の高さ（画面高さの割合、0.0-1.0）
- **farBackground.parallax**: パララックス速度（0.0-1.0、小さいほど遠い）
- **farBackground.color**: 遠景の色
- **farBackground.opacity**: 遠景の不透明度

### バイオーム定義

```json
{
  "biomes": [
    {
      "id": "grassland",
      "name": "草原",
      "bounds": {
        "x": -10000,
        "y": -10000,
        "width": 20000,
        "height": 20000
      },
      "groundTiles": ["grass1", "grass2", "grass3", "dirt"],
      "weights": [0.45, 0.25, 0.25, 0.05],
      "fallbackColors": ["#5a8c3a", "#4a7c2a", "#6a9c4a", "#8B7355"],
      "objects": [
        {
          "type": "tree",
          "density": 0.05
        }
      ],
      "effects": {
        "fog": {
          "color": "#646464",
          "opacity": 0.2
        }
      }
    }
  ]
}
```

#### バイオームプロパティ

- **id**: バイオームの一意ID（必須）
- **name**: バイオーム名
- **bounds**: バイオームの範囲
  - **x, y**: 左上の座標
  - **width, height**: 幅と高さ
- **groundTiles**: タイルタイプの配列
- **weights**: 各タイルの出現確率（合計が1.0になるように）
- **fallbackColors**: 画像がない場合の色（タイルごと）
- **objects**: 配置するオブジェクトのリスト
  - **type**: オブジェクトタイプ
  - **density**: 密度（0.01-0.1推奨）
- **effects**: バイオームエフェクト
  - **fog**: 霧エフェクト
  - **lighting**: ライティング効果
  - **overlay**: オーバーレイ色

### オブジェクト定義

```json
{
  "objects": {
    "tree": {
      "name": "木",
      "width": 64,
      "height": 96,
      "parallax": 0.5,
      "sprite": "maps/mad_forest/assets/objects/tree.png",
      "fallbackRender": true
    }
  }
}
```

#### オブジェクトプロパティ

- **name**: オブジェクト名
- **width, height**: サイズ（ピクセル）
- **parallax**: パララックス速度（0.0-1.0）
- **sprite**: 画像パス（オプション）
- **fallbackRender**: 画像がない場合にプログラム描画するか

### 前景設定

```json
{
  "foreground": {
    "enabled": true,
    "grass": {
      "spacing": 80,
      "opacity": 0.6,
      "biomes": ["grassland"]
    }
  }
}
```

- **grass.spacing**: 草の間隔（ピクセル）
- **grass.opacity**: 草の不透明度
- **grass.biomes**: 草を描画するバイオームのID配列

## カスタムマップの作成手順

### 1. ディレクトリを作成

```bash
mkdir -p maps/my_custom_map
```

### 2. map.json を作成

`maps/mad_forest/map.json` をコピーして編集します。

```bash
cp maps/mad_forest/map.json maps/my_custom_map/map.json
```

### 3. マップをカスタマイズ

#### 基本情報を変更

```json
{
  "name": "My Custom Map",
  "author": "Your Name",
  "description": "My awesome custom map"
}
```

#### バイオームを追加/編集

新しいバイオームを追加するには、`biomes` 配列に追加します：

```json
{
  "biomes": [
    {
      "id": "desert",
      "name": "砂漠",
      "bounds": { "x": 3000, "y": 0, "width": 2000, "height": 2000 },
      "fallbackColors": ["#e6c084", "#d4af7a", "#c29e6a"],
      "weights": [0.5, 0.3, 0.2],
      "objects": [
        { "type": "cactus", "density": 0.03 }
      ]
    }
  ]
}
```

#### 新しいオブジェクトを定義

```json
{
  "objects": {
    "cactus": {
      "name": "サボテン",
      "width": 40,
      "height": 80,
      "parallax": 0.5,
      "fallbackRender": true
    }
  }
}
```

### 4. カスタム画像を追加（オプション）

画像を使用する場合：

```
maps/my_custom_map/
└── assets/
    ├── tiles/
    │   └── sand.png
    └── objects/
        └── cactus.png
```

map.json で画像を指定：

```json
{
  "objects": {
    "cactus": {
      "sprite": "maps/my_custom_map/assets/objects/cactus.png"
    }
  }
}
```

### 5. ゲームでマップを読み込む

`game.js` でマップを読み込むパスを変更：

```javascript
await this.mapLoader.loadMap('maps/my_custom_map/map.json');
```

## バイオームの配置例

### 中央に特殊エリアを配置

```json
{
  "biomes": [
    {
      "id": "default",
      "bounds": { "x": -10000, "y": -10000, "width": 20000, "height": 20000 }
    },
    {
      "id": "special",
      "bounds": { "x": -500, "y": -500, "width": 1000, "height": 1000 }
    }
  ]
}
```

### 複数エリアを配置

```json
{
  "biomes": [
    {
      "id": "grassland",
      "bounds": { "x": -10000, "y": -10000, "width": 20000, "height": 20000 }
    },
    {
      "id": "forest",
      "bounds": { "x": 1000, "y": 1000, "width": 2000, "height": 2000 }
    },
    {
      "id": "desert",
      "bounds": { "x": -3000, "y": 1000, "width": 2000, "height": 2000 }
    }
  ]
}
```

## エフェクトのカスタマイズ

### 霧エフェクト

```json
{
  "effects": {
    "fog": {
      "color": "#646464",
      "opacity": 0.3
    }
  }
}
```

### ライティング

```json
{
  "effects": {
    "lighting": {
      "type": "darken",
      "amount": 0.7
    }
  }
}
```

- **type**: `"darken"` または `"brighten"`
- **amount**: 明るさレベル（0.0-1.0）
  - `darken`の場合: 1.0 = 暗くならない、0.0 = 完全に暗い
  - `brighten`の場合: 0.0 = 明るくならない、1.0 = 最大の明るさ

### オーバーレイ

```json
{
  "effects": {
    "overlay": {
      "color": "rgba(255, 0, 0, 0.1)"
    }
  }
}
```

## パフォーマンスのヒント

### タイルサイズ

- 小さいタイル（16-32px）: より詳細だがパフォーマンス低下
- 大きいタイル（64-128px）: シンプルだが高パフォーマンス

### オブジェクト密度

- 0.01-0.05: 適度な密度
- 0.1以上: 非常に密集（パフォーマンス注意）

### チャンクサイズ

デフォルト: 500px
大きいマップには大きいチャンクサイズを推奨

## トラブルシューティング

### マップが読み込まれない

1. JSON構文エラーをチェック
2. 必須フィールドが存在するか確認
3. ブラウザのコンソールでエラーを確認

### 画像が表示されない

1. 画像パスが正しいか確認
2. 画像ファイルが存在するか確認
3. fallbackRender を true に設定

### パフォーマンスが悪い

1. オブジェクト密度を下げる
2. タイルサイズを大きくする
3. エフェクトを減らす

## サンプルマップ

Mad Forest マップは以下の特徴があります：

- **草原バイオーム**: ゲーム全体をカバー
- **墓地バイオーム**: (1000, 500) から (2000, 1500) の範囲
- **霧エフェクト**: 墓地エリアに暗い雰囲気
- **オブジェクト**: 木、岩、墓石、枯れ木

このマップを参考に、自分だけのマップを作成してください！

## 高度な機能

### カスタムオブジェクト描画

新しいマップシステム（MapLayerSystem）では、エディター機能を使用して
カスタムオブジェクトを描画・配置できます。

### 動的マップ生成

MapGeneratorを使用して、バイオーム、村、建物などを自動生成できます。

### 時間経過エフェクト

時間に応じて空の色や霧の濃さを変更することもできます。

---

**注意**: このガイドは旧マップシステム（MapSystem）用です。
新しいシステム（MapLayerSystem）では、マップはプログラム的に生成され、
JSON定義ファイルは使用されません。

新しいマップシステムについては、`map-layer-system.js` と `map-generator.js` を参照してください。

---

**楽しいマップ作成を！** 🗺️✨
