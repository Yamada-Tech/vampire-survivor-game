# Pixel Apocalypse

Vampire Survivors風の2Dアクションサバイバルゲーム - カスタム武器MOD対応

## 概要

HTML5 CanvasとJavaScriptで作られた2Dアクションサバイバルゲームです。
プラグインシステムを採用し、プレイヤーが自由に武器をカスタマイズできるMOD機能を搭載しています。

## 特徴

### 🎨 カスタム武器システム（MODサポート）
- **ビジュアルエディタ**で直感的に武器を作成
- **リアルタイムプレビュー**で効果を確認
- 作成した武器をゲーム内で使用可能
- LocalStorageで武器データを保存

### 🔧 プラグインアーキテクチャ
- 武器・キャラクター・敵・マップを動的に登録
- 拡張性の高いレジストリシステム
- 新しいコンテンツの追加が容易

## 遊び方

### 操作方法
- **移動**: WASD キーまたは矢印キー（8方向移動）
- **攻撃**: 自動攻撃（選択した武器で自動的に攻撃）
- **目標**: できるだけ長く生き延びる

### ゲームの流れ
1. **武器選択**: デフォルト武器またはカスタム武器から1つを選択
2. **ゲーム開始**: 選択した武器でゲームスタート
3. 時間経過とともに敵が画面外からスポーンします
4. 敵を倒すと経験値を獲得し、レベルアップします
5. レベルアップ時に3つのパワーアップから1つを選択できます
6. 時間が経つほど敵の数が増え、難易度が上昇します
7. HPが0になるとゲーム終了です

### カスタム武器の作成方法

1. **エディタを開く**
   - 武器選択画面で「🎨 武器エディタを開く」ボタンをクリック
   - または直接 `editor.html` を開く

2. **武器パラメータを設定**
   - **基本情報**: 武器名、説明、作者名
   - **タイプ**: 近接（扇形攻撃）/ 遠距離（弾丸）/ 魔法（追尾）
   - **ダメージ**: 10-100
   - **攻撃速度**: 0.5-3.0秒
   - **射程**: 50-500px
   - **ノックバック**: 0-20
   - **貫通数**: 1-10
   - **エフェクト色**: カラーピッカーで選択
   - **エフェクトサイズ**: 0.5-2.0倍

3. **プレビュー確認**
   - 右側のキャンバスで武器のエフェクトをリアルタイム確認
   - DPS（秒間ダメージ）などの統計情報も表示

4. **保存してゲームで使用**
   - 「💾 保存」ボタンで武器を保存
   - ゲーム画面に戻ってカスタム武器を選択

### デフォルト武器

- **⚔️ 剣（Sword）**
  - タイプ: 近接
  - 高ダメージ、中射程
  - 三日月型の斬撃エフェクト

- **🪃 ブーメラン（Boomerang）**
  - タイプ: 遠距離
  - 中ダメージ、広範囲
  - 投げて戻ってくる軌道

- **✨ 魔法弾（Magic）**
  - タイプ: 魔法
  - 低ダメージ、高速連射
  - 敵を自動追尾

### パワーアップの種類

- **攻撃範囲拡大**: 武器の攻撃範囲が20%増加
- **攻撃速度アップ**: 攻撃のクールダウンが10%減少
- **移動速度アップ**: 移動速度が15%増加
- **最大HPアップ**: 最大HPが20増加し、HPが全回復
- **攻撃力アップ**: 武器のダメージが25%増加
- **遠距離武器追加**: 新しい魔法武器を獲得（最大5武器まで）

### 敵の種類

- **ノーマル（赤）**: バランスの取れた標準的な敵
- **高速（黄）**: 移動速度が速いが体力が少ない敵
- **タンク（紫）**: 移動速度が遅いが体力とダメージが高い敵

## ローカルでの実行方法

### 方法1: 直接ファイルを開く
```bash
git clone https://github.com/Yamada-Tech/vampire-survivor-game.git
cd vampire-survivor-game
# ブラウザで index.html を開く
```

### 方法2: ローカルサーバーを使用（推奨）
```bash
# Python 3 を使用する場合
python -m http.server 8000

# Node.js の http-server を使用する場合
npx http-server

# ブラウザで http://localhost:8000 を開く
```

## 技術仕様

### アーキテクチャ

#### プラグインシステム
```javascript
// 武器の登録例
class CustomSword extends WeaponBase {
  constructor() {
    super({
      id: 'custom-sword',
      name: 'カスタムソード',
      type: 'melee',
      damage: 50,
      attackSpeed: 1.0,
      range: 150
    });
  }
}

WeaponRegistry.register(CustomSword);
```

#### カスタム武器ローダー
- LocalStorageから `weapon_*` キーで武器データをスキャン
- 動的に WeaponBase を継承したクラスを生成
- WeaponRegistry に自動登録

### ファイル構成

```
vampire-survivor-game/
├── index.html                  # メインゲーム画面
├── editor.html                 # 武器エディタUI
├── style.css                   # スタイルシート
├── game.js                     # ゲームロジック
├── core/
│   ├── registry.js            # レジストリシステム
│   ├── custom-weapon-loader.js # カスタム武器ローダー
│   └── base/
│       ├── weapon-base.js     # 武器ベースクラス
│       ├── character-base.js  # キャラクターベースクラス
│       ├── enemy-base.js      # 敵ベースクラス
│       └── map-base.js        # マップベースクラス
├── plugins/
│   ├── weapons/
│   │   ├── sword.js           # 剣武器
│   │   ├── boomerang.js       # ブーメラン武器
│   │   └── magic.js           # 魔法武器
│   ├── characters/
│   │   └── stick-figure.js    # スティックフィギュア
│   ├── enemies/
│   │   └── basic-zombie.js    # 基本的なゾンビ敵
│   └── maps/
│       └── default-map.js     # デフォルトマップ
├── editors/
│   └── weapon-editor.js       # 武器エディタロジック
└── README.md
```

### 実装されている機能

#### ✅ コアシステム
- requestAnimationFrame による滑らかなゲームループ
- FPS管理とデルタタイム計算
- レスポンシブなCanvas表示
- プラグインレジストリシステム

#### ✅ カスタム武器システム
- ビジュアル武器エディタ
- LocalStorageベースの保存
- 動的クラス生成
- 武器のCRUD操作（作成・読込・更新・削除）
- リアルタイムプレビュー
- XSS対策とバリデーション

#### ✅ 戦闘システム
- 3種類の攻撃タイプ（近接・遠距離・魔法）
- 自動攻撃システム
- ノックバック効果
- 貫通攻撃
- 複数武器の同時使用

#### ✅ プレイヤーシステム
- 8方向移動
- スティックフィギュアアニメーション
- HP/経験値/レベル管理
- ダメージ無敵時間

#### ✅ 敵システム
- 自動スポーン
- プレイヤー追跡AI
- 3種類の敵タイプ
- 時間経過による難易度上昇

#### ✅ UIシステム
- 武器選択画面（デフォルト・カスタム分類）
- 武器エディタ
- HPバー、経験値バー
- レベルアップ画面
- ゲームオーバー画面
- リスタート・メニュー機能

#### ✅ エフェクト
- パーティクルシステム
- 三日月型斬撃エフェクト
- 武器エフェクトのカスタマイズ
- ダメージフラッシュ

### データストレージ

#### LocalStorage構造
```javascript
// カスタム武器データ
{
  key: "weapon_custom-weapon-1234567890",
  value: {
    id: "custom-weapon-1234567890",
    name: "フレイムソード",
    description: "炎を纏った剣",
    author: "Player1",
    type: "melee",
    damage: 45,
    attackSpeed: 1.2,
    range: 180,
    knockback: 8,
    pierce: 2,
    effectColor: "#ff6600",
    effectSize: 1.5,
    createdAt: 1234567890,
    updatedAt: 1234567890
  }
}
```

## ブラウザ対応

- ✅ Google Chrome（推奨）
- ✅ Mozilla Firefox
- ✅ Safari
- ✅ Microsoft Edge

最新版のモダンブラウザでの動作を推奨します。

## 技術スタック

- **HTML5 Canvas API** - 2D描画
- **Vanilla JavaScript (ES6+)** - ゲームロジック
- **LocalStorage API** - データ永続化
- **CSS3** - UI スタイリング
- **クラスベースOOP** - 拡張性の高い設計

## 今後の拡張予定

- [ ] カスタムキャラクター作成機能
- [ ] カスタム敵作成機能
- [ ] アイテムドロップシステム
- [ ] マルチプレイヤー対応
- [ ] サウンドエフェクトとBGM
- [ ] ハイスコアランキング
- [ ] モバイル対応（タッチ操作）
- [ ] ステージシステム
- [ ] ボスエネミー
- [ ] 武器の合成・進化システム
- [ ] MODコミュニティ機能（武器の共有）

## ライセンス

このプロジェクトはオープンソースです。自由にご利用ください。

## 貢献

バグ報告や機能提案は Issue からお願いします。
プルリクエストも歓迎します！

## 開発ガイド

### 新しい武器の追加（プラグイン）

```javascript
// plugins/weapons/my-weapon.js
class MyCustomWeapon extends window.PixelApocalypse.WeaponBase {
  constructor() {
    super({
      id: 'my-weapon',
      name: 'My Weapon',
      description: 'A custom weapon',
      type: 'melee',
      damage: 30,
      attackSpeed: 1.0,
      range: 100
    });
  }
  
  attack(player, enemies, currentTime) {
    // 攻撃ロジックを実装
  }
}

// 登録
window.PixelApocalypse.WeaponRegistry.register(MyCustomWeapon);
```

### 新しい敵の追加（プラグイン）

```javascript
// plugins/enemies/my-enemy.js
class MyCustomEnemy extends window.PixelApocalypse.EnemyBase {
  constructor(x, y) {
    super({
      id: 'my-enemy',
      name: 'My Enemy',
      x: x,
      y: y,
      health: 50,
      damage: 10,
      speed: 80,
      expValue: 15
    });
  }
}

// 登録
window.PixelApocalypse.EnemyRegistry.register(MyCustomEnemy);
```

---

**Enjoy creating your own weapons and surviving the apocalypse!** 🎮⚔️