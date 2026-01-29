// ============================================================================
// Pixel Apocalypse - game.js
// HTML5 Canvas と JavaScript で作られた2Dアクションサバイバルゲーム
// ============================================================================

// ============================================================================
// Constants
// ============================================================================

const MAX_WEAPONS = 5;

// World and Camera Constants
const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 4000;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Camera Dead Zone
const CAMERA_DEADZONE_X = 150;
const CAMERA_DEADZONE_Y = 100;

// Zoom Constants
const INITIAL_ZOOM = 2.0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_SPEED = 0.1;

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

    draw(ctx) {
        const alpha = 1 - (this.age / this.lifetime);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        
        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'star') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const x = Math.cos(angle) * this.size;
                const y = Math.sin(angle) * this.size;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * (this.size / 2);
                const innerY = Math.sin(innerAngle) * (this.size / 2);
                ctx.lineTo(innerX, innerY);
            }
            const firstAngle = -Math.PI / 2;
            const firstX = Math.cos(firstAngle) * this.size;
            const firstY = Math.sin(firstAngle) * this.size;
            ctx.lineTo(firstX, firstY);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
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

    draw(ctx, screenX, screenY, direction = 0) {
        ctx.save();
        ctx.translate(screenX, screenY);
        
        if (this.damageFrame > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.strokeStyle = '#ff0000';
            ctx.fillStyle = '#ff0000';
        } else {
            ctx.strokeStyle = this.color;
            ctx.fillStyle = this.color;
        }
        
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        const bounceY = this.bodyBounce;
        
        const headRadius = 5;
        const bodyLength = 15;
        const armLength = 10;
        const legLength = 14;
        
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
// Boomerang Class
// ============================================================================

class Boomerang {
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
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        ctx.save();
        ctx.translate(screenX, screenY);
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
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = this.glowColor;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
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
        this.speed = 150;
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

        this.x = Math.max(this.size, Math.min(WORLD_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(WORLD_HEIGHT - this.size, this.y));
        
        this.stickFigure.x = this.x;
        this.stickFigure.y = this.y;
        this.stickFigure.update(deltaTime, this.isMoving);
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        this.stickFigure.draw(ctx, screenX, screenY, this.direction);
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
                this.speed = 120;
                this.maxHp = 30;
                this.damage = 8;
                this.xpValue = 15;
                this.color = '#ffff00';
                break;
            case 'tank':
                this.size = ENEMY_SIZE_TANK;
                this.speed = 50;
                this.maxHp = 150;
                this.damage = 20;
                this.xpValue = 40;
                this.color = '#ff00ff';
                break;
            case 'normal':
            default:
                this.size = ENEMY_SIZE_NORMAL;
                this.speed = 80;
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
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        this.stickFigure.draw(ctx, screenX, screenY);
        
        const barWidth = this.size * 1.5;
        const barHeight = 4;
        const hpPercent = this.hp / this.maxHp;
        
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.size - 10;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
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
                const boom = new Boomerang(player.x, player.y, nearest.x, nearest.y, this.damage);
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
// Camera Class
// ============================================================================

class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.zoom = INITIAL_ZOOM;
        this.deadZoneX = CAMERA_DEADZONE_X;
        this.deadZoneY = CAMERA_DEADZONE_Y;
    }
    
    follow(player) {
        // Calculate center of camera viewport
        const cameraCenterX = this.x + this.canvas.width / 2 / this.zoom;
        const cameraCenterY = this.y + this.canvas.height / 2 / this.zoom;
        
        // Calculate player offset from camera center
        const deltaX = player.x - cameraCenterX;
        const deltaY = player.y - cameraCenterY;
        
        // Apply movement only if player is outside dead zone
        if (Math.abs(deltaX) > this.deadZoneX / this.zoom) {
            this.x += deltaX - Math.sign(deltaX) * this.deadZoneX / this.zoom;
        }
        
        if (Math.abs(deltaY) > this.deadZoneY / this.zoom) {
            this.y += deltaY - Math.sign(deltaY) * this.deadZoneY / this.zoom;
        }
        
        // Clamp camera to world bounds
        this.x = Math.max(0, Math.min(WORLD_WIDTH - this.canvas.width / this.zoom, this.x));
        this.y = Math.max(0, Math.min(WORLD_HEIGHT - this.canvas.height / this.zoom, this.y));
    }
}

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
        
        this.state = 'weapon_select';
        this.selectedWeapon = null;
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
        
        this.setupInputHandlers();
        this.setupUIHandlers();
        this.setupWeaponSelection();
        
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('Game initialized');
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
            
            if (this.state === 'weapon_select') {
                if (e.key === '1') this.selectWeapon('sword');
                if (e.key === '2') this.selectWeapon('boomerang');
                if (e.key === '3') this.selectWeapon('magic_bolt');
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const zoomDelta = e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;
            this.camera.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.camera.zoom + zoomDelta));
        }, { passive: false });
    }

    setupWeaponSelection() {
        const weaponOptions = [
            {
                type: 'sword',
                name: '剣 (Sword)',
                icon: '⚔️',
                description: '近接武器',
                stats: '範囲: 狭い | 速度: 普通 | ダメージ: 高',
                key: '1'
            },
            {
                type: 'boomerang',
                name: 'ブーメラン (Boomerang)',
                icon: '🪃',
                description: '中距離武器',
                stats: '範囲: 中 | 速度: やや遅 | ダメージ: 中',
                key: '2'
            },
            {
                type: 'magic_bolt',
                name: '魔法弾 (Magic Bolt)',
                icon: '✨',
                description: '遠距離武器',
                stats: '範囲: 広 | 速度: 速 | ダメージ: 低',
                key: '3'
            }
        ];
        
        const container = document.getElementById('weapon-options');
        weaponOptions.forEach(weapon => {
            const option = document.createElement('div');
            option.className = 'weapon-option';
            option.setAttribute('role', 'button');
            option.setAttribute('tabindex', '0');
            option.setAttribute('aria-label', `${weapon.name} - ${weapon.description}. Press ${weapon.key} or Enter to select`);
            option.innerHTML = `
                <div class="weapon-icon">${weapon.icon}</div>
                <h3>${weapon.name}</h3>
                <p>${weapon.description}</p>
                <div class="weapon-stats">
                    <p>${weapon.stats}</p>
                </div>
            `;
            
            const selectWeapon = () => this.selectWeapon(weapon.type);
            
            option.addEventListener('click', selectWeapon);
            option.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectWeapon();
                }
            });
            
            container.appendChild(option);
        });
    }

    selectWeapon(weaponType) {
        this.selectedWeapon = weaponType;
        document.getElementById('weapon-selection-screen').classList.add('hidden');
        this.startGame();
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
                this.state = 'weapon_select';
                document.getElementById('weapon-selection-screen').classList.remove('hidden');
                document.getElementById('gameover-screen').classList.add('hidden');
            });
        }
    }

    startGame() {
        document.getElementById('start-screen')?.classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('levelup-screen').classList.add('hidden');
        
        this.state = 'playing';
        
        const startX = WORLD_WIDTH / 2;
        const startY = WORLD_HEIGHT / 2;
        
        this.player = new Player(startX, startY);
        this.enemies = [];
        this.weapons = [new Weapon(this.selectedWeapon || 'sword')];
        this.particles = [];
        this.projectiles = [];
        this.slashEffects = [];
        this.time = 0;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2.0;
        this.difficultyMultiplier = 1.0;
        this.enemiesKilled = 0;
        
        this.camera.zoom = INITIAL_ZOOM;
        
        console.log('Game started with weapon:', this.selectedWeapon);
    }

    spawnEnemy() {
        const side = randomInt(0, 3);
        let x, y;
        
        const visibleWidth = this.canvas.width / this.camera.zoom;
        const visibleHeight = this.canvas.height / this.camera.zoom;
        
        const margin = 600;
        
        switch (side) {
            case 0: // top
                x = this.camera.x + random(-margin, visibleWidth + margin);
                y = this.camera.y - margin;
                break;
            case 1: // right
                x = this.camera.x + visibleWidth + margin;
                y = this.camera.y + random(-margin, visibleHeight + margin);
                break;
            case 2: // bottom
                x = this.camera.x + random(-margin, visibleWidth + margin);
                y = this.camera.y + visibleHeight + margin;
                break;
            case 3: // left
                x = this.camera.x - margin;
                y = this.camera.y + random(-margin, visibleHeight + margin);
                break;
        }
        
        x = Math.max(0, Math.min(WORLD_WIDTH, x));
        y = Math.max(0, Math.min(WORLD_HEIGHT, y));
        
        this.enemies.push(new Enemy(x, y, this.getRandomEnemyType()));
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
        this.state = 'paused';
        const levelupScreen = document.getElementById('levelup-screen');
        const powerupOptions = document.getElementById('powerup-options');
        
        powerupOptions.innerHTML = '';
        
        const allPowerups = [
            {
                name: '攻撃範囲拡大',
                description: '武器の攻撃範囲が20%増加',
                effect: () => {
                    this.weapons.forEach(weapon => {
                        weapon.range *= 1.2;
                    });
                }
            },
            {
                name: '攻撃速度アップ',
                description: '攻撃のクールダウンが10%減少',
                effect: () => {
                    this.weapons.forEach(weapon => {
                        weapon.cooldown = Math.max(MAX_ATTACK_SPEED, weapon.cooldown * ATTACK_SPEED_INCREASE_FACTOR);
                    });
                }
            },
            {
                name: '移動速度アップ',
                description: '移動速度が15%増加',
                effect: () => {
                    this.player.speed *= 1.15;
                }
            },
            {
                name: '最大HPアップ',
                description: '最大HPが20増加し、HPが全回復',
                effect: () => {
                    this.player.maxHp += 20;
                    this.player.hp = this.player.maxHp;
                }
            },
            {
                name: '攻撃力アップ',
                description: '武器のダメージが25%増加',
                effect: () => {
                    this.weapons.forEach(weapon => {
                        weapon.damage *= 1.25;
                    });
                }
            },
            {
                name: '遠距離武器追加',
                description: '新しい遠距離攻撃武器を獲得',
                effect: () => {
                    if (this.weapons.length < MAX_WEAPONS) {
                        this.weapons.push(new Weapon('ranged'));
                    } else {
                        this.weapons.forEach(weapon => {
                            weapon.damage *= 1.3;
                        });
                    }
                }
            }
        ];
        
        const shuffled = [...allPowerups];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const selected = shuffled.slice(0, 3);
        
        selected.forEach(powerup => {
            const option = document.createElement('div');
            option.className = 'powerup-option';
            option.innerHTML = `
                <h3>${powerup.name}</h3>
                <p>${powerup.description}</p>
            `;
            option.addEventListener('click', () => {
                powerup.effect();
                levelupScreen.classList.add('hidden');
                this.state = 'playing';
                console.log(`Power-up selected: ${powerup.name}`);
            });
            powerupOptions.appendChild(option);
        });
        
        levelupScreen.classList.remove('hidden');
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

    drawBackground(ctx, camera) {
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1;
        
        const gridSize = 100;
        for (let x = -camera.x % gridSize; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        
        for (let y = -camera.y % gridSize; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        this.time += deltaTime;
        
        this.difficultyMultiplier = 1 + (this.time / 60) * 0.5;
        this.enemySpawnInterval = Math.max(0.5, 2.0 - (this.time / 120));
        
        this.player.update(deltaTime, this.keys);
        
        this.camera.follow(this.player);
        
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
            enemy.update(deltaTime, this.player);
            
            if (enemy.collidesWith(this.player)) {
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
        
        this.enemies = this.enemies.filter(enemy => enemy.hp > 0);
        
        this.particles.forEach(particle => particle.update(deltaTime));
        this.particles = this.particles.filter(particle => !particle.isDead());
        
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
        // Clear the canvas first
        this.ctx.fillStyle = '#0f0f1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.state === 'playing' || this.state === 'paused') {
            this.ctx.save();
            this.ctx.scale(this.camera.zoom, this.camera.zoom);
            
            const effectiveCamera = {
                x: this.camera.x,
                y: this.camera.y
            };
            
            // Draw background grid (in world space after scale)
            this.ctx.save();
            this.ctx.scale(1 / this.camera.zoom, 1 / this.camera.zoom);
            this.drawBackground(this.ctx, this.camera);
            this.ctx.restore();
            
            this.slashEffects.forEach(slash => {
                slash.draw(this.ctx, effectiveCamera);
            });
            
            this.particles.forEach(particle => {
                const screenX = particle.x - effectiveCamera.x;
                const screenY = particle.y - effectiveCamera.y;
                
                if (screenX >= -50 && screenX <= this.canvas.width / this.camera.zoom + 50 &&
                    screenY >= -50 && screenY <= this.canvas.height / this.camera.zoom + 50) {
                    
                    const origX = particle.x;
                    const origY = particle.y;
                    particle.x = screenX;
                    particle.y = screenY;
                    particle.draw(this.ctx);
                    particle.x = origX;
                    particle.y = origY;
                }
            });
            
            this.projectiles.forEach(projectile => {
                projectile.draw(this.ctx, effectiveCamera);
            });
            
            this.enemies.forEach(enemy => {
                const screenX = enemy.x - effectiveCamera.x;
                const screenY = enemy.y - effectiveCamera.y;
                
                if (screenX >= -100 && screenX <= this.canvas.width / this.camera.zoom + 100 &&
                    screenY >= -100 && screenY <= this.canvas.height / this.camera.zoom + 100) {
                    enemy.draw(this.ctx, effectiveCamera);
                }
            });
            
            this.player.draw(this.ctx, effectiveCamera);
            
            this.weapons.forEach((weapon, index) => {
                weapon.drawWeaponEffect(this.ctx, this.player, effectiveCamera, index);
            });
            
            this.ctx.restore();
        }
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
