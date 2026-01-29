/**
 * カスタム武器ローダー
 * LocalStorageからカスタム武器を読み込み、動的にクラスを生成するシステム
 */
class CustomWeaponLoader {
  constructor() {
    this.customWeapons = new Map();
  }
  
  /**
   * LocalStorageからすべてのカスタム武器を読み込む
   * @returns {Array} カスタム武器データの配列
   */
  loadAllCustomWeapons() {
    const weapons = [];
    
    // LocalStorageから weapon_ で始まるキーを探す
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('weapon_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.id) {
            weapons.push(data);
          }
        } catch (error) {
          console.error(`Failed to load weapon from ${key}:`, error);
        }
      }
    }
    
    return weapons;
  }
  
  /**
   * カスタム武器をWeaponRegistryに登録
   */
  registerCustomWeapons() {
    const weapons = this.loadAllCustomWeapons();
    
    weapons.forEach(weaponData => {
      try {
        const WeaponClass = this.createWeaponClass(weaponData);
        this.customWeapons.set(weaponData.id, weaponData);
        
        // WeaponRegistryに登録
        if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
          window.PixelApocalypse.WeaponRegistry.register(WeaponClass);
          console.log(`Custom weapon registered: ${weaponData.name} (${weaponData.id})`);
        }
      } catch (error) {
        console.error(`Failed to register custom weapon ${weaponData.id}:`, error);
      }
    });
    
    console.log(`Loaded ${weapons.length} custom weapons`);
  }
  
  /**
   * 武器データから動的にWeaponBaseを継承したクラスを生成
   * @param {Object} data - 武器データ
   * @returns {Class} 動的生成された武器クラス
   */
  createWeaponClass(data) {
    const WeaponBase = window.PixelApocalypse.WeaponBase;
    
    // 動的クラス生成
    return class CustomWeapon extends WeaponBase {
      constructor() {
        super({
          id: data.id,
          name: data.name,
          description: data.description || '',
          author: data.author || 'User',
          version: data.version || '1.0.0',
          type: data.type || 'melee',
          damage: data.damage || 25,
          attackSpeed: data.attackSpeed || 1.0,
          range: data.range || 150,
          knockback: data.knockback || 5,
          pierce: data.pierce || 1,
          effectColor: data.effectColor || '#ffffff',
          effectSize: data.effectSize || 1.0,
          category: 'custom'
        });
        
        // 近接武器用の斬撃エフェクト
        this.activeSlashes = [];
        
        // 遠距離・魔法武器用の弾丸
        this.projectiles = [];
      }
      
      /**
       * 攻撃実行
       */
      attack(player, enemies, currentTime) {
        if (!this.canAttack(currentTime)) return [];
        
        this.lastAttackTime = currentTime;
        
        if (this.type === 'melee') {
          return this.meleeAttack(player, enemies);
        } else if (this.type === 'ranged') {
          return this.rangedAttack(player, enemies, currentTime);
        } else if (this.type === 'magic') {
          return this.magicAttack(player, enemies, currentTime);
        }
        
        return [];
      }
      
      /**
       * 近接攻撃
       */
      meleeAttack(player, enemies) {
        // 最も近い敵の方向に攻撃
        let targetAngle = 0;
        let minDistance = Infinity;
        
        enemies.forEach(enemy => {
          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minDistance) {
            minDistance = distance;
            targetAngle = Math.atan2(dy, dx);
          }
        });
        
        // 敵がいない場合は右方向
        if (minDistance === Infinity) {
          targetAngle = 0;
        }
        
        // 斬撃エフェクトを作成
        const slash = {
          x: player.x,
          y: player.y,
          angle: targetAngle,
          duration: 0.3,
          elapsed: 0
        };
        
        this.activeSlashes.push(slash);
        
        // 範囲内の敵にダメージ
        const hitEnemies = [];
        enemies.forEach(enemy => {
          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          
          // 角度差を正しく計算（±πの境界を考慮）
          const angleDiff = Math.abs(Math.atan2(Math.sin(angle - targetAngle), Math.cos(angle - targetAngle)));
          
          if (distance <= this.range && angleDiff < Math.PI / 3) {
            enemy.takeDamage(this.damage);
            
            // ノックバック適用
            if (this.knockback > 0) {
              const knockbackDir = { x: dx / distance, y: dy / distance };
              enemy.x += knockbackDir.x * this.knockback;
              enemy.y += knockbackDir.y * this.knockback;
            }
            
            hitEnemies.push(enemy);
          }
        });
        
        return hitEnemies;
      }
      
      /**
       * 遠距離攻撃
       */
      rangedAttack(player, enemies, currentTime) {
        // 最も近い敵を狙う
        let target = null;
        let minDistance = Infinity;
        
        enemies.forEach(enemy => {
          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minDistance) {
            minDistance = distance;
            target = enemy;
          }
        });
        
        // ターゲットがいない場合は右方向に発射
        let targetX = player.x + 100;
        let targetY = player.y;
        
        if (target) {
          targetX = target.x;
          targetY = target.y;
        }
        
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          // 弾丸を作成
          const projectile = {
            x: player.x,
            y: player.y,
            vx: (dx / distance) * 400, // 速度
            vy: (dy / distance) * 400,
            lifetime: 3.0, // 生存時間（秒）
            age: 0,
            size: 8 * this.effectSize,
            pierceCount: 0,
            maxPierce: this.pierce,
            createdAt: currentTime
          };
          
          this.projectiles.push(projectile);
        }
        
        return [];
      }
      
      /**
       * 魔法攻撃
       */
      magicAttack(player, enemies, currentTime) {
        // 周囲の敵を検出して複数の魔法弾を発射
        const nearbyEnemies = enemies.filter(enemy => {
          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance <= this.range * 1.5;
        });
        
        // ターゲットがいない場合はランダム方向に発射
        const targets = nearbyEnemies.length > 0 ? nearbyEnemies.slice(0, 3) : [
          { x: player.x + 100, y: player.y },
          { x: player.x - 100, y: player.y },
          { x: player.x, y: player.y + 100 }
        ];
        
        targets.forEach(target => {
          const dx = target.x - player.x;
          const dy = target.y - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const projectile = {
              x: player.x,
              y: player.y,
              vx: (dx / distance) * 300,
              vy: (dy / distance) * 300,
              lifetime: 4.0,
              age: 0,
              size: 12 * this.effectSize,
              pierceCount: 0,
              maxPierce: this.pierce,
              createdAt: currentTime,
              isMagic: true
            };
            
            this.projectiles.push(projectile);
          }
        });
        
        return [];
      }
      
      /**
       * 更新処理
       */
      update(deltaTime, player, enemies) {
        // 斬撃エフェクトの更新
        this.activeSlashes = this.activeSlashes.filter(slash => {
          slash.elapsed += deltaTime;
          return slash.elapsed < slash.duration;
        });
        
        // 弾丸の更新
        const hitEnemies = [];
        this.projectiles = this.projectiles.filter(projectile => {
          // 位置更新
          projectile.x += projectile.vx * deltaTime;
          projectile.y += projectile.vy * deltaTime;
          projectile.age += deltaTime;
          
          // 生存時間チェック
          if (projectile.age >= projectile.lifetime) {
            return false;
          }
          
          // 敵との衝突判定
          for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const dx = enemy.x - projectile.x;
            const dy = enemy.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < projectile.size + 15) { // 敵のサイズ考慮
              enemy.takeDamage(this.damage);
              
              // ノックバック適用
              if (this.knockback > 0) {
                const knockbackDir = { 
                  x: projectile.vx / Math.sqrt(projectile.vx * projectile.vx + projectile.vy * projectile.vy), 
                  y: projectile.vy / Math.sqrt(projectile.vx * projectile.vx + projectile.vy * projectile.vy)
                };
                enemy.x += knockbackDir.x * this.knockback;
                enemy.y += knockbackDir.y * this.knockback;
              }
              
              hitEnemies.push(enemy);
              projectile.pierceCount++;
              
              // 貫通制限チェック
              if (projectile.pierceCount >= projectile.maxPierce) {
                return false;
              }
            }
          }
          
          return true;
        });
        
        return hitEnemies;
      }
      
      /**
       * 描画処理
       */
      draw(ctx, player) {
        // 斬撃エフェクトの描画
        this.activeSlashes.forEach(slash => {
          const progress = slash.elapsed / slash.duration;
          const alpha = 1 - progress;
          
          ctx.save();
          ctx.translate(slash.x, slash.y);
          ctx.rotate(slash.angle);
          
          // 三日月型の斬撃
          ctx.strokeStyle = this.effectColor;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = 4 * this.effectSize;
          
          ctx.beginPath();
          const slashRadius = this.range * (0.5 + progress * 0.5);
          ctx.arc(slashRadius * 0.5, 0, slashRadius, -Math.PI / 3, Math.PI / 3);
          ctx.stroke();
          
          ctx.restore();
        });
        
        // 弾丸の描画
        this.projectiles.forEach(projectile => {
          const alpha = Math.max(0, 1 - projectile.age / projectile.lifetime);
          
          ctx.save();
          ctx.globalAlpha = alpha;
          
          if (projectile.isMagic) {
            // 魔法弾は星形
            ctx.fillStyle = this.effectColor;
            ctx.beginPath();
            const x = projectile.x;
            const y = projectile.y;
            const size = projectile.size;
            
            for (let i = 0; i < 5; i++) {
              const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
              const radius = i % 2 === 0 ? size : size / 2;
              const px = x + Math.cos(angle) * radius;
              const py = y + Math.sin(angle) * radius;
              
              if (i === 0) {
                ctx.moveTo(px, py);
              } else {
                ctx.lineTo(px, py);
              }
            }
            ctx.closePath();
            ctx.fill();
            
            // 光エフェクト
            ctx.strokeStyle = this.effectColor;
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            // 通常弾は円形
            ctx.fillStyle = this.effectColor;
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
            ctx.fill();
            
            // 外側の光
            ctx.strokeStyle = this.effectColor;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          
          ctx.restore();
        });
      }
    };
  }
  
  /**
   * カスタム武器を削除
   * @param {string} weaponId - 武器ID
   */
  deleteCustomWeapon(weaponId) {
    const key = `weapon_${weaponId}`;
    localStorage.removeItem(key);
    this.customWeapons.delete(weaponId);
    console.log(`Custom weapon deleted: ${weaponId}`);
  }
  
  /**
   * カスタム武器が存在するか確認
   * @param {string} weaponId - 武器ID
   * @returns {boolean}
   */
  hasCustomWeapon(weaponId) {
    return this.customWeapons.has(weaponId);
  }
  
  /**
   * カスタム武器データを取得
   * @param {string} weaponId - 武器ID
   * @returns {Object|null}
   */
  getCustomWeapon(weaponId) {
    return this.customWeapons.get(weaponId) || null;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.CustomWeaponLoader = CustomWeaponLoader;
}
