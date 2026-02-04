/**
 * ピクセルアートエディター
 * キャラクタースプライト（32×32）と武器アイコン（16×16）を作成できる
 */

class PixelArtEditor {
  constructor() {
    this.mode = 'character';  // 'character' or 'weapon'
    
    // キャラクタースプライト（32×32）
    this.characterCanvas = { width: 32, height: 32 };
    this.characterPixels = [];
    
    // 武器アイコン（16×16）
    this.weaponCanvas = { width: 16, height: 16 };
    this.weaponPixels = [];
    
    // カラーパレット
    this.palette = [
      '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
      '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff',
      '#808080', '#c0c0c0', '#800000', '#008000', '#000080',
      '#808000'
    ];
    this.selectedColor = '#000000';
    
    // ツール
    this.tool = 'pen';  // 'pen', 'eraser', 'fill'
    
    // プレビュー
    this.previewScale = 10;
    
    // 初期化
    this.initializePixels();
  }
  
  initializePixels() {
    // キャラクターピクセル初期化
    this.characterPixels = [];
    for (let y = 0; y < 32; y++) {
      const row = [];
      for (let x = 0; x < 32; x++) {
        row.push('transparent');
      }
      this.characterPixels.push(row);
    }
    
    // 武器ピクセル初期化
    this.weaponPixels = [];
    for (let y = 0; y < 16; y++) {
      const row = [];
      for (let x = 0; x < 16; x++) {
        row.push('transparent');
      }
      this.weaponPixels.push(row);
    }
  }
  
  draw(ctx, canvas) {
    // 背景
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // タイトル
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('ピクセルアートエディター', 20, 40);
    
    // モード切り替えボタン
    this.drawModeButtons(ctx, canvas);
    
    // 描画エリア
    if (this.mode === 'character') {
      this.drawCharacterEditor(ctx, canvas);
    } else {
      this.drawWeaponEditor(ctx, canvas);
    }
    
    // カラーパレット
    this.drawColorPalette(ctx, canvas);
    
    // ツールバー
    this.drawToolbar(ctx, canvas);
    
    // プレビュー
    this.drawPreview(ctx, canvas);
  }
  
  drawModeButtons(ctx, canvas) {
    const buttonY = 60;
    const buttonWidth = 150;
    const buttonHeight = 40;
    
    // キャラクターボタン
    ctx.fillStyle = this.mode === 'character' ? '#6a5acd' : '#444444';
    ctx.fillRect(20, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = this.mode === 'character' ? '#ffff00' : '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('キャラクター (32×32)', 95, buttonY + 25);
    
    // 武器ボタン
    ctx.fillStyle = this.mode === 'weapon' ? '#6a5acd' : '#444444';
    ctx.fillRect(190, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = this.mode === 'weapon' ? '#ffff00' : '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(190, buttonY, buttonWidth, buttonHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText('武器 (16×16)', 265, buttonY + 25);
  }
  
  drawCharacterEditor(ctx, canvas) {
    const startX = 50;
    const startY = 130;
    const pixelSize = 15;
    
    // グリッド背景
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(startX, startY, 32 * pixelSize, 32 * pixelSize);
    
    // ピクセル描画
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const color = this.characterPixels[y][x];
        if (color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(
            startX + x * pixelSize,
            startY + y * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }
    
    // グリッド線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 32; i++) {
      ctx.beginPath();
      ctx.moveTo(startX + i * pixelSize, startY);
      ctx.lineTo(startX + i * pixelSize, startY + 32 * pixelSize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(startX, startY + i * pixelSize);
      ctx.lineTo(startX + 32 * pixelSize, startY + i * pixelSize);
      ctx.stroke();
    }
    
    // 枠線
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(startX, startY, 32 * pixelSize, 32 * pixelSize);
  }
  
  drawWeaponEditor(ctx, canvas) {
    const startX = 50;
    const startY = 130;
    const pixelSize = 25;
    
    // グリッド背景
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(startX, startY, 16 * pixelSize, 16 * pixelSize);
    
    // ピクセル描画
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const color = this.weaponPixels[y][x];
        if (color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(
            startX + x * pixelSize,
            startY + y * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }
    
    // グリッド線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 16; i++) {
      ctx.beginPath();
      ctx.moveTo(startX + i * pixelSize, startY);
      ctx.lineTo(startX + i * pixelSize, startY + 16 * pixelSize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(startX, startY + i * pixelSize);
      ctx.lineTo(startX + 16 * pixelSize, startY + i * pixelSize);
      ctx.stroke();
    }
    
    // 枠線
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(startX, startY, 16 * pixelSize, 16 * pixelSize);
  }
  
  drawColorPalette(ctx, canvas) {
    const startX = 550;
    const startY = 130;
    const colorSize = 30;
    const cols = 4;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('カラーパレット', startX, startY - 10);
    
    this.palette.forEach((color, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (colorSize + 5);
      const y = startY + row * (colorSize + 5);
      
      // 色
      ctx.fillStyle = color;
      ctx.fillRect(x, y, colorSize, colorSize);
      
      // 枠
      ctx.strokeStyle = color === this.selectedColor ? '#ffff00' : '#666666';
      ctx.lineWidth = color === this.selectedColor ? 3 : 1;
      ctx.strokeRect(x, y, colorSize, colorSize);
    });
    
    // 透明色
    const transX = startX;
    const transY = startY + Math.ceil(this.palette.length / cols) * (colorSize + 5) + 10;
    
    // チェッカーボード背景
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(transX, transY, colorSize, colorSize);
    ctx.fillStyle = '#999999';
    ctx.fillRect(transX, transY, colorSize / 2, colorSize / 2);
    ctx.fillRect(transX + colorSize / 2, transY + colorSize / 2, colorSize / 2, colorSize / 2);
    
    ctx.strokeStyle = this.selectedColor === 'transparent' ? '#ffff00' : '#666666';
    ctx.lineWidth = this.selectedColor === 'transparent' ? 3 : 1;
    ctx.strokeRect(transX, transY, colorSize, colorSize);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('透明', transX + colorSize + 5, transY + 20);
  }
  
  drawToolbar(ctx, canvas) {
    const startX = 700;
    const startY = 130;
    const buttonSize = 60;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('ツール', startX, startY - 10);
    
    const tools = [
      { name: 'pen', label: 'ペン', icon: '✏️' },
      { name: 'eraser', label: '消しゴム', icon: '🧹' },
      { name: 'fill', label: '塗りつぶし', icon: '🎨' }
    ];
    
    tools.forEach((toolData, index) => {
      const y = startY + index * (buttonSize + 10);
      
      ctx.fillStyle = this.tool === toolData.name ? '#6a5acd' : '#444444';
      ctx.fillRect(startX, y, buttonSize, buttonSize);
      
      ctx.strokeStyle = this.tool === toolData.name ? '#ffff00' : '#666666';
      ctx.lineWidth = this.tool === toolData.name ? 3 : 1;
      ctx.strokeRect(startX, y, buttonSize, buttonSize);
      
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(toolData.icon, startX + buttonSize / 2, y + 40);
    });
  }
  
  drawPreview(ctx, canvas) {
    const startX = 550;
    const startY = 400;
    const scale = 4;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('プレビュー', startX, startY - 10);
    
    // チェッカーボード背景
    const previewWidth = this.mode === 'character' ? 32 * scale : 16 * scale;
    const previewHeight = this.mode === 'character' ? 32 * scale : 16 * scale;
    
    for (let y = 0; y < previewHeight; y += 8) {
      for (let x = 0; x < previewWidth; x += 8) {
        ctx.fillStyle = ((x / 8 + y / 8) % 2 === 0) ? '#cccccc' : '#999999';
        ctx.fillRect(startX + x, startY + y, 8, 8);
      }
    }
    
    // ピクセル描画
    const pixels = this.mode === 'character' ? this.characterPixels : this.weaponPixels;
    const size = this.mode === 'character' ? 32 : 16;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const color = pixels[y][x];
        if (color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(startX + x * scale, startY + y * scale, scale, scale);
        }
      }
    }
    
    // 枠線
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, previewWidth, previewHeight);
  }
  
  handleClick(x, y) {
    // モード切り替えボタン
    if (y >= 60 && y <= 100) {
      if (x >= 20 && x <= 170) {
        this.mode = 'character';
        return;
      } else if (x >= 190 && x <= 340) {
        this.mode = 'weapon';
        return;
      }
    }
    
    // 描画エリア
    if (this.mode === 'character') {
      const startX = 50;
      const startY = 130;
      const pixelSize = 15;
      
      if (x >= startX && x < startX + 32 * pixelSize &&
          y >= startY && y < startY + 32 * pixelSize) {
        const gridX = Math.floor((x - startX) / pixelSize);
        const gridY = Math.floor((y - startY) / pixelSize);
        
        if (this.tool === 'pen') {
          this.characterPixels[gridY][gridX] = this.selectedColor;
        } else if (this.tool === 'eraser') {
          this.characterPixels[gridY][gridX] = 'transparent';
        } else if (this.tool === 'fill') {
          this.floodFill(this.characterPixels, gridX, gridY, this.characterPixels[gridY][gridX], this.selectedColor);
        }
        return;
      }
    } else {
      const startX = 50;
      const startY = 130;
      const pixelSize = 25;
      
      if (x >= startX && x < startX + 16 * pixelSize &&
          y >= startY && y < startY + 16 * pixelSize) {
        const gridX = Math.floor((x - startX) / pixelSize);
        const gridY = Math.floor((y - startY) / pixelSize);
        
        if (this.tool === 'pen') {
          this.weaponPixels[gridY][gridX] = this.selectedColor;
        } else if (this.tool === 'eraser') {
          this.weaponPixels[gridY][gridX] = 'transparent';
        } else if (this.tool === 'fill') {
          this.floodFill(this.weaponPixels, gridX, gridY, this.weaponPixels[gridY][gridX], this.selectedColor);
        }
        return;
      }
    }
    
    // カラーパレット
    const paletteStartX = 550;
    const paletteStartY = 130;
    const colorSize = 30;
    const cols = 4;
    
    if (x >= paletteStartX && y >= paletteStartY) {
      this.palette.forEach((color, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const colorX = paletteStartX + col * (colorSize + 5);
        const colorY = paletteStartY + row * (colorSize + 5);
        
        if (x >= colorX && x < colorX + colorSize &&
            y >= colorY && y < colorY + colorSize) {
          this.selectedColor = color;
        }
      });
      
      // 透明色
      const transY = paletteStartY + Math.ceil(this.palette.length / cols) * (colorSize + 5) + 10;
      if (x >= paletteStartX && x < paletteStartX + colorSize &&
          y >= transY && y < transY + colorSize) {
        this.selectedColor = 'transparent';
      }
    }
    
    // ツールバー
    const toolStartX = 700;
    const toolStartY = 130;
    const buttonSize = 60;
    const tools = ['pen', 'eraser', 'fill'];
    
    tools.forEach((toolName, index) => {
      const toolY = toolStartY + index * (buttonSize + 10);
      if (x >= toolStartX && x < toolStartX + buttonSize &&
          y >= toolY && y < toolY + buttonSize) {
        this.tool = toolName;
      }
    });
  }
  
  floodFill(pixels, x, y, targetColor, replacementColor) {
    if (targetColor === replacementColor) return;
    
    const stack = [[x, y]];
    const height = pixels.length;
    const width = pixels[0].length;
    
    while (stack.length > 0) {
      const [cx, cy] = stack.pop();
      
      if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
      if (pixels[cy][cx] !== targetColor) continue;
      
      pixels[cy][cx] = replacementColor;
      
      stack.push([cx + 1, cy]);
      stack.push([cx - 1, cy]);
      stack.push([cx, cy + 1]);
      stack.push([cx, cy - 1]);
    }
  }
  
  save() {
    const data = {
      character: this.characterPixels,
      weapon: this.weaponPixels
    };
    localStorage.setItem('pixelArtEditorData', JSON.stringify(data));
    console.log('Pixel art saved');
  }
  
  load() {
    const data = localStorage.getItem('pixelArtEditorData');
    if (data) {
      const parsed = JSON.parse(data);
      this.characterPixels = parsed.character || this.characterPixels;
      this.weaponPixels = parsed.weapon || this.weaponPixels;
      console.log('Pixel art loaded');
    }
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  if (!window.PixelApocalypse) {
    window.PixelApocalypse = {};
  }
  window.PixelApocalypse.PixelArtEditor = PixelArtEditor;
}

console.log('PixelArtEditor loaded');
