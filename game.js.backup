// ============================================================================
// Pixel Apocalypse - game.js
// HTML5 Canvas と JavaScript で作られた2Dアクションサバイバルゲーム
// ============================================================================

// ============================================================================
// Constants
// ============================================================================

const MAX_WEAPONS = 5; // Maximum number of weapons player can have

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
const INITIAL_MELEE_ATTACK_COOLDOWN = 1.5; // 1.5 seconds
const INITIAL_RANGED_ATTACK_COOLDOWN = 1.2; // 1.2 seconds
const ATTACK_SPEED_INCREASE_FACTOR = 0.9; // 10% faster (multiply by 0.9)
const MAX_ATTACK_SPEED = 0.3; // Maximum speed cap (0.3 seconds minimum cooldown)

// Debug mode
const DEBUG_HIT_DETECTION = false; // Set to true to see console logs for hit detection

// ============================================================================
// Utility Functions
// ============================================================================

// Distance calculation between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Normalize vector
function normalize(x, y) {
    const len = Math.sqrt(x * x + y * y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: x / len, y: y / len };
}

// Random number between min and max
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// Random integer between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random choice from array
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Convert meters to pixels based on zoom level and latitude
function metersToPixels(meters, lat, zoom) {
    // At zoom level 20: 1 pixel ≈ 0.15 meters (near equator)
    // Adjust for latitude using cosine correction
    const metersPerPixelAtZoom20 = 0.15 / Math.cos(lat * Math.PI / 180);
    const scale = Math.pow(2, zoom - 20);
    const metersPerPixel = metersPerPixelAtZoom20 / scale;
    
    return meters / metersPerPixel;
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
        this.shape = randomChoice(['square', 'circle', 'star']); // Different shapes for variety
        
        // Physics constants
        this.GRAVITY = 200;
        this.DRAG = 0.98;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.age += deltaTime;
        this.vy += this.GRAVITY * deltaTime; // gravity
        // Add drag (frame-rate independent)
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
            // Draw a simple star shape
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
                // Inner point
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * (this.size / 2);
                const innerY = Math.sin(innerAngle) * (this.size / 2);
                ctx.lineTo(innerX, innerY);
            }
            // Close the star by connecting back to the first point
            const firstAngle = -Math.PI / 2;
            const firstX = Math.cos(firstAngle) * this.size;
            const firstY = Math.sin(firstAngle) * this.size;
            ctx.lineTo(firstX, firstY);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else {
            // Square
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
        this.lifetime = 0.3; // 0.3 seconds for smoother effect
        this.age = 0;
        // Pre-calculate random values for consistent appearance
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
        
        // Draw multiple crescent moon arcs for depth
        const layers = 3;
        for (let layer = 0; layer < layers; layer++) {
            const layerOpacity = 1 - (layer / layers) * 0.5;
            const layerRange = this.range * (1 - layer * 0.1);
            
            // Create gradient for crescent effect
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, layerRange);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${layerOpacity * 0.9})`);
            gradient.addColorStop(0.4, `rgba(100, 200, 255, ${layerOpacity * 0.8})`);
            gradient.addColorStop(0.7, `rgba(50, 150, 255, ${layerOpacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(50, 150, 255, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 4 - layer;
            
            // Draw outer arc (crescent outer edge)
            ctx.beginPath();
            ctx.arc(0, 0, layerRange, -this.arc / 2, this.arc / 2);
            ctx.stroke();
            
            // Draw inner arc to create crescent shape
            if (layer === 0) {
                // Main crescent shape
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${layerOpacity * 0.6})`;
                ctx.lineWidth = 3;
                
                // Inner curve of crescent
                const innerRadius = layerRange * 0.7;
                const innerOffset = layerRange * 0.2;
                
                ctx.arc(innerOffset, 0, innerRadius, this.arc / 2, -this.arc / 2, true);
                ctx.stroke();
            }
        }
        
        // Add trailing sparkles/streaks for extra effect
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
// Stick Figure Class
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
            // Fast leg animation (8 cycles per second)
            this.legPhase += deltaTime * 8;
            // Arms move in sync with legs
            this.armPhase = this.legPhase;
            // Body bounce (walking/running effect)
            this.bodyBounce = Math.sin(this.legPhase * 2) * 2;
        } else {
            // Reset body bounce when not moving
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
        this.attackFrame = 0.2; // 0.2 seconds
    }

    triggerDamage() {
        this.damageFrame = 0.3; // 0.3 seconds
    }

    draw(ctx, screenX, screenY, direction = 0) {
        ctx.save();
        ctx.translate(screenX, screenY);
        
        // Flash when damaged (red blinking)
        if (this.damageFrame > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.strokeStyle = '#ff0000';
            ctx.fillStyle = '#ff0000';
        } else {
            ctx.strokeStyle = this.color;
            ctx.fillStyle = this.color;
        }
        
        ctx.lineWidth = 2; // Thicker lines for better visibility
        ctx.lineCap = 'round';
        
        // Apply body bounce offset
        const bounceY = this.bodyBounce;
        
        // Proportions based on specifications
        const headRadius = 5;
        const bodyLength = 15;
        const armLength = 10;
        const legLength = 14;
        
        // Head (filled circle, directly on top of body, no neck)
        ctx.beginPath();
        ctx.arc(0, -bodyLength - headRadius + bounceY, headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Body (thick vertical line)
        ctx.beginPath();
        ctx.moveTo(0, -bodyLength + bounceY);
        ctx.lineTo(0, 0 + bounceY);
        ctx.stroke();
        
        // Arms (dynamically animated when moving)
        const armAttachY = -bodyLength * 0.7 + bounceY; // Attach 70% up the body
        
        if (this.isMoving) {
            // Arms swing back and forth when moving
            const leftArmAngle = Math.sin(this.armPhase) * 0.5;
            const rightArmAngle = Math.sin(this.armPhase + Math.PI) * 0.5;
            
            // Left arm
            ctx.beginPath();
            ctx.moveTo(0, armAttachY);
            ctx.lineTo(
                Math.sin(leftArmAngle) * armLength,
                armAttachY + Math.cos(leftArmAngle) * armLength
            );
            ctx.stroke();
            
            // Right arm
            ctx.beginPath();
            ctx.moveTo(0, armAttachY);
            ctx.lineTo(
                Math.sin(rightArmAngle) * armLength,
                armAttachY + Math.cos(rightArmAngle) * armLength
            );
            ctx.stroke();
        } else if (this.attackFrame > 0) {
            // Arms swing forward during attack
            ctx.beginPath();
            ctx.moveTo(0, armAttachY);
            ctx.lineTo(-armLength * 0.7, armAttachY + armLength * 0.3);
            ctx.moveTo(0, armAttachY);
            ctx.lineTo(armLength * 0.7, armAttachY + armLength * 0.3);
            ctx.stroke();
        } else {
            // Arms hang down naturally at sides (approximately 53 degree angle)
            ctx.beginPath();
            ctx.moveTo(0, armAttachY);
            ctx.lineTo(-armLength * 0.6, armAttachY + armLength * 0.8);
            ctx.moveTo(0, armAttachY);
            ctx.lineTo(armLength * 0.6, armAttachY + armLength * 0.8);
            ctx.stroke();
        }
        
        // Legs (dynamically animated when moving)
        const legAttachY = 0 + bounceY; // Attach at bottom of body
        
        if (this.isMoving) {
            // Legs move dynamically with large swings
            const leftLegAngle = Math.sin(this.legPhase) * 0.6;
            const rightLegAngle = Math.sin(this.legPhase + Math.PI) * 0.6;
            
            // Left leg
            ctx.beginPath();
            ctx.moveTo(0, legAttachY);
            ctx.lineTo(
                Math.sin(leftLegAngle) * legLength * 0.5,
                legAttachY + Math.cos(leftLegAngle) * legLength
            );
            ctx.stroke();
            
            // Right leg
            ctx.beginPath();
            ctx.moveTo(0, legAttachY);
            ctx.lineTo(
                Math.sin(rightLegAngle) * legLength * 0.5,
                legAttachY + Math.cos(rightLegAngle) * legLength
            );
            ctx.stroke();
        } else {
            // Static stance - legs slightly apart
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
        this.hitEnemies = new Set(); // Track which enemies we've hit
    }

    update(deltaTime, playerX, playerY) {
        this.lifetime += deltaTime;
        this.rotation += deltaTime * 20; // Spin fast
        
        const distFromStart = distance(this.x, this.y, this.startX, this.startY);
        
        // Start returning if reached max distance or target
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
        
        // Check if returned to player
        if (this.returning && distance(this.x, this.y, playerX, playerY) < 20) {
            return true; // Signal to remove
        }
        
        // Remove if lifetime exceeded
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
        
        // Draw boomerang shape
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
// Projectile Class (for ranged attacks)
// ============================================================================

class Projectile {
    constructor(x, y, targetX, targetY, damage, speed = 400) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.size = 6; // Visible size (5-8px)
        this.active = true;
        this.maxDistance = 500; // Maximum travel distance
        this.distanceTraveled = 0;
        
        // Calculate direction
        const angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // Visual properties
        this.color = '#ffff00'; // Bright yellow
        this.glowColor = '#ffaa00'; // Orange glow
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        const dx = this.vx * deltaTime;
        const dy = this.vy * deltaTime;
        
        this.x += dx;
        this.y += dy;
        this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
        
        // Deactivate if traveled too far
        if (this.distanceTraveled >= this.maxDistance) {
            this.active = false;
        }
    }
    
    draw(ctx, camera) {
        if (!this.active) return;
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Draw glow effect
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = this.glowColor;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Draw main projectile
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add bright center highlight
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
        this.size = CONFIG.GAME.PLAYER_SIZE;
        this.speed = 150; // pixels per second (used for non-map mode)
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.direction = 0; // angle in radians
        this.color = '#00ffff';
        this.stickFigure = new StickFigure(x, y, this.color, this.size);
        this.isMoving = false;
    }

    takeDamage(damage) {
        if (this.invulnerable) return false;
        
        this.hp -= damage;
        if (this.hp < 0) this.hp = 0;
        
        // Set invulnerability
        this.invulnerable = true;
        this.invulnerableTime = 0.5; // 0.5 seconds
        
        // Trigger damage animation
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
        
        // Heal on level up
        this.hp = Math.min(this.hp + 20, this.maxHp);
        
        return true;
    }

    update(deltaTime, keys) {
        // Handle invulnerability
        if (this.invulnerable) {
            this.invulnerableTime -= deltaTime;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }

        // Movement
        let dx = 0;
        let dy = 0;

        if (keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;

        // Normalize diagonal movement
        this.isMoving = false;
        if (dx !== 0 || dy !== 0) {
            const norm = normalize(dx, dy);
            dx = norm.x;
            dy = norm.y;
            
            // Update direction
            this.direction = Math.atan2(dy, dx);
            this.isMoving = true;
        }

        // Apply movement
        this.x += dx * this.speed * deltaTime;
        this.y += dy * this.speed * deltaTime;

        // Keep player in world bounds
        this.x = Math.max(this.size, Math.min(WORLD_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(WORLD_HEIGHT - this.size, this.y));
        
        // Update stick figure animation
        this.stickFigure.x = this.x;
        this.stickFigure.y = this.y;
        this.stickFigure.update(deltaTime, this.isMoving);
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Draw as stick figure
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
        
        // Set properties based on type
        switch (type) {
            case 'fast':
                this.size = CONFIG.GAME.ENEMY_SIZE_FAST;
                this.speed = 120;
                this.maxHp = 30;
                this.damage = 8;
                this.xpValue = 15;
                this.color = '#ffff00';
                break;
            case 'tank':
                this.size = CONFIG.GAME.ENEMY_SIZE_TANK;
                this.speed = 50;
                this.maxHp = 150;
                this.damage = 20;
                this.xpValue = 40;
                this.color = '#ff00ff';
                break;
            case 'normal':
            default:
                this.size = CONFIG.GAME.ENEMY_SIZE_NORMAL;
                this.speed = 80;
                this.maxHp = 50;
                this.damage = 10;
                this.xpValue = 20;
                this.color = '#ff4444';
                break;
        }
        
        this.hp = this.maxHp;
        this.hitFlashTime = 0; // For white flash effect when damaged
        this.stickFigure = new StickFigure(x, y, this.color, this.size);
    }

    takeDamage(damage) {
        this.hp -= damage;
        this.hitFlashTime = 0.1; // Flash for 0.1 seconds
        this.stickFigure.triggerDamage();
        return this.hp <= 0;
    }

    update(deltaTime, player) {
        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const norm = normalize(dx, dy);
        
        const isMoving = Math.abs(norm.x) > 0.01 || Math.abs(norm.y) > 0.01;
        
        this.x += norm.x * this.speed * deltaTime;
        this.y += norm.y * this.speed * deltaTime;
        
        // Update hit flash timer
        if (this.hitFlashTime > 0) {
            this.hitFlashTime -= deltaTime;
        }
        
        // Update stick figure
        this.stickFigure.x = this.x;
        this.stickFigure.y = this.y;
        this.stickFigure.update(deltaTime, isMoving);
    }

    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Draw as stick figure
        this.stickFigure.draw(ctx, screenX, screenY);
        
        // Draw HP bar above enemy (adjusted for camera)
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
        this.slashAngle = 0; // Current angle for slash attacks
        this.boomerangs = []; // Array of boomerang projectiles
        
        // Configure weapon stats based on type
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
        
        // Update boomerangs if this is a boomerang weapon
        if (this.type === 'boomerang') {
            for (let i = this.boomerangs.length - 1; i >= 0; i--) {
                const boom = this.boomerangs[i];
                const shouldRemove = boom.update(deltaTime, player.x, player.y);
                
                // Check collision with enemies
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
        
        // Trigger player attack animation
        player.stickFigure.triggerAttack();

        if (this.type === 'sword') {
            // Find nearest enemy for slash direction
            let nearest = null;
            let nearestDist = Infinity;
            enemies.forEach(enemy => {
                const dist = distance(player.x, player.y, enemy.x, enemy.y);
                if (dist < nearestDist) {
                    nearest = enemy;
                    nearestDist = dist;
                }
            });
            
            // Determine slash angle
            if (nearest) {
                this.slashAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
            } else if (player.isMoving) {
                this.slashAngle = player.direction;
            } else {
                this.slashAngle += Math.PI / 3; // Rotate if no target
            }
            
            // Create slash effect
            const slash = new SlashEffect(player.x, player.y, this.slashAngle, this.range);
            slashEffects.push(slash);
            
            // Hit detection: fan-shaped area
            const slashArc = Math.PI / 3; // 60 degrees
            enemies.forEach(enemy => {
                const dist = distance(player.x, player.y, enemy.x, enemy.y);
                if (dist <= this.range) {
                    // Check if enemy is within the slash arc
                    const angleToEnemy = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                    let angleDiff = angleToEnemy - this.slashAngle;
                    
                    // Normalize angle difference to [-π, π] using atan2 for safety
                    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
                    
                    if (Math.abs(angleDiff) <= slashArc / 2) {
                        hitEnemies.push(enemy);
                    }
                }
            });
            
        } else if (this.type === 'boomerang') {
            // Find nearest enemy
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
            // Fire fast projectile at nearest enemy
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
                // Create magic bolt projectile
                const projectile = new Projectile(
                    player.x, 
                    player.y, 
                    nearest.x, 
                    nearest.y, 
                    this.damage
                );
                projectile.speed = 600; // Faster than normal projectiles
                projectile.color = '#aa44ff'; // Purple color for magic
                projectiles.push(projectile);
            }
        }

        return hitEnemies;
    }

    drawAttackRange(ctx, player, camera, gameTime) {
        // Don't draw attack range circle anymore
    }
    
    drawWeaponEffect(ctx, player, camera, weaponIndex) {
        // Draw boomerangs if applicable
        if (this.type === 'boomerang') {
            this.boomerangs.forEach(boom => {
                boom.draw(ctx, camera);
            });
        }
        // Slash effects are drawn separately in the game loop
    }
}

// ============================================================================
// Game Class
// ============================================================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Particle effect constants
        this.HIT_PARTICLE_COUNT = 8;
        this.KILL_PARTICLE_COUNT = 15;
        this.PARTICLE_SPEED_MIN = 100;
        this.PARTICLE_SPEED_MAX = 200;
        this.PARTICLE_UPWARD_BIAS = -50;
        this.HIT_PARTICLE_LIFETIME = 0.4;
        this.KILL_PARTICLE_LIFETIME = 0.8;
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Camera for world coordinates with dead zone
        this.camera = { 
            x: 0, 
            y: 0,
            centerX: 0,  // Target center point
            centerY: 0
        };
        
        // Zoom
        this.zoomLevel = INITIAL_ZOOM;
        
        // Map-based game properties
        this.mapMode = false;
        this.currentRoute = null;
        this.roadData = null;
        this.roadNetwork = null; // Road network for movement restriction
        this.buildingSystem = null; // Building system for collision detection
        this.mapRenderer = null;
        this.deathScreen = null;
        this.distanceTraveled = 0;
        this.lastProgressUpdate = 0;
        
        // Map zoom (for map mode)
        this.mapZoom = CONFIG.MAP.DEFAULT_ZOOM;
        
        // Game state
        this.state = 'route_select'; // 'route_select', 'weapon_select', 'playing', 'paused', 'gameover'
        this.selectedWeapon = null;
        this.player = null;
        this.enemies = [];
        this.weapons = [];
        this.particles = [];
        this.projectiles = [];
        this.slashEffects = []; // New array for slash effects
        this.keys = {};
        this.time = 0;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2.0; // seconds
        this.difficultyMultiplier = 1.0;
        
        // Stats
        this.enemiesKilled = 0;
        
        // FPS tracking
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTimer = 0;
        
        // Input handling
        this.setupInputHandlers();
        
        // UI handling
        this.setupUIHandlers();
        
        // Setup weapon selection
        this.setupWeaponSelection();
        
        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('Game initialized');
    }

    resizeCanvas() {
        // Use fixed canvas display size
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
    }

    setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Prevent default behavior for arrow keys and space
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            
            // Weapon selection with keys 1, 2, 3
            if (this.state === 'weapon_select') {
                if (e.key === '1') this.selectWeapon('sword');
                if (e.key === '2') this.selectWeapon('boomerang');
                if (e.key === '3') this.selectWeapon('magic_bolt');
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Mouse wheel for zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            if (this.mapMode) {
                // Map mode: zoom map tiles
                const zoomDelta = e.deltaY > 0 ? -0.5 : 0.5;
                this.mapZoom = Math.max(CONFIG.MAP.MIN_ZOOM, Math.min(CONFIG.MAP.MAX_ZOOM, this.mapZoom + zoomDelta));
                console.log('[MAP ZOOM]', this.mapZoom);
            } else {
                // Normal mode: zoom game view
                const zoomDelta = e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;
                this.zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.zoomLevel + zoomDelta));
            }
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
        
        // Get selected route
        this.currentRoute = routeManager.getCurrentRoute();
        if (this.currentRoute) {
            this.mapMode = true;
            // Load road data
            this.roadData = roadSystem.getRoadData(this.currentRoute.id);
            // Initialize road network for movement restriction
            if (this.roadData) {
                const hasBuildingData = this.roadData.elements && this.roadData.elements.length > 0;
                this.roadNetwork = new RoadNetwork(this.roadData, hasBuildingData);
                console.log('[ROAD NETWORK] Initialized with', this.roadNetwork.roadSegments.length, 'segments, buildings:', hasBuildingData);
                
                // Initialize building system for collision detection (only if building data exists)
                if (hasBuildingData) {
                    this.buildingSystem = new BuildingSystem(this.roadData);
                } else {
                    this.buildingSystem = null;
                    console.log('[BUILDING SYSTEM] No building data available - using lenient road tolerance');
                }
            }
            // Initialize map renderer
            this.mapRenderer = new MapRenderer(this.canvas);
            this.deathScreen = new DeathScreen(this);
        }
        
        this.startGame();
    }

    setupUIHandlers() {
        // Start button (may not exist if weapon selection is first)
        const startButton = document.getElementById('start-button');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.startGame();
            });
        }

        // Restart button
        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                // Show weapon selection again
                this.state = 'weapon_select';
                document.getElementById('weapon-selection-screen').classList.remove('hidden');
                document.getElementById('gameover-screen').classList.add('hidden');
            });
        }
    }

    startGame() {
        // Hide menus
        document.getElementById('start-screen')?.classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('levelup-screen').classList.add('hidden');
        
        // Reset game state
        this.state = 'playing';
        
        // Initialize player position based on mode
        let startX, startY;
        if (this.mapMode && this.currentRoute) {
            // Map mode: use route start coordinates
            // Convert lat/lon to world coordinates (simplified)
            startX = WORLD_WIDTH / 2;
            startY = WORLD_HEIGHT / 2;
            // Store lat/lon on player
            this.playerLat = this.currentRoute.start.lat;
            this.playerLon = this.currentRoute.start.lon;
            
            // Snap to nearest road if road network is available
            if (this.roadNetwork) {
                const nearest = this.roadNetwork.findNearestRoad(
                    this.playerLat, 
                    this.playerLon, 
                    0.001 // ~111m tolerance for start position
                );
                if (nearest) {
                    this.playerLat = nearest.point.lat;
                    this.playerLon = nearest.point.lon;
                    console.log('Player snapped to nearest road at start');
                }
            }
            
            // Show route progress UI
            document.getElementById('route-progress')?.classList.remove('hidden');
        } else {
            // Normal mode: center of world
            startX = WORLD_WIDTH / 2;
            startY = WORLD_HEIGHT / 2;
        }
        
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
        this.distanceTraveled = 0;
        this.lastProgressUpdate = 0;
        
        // Reset zoom
        this.zoomLevel = INITIAL_ZOOM;
        
        console.log('Game started with weapon:', this.selectedWeapon, 'Map mode:', this.mapMode);
    }

    spawnEnemy() {
        // In map mode with road network, spawn enemies on roads near player
        if (this.mapMode && this.roadNetwork && this.playerLat !== undefined) {
            // Try to spawn enemy at a random angle from player, on a road
            const angle = Math.random() * Math.PI * 2;
            const distance = 0.002; // ~200m in degrees
            
            let spawnLat = this.playerLat + Math.sin(angle) * distance;
            let spawnLon = this.playerLon + Math.cos(angle) * distance;
            
            // Find nearest road to spawn point
            const tolerance = this.roadNetwork.getRoadToleranceDegrees(spawnLat);
            const nearest = this.roadNetwork.findNearestRoad(spawnLat, spawnLon, 0.001);
            
            if (nearest) {
                spawnLat = nearest.point.lat;
                spawnLon = nearest.point.lon;
                
                // Check if spawn point is inside building
                if (this.buildingSystem && this.buildingSystem.isInsideBuilding(spawnLat, spawnLon)) {
                    // Try to find alternative spawn point
                    for (let attempt = 0; attempt < 5; attempt++) {
                        const altAngle = Math.random() * Math.PI * 2;
                        const altLat = this.playerLat + Math.sin(altAngle) * distance;
                        const altLon = this.playerLon + Math.cos(altAngle) * distance;
                        const altNearest = this.roadNetwork.findNearestRoad(altLat, altLon, 0.001);
                        
                        if (altNearest && (!this.buildingSystem || !this.buildingSystem.isInsideBuilding(altNearest.point.lat, altNearest.point.lon))) {
                            spawnLat = altNearest.point.lat;
                            spawnLon = altNearest.point.lon;
                            break;
                        }
                    }
                }
            } else {
                // If no road found at spawn point, try player's position
                const playerNearest = this.roadNetwork.findNearestRoad(
                    this.playerLat, 
                    this.playerLon, 
                    0.01
                );
                if (playerNearest) {
                    spawnLat = playerNearest.point.lat;
                    spawnLon = playerNearest.point.lon;
                } else {
                    // Last resort: use player position
                    spawnLat = this.playerLat;
                    spawnLon = this.playerLon;
                }
            }
            
            // Convert to world coordinates (dummy position, we track via lat/lon)
            const x = WORLD_WIDTH / 2 + random(-100, 100);
            const y = WORLD_HEIGHT / 2 + random(-100, 100);
            
            // Create enemy and store its lat/lon
            const enemy = new Enemy(x, y, this.getRandomEnemyType());
            enemy.lat = spawnLat;
            enemy.lon = spawnLon;
            enemy.isMapEnemy = true; // Mark as map-based enemy
            
            this.enemies.push(enemy);
        } else {
            // Normal mode: spawn outside visible camera area
            const side = randomInt(0, 3); // 0: top, 1: right, 2: bottom, 3: left
            let x, y;
            
            // Calculate visible area based on zoom level
            const visibleWidth = this.canvas.width / this.zoomLevel;
            const visibleHeight = this.canvas.height / this.zoomLevel;
            
            // Dynamic margin based on zoom level to ensure enemies spawn off-screen
            const margin = 200; // Extra margin for safety
            
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
            
            // Clamp to world bounds
            x = Math.max(0, Math.min(WORLD_WIDTH, x));
            y = Math.max(0, Math.min(WORLD_HEIGHT, y));
            
            this.enemies.push(new Enemy(x, y, this.getRandomEnemyType()));
        }
    }
    
    getRandomEnemyType() {
        // Random enemy type with weighted probabilities
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
        
        // Clear previous options and event listeners
        powerupOptions.innerHTML = '';
        
        // Define available power-ups
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
                        // If max weapons, upgrade damage instead
                        this.weapons.forEach(weapon => {
                            weapon.damage *= 1.3;
                        });
                    }
                }
            }
        ];
        
        // Fisher-Yates shuffle for uniform randomization
        const shuffled = [...allPowerups];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const selected = shuffled.slice(0, 3);
        
        // Create power-up option elements
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
        
        // Hide route progress
        document.getElementById('route-progress')?.classList.add('hidden');
        
        // If in map mode, show enhanced death screen
        if (this.mapMode && this.deathScreen && this.currentRoute) {
            const stats = {
                survivalTime: this.time,
                enemiesKilled: this.enemiesKilled,
                level: this.player.level,
                distanceTraveled: this.distanceTraveled,
                totalDistance: this.currentRoute.distance,
                progress: this.distanceTraveled / this.currentRoute.distance
            };
            
            this.deathScreen.show(this.playerLat, this.playerLon, stats);
        } else {
            // Show standard game over screen
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
        }
        
        console.log(`Game Over - Time: ${this.time.toFixed(1)}s, Level: ${this.player.level}, Kills: ${this.enemiesKilled}`);
    }
    
    retry() {
        // Hide death screen
        if (this.deathScreen) {
            this.deathScreen.hide();
        }
        // Restart with same route and weapon
        this.startGame();
    }
    
    backToRouteSelection() {
        // Hide death screen
        if (this.deathScreen) {
            this.deathScreen.hide();
        }
        // Hide other screens
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('route-progress')?.classList.add('hidden');
        
        // Reset state
        this.state = 'route_select';
        this.mapMode = false;
        this.currentRoute = null;
        this.roadData = null;
        
        // Show route selection
        document.getElementById('route-selection-screen').classList.remove('hidden');
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        // Update time
        this.time += deltaTime;
        
        // Update difficulty
        this.difficultyMultiplier = 1 + (this.time / 60) * 0.5;
        this.enemySpawnInterval = Math.max(0.5, 2.0 - (this.time / 120));
        
        // Store old player position for lat/lon calculation
        const oldX = this.player.x;
        const oldY = this.player.y;
        
        // Update player
        this.player.update(deltaTime, this.keys);
        
        // Update lat/lon if in map mode
        if (this.mapMode && this.playerLat !== undefined) {
            // Calculate movement delta in world coordinates
            const deltaX = this.player.x - oldX;
            const deltaY = this.player.y - oldY;
            
            // Convert to lat/lon delta using realistic speed
            // Use configured speed in meters per second
            const speedMS = CONFIG.GAME.PLAYER_SPEED_MS;
            const metersPerDegree = 111320 * Math.cos(this.playerLat * Math.PI / 180);
            
            // Calculate actual delta in degrees
            const pixelMagnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            if (pixelMagnitude > 0) {
                // Normalize and apply realistic speed
                const dirX = deltaX / pixelMagnitude;
                const dirY = deltaY / pixelMagnitude;
                
                // Calculate meters moved this frame
                const metersThisFrame = speedMS * deltaTime;
                
                // Convert to degrees
                const deltaLat = -(dirY * metersThisFrame) / 111320;
                const deltaLon = (dirX * metersThisFrame) / metersPerDegree;
                
                const newLat = this.playerLat + deltaLat;
                const newLon = this.playerLon + deltaLon;
                
                // Check building collision first
                let canMove = true;
                if (this.buildingSystem && this.buildingSystem.isInsideBuilding(newLat, newLon)) {
                    canMove = false;
                    if (CONFIG.GAME.DEBUG_MODE) {
                        console.log('[PLAYER] Cannot move: inside building');
                    }
                }
                
                // Apply road restriction if road network is available and not blocked by building
                if (canMove && this.roadNetwork) {
                    const tolerance = this.roadNetwork.getRoadToleranceDegrees(newLat);
                    const nearest = this.roadNetwork.findNearestRoad(
                        newLat, 
                        newLon, 
                        tolerance
                    );
                    
                    if (nearest) {
                        // Double-check building at snapped position
                        if (!this.buildingSystem || !this.buildingSystem.isInsideBuilding(nearest.point.lat, nearest.point.lon)) {
                            // Snap to nearest road
                            this.playerLat = nearest.point.lat;
                            this.playerLon = nearest.point.lon;
                        } else {
                            // Road point is inside building, don't move
                            canMove = false;
                        }
                    } else {
                        // Not on a road, don't allow movement
                        canMove = false;
                        if (CONFIG.GAME.DEBUG_MODE) {
                            console.log('[PLAYER] Cannot move: not on road');
                        }
                    }
                }
                
                if (!canMove) {
                    // Reset player position to maintain position
                    this.player.x = oldX;
                    this.player.y = oldY;
                } else if (!this.roadNetwork) {
                    // No road network, allow free movement
                    this.playerLat = newLat;
                    this.playerLon = newLon;
                }
            }
        }
        
        // Update camera with dead zone
        const targetCameraX = this.player.x - this.canvas.width / (2 * this.zoomLevel);
        const targetCameraY = this.player.y - this.canvas.height / (2 * this.zoomLevel);
        
        // Calculate center point
        this.camera.centerX = this.camera.x + this.canvas.width / (2 * this.zoomLevel);
        this.camera.centerY = this.camera.y + this.canvas.height / (2 * this.zoomLevel);
        
        // Apply dead zone
        const deltaX = this.player.x - this.camera.centerX;
        const deltaY = this.player.y - this.camera.centerY;
        
        if (Math.abs(deltaX) > CAMERA_DEADZONE_X) {
            this.camera.x += deltaX - Math.sign(deltaX) * CAMERA_DEADZONE_X;
        }
        if (Math.abs(deltaY) > CAMERA_DEADZONE_Y) {
            this.camera.y += deltaY - Math.sign(deltaY) * CAMERA_DEADZONE_Y;
        }
        
        // Clamp camera to world bounds
        this.camera.x = Math.max(0, Math.min(WORLD_WIDTH - this.canvas.width / this.zoomLevel, this.camera.x));
        this.camera.y = Math.max(0, Math.min(WORLD_HEIGHT - this.canvas.height / this.zoomLevel, this.camera.y));
        
        // Check if player is dead
        if (this.player.isDead()) {
            this.gameOver();
            return;
        }
        
        // Spawn enemies
        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            this.enemySpawnTimer = 0;
            const spawnCount = Math.floor(1 + this.difficultyMultiplier / 2);
            for (let i = 0; i < spawnCount; i++) {
                this.spawnEnemy();
            }
        }
        
        // Update enemies
        this.enemies.forEach(enemy => {
            // In map mode, update enemy lat/lon and snap to roads
            if (this.mapMode && enemy.isMapEnemy && this.roadNetwork) {
                // Move towards player in lat/lon space
                const dirLat = this.playerLat - enemy.lat;
                const dirLon = this.playerLon - enemy.lon;
                const dist = Math.sqrt(dirLat * dirLat + dirLon * dirLon);
                
                if (dist > 0) {
                    // Get enemy speed based on type
                    let speedMS;
                    switch (enemy.type) {
                        case 'fast':
                            speedMS = CONFIG.GAME.ENEMY_SPEED_FAST_MS;
                            break;
                        case 'tank':
                            speedMS = CONFIG.GAME.ENEMY_SPEED_TANK_MS;
                            break;
                        default:
                            speedMS = CONFIG.GAME.ENEMY_SPEED_NORMAL_MS;
                    }
                    
                    const metersPerDegree = 111320 * Math.cos(enemy.lat * Math.PI / 180);
                    const metersThisFrame = speedMS * deltaTime;
                    
                    const deltaLat = (dirLat / dist) * (metersThisFrame / 111320);
                    const deltaLon = (dirLon / dist) * (metersThisFrame / metersPerDegree);
                    
                    const newLat = enemy.lat + deltaLat;
                    const newLon = enemy.lon + deltaLon;
                    
                    // Check building collision first
                    let canMove = true;
                    if (this.buildingSystem && this.buildingSystem.isInsideBuilding(newLat, newLon)) {
                        canMove = false;
                    }
                    
                    // Snap to nearest road if not blocked
                    if (canMove) {
                        const tolerance = this.roadNetwork.getRoadToleranceDegrees(newLat);
                        const nearest = this.roadNetwork.findNearestRoad(
                            newLat, 
                            newLon, 
                            tolerance
                        );
                        
                        if (nearest) {
                            // Double-check building at snapped position
                            if (!this.buildingSystem || !this.buildingSystem.isInsideBuilding(nearest.point.lat, nearest.point.lon)) {
                                enemy.lat = nearest.point.lat;
                                enemy.lon = nearest.point.lon;
                            }
                        }
                    }
                }
                
                // Update visual position (keep centered on screen)
                enemy.x = WORLD_WIDTH / 2;
                enemy.y = WORLD_HEIGHT / 2;
            }
            
            enemy.update(deltaTime, this.player);
            
            // Check collision with player
            if (enemy.collidesWith(this.player)) {
                if (this.player.takeDamage(enemy.damage)) {
                    // Create damage particles
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
        
        // Update weapons (pass slashEffects)
        this.weapons.forEach(weapon => {
            weapon.update(deltaTime, this.player, this.enemies, this.projectiles, this.slashEffects);
            
            // Auto-attack (pass projectiles and slashEffects)
            const hitEnemies = weapon.attack(this.player, this.enemies, this.particles, this.projectiles, this.slashEffects);
            
            hitEnemies.forEach(enemy => {
                const killed = enemy.takeDamage(weapon.damage);
                
                // Create hit particles (stars/sparks) when enemy is damaged
                const particleCount = killed ? this.KILL_PARTICLE_COUNT : this.HIT_PARTICLE_COUNT;
                const particleLifetime = killed ? this.KILL_PARTICLE_LIFETIME : this.HIT_PARTICLE_LIFETIME;
                const particleColor = killed ? enemy.color : '#ffff00'; // Yellow sparks for hits, enemy color for death
                
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
                    // Enemy killed
                    this.enemiesKilled++;
                    
                    // Gain XP
                    const leveledUp = this.player.gainXp(enemy.xpValue);
                    
                    // Show level up screen
                    if (leveledUp) {
                        this.showLevelUpScreen();
                    }
                }
            });
        });
        
        // Update projectiles
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime);
            
            // Check collisions with enemies
            this.enemies.forEach(enemy => {
                if (projectile.checkCollision(enemy)) {
                    const killed = enemy.takeDamage(projectile.damage);
                    projectile.active = false;
                    
                    if (DEBUG_HIT_DETECTION) {
                        console.log('Projectile hit:', enemy.type);
                    }
                    
                    // Create hit particles
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
        
        // Update slash effects
        this.slashEffects.forEach(slash => {
            slash.update(deltaTime);
        });
        
        // Remove inactive projectiles and slash effects
        this.projectiles = this.projectiles.filter(p => p.active);
        this.slashEffects = this.slashEffects.filter(s => !s.isDead());
        
        // Remove dead enemies
        this.enemies = this.enemies.filter(enemy => enemy.hp > 0);
        
        // Update particles
        this.particles.forEach(particle => particle.update(deltaTime));
        this.particles = this.particles.filter(particle => !particle.isDead());
        
        // Update UI
        this.updateUI();
    }

    updateUI() {
        // HP Bar
        const hpPercent = (this.player.hp / this.player.maxHp) * 100;
        document.getElementById('hp-bar').style.width = hpPercent + '%';
        document.getElementById('hp-text').textContent = `${Math.ceil(this.player.hp)}/${this.player.maxHp}`;
        
        // XP Bar
        const xpPercent = (this.player.xp / this.player.xpToNextLevel) * 100;
        document.getElementById('xp-bar').style.width = xpPercent + '%';
        document.getElementById('xp-text').textContent = `${this.player.xp}/${this.player.xpToNextLevel}`;
        
        // Level
        document.getElementById('level').textContent = this.player.level;
        
        // Time
        const minutes = Math.floor(this.time / 60);
        const seconds = Math.floor(this.time % 60);
        document.getElementById('time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Route progress (if in map mode)
        if (this.mapMode && this.currentRoute) {
            // Update progress periodically
            if (this.time - this.lastProgressUpdate > CONFIG.GAME.PROGRESS_UPDATE_INTERVAL / 1000) {
                this.lastProgressUpdate = this.time;
                
                // Calculate distance traveled (simplified - just distance from start)
                if (this.playerLat !== undefined) {
                    this.distanceTraveled = this.calculateDistance(
                        this.currentRoute.start.lat,
                        this.currentRoute.start.lon,
                        this.playerLat,
                        this.playerLon
                    );
                    
                    const remainingDistance = Math.max(0, this.currentRoute.distance - this.distanceTraveled);
                    const progressPercent = Math.min(100, (this.distanceTraveled / this.currentRoute.distance) * 100);
                    
                    // Update UI elements
                    const distanceEl = document.getElementById('distance-remaining');
                    const progressFillEl = document.getElementById('route-progress-fill');
                    
                    if (distanceEl) {
                        distanceEl.textContent = Math.round(remainingDistance);
                    }
                    if (progressFillEl) {
                        progressFillEl.style.width = progressPercent + '%';
                    }
                    
                    // Check for goal reached
                    const distanceToGoal = this.calculateDistance(
                        this.currentRoute.goal.lat,
                        this.currentRoute.goal.lon,
                        this.playerLat,
                        this.playerLon
                    );
                    
                    if (distanceToGoal < 50) { // Within 50 meters of goal
                        this.goalReached();
                    }
                }
            }
        }
    }
    
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }
    
    goalReached() {
        // Player reached the goal!
        this.state = 'gameover';
        alert('🎉 ゴール到達！おめでとうございます！');
        // Could add a victory screen here
        this.gameOver();
    }
    
    drawNavigation() {
        // Draw arrow pointing to goal
        const dirLat = this.currentRoute.goal.lat - this.playerLat;
        const dirLon = this.currentRoute.goal.lon - this.playerLon;
        const angle = Math.atan2(dirLon, dirLat);
        
        // Draw arrow at top center of screen
        const centerX = this.canvas.width / 2;
        const centerY = 60;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(angle);
        
        // Draw arrow
        this.ctx.fillStyle = '#00ff00';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -25);
        this.ctx.lineTo(-15, 10);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(15, 10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Draw distance text below arrow
        const distance = this.calculateDistance(
            this.playerLat,
            this.playerLon,
            this.currentRoute.goal.lat,
            this.currentRoute.goal.lon
        );
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        
        const distanceText = `ゴールまで ${distance.toFixed(0)}m`;
        this.ctx.strokeText(distanceText, centerX, centerY + 35);
        this.ctx.fillText(distanceText, centerX, centerY + 35);
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0f0f1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.state === 'playing' || this.state === 'paused') {
            // Apply zoom transformation
            this.ctx.save();
            this.ctx.scale(this.zoomLevel, this.zoomLevel);
            
            // Adjust camera for zoom
            const effectiveCamera = {
                x: this.camera.x,
                y: this.camera.y
            };
            
            // Draw background (map or grid)
            if (this.mapMode && this.mapRenderer && this.playerLat !== undefined) {
                // Render OpenStreetMap tiles
                this.ctx.save();
                this.ctx.scale(1 / this.zoomLevel, 1 / this.zoomLevel);
                this.mapRenderer.render(
                    this.playerLat,
                    this.playerLon,
                    this.mapZoom,
                    this.canvas.width,
                    this.canvas.height
                );
                
                // Draw route path if available
                if (this.roadData) {
                    this.mapRenderer.drawRoutePath(
                        this.roadData,
                        this.playerLat,
                        this.playerLon,
                        this.mapZoom,
                        this.canvas.width,
                        this.canvas.height,
                        '#00ff00',
                        3
                    );
                    
                    // Draw buildings (if building system is available)
                    if (this.buildingSystem) {
                        this.mapRenderer.drawBuildings(
                            this.buildingSystem,
                            this.playerLat,
                            this.playerLon,
                            this.mapZoom,
                            this.canvas.width,
                            this.canvas.height
                        );
                    }
                    
                    // Draw roads (if road network is available)
                    if (this.roadNetwork) {
                        this.mapRenderer.drawRoads(
                            this.roadNetwork,
                            this.playerLat,
                            this.playerLon,
                            this.mapZoom,
                            this.canvas.width,
                            this.canvas.height
                        );
                    }
                    
                    // Draw debug info for player road checking
                    if (CONFIG.GAME.DEBUG_MODE && this.roadNetwork) {
                        this.mapRenderer.drawPlayerRoadCheck(
                            this.playerLat,
                            this.playerLon,
                            this.roadNetwork,
                            this.playerLat,
                            this.playerLon,
                            this.mapZoom,
                            this.canvas.width,
                            this.canvas.height
                        );
                    }
                    
                    // Draw goal marker
                    if (this.currentRoute) {
                        this.mapRenderer.drawMarker(
                            this.currentRoute.goal.lat,
                            this.currentRoute.goal.lon,
                            this.playerLat,
                            this.playerLon,
                            this.mapZoom,
                            this.canvas.width,
                            this.canvas.height,
                            '#FFD700',
                            15,
                            'GOAL'
                        );
                    }
                }
                
                this.ctx.restore();
            } else {
                // Draw world boundaries (grid pattern) - original mode
                this.ctx.strokeStyle = 'rgba(100, 100, 120, 0.3)';
                this.ctx.lineWidth = 1 / this.zoomLevel;
                
                // Draw vertical lines
                const gridSize = 200;
                for (let x = 0; x < WORLD_WIDTH; x += gridSize) {
                    const screenX = x - effectiveCamera.x;
                    if (screenX >= 0 && screenX <= this.canvas.width / this.zoomLevel) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(screenX, 0);
                        this.ctx.lineTo(screenX, this.canvas.height / this.zoomLevel);
                        this.ctx.stroke();
                    }
                }
                
                // Draw horizontal lines
                for (let y = 0; y < WORLD_HEIGHT; y += gridSize) {
                    const screenY = y - effectiveCamera.y;
                    if (screenY >= 0 && screenY <= this.canvas.height / this.zoomLevel) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, screenY);
                        this.ctx.lineTo(this.canvas.width / this.zoomLevel, screenY);
                        this.ctx.stroke();
                    }
                }
                
                // Draw world border
                this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
                this.ctx.lineWidth = 3 / this.zoomLevel;
                this.ctx.strokeRect(-effectiveCamera.x, -effectiveCamera.y, WORLD_WIDTH, WORLD_HEIGHT);
            }
            
            // Draw slash effects
            this.slashEffects.forEach(slash => {
                slash.draw(this.ctx, effectiveCamera);
            });
            
            // Draw particles
            this.particles.forEach(particle => {
                const screenX = particle.x - effectiveCamera.x;
                const screenY = particle.y - effectiveCamera.y;
                
                // Only draw if on screen
                if (screenX >= -50 && screenX <= this.canvas.width / this.zoomLevel + 50 &&
                    screenY >= -50 && screenY <= this.canvas.height / this.zoomLevel + 50) {
                    
                    // Save original position, draw with camera offset, then restore
                    const origX = particle.x;
                    const origY = particle.y;
                    particle.x = screenX;
                    particle.y = screenY;
                    particle.draw(this.ctx);
                    particle.x = origX;
                    particle.y = origY;
                }
            });
            
            // Draw projectiles
            this.projectiles.forEach(projectile => {
                projectile.draw(this.ctx, effectiveCamera);
            });
            
            // Draw enemies
            this.enemies.forEach(enemy => {
                const screenX = enemy.x - effectiveCamera.x;
                const screenY = enemy.y - effectiveCamera.y;
                
                // Only draw if on screen (with margin)
                if (screenX >= -100 && screenX <= this.canvas.width / this.zoomLevel + 100 &&
                    screenY >= -100 && screenY <= this.canvas.height / this.zoomLevel + 100) {
                    enemy.draw(this.ctx, effectiveCamera);
                }
            });
            
            // Draw player
            this.player.draw(this.ctx, effectiveCamera);
            
            // Draw weapon effects on top of player
            this.weapons.forEach((weapon, index) => {
                weapon.drawWeaponEffect(this.ctx, this.player, effectiveCamera, index);
            });
            
            // Restore transformation
            this.ctx.restore();
            
            // Draw navigation arrow if in map mode
            if (this.mapMode && this.currentRoute && this.playerLat !== undefined) {
                this.drawNavigation();
            }
            
            // Draw UI overlay info (zoom level) - outside of zoom transform
            if (false) { // Set to true to enable debug info
                this.ctx.fillStyle = '#00ff00';
                this.ctx.font = '12px monospace';
                this.ctx.fillText(`FPS: ${this.fps}`, 10, this.canvas.height - 90);
                this.ctx.fillText(`Enemies: ${this.enemies.length}`, 10, this.canvas.height - 75);
                this.ctx.fillText(`Particles: ${this.particles.length}`, 10, this.canvas.height - 60);
                this.ctx.fillText(`Projectiles: ${this.projectiles.length}`, 10, this.canvas.height - 45);
                this.ctx.fillText(`Slashes: ${this.slashEffects.length}`, 10, this.canvas.height - 30);
                this.ctx.fillText(`Zoom: ${this.zoomLevel.toFixed(2)}x`, 10, this.canvas.height - 15);
            }
        }
    }

    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Cap delta time to prevent large jumps
        const cappedDeltaTime = Math.min(deltaTime, 0.1);
        
        // Update FPS
        this.frameCount++;
        this.fpsTimer += deltaTime;
        if (this.fpsTimer >= 1.0) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer = 0;
            // console.log(`FPS: ${this.fps}, Enemies: ${this.enemies.length}`);
        }
        
        // Update and draw
        this.update(cappedDeltaTime);
        this.draw();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ============================================================================
// Initialize Game with Route Selection
// ============================================================================

// Global instances
let routeManager;
let roadSystem;
let mapRenderer;
let deathScreen;

// Custom route modal functions (defined globally)
async function geocodeCustomAddress(type) {
    const address = document.getElementById(`${type}-address`).value;
    if (!address) return;
    
    const location = await routeManager.geocodeAddress(address);
    if (location) {
        const routeInfo = routeManager.setCustomPoint(type, location);
        if (routeInfo) {
            updateCustomRouteInfo(routeInfo);
        }
        alert(`${type === 'start' ? 'スタート' : 'ゴール'}地点を設定しました: ${location.display_name}`);
    } else {
        alert('住所が見つかりませんでした');
    }
}

function updateCustomRouteInfo(routeInfo) {
    document.getElementById('custom-distance').textContent = (routeInfo.distance / 1000).toFixed(1);
    document.getElementById('custom-time').textContent = routeInfo.estimatedTime;
    const starsHTML = '★'.repeat(routeInfo.difficulty.stars) + 
                     '☆'.repeat(5 - routeInfo.difficulty.stars);
    document.getElementById('custom-difficulty').textContent = 
        starsHTML + ' ' + routeInfo.difficulty.label;
    
    document.getElementById('custom-route-info').classList.remove('hidden');
    document.getElementById('start-custom-btn').disabled = false;
}

function startCustomRoute() {
    const customRoute = routeManager.createCustomRoute();
    if (customRoute) {
        routeManager.selectRoute(customRoute);
        closeCustomModal();
        showWeaponSelection();
    }
}

function closeCustomModal() {
    document.getElementById('custom-route-modal').classList.add('hidden');
    document.getElementById('route-selection-screen').classList.remove('hidden');
}

function showWeaponSelection() {
    document.getElementById('route-selection-screen').classList.add('hidden');
    document.getElementById('weapon-selection-screen').classList.remove('hidden');
}

// Wait for DOM to load
window.addEventListener('DOMContentLoaded', () => {
    // Initialize systems
    routeManager = new RouteManager();
    roadSystem = new RoadSystem();
    
    // Render route selection
    routeManager.renderRouteSelection('route-list', (route, isCustom) => {
        if (isCustom) {
            // Show custom route modal
            document.getElementById('route-selection-screen').classList.add('hidden');
            document.getElementById('custom-route-modal').classList.remove('hidden');
            routeManager.resetCustomRoute();
        } else {
            // Select preset route and proceed to weapon selection
            routeManager.selectRoute(route);
            showWeaponSelection();
        }
    });
    
    // Initialize game
    const game = new Game();
    
    // Make instances accessible globally
    window.gameInstance = game;
    window.routeManager = routeManager;
    window.roadSystem = roadSystem;
    
    console.log('Route selection initialized');
});
