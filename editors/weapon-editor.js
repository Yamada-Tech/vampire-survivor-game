// editors/weapon-editor.js

/**
 * 武器エディタ
 * カスタム武器を作成・編集するためのビジュアルエディタ
 */
class WeaponEditor {
  constructor() {
    this.canvas = document.getElementById('preview-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    
    this.currentWeaponData = null;
    this.previewWeapon = null;
    this.animationTime = 0;
    this.lastTime = performance.now();
    
    this.setupFormHandlers();
    this.startPreviewAnimation();
    this.loadWeaponFromURL();
  }
  
  /**
   * フォームイベントハンドラーの設定
   */
  setupFormHandlers() {
    const form = document.getElementById('weapon-form');
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveWeapon();
    });
    
    // リアルタイムプレビュー更新
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.updatePreview();
      });
    });
    
    // テストボタン
    document.getElementById('btn-test').addEventListener('click', () => {
      this.testWeapon();
    });
    
    // リセットボタン
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('すべての変更をリセットしますか？')) {
        form.reset();
        this.updatePreview();
      }
    });
  }
  
  /**
   * フォームから武器データを取得
   */
  getWeaponDataFromForm() {
    const weaponId = this.currentWeaponData?.id || `custom-weapon-${Date.now()}`;
    
    return {
      id: weaponId,
      name: document.getElementById('weapon-name').value,
      description: document.getElementById('weapon-description').value,
      author: document.getElementById('weapon-author').value,
      version: this.currentWeaponData?.version || '1.0.0',
      type: document.getElementById('weapon-type').value,
      damage: parseFloat(document.getElementById('weapon-damage').value),
      attackSpeed: parseFloat(document.getElementById('weapon-attack-speed').value),
      range: parseFloat(document.getElementById('weapon-range').value),
      knockback: parseFloat(document.getElementById('weapon-knockback').value),
      pierce: parseInt(document.getElementById('weapon-pierce').value),
      effectColor: document.getElementById('weapon-effect-color').value,
      effectSize: parseFloat(document.getElementById('weapon-effect-size').value),
      createdAt: this.currentWeaponData?.createdAt || Date.now(),
      updatedAt: Date.now()
    };
  }
  
  /**
   * 武器データをフォームに読み込む
   */
  loadWeaponData(data) {
    this.currentWeaponData = data;
    
    document.getElementById('weapon-name').value = data.name || '';
    document.getElementById('weapon-description').value = data.description || '';
    document.getElementById('weapon-author').value = data.author || '';
    document.getElementById('weapon-type').value = data.type || 'melee';
    document.getElementById('weapon-damage').value = data.damage || 20;
    document.getElementById('weapon-attack-speed').value = data.attackSpeed || 1.0;
    document.getElementById('weapon-range').value = data.range || 100;
    document.getElementById('weapon-knockback').value = data.knockback || 5;
    document.getElementById('weapon-pierce').value = data.pierce || 1;
    document.getElementById('weapon-effect-color').value = data.effectColor || '#ffffff';
    document.getElementById('weapon-effect-size').value = data.effectSize || 1.0;
    
    this.updatePreview();
  }
  
  /**
   * URLパラメータから武器IDを取得して読み込み
   */
  loadWeaponFromURL() {
    const params = new URLSearchParams(window.location.search);
    const weaponId = params.get('edit');
    
    if (weaponId) {
      const key = `weapon_${weaponId}`;
      const dataStr = localStorage.getItem(key);
      
      if (dataStr) {
        try {
          const data = JSON.parse(dataStr);
          this.loadWeaponData(data);
          console.log(`[WeaponEditor] Loaded weapon for editing: ${weaponId}`);
        } catch (error) {
          console.error('[WeaponEditor] Failed to load weapon:', error);
        }
      } else {
        console.warn(`[WeaponEditor] Weapon not found: ${weaponId}`);
      }
    }
  }
  
  /**
   * 武器を保存
   */
  saveWeapon() {
    const data = this.getWeaponDataFromForm();
    
    // バリデーション
    if (!data.name || data.name.trim() === '') {
      alert('武器名を入力してください');
      return;
    }
    
    if (!data.author || data.author.trim() === '') {
      alert('作者名を入力してください');
      return;
    }
    
    // LocalStorageに保存
    const key = `weapon_${data.id}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`[WeaponEditor] Saved weapon: ${data.name} (${data.id})`);
      
      alert(`武器「${data.name}」を保存しました！\nゲーム画面に戻って使用できます。`);
      
      // 保存後、ゲームに戻るか聞く
      if (confirm('ゲーム画面に戻りますか？')) {
        window.location.href = 'index.html';
      }
    } catch (error) {
      console.error('[WeaponEditor] Failed to save weapon:', error);
      alert('保存に失敗しました。LocalStorageの容量を確認してください。');
    }
  }
  
  /**
   * プレビューを更新
   */
  updatePreview() {
    const data = this.getWeaponDataFromForm();
    
    // プレビュー用武器インスタンスを作成
    if (window.CustomWeaponLoader) {
      const loader = new CustomWeaponLoader();
      const WeaponClass = loader.createWeaponClass(data);
      this.previewWeapon = new WeaponClass();
    }
    
    // ステータス表示を更新
    this.updateStats(data);
  }
  
  /**
   * ステータス表示を更新
   */
  updateStats(data) {
    const statsDiv = document.getElementById('preview-stats');
    
    let typeText = '';
    if (data.type === 'melee') typeText = '近接攻撃 (扇形範囲)';
    else if (data.type === 'ranged') typeText = '遠距離攻撃 (弾丸)';
    else if (data.type === 'magic') typeText = '魔法攻撃 (追尾)';
    
    const dps = (data.damage / data.attackSpeed).toFixed(1);
    
    statsDiv.innerHTML = `
      <strong>武器ステータス:</strong><br>
      タイプ: ${typeText}<br>
      DPS: ${dps} (ダメージ ${data.damage} / ${data.attackSpeed}秒)<br>
      射程: ${data.range}px<br>
      ノックバック: ${data.knockback}<br>
      貫通: ${data.pierce}体<br>
      エフェクト: ${data.effectColor} (サイズ ${data.effectSize}x)
    `;
  }
  
  /**
   * 武器をテスト
   */
  testWeapon() {
    const data = this.getWeaponDataFromForm();
    
    if (!data.name || data.name.trim() === '') {
      alert('武器名を入力してください');
      return;
    }
    
    // 一時保存
    const tempKey = `weapon_temp_test`;
    localStorage.setItem(tempKey, JSON.stringify(data));
    
    alert('武器をテストします。ゲーム画面で選択して試してみてください。');
    window.location.href = 'index.html';
  }
  
  /**
   * プレビューアニメーション
   */
  startPreviewAnimation() {
    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      
      this.animationTime += deltaTime;
      
      this.drawPreview();
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  /**
   * プレビュー描画
   */
  drawPreview() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 背景
    ctx.fillStyle = '#0f0f1e';
    ctx.fillRect(0, 0, width, height);
    
    // グリッド
    ctx.strokeStyle = 'rgba(139, 69, 255, 0.2)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // プレイヤー位置（中央）
    const playerX = width / 2;
    const playerY = height / 2;
    
    // プレイヤーを描画
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(playerX, playerY, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // 武器エフェクトを描画
    if (this.previewWeapon) {
      const angle = this.animationTime * 2; // 回転アニメーション
      
      ctx.save();
      ctx.translate(playerX, playerY);
      ctx.rotate(angle);
      
      const range = this.previewWeapon.range;
      const color = this.previewWeapon.effectColor;
      const size = this.previewWeapon.effectSize;
      
      if (this.previewWeapon.type === 'melee') {
        // 近接攻撃: 扇形
        ctx.strokeStyle = color;
        ctx.lineWidth = 3 * size;
        ctx.beginPath();
        ctx.arc(0, 0, range, -Math.PI / 4, Math.PI / 4);
        ctx.stroke();
      } else if (this.previewWeapon.type === 'ranged') {
        // 遠距離攻撃: 弾丸
        const bulletX = Math.cos(0) * range * 0.7;
        const bulletY = Math.sin(0) * range * 0.7;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(bulletX, bulletY, 5 * size, 0, Math.PI * 2);
        ctx.fill();
        
        // 軌跡
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(bulletX, bulletY);
        ctx.stroke();
      } else if (this.previewWeapon.type === 'magic') {
        // 魔法攻撃: 追尾弾
        const count = Math.min(3, this.previewWeapon.pierce);
        
        for (let i = 0; i < count; i++) {
          const offsetAngle = (i - 1) * Math.PI / 6;
          const bulletX = Math.cos(offsetAngle) * range * 0.7;
          const bulletY = Math.sin(offsetAngle) * range * 0.7;
          
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(bulletX, bulletY, 5 * size, 0, Math.PI * 2);
          ctx.fill();
          
          // 軌跡
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bulletX, bulletY);
          ctx.lineTo(bulletX - Math.cos(offsetAngle) * 15, bulletY - Math.sin(offsetAngle) * 15);
          ctx.stroke();
        }
      }
      
      ctx.restore();
      
      // 射程範囲を描画
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(playerX, playerY, range, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // 説明テキスト
    ctx.fillStyle = '#8b45ff';
    ctx.font = '14px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('プレビュー (武器は自動回転します)', width / 2, 30);
  }
}

// ページ読み込み時に初期化
window.addEventListener('DOMContentLoaded', () => {
  window.weaponEditor = new WeaponEditor();
});
