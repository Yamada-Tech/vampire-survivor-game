# カスタムマップ

このフォルダにカスタムマップを配置します。

## 基本構造

```
plugins/maps/
  my_custom_map/
    map.json
    tileset.png (オプション)
    objects/ (オプション)
```

## map.json の例

```json
{
  "name": "My Map",
  "author": "Your Name",
  "version": "1.0.0",
  "tileSize": 32,
  "biomes": [
    {
      "id": "forest",
      "bounds": {"x": 0, "y": 0, "width": 2000, "height": 2000},
      "groundTiles": ["grass"],
      "fallbackColors": ["#5a8c3a"],
      "objects": [
        {"type": "tree", "density": 0.05}
      ]
    }
  ],
  "objects": {
    "tree": {
      "width": 64,
      "height": 96,
      "parallax": 0.5
    }
  }
}
```

詳細は `maps/mad_forest/README.md` を参照してください。
