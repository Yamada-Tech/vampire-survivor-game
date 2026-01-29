// core/custom-weapon-loader.js

/**
 * カスタム武器ローダー
 * LocalStorageからカスタム武器を読み込み、動的にクラスを生成
 */
class CustomWeaponLoader {
  constructor() {
    this.customWeapons = [];
  }
  
  /**
   * LocalStorageからすべてのカスタム武器を読み込む
   */
  loadAllCustomWeapons() {
    this.customWeapons = [];
    
    // LocalStorageをスキャン
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // 武器データのみを抽出
      if (key && key.startsWith('weapon_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          this.customWeapons.push(data);
        } catch (error) {
          console.error(`[CustomWeaponLoader] Failed to load ${key}:`, error);
        }
      }
    }
    
    console.log(`[CustomWeaponLoader] Loaded ${this.customWeapons.length} custom weapons`);
    return this.customWeapons;
  }
  
  /**
   * カスタム武器を動的にクラス化してレジストリに登録
   */
  registerCustomWeapons() {
    this.loadAllCustomWeapons();
    
    this.customWeapons.forEach(data => {
      try {
        const WeaponClass = this.createWeaponClass(data);
        
        // 既に登録済みの場合はスキップ
        if (!window.PixelApocalypse.WeaponRegistry.has(data.id)) {
          window.PixelApocalypse.WeaponRegistry.register(WeaponClass);
          console.log(`[CustomWeaponLoader] Registered: ${data.name} (${data.id})`);
        }
      } catch (error) {
        console.error(`[CustomWeaponLoader] Failed to register ${data.id}:`, error);
      }
    });
  }
  
  /**
   * 武器データから動的にクラスを生成
   */
  createWeaponClass(data) {
    const weaponData = data;
    
    class DynamicCustomWeapon extends window.PixelApocalypse.WeaponBase {
      constructor() {
        super({
          id: weaponData.id,
          name: weaponData.name,
          description: weaponData.description,
          author: weaponData.author,
          version: weaponData.version,
          type: weaponData.type,
          damage: weaponData.damage,
          attackSpeed: weaponData.attackSpeed,
          range: weaponData.range,
          knockback: weaponData.knockback,
          pierce: weaponData.pierce,
          effectColor: weaponData.effectColor,
          effectSize: weaponData.effectSize
        });
        
        this.isCustomWeapon = true;
        this.activeEffects = [];
      }
      
      attack(player, enemies, currentTime) {
        if (!this.canAttack(currentTime)) return [];
        
        this.lastAttackTime = currentTime;
        
        // 最も近い敵の方向を取得
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
        
        // タイプ別の攻撃処理
        if (this.type === 'melee') {
          return this.attackMelee(player, enemies, targetAngle, currentTime);
        } else if (this.type === 'ranged') {
          return this.attackRanged(player, enemies, targetAngle, currentTime);
        } else if (this.type === 'magic') {
          return this.attackMagic(player, enemies, targetAngle, currentTime);
        }
        
        return [];
      }
      
      attackMelee(player, enemies, targetAngle, currentTime) {
        // 近接攻撃: 扇形範囲
        const effect = {
          x: player.x,
          y: player.y,
          angle: targetAngle,
          duration: 0.3,
          elapsed: 0,
          type: 'melee'
        };
        
        this.activeEffects.push(effect);
        
        const hitEnemies = [];
        enemies.forEach(enemy => {
          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const angleDiff = Math.abs(angle - targetAngle);
          
          if (distance <= this.range && angleDiff < Math.PI / 3) {
            enemy.takeDamage(this.damage);
            hitEnemies.push(enemy);
            
            // ノックバック
            if (this.knockback > 0) {
              const knockbackDist = this.knockback;
              enemy.x += Math.cos(angle) * knockbackDist;
              enemy.y += Math.sin(angle) * knockbackDist;
            }
          }
        });
        
        return hitEnemies;
      }
      
      attackRanged(player, enemies, targetAngle, currentTime) {
        // 遠距離攻撃: 弾丸発射
        const projectile = {
          x: player.x,
          y: player.y,
          angle: targetAngle,
          speed: 500,
          pierceCount: 0,
          maxPierce: this.pierce,
          isAlive: true,
          hitEnemies: new Set(),
          type: 'ranged'
        };
        
        if (!this.projectiles) {
          this.projectiles = [];
        }
        this.projectiles.push(projectile);
        
        return [];
      }
      
      attackMagic(player, enemies, targetAngle, currentTime) {
        // 魔法攻撃: 複数ターゲット
        const targets = enemies
          .map(enemy => {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            return {
              enemy,
              distance: Math.sqrt(dx * dx + dy * dy),
              angle: Math.atan2(dy, dx)
            };
          })
          .sort((a, b) => a.distance - b.distance)
          .slice(0, Math.max(1, this.pierce));
        
        if (targets.length === 0) {
          targets.push({
            enemy: null,
            distance: 100,
            angle: targetAngle
          });
        }
        
        if (!this.projectiles) {
          this.projectiles = [];
        }
        
        targets.forEach(target => {
          const projectile = {
            x: player.x,
            y: player.y,
            angle: target.angle,
            speed: 600,
            pierceCount: 0,
            maxPierce: 3,
            isAlive: true,
            hitEnemies: new Set(),
            type: 'magic'
          };
          this.projectiles.push(projectile);
        });
        
        return [];
      }
      
      update(deltaTime, player, enemies) {
        // エフェクト更新
        if (this.activeEffects) {
          this.activeEffects = this.activeEffects.filter(effect => {
            effect.elapsed += deltaTime;
            return effect.elapsed < effect.duration;
          });
        }
        
        // 弾丸更新
        if (this.projectiles && this.projectiles.length > 0) {
          this.projectiles = this.projectiles.filter(projectile => {
            if (!projectile.isAlive) return false;
            
            projectile.x += Math.cos(projectile.angle) * projectile.speed * deltaTime;
            projectile.y += Math.sin(projectile.angle) * projectile.speed * deltaTime;
            
            // 画面外チェック
            const dx = projectile.x - player.x;
            const dy = projectile.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.range) {
              projectile.isAlive = false;
              return false;
            }
            
            // 敵との衝突
            enemies.forEach(enemy => {
              if (projectile.hitEnemies.has(enemy)) return;
              
              const dx = enemy.x - projectile.x;
              const dy = enemy.y - projectile.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < enemy.size) {
                enemy.takeDamage(this.damage);
                projectile.hitEnemies.add(enemy);
                projectile.pierceCount++;
                
                // ノックバック
                if (this.knockback > 0) {
                  const angle = Math.atan2(enemy.y - projectile.y, enemy.x - projectile.x);
                  enemy.x += Math.cos(angle) * this.knockback;
                  enemy.y += Math.sin(angle) * this.knockback;
                }
                
                if (projectile.pierceCount >= projectile.maxPierce) {
                  projectile.isAlive = false;
                }
              }
            });
            
            return projectile.isAlive;
          });
        }
      }
      
      draw(ctx, camera) {
        // 近接エフェクト描画
        if (this.activeEffects) {
          this.activeEffects.forEach(effect => {
            const screenX = effect.x - camera.x + camera.canvas.width / 2;
            const screenY = effect.y - camera.y + camera.canvas.height / 2;
            
            const alpha = 1 - (effect.elapsed / effect.duration);
            
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(effect.angle);
            
            ctx.strokeStyle = this.effectColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.lineWidth = 3 * this.effectSize;
            
            ctx.beginPath();
            ctx.arc(0, 0, this.range * (1 - effect.elapsed / effect.duration), -Math.PI / 4, Math.PI / 4);
            ctx.stroke();
            
            ctx.restore();
          });
        }
        
        // 弾丸描画
        if (this.projectiles && this.projectiles.length > 0) {
          this.projectiles.forEach(projectile => {
            const screenX = projectile.x - camera.x + camera.canvas.width / 2;
            const screenY = projectile.y - camera.y + camera.canvas.height / 2;
            
            ctx.fillStyle = this.effectColor;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 5 * this.effectSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 軌跡
            if (projectile.type === 'magic') {
              ctx.strokeStyle = this.effectColor;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(screenX, screenY);
              ctx.lineTo(
                screenX - Math.cos(projectile.angle) * 15,
                screenY - Math.sin(projectile.angle) * 15
              );
              ctx.stroke();
            }
          });
        }
      }
    }
    
    return DynamicCustomWeapon;
  }
  
  /**
   * カスタム武器を削除
   */
  deleteCustomWeapon(weaponId) {
    const key = `weapon_${weaponId}`;
    localStorage.removeItem(key);
    console.log(`[CustomWeaponLoader] Deleted: ${weaponId}`);
    
    // リストから削除
    this.customWeapons = this.customWeapons.filter(w => w.id !== weaponId);
  }
  
  /**
   * すべてのカスタム武器を取得
   */
  getAllCustomWeapons() {
    return this.customWeapons;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.CustomWeaponLoader = CustomWeaponLoader;
}
