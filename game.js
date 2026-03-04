// ============================================================================
// Pixel Apocalypse - game.js
// HTML5 Canvas と JavaScript で作られた2Dアクションサバイバルゲーム
// ============================================================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1280;
        this.canvas.height = 720;

        // 新しいシステム
        this.assetLoader = new AssetLoader();
        this.objectManager = new GameObjectManager();
        this.mapBuilder = null;

        // カメラ
        this.camera = new Camera(this.canvas);
        this.camera.zoom = 2.0;
        this.camera.minZoom = 1.5;
        this.camera.maxZoom = 4.0;

        // プレイヤー
        this.player = null;

        // 状態
        this.state = 'loading';
        this.keys = {};

        // デバッグ
        this.debug = new window.PixelApocalypse.DebugUtils();

        // 初期化
        this.init();
    }

    /**
     * 初期化
     */
    async init() {
        console.log('[Game] Initializing...');

        try {
            await this.assetLoader.loadAll();

            this.mapBuilder = new MapBuilder(this.objectManager, this.assetLoader);
            this.mapBuilder.buildSimpleVillage(8000, 8000);

            this.player = new Player(8000, 8000, 24);
            this.camera.setTarget(this.player);

            this.state = 'playing';
            console.log('[Game] Ready!');

            this.start();

        } catch (error) {
            console.error('[Game] Initialization failed:', error);
            this.state = 'error';
        }
    }

    /**
     * ゲームループ開始
     */
    start() {
        let lastTime = performance.now();

        const gameLoop = (currentTime) => {
            const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
            lastTime = currentTime;

            this.update(deltaTime);
            this.draw();

            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }

    /**
     * 更新
     */
    update(deltaTime) {
        if (this.state !== 'playing') return;

        this.camera.update();

        if (this.player) {
            this.player.update(deltaTime, this.keys, this.objectManager);
        }
    }

    /**
     * 描画
     */
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'loading') {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px monospace';
            this.ctx.fillText('Loading...', this.canvas.width / 2 - 60, this.canvas.height / 2);
            return;
        }

        if (this.state === 'error') {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#f00';
            this.ctx.font = '24px monospace';
            this.ctx.fillText('Error loading assets. Check console.', 50, this.canvas.height / 2);
            return;
        }

        this.ctx.save();
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        const bounds = this.camera.getViewBounds();
        const visibleObjects = this.objectManager.getObjectsInBounds(
            bounds.left, bounds.top, bounds.right, bounds.bottom
        );

        visibleObjects.forEach(obj => obj.draw(this.ctx));

        if (this.player) {
            this.player.draw(this.ctx);
        }

        this.ctx.restore();

        if (this.debug.enabled) {
            this.debug.draw(this.ctx, this);
        }
    }
}

// キーボード入力
window.addEventListener('keydown', (e) => {
    if (window.game) {
        window.game.keys[e.key] = true;

        if (e.key === 'F3') {
            e.preventDefault();
            window.game.debug.toggle();
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (window.game) {
        window.game.keys[e.key] = false;
    }
});

window.addEventListener('load', () => {
    window.game = new Game();
});

console.log('Game loaded');
