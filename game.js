// ============================================================================
// Pixel Apocalypse - game.js
// HTML5 Canvas と JavaScript で作られた2Dアクションサバイバルゲーム
// ============================================================================

// ============================================================================
// Constants
// ============================================================================

const MAX_WEAPONS = 5;

// World and Camera Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Camera Dead Zone - Removed (simplified camera system)
// Zoom Constants - Removed (fixed zoom at 1.0)

// Attack Speed Balance Constants
const INITIAL_MELEE_ATTACK_COOLDOWN = 1.5;
const INITIAL_RANGED_ATTACK_COOLDOWN = 1.2;
const ATTACK_SPEED_INCREASE_FACTOR = 0.9;
const MAX_ATTACK_SPEED = 0.3;

// Enemy and Player Sizes
const PLAYER_SIZE = 20;
const ENEMY_SIZE_NORMAL = 20;
const ENEMY_SIZE_FAST = 16;
const ENEMY_SIZE_TANK = 28;

// Debug mode
const DEBUG_HIT_DETECTION = false;

// ============================================================================
// Utility Functions
// ============================================================================

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function normalize(x, y) {
    const len = Math.sqrt(x * x + y * y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: x / len, y: y / len };
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// ============================================================================
// Particle Class (for visual effects)
// ============================================================================

class Particle {
    constructor(x, y, color, velocity, lifetime) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = velocity.x;
        this.vy = velocity.y;
        this.lifetime = lifetime;
        this.age = 0;
        this.size = random(2, 5);
        this.shape = randomChoice(['square', 'circle', 'star']);
        
        this.GRAVITY = 200;
        this.DRAG = 0.98;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.age += deltaTime;
        this.vy += this.GRAVITY * deltaTime;
        const dragFactor = Math.pow(this.DRAG, deltaTime * 60);
        this.vx *= dragFactor;
        this.vy *= dragFactor;
    }

    draw(ctx, zoom = 1.0) {
        const alpha = 1 - (this.age / this.lifetime);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        
        // ★ズームを考慮したサイズ
        const displaySize = this.size * zoom;
        
        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, displaySize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'star') {
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const x = Math.cos(angle) * displaySize;
                const y = Math.sin(angle) * displaySize;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * (displaySize / 2);
                const innerY = Math.sin(innerAngle) * (displaySize / 2);
                ctx.lineTo(innerX, innerY);
            }
            const firstAngle = -Math.PI / 2;
            const firstX = Math.cos(firstAngle) * displaySize;
            const firstY = Math.sin(firstAngle) * displaySize;
            ctx.lineTo(firstX, firstY);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(-displaySize / 2, -displaySize / 2, displaySize, displaySize);
        }
        
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.age >= this.lifetime;
    }
}

// ============================================================================
// Slash Effect Class - Crescent Moon Style
// ============================================================================

class SlashEffect {
    constructor(x, y, angle, range, arc = Math.PI / 3) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.range = range;
        this.arc = arc;
        this.opacity = 1.0;
        this.lifetime = 0.3;
        this.age = 0;
        this.streakLengths = [];
        const numStreaks = 5;
        for (let i = 0; i < numStreaks; i++) {
            this.streakLengths.push(0.6 + Math.random() * 0.4);
        }
    }

    update(deltaTime) {
        this.age += deltaTime;
        this.opacity = 1.0 - (this.age / this.lifetime);
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);
        
        const layers = 3;
        for (let layer = 0; layer < layers; layer++) {
            const layerOpacity = 1 - (layer / layers) * 0.5;
            const layerRange = this.range * (1 - layer * 0.1);
            
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, layerRange);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${layerOpacity * 0.9})`);
            gradient.addColorStop(0.4, `rgba(100, 200, 255, ${layerOpacity * 0.8})`);
            gradient.addColorStop(0.7, `rgba(50, 150, 255, ${layerOpacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(50, 150, 255, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 4 - layer;
            
            ctx.beginPath();
            ctx.arc(0, 0, layerRange, -this.arc / 2, this.arc / 2);
            ctx.stroke();
            
            if (layer === 0) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${layerOpacity * 0.6})`;
                ctx.lineWidth = 3;
                
                const innerRadius = layerRange * 0.7;
                const innerOffset = layerRange * 0.2;
                
                ctx.arc(innerOffset, 0, innerRadius, this.arc / 2, -this.arc / 2, true);
                ctx.stroke();
            }
        }
        
        const numStreaks = this.streakLengths.length;
        for (let i = 0; i < numStreaks; i++) {
            const streakAngle = -this.arc / 2 + (this.arc * i / (numStreaks - 1));
            const streakLength = this.range * this.streakLengths[i];
            
            const gradient = ctx.createLinearGradient(
                0, 0,
                Math.cos(streakAngle) * streakLength,
                Math.sin(streakAngle) * streakLength
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(
                Math.cos(streakAngle) * streakLength,
                Math.sin(streakAngle) * streakLength
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }

    isDead() {
        return this.age >= this.lifetime;
    }
}

// ============================================================================
// StickFigure Class
// ============================================================================

class StickFigure {
    constructor(x, y, color = '#ffffff', size = 20) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.legPhase = 0;
        this.armPhase = 0;
        this.bodyBounce = 0;
        this.isMoving = false;
        this.attackFrame = 0;
        this.damageFrame = 0;
    }

    update(deltaTime, isMoving = false) {
        this.isMoving = isMoving;
        if (isMoving) {
            this.legPhase += deltaTime * 8;
            this.armPhase = this.legPhase;
            this.bodyBounce = Math.sin(this.legPhase * 2) * 2;
        } else {
            this.bodyBounce = 0;
        }
        
        if (this.attackFrame > 0) {
            this.attackFrame -= deltaTime;
        }
        
        if (this.damageFrame > 0) {
            this.damageFrame -= deltaTime;
        }
    }

    triggerAttack() {
        this.attackFrame = 0.2;
    }

    triggerDamage() {
        this.damageFrame = 0.3;
    }

    draw(ctx, screenX, screenY, direction = 0, zoom = 1.0) {
        ctx.save();
        ctx.translate(screenX, screenY);
        
        if (this.damageFrame > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.strokeStyle = '#ff0000';
            ctx.fillStyle = '#ff0000';
        } else {
            ctx.strokeStyle = this.color;
            ctx.fillStyle = this.color;
        }
        
        ctx.lineWidth = 2 * zoom;
        ctx.lineCap = 'round';
        
        const bounceY = this.bodyBounce * zoom;
        
        const headRadius = 5 * zoom;
        const bodyLength = 15 * zoom;
        const armLength = 10 * zoom;
        const legLength = 14 * zoom;
        
        // Head
        ctx.beginPath();
        ctx.arc(0, -bodyLength - headRadius + bounceY, headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.beginPath();
        ctx.moveTo(0, -bodyLength + bounceY);
        ctx.lineTo(0, 0 + bounceY);
        ctx.stroke();
        
        // Arms
        const armAttachY = -bodyLength * 0.7 + bounceY;
        
        if (this.isMoving) {
            const leftArmAngle = Math.sin(this.armPhase) * 0.5;
            const rightArmAngle = Math.sin(this.armPhase + Math.PI) * 0.5;
            
            ctx.beginPath();
            ctx.moveTo(0, armAttachY);
            ctx.lineTo(
                Math.sin(leftArmAngle) * armLength,
                armAttachY + Math.cos(leftArmAngle) * armLength
            );
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, armAttachY);
            ctx.lineTo(
                Math.sin(rightArmAngle) * armLength,
                armAttachY + Math.cos(rightArmAngle) * armLength
            );
            ctx.stroke();
        } else if (this.attackFrame > 0) {
            ctx.beginPath();
            ctx.moveTo(0, armAttachY);
            ctx.lineTo(-armLength * 0.7, armAttachY + armLength * 0.3);
            ctx.moveTo(0, armAttachY);
            ctx.lineTo(armLength * 0.7, armAttachY + armLength * 0.3);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(0, armAttachY);
            ctx.lineTo(-armLength * 0.6, armAttachY + armLength * 0.8);
            ctx.moveTo(0, armAttachY);
            ctx.lineTo(armLength * 0.6, armAttachY + armLength * 0.8);
            ctx.stroke();
        }
        
        // Legs
        const legAttachY = 0 + bounceY;
        
        if (this.isMoving) {
            const leftLegAngle = Math.sin(this.legPhase) * 0.6;
            const rightLegAngle = Math.sin(this.legPhase + Math.PI) * 0.6;
            
            ctx.beginPath();
            ctx.moveTo(0, legAttachY);
            ctx.lineTo(
                Math.sin(leftLegAngle) * legLength * 0.5,
                legAttachY + Math.cos(leftLegAngle) * legLength
            );
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, legAttachY);
            ctx.lineTo(
                Math.sin(rightLegAngle) * legLength * 0.5,
                legAttachY + Math.cos(rightLegAngle) * legLength
            );
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(0, legAttachY);
            ctx.lineTo(-legLength * 0.25, legAttachY + legLength);
            ctx.moveTo(0, legAttachY);
            ctx.lineTo(legLength * 0.25, legAttachY + legLength);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// ============================================================================
// BoomerangProjectile Class (Legacy - for fallback weapon system)
// ============================================================================

class BoomerangProjectile {
    constructor(x, y, targetX, targetY, damage) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.damage = damage;
        this.speed = 400;
        this.rotation = 0;
        this.returning = false;
        this.maxDistance = 300;
        this.lifetime = 0;
        this.maxLifetime = 2.0;
        this.hitEnemies = new Set();
    }

    update(deltaTime, playerX, playerY) {
        this.lifetime += deltaTime;
        this.rotation += deltaTime * 20;
        
        const distFromStart = distance(this.x, this.y, this.startX, this.startY);
        
        if (!this.returning && (distFromStart >= this.maxDistance || this.lifetime > 0.5)) {
            this.returning = true;
        }
        
        let targetX, targetY;
        if (this.returning) {
            targetX = playerX;
            targetY = playerY;
        } else {
            targetX = this.targetX;
            targetY = this.targetY;
        }
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            this.x += (dx / dist) * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * deltaTime;
        }
        
        if (this.returning && distance(this.x, this.y, playerX, playerY) < 20) {
            return true;
        }
        
        if (this.lifetime >= this.maxLifetime) {
            return true;
        }
        
        return false;
    }

    draw(ctx, camera) {
        // ★ワールド座標で描画（applyTransform内なのでそのまま）
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = '#ffaa00';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.bezierCurveTo(15, -5, 15, 5, 0, 10);
        ctx.bezierCurveTo(-15, 5, -15, -5, 0, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }

    isDead() {
        return false;
    }
}

// ============================================================================
// Projectile Class
// ============================================================================

class Projectile {
    constructor(x, y, targetX, targetY, damage, speed = 400) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.size = 6;
        this.active = true;
        this.maxDistance = 500;
        this.distanceTraveled = 0;
        
        const angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.color = '#ffff00';
        this.glowColor = '#ffaa00';
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        const dx = this.vx * deltaTime;
        const dy = this.vy * deltaTime;
        
        this.x += dx;
        this.y += dy;
        this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
        
        if (this.distanceTraveled >= this.maxDistance) {
            this.active = false;
        }
    }
    
    draw(ctx, camera) {
        if (!this.active) return;
        
        // ★ワールド座標で描画（applyTransform内なのでそのまま）
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = this.glowColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    checkCollision(enemy) {
        if (!this.active) return false;
        
        const dist = distance(this.x, this.y, enemy.x, enemy.y);
        return dist <= (this.size + enemy.size);
    }
}

// ============================================================================
// Player Class
// ============================================================================

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = PLAYER_SIZE;
        this.speed = 100;  // ★150→100に減速
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.direction = 0;
        this.color = '#00ffff';
        this.stickFigure = new StickFigure(x, y, this.color, this.size);
        this.isMoving = false;
    }

    takeDamage(damage) {
        if (this.invulnerable) return false;
        
        this.hp -= damage;
        if (this.hp < 0) this.hp = 0;
        
        this.invulnerable = true;
        this.invulnerableTime = 0.5;
        
        this.stickFigure.triggerDamage();
        
        return true;
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNextLevel) {
            return this.levelUp();
        }
        return false;
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
        
        this.hp = Math.min(this.hp + 20, this.maxHp);
        
        return true;
    }

    update(deltaTime, keys) {
        if (this.invulnerable) {
            this.invulnerableTime -= deltaTime;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }

        let dx = 0;
        let dy = 0;

        if (keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;

        this.isMoving = false;
        if (dx !== 0 || dy !== 0) {
            const norm = normalize(dx, dy);
            dx = norm.x;
            dy = norm.y;
            
            this.direction = Math.atan2(dy, dx);
            this.isMoving = true;
        }

        this.x += dx * this.speed * deltaTime;
        this.y += dy * this.speed * deltaTime;

        // 境界チェックを削除 - 無限に移動可能
        
        this.stickFigure.x = this.x;
        this.stickFigure.y = this.y;
        this.stickFigure.update(deltaTime, this.isMoving);
    }

    draw(ctx, camera) {
        // ★ワールド座標で描画（applyTransform内なのでそのまま）
        this.stickFigure.draw(ctx, this.x, this.y, this.direction);
    }
    
    drawAtPosition(ctx, screenX, screenY, zoom) {
        ctx.save();
        
        // StickFigureを画面座標で描画
        this.stickFigure.draw(ctx, screenX, screenY, this.direction, zoom);
        
        ctx.restore();
    }

    isDead() {
        return this.hp <= 0;
    }
}

// ============================================================================
// Enemy Class
// ============================================================================

class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        
        switch (type) {
            case 'fast':
                this.size = ENEMY_SIZE_FAST;
                this.speed = 80;  // ★120→80に減速
                this.maxHp = 30;
                this.damage = 8;
                this.xpValue = 15;
                this.color = '#ffff00';
                break;
            case 'tank':
                this.size = ENEMY_SIZE_TANK;
                this.speed = 40;  // ★50→40に減速
                this.maxHp = 150;
                this.damage = 20;
                this.xpValue = 40;
                this.color = '#ff00ff';
                break;
            case 'normal':
            default:
                this.size = ENEMY_SIZE_NORMAL;
                this.speed = 60;  // ★100→60に減速
                this.maxHp = 50;
                this.damage = 10;
                this.xpValue = 20;
                this.color = '#ff4444';
                break;
        }
        
        this.hp = this.maxHp;
        this.hitFlashTime = 0;
        this.stickFigure = new StickFigure(x, y, this.color, this.size);
    }

    takeDamage(damage) {
        this.hp -= damage;
        this.hitFlashTime = 0.1;
        this.stickFigure.triggerDamage();
        return this.hp <= 0;
    }

    update(deltaTime, player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const norm = normalize(dx, dy);
        
        const isMoving = Math.abs(norm.x) > 0.01 || Math.abs(norm.y) > 0.01;
        
        this.x += norm.x * this.speed * deltaTime;
        this.y += norm.y * this.speed * deltaTime;
        
        if (this.hitFlashTime > 0) {
            this.hitFlashTime -= deltaTime;
        }
        
        this.stickFigure.x = this.x;
        this.stickFigure.y = this.y;
        this.stickFigure.update(deltaTime, isMoving);
    }

    draw(ctx, camera) {
        // ★ワールド座標で描画（applyTransform内なのでそのまま）
        this.stickFigure.draw(ctx, this.x, this.y);
        
        const barWidth = this.size * 1.5;
        const barHeight = 4;
        const hpPercent = this.hp / this.maxHp;
        
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - 10;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }
    
    drawAtPosition(ctx, screenX, screenY, zoom) {
        ctx.save();
        
        this.stickFigure.draw(ctx, screenX, screenY, 0, zoom);
        
        // HPバー
        const barWidth = this.size * 1.5 * zoom;
        const barHeight = 4 * zoom;
        const hpPercent = this.hp / this.maxHp;
        
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.size * zoom - 10 * zoom;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
        
        ctx.restore();
    }

    collidesWith(player) {
        return distance(this.x, this.y, player.x, player.y) < (this.size + player.size) / 2;
    }
}

// ============================================================================
// Weapon Class
// ============================================================================

class Weapon {
    constructor(type = 'sword') {
        this.type = type;
        this.slashAngle = 0;
        this.boomerangs = [];
        
        if (type === 'sword') {
            this.damage = 35;
            this.range = 120;
            this.cooldown = INITIAL_MELEE_ATTACK_COOLDOWN;
        } else if (type === 'boomerang') {
            this.damage = 25;
            this.range = 250;
            this.cooldown = 2.0;
        } else if (type === 'magic_bolt') {
            this.damage = 15;
            this.range = 500;
            this.cooldown = 0.8;
        }
        
        this.currentCooldown = 0;
    }

    update(deltaTime, player, enemies, projectiles, slashEffects) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= deltaTime;
        }
        
        if (this.type === 'boomerang') {
            for (let i = this.boomerangs.length - 1; i >= 0; i--) {
                const boom = this.boomerangs[i];
                const shouldRemove = boom.update(deltaTime, player.x, player.y);
                
                enemies.forEach(enemy => {
                    if (!boom.hitEnemies.has(enemy) && distance(boom.x, boom.y, enemy.x, enemy.y) < 30) {
                        const killed = enemy.takeDamage(this.damage);
                        boom.hitEnemies.add(enemy);
                    }
                });
                
                if (shouldRemove) {
                    this.boomerangs.splice(i, 1);
                }
            }
        }
    }

    canAttack() {
        return this.currentCooldown <= 0;
    }

    attack(player, enemies, particles, projectiles, slashEffects) {
        if (!this.canAttack()) return [];

        this.currentCooldown = this.cooldown;
        const hitEnemies = [];
        
        player.stickFigure.triggerAttack();

        if (this.type === 'sword') {
            let nearest = null;
            let nearestDist = Infinity;
            enemies.forEach(enemy => {
                const dist = distance(player.x, player.y, enemy.x, enemy.y);
                if (dist < nearestDist) {
                    nearest = enemy;
                    nearestDist = dist;
                }
            });
            
            if (nearest) {
                this.slashAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
            } else if (player.isMoving) {
                this.slashAngle = player.direction;
            } else {
                this.slashAngle += Math.PI / 3;
            }
            
            const slash = new SlashEffect(player.x, player.y, this.slashAngle, this.range);
            slashEffects.push(slash);
            
            const slashArc = Math.PI / 3;
            enemies.forEach(enemy => {
                const dist = distance(player.x, player.y, enemy.x, enemy.y);
                if (dist <= this.range) {
                    const angleToEnemy = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                    let angleDiff = angleToEnemy - this.slashAngle;
                    
                    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
                    
                    if (Math.abs(angleDiff) <= slashArc / 2) {
                        hitEnemies.push(enemy);
                    }
                }
            });
            
        } else if (this.type === 'boomerang') {
            let nearest = null;
            let nearestDist = Infinity;
            
            enemies.forEach(enemy => {
                const dist = distance(player.x, player.y, enemy.x, enemy.y);
                if (dist < nearestDist && dist <= this.range) {
                    nearest = enemy;
                    nearestDist = dist;
                }
            });
            
            if (nearest) {
                const boom = new BoomerangProjectile(player.x, player.y, nearest.x, nearest.y, this.damage);
                this.boomerangs.push(boom);
            }
            
        } else if (this.type === 'magic_bolt') {
            let nearest = null;
            let nearestDist = Infinity;
            
            enemies.forEach(enemy => {
                const dist = distance(player.x, player.y, enemy.x, enemy.y);
                if (dist < nearestDist && dist <= this.range) {
                    nearest = enemy;
                    nearestDist = dist;
                }
            });
            
            if (nearest) {
                const projectile = new Projectile(
                    player.x, 
                    player.y, 
                    nearest.x, 
                    nearest.y, 
                    this.damage
                );
                projectile.speed = 600;
                projectile.color = '#aa44ff';
                projectiles.push(projectile);
            }
        }

        return hitEnemies;
    }

    drawAttackRange(ctx, player, camera, gameTime) {
        // Not drawn anymore
    }
    
    drawWeaponEffect(ctx, player, camera, weaponIndex) {
        if (this.type === 'boomerang') {
            this.boomerangs.forEach(boom => {
                boom.draw(ctx, camera);
            });
        }
    }
}

// ============================================================================
// Camera Class is now loaded from camera.js
// ============================================================================

// ============================================================================
// Game Class
// ============================================================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.HIT_PARTICLE_COUNT = 8;
        this.KILL_PARTICLE_COUNT = 15;
        this.PARTICLE_SPEED_MIN = 100;
        this.PARTICLE_SPEED_MAX = 200;
        this.PARTICLE_UPWARD_BIAS = -50;
        this.HIT_PARTICLE_LIFETIME = 0.4;
        this.KILL_PARTICLE_LIFETIME = 0.8;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.camera = new Camera(this.canvas);
        
        // マップシステムの初期化
        this.mapSystem = new window.PixelApocalypse.MapSystem();
        this.mapSystemReady = false;
        
        // 非同期でマップを読み込む
        this.initializeMapSystem();
        
        this.state = 'weapon_select';
        this.selectedWeapon = null;
        this.selectedWeaponIndex = 0;
        this.weaponSelectionOptions = null;
        this.player = null;
        this.enemies = [];
        this.weapons = [];
        this.particles = [];
        this.projectiles = [];
        this.slashEffects = [];
        this.keys = {};
        this.time = 0;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2.0;
        this.difficultyMultiplier = 1.0;
        
        this.enemiesKilled = 0;
        
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTimer = 0;
        
        // デバッグユーティリティの初期化
        this.debug = new window.PixelApocalypse.DebugUtils();
        
        // カスタム武器ローダーの初期化
        this.customWeaponLoader = new CustomWeaponLoader();
        this.customWeaponLoader.registerCustomWeapons();
        
        this.setupInputHandlers();
        this.setupUIHandlers();
        this.setupWeaponSelection();
        
        // 初期状態で武器選択画面を非表示（キャンバス版を使用）
        const weaponSelectionScreen = document.getElementById('weapon-selection-screen');
        if (weaponSelectionScreen) {
            weaponSelectionScreen.classList.add('hidden');
        }
        
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('Game initialized');
    }

    async initializeMapSystem() {
        try {
            console.log('[Game] Initializing map system...');
            await this.mapSystem.initialize('maps/mad_forest/map.json');
            this.mapSystemReady = true;
            console.log('[Game] Map system ready');
        } catch (error) {
            console.error('[Game] Failed to initialize map system:', error);
            // Map system will use fallback
            this.mapSystemReady = true;
        }
    }

    resizeCanvas() {
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
    }

    setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            
            // F3キーでデバッグモード切り替え
            if (e.key === 'F3') {
                e.preventDefault();
                this.debug.toggle();
            }
            
            // 武器選択画面の処理
            if (this.state === 'weapon_select') {
                if (e.key >= '1' && e.key <= '3') {
                    const index = parseInt(e.key) - 1;
                    if (this.weaponSelectionOptions && index < this.weaponSelectionOptions.length) {
                        this.selectWeapon(this.weaponSelectionOptions[index].type);
                    }
                } else if (e.key === 'ArrowLeft') {
                    if (this.weaponSelectionOptions) {
                        this.selectedWeaponIndex = Math.max(0, this.selectedWeaponIndex - 1);
                    }
                } else if (e.key === 'ArrowRight') {
                    if (this.weaponSelectionOptions) {
                        this.selectedWeaponIndex = Math.min(this.weaponSelectionOptions.length - 1, this.selectedWeaponIndex + 1);
                    }
                } else if (e.key === 'Enter') {
                    if (this.weaponSelectionOptions && this.weaponSelectionOptions[this.selectedWeaponIndex]) {
                        this.selectWeapon(this.weaponSelectionOptions[this.selectedWeaponIndex].type);
                    }
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // ★マウスホイールズーム機能 - プレイヤー中心
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            if (this.state === 'playing' && this.camera) {
                const ZOOM_SPEED = 0.1;
                const zoomDelta = e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;
                const newZoom = this.camera.zoom + zoomDelta;
                
                // プレイヤー位置を中心にズーム（新しいcamera.jsのsetZoomを使用）
                this.camera.setZoom(newZoom);
                
                console.log(`Zoom: ${this.camera.zoom.toFixed(1)}x`);
            }
        }, { passive: false });
    }

    setupWeaponSelection() {
        console.log('=== Setting up weapon selection ===');
        
        // 利用可能な武器をプラグインシステムから取得
        const availableWeapons = [];
        
        if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
            console.log('Loading weapons from plugin system...');
            const weaponMetadata = window.PixelApocalypse.WeaponRegistry.getAllMetadata();
            console.log('Plugin weapons found:', weaponMetadata);
            
            // デフォルト武器のみを使用（カスタム武器は除外）
            const defaultWeapons = weaponMetadata.filter(w => w.category !== 'custom');
            availableWeapons.push(...defaultWeapons);
        }
        
        // フォールバック: プラグイン武器が読み込めない場合はデフォルト武器を使用
        if (availableWeapons.length === 0) {
            console.warn('No plugin weapons found, using fallback weapons');
            availableWeapons.push(
                { id: 'sword', name: '剣', description: '近接攻撃武器' },
                { id: 'boomerang', name: 'ブーメラン', description: '投げて戻ってくる' },
                { id: 'magic', name: '魔法', description: '魔法弾を発射' }
            );
        }
        
        console.log('Available weapons for selection:', availableWeapons);
        
        // 武器アイコンマッピング（既存のUIとの互換性のため）
        const weaponIcons = {
            'sword': '⚔️',
            'boomerang': '🪃',
            'magic': '✨'
        };
        
        const weaponKeys = {
            'sword': '1',
            'boomerang': '2',
            'magic': '3'
        };
        
        // 武器選択データを保存（キャンバス描画用）
        this.weaponSelectionData = availableWeapons.map((weapon, index) => ({
            id: weapon.id,
            name: weapon.name,
            description: weapon.description || '',
            icon: weaponIcons[weapon.id] || '❓',
            key: weaponKeys[weapon.id] || String(index + 1),
            bounds: null // ★クリック判定用の境界ボックス
        }));
        
        console.log('Weapon selection data prepared:', this.weaponSelectionData);
        
        // 状態を weapon_select に変更
        this.state = 'weapon_select';
        
        // ★マウスイベントリスナーを追加
        this.setupWeaponSelectionMouseHandlers();
        
        console.log('State changed to: weapon_select');
    }

    setupWeaponSelectionMouseHandlers() {
        // 既存のリスナーを削除（重複防止）
        if (this.weaponSelectionMouseMove) {
            this.canvas.removeEventListener('mousemove', this.weaponSelectionMouseMove);
        }
        if (this.weaponSelectionClick) {
            this.canvas.removeEventListener('click', this.weaponSelectionClick);
        }
        
        // マウス移動（ホバー効果）
        this.weaponSelectionMouseMove = (e) => {
            if (this.state !== 'weapon_select') return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // どの武器カードの上にいるか判定
            this.hoveredWeaponIndex = -1;
            this.weaponSelectionData.forEach((weapon, index) => {
                if (weapon.bounds) {
                    const { x, y, width, height } = weapon.bounds;
                    if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
                        this.hoveredWeaponIndex = index;
                        this.canvas.style.cursor = 'pointer';
                    }
                }
            });
            
            if (this.hoveredWeaponIndex === -1) {
                this.canvas.style.cursor = 'default';
            }
        };
        
        // クリック
        this.weaponSelectionClick = (e) => {
            if (this.state !== 'weapon_select') return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // クリックされた武器を検出
            this.weaponSelectionData.forEach((weapon, index) => {
                if (weapon.bounds) {
                    const { x, y, width, height } = weapon.bounds;
                    if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
                        console.log(`Weapon clicked: ${weapon.id}`);
                        this.selectWeapon(weapon.id);
                        
                        // イベントリスナーを削除
                        this.canvas.removeEventListener('mousemove', this.weaponSelectionMouseMove);
                        this.canvas.removeEventListener('click', this.weaponSelectionClick);
                        this.canvas.style.cursor = 'default';
                    }
                }
            });
        };
        
        this.canvas.addEventListener('mousemove', this.weaponSelectionMouseMove);
        this.canvas.addEventListener('click', this.weaponSelectionClick);
        
        this.hoveredWeaponIndex = -1;
    }

    selectWeapon(weaponType) {
        console.log('Selected weapon:', weaponType);
        
        // 武器を追加
        if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
            const newWeapon = window.PixelApocalypse.WeaponRegistry.create(weaponType);
            
            if (newWeapon) {
                this.weapons.push(newWeapon);
                console.log('Weapon added:', newWeapon.name);
            } else {
                console.error('Failed to create weapon:', weaponType);
            }
        } else {
            // フォールバック: 既存のWeaponクラスを使用
            const newWeapon = new Weapon(weaponType);
            this.weapons.push(newWeapon);
            console.log('Weapon added (fallback):', weaponType);
        }
        
        // ゲームを再開
        this.state = 'playing';
        this.paused = false;
        this.selectedWeaponIndex = 0;
        this.weaponSelectionOptions = null;
    }

    editWeapon(weaponId) {
        // エディタに遷移（URLパラメータで武器IDを渡す）
        window.location.href = `editor.html?edit=${weaponId}`;
    }

    deleteWeapon(weaponId) {
        if (confirm('この武器を削除しますか？')) {
            this.customWeaponLoader.deleteCustomWeapon(weaponId);
            // ページをリロードして武器リストを更新
            window.location.reload();
        }
    }

    drawWeaponSelection() {
        // 背景を暗くする
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // タイトル
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Level Up! Choose a Weapon', this.canvas.width / 2, 100);
        
        // 利用可能な武器を取得
        const availableWeapons = [];
        
        // weapon-registry から登録されている武器を取得
        if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
            const registry = window.PixelApocalypse.WeaponRegistry;
            
            // すべての登録武器のメタデータを取得
            const weaponMetadata = registry.getAllMetadata();
            weaponMetadata.forEach(meta => {
                try {
                    availableWeapons.push({
                        type: meta.id,
                        name: meta.name || meta.id,
                        description: meta.description || 'No description'
                    });
                } catch (error) {
                    console.error(`Failed to get metadata for weapon ${meta.id}:`, error);
                }
            });
        }
        
        // 武器がない場合はデフォルト
        if (availableWeapons.length === 0) {
            availableWeapons.push(
                { type: 'sword', name: 'Sword', description: 'Basic melee attack' },
                { type: 'boomerang', name: 'Boomerang', description: 'Throws boomerangs' },
                { type: 'magic', name: 'Magic', description: 'Magic projectiles' }
            );
        }
        
        // ランダムに3つ選択
        if (!this.weaponSelectionOptions) {
            const options = [];
            const shuffled = [...availableWeapons].sort(() => Math.random() - 0.5);
            
            for (let i = 0; i < Math.min(3, shuffled.length); i++) {
                options.push(shuffled[i]);
            }
            
            this.weaponSelectionOptions = options;
        }
        
        // 武器カードを描画
        const cardWidth = 300;
        const cardHeight = 200;
        const spacing = 50;
        const startX = (this.canvas.width - (cardWidth * this.weaponSelectionOptions.length + spacing * (this.weaponSelectionOptions.length - 1))) / 2;
        const startY = 200;
        
        this.weaponSelectionOptions.forEach((weapon, index) => {
            const x = startX + (cardWidth + spacing) * index;
            const y = startY;
            
            // カード背景
            this.ctx.fillStyle = index === this.selectedWeaponIndex ? '#6a5acd' : '#2a2a4a';
            this.ctx.fillRect(x, y, cardWidth, cardHeight);
            
            // カード枠
            this.ctx.strokeStyle = index === this.selectedWeaponIndex ? '#ffffff' : '#6a5acd';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, cardWidth, cardHeight);
            
            // 武器名
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(weapon.name, x + cardWidth / 2, y + 60);
            
            // 説明
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#cccccc';
            
            // 説明文を折り返し
            const words = weapon.description.split(' ');
            let line = '';
            let lineY = y + 100;
            const maxWidth = cardWidth - 40;
            
            words.forEach(word => {
                const testLine = line + word + ' ';
                const metrics = this.ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && line !== '') {
                    this.ctx.fillText(line, x + cardWidth / 2, lineY);
                    line = word + ' ';
                    lineY += 20;
                } else {
                    line = testLine;
                }
            });
            
            this.ctx.fillText(line, x + cardWidth / 2, lineY);
            
            // 選択番号
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillText(`Press ${index + 1}`, x + cardWidth / 2, y + cardHeight - 20);
        });
        
        // 操作説明
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Use 1, 2, 3 keys or Arrow Keys + Enter to select', this.canvas.width / 2, this.canvas.height - 50);
    }

    // テキストを折り返すヘルパー関数
    wrapText(text, maxWidth) {
        if (!text) return [];
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    setupUIHandlers() {
        const startButton = document.getElementById('start-button');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.startGame();
            });
        }

        const retryButton = document.getElementById('retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                document.getElementById('gameover-screen').classList.add('hidden');
                this.startGame();
            });
        }
        
        const menuButton = document.getElementById('menu-button');
        if (menuButton) {
            menuButton.addEventListener('click', () => {
                document.getElementById('gameover-screen').classList.add('hidden');
                this.resetGame();
            });
        }
    }

    startGame() {
        console.log('=== Starting game ===');
        
        document.getElementById('start-screen')?.classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('levelup-screen').classList.add('hidden');
        
        this.state = 'playing';
        console.log('State changed to: playing');
        
        const startX = 0; // 原点からスタート
        const startY = 0;
        
        this.player = new Player(startX, startY);
        this.enemies = [];
        
        // ★カメラのターゲットをプレイヤーに設定
        if (this.camera) {
            this.camera.setTarget(this.player);
        }
        
        // プラグインシステムを使用して武器を作成
        if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
            console.log('Creating weapon via plugin system...');
            const weaponInstance = window.PixelApocalypse.WeaponRegistry.create(this.selectedWeapon || 'sword');
            if (weaponInstance) {
                console.log('Weapon created successfully:', weaponInstance);
                this.weapons = [weaponInstance];
            } else {
                console.warn('Plugin weapon creation failed, using fallback...');
                // フォールバック: 既存システムを使用
                this.weapons = [new Weapon(this.selectedWeapon || 'sword')];
            }
        } else {
            console.log('Plugin system not available, using fallback weapon...');
            // フォールバック: 既存システムを使用
            this.weapons = [new Weapon(this.selectedWeapon || 'sword')];
        }
        
        this.particles = [];
        this.projectiles = [];
        this.slashEffects = [];
        this.time = 0;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2.0;
        this.difficultyMultiplier = 1.0;
        this.enemiesKilled = 0;
        
        console.log('Game started successfully with weapon:', this.selectedWeapon);
    }

    spawnEnemy() {
        const side = randomInt(0, 3);
        let x, y;
        
        // カメラの視界外ギリギリにスポーン（画面端から50-150pxの範囲）
        const minMargin = 50;  // 最小マージン
        const maxMargin = 150; // 最大マージン
        
        const bounds = this.camera.getViewBounds();
        
        switch (side) {
            case 0: // top
                x = bounds.left + random(0, bounds.width);
                y = bounds.top - random(minMargin, maxMargin);
                break;
            case 1: // right
                x = bounds.right + random(minMargin, maxMargin);
                y = bounds.top + random(0, bounds.height);
                break;
            case 2: // bottom
                x = bounds.left + random(0, bounds.width);
                y = bounds.bottom + random(minMargin, maxMargin);
                break;
            case 3: // left
                x = bounds.left - random(minMargin, maxMargin);
                y = bounds.top + random(0, bounds.height);
                break;
        }
        
        // 境界チェックを削除 - 敵は無限の空間にスポーン
        
        // プラグインシステムを使用して敵を生成
        if (window.PixelApocalypse && window.PixelApocalypse.EnemyRegistry) {
            const enemyInstance = window.PixelApocalypse.EnemyRegistry.create('basic-zombie', x, y);
            if (enemyInstance) {
                this.enemies.push(enemyInstance);
            } else {
                // フォールバック: 既存システムを使用
                this.enemies.push(new Enemy(x, y, this.getRandomEnemyType()));
            }
        } else {
            // フォールバック: 既存システムを使用
            this.enemies.push(new Enemy(x, y, this.getRandomEnemyType()));
        }
    }
    
    getRandomEnemyType() {
        const rand = Math.random();
        if (rand < 0.7) {
            return 'normal';
        } else if (rand < 0.9) {
            return 'fast';
        } else {
            return 'tank';
        }
    }

    showLevelUpScreen() {
        console.log('Level up! Showing weapon selection');
        
        // 武器選択画面に移行
        this.state = 'weapon_select';
        this.selectedWeaponIndex = 0;
        this.weaponSelectionOptions = null;
        this.paused = true;
    }
    
    generateUpgradeOptions() {
        const allPowerups = [
            {
                name: '攻撃範囲拡大',
                description: '武器の攻撃範囲が20%増加',
                icon: '⚔️',
                effect: () => {
                    this.weapons.forEach(weapon => {
                        weapon.range *= 1.2;
                    });
                }
            },
            {
                name: '攻撃速度アップ',
                description: '攻撃のクールダウンが10%減少',
                icon: '⚡',
                effect: () => {
                    this.weapons.forEach(weapon => {
                        // プラグイン武器かチェック
                        const isPluginWeapon = weapon instanceof window.PixelApocalypse?.WeaponBase;
                        if (isPluginWeapon) {
                            weapon.levelUp(); // プラグイン武器のlevelUpメソッドを使用
                        } else {
                            weapon.cooldown = Math.max(MAX_ATTACK_SPEED, weapon.cooldown * ATTACK_SPEED_INCREASE_FACTOR);
                        }
                    });
                }
            },
            {
                name: '移動速度アップ',
                description: '移動速度が15%増加',
                icon: '🏃',
                effect: () => {
                    this.player.speed *= 1.15;
                }
            },
            {
                name: '最大HPアップ',
                description: '最大HPが20増加し、HPが全回復',
                icon: '❤️',
                effect: () => {
                    this.player.maxHp += 20;
                    this.player.hp = this.player.maxHp;
                }
            },
            {
                name: '攻撃力アップ',
                description: '武器のダメージが25%増加',
                icon: '💪',
                effect: () => {
                    this.weapons.forEach(weapon => {
                        weapon.damage *= 1.25;
                    });
                }
            },
            {
                name: '遠距離武器追加',
                description: '新しい遠距離攻撃武器を獲得',
                icon: '✨',
                effect: () => {
                    if (this.weapons.length < MAX_WEAPONS) {
                        // プラグインシステムを使用して魔法武器を追加
                        if (window.PixelApocalypse && window.PixelApocalypse.WeaponRegistry) {
                            const newWeapon = window.PixelApocalypse.WeaponRegistry.create('magic');
                            if (newWeapon) {
                                this.weapons.push(newWeapon);
                                console.log('Magic weapon added via plugin system');
                            } else {
                                // フォールバック: 既存システムを使用（'magic'で統一）
                                const fallbackWeapon = new Weapon('magic');
                                this.weapons.push(fallbackWeapon);
                                console.log('Magic weapon added via fallback system');
                            }
                        } else {
                            // フォールバック: 既存システムを使用（'magic'で統一）
                            const fallbackWeapon = new Weapon('magic');
                            this.weapons.push(fallbackWeapon);
                            console.log('Magic weapon added via fallback system');
                        }
                    } else {
                        // 武器が最大数の場合、全武器の攻撃力を30%アップ
                        this.weapons.forEach(weapon => {
                            weapon.damage *= 1.3;
                        });
                        console.log('Max weapons reached, damage increased by 30%');
                    }
                }
            }
        ];
        
        const shuffled = [...allPowerups];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, 3);
    }
    
    setupLevelUpHandlers() {
        // 既存のリスナーを削除（重複防止）
        if (this.levelUpMouseMove) {
            this.canvas.removeEventListener('mousemove', this.levelUpMouseMove);
        }
        if (this.levelUpClick) {
            this.canvas.removeEventListener('click', this.levelUpClick);
        }
        
        // マウス移動（ホバー効果）
        this.levelUpMouseMove = (e) => {
            if (this.state !== 'level_up') return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // どのカードの上にいるか判定
            this.hoveredUpgradeIndex = -1;
            
            if (this.upgradeOptions) {
                this.upgradeOptions.forEach((option, index) => {
                    if (option.bounds) {
                        const { x, y, width, height } = option.bounds;
                        if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
                            this.hoveredUpgradeIndex = index;
                            this.canvas.style.cursor = 'pointer';
                        }
                    }
                });
            }
            
            if (this.hoveredUpgradeIndex === -1) {
                this.canvas.style.cursor = 'default';
            }
        };
        
        // クリック
        this.levelUpClick = (e) => {
            if (this.state !== 'level_up') return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // クリックされたカードを検出
            if (this.upgradeOptions) {
                this.upgradeOptions.forEach((option, index) => {
                    if (option.bounds) {
                        const { x, y, width, height } = option.bounds;
                        if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
                            console.log(`Upgrade selected: ${option.name}`);
                            this.applyUpgrade(option);
                            
                            // イベントリスナーを削除
                            this.canvas.removeEventListener('mousemove', this.levelUpMouseMove);
                            this.canvas.removeEventListener('click', this.levelUpClick);
                            this.canvas.style.cursor = 'default';
                            
                            // ゲームを再開
                            this.state = 'playing';
                            this.paused = false;
                        }
                    }
                });
            }
        };
        
        this.canvas.addEventListener('mousemove', this.levelUpMouseMove);
        this.canvas.addEventListener('click', this.levelUpClick);
        
        this.hoveredUpgradeIndex = -1;
    }
    
    applyUpgrade(option) {
        if (option && option.effect) {
            option.effect();
        }
    }
    
    drawLevelUpScreen() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // ★ゲーム画面を先に描画（背景として）
        
        // カメラのトランスフォームを適用
        this.camera.applyTransform(ctx);
        
        const effectiveCamera = this.camera;
        
        // 背景を描画
        if (this.mapSystem && this.mapSystemReady) {
            this.mapSystem.render(ctx, effectiveCamera);
        }
        
        // プレイヤーを描画
        if (this.player) {
            this.player.draw(ctx, effectiveCamera);
        }
        
        // 敵を描画
        this.enemies.forEach(enemy => {
            enemy.draw(ctx, effectiveCamera);
        });
        
        // 武器エフェクトを描画
        this.weapons.forEach(weapon => {
            if (weapon.draw) {
                weapon.draw(ctx, effectiveCamera);
            }
        });
        
        // パーティクルを描画
        this.particles.forEach(particle => {
            if (effectiveCamera.isInView(particle.x, particle.y, 50)) {
                ctx.save();
                ctx.translate(particle.x, particle.y);
                particle.draw(ctx);
                ctx.restore();
            }
        });
        
        // カメラのトランスフォームを解除
        this.camera.resetTransform(ctx);
        
        // ★暗いオーバーレイ（半透明）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // ★レベルアップタイトル
        ctx.save();
        
        // 発光エフェクト
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⭐ LEVEL UP! ⭐', canvas.width / 2, 100);
        
        ctx.restore();
        
        // レベル表示
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${this.player.level}`, canvas.width / 2, 150);
        
        // ★アップグレード選択肢がない場合
        if (!this.upgradeOptions || this.upgradeOptions.length === 0) {
            ctx.fillStyle = '#ff0000';
            ctx.font = '24px Arial';
            ctx.fillText('アップグレードオプションがありません', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // ★アップグレードカードの描画
        const cardWidth = 220;
        const cardHeight = 280;
        const cardSpacing = 30;
        const totalWidth = (cardWidth * this.upgradeOptions.length) + (cardSpacing * (this.upgradeOptions.length - 1));
        const startX = (canvas.width - totalWidth) / 2;
        const startY = 220;
        
        this.upgradeOptions.forEach((option, index) => {
            const x = startX + (index * (cardWidth + cardSpacing));
            const y = startY;
            
            // ★境界ボックスを保存（クリック判定用）
            option.bounds = { x, y, width: cardWidth, height: cardHeight };
            
            // ★ホバー効果
            const isHovered = this.hoveredUpgradeIndex === index;
            
            ctx.save();
            
            // カードの影
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;
            
            // カード背景
            ctx.fillStyle = isHovered ? '#3a3a5e' : '#2a2a3e';
            ctx.fillRect(x, y, cardWidth, cardHeight);
            
            ctx.restore();
            
            // カード枠（発光）
            ctx.save();
            
            if (isHovered) {
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 15;
            }
            
            ctx.strokeStyle = isHovered ? '#FFD700' : '#6a5acd';
            ctx.lineWidth = isHovered ? 4 : 3;
            ctx.strokeRect(x, y, cardWidth, cardHeight);
            
            ctx.restore();
            
            // アイコン/エモジ
            ctx.font = '64px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(option.icon || '⭐', x + cardWidth / 2, y + 80);
            
            // タイトル
            ctx.font = 'bold 22px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(option.name, x + cardWidth / 2, y + 130);
            
            // 説明
            ctx.font = '16px Arial';
            ctx.fillStyle = '#cccccc';
            const descLines = this.wrapText(option.description, cardWidth - 20);
            descLines.forEach((line, lineIndex) => {
                ctx.fillText(line, x + cardWidth / 2, y + 165 + (lineIndex * 22));
            });
            
            // ホバー時の追加テキスト
            if (isHovered) {
                ctx.font = 'bold 18px Arial';
                ctx.fillStyle = '#FFD700';
                ctx.fillText('クリックして選択', x + cardWidth / 2, y + cardHeight - 15);
            }
        });
        
        // 下部の指示
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('アップグレードを選択してください', canvas.width / 2, canvas.height - 50);
    }

    gameOver() {
        this.state = 'gameover';
        
        const gameoverScreen = document.getElementById('gameover-screen');
        const finalStats = document.getElementById('final-stats');
        
        const minutes = Math.floor(this.time / 60);
        const seconds = Math.floor(this.time % 60);
        
        finalStats.innerHTML = `
            <strong>生存時間:</strong> ${minutes}:${seconds.toString().padStart(2, '0')}<br>
            <strong>レベル:</strong> ${this.player.level}<br>
            <strong>倒した敵:</strong> ${this.enemiesKilled}
        `;
        
        gameoverScreen.classList.remove('hidden');
        
        console.log(`Game Over - Time: ${this.time.toFixed(1)}s, Level: ${this.player.level}, Kills: ${this.enemiesKilled}`);
    }

    resetGame() {
        console.log('=== Resetting game ===');
        
        // ★マウスイベントリスナーをクリーンアップ
        if (this.weaponSelectionMouseMove) {
            this.canvas.removeEventListener('mousemove', this.weaponSelectionMouseMove);
            this.weaponSelectionMouseMove = null;
        }
        if (this.weaponSelectionClick) {
            this.canvas.removeEventListener('click', this.weaponSelectionClick);
            this.weaponSelectionClick = null;
        }
        
        // カーソルをリセット
        this.canvas.style.cursor = 'default';
        
        // ゲームオブジェクトをクリア
        this.player = null;
        this.enemies = [];
        this.weapons = [];
        this.particles = [];
        this.projectiles = [];
        this.slashEffects = [];
        
        // ゲーム統計をリセット
        this.time = 0;
        this.enemiesKilled = 0;
        this.enemySpawnTimer = 0;
        this.difficultyMultiplier = 1.0;
        
        // 状態をリセット
        this.hoveredWeaponIndex = -1;
        
        // ★武器選択を再セットアップ
        this.setupWeaponSelection();
        
        console.log('Game reset complete');
    }

    drawBackground(ctx, camera) {
        // After ctx.scale() is applied, draw in screen space (which gets scaled)
        ctx.fillStyle = '#2a2a2a';
        
        // Fill a large area to cover the background
        ctx.fillRect(0, 0, this.canvas.width / camera.zoom, this.canvas.height / camera.zoom);
        
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1 / camera.zoom;
        
        // Grid size in world space
        const gridSize = 50;
        const worldWidth = this.canvas.width / camera.zoom;
        const worldHeight = this.canvas.height / camera.zoom;
        const startX = Math.floor(camera.x / gridSize) * gridSize;
        const startY = Math.floor(camera.y / gridSize) * gridSize;
        const endX = camera.x + worldWidth;
        const endY = camera.y + worldHeight;
        
        // Draw vertical grid lines
        for (let x = startX; x < endX; x += gridSize) {
            const screenX = x - camera.x;
            ctx.beginPath();
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, worldHeight);
            ctx.stroke();
        }
        
        // Draw horizontal grid lines
        for (let y = startY; y < endY; y += gridSize) {
            const screenY = y - camera.y;
            ctx.beginPath();
            ctx.moveTo(0, screenY);
            ctx.lineTo(worldWidth, screenY);
            ctx.stroke();
        }
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        this.time += deltaTime;
        
        // ★カメラ更新
        if (this.camera && this.player) {
            this.camera.update();
        }
        
        // ★キーボードズーム（playing状態のみ）
        if (this.player && this.camera) {
            // + または = キーで拡大
            if (this.keys['+'] || this.keys['=']) {
                this.camera.setZoom(this.camera.zoom + 0.02);
            }
            
            // - または _ キーで縮小
            if (this.keys['-'] || this.keys['_']) {
                this.camera.setZoom(this.camera.zoom - 0.02);
            }
        }
        
        this.difficultyMultiplier = 1 + (this.time / 60) * 0.5;
        this.enemySpawnInterval = Math.max(0.5, 2.0 - (this.time / 120));
        
        this.player.update(deltaTime, this.keys);
        
        if (this.player.isDead()) {
            this.gameOver();
            return;
        }
        
        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            this.enemySpawnTimer = 0;
            const spawnCount = Math.floor(1 + this.difficultyMultiplier / 2);
            for (let i = 0; i < spawnCount; i++) {
                this.spawnEnemy();
            }
        }
        
        this.enemies.forEach(enemy => {
            // プラグインベースの敵かチェック
            const isPluginEnemy = enemy instanceof window.PixelApocalypse?.EnemyBase;
            
            // プラグイン敵は(player, deltaTime)、既存敵は(deltaTime, player)
            if (isPluginEnemy) {
                enemy.update(this.player, deltaTime);
            } else {
                enemy.update(deltaTime, this.player);
            }
            
            // 衝突判定
            const isColliding = isPluginEnemy 
                ? enemy.isCollidingWithPlayer(this.player)
                : enemy.collidesWith(this.player);
            
            if (isColliding) {
                if (this.player.takeDamage(enemy.damage)) {
                    for (let i = 0; i < 10; i++) {
                        this.particles.push(new Particle(
                            this.player.x,
                            this.player.y,
                            '#ff0000',
                            {
                                x: random(-100, 100),
                                y: random(-100, 100)
                            },
                            0.5
                        ));
                    }
                }
            }
        });
        
        this.weapons.forEach(weapon => {
            // プラグインベースの武器かチェック
            const isPluginWeapon = weapon instanceof window.PixelApocalypse?.WeaponBase;
            
            if (isPluginWeapon) {
                // プラグイン武器の更新と攻撃
                weapon.update(deltaTime, this.player, this.enemies);
                
                const currentTime = this.time * 1000; // ミリ秒に変換
                const hitEnemies = weapon.attack(this.player, this.enemies, currentTime);
                
                // 被ダメージエフェクトの処理
                hitEnemies.forEach(enemy => {
                    // プラグイン敵のhealth or 既存敵のhp
                    const isPluginEnemy = enemy instanceof window.PixelApocalypse?.EnemyBase;
                    const killed = isPluginEnemy ? (!enemy.isAlive || enemy.health <= 0) : (enemy.hp <= 0);
                    
                    const particleCount = killed ? this.KILL_PARTICLE_COUNT : this.HIT_PARTICLE_COUNT;
                    const particleLifetime = killed ? this.KILL_PARTICLE_LIFETIME : this.HIT_PARTICLE_LIFETIME;
                    const particleColor = killed ? enemy.color : '#ffff00';
                    
                    for (let i = 0; i < particleCount; i++) {
                        const angle = random(0, Math.PI * 2);
                        const speed = random(this.PARTICLE_SPEED_MIN, this.PARTICLE_SPEED_MAX);
                        this.particles.push(new Particle(
                            enemy.x,
                            enemy.y,
                            particleColor,
                            {
                                x: Math.cos(angle) * speed,
                                y: Math.sin(angle) * speed + this.PARTICLE_UPWARD_BIAS
                            },
                            particleLifetime
                        ));
                    }
                    
                    if (killed) {
                        this.enemiesKilled++;
                        
                        const leveledUp = this.player.gainXp(enemy.expValue || enemy.xpValue);
                        
                        if (leveledUp) {
                            this.showLevelUpScreen();
                        }
                    }
                });
                
                // ★追加：update()内で倒された敵のXP処理
                // ブーメランと魔法はupdate()内で敵を倒すため、ここでチェック
                this.enemies.forEach(enemy => {
                    const isPluginEnemy = enemy instanceof window.PixelApocalypse?.EnemyBase;
                    const isDead = isPluginEnemy ? !enemy.isAlive : enemy.hp <= 0;
                    
                    if (isDead && !enemy._xpAwarded) {
                        enemy._xpAwarded = true; // XP重複付与を防ぐフラグ
                        
                        // パーティクル生成
                        for (let i = 0; i < this.KILL_PARTICLE_COUNT; i++) {
                            const angle = random(0, Math.PI * 2);
                            const speed = random(this.PARTICLE_SPEED_MIN, this.PARTICLE_SPEED_MAX);
                            this.particles.push(new Particle(
                                enemy.x,
                                enemy.y,
                                enemy.color,
                                {
                                    x: Math.cos(angle) * speed,
                                    y: Math.sin(angle) * speed + this.PARTICLE_UPWARD_BIAS
                                },
                                this.KILL_PARTICLE_LIFETIME
                            ));
                        }
                        
                        this.enemiesKilled++;
                        const leveledUp = this.player.gainXp(enemy.expValue || enemy.xpValue);
                        
                        if (leveledUp) {
                            this.showLevelUpScreen();
                        }
                    }
                });
            } else {
                // 既存の武器システム
                weapon.update(deltaTime, this.player, this.enemies, this.projectiles, this.slashEffects);
                
                const hitEnemies = weapon.attack(this.player, this.enemies, this.particles, this.projectiles, this.slashEffects);
                
                hitEnemies.forEach(enemy => {
                    const killed = enemy.takeDamage(weapon.damage);
                    
                    const particleCount = killed ? this.KILL_PARTICLE_COUNT : this.HIT_PARTICLE_COUNT;
                    const particleLifetime = killed ? this.KILL_PARTICLE_LIFETIME : this.HIT_PARTICLE_LIFETIME;
                    const particleColor = killed ? enemy.color : '#ffff00';
                    
                    for (let i = 0; i < particleCount; i++) {
                        const angle = random(0, Math.PI * 2);
                        const speed = random(this.PARTICLE_SPEED_MIN, this.PARTICLE_SPEED_MAX);
                        this.particles.push(new Particle(
                            enemy.x,
                            enemy.y,
                            particleColor,
                            {
                                x: Math.cos(angle) * speed,
                                y: Math.sin(angle) * speed + this.PARTICLE_UPWARD_BIAS
                            },
                            particleLifetime
                        ));
                    }
                    
                    if (killed) {
                        this.enemiesKilled++;
                        
                        const leveledUp = this.player.gainXp(enemy.xpValue);
                        
                        if (leveledUp) {
                            this.showLevelUpScreen();
                        }
                    }
                });
            }
        });
        
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime);
            
            this.enemies.forEach(enemy => {
                if (projectile.checkCollision(enemy)) {
                    const killed = enemy.takeDamage(projectile.damage);
                    projectile.active = false;
                    
                    if (DEBUG_HIT_DETECTION) {
                        console.log('Projectile hit:', enemy.type);
                    }
                    
                    const particleCount = killed ? this.KILL_PARTICLE_COUNT : this.HIT_PARTICLE_COUNT;
                    const particleLifetime = killed ? this.KILL_PARTICLE_LIFETIME : this.HIT_PARTICLE_LIFETIME;
                    const particleColor = killed ? enemy.color : '#ffff00';
                    
                    for (let i = 0; i < particleCount; i++) {
                        const angle = random(0, Math.PI * 2);
                        const speed = random(this.PARTICLE_SPEED_MIN, this.PARTICLE_SPEED_MAX);
                        this.particles.push(new Particle(
                            enemy.x,
                            enemy.y,
                            particleColor,
                            {
                                x: Math.cos(angle) * speed,
                                y: Math.sin(angle) * speed + this.PARTICLE_UPWARD_BIAS
                            },
                            particleLifetime
                        ));
                    }
                    
                    if (killed) {
                        this.enemiesKilled++;
                        const leveledUp = this.player.gainXp(enemy.xpValue);
                        if (leveledUp) {
                            this.showLevelUpScreen();
                        }
                    }
                }
            });
        });
        
        this.slashEffects.forEach(slash => {
            slash.update(deltaTime);
        });
        
        this.projectiles = this.projectiles.filter(p => p.active);
        this.slashEffects = this.slashEffects.filter(s => !s.isDead());
        
        // 敵のフィルタリング（プラグインと既存の両方に対応）
        this.enemies = this.enemies.filter(enemy => {
            const isPluginEnemy = enemy instanceof window.PixelApocalypse?.EnemyBase;
            return isPluginEnemy ? enemy.isAlive : enemy.hp > 0;
        });
        
        this.particles.forEach(particle => particle.update(deltaTime));
        this.particles = this.particles.filter(particle => !particle.isDead());
        
        // マップシステムの更新（キャッシュクリアなど）
        if (this.mapSystem && this.mapSystemReady) {
            this.mapSystem.update(deltaTime, this.camera);
        }
        
        this.updateUI();
    }

    updateUI() {
        const hpPercent = (this.player.hp / this.player.maxHp) * 100;
        document.getElementById('hp-bar').style.width = hpPercent + '%';
        document.getElementById('hp-text').textContent = `${Math.ceil(this.player.hp)}/${this.player.maxHp}`;
        
        const xpPercent = (this.player.xp / this.player.xpToNextLevel) * 100;
        document.getElementById('xp-bar').style.width = xpPercent + '%';
        document.getElementById('xp-text').textContent = `${this.player.xp}/${this.player.xpToNextLevel}`;
        
        document.getElementById('level').textContent = this.player.level;
        
        const minutes = Math.floor(this.time / 60);
        const seconds = Math.floor(this.time % 60);
        document.getElementById('time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    draw() {
        // 状態に応じて描画
        if (this.state === 'weapon_select') {
            // 背景をクリア
            this.ctx.fillStyle = '#0f0f1e';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawWeaponSelection();
            return;
        }
        
        if (this.state === 'level_up') {
            this.drawLevelUpScreen(); // ★ゲーム画面 + オーバーレイ
            return;
        }
        
        if (this.state !== 'playing' && this.state !== 'paused') {
            return;
        }
        
        // 背景クリア
        this.ctx.fillStyle = '#0f0f1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 地面（マップシステム）
        if (this.mapSystem && this.mapSystemReady) {
            this.mapSystem.render(this.ctx, this.camera);
        }
        
        // プレイヤー
        if (this.player) {
            const screenPos = this.camera.worldToScreen(this.player.x, this.player.y);
            if (this.player.drawAtPosition) {
                this.player.drawAtPosition(this.ctx, screenPos.x, screenPos.y, this.camera.zoom);
            } else {
                this.player.draw(this.ctx, this.camera);
            }
        }
        
        // 敵
        this.enemies.forEach(enemy => {
            if (this.camera.isInView(enemy.x, enemy.y, 50)) {
                const screenPos = this.camera.worldToScreen(enemy.x, enemy.y);
                if (enemy.drawAtPosition) {
                    enemy.drawAtPosition(this.ctx, screenPos.x, screenPos.y, this.camera.zoom);
                } else {
                    enemy.draw(this.ctx, this.camera);
                }
            }
        });
        
        // 武器エフェクト
        this.weapons.forEach((weapon, index) => {
            const isPluginWeapon = weapon instanceof window.PixelApocalypse?.WeaponBase;
            
            if (isPluginWeapon) {
                weapon.draw(this.ctx, this.camera);
            } else {
                weapon.drawWeaponEffect(this.ctx, this.player, this.camera, index);
            }
        });
        
        // パーティクル
        this.particles.forEach(particle => {
            if (this.camera.isInView(particle.x, particle.y, 50)) {
                const screenPos = this.camera.worldToScreen(particle.x, particle.y);
                this.ctx.save();
                this.ctx.translate(screenPos.x, screenPos.y);
                particle.draw(this.ctx, this.camera.zoom);
                this.ctx.restore();
            }
        });
        
        // プロジェクタイル
        this.projectiles.forEach(projectile => {
            if (this.camera.isInView(projectile.x, projectile.y, 100)) {
                const legacyCamera = { x: this.camera.x, y: this.camera.y, zoom: this.camera.zoom };
                projectile.draw(this.ctx, legacyCamera);
            }
        });
        
        // スラッシュエフェクト
        this.slashEffects.forEach(slash => {
            const legacyCamera = { x: this.camera.x, y: this.camera.y, zoom: this.camera.zoom };
            slash.draw(this.ctx, legacyCamera);
        });
        
        // UI（画面座標）
        this.drawUI();
        
        // デバッグ情報（最後に描画）
        if (this.debug) {
            this.debug.draw(this.ctx, this);
        }
    }
    
    drawUI() {
        // UI elements are drawn via HTML overlays (see index.html)
        // HP bar, XP bar, level, and time are updated via DOM manipulation
        // This method is a placeholder for any future canvas-based UI elements
    }

    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        const cappedDeltaTime = Math.min(deltaTime, 0.1);
        
        this.frameCount++;
        this.fpsTimer += deltaTime;
        if (this.fpsTimer >= 1.0) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer = 0;
            
            // FPS計算と記録
            if (this.debug) {
                this.debug.recordFPS(this.fps);
            }
        }
        
        this.update(cappedDeltaTime);
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ============================================================================
// Initialize Game
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    window.gameInstance = game;
    console.log('Game ready');
});
