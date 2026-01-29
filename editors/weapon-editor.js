/**
 * 武器エディタ
 */
class WeaponEditor {
  constructor() {
    this.weaponData = this.getDefaultWeaponData();
    this.setupUI();
  }
  
  /**
   * デフォルト武器データ
   */
  getDefaultWeaponData() {
    return {
      id: 'custom-weapon-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      name: 'カスタム武器',
      description: '',
      author: 'User',
      version: '1.0.0',
      type: 'melee',
      damage: 25,
      attackSpeed: 1.0,
      range: 150,
      knockback: 5,
      pierce: 1,
      effectColor: '#ffffff',
      effectSize: 1.0
    };
  }
  
  /**
   * HTML特殊文字をエスケープ
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * UI設定
   */
  setupUI() {
    const container = document.getElementById('weapon-editor');
    if (!container) return;
    
    container.innerHTML = `
      <div class="form-group">
        <label>武器ID</label>
        <input type="text" id="weapon-id" value="${this.escapeHtml(this.weaponData.id)}" readonly>
      </div>
      
      <div class="form-group">
        <label>名前</label>
        <input type="text" id="weapon-name" value="${this.escapeHtml(this.weaponData.name)}">
      </div>
      
      <div class="form-group">
        <label>説明</label>
        <textarea id="weapon-description">${this.escapeHtml(this.weaponData.description)}</textarea>
      </div>
      
      <div class="form-group">
        <label>タイプ</label>
        <select id="weapon-type">
          <option value="melee">近接 (Melee)</option>
          <option value="ranged">遠距離 (Ranged)</option>
          <option value="magic">魔法 (Magic)</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>ダメージ</label>
        <div class="slider-container">
          <input type="range" id="weapon-damage" min="1" max="200" value="${this.weaponData.damage}">
          <span class="slider-value" id="weapon-damage-value">${this.weaponData.damage}</span>
        </div>
      </div>
      
      <div class="form-group">
        <label>攻撃速度 (秒)</label>
        <div class="slider-container">
          <input type="range" id="weapon-attack-speed" min="0.1" max="5.0" step="0.1" value="${this.weaponData.attackSpeed}">
          <span class="slider-value" id="weapon-attack-speed-value">${this.weaponData.attackSpeed}秒</span>
        </div>
      </div>
      
      <div class="form-group">
        <label>射程 (px)</label>
        <div class="slider-container">
          <input type="range" id="weapon-range" min="50" max="800" value="${this.weaponData.range}">
          <span class="slider-value" id="weapon-range-value">${this.weaponData.range}px</span>
        </div>
      </div>
      
      <div class="form-group">
        <label>ノックバック</label>
        <div class="slider-container">
          <input type="range" id="weapon-knockback" min="0" max="50" value="${this.weaponData.knockback}">
          <span class="slider-value" id="weapon-knockback-value">${this.weaponData.knockback}</span>
        </div>
      </div>
      
      <div class="form-group">
        <label>貫通数</label>
        <div class="slider-container">
          <input type="range" id="weapon-pierce" min="1" max="10" value="${this.weaponData.pierce}">
          <span class="slider-value" id="weapon-pierce-value">${this.weaponData.pierce}</span>
        </div>
      </div>
      
      <div class="form-group">
        <label>エフェクト色</label>
        <div class="color-picker-container">
          <input type="color" id="weapon-effect-color" value="${this.weaponData.effectColor}">
          <span class="color-value" id="weapon-effect-color-value">${this.weaponData.effectColor}</span>
        </div>
      </div>
      
      <div class="form-group">
        <label>エフェクトサイズ</label>
        <div class="slider-container">
          <input type="range" id="weapon-effect-size" min="0.1" max="3.0" step="0.1" value="${this.weaponData.effectSize}">
          <span class="slider-value" id="weapon-effect-size-value">${this.weaponData.effectSize}x</span>
        </div>
      </div>
    `;
    
    this.attachEventListeners();
    this.updatePreview();
  }
  
  /**
   * イベントリスナー設定
   */
  attachEventListeners() {
    // テキスト入力
    ['name', 'description'].forEach(field => {
      const input = document.getElementById(`weapon-${field}`);
      if (input) {
        input.addEventListener('input', () => {
          this.weaponData[field] = input.value;
          this.updatePreview();
        });
      }
    });
    
    // セレクト
    const typeSelect = document.getElementById('weapon-type');
    if (typeSelect) {
      typeSelect.value = this.weaponData.type;
      typeSelect.addEventListener('change', () => {
        this.weaponData.type = typeSelect.value;
        this.updatePreview();
      });
    }
    
    // スライダー
    const sliders = [
      { id: 'damage', suffix: '' },
      { id: 'attack-speed', key: 'attackSpeed', suffix: '秒' },
      { id: 'range', suffix: 'px' },
      { id: 'knockback', suffix: '' },
      { id: 'pierce', suffix: '' },
      { id: 'effect-size', key: 'effectSize', suffix: 'x' }
    ];
    
    sliders.forEach(slider => {
      const input = document.getElementById(`weapon-${slider.id}`);
      const valueSpan = document.getElementById(`weapon-${slider.id}-value`);
      const key = slider.key || slider.id.replace(/-([a-z])/g, (match, letter) => letter ? letter.toUpperCase() : '');
      
      if (input && valueSpan) {
        input.addEventListener('input', () => {
          const value = parseFloat(input.value);
          this.weaponData[key] = value;
          valueSpan.textContent = value + slider.suffix;
          this.updatePreview();
        });
      }
    });
    
    // カラーピッカー
    const colorInput = document.getElementById('weapon-effect-color');
    const colorValue = document.getElementById('weapon-effect-color-value');
    if (colorInput && colorValue) {
      colorInput.addEventListener('input', () => {
        this.weaponData.effectColor = colorInput.value;
        colorValue.textContent = colorInput.value;
        this.updatePreview();
      });
    }
  }
  
  /**
   * プレビュー更新
   */
  updatePreview() {
    if (window.editorCore) {
      window.editorCore.startPreview(this.weaponData);
    }
    
    // ステータス表示
    const statusEl = document.getElementById('preview-status');
    if (statusEl) {
      statusEl.textContent = `${this.weaponData.name} - ${this.weaponData.type} - ダメージ${this.weaponData.damage}`;
    }
  }
  
  /**
   * 武器データ取得
   */
  getWeaponData() {
    return this.weaponData;
  }
  
  /**
   * 武器データ読み込み
   */
  loadWeaponData(data) {
    // Validate and sanitize imported data
    const allowedFields = ['id', 'name', 'description', 'author', 'version', 'type', 'damage', 'attackSpeed', 'range', 'knockback', 'pierce', 'effectColor', 'effectSize'];
    const sanitizedData = {};
    
    // Only copy allowed fields
    allowedFields.forEach(field => {
      if (data.hasOwnProperty(field)) {
        sanitizedData[field] = data[field];
      }
    });
    
    this.weaponData = { ...this.getDefaultWeaponData(), ...sanitizedData };
    this.setupUI();
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.weaponEditor = new WeaponEditor();
  });
}
