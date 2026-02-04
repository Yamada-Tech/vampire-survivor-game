/**
 * Editor System - Map & Weapon Editor
 * マップと武器のエディター機能
 */

class Editor {
    constructor(game) {
        this.game = game;
        
        // エディターモード: 'map' | 'weapon' | 'character'
        this.mode = 'map';
        
        // サブモード: 'placement' | 'texture' (map), 'params' | 'icon' (weapon), 'stats' | 'sprite' (character)
        this.subMode = 'placement';
        
        // マップエディター用
        this.selectedObjectType = 0;
        this.objectTypes = [
            { name: '岩', icon: '🗿', type: 'rock', size: 25, color: '#6b6b6b', hasCollision: true },
            { name: '木', icon: '🌲', type: 'tree', size: 30, color: '#228b22', hasCollision: true },
            { name: '茂み', icon: '🌳', type: 'bush', size: 20, color: '#2d5016', hasCollision: false },
            { name: 'サボテン', icon: '🌵', type: 'cactus', size: 22, color: '#7cb342', hasCollision: true },
            { name: '草', icon: '🌿', type: 'grass', size: 15, color: '#90ee90', hasCollision: false }
        ];
        this.placedObjects = [];
        this.showGrid = true;
        this.gridSize = 50;
        
        // カメラ操作用
        this.cameraMoveSpeed = 300;
        this.cameraZoomSpeed = 0.1;
        
        // 武器エディター用
        this.selectedWeaponIndex = 0;
        this.selectedParamIndex = 0;
        this.weaponList = ['fireball', 'knife', 'lightning'];
        this.weaponParams = {
            fireball: { damage: 15, cooldown: 2.0, range: 400 },
            knife: { damage: 20, cooldown: 0.5, range: 300 },
            lightning: { damage: 25, cooldown: 3.0, range: 400 }
        };
        this.weaponNames = {
            fireball: 'ファイアボール',
            knife: 'ナイフ',
            lightning: 'ライトニング'
        };
        this.weaponIcons = {
            fireball: '🔥',
            knife: '🔪',
            lightning: '⚡'
        };
        
        // キャラクターエディター用
        this.selectedCharacterIndex = 0;
        this.characterList = ['player', 'zombie'];
        this.characterParams = {
            player: { maxHealth: 100, speed: 200, regen: 0 },
            zombie: { maxHealth: 50, speed: 60, damage: 10 }
        };
        this.characterNames = {
            player: 'プレイヤー',
            zombie: 'ゾンビ'
        };
        this.selectedCharParamIndex = 0;
        
        // トップメニュー
        this.selectedMenuIndex = 0;
        this.menuItems = [
            { name: 'マップ', action: () => this.switchMode('map') },
            { name: '武器', action: () => this.switchMode('weapon') },
            { name: 'キャラクター', action: () => this.switchMode('character') },
            { name: '保存', action: () => this.saveToLocalStorage() },
            { name: '読込', action: () => this.loadFromLocalStorage() },
            { name: '戻る', action: () => this.exit() }
        ];
        
        // ピクセルアートエディター（統合用）
        this.editingTexture = null;  // 現在編集中のテクスチャタイプ
        
        // デフォルトテクスチャの初期化
        this.initializeTextures();
    }
    
    /**
     * モード切り替え
     */
    switchMode(newMode) {
        this.mode = newMode;
        // デフォルトサブモード
        if (newMode === 'map') {
            this.subMode = 'placement';
        } else if (newMode === 'weapon') {
            this.subMode = 'params';
        } else if (newMode === 'character') {
            this.subMode = 'stats';
        }
    }
    
    /**
     * デフォルトテクスチャの初期化
     */
    initializeTextures() {
        this.textures = {
            // マップオブジェクト
            grass: this.createGrassTexture(),
            tree: this.createTreeTexture(),
            rock: this.createRockTexture(),
            bush: this.createBushTexture(),
            cactus: this.createCactusTexture(),
            // 武器アイコン
            fireball_icon: this.createFireballIcon(),
            knife_icon: this.createKnifeIcon(),
            lightning_icon: this.createLightningIcon(),
            // キャラクタースプライト
            player_sprite: this.createPlayerSprite(),
            zombie_sprite: this.createZombieSprite()
        };
    }
    
    // ========== テクスチャ作成メソッド ==========
    
    createGrassTexture() {
        const pixels = [];
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // ベース色（緑）
                if (Math.random() > 0.2) {
                    row.push('#4a7c2c');
                } else {
                    // アクセント（明るい緑）
                    row.push('#5a9c3c');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createTreeTexture() {
        const pixels = [];
        for (let y = 0; y < 32; y++) {
            const row = [];
            for (let x = 0; x < 24; x++) {
                if (y < 20) {
                    // 葉の部分（円形）
                    const dx = x - 12;
                    const dy = y - 10;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 10) {
                        row.push('#2d5016');
                    } else {
                        row.push('transparent');
                    }
                } else {
                    // 幹の部分
                    if (x >= 10 && x <= 14) {
                        row.push('#5d4037');
                    } else {
                        row.push('transparent');
                    }
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createRockTexture() {
        const pixels = [];
        const centerX = 12;
        const centerY = 12;
        
        for (let y = 0; y < 24; y++) {
            const row = [];
            for (let x = 0; x < 24; x++) {
                // 六角形の岩
                const angle = Math.atan2(y - centerY, x - centerX);
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                
                // 六角形の判定
                const hexRadius = 10;
                const hexAngle = Math.floor((angle + Math.PI) / (Math.PI / 3));
                const hexDist = hexRadius / Math.cos((angle + Math.PI) - hexAngle * (Math.PI / 3));
                
                if (distance < hexDist) {
                    // 岩の色（茶色系）
                    if (distance < hexDist * 0.3) {
                        row.push('#a0826d');  // 明るい部分
                    } else if (distance < hexDist * 0.7) {
                        row.push('#8b7355');  // 中間
                    } else {
                        row.push('#6b5d4f');  // 暗い部分
                    }
                } else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createBushTexture() {
        const pixels = [];
        const centerX = 8;
        const centerY = 8;
        
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                
                if (distance < 7) {
                    // 茂みの色（暗い緑）
                    if (Math.random() > 0.3) {
                        row.push('#3a5c1c');
                    } else {
                        row.push('#4a6c2c');
                    }
                } else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createCactusTexture() {
        const pixels = [];
        
        for (let y = 0; y < 24; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // 本体
                if (x >= 6 && x <= 10 && y >= 4 && y <= 20) {
                    row.push('#5a8c3a');
                }
                // 左の腕
                else if (x >= 2 && x <= 5 && y >= 8 && y <= 12) {
                    row.push('#5a8c3a');
                }
                // 右の腕
                else if (x >= 11 && x <= 14 && y >= 12 && y <= 16) {
                    row.push('#5a8c3a');
                }
                else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createFireballIcon() {
        const pixels = [];
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                const dx = x - 8;
                const dy = y - 8;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 6) {
                    if (distance < 3) {
                        row.push('#ffff00');  // 中心（黄色）
                    } else if (distance < 5) {
                        row.push('#ff8800');  // 中間（オレンジ）
                    } else {
                        row.push('#ff0000');  // 外側（赤）
                    }
                } else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createKnifeIcon() {
        const pixels = [];
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // 刃
                if ((x >= 2 && x <= 10 && y >= 6 && y <= 8) ||
                    (x >= 8 && x <= 12 && y >= 4 && y <= 10)) {
                    row.push('#c0c0c0');
                }
                // 柄
                else if (x >= 10 && x <= 13 && y >= 8 && y <= 12) {
                    row.push('#8b4513');
                }
                else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createLightningIcon() {
        const pixels = [];
        for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
                // 稲妻の形
                if ((x === 8 && y >= 2 && y <= 6) ||
                    (x === 9 && y === 6) ||
                    (x === 10 && y === 7) ||
                    (x === 9 && y === 8) ||
                    (x === 8 && y >= 9 && y <= 13)) {
                    row.push('#00ffff');
                } else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createPlayerSprite() {
        const pixels = [];
        for (let y = 0; y < 32; y++) {
            const row = [];
            for (let x = 0; x < 32; x++) {
                // 頭（円形）
                if (y >= 4 && y <= 12) {
                    const dx = x - 16;
                    const dy = y - 8;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 6) {
                        row.push('#ffcc99');  // 肌色
                    } else {
                        row.push('transparent');
                    }
                }
                // 体
                else if (y >= 12 && y <= 24 && x >= 10 && x <= 22) {
                    row.push('#0088ff');  // 青い服
                }
                // 腕
                else if (y >= 14 && y <= 22 && ((x >= 6 && x <= 9) || (x >= 23 && x <= 26))) {
                    row.push('#ffcc99');  // 肌色
                }
                // 脚
                else if (y >= 24 && y <= 30 && ((x >= 12 && x <= 14) || (x >= 18 && x <= 20))) {
                    row.push('#0044aa');  // 濃い青
                }
                else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    createZombieSprite() {
        const pixels = [];
        for (let y = 0; y < 32; y++) {
            const row = [];
            for (let x = 0; x < 32; x++) {
                // 頭
                if (y >= 4 && y <= 12) {
                    const dx = x - 16;
                    const dy = y - 8;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 6) {
                        row.push('#88cc88');  // 緑色の肌
                    } else {
                        row.push('transparent');
                    }
                }
                // 体
                else if (y >= 12 && y <= 24 && x >= 10 && x <= 22) {
                    row.push('#666666');  // グレーの服
                }
                // 腕（ボロボロ）
                else if (y >= 14 && y <= 22 && ((x >= 6 && x <= 9) || (x >= 23 && x <= 26))) {
                    if (Math.random() > 0.3) {
                        row.push('#88cc88');
                    } else {
                        row.push('transparent');
                    }
                }
                // 脚
                else if (y >= 24 && y <= 30 && ((x >= 12 && x <= 14) || (x >= 18 && x <= 20))) {
                    row.push('#444444');
                }
                else {
                    row.push('transparent');
                }
            }
            pixels.push(row);
        }
        return pixels;
    }
    
    /**
     * エディターモード開始
     */
    enter() {
        console.log('[Editor] Entering editor mode');
        this.loadFromLocalStorage();
        
        // カメラをリセット
        this.game.camera.x = -this.game.canvas.width / 2;
        this.game.camera.y = -this.game.canvas.height / 2;
        this.game.camera.zoom = 1.0;
        this.game.camera.target = null;
    }
    
    /**
     * エディターモード終了
     */
    exit() {
        console.log('[Editor] Exiting editor mode');
        this.game.state = 'title';
        this.game.menuIndex = 0;
    }
    
    /**
     * エディターの更新
     */
    update(deltaTime) {
        // カメラ移動
        if (this.mode === 'map') {
            const speed = this.cameraMoveSpeed * deltaTime;
            if (this.game.keys['w'] || this.game.keys['W']) {
                this.game.camera.y -= speed;
            }
            if (this.game.keys['s'] || this.game.keys['S']) {
                this.game.camera.y += speed;
            }
            if (this.game.keys['a'] || this.game.keys['A']) {
                this.game.camera.x -= speed;
            }
            if (this.game.keys['d'] || this.game.keys['D']) {
                this.game.camera.x += speed;
            }
        }
    }
    
    /**
     * エディターの描画
     */
    draw(ctx, canvas) {
        // 背景クリア
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // モードに応じて描画
        if (this.mode === 'map') {
            if (this.subMode === 'placement') {
                this.drawMapPlacement(ctx, canvas);
            } else if (this.subMode === 'texture') {
                this.drawTextureEditor(ctx, canvas);
            }
        } else if (this.mode === 'weapon') {
            if (this.subMode === 'params') {
                this.drawWeaponParams(ctx, canvas);
            } else if (this.subMode === 'icon') {
                this.drawIconEditor(ctx, canvas);
            }
        } else if (this.mode === 'character') {
            if (this.subMode === 'stats') {
                this.drawCharacterStats(ctx, canvas);
            } else if (this.subMode === 'sprite') {
                this.drawSpriteEditor(ctx, canvas);
            }
        }
        
        // トップメニュー
        this.drawTopMenu(ctx, canvas);
        
        // サブモード切り替えボタン
        this.drawSubModeButtons(ctx, canvas);
    }
    
    /**
     * サブモード切り替えボタン
     */
    drawSubModeButtons(ctx, canvas) {
        const buttonY = 70;
        const buttonWidth = 150;
        const buttonHeight = 35;
        const buttonX = 200;
        
        let buttons = [];
        if (this.mode === 'map') {
            buttons = [
                { name: '配置モード', subMode: 'placement' },
                { name: 'テクスチャ編集', subMode: 'texture' }
            ];
        } else if (this.mode === 'weapon') {
            buttons = [
                { name: 'パラメーター', subMode: 'params' },
                { name: 'アイコン編集', subMode: 'icon' }
            ];
        } else if (this.mode === 'character') {
            buttons = [
                { name: 'ステータス', subMode: 'stats' },
                { name: 'スプライト編集', subMode: 'sprite' }
            ];
        }
        
        buttons.forEach((btn, index) => {
            const x = buttonX + index * (buttonWidth + 10);
            const isActive = btn.subMode === this.subMode;
            
            ctx.fillStyle = isActive ? 'rgba(106, 90, 205, 0.8)' : 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, buttonY, buttonWidth, buttonHeight);
            
            ctx.strokeStyle = isActive ? '#ffff00' : '#666666';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, buttonY, buttonWidth, buttonHeight);
            
            ctx.fillStyle = isActive ? '#ffffff' : '#aaaaaa';
            ctx.font = isActive ? 'bold 14px Arial' : '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(btn.name, x + buttonWidth / 2, buttonY + 22);
        });
    }
    
    /**
     * マップ配置モードの描画
     */
    drawMapPlacement(ctx, canvas) {
        ctx.save();
        
        // グリッド描画
        if (this.showGrid) {
            this.drawGrid(ctx, canvas);
        }
        
        // 配置されたオブジェクトを描画
        this.placedObjects.forEach(obj => {
            const screenPos = this.game.camera.worldToScreen(obj.x, obj.y);
            const screenSize = obj.size * this.game.camera.zoom;
            
            ctx.fillStyle = obj.color;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, screenSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            
            // 衝突判定があるオブジェクトには枠線
            if (obj.hasCollision) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, screenSize, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
        
        ctx.restore();
        
        // オブジェクトパレット（左側）
        const paletteX = 20;
        const paletteY = 80;
        const paletteWidth = 150;
        const itemHeight = 60;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(paletteX, paletteY, paletteWidth, this.objectTypes.length * itemHeight);
        
        this.objectTypes.forEach((objType, index) => {
            const y = paletteY + index * itemHeight;
            const isSelected = index === this.selectedObjectType;
            
            if (isSelected) {
                ctx.fillStyle = 'rgba(106, 90, 205, 0.8)';
                ctx.fillRect(paletteX, y, paletteWidth, itemHeight);
            }
            
            // アイコン
            ctx.font = '32px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(objType.icon, paletteX + 10, y + 40);
            
            // 名前
            ctx.font = '18px Arial';
            ctx.fillText(objType.name, paletteX + 55, y + 35);
        });
        
        // 操作説明
        const helpX = 20;
        const helpY = canvas.height - 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(helpX, helpY, 300, 80);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('W/A/S/D: カメラ移動', helpX + 10, helpY + 20);
        ctx.fillText('↑↓: オブジェクト選択', helpX + 10, helpY + 40);
        ctx.fillText('クリック: 配置 / 右クリック: 削除', helpX + 10, helpY + 60);
    }
    
    /**
     * 武器パラメーター調整の描画
     */
    drawWeaponParams(ctx, canvas) {
        const leftPanelWidth = 200;
        const leftPanelX = 20;
        const leftPanelY = 120;  // ★サブモードボタンのため下げた
        
        // 左パネル: 武器リスト
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(leftPanelX, leftPanelY, leftPanelWidth, this.weaponList.length * 80);
        
        this.weaponList.forEach((weaponId, index) => {
            const y = leftPanelY + index * 80;
            const isSelected = index === this.selectedWeaponIndex;
            
            if (isSelected) {
                ctx.fillStyle = 'rgba(106, 90, 205, 0.8)';
                ctx.fillRect(leftPanelX, y, leftPanelWidth, 80);
            }
            
            // アイコン
            ctx.font = '40px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(this.weaponIcons[weaponId], leftPanelX + 50, y + 50);
            
            // 名前
            ctx.font = '16px Arial';
            ctx.fillText(this.weaponNames[weaponId], leftPanelX + 130, y + 40);
        });
        
        // 右パネル: パラメーター調整
        const rightPanelX = 250;
        const rightPanelY = 80;
        const rightPanelWidth = canvas.width - rightPanelX - 20;
        const rightPanelHeight = 400;
        
        const selectedWeaponId = this.weaponList[this.selectedWeaponIndex];
        const params = this.weaponParams[selectedWeaponId];
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(rightPanelX, rightPanelY, rightPanelWidth, rightPanelHeight);
        
        // タイトル
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${this.weaponNames[selectedWeaponId]} の設定`, rightPanelX + 20, rightPanelY + 40);
        
        // パラメーター表示
        const paramNames = ['攻撃力', 'クールダウン', '射程'];
        const paramKeys = ['damage', 'cooldown', 'range'];
        const paramMaxValues = [100, 5.0, 800];
        
        paramKeys.forEach((key, index) => {
            const y = rightPanelY + 100 + index * 80;
            const isSelected = index === this.selectedParamIndex;
            const value = params[key];
            const maxValue = paramMaxValues[index];
            
            // パラメーター名
            ctx.fillStyle = isSelected ? '#ffff00' : '#ffffff';
            ctx.font = isSelected ? 'bold 20px Arial' : '18px Arial';
            ctx.fillText(`${paramNames[index]}:`, rightPanelX + 20, y);
            
            // 値
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            const valueText = key === 'cooldown' ? value.toFixed(1) : Math.round(value);
            ctx.fillText(valueText, rightPanelX + 200, y);
            
            // プログレスバー
            const barX = rightPanelX + 300;
            const barY = y - 20;
            const barWidth = 300;
            const barHeight = 25;
            const fillWidth = (value / maxValue) * barWidth;
            
            // バー背景
            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // バー前景
            ctx.fillStyle = isSelected ? '#ffaa00' : '#6a5acd';
            ctx.fillRect(barX, barY, fillWidth, barHeight);
            
            // バー枠線
            ctx.strokeStyle = isSelected ? '#ffff00' : '#888888';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        });
        
        // 操作説明
        const helpX = rightPanelX;
        const helpY = canvas.height - 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(helpX, helpY, 500, 80);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Shift+↑↓: 武器選択', helpX + 10, helpY + 20);
        ctx.fillText('↑↓: パラメーター選択', helpX + 10, helpY + 40);
        ctx.fillText('[/]: 値を変更', helpX + 10, helpY + 60);
    }
    
    /**
     * テクスチャエディターの描画（マップオブジェクト）
     */
    drawTextureEditor(ctx, canvas) {
        const leftPanelWidth = 200;
        const leftPanelX = 20;
        const leftPanelY = 120;
        
        // 左パネル: テクスチャリスト
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(leftPanelX, leftPanelY, leftPanelWidth, this.objectTypes.length * 60);
        
        this.objectTypes.forEach((objType, index) => {
            const y = leftPanelY + index * 60;
            const isSelected = index === this.selectedObjectType;
            
            if (isSelected) {
                ctx.fillStyle = 'rgba(106, 90, 205, 0.8)';
                ctx.fillRect(leftPanelX, y, leftPanelWidth, 60);
            }
            
            ctx.font = '32px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(objType.icon, leftPanelX + 10, y + 40);
            
            ctx.font = '16px Arial';
            ctx.fillText(objType.name, leftPanelX + 55, y + 35);
        });
        
        // ピクセルエディター領域
        this.drawPixelEditor(ctx, canvas, 250, 120);
    }
    
    /**
     * アイコンエディターの描画（武器）
     */
    drawIconEditor(ctx, canvas) {
        const leftPanelWidth = 200;
        const leftPanelX = 20;
        const leftPanelY = 120;
        
        // 左パネル: 武器リスト
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(leftPanelX, leftPanelY, leftPanelWidth, this.weaponList.length * 80);
        
        this.weaponList.forEach((weaponId, index) => {
            const y = leftPanelY + index * 80;
            const isSelected = index === this.selectedWeaponIndex;
            
            if (isSelected) {
                ctx.fillStyle = 'rgba(106, 90, 205, 0.8)';
                ctx.fillRect(leftPanelX, y, leftPanelWidth, 80);
            }
            
            ctx.font = '40px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(this.weaponIcons[weaponId], leftPanelX + 50, y + 50);
            
            ctx.font = '16px Arial';
            ctx.fillText(this.weaponNames[weaponId], leftPanelX + 130, y + 40);
        });
        
        // ピクセルエディター領域
        this.drawPixelEditor(ctx, canvas, 250, 120);
    }
    
    /**
     * キャラクターステータスの描画
     */
    drawCharacterStats(ctx, canvas) {
        const leftPanelWidth = 200;
        const leftPanelX = 20;
        const leftPanelY = 120;
        
        // 左パネル: キャラクターリスト
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(leftPanelX, leftPanelY, leftPanelWidth, this.characterList.length * 80);
        
        this.characterList.forEach((charId, index) => {
            const y = leftPanelY + index * 80;
            const isSelected = index === this.selectedCharacterIndex;
            
            if (isSelected) {
                ctx.fillStyle = 'rgba(106, 90, 205, 0.8)';
                ctx.fillRect(leftPanelX, y, leftPanelWidth, 80);
            }
            
            ctx.font = '32px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(charId === 'player' ? '👤' : '🧟', leftPanelX + 50, y + 50);
            
            ctx.font = '16px Arial';
            ctx.fillText(this.characterNames[charId], leftPanelX + 130, y + 40);
        });
        
        // 右パネル: パラメーター調整
        const rightPanelX = 250;
        const rightPanelY = 120;
        const rightPanelWidth = canvas.width - rightPanelX - 20;
        const rightPanelHeight = 400;
        
        const selectedCharId = this.characterList[this.selectedCharacterIndex];
        const params = this.characterParams[selectedCharId];
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(rightPanelX, rightPanelY, rightPanelWidth, rightPanelHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${this.characterNames[selectedCharId]} の設定`, rightPanelX + 20, rightPanelY + 40);
        
        // パラメーター表示
        const paramNames = selectedCharId === 'player' ? 
            ['最大HP', '移動速度', 'HP回復'] : 
            ['最大HP', '移動速度', '攻撃力'];
        const paramKeys = selectedCharId === 'player' ? 
            ['maxHealth', 'speed', 'regen'] : 
            ['maxHealth', 'speed', 'damage'];
        const paramMaxValues = [200, 400, 20];
        
        paramKeys.forEach((key, index) => {
            const y = rightPanelY + 100 + index * 80;
            const isSelected = index === this.selectedCharParamIndex;
            const value = params[key];
            const maxValue = paramMaxValues[index];
            
            ctx.fillStyle = isSelected ? '#ffff00' : '#ffffff';
            ctx.font = isSelected ? 'bold 20px Arial' : '18px Arial';
            ctx.fillText(`${paramNames[index]}:`, rightPanelX + 20, y);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            const valueText = key === 'regen' ? value.toFixed(1) : Math.round(value);
            ctx.fillText(valueText, rightPanelX + 200, y);
            
            const barX = rightPanelX + 300;
            const barY = y - 20;
            const barWidth = 300;
            const barHeight = 25;
            const fillWidth = (value / maxValue) * barWidth;
            
            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = isSelected ? '#ffaa00' : '#6a5acd';
            ctx.fillRect(barX, barY, fillWidth, barHeight);
            
            ctx.strokeStyle = isSelected ? '#ffff00' : '#888888';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        });
        
        // 操作説明
        const helpX = rightPanelX;
        const helpY = canvas.height - 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(helpX, helpY, 500, 80);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Shift+↑↓: キャラ選択', helpX + 10, helpY + 20);
        ctx.fillText('↑↓: パラメーター選択', helpX + 10, helpY + 40);
        ctx.fillText('[/]: 値を変更', helpX + 10, helpY + 60);
    }
    
    /**
     * スプライトエディターの描画（キャラクター）
     */
    drawSpriteEditor(ctx, canvas) {
        const leftPanelWidth = 200;
        const leftPanelX = 20;
        const leftPanelY = 120;
        
        // 左パネル: キャラクターリスト
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(leftPanelX, leftPanelY, leftPanelWidth, this.characterList.length * 80);
        
        this.characterList.forEach((charId, index) => {
            const y = leftPanelY + index * 80;
            const isSelected = index === this.selectedCharacterIndex;
            
            if (isSelected) {
                ctx.fillStyle = 'rgba(106, 90, 205, 0.8)';
                ctx.fillRect(leftPanelX, y, leftPanelWidth, 80);
            }
            
            ctx.font = '32px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(charId === 'player' ? '👤' : '🧟', leftPanelX + 50, y + 50);
            
            ctx.font = '16px Arial';
            ctx.fillText(this.characterNames[charId], leftPanelX + 130, y + 40);
        });
        
        // ピクセルエディター領域
        this.drawPixelEditor(ctx, canvas, 250, 120);
    }
    
    /**
     * ピクセルエディターの描画（統合版）
     */
    drawPixelEditor(ctx, canvas, startX, startY) {
        // 編集中のテクスチャを取得
        let textureKey = null;
        let pixels = null;
        let width = 16;
        let height = 16;
        let pixelSize = 20;
        
        if (this.mode === 'map') {
            const objType = this.objectTypes[this.selectedObjectType];
            textureKey = objType.type;
            pixels = this.textures[textureKey];
        } else if (this.mode === 'weapon') {
            const weaponId = this.weaponList[this.selectedWeaponIndex];
            textureKey = weaponId + '_icon';
            pixels = this.textures[textureKey];
        } else if (this.mode === 'character') {
            const charId = this.characterList[this.selectedCharacterIndex];
            textureKey = charId + '_sprite';
            pixels = this.textures[textureKey];
            width = 32;
            height = 32;
            pixelSize = 12;
        }
        
        if (!pixels) return;
        
        height = pixels.length;
        width = pixels[0] ? pixels[0].length : width;
        
        // グリッド背景
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(startX, startY, width * pixelSize, height * pixelSize);
        
        // ピクセル描画
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const color = pixels[y][x];
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
        for (let i = 0; i <= width; i++) {
            ctx.beginPath();
            ctx.moveTo(startX + i * pixelSize, startY);
            ctx.lineTo(startX + i * pixelSize, startY + height * pixelSize);
            ctx.stroke();
        }
        for (let i = 0; i <= height; i++) {
            ctx.beginPath();
            ctx.moveTo(startX, startY + i * pixelSize);
            ctx.lineTo(startX + width * pixelSize, startY + i * pixelSize);
            ctx.stroke();
        }
        
        // 枠線
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(startX, startY, width * pixelSize, height * pixelSize);
        
        // プレビュー
        const previewX = startX + width * pixelSize + 50;
        const previewY = startY + 50;
        const scale = 4;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('プレビュー', previewX, previewY - 20);
        
        // チェッカーボード背景
        const previewWidth = width * scale;
        const previewHeight = height * scale;
        
        for (let y = 0; y < previewHeight; y += 8) {
            for (let x = 0; x < previewWidth; x += 8) {
                ctx.fillStyle = ((x / 8 + y / 8) % 2 === 0) ? '#cccccc' : '#999999';
                ctx.fillRect(previewX + x, previewY + y, 8, 8);
            }
        }
        
        // プレビューピクセル描画
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const color = pixels[y][x];
                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.fillRect(previewX + x * scale, previewY + y * scale, scale, scale);
                }
            }
        }
        
        // プレビュー枠線
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(previewX, previewY, previewWidth, previewHeight);
        
        // 操作説明
        const helpX = startX;
        const helpY = canvas.height - 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(helpX, helpY, 600, 80);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('※テクスチャ編集機能は次の更新で実装予定', helpX + 10, helpY + 20);
        ctx.fillText('現在はプレビューのみ表示されます', helpX + 10, helpY + 40);
        ctx.fillText('↑↓: オブジェクト/武器/キャラクター選択', helpX + 10, helpY + 60);
    }
    
    /**
     * トップメニューの描画
     */
    drawTopMenu(ctx, canvas) {
        const menuHeight = 60;
        const menuItemWidth = 100;
        const menuStartX = (canvas.width - menuItemWidth * this.menuItems.length) / 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, menuHeight);
        
        this.menuItems.forEach((item, index) => {
            const x = menuStartX + index * menuItemWidth;
            const isSelected = index === this.selectedMenuIndex;
            const isCurrentMode = (item.name === 'マップ' && this.mode === 'map') || 
                                 (item.name === '武器' && this.mode === 'weapon') ||
                                 (item.name === 'キャラクター' && this.mode === 'character');
            
            // 背景
            if (isSelected) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                ctx.fillRect(x, 10, menuItemWidth - 10, 40);
            } else if (isCurrentMode) {
                ctx.fillStyle = 'rgba(106, 90, 205, 0.5)';
                ctx.fillRect(x, 10, menuItemWidth - 10, 40);
            }
            
            // テキスト
            ctx.fillStyle = isSelected ? '#ffff00' : (isCurrentMode ? '#ffffff' : '#aaaaaa');
            ctx.font = isSelected ? 'bold 18px Arial' : '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.name, x + menuItemWidth / 2 - 5, 35);
        });
        
        // 操作説明（右上）
        ctx.fillStyle = '#888888';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('←→: メニュー選択  Enter: 実行  ESC: タイトルに戻る', canvas.width - 20, 35);
    }
    
    /**
     * グリッドの描画
     */
    drawGrid(ctx, canvas) {
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1;
        
        const camera = this.game.camera;
        const viewBounds = camera.getViewBounds();
        
        // 縦線
        const startX = Math.floor(viewBounds.left / this.gridSize) * this.gridSize;
        const endX = Math.ceil(viewBounds.right / this.gridSize) * this.gridSize;
        for (let x = startX; x <= endX; x += this.gridSize) {
            const screenPos = camera.worldToScreen(x, 0);
            ctx.beginPath();
            ctx.moveTo(screenPos.x, 0);
            ctx.lineTo(screenPos.x, canvas.height);
            ctx.stroke();
        }
        
        // 横線
        const startY = Math.floor(viewBounds.top / this.gridSize) * this.gridSize;
        const endY = Math.ceil(viewBounds.bottom / this.gridSize) * this.gridSize;
        for (let y = startY; y <= endY; y += this.gridSize) {
            const screenPos = camera.worldToScreen(0, y);
            ctx.beginPath();
            ctx.moveTo(0, screenPos.y);
            ctx.lineTo(canvas.width, screenPos.y);
            ctx.stroke();
        }
        
        // 原点を強調
        const originScreen = camera.worldToScreen(0, 0);
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(originScreen.x, 0);
        ctx.lineTo(originScreen.x, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, originScreen.y);
        ctx.lineTo(canvas.width, originScreen.y);
        ctx.stroke();
    }
    
    /**
     * マウスクリックの処理
     */
    handleClick(screenX, screenY, button) {
        // サブモードボタンのクリック
        const buttonY = 70;
        const buttonWidth = 150;
        const buttonHeight = 35;
        const buttonX = 200;
        
        if (screenY >= buttonY && screenY <= buttonY + buttonHeight) {
            if (this.mode === 'map') {
                if (screenX >= buttonX && screenX < buttonX + buttonWidth) {
                    this.subMode = 'placement';
                    return;
                } else if (screenX >= buttonX + buttonWidth + 10 && screenX < buttonX + 2 * buttonWidth + 10) {
                    this.subMode = 'texture';
                    return;
                }
            } else if (this.mode === 'weapon') {
                if (screenX >= buttonX && screenX < buttonX + buttonWidth) {
                    this.subMode = 'params';
                    return;
                } else if (screenX >= buttonX + buttonWidth + 10 && screenX < buttonX + 2 * buttonWidth + 10) {
                    this.subMode = 'icon';
                    return;
                }
            } else if (this.mode === 'character') {
                if (screenX >= buttonX && screenX < buttonX + buttonWidth) {
                    this.subMode = 'stats';
                    return;
                } else if (screenX >= buttonX + buttonWidth + 10 && screenX < buttonX + 2 * buttonWidth + 10) {
                    this.subMode = 'sprite';
                    return;
                }
            }
        }
        
        // マップ配置モードのクリック処理
        if (this.mode === 'map' && this.subMode === 'placement') {
            const worldPos = this.game.camera.screenToWorld(screenX, screenY);
            
            if (button === 0) {
                // 左クリック: オブジェクト配置
                const objType = this.objectTypes[this.selectedObjectType];
                
                // グリッドスナップ
                const snappedX = Math.round(worldPos.x / this.gridSize) * this.gridSize;
                const snappedY = Math.round(worldPos.y / this.gridSize) * this.gridSize;
                
                // 重複チェック
                const exists = this.placedObjects.some(obj => 
                    Math.abs(obj.x - snappedX) < 10 && Math.abs(obj.y - snappedY) < 10
                );
                
                if (!exists) {
                    this.placedObjects.push({
                        x: snappedX,
                        y: snappedY,
                        type: objType.type,
                        size: objType.size,
                        color: objType.color,
                        hasCollision: objType.hasCollision
                    });
                    console.log(`[Editor] Placed ${objType.type} at (${snappedX}, ${snappedY})`);
                }
            } else if (button === 2) {
                // 右クリック: オブジェクト削除
                const removeRadius = 30;
                this.placedObjects = this.placedObjects.filter(obj => {
                    const dist = Math.sqrt((obj.x - worldPos.x) ** 2 + (obj.y - worldPos.y) ** 2);
                    return dist > removeRadius;
                });
            }
        }
    }
    
    /**
     * キー入力の処理
     */
    handleKeyDown(key) {
        // トップメニュー操作
        if (key === 'ArrowLeft') {
            this.selectedMenuIndex = Math.max(0, this.selectedMenuIndex - 1);
            return true;
        } else if (key === 'ArrowRight') {
            this.selectedMenuIndex = Math.min(this.menuItems.length - 1, this.selectedMenuIndex + 1);
            return true;
        } else if (key === 'Enter') {
            this.menuItems[this.selectedMenuIndex].action();
            return true;
        } else if (key === 'Escape') {
            this.exit();
            return true;
        }
        
        // マップエディター操作
        if (this.mode === 'map') {
            if (this.subMode === 'placement') {
                if (key === 'g' || key === 'G') {
                    this.showGrid = !this.showGrid;
                    return true;
                } else if (key === '+' || key === '=') {
                    this.game.camera.setZoom(this.game.camera.zoom + this.cameraZoomSpeed);
                    return true;
                } else if (key === '-' || key === '_') {
                    this.game.camera.setZoom(this.game.camera.zoom - this.cameraZoomSpeed);
                    return true;
                }
            }
            if (key === 'ArrowUp') {
                this.selectedObjectType = Math.max(0, this.selectedObjectType - 1);
                return true;
            } else if (key === 'ArrowDown') {
                this.selectedObjectType = Math.min(this.objectTypes.length - 1, this.selectedObjectType + 1);
                return true;
            } else if (key === 't' || key === 'T') {
                // Tキーでサブモード切り替え
                this.subMode = this.subMode === 'placement' ? 'texture' : 'placement';
                return true;
            }
        }
        
        // 武器エディター操作
        if (this.mode === 'weapon') {
            if (this.subMode === 'params') {
                const selectedWeaponId = this.weaponList[this.selectedWeaponIndex];
                const params = this.weaponParams[selectedWeaponId];
                const paramKeys = ['damage', 'cooldown', 'range'];
                const selectedParamKey = paramKeys[this.selectedParamIndex];
                
                if (key === 'ArrowUp') {
                    if (this.game.keys['Shift']) {
                        this.selectedWeaponIndex = Math.max(0, this.selectedWeaponIndex - 1);
                    } else {
                        this.selectedParamIndex = Math.max(0, this.selectedParamIndex - 1);
                    }
                    return true;
                } else if (key === 'ArrowDown') {
                    if (this.game.keys['Shift']) {
                        this.selectedWeaponIndex = Math.min(this.weaponList.length - 1, this.selectedWeaponIndex + 1);
                    } else {
                        this.selectedParamIndex = Math.min(paramKeys.length - 1, this.selectedParamIndex + 1);
                    }
                    return true;
                } else if (key === '[') {
                    if (selectedParamKey === 'damage') {
                        params[selectedParamKey] = Math.max(1, params[selectedParamKey] - 1);
                    } else if (selectedParamKey === 'cooldown') {
                        params[selectedParamKey] = Math.max(0.1, params[selectedParamKey] - 0.1);
                    } else if (selectedParamKey === 'range') {
                        params[selectedParamKey] = Math.max(50, params[selectedParamKey] - 10);
                    }
                    return true;
                } else if (key === ']') {
                    if (selectedParamKey === 'damage') {
                        params[selectedParamKey] = Math.min(100, params[selectedParamKey] + 1);
                    } else if (selectedParamKey === 'cooldown') {
                        params[selectedParamKey] = Math.min(5.0, params[selectedParamKey] + 0.1);
                    } else if (selectedParamKey === 'range') {
                        params[selectedParamKey] = Math.min(800, params[selectedParamKey] + 10);
                    }
                    return true;
                }
            }
            if (key === 'ArrowUp' && !this.game.keys['Shift']) {
                this.selectedWeaponIndex = Math.max(0, this.selectedWeaponIndex - 1);
                return true;
            } else if (key === 'ArrowDown' && !this.game.keys['Shift']) {
                this.selectedWeaponIndex = Math.min(this.weaponList.length - 1, this.selectedWeaponIndex + 1);
                return true;
            } else if (key === 't' || key === 'T') {
                this.subMode = this.subMode === 'params' ? 'icon' : 'params';
                return true;
            }
        }
        
        // キャラクターエディター操作
        if (this.mode === 'character') {
            if (this.subMode === 'stats') {
                const selectedCharId = this.characterList[this.selectedCharacterIndex];
                const params = this.characterParams[selectedCharId];
                const paramKeys = selectedCharId === 'player' ? 
                    ['maxHealth', 'speed', 'regen'] : 
                    ['maxHealth', 'speed', 'damage'];
                const selectedParamKey = paramKeys[this.selectedCharParamIndex];
                
                if (key === 'ArrowUp') {
                    if (this.game.keys['Shift']) {
                        this.selectedCharacterIndex = Math.max(0, this.selectedCharacterIndex - 1);
                    } else {
                        this.selectedCharParamIndex = Math.max(0, this.selectedCharParamIndex - 1);
                    }
                    return true;
                } else if (key === 'ArrowDown') {
                    if (this.game.keys['Shift']) {
                        this.selectedCharacterIndex = Math.min(this.characterList.length - 1, this.selectedCharacterIndex + 1);
                    } else {
                        this.selectedCharParamIndex = Math.min(paramKeys.length - 1, this.selectedCharParamIndex + 1);
                    }
                    return true;
                } else if (key === '[') {
                    if (selectedParamKey === 'maxHealth') {
                        params[selectedParamKey] = Math.max(10, params[selectedParamKey] - 5);
                    } else if (selectedParamKey === 'speed') {
                        params[selectedParamKey] = Math.max(50, params[selectedParamKey] - 10);
                    } else if (selectedParamKey === 'damage') {
                        params[selectedParamKey] = Math.max(1, params[selectedParamKey] - 1);
                    } else if (selectedParamKey === 'regen') {
                        params[selectedParamKey] = Math.max(0, params[selectedParamKey] - 0.1);
                    }
                    return true;
                } else if (key === ']') {
                    if (selectedParamKey === 'maxHealth') {
                        params[selectedParamKey] = Math.min(200, params[selectedParamKey] + 5);
                    } else if (selectedParamKey === 'speed') {
                        params[selectedParamKey] = Math.min(400, params[selectedParamKey] + 10);
                    } else if (selectedParamKey === 'damage') {
                        params[selectedParamKey] = Math.min(20, params[selectedParamKey] + 1);
                    } else if (selectedParamKey === 'regen') {
                        params[selectedParamKey] = Math.min(10, params[selectedParamKey] + 0.1);
                    }
                    return true;
                }
            }
            if (key === 'ArrowUp' && !this.game.keys['Shift']) {
                this.selectedCharacterIndex = Math.max(0, this.selectedCharacterIndex - 1);
                return true;
            } else if (key === 'ArrowDown' && !this.game.keys['Shift']) {
                this.selectedCharacterIndex = Math.min(this.characterList.length - 1, this.selectedCharacterIndex + 1);
                return true;
            } else if (key === 't' || key === 'T') {
                this.subMode = this.subMode === 'stats' ? 'sprite' : 'stats';
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * LocalStorageに保存
     */
    saveToLocalStorage() {
        try {
            const data = {
                objects: this.placedObjects,
                weapons: this.weaponParams,
                characters: this.characterParams,
                textures: this.textures
            };
            localStorage.setItem('editor_data', JSON.stringify(data));
            console.log('[Editor] Saved to LocalStorage:', data);
            
            alert('保存しました！');
        } catch (error) {
            console.error('[Editor] Failed to save:', error);
            alert('保存に失敗しました');
        }
    }
    
    /**
     * LocalStorageから読み込み
     */
    loadFromLocalStorage() {
        try {
            const dataStr = localStorage.getItem('editor_data');
            if (dataStr) {
                const data = JSON.parse(dataStr);
                if (data.objects) {
                    this.placedObjects = data.objects;
                }
                if (data.weapons) {
                    // 武器パラメーターの検証とサニタイズ
                    const validatedWeapons = {};
                    for (const weaponId in data.weapons) {
                        if (this.weaponParams[weaponId]) {
                            const params = data.weapons[weaponId];
                            validatedWeapons[weaponId] = {
                                damage: Math.max(1, Math.min(100, Number(params.damage) || 15)),
                                cooldown: Math.max(0.1, Math.min(5.0, Number(params.cooldown) || 1.0)),
                                range: Math.max(50, Math.min(800, Number(params.range) || 400))
                            };
                        }
                    }
                    this.weaponParams = { ...this.weaponParams, ...validatedWeapons };
                }
                if (data.characters) {
                    // キャラクターパラメーターの検証とサニタイズ
                    const validatedChars = {};
                    for (const charId in data.characters) {
                        if (this.characterParams[charId]) {
                            const params = data.characters[charId];
                            if (charId === 'player') {
                                validatedChars[charId] = {
                                    maxHealth: Math.max(10, Math.min(200, Number(params.maxHealth) || 100)),
                                    speed: Math.max(50, Math.min(400, Number(params.speed) || 200)),
                                    regen: Math.max(0, Math.min(10, Number(params.regen) || 0))
                                };
                            } else {
                                validatedChars[charId] = {
                                    maxHealth: Math.max(10, Math.min(200, Number(params.maxHealth) || 50)),
                                    speed: Math.max(50, Math.min(400, Number(params.speed) || 60)),
                                    damage: Math.max(1, Math.min(20, Number(params.damage) || 10))
                                };
                            }
                        }
                    }
                    this.characterParams = { ...this.characterParams, ...validatedChars };
                }
                if (data.textures) {
                    // テクスチャデータを復元
                    this.textures = { ...this.textures, ...data.textures };
                }
                console.log('[Editor] Loaded from LocalStorage:', data);
            }
        } catch (error) {
            console.error('[Editor] Failed to load:', error);
        }
    }
    
    /**
     * ピクセルテクスチャのレンダリング（静的メソッド）
     */
    static renderPixelTexture(ctx, pixels, x, y, zoom = 1.0) {
        if (!pixels || pixels.length === 0) return;
        
        const height = pixels.length;
        const width = pixels[0] ? pixels[0].length : 0;
        
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const color = pixels[py][px];
                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        x + (px - width / 2) * zoom,
                        y + (py - height / 2) * zoom,
                        zoom,
                        zoom
                    );
                }
            }
        }
    }
    
    /**
     * ピクセルテクスチャのレンダリング（インスタンスメソッド）
     */
    renderPixelTexture(ctx, pixels, x, y, zoom = 1.0) {
        Editor.renderPixelTexture(ctx, pixels, x, y, zoom);
    }
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.Editor = Editor;
}

console.log('Editor loaded');
