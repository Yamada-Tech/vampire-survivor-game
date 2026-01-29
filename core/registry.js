// core/registry.js

/**
 * プラグイン管理用レジストリ
 * 武器・キャラクター・敵・マップなどを一元管理
 */
class Registry {
  constructor(type) {
    this.type = type;
    this.items = new Map();
    this.metadata = new Map();
  }
  
  /**
   * プラグインを登録
   * @param {Class} ItemClass - プラグインクラス
   */
  register(ItemClass) {
    try {
      const instance = new ItemClass();
      
      // 必須プロパティチェック
      if (!instance.id) {
        throw new Error(`${this.type}: 'id' property is required`);
      }
      if (!instance.name) {
        throw new Error(`${this.type}: 'name' property is required`);
      }
      
      // 登録
      this.items.set(instance.id, ItemClass);
      
      // メタデータ保存
      this.metadata.set(instance.id, {
        id: instance.id,
        name: instance.name,
        description: instance.description || '',
        author: instance.author || 'Unknown',
        version: instance.version || '1.0.0',
        category: instance.category || 'default'
      });
      
      console.log(`[${this.type}] Registered: ${instance.name} (${instance.id})`);
      
    } catch (error) {
      console.error(`[${this.type}] Failed to register plugin:`, error);
    }
  }
  
  /**
   * IDでプラグインクラスを取得
   * @param {string} id - プラグインID
   * @returns {Class|undefined} プラグインクラス
   */
  get(id) {
    return this.items.get(id);
  }
  
  /**
   * すべてのプラグインクラスを取得
   * @returns {Array} プラグイン情報の配列
   */
  getAll() {
    return Array.from(this.items.entries()).map(([id, Class]) => ({
      id,
      Class,
      metadata: this.metadata.get(id)
    }));
  }
  
  /**
   * プラグインのインスタンスを作成
   * @param {string} id - プラグインID
   * @param {...any} args - コンストラクタ引数
   * @returns {Object|null} プラグインインスタンス
   */
  create(id, ...args) {
    const ItemClass = this.get(id);
    if (!ItemClass) {
      console.error(`[${this.type}] Plugin not found: ${id}`);
      return null;
    }
    return new ItemClass(...args);
  }
  
  /**
   * メタデータを取得
   * @param {string} id - プラグインID
   * @returns {Object|undefined} メタデータ
   */
  getMetadata(id) {
    return this.metadata.get(id);
  }
  
  /**
   * すべてのメタデータを取得
   * @returns {Array} メタデータの配列
   */
  getAllMetadata() {
    return Array.from(this.metadata.values());
  }
  
  /**
   * 登録されているプラグイン数を取得
   * @returns {number} プラグイン数
   */
  count() {
    return this.items.size;
  }
  
  /**
   * プラグインが登録されているかチェック
   * @param {string} id - プラグインID
   * @returns {boolean} 登録されている場合true
   */
  has(id) {
    return this.items.has(id);
  }
}

// グローバルレジストリのエクスポート
const WeaponRegistry = new Registry('Weapon');
const CharacterRegistry = new Registry('Character');
const EnemyRegistry = new Registry('Enemy');
const MapRegistry = new Registry('Map');

// グローバルに公開
if (typeof window !== 'undefined') {
  window.PixelApocalypse = window.PixelApocalypse || {};
  window.PixelApocalypse.Registry = Registry;
  window.PixelApocalypse.WeaponRegistry = WeaponRegistry;
  window.PixelApocalypse.CharacterRegistry = CharacterRegistry;
  window.PixelApocalypse.EnemyRegistry = EnemyRegistry;
  window.PixelApocalypse.MapRegistry = MapRegistry;
}
