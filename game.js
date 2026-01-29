// ============================================================================
// Vampire Survivor Game - game.js
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
        this.size = 20;
        this.speed = 150; // pixels per second
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.direction = 0; // angle in radians
        this.color = '#00ffff';
    }

    takeDamage(damage) {
        if (this.invulnerable) return false;
        
        this.hp -= damage;
        if (this.hp < 0) this.hp = 0;
        
        // Set invulnerability
        this.invulnerable = true;
        this.invulnerableTime = 0.5; // 0.5 seconds
        
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
        if (dx !== 0 || dy !== 0) {
            const norm = normalize(dx, dy);
            dx = norm.x;
            dy = norm.y;
            
            // Update direction
            this.direction = Math.atan2(dy, dx);
        }

        // Apply movement
        this.x += dx * this.speed * deltaTime;
        this.y += dy * this.speed * deltaTime;

        // Keep player in world bounds
        this.x = Math.max(this.size, Math.min(WORLD_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(WORLD_HEIGHT - this.size, this.y));
    }

    draw(ctx, camera) {
        // Draw player as a triangle
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.direction);
        
        // Flashing effect when invulnerable
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size / 2, -this.size / 2);
        ctx.lineTo(-this.size / 2, this.size / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
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
        
        // Set properties based on type
        switch (type) {
            case 'fast':
                this.size = 12;
                this.speed = 120;
                this.maxHp = 30;
                this.damage = 8;
                this.xpValue = 15;
                this.color = '#ffff00';
                break;
            case 'tank':
                this.size = 30;
                this.speed = 50;
                this.maxHp = 150;
                this.damage = 20;
                this.xpValue = 40;
                this.color = '#ff00ff';
                break;
            case 'normal':
            default:
                this.size = 15;
                this.speed = 80;
                this.maxHp = 50;
                this.damage = 10;
                this.xpValue = 20;
                this.color = '#ff4444';
                break;
        }
        
        this.hp = this.maxHp;
        this.hitFlashTime = 0; // For white flash effect when damaged
    }

    takeDamage(damage) {
        this.hp -= damage;
        this.hitFlashTime = 0.1; // Flash for 0.1 seconds
        return this.hp <= 0;
    }

    update(deltaTime, player) {
        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const norm = normalize(dx, dy);
        
        this.x += norm.x * this.speed * deltaTime;
        this.y += norm.y * this.speed * deltaTime;
        
        // Update hit flash timer
        if (this.hitFlashTime > 0) {
            this.hitFlashTime -= deltaTime;
        }
    }

    draw(ctx, camera) {
        // Draw enemy as a square with hit flash effect
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        if (this.hitFlashTime > 0) {
            // White flash when hit
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }
        
        ctx.fillRect(
            screenX - this.size / 2,
            screenY - this.size / 2,
            this.size,
            this.size
        );
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            screenX - this.size / 2,
            screenY - this.size / 2,
            this.size,
            this.size
        );
        
        // Draw HP bar
        const barWidth = this.size;
        const barHeight = 4;
        const hpPercent = this.hp / this.maxHp;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.size / 2 - 8, barWidth, barHeight);
        
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.size / 2 - 8, barWidth * hpPercent, barHeight);
    }

    collidesWith(player) {
        return distance(this.x, this.y, player.x, player.y) < (this.size + player.size) / 2;
    }
}

// ============================================================================
// Weapon Class
// ============================================================================

class Weapon {
    constructor(type = 'melee') {
        this.type = type;
        this.damage = 25;
        this.range = 80;
        this.rotation = 0; // Rotation angle for visual effect
        
        // Visual effect constants
        this.NUM_WEAPON_SPRITES = 3;
        this.WEAPON_DISTANCE_RATIO = 0.6;
        this.TRAIL_LENGTH = 5;
        this.TRAIL_STEP = Math.PI / 20;
        this.TRAIL_OPACITY = 0.2;
        this.TRAIL_SIZE = 4;
        
        if (type === 'ranged') {
            this.damage = 15;
            this.range = 400;
            this.cooldown = INITIAL_RANGED_ATTACK_COOLDOWN;
        } else {
            this.cooldown = INITIAL_MELEE_ATTACK_COOLDOWN;
        }
        
        this.currentCooldown = 0;
    }

    update(deltaTime) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= deltaTime;
        }
        
        // Update rotation for visual effect (faster rotation = faster attack speed)
        const rotationSpeed = (2 * Math.PI) / this.cooldown; // Full rotation per cooldown cycle
        this.rotation += rotationSpeed * deltaTime;
    }

    canAttack() {
        return this.currentCooldown <= 0;
    }

    attack(player, enemies, particles, projectiles) {
        if (!this.canAttack()) return [];

        this.currentCooldown = this.cooldown;
        const hitEnemies = [];

        if (this.type === 'melee') {
            // Melee attack - circular area around player with weapon sprite consideration
            enemies.forEach(enemy => {
                const dist = distance(player.x, player.y, enemy.x, enemy.y);
                
                // Check if enemy is within attack range
                if (dist <= this.range) {
                    // More forgiving hit detection - if within range, check if any weapon is reasonably close
                    let hit = false;
                    
                    // Check collision with any rotating weapon sprite
                    for (let i = 0; i < this.NUM_WEAPON_SPRITES; i++) {
                        const angleOffset = (Math.PI * 2 / this.NUM_WEAPON_SPRITES) * i;
                        const currentAngle = this.rotation + angleOffset;
                        const weaponDistance = this.range * this.WEAPON_DISTANCE_RATIO;
                        
                        const weaponX = player.x + Math.cos(currentAngle) * weaponDistance;
                        const weaponY = player.y + Math.sin(currentAngle) * weaponDistance;
                        
                        const weaponToEnemy = distance(weaponX, weaponY, enemy.x, enemy.y);
                        
                        // More generous hit detection - weapon hit radius
                        if (weaponToEnemy <= (enemy.size / 2 + 25)) {
                            hit = true;
                            break;
                        }
                    }
                    
                    // Fallback: if enemy is very close to player center, always hit
                    if (dist <= this.range * 0.7) {
                        hit = true;
                    }
                    
                    if (hit) {
                        hitEnemies.push(enemy);
                        if (DEBUG_HIT_DETECTION) {
                            console.log('Melee hit detected:', enemy.type, 'at distance:', dist.toFixed(2));
                        }
                    }
                }
            });
        } else if (this.type === 'ranged') {
            // Ranged attack - create actual projectile
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
                // Create visible projectile
                const projectile = new Projectile(
                    player.x, 
                    player.y, 
                    nearest.x, 
                    nearest.y, 
                    this.damage
                );
                projectiles.push(projectile);
                
                if (DEBUG_HIT_DETECTION) {
                    console.log('Projectile fired at:', nearest.type);
                }
            }
        }

        return hitEnemies;
    }

    drawAttackRange(ctx, player, camera, gameTime) {
        if (this.type === 'melee') {
            // Show pulsing attack range indicator
            const pulseIntensity = this.currentCooldown > 0 ? 0.1 : 0.3;
            const pulse = Math.sin(gameTime * 5) * 0.1 + pulseIntensity;
            
            const screenX = player.x - camera.x;
            const screenY = player.y - camera.y;
            
            ctx.strokeStyle = `rgba(0, 255, 255, ${pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawWeaponEffect(ctx, player, camera, weaponIndex) {
        if (this.type === 'melee') {
            const screenX = player.x - camera.x;
            const screenY = player.y - camera.y;
            
            ctx.save();
            ctx.translate(screenX, screenY);
            
            // Draw multiple weapons rotating around the player
            for (let i = 0; i < this.NUM_WEAPON_SPRITES; i++) {
                const angleOffset = (Math.PI * 2 / this.NUM_WEAPON_SPRITES) * i + (weaponIndex * Math.PI / 4);
                const currentAngle = this.rotation + angleOffset;
                const weaponDistance = this.range * this.WEAPON_DISTANCE_RATIO;
                
                // Calculate weapon position
                const weaponX = Math.cos(currentAngle) * weaponDistance;
                const weaponY = Math.sin(currentAngle) * weaponDistance;
                
                // Draw weapon trail (motion blur effect)
                for (let t = 1; t <= this.TRAIL_LENGTH; t++) {
                    const trailAngle = currentAngle - (this.TRAIL_STEP * t);
                    const trailX = Math.cos(trailAngle) * weaponDistance;
                    const trailY = Math.sin(trailAngle) * weaponDistance;
                    const trailAlpha = this.TRAIL_OPACITY * (1 - t / this.TRAIL_LENGTH);
                    
                    ctx.globalAlpha = trailAlpha;
                    ctx.fillStyle = '#88ffff';
                    ctx.beginPath();
                    ctx.arc(trailX, trailY, this.TRAIL_SIZE, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Draw main weapon sprite (rotating sword/axe shape)
                ctx.globalAlpha = 1.0;
                ctx.save();
                ctx.translate(weaponX, weaponY);
                ctx.rotate(currentAngle + Math.PI / 2);
                
                // Draw weapon as a bright shape
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                // Sword/blade shape
                ctx.moveTo(0, -10);
                ctx.lineTo(4, 0);
                ctx.lineTo(2, 10);
                ctx.lineTo(-2, 10);
                ctx.lineTo(-4, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
                ctx.restore();
            }
            
            ctx.restore();
        }
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
        
        // Camera for world coordinates
        this.camera = { x: 0, y: 0 };
        
        // Game state
        this.state = 'start'; // 'start', 'playing', 'paused', 'gameover'
        this.player = null;
        this.enemies = [];
        this.weapons = [];
        this.particles = [];
        this.projectiles = [];
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
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    setupUIHandlers() {
        // Start button
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });

        // Restart button
        document.getElementById('restart-button').addEventListener('click', () => {
            this.startGame();
        });
    }

    startGame() {
        // Hide menus
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('levelup-screen').classList.add('hidden');
        
        // Reset game state
        this.state = 'playing';
        // Start player in center of world
        this.player = new Player(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        this.enemies = [];
        this.weapons = [new Weapon('melee')];
        this.particles = [];
        this.projectiles = [];
        this.time = 0;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2.0;
        this.difficultyMultiplier = 1.0;
        this.enemiesKilled = 0;
        
        console.log('Game started');
    }

    spawnEnemy() {
        // Spawn outside the visible camera area
        const side = randomInt(0, 3); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;
        
        const margin = 100; // Spawn margin outside camera view
        
        switch (side) {
            case 0: // top
                x = this.camera.x + random(-margin, this.canvas.width + margin);
                y = this.camera.y - margin;
                break;
            case 1: // right
                x = this.camera.x + this.canvas.width + margin;
                y = this.camera.y + random(-margin, this.canvas.height + margin);
                break;
            case 2: // bottom
                x = this.camera.x + random(-margin, this.canvas.width + margin);
                y = this.camera.y + this.canvas.height + margin;
                break;
            case 3: // left
                x = this.camera.x - margin;
                y = this.camera.y + random(-margin, this.canvas.height + margin);
                break;
        }
        
        // Clamp to world bounds
        x = Math.max(0, Math.min(WORLD_WIDTH, x));
        y = Math.max(0, Math.min(WORLD_HEIGHT, y));
        
        // Random enemy type with weighted probabilities
        const rand = Math.random();
        let type;
        if (rand < 0.7) {
            type = 'normal';
        } else if (rand < 0.9) {
            type = 'fast';
        } else {
            type = 'tank';
        }
        
        this.enemies.push(new Enemy(x, y, type));
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
        
        // Show game over screen
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

    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        // Update time
        this.time += deltaTime;
        
        // Update difficulty
        this.difficultyMultiplier = 1 + (this.time / 60) * 0.5;
        this.enemySpawnInterval = Math.max(0.5, 2.0 - (this.time / 120));
        
        // Update player
        this.player.update(deltaTime, this.keys);
        
        // Update camera to follow player
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;
        
        // Clamp camera to world bounds
        this.camera.x = Math.max(0, Math.min(WORLD_WIDTH - this.canvas.width, this.camera.x));
        this.camera.y = Math.max(0, Math.min(WORLD_HEIGHT - this.canvas.height, this.camera.y));
        
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
        
        // Update weapons
        this.weapons.forEach(weapon => {
            weapon.update(deltaTime);
            
            // Auto-attack (pass projectiles array)
            const hitEnemies = weapon.attack(this.player, this.enemies, this.particles, this.projectiles);
            
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
        
        // Remove inactive projectiles
        this.projectiles = this.projectiles.filter(p => p.active);
        
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
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0f0f1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.state === 'playing' || this.state === 'paused') {
            // Draw world boundaries (grid pattern)
            this.ctx.strokeStyle = 'rgba(100, 100, 120, 0.3)';
            this.ctx.lineWidth = 1;
            
            // Draw vertical lines
            const gridSize = 200;
            for (let x = 0; x < WORLD_WIDTH; x += gridSize) {
                const screenX = x - this.camera.x;
                if (screenX >= 0 && screenX <= this.canvas.width) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(screenX, 0);
                    this.ctx.lineTo(screenX, this.canvas.height);
                    this.ctx.stroke();
                }
            }
            
            // Draw horizontal lines
            for (let y = 0; y < WORLD_HEIGHT; y += gridSize) {
                const screenY = y - this.camera.y;
                if (screenY >= 0 && screenY <= this.canvas.height) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, screenY);
                    this.ctx.lineTo(this.canvas.width, screenY);
                    this.ctx.stroke();
                }
            }
            
            // Draw world border
            this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(-this.camera.x, -this.camera.y, WORLD_WIDTH, WORLD_HEIGHT);
            
            // Draw attack ranges
            this.weapons.forEach(weapon => {
                weapon.drawAttackRange(this.ctx, this.player, this.camera, this.time);
            });
            
            // Draw particles
            this.particles.forEach(particle => {
                const screenX = particle.x - this.camera.x;
                const screenY = particle.y - this.camera.y;
                
                // Only draw if on screen
                if (screenX >= -50 && screenX <= this.canvas.width + 50 &&
                    screenY >= -50 && screenY <= this.canvas.height + 50) {
                    
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
                projectile.draw(this.ctx, this.camera);
            });
            
            // Draw enemies
            this.enemies.forEach(enemy => {
                const screenX = enemy.x - this.camera.x;
                const screenY = enemy.y - this.camera.y;
                
                // Only draw if on screen (with margin)
                if (screenX >= -100 && screenX <= this.canvas.width + 100 &&
                    screenY >= -100 && screenY <= this.canvas.height + 100) {
                    enemy.draw(this.ctx, this.camera);
                }
            });
            
            // Draw player
            this.player.draw(this.ctx, this.camera);
            
            // Draw weapon effects on top of player
            this.weapons.forEach((weapon, index) => {
                weapon.drawWeaponEffect(this.ctx, this.player, this.camera, index);
            });
            
            // Draw debug info (optional)
            if (false) { // Set to true to enable debug info
                this.ctx.fillStyle = '#00ff00';
                this.ctx.font = '12px monospace';
                this.ctx.fillText(`FPS: ${this.fps}`, 10, this.canvas.height - 75);
                this.ctx.fillText(`Enemies: ${this.enemies.length}`, 10, this.canvas.height - 60);
                this.ctx.fillText(`Particles: ${this.particles.length}`, 10, this.canvas.height - 45);
                this.ctx.fillText(`Projectiles: ${this.projectiles.length}`, 10, this.canvas.height - 30);
                this.ctx.fillText(`Difficulty: ${this.difficultyMultiplier.toFixed(2)}`, 10, this.canvas.height - 15);
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
// Initialize Game
// ============================================================================

// Wait for DOM to load
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    // Make game accessible globally for debugging
    window.game = game;
});
