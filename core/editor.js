/**
 * エディタコアシステム
 */
class EditorCore {
  constructor() {
    this.currentTab = 'weapon';
    this.previewCanvas = null;
    this.previewCtx = null;
    this.previewAnimation = null;
    this.currentWeapon = null;
  }
  
  /**
   * 初期化
   */
  init() {
    this.setupCanvas();
    this.setupTabSwitching();
    this.setupButtons();
    
    console.log('[Editor] Initialized');
  }
  
  /**
   * キャンバス設定
   */
  setupCanvas() {
    this.previewCanvas = document.getElementById('preview-canvas');
    if (this.previewCanvas) {
      this.previewCanvas.width = 800;
      this.previewCanvas.height = 600;
      this.previewCtx = this.previewCanvas.getContext('2d');
    }
  }
  
  /**
   * タブ切り替え設定
   */
  setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.editor-section');
    
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // タブボタンの切り替え
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // セクションの切り替え
        sections.forEach(s => s.classList.remove('active'));
        const targetSection = document.getElementById(`${tabName}-editor`);
        if (targetSection) {
          targetSection.classList.add('active');
        }
        
        this.currentTab = tabName;
        this.stopPreview();
      });
    });
  }
  
  /**
   * ボタン設定
   */
  setupButtons() {
    // ゲームに戻る
    const btnBackToGame = document.getElementById('btn-back-to-game');
    if (btnBackToGame) {
      btnBackToGame.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }
    
    // JSON出力
    const btnExportJson = document.getElementById('btn-export-json');
    if (btnExportJson) {
      btnExportJson.addEventListener('click', () => {
        this.exportJSON();
      });
    }
    
    // JSON読込
    const btnImportJson = document.getElementById('btn-import-json');
    const fileImportJson = document.getElementById('file-import-json');
    if (btnImportJson && fileImportJson) {
      btnImportJson.addEventListener('click', () => {
        fileImportJson.click();
      });
      
      fileImportJson.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.importJSON(file);
        }
      });
    }
    
    // 保存
    const btnSave = document.getElementById('btn-save');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        this.saveToLocalStorage();
      });
    }
  }
  
  /**
   * プレビュー開始
   */
  startPreview(weapon) {
    this.stopPreview();
    this.currentWeapon = weapon;
    
    let lastTime = performance.now();
    const animate = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      this.renderPreview(weapon, deltaTime);
      this.previewAnimation = requestAnimationFrame(animate);
    };
    
    this.previewAnimation = requestAnimationFrame(animate);
  }
  
  /**
   * プレビュー停止
   */
  stopPreview() {
    if (this.previewAnimation) {
      cancelAnimationFrame(this.previewAnimation);
      this.previewAnimation = null;
    }
  }
  
  /**
   * プレビュー描画
   */
  renderPreview(weapon, deltaTime) {
    const ctx = this.previewCtx;
    const canvas = this.previewCanvas;
    
    // 背景クリア
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // グリッド描画
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // 中心点
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // プレイヤー（簡易表示）
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // 武器情報テキスト
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText(`武器: ${weapon.name}`, 20, 30);
    ctx.fillText(`タイプ: ${weapon.type}`, 20, 50);
    ctx.fillText(`ダメージ: ${weapon.damage}`, 20, 70);
    ctx.fillText(`攻撃速度: ${weapon.attackSpeed}秒`, 20, 90);
    ctx.fillText(`射程: ${weapon.range}px`, 20, 110);
    
    // 射程範囲表示
    ctx.strokeStyle = weapon.effectColor + '40';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, weapon.range, 0, Math.PI * 2);
    ctx.stroke();
    
    // 武器エフェクトのサンプル表示
    ctx.fillStyle = weapon.effectColor;
    ctx.globalAlpha = 0.7;
    
    if (weapon.type === 'melee') {
      // 近接武器: 扇形
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, weapon.range * 0.5, -Math.PI / 6, Math.PI / 6);
      ctx.closePath();
      ctx.fill();
    } else if (weapon.type === 'ranged') {
      // 遠距離武器: 弾丸
      ctx.beginPath();
      ctx.arc(centerX + 50, centerY, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (weapon.type === 'magic') {
      // 魔法: エフェクト
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2 / 3) + performance.now() / 1000;
        const x = centerX + Math.cos(angle) * 40;
        const y = centerY + Math.sin(angle) * 40;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.globalAlpha = 1.0;
  }
  
  /**
   * JSON出力
   */
  exportJSON() {
    let data = null;
    
    if (this.currentTab === 'weapon' && window.weaponEditor) {
      data = window.weaponEditor.getWeaponData();
    }
    
    if (!data) {
      alert('出力するデータがありません');
      return;
    }
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.id || 'plugin'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('[Editor] Exported JSON:', data);
  }
  
  /**
   * JSON読込
   */
  importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (this.currentTab === 'weapon' && window.weaponEditor) {
          window.weaponEditor.loadWeaponData(data);
        }
        
        console.log('[Editor] Imported JSON:', data);
        alert('読み込みが完了しました');
      } catch (error) {
        console.error('[Editor] Failed to import JSON:', error);
        alert('JSONの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  }
  
  /**
   * LocalStorageに保存
   */
  saveToLocalStorage() {
    let data = null;
    let key = null;
    
    if (this.currentTab === 'weapon' && window.weaponEditor) {
      data = window.weaponEditor.getWeaponData();
      key = `weapon_${data.id}`;
    }
    
    if (!data) {
      alert('保存するデータがありません');
      return;
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log('[Editor] Saved to localStorage:', key);
      alert('保存しました！');
    } catch (error) {
      console.error('[Editor] Failed to save:', error);
      alert('保存に失敗しました');
    }
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.EditorCore = EditorCore;
  
  // ページ読み込み時に初期化
  window.addEventListener('DOMContentLoaded', () => {
    const editor = new EditorCore();
    editor.init();
    window.editorCore = editor;
  });
}
