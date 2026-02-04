/**
 * Editor System - Map & Weapon Editor
 * マップと武器のエディター機能
 */

class Editor {
    constructor(game) {
        this.game = game;
        
        // エディターモード: 'map' | 'weapon'
        this.mode = 'map';
        
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
        
        // トップメニュー
        this.selectedMenuIndex = 0;
        this.menuItems = [
            { name: 'マップ', action: () => this.mode = 'map' },
            { name: '武器', action: () => this.mode = 'weapon' },
            { name: '保存', action: () => this.saveToLocalStorage() },
            { name: '読込', action: () => this.loadFromLocalStorage() },
            { name: '戻る', action: () => this.exit() }
        ];
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
            this.drawMapEditor(ctx, canvas);
        } else if (this.mode === 'weapon') {
            this.drawWeaponEditor(ctx, canvas);
        }
        
        // トップメニュー
        this.drawTopMenu(ctx, canvas);
    }
    
    /**
     * マップエディターの描画
     */
    drawMapEditor(ctx, canvas) {
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
     * 武器エディターの描画
     */
    drawWeaponEditor(ctx, canvas) {
        const leftPanelWidth = 200;
        const leftPanelX = 20;
        const leftPanelY = 80;
        
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
                                 (item.name === '武器' && this.mode === 'weapon');
            
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
        if (this.mode === 'map') {
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
            if (key === 'ArrowUp') {
                this.selectedObjectType = Math.max(0, this.selectedObjectType - 1);
                return true;
            } else if (key === 'ArrowDown') {
                this.selectedObjectType = Math.min(this.objectTypes.length - 1, this.selectedObjectType + 1);
                return true;
            } else if (key === 'g' || key === 'G') {
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
        
        // 武器エディター操作
        if (this.mode === 'weapon') {
            const selectedWeaponId = this.weaponList[this.selectedWeaponIndex];
            const params = this.weaponParams[selectedWeaponId];
            const paramKeys = ['damage', 'cooldown', 'range'];
            const selectedParamKey = paramKeys[this.selectedParamIndex];
            
            if (key === 'ArrowUp') {
                if (this.game.keys['Shift']) {
                    // Shift + 矢印: 武器選択
                    this.selectedWeaponIndex = Math.max(0, this.selectedWeaponIndex - 1);
                } else {
                    // 矢印: パラメーター選択
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
                // 値を減少
                if (selectedParamKey === 'damage') {
                    params[selectedParamKey] = Math.max(1, params[selectedParamKey] - 1);
                } else if (selectedParamKey === 'cooldown') {
                    params[selectedParamKey] = Math.max(0.1, params[selectedParamKey] - 0.1);
                } else if (selectedParamKey === 'range') {
                    params[selectedParamKey] = Math.max(50, params[selectedParamKey] - 10);
                }
                return true;
            } else if (key === ']') {
                // 値を増加
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
        
        return false;
    }
    
    /**
     * LocalStorageに保存
     */
    saveToLocalStorage() {
        try {
            const data = {
                objects: this.placedObjects,
                weapons: this.weaponParams
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
                    this.weaponParams = { ...this.weaponParams, ...data.weapons };
                }
                console.log('[Editor] Loaded from LocalStorage:', data);
            }
        } catch (error) {
            console.error('[Editor] Failed to load:', error);
        }
    }
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.Editor = Editor;
}

console.log('Editor loaded');
