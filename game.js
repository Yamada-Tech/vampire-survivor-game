// ============================================================================
// Vampire Survivor Game - game.js
// HTML5 Canvas と JavaScript で作られた2Dアクションサバイバルゲーム
// ============================================================================

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
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.age += deltaTime;
        this.vy += 200 * deltaTime; // gravity
    }

    draw(ctx) {
        const alpha = 1 - (this.age / this.lifetime);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.age >= this.lifetime;
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

    update(deltaTime, keys, canvas) {
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

        // Keep player in bounds
        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));
    }

    draw(ctx) {
        // Draw player as a triangle
        ctx.save();
        ctx.translate(this.x, this.y);
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
    }

    takeDamage(damage) {
        this.hp -= damage;
        return this.hp <= 0;
    }

    update(deltaTime, player) {
        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const norm = normalize(dx, dy);
        
        this.x += norm.x * this.speed * deltaTime;
        this.y += norm.y * this.speed * deltaTime;
    }

    draw(ctx) {
        // Draw enemy as a square
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x - this.size / 2,
            this.y - this.size / 2,
            this.size,
            this.size
        );
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.x - this.size / 2,
            this.y - this.size / 2,
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
        this.cooldown = 1.0; // seconds
        this.currentCooldown = 0;
        
        if (type === 'ranged') {
            this.damage = 15;
            this.range = 300;
            this.cooldown = 0.5;
        }
    }

    update(deltaTime) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= deltaTime;
        }
    }

    canAttack() {
        return this.currentCooldown <= 0;
    }

    attack(player, enemies, particles) {
        if (!this.canAttack()) return [];

        this.currentCooldown = this.cooldown;
        const hitEnemies = [];

        if (this.type === 'melee') {
            // Melee attack - circular area around player
            enemies.forEach(enemy => {
                const dist = distance(player.x, player.y, enemy.x, enemy.y);
                if (dist <= this.range) {
                    hitEnemies.push(enemy);
                }
            });
        } else if (this.type === 'ranged') {
            // Ranged attack - find nearest enemy
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
                hitEnemies.push(nearest);
                
                // Create projectile visual effect
                for (let i = 0; i < 3; i++) {
                    const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
                    particles.push(new Particle(
                        player.x,
                        player.y,
                        '#00ffff',
                        {
                            x: Math.cos(angle) * 300 + random(-50, 50),
                            y: Math.sin(angle) * 300 + random(-50, 50)
                        },
                        0.3
                    ));
                }
            }
        }

        return hitEnemies;
    }

    drawAttackRange(ctx, player) {
        if (this.type === 'melee' && this.currentCooldown <= 0) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(player.x, player.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
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
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game state
        this.state = 'start'; // 'start', 'playing', 'paused', 'gameover'
        this.player = null;
        this.enemies = [];
        this.weapons = [];
        this.particles = [];
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
        const container = document.getElementById('game-container');
        const maxWidth = 1200;
        const maxHeight = 800;
        const aspectRatio = maxWidth / maxHeight;
        
        let width = Math.min(window.innerWidth * 0.95, maxWidth);
        let height = width / aspectRatio;
        
        if (height > window.innerHeight * 0.9) {
            height = window.innerHeight * 0.9;
            width = height * aspectRatio;
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
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
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        this.enemies = [];
        this.weapons = [new Weapon('melee')];
        this.particles = [];
        this.time = 0;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 2.0;
        this.difficultyMultiplier = 1.0;
        this.enemiesKilled = 0;
        
        console.log('Game started');
    }

    spawnEnemy() {
        // Random spawn position (outside screen)
        const side = randomInt(0, 3); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;
        
        switch (side) {
            case 0: // top
                x = random(0, this.canvas.width);
                y = -50;
                break;
            case 1: // right
                x = this.canvas.width + 50;
                y = random(0, this.canvas.height);
                break;
            case 2: // bottom
                x = random(0, this.canvas.width);
                y = this.canvas.height + 50;
                break;
            case 3: // left
                x = -50;
                y = random(0, this.canvas.height);
                break;
        }
        
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
        
        // Clear previous options
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
                description: '攻撃のクールダウンが20%減少',
                effect: () => {
                    this.weapons.forEach(weapon => {
                        weapon.cooldown *= 0.8;
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
                    if (this.weapons.length < 5) {
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
        
        // Randomly select 3 power-ups
        const shuffled = allPowerups.sort(() => Math.random() - 0.5);
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
        this.player.update(deltaTime, this.keys, this.canvas);
        
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
            
            // Auto-attack
            const hitEnemies = weapon.attack(this.player, this.enemies, this.particles);
            
            hitEnemies.forEach(enemy => {
                const killed = enemy.takeDamage(weapon.damage);
                
                if (killed) {
                    // Enemy killed
                    this.enemiesKilled++;
                    
                    // Gain XP
                    const leveledUp = this.player.gainXp(enemy.xpValue);
                    
                    // Create death particles
                    for (let i = 0; i < 15; i++) {
                        this.particles.push(new Particle(
                            enemy.x,
                            enemy.y,
                            enemy.color,
                            {
                                x: random(-150, 150),
                                y: random(-150, 150)
                            },
                            0.8
                        ));
                    }
                    
                    // Show level up screen
                    if (leveledUp) {
                        this.showLevelUpScreen();
                    }
                }
            });
        });
        
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
            // Draw attack ranges
            this.weapons.forEach(weapon => {
                weapon.drawAttackRange(this.ctx, this.player);
            });
            
            // Draw particles
            this.particles.forEach(particle => particle.draw(this.ctx));
            
            // Draw enemies
            this.enemies.forEach(enemy => enemy.draw(this.ctx));
            
            // Draw player
            this.player.draw(this.ctx);
            
            // Draw debug info (optional)
            if (false) { // Set to true to enable debug info
                this.ctx.fillStyle = '#00ff00';
                this.ctx.font = '12px monospace';
                this.ctx.fillText(`FPS: ${this.fps}`, 10, this.canvas.height - 60);
                this.ctx.fillText(`Enemies: ${this.enemies.length}`, 10, this.canvas.height - 45);
                this.ctx.fillText(`Particles: ${this.particles.length}`, 10, this.canvas.height - 30);
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
