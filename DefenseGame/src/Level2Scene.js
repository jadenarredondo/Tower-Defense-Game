import Tower from './Tower.js';
import AudioManager from './AudioManager.js';
import SkillTreeManager from './SkillTreeManager.js';
import AchievementManager from './AchievementManager.js';

export default class Level2Scene extends Phaser.Scene {
    constructor() {
        super('Level2Scene');
        this.audioManager = null;
    }

    preload() {
        // Get or create audio manager
        this.audioManager = AudioManager.getInstance();

        // CRITICAL ASSETS ONLY - load tiles, enemies, towers
        this.load.image('grass_new', 'assets/tiles/grass_new.png');
        this.load.image('stone_horizontal','assets/tiles/stone_horizontal.png');
        this.load.image('stone_vertical','assets/tiles/stone_vertical.png');
        this.load.image('corner_tl','assets/tiles/corner_tl.png');
        this.load.image('corner_tr','assets/tiles/corner_tr.png');
        this.load.image('corner_bl','assets/tiles/corner_bl.png');
        this.load.image('corner_br','assets/tiles/corner_br.png');

        // Core decorations needed for gameplay
        this.load.image('tree1','assets/decorations/tree1.png');
        this.load.image('tree2','assets/decorations/tree2.png');
        this.load.image('rock1','assets/decorations/rock1.png');
        this.load.image('rock2','assets/decorations/rock2.png');

        // Bush spritesheets (8 frames each) - needed for placeBushes()
        this.load.spritesheet('Bushe1','assets/decorations/Bushe1.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('Bushe2','assets/decorations/Bushe2.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('Bushe3','assets/decorations/Bushe3.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('Bushe4','assets/decorations/Bushe4.png', { frameWidth: 128, frameHeight: 128 });

        this.load.image('enemy','assets/Enemies/enemy.png');
        // remove any previously cached flying textures so we can treat them as spritesheets
        ['flying_walk','flying_fly','flying_hurt','flying_dead'].forEach(key => {
            if (this.textures.exists(key)) this.textures.remove(key);
        });
        // Load flying enemy spritesheets with correct frame dimensions
        this.load.spritesheet('flying_walk','assets/Enemies/flying_walk.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flying_fly','assets/Enemies/flying_fly.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flying_hurt','assets/Enemies/flying_hurt.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flying_dead','assets/Enemies/flying_dead.png', { frameWidth: 128, frameHeight: 128 });

        this.load.on('complete', () => {
            if (this.textures.exists('enemy'))
                this.textures.get('enemy').setFilter(Phaser.Textures.FilterMode.NEAREST);
            if (this.textures.exists('grass_new'))
                this.textures.get('grass_new').setFilter(Phaser.Textures.FilterMode.NEAREST);
            // core decorations + bush textures
            ['Bushe1','Bushe2','Bushe3','Bushe4']
            .forEach(k=>{
                if (this.textures.exists(k)) this.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST);
            });
        });

        // Load tower spritesheets - 64x64 per frame
        this.load.spritesheet('tower_izanami','assets/tower/Izanami.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('tower_susanoo','assets/tower/Susanoo.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('tower_farm','assets/tower/shrine_farm.png');
        this.load.image('tower_placement','assets/Tower Placement/tower_placement.png');

        this.load.on('complete', () => {
            ['tower_izanami', 'tower_susanoo', 'tower_farm'].forEach(key => {
                if (this.textures.exists(key))
                    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
            });
        });
    }

    create() {
        // round camera pixels to avoid rendering gaps
        this.cameras.main.roundPixels = true;
        // start with a quick fade so players aren't greeted by a blank screen
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(400, 0, 0, 0);
        // ---------- AUDIO SETUP ----------
        this.audioManager.resume();
        this.audioManager.playBackgroundMusic();
        this.setupAudioControls();
        // start timer for speedrun
        this.levelStartTimestamp = performance.now();

        // Create (or recreate) flying enemy animations from spritesheets
        // remove any stale animation definitions first so they point to the current texture
        ['flying_walk','flying_fly','flying_hurt','flying_dead'].forEach(key => {
            if (this.anims.exists(key)) {
                this.anims.remove(key);
            }
        });
        this.anims.create({
            key: 'flying_walk',
            frames: this.anims.generateFrameNumbers('flying_walk', { start: 0, end: 6 }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'flying_fly',
            frames: this.anims.generateFrameNumbers('flying_fly', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'flying_hurt',
            frames: this.anims.generateFrameNumbers('flying_hurt', { start: 0, end: 2 }),
            frameRate: 6,
            repeat: 0
        });
        this.anims.create({
            key: 'flying_dead',
            frames: this.anims.generateFrameNumbers('flying_dead', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: 0
        });

        // Bushes use static frame 0 - no animations
        
        // ---------- CONFIG ----------
        this.tileSize = 80;
        const MAP_WIDTH = 60;  // Expanded from 50
        const MAP_HEIGHT = 35;  // Expanded from 28
        this.mapWidth = MAP_WIDTH;
        this.mapHeight = MAP_HEIGHT;

        // ---------- CAMERA ----------
        this.cameras.main.setBounds(0,0,MAP_WIDTH*this.tileSize,MAP_HEIGHT*this.tileSize);
        this.cameras.main.centerOn(MAP_WIDTH*this.tileSize/2, MAP_HEIGHT*this.tileSize/2);
        this.cameras.main.setZoom(0.7);

        // Camera drag
        this.input.on('pointermove', pointer => {
            if(pointer.isDown){
                this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x);
                this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y);
            }
        });

        // Camera zoom
        this.input.on('wheel', pointer => {
            let zoom = this.cameras.main.zoom - pointer.deltaY * 0.001;
            zoom = Phaser.Math.Clamp(zoom, 0.4, 2);
            this.cameras.main.setZoom(zoom);
        });

        // Keyboard camera movement (arrow keys and WASD)
        this.keyW = this.input.keyboard.addKey('W');
        this.keyA = this.input.keyboard.addKey('A');
        this.keyS = this.input.keyboard.addKey('S');
        this.keyD = this.input.keyboard.addKey('D');
        this.cameraSpeed = 10;

        // debug toggle for verbose logging
        this.debug = false;

        // ---------- PLAYER ----------
        this.playerHealth = 20;
        this.maxPlayerHealth = 20;
        this.maxTowers = 7;
        this.gold = 300;
        this.baseGoldReward = 15;
        // tower selection/upgrade helpers (same style as level 1)
        this.selectedTower = null;
        this.pendingUpgrade = null;

        // Initialize skill modifiers
        SkillTreeManager.initSkills();
        this.skillModifiers = SkillTreeManager.getActiveModifiers();

        // Tower types definition
        this.towerTypes = {
basic: { name: 'Izanami', image: 'tower_izanami', cost: Math.floor(50 * this.skillModifiers.costMultiplier), damage: 1 * this.skillModifiers.damageMultiplier, range: 200 * this.skillModifiers.rangeMultiplier, attackSpeed: 500 / this.skillModifiers.attackSpeedMultiplier, attackSpeedMult: 1, scaleMult: 1, description: 'Reliable tower', frames: 15 },
            projectile: { name: 'Susanoo', image: 'tower_susanoo', cost: Math.floor(100 * this.skillModifiers.costMultiplier), damage: 4 * this.skillModifiers.damageMultiplier, range: 200 * this.skillModifiers.rangeMultiplier, attackSpeed: 350 / this.skillModifiers.attackSpeedMultiplier, attackSpeedMult: 0.7, scaleMult: 1.5, description: 'Water cannon', frames: 15, projectile: 'susanoo_water' },
            farm: { name: 'Farm', image: 'tower_farm', cost: Math.floor(50 * this.skillModifiers.costMultiplier), damage: 0, range: 10, attackSpeed: 1000, attackSpeedMult: 1.6, scaleMult: 1, moneyGain: 5 * this.skillModifiers.goldMultiplier, description: 'Income generator', frames: 1 }
        };
        this.selectedTowerType = 'basic';

        // Farm/Gold generation system (passive income from farm towers)
        this.farmGoldPerSecond = 5;
        this.lastFarmTick = 0;
        this.farmTickInterval = 1000; // 1 second

        // Store DOM UI elements for updates
        this.healthBarElement = document.getElementById('health-bar');
        this.healthTextElement = document.getElementById('health-text');
        this.waveNumberElement = document.getElementById('wave-number');
        this.waveStatusElement = document.getElementById('wave-status');
        this.towersCountElement = document.getElementById('towers-count');
        this.goldElement = document.getElementById('gold-count');
        this.pauseButton = document.getElementById('pause-btn');

        // Setup pause button click handler
        this.pauseButton.addEventListener('click', () => {
            if (this.audioManager) this.audioManager.playClick();
            this.scene.launch('PauseScene', { pausedScene: 'Level2Scene' });
            this.scene.pause();
        });

        // Setup speed button handlers
        this.setupSpeedButtons();

        // Setup tower selection UI
        this.setupTowerSelectionUI();

        // Setup keyboard hotkeys for tower selection
        this.setupKeyboardHotkeys();

        // ---------- WAVE SYSTEM ----------
        this.currentWave = 0;
        this.maxWaves = 12;
        this.waveInProgress = false;
        this.bossDefeated = false;
        this.enemiesAlive = 0;
        this.waveTimer = null;
        this.waveSpawningComplete = false;
        this._starting = false;
        this._winTriggered = false;
        this._debugLogged = false;

        // ---------- INITIALIZE TOWERS & ENEMIES ----------
        // Initialize early so update() doesn't fail before async setup completes
        this.enemies = this.add.group();
        // spatial index for fast tower targeting
        this.initEnemyBuckets();
        this.towers = [];
        this.selectedTower = null;

        // ---------- MAP GRASS ----------
        // Draw the whole grass layer once into a RenderTexture to prevent gaps.
        // Process in chunks across multiple frames to avoid freezing.
        const grassRT = this.add.renderTexture(0, 0, MAP_WIDTH * this.tileSize, MAP_HEIGHT * this.tileSize)
            .setOrigin(0)
            .setDepth(0);
        const grassKey = 'grass_new';
        const brush = this.add.image(0, 0, grassKey)
            .setDisplaySize(this.tileSize, this.tileSize)
            .setOrigin(0)
            .setVisible(false);
        
        // Process grass in chunks of rows to avoid frame freezing (larger map needs bigger chunks)
        const grassChunkSize = 8; // Process 8 rows per frame for 60x35 map
        let grassY = 0;
        const processGrassChunk = () => {
            const endY = Math.min(grassY + grassChunkSize, MAP_HEIGHT);
            for (let y = grassY; y < endY; y++) {
                for (let x = 0; x < MAP_WIDTH; x++) {
                    const tx = x * this.tileSize;
                    const ty = y * this.tileSize;
                    grassRT.draw(brush, tx, ty);
                }
            }
            grassY = endY;
            if (grassY < MAP_HEIGHT) {
                this.time.delayedCall(0, processGrassChunk, [], this);
            } else {
                brush.destroy();
                grassRT.setScrollFactor(1);
                // Continue with other map setup
                setupPathAndDecorations.call(this);
            }
        };
        processGrassChunk();

        // Define functionality that runs after grass is loaded
        const setupPathAndDecorations = function() {

        // ---------- PATH ----------
        this.pathNodes=[
            {x:0,y:17},{x:7,y:17},{x:7,y:5},{x:15,y:5},
            {x:15,y:12},{x:10,y:12},{x:10,y:25},{x:22,y:25},
            {x:22,y:8},{x:35,y:8},{x:35,y:28},{x:50,y:28},
            {x:50,y:15},{x:59,y:15},{x:59,y:32},{x:59,y:34}
        ];

        this.path = [];
        for(let i=0;i<this.pathNodes.length-1;i++){
            const a=this.pathNodes[i], b=this.pathNodes[i+1];
            const dx=Math.sign(b.x-a.x), dy=Math.sign(b.y-a.y);
            if(dx!==0){
                for(let x=a.x;x!==b.x+dx;x+=dx) this.path.push({x, y:a.y});
            } else {
                for(let y=a.y;y!==b.y+dy;y+=dy) this.path.push({x:a.x, y});
            }
        }

        // Path tiles - must be at high depth to appear above decorations
        const pathSet = new Set(this.path.map(p=>`${p.x},${p.y}`));
        // keep for placement checks
        this.pathSet = pathSet;
        for(const p of this.path){
            const L=pathSet.has(`${p.x-1},${p.y}`), R=pathSet.has(`${p.x+1},${p.y}`);
            const U=pathSet.has(`${p.x},${p.y-1}`), D=pathSet.has(`${p.x},${p.y+1}`);
            let key;
            if((L||R)&&(U||D)){
                if(U&&L) key='corner_tl';
                else if(U&&R) key='corner_tr';
                else if(D&&L) key='corner_bl';
                else if(D&&R) key='corner_br';
            } else key=(L||R)?'stone_horizontal':'stone_vertical';
            this.add.image(p.x*this.tileSize+this.tileSize/2, p.y*this.tileSize+this.tileSize/2, key)
                .setDisplaySize(this.tileSize,this.tileSize).setDepth(2000);
        }

        // ---------- TOWER PLACEMENT ZONES ----------
        // generate zones around path (sides & corners) and apply spacing filter
        let candidateZones = [];
        {
            const zoneSet = new Set();
            const offsets = [
                {dx:-1,dy:0},{dx:1,dy:0},{dx:0,dy:-1},{dx:0,dy:1},
                {dx:-1,dy:-1},{dx:1,dy:-1},{dx:-1,dy:1},{dx:1,dy:1}
            ];
            for (const p of this.path) {
                for (const off of offsets) {
                    const nx = p.x + off.dx;
                    const ny = p.y + off.dy;
                    const key = `${nx},${ny}`;
                    if (
                        nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT &&
                        !pathSet.has(key) &&
                        !zoneSet.has(key)
                    ) {
                        zoneSet.add(key);
                        candidateZones.push({x: nx, y: ny});
                    }
                }
            }
        }
        // make sure there are at least some candidates
        const MAX_ZONES = 20;
        if (candidateZones.length < MAX_ZONES) {
            const existing = new Set(candidateZones.map(z=>`${z.x},${z.y}`));
            while (candidateZones.length < MAX_ZONES) {
                const rx = Phaser.Math.Between(0, MAP_WIDTH-1);
                const ry = Phaser.Math.Between(0, MAP_HEIGHT-1);
                const key = `${rx},${ry}`;
                if (!existing.has(key) && !pathSet.has(key)) {
                    existing.add(key);
                    candidateZones.push({x: rx, y: ry});
                }
            }
        }
        // shuffle then enforce minimum separation (~1.5 tiles)
        Phaser.Utils.Array.Shuffle(candidateZones);
        const MIN_DIST = this.tileSize * 1.5;
        let spaced = [];
        for (const z of candidateZones) {
            let tooClose = false;
            for (const ex of spaced) {
                const dx = (z.x - ex.x) * this.tileSize;
                const dy = (z.y - ex.y) * this.tileSize;
                if (dx*dx + dy*dy < MIN_DIST*MIN_DIST) { tooClose = true; break; }
            }
            if (!tooClose) spaced.push(z);
        }
        // if we filtered away too many spots, add extras until reaching target
        if (spaced.length < MAX_ZONES) {
            for (const z of candidateZones) {
                if (spaced.length >= MAX_ZONES) break;
                if (!spaced.includes(z)) spaced.push(z);
            }
        }
        // convert to world coordinates with jitter, retain grid coords for decoration logic
        const jitter = this.tileSize * 0.3;
        this.towerZones = spaced.map(z => {
            const worldX = z.x * this.tileSize + this.tileSize/2 + Phaser.Math.Between(-jitter, jitter);
            const worldY = z.y * this.tileSize + this.tileSize/2 + Phaser.Math.Between(-jitter, jitter);
            return {gx: z.x, gy: z.y, x: worldX, y: worldY};
        });
        if(this.debug) console.log(`🧱 Generated ${this.towerZones.length} spaced tower placement zones`);
        // limit number of zones on level 2 as well (player requested twenty?)
        if (this.towerZones.length > MAX_ZONES) {
            Phaser.Utils.Array.Shuffle(this.towerZones);
            this.towerZones.length = MAX_ZONES;
            if (this.debug) console.log(`🔒 Capped tower zones to ${MAX_ZONES}`);
        }

        // ---------- DECORATIONS ----------
        // Place decorations in chunks to avoid frame freezing
        const used = new Set(this.path.map(p=>`${p.x},${p.y}`));
        // block decorations on tower zones too
        for (const z of this.towerZones) used.add(`${z.gx},${z.gy}`);
        
        this.decorationQueue = [
            { count: 80, keys: ['tree1','tree2'], scale: 1.3, type: 'image' },
            { count: 50, keys: ['rock1','rock2'], scale: 0.8, type: 'image' },
            { count: 25, keys: ['Bushe1','Bushe2','Bushe3','Bushe4'], scale: 1.0, type: 'bush' }
        ];
        
        let decorQueueIndex = 0;
        let decorAttemptsPerFrame = 15; // Reduce per-frame load
        const placeDecorationsChunk = () => {
            if (decorQueueIndex >= this.decorationQueue.length) {
                // Decorations done, continue with rest of setup
                finishMapSetup.call(this);
                return;
            }

            const decorConfig = this.decorationQueue[decorQueueIndex];
            let placed = 0;
            let attempts = 0;
            const maxAttempts = decorAttemptsPerFrame * 3; // Try up to 45 times per frame

            while (placed < decorConfig.count && attempts < maxAttempts) {
                const x = Phaser.Math.Between(0, MAP_WIDTH-1);
                const y = Phaser.Math.Between(0, MAP_HEIGHT-1);
                const id = `${x},${y}`;
                attempts++;
                if (!used.has(id)) {
                    const key = Phaser.Utils.Array.GetRandom(decorConfig.keys);
                    if (decorConfig.type === 'bush') {
                        this.add.sprite(x*this.tileSize+this.tileSize/2, y*this.tileSize+this.tileSize/2, key, 0)
                            .setScale(decorConfig.scale).setDepth(y+11);
                    } else {
                        this.add.image(x*this.tileSize+this.tileSize/2, y*this.tileSize+this.tileSize/2, key)
                            .setScale(decorConfig.scale).setDepth(y+10);
                    }
                    used.add(id);
                    placed++;
                }
            }

            decorConfig.count -= placed;
            if (decorConfig.count <= 0) {
                decorQueueIndex++;
            }

            // Continue next frame to avoid freezing
            if (decorQueueIndex < this.decorationQueue.length) {
                this.time.delayedCall(10, placeDecorationsChunk, [], this);
            } else {
                finishMapSetup.call(this);
            }
        };

        placeDecorationsChunk();
        };

        // ---------- FINISH MAP SETUP ----------
        const finishMapSetup = function() {

        // ---------- TOWER PLACEMENT ZONES ----------
        // zones were generated earlier before decorations
        // no zone graphics; tower placement is free-grid off the path

        // ---------- TOWERS ----------
        this.input.on('pointerdown', pointer => {
            const towerPos = this.findNearestZone(pointer.worldX, pointer.worldY);
            if (!towerPos) return;

            // check using grid coordinates
            const existingTower = this.towers.find(t => t.gx === towerPos.gx && t.gy === towerPos.gy);

            if (existingTower) {
                if (this.pendingUpgrade) {
                    // apply tool upgrade (rarely used because tools are hidden)
                    const costMap = { damage: 75, range: 60, speed: 80 };
                    this.upgradeTowerTool(existingTower, this.pendingUpgrade, costMap[this.pendingUpgrade]);
                    this.pendingUpgrade = null;
                    document.querySelectorAll('.upgrade-tool-btn').forEach(b => b.classList.remove('active'));
                    this.hideTowerUpgradeMenu();
                } else {
                    // open upgrade menu
                    this.selectedTower = existingTower;
                    this.showTowerUpgradeMenu(existingTower);
                }
            } else if (this.towers.length < this.maxTowers) {
                const towerConfig = this.towerTypes[this.selectedTowerType];
                if (this.gold >= towerConfig.cost) {
                    const tower = new Tower(this, towerPos.x, towerPos.y, towerConfig, this.audioManager);
                    tower.gx = towerPos.gx;
                    tower.gy = towerPos.gy;
                    this.towers.push(tower);
                    this.gold -= towerConfig.cost;
                    this.audioManager.playTowerPlace();
                    if (this.debug) console.log(`🏗️ Tower placed! Cost: -${towerConfig.cost} (Gold: ${this.gold})`);
                    this.selectedTower = null;
                    this.hideTowerUpgradeMenu();
                } else {
                    if (this.debug) console.log(`❌ Not enough gold! Need ${towerConfig.cost}, have ${this.gold}`);
                }
            } else {
                if (this.debug) console.log(`❌ Max towers reached! Upgrade existing towers instead.`);
            }
        });

        // ---------- PAUSE ----------
        this.input.keyboard.on('keydown-ESC',()=>{ 
            this.scene.launch('PauseScene', { pausedScene: 'Level2Scene' }); 
            this.scene.pause(); 
        });

        // ---------- UI VISIBILITY ----------
        const uiBar = document.getElementById('game-ui');
        const towerSelectionPanel = document.getElementById('tower-selection-panel');
        if (uiBar) uiBar.style.display = 'flex';
        if (towerSelectionPanel) towerSelectionPanel.style.display = 'flex';

        this.events.on('shutdown', () => {
            // Hide all game UI elements
            const uiBar = document.getElementById('game-ui');
            const towerSelectionPanel = document.getElementById('tower-selection-panel');
            if (uiBar) uiBar.style.display = 'none';
            if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';
            if (this.audioManager) this.audioManager.stopBackgroundMusic();
            
            // Reset time scale to 1x before leaving scene
            this.time.timeScale = 1;

            // remove any remaining timers or delayed calls
            if (this.waveTimer) {
                this.waveTimer.remove(false);
                this.waveTimer = null;
            }
            this.time.removeAllEvents();

            // clear enemy group (guard against repeated shutdown)
            if (this._shutdownHandled) {
                return; // already cleaned up
            }
            this._shutdownHandled = true;

            // Safely clear enemies with null checks at each step
            if (this.enemies) {
                try {
                    // Guard against group being destroyed
                    if (this.enemies.children && this.enemies.children instanceof Map) {
                        const children = Array.from(this.enemies.children.values());
                        // Clear in reverse to avoid index shifting issues
                        for (let i = children.length - 1; i >= 0; i--) {
                            const e = children[i];
                            if (e && !e.isDestroyed) {
                                if (e.healthBar && !e.healthBar.isDestroyed) {
                                    e.healthBar.destroy();
                                }
                                e.destroy();
                            }
                        }
                    }
                } catch (e) {
                    // Silently ignore errors during cleanup
                }
            }
            // null out reference to avoid future calls
            this.enemies = null;

            // Remove audio event listeners
            const muteBtn = document.getElementById('mute-btn');
            const volumeSlider = document.getElementById('volume-slider');
            if (muteBtn && this.muteClickHandler) {
                muteBtn.removeEventListener('click', this.muteClickHandler);
            }
            if (volumeSlider && this.volumeChangeHandler) {
                volumeSlider.removeEventListener('input', this.volumeChangeHandler);
            }
            
            // Remove speed button listener
            const topBar = document.getElementById('top-bar');
            if (topBar && this.speedButtonHandler) {
                topBar.removeEventListener('click', this.speedButtonHandler);
            }

            // remove input listeners to avoid duplicates on restart
            this.input.off('pointerdown');
            this.input.off('pointermove');
            this.input.off('wheel');
            if (this.input.keyboard) {
                this.input.keyboard.off('keydown-ESC');
                this.input.keyboard.off('keydown-ONE');
                this.input.keyboard.off('keydown-TWO');
                this.input.keyboard.off('keydown-THREE');
            }
        });
        this.events.on('sleep', () => {
            // Hide all game UI elements when scene is paused
            const uiBar = document.getElementById('game-ui');
            const towerSelectionPanel = document.getElementById('tower-selection-panel');
            if (uiBar) uiBar.style.display = 'none';
            if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';
        });

        this.events.on('wake', () => {
            // Show all game UI elements when scene is resumed from pause
            const uiBar = document.getElementById('game-ui');
            const towerSelectionPanel = document.getElementById('tower-selection-panel');
            if (uiBar) uiBar.style.display = 'flex';
            if (towerSelectionPanel) towerSelectionPanel.style.display = 'flex';
        });

        // ---------- START FIRST WAVE ----------
        this.startNextWave();
        
        }; // End of finishMapSetup function
        
        // Note: Map setup happens asynchronously across multiple frames
    }

    update() {
        // rebuild spatial index each frame (cheap compared to full scans)
        this.rebuildEnemyBuckets();
        // Keyboard camera movement (arrow keys and WASD)
        if (this.keyW.isDown) this.cameras.main.scrollY -= this.cameraSpeed;
        if (this.keyS.isDown) this.cameras.main.scrollY += this.cameraSpeed;
        if (this.keyA.isDown) this.cameras.main.scrollX -= this.cameraSpeed;
        if (this.keyD.isDown) this.cameras.main.scrollX += this.cameraSpeed;

        // Farm/Gold generation tick
        const now = this.time.now;
        if (now - this.lastFarmTick >= this.farmTickInterval) {
            // Sum up gold from all farm towers
            let totalFarmGold = 0;
            for (const tower of this.towers) {
                if (tower.type === 'Farm') {
                    totalFarmGold += tower.moneyGain;
                }
            }
            
            this.gold += totalFarmGold;
            if (totalFarmGold > 0 && this.debug) {
                if (this.debug) console.log(`🌾 Farm tick: +${totalFarmGold} gold (Total: ${this.gold})`);
            }
            this.lastFarmTick = now;
            this.updateTowerSelectionUI();
        }

        // rotate towers toward nearby enemies
        for (const tower of this.towers) {
            if (typeof tower.update === 'function') tower.update();
        }
        
        // Update UI
        this.updateUI();
        
        // Check win condition after all waves are spawned
        if(this.currentWave >= this.maxWaves && this.waveSpawningComplete && this.enemiesAlive <= 0 && this.playerHealth > 0) {
            if(!this._winTriggered) {
                this._winTriggered = true;
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
                if (this.debug) console.log('🎉 LEVEL 2 COMPLETE!');
                if (this.debug) console.log(`Wave: ${this.currentWave}/${this.maxWaves}`);
                if (this.debug) console.log(`Enemies: ${this.enemiesAlive}`);
                if (this.debug) console.log(`Health: ${this.playerHealth}`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
                this.time.delayedCall(500, ()=> this.winGame());
            }
        } else if(this.currentWave >= this.maxWaves) {
            // Debug info if win condition not met
            if(!this._debugLogged) {
                if (this.debug) console.log(`Wave complete check: Wave=${this.currentWave}, SpawningDone=${this.waveSpawningComplete}, Enemies=${this.enemiesAlive}, Health=${this.playerHealth}`);
                this._debugLogged = true;
            }
        }
    }

    setupSpeedButtons() {
        const scene = this;
        const topBar = document.getElementById('top-bar');
        
        // Store handler reference for cleanup on shutdown
        this.speedButtonHandler = (e) => {
            if (e.target.classList.contains('speed-btn')) {
                const speed = parseFloat(e.target.getAttribute('data-speed'));
                if (this.debug) console.log(`⚡ SPEED BUTTON CLICKED: ${speed}x`);
                scene.time.timeScale = speed;
                if (scene.audioManager) scene.audioManager.playClick();
                if (this.debug) console.log(`✓ Game speed changed to: ${speed}x`);
                
                // Update active state
                document.querySelectorAll('.speed-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
            }
        };
        
        // Use event delegation on the top-bar
        if (topBar) {
            if (this.debug) console.log('📍 Setting up speed buttons with delegation...');
            topBar.addEventListener('click', this.speedButtonHandler);
        } else {
            console.warn('⚠️ TOP-BAR NOT FOUND');
        }
    }

    setupTowerSelectionUI() {
        const towerListContainer = document.getElementById('tower-list');
        const selectionPanel = document.getElementById('tower-selection-panel');
        
        if (!towerListContainer || !selectionPanel) return;

        // Clear existing options
        towerListContainer.innerHTML = '';

        // Show the panel
        selectionPanel.style.display = 'flex';

        // Populate tower options
        Object.entries(this.towerTypes).forEach(([key, config]) => {
            const option = document.createElement('div');
            option.className = 'tower-option';
            if (key === this.selectedTowerType) option.classList.add('selected');
            option.setAttribute('data-tower-type', key);
            option.innerHTML = `
                <div class="tower-name">${config.name}</div>
                <div class="tower-cost">💰 ${config.cost}</div>
                <div class="tower-description">${config.description}</div>
            `;

            option.addEventListener('click', () => {
                if (this.audioManager) this.audioManager.playClick();
                this.selectTowerType(key);
            });

            towerListContainer.appendChild(option);
        });

        // add upgrade tools (damage/range/speed) just like level 1
        let toolsContainer = document.getElementById('upgrade-tools');
        if (!toolsContainer) {
            toolsContainer = document.createElement('div');
            toolsContainer.id = 'upgrade-tools';
            toolsContainer.style.cssText = 'display:none;'; // Hide upgrade tools - use unified level system instead
            selectionPanel.appendChild(toolsContainer);
        }

        // Update UI visibility
        this.updateTowerSelectionUI();
    }

    selectTowerType(towerType) {
        this.selectedTowerType = towerType;
        if (this.debug) console.log(`🎯 Selected tower type: ${towerType}`);
        
        // Update UI
        document.querySelectorAll('.tower-option').forEach(option => {
            option.classList.remove('selected');
            if (option.getAttribute('data-tower-type') === towerType) {
                option.classList.add('selected');
            }
        });

        this.updateTowerSelectionUI();
    }

    updateTowerSelectionUI() {
        document.querySelectorAll('.tower-option').forEach(option => {
            const towerType = option.getAttribute('data-tower-type');
            const config = this.towerTypes[towerType];
            const canAfford = this.gold >= config.cost;
            
            if (!canAfford && towerType !== this.selectedTowerType) {
                option.classList.add('disabled');
            } else {
                option.classList.remove('disabled');
            }
        });
        // disable upgrade tool buttons if player can't afford
        document.querySelectorAll('.upgrade-tool-btn').forEach(btn => {
            const text = btn.textContent || '';
            const match = text.match(/\((\d+)G\)/);
            if (match) {
                const cost = parseInt(match[1], 10);
                if (this.gold < cost) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                } else {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                }
            }
        });
    }

    updateUI() {
        // Update health bar and text
        const healthPercent = (this.playerHealth / this.maxPlayerHealth) * 100;
        if (this.healthBarElement) {
            this.healthBarElement.style.setProperty('--health-width', healthPercent + '%');
        }
        if (this.healthTextElement) {
            this.healthTextElement.textContent = `${Math.max(this.playerHealth, 0)}/${this.maxPlayerHealth}`;
        }

        // Update wave info
        if (this.waveNumberElement) {
            this.waveNumberElement.textContent = `${this.currentWave}/${this.maxWaves}`;
        }
        if (this.waveStatusElement) {
            this.waveStatusElement.textContent = `Enemies: ${this.enemiesAlive}`;
        }

        // Update towers count
        if (this.towersCountElement) {
            this.towersCountElement.textContent = `${this.towers.length}/${this.maxTowers}`;
            // Add visual indicator when maxed
            if (this.towers.length >= this.maxTowers) {
                this.towersCountElement.classList.add('maxed');
            } else {
                this.towersCountElement.classList.remove('maxed');
            }
        }

        // Update gold display
        if (this.goldElement) {
            this.goldElement.textContent = `${this.gold}`;
        }
    }

    findNearestZone(x, y) {
        // convert world coordinates to grid coords and validate
        const gx = Math.floor(x / this.tileSize);
        const gy = Math.floor(y / this.tileSize);
        const mw = this.mapWidth, mh = this.mapHeight;
        if (gx < 0 || gy < 0 || gx >= mw || gy >= mh) return null;
        if (this.pathSet && this.pathSet.has(`${gx},${gy}`)) return null;
        return {
            x: gx * this.tileSize + this.tileSize/2,
            y: gy * this.tileSize + this.tileSize/2,
            gx,
            gy
        };
    }

    setupKeyboardHotkeys() {
        // 1 = Basic tower
        this.input.keyboard.on('keydown-ONE', () => {
            if (this.audioManager) this.audioManager.playClick();
            this.selectTowerType('basic');
            if (this.debug) console.log('⌨️ Selected: Basic Tower (hotkey 1)');
        });

        // 2 = Power tower
        this.input.keyboard.on('keydown-TWO', () => {
            if (this.audioManager) this.audioManager.playClick();
            this.selectTowerType('projectile');
            if (this.debug) console.log('⌨️ Selected: Projectile Tower (hotkey 2)');
        });

        // 3 = Sniper tower
        this.input.keyboard.on('keydown-THREE', () => {
            if (this.audioManager) this.audioManager.playClick();
            this.selectTowerType('farm');
            if (this.debug) console.log('⌨️ Selected: Farm Tower (hotkey 3)');
        });
    }

    // ---------- WAVE SYSTEM ----------
    startNextWave() {
        // guard re-entrancy
        if(this._starting) return;
        this._starting = true;

        // Check if all waves are complete
        if(this.currentWave >= this.maxWaves) {
            if (this.debug) console.log(`✓✓✓ All ${this.maxWaves} waves have been started.`);
            console.log(`Remaining enemies: ${this.enemiesAlive}`);
            this._starting = false;
            return;
        }

        this.currentWave++;
        if (this.debug) console.log(`\n🌊 STARTING WAVE ${this.currentWave}/${this.maxWaves}`);
        if (this.audioManager) this.audioManager.playWaveStart();
        this.waveInProgress = true;
        this.waveSpawningComplete = false;

        // Increase tower slots per wave
        this.maxTowers = 7 + this.currentWave - 1;

        // If final wave, spawn boss instead of regular enemies
        if (this.currentWave >= this.maxWaves) {
            console.log('👑 BOSS WAVE!');
            this.spawnBoss();
            this.waveSpawningComplete = true;
            return;
        }

        const waveCounts = [5,8,10,12,15,18,20,22,24,26,28,30];
        const spawnCount = waveCounts[this.currentWave-1] || 8;

        // Spawn enemies sequentially (1.5 second delay between spawns)
        if (this.waveTimer) {
            this.waveTimer.remove(false);
        }
        this.waveTimer = this.time.addEvent({
            delay: 1200,
            repeat: spawnCount - 1,
            callback: ()=>{ this.spawnEnemy(); },
            onComplete: ()=>{ 
                this.waveSpawningComplete = true;
                console.log(`✓ Wave ${this.currentWave} spawning complete. Enemies alive: ${this.enemiesAlive}`);
            }
        });

        // 35 second timer per wave - automatically moves to next wave
        this.time.delayedCall(35000, ()=>{
            if(this.waveInProgress) {
                console.log(`⏱️ 35 second wave timer expired! Wave ${this.currentWave} complete.`);
                this.waveInProgress = false;
                this.waveSpawningComplete = true;
                
                // Kill remaining enemies
                this.enemies.getChildren().forEach(enemy => {
                    if(enemy.active) {
                        if(enemy.healthBar) enemy.healthBar.destroy();
                        enemy.destroy();
                        this.enemies.remove(enemy);
                        this.enemiesAlive--;
                    }
                });
                console.log(`Killed remaining enemies. Total alive: ${this.enemiesAlive}`);
                
                // Move to next wave only if not the final wave
                if(this.currentWave < this.maxWaves) {
                    this.time.delayedCall(1000, ()=> this.startNextWave());
                }
            }
        });

        this._starting = false;
    }

    checkWaveComplete() {
        // Not needed anymore - using timer-based system
    }

    setGameSpeed(speed) {
        this.time.timeScale = speed;
    }

    // show upgrade menu copied from MainScene
    showTowerUpgradeMenu(tower) {
        this.hideTowerUpgradeMenu();
        
        // clicking outside the menu should close it, so create a transparent overlay
        const overlay = document.createElement('div');
        overlay.id = 'tower-upgrade-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 19999;
        `;
        overlay.addEventListener('click', () => this.hideTowerUpgradeMenu());
        document.body.appendChild(overlay);

        const menu = document.createElement('div');
        menu.id = 'tower-upgrade-menu';
        menu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(15, 21, 52, 0.98) 0%, rgba(11, 16, 42, 0.98) 100%);
            border: 3px solid #7c3aed;
            border-radius: 12px;
            padding: 30px;
            z-index: 20000;
            min-width: 500px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            font-family: Arial, sans-serif;
        `;
        // prevent clicks inside menu from closing
        menu.addEventListener('click', e => e.stopPropagation());

        const title = document.createElement('h2');
        title.textContent = `${tower.type} Tower`;
        title.style.cssText = `
            color: #64d5ff;
            margin: 0 0 20px 0;
            font-size: 24px;
            text-shadow: 0 0 10px rgba(100, 213, 255, 0.5);
        `;
        menu.appendChild(title);

        // Level progress bar
        const levelProgress = document.createElement('div');
        levelProgress.style.cssText = `
            background: rgba(124, 58, 237, 0.2);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid rgba(167, 139, 250, 0.3);
        `;

        const levelText = document.createElement('p');
        levelText.style.cssText = `color: #a8daff; margin: 0 0 10px 0; font-weight: bold;`;
        levelText.textContent = `Level: ${tower.level} / ${tower.maxLevel}`;
        levelProgress.appendChild(levelText);

        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            width: 100%;
            height: 20px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid #7c3aed;
        `;
        const progressFill = document.createElement('div');
        const progressPercent = (tower.level / tower.maxLevel) * 100;
        progressFill.style.cssText = `
            width: ${progressPercent}%;
            height: 100%;
            background: linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%);
            transition: width 0.3s ease;
        `;
        progressBar.appendChild(progressFill);
        levelProgress.appendChild(progressBar);
        menu.appendChild(levelProgress);

        // Stats display
        const stats = document.createElement('div');
        stats.style.cssText = `
            background: rgba(124, 58, 237, 0.2);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid rgba(167, 139, 250, 0.3);
        `;
        
        if (tower.type === 'Farm') {
            stats.innerHTML = `
                <p style="color: #fbbf24; margin: 5px 0;"><strong>Gold/Second:</strong> ${tower.moneyGain}</p>
            `;
        } else {
            stats.innerHTML = `
                <p style="color: #a8daff; margin: 5px 0;"><strong>Damage:</strong> ${tower.damage.toFixed(1)}</p>
<p style="color: #a8daff; margin: 5px 0;"><strong>Attack Speed:</strong> ${tower.attackSpeed.toFixed(1)}ms</p>
                <p style="color: #a8daff; margin: 5px 0;"><strong>Range:</strong> ${Math.round(tower.range)}</p>
            `;
        }
        menu.appendChild(stats);

        // Buttons container
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.cssText = `
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        `;

        // Upgrade button
        const upgradeBtn = document.createElement('button');
        const canUpgrade = tower.level < tower.maxLevel && this.gold >= tower.upgradeCost;
        const upgradeCost = tower.upgradeCost;
        upgradeBtn.textContent = canUpgrade 
            ? `⬆️ Upgrade (${upgradeCost}G)` 
            : (tower.level >= tower.maxLevel ? '⭐ MAX LEVEL' : `❌ Upgrade (${upgradeCost}G)`);
        upgradeBtn.style.cssText = `
            flex: 1;
            padding: 12px 16px;
            background: ${canUpgrade ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'rgba(100, 100, 100, 0.5)'};
            color: ${canUpgrade ? '#fff' : '#888'};
            border: 2px solid ${canUpgrade ? '#a78bfa' : '#666'};
            border-radius: 8px;
            cursor: ${canUpgrade ? 'pointer' : 'not-allowed'};
            font-size: 14px;
            font-weight: bold;
            transition: all 0.2s ease;
            opacity: ${canUpgrade ? '1' : '0.6'};
        `;
        if (canUpgrade) {
            upgradeBtn.addEventListener('mouseover', () => {
                upgradeBtn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                upgradeBtn.style.boxShadow = '0 0 15px rgba(124, 58, 237, 0.6)';
            });
            upgradeBtn.addEventListener('mouseout', () => {
                upgradeBtn.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
                upgradeBtn.style.boxShadow = 'none';
            });
            upgradeBtn.addEventListener('click', () => {
                this.upgradeTowerLevel(tower, upgradeCost);
                this.showTowerUpgradeMenu(tower);
            });
        }
        buttonsDiv.appendChild(upgradeBtn);

        // Sell button
        const sellBtn = document.createElement('button');
        const sellPrice = tower.getSellPrice();
        sellBtn.textContent = `💰 Sell (${sellPrice}G)`;
        sellBtn.style.cssText = `
            flex: 1;
            padding: 12px 16px;
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
            color: #fff;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.2s ease;
        `;
        sellBtn.addEventListener('mouseover', () => {
            sellBtn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            sellBtn.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.6)';
        });
        sellBtn.addEventListener('mouseout', () => {
            sellBtn.style.background = 'linear-gradient(135deg, #d97706 0%, #b45309 100%)';
            sellBtn.style.boxShadow = 'none';
        });
        sellBtn.addEventListener('click', () => {
            this.sellTower(tower);
            this.hideTowerUpgradeMenu();
        });
        buttonsDiv.appendChild(sellBtn);

        menu.appendChild(buttonsDiv);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'CLOSE (ESC)';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: white;
            border: 2px solid #818cf8;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            transition: all 0.2s ease;
            margin-top: 15px;
        `;
        closeBtn.addEventListener('click', () => this.hideTowerUpgradeMenu());
        closeBtn.addEventListener('mouseover', () => {
            closeBtn.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)';
            closeBtn.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.6)';
        });
        closeBtn.addEventListener('mouseout', () => {
            closeBtn.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
            closeBtn.style.boxShadow = 'none';
        });
        menu.appendChild(closeBtn);

        document.body.appendChild(menu);

        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideTowerUpgradeMenu();
                document.removeEventListener('keydown', closeHandler);
            }
        };
        document.addEventListener('keydown', closeHandler);
    }

    hideTowerUpgradeMenu() {
        const menu = document.getElementById('tower-upgrade-menu');
        if (menu) {
            menu.remove();
        }
        const overlay = document.getElementById('tower-upgrade-overlay');
        if (overlay) {
            overlay.remove();
        }
        this.selectedTower = null;
    }

    // renamed to avoid conflict with level-up handling
    upgradeTowerTool(tower, upgradeType, cost) {
        if (this.gold < cost) {
            console.log(`❌ Not enough gold!`);
            return;
        }

        // Check upgrade limits (max 3 per type)
        if (upgradeType === 'damage' && tower.damageUpgrades >= tower.maxUpgradesPerType) {
            console.log(`❌ Damage upgrade limit reached!`);
            return;
        } else if (upgradeType === 'range' && tower.rangeUpgrades >= tower.maxUpgradesPerType) {
            console.log(`❌ Range upgrade limit reached!`);
            return;
        } else if (upgradeType === 'speed' && tower.speedUpgrades >= tower.maxUpgradesPerType) {
            console.log(`❌ Speed upgrade limit reached!`);
            return;
        }

        this.gold -= cost;

        if (upgradeType === 'damage') {
            tower.damage += 2;
            tower.damageUpgrades++;
        } else if (upgradeType === 'range') {
            tower.range += 50;
            tower.rangeUpgrades++;
            tower.rangeCircle.setRadius(tower.range);
        } else if (upgradeType === 'speed') {
            tower.attackSpeed = Math.max(100, tower.attackSpeed - 100);
            tower.speedUpgrades++;
            if (tower.timer) {
                tower.timer.destroy();
                tower.timer = this.time.addEvent({ delay: tower.attackSpeed, loop: true, callback: tower.attack, callbackScope: tower });
            }
        }

        if (this.audioManager) this.audioManager.playUpgrade();
    }

    // level-up a tower (called from upgrade menu)
    upgradeTowerLevel(tower, cost) {
        if (this.gold < cost) {
            console.log(`❌ Not enough gold! Need ${cost}, have ${this.gold}`);
            return;
        }

        if (tower.upgrade()) {
            this.gold -= cost;
            console.log(`✨ Tower upgraded! Gold: -${cost} (Total: ${this.gold})`);
            if (this.audioManager) this.audioManager.playUpgrade();
            if (this.effectsManager) {
                this.effectsManager.flash(200, 0x00ff00, 0.3);
            }
            this.updateUI();
            this.updateTowerSelectionUI();
            if (tower.level >= 10) {
                AchievementManager.unlockAchievement('tower_master');
            }
        } else {
            console.log(`❌ Tower is already at maximum level!`);
        }
    }

    sellTower(tower) {
        const sellPrice = tower.sell();
        this.gold += sellPrice;
        const index = this.towers.indexOf(tower);
        if (index > -1) {
            this.towers.splice(index, 1);
        }
        console.log(`💰 Tower sold for ${sellPrice}G (Total gold: ${this.gold})`);
        if (this.audioManager) this.audioManager.playClick();
        this.updateUI();
        this.updateTowerSelectionUI();
    }

    spawnEnemy() {
        const offset = this.tileSize * 0.3;
        // decide normal vs ghost – ghost is the flying creature
        const isGhost = Phaser.Math.Between(0, 100) < 40; // 40% ghost chance
        const key = isGhost && this.textures.exists('flying_walk') ? 'flying_walk' : 'enemy';
        const spriteSize = isGhost ? 1.1 : 0.5;
        
        const enemy = this.add.sprite(
            this.path[0].x*this.tileSize+this.tileSize/2 + Phaser.Math.Between(-offset,offset),
            this.path[0].y*this.tileSize+this.tileSize/2 + Phaser.Math.Between(-offset,offset),
            key
        ).setOrigin(0.5).setDisplaySize(this.tileSize * spriteSize, this.tileSize * spriteSize).setDepth(5100).setActive(true).setVisible(true);

        enemy.isFlying = isGhost && this.textures.exists('flying_walk');
        enemy.isGhost = isGhost;
        enemy._exited = false;
        
        // Play walking animation if flying
        if (enemy.isFlying && this.anims.exists('flying_walk')) {
            console.log('🐉 Flying enemy spawned with walk animation');
            enemy.play('flying_walk');
        }

        // adjust stats
        enemy.hp = 20 + (this.currentWave * 4) + (isGhost ? -5 : 0);
        enemy.maxHp = enemy.hp;
        enemy.damage = 2 + this.currentWave;
        enemy.pathIndex = 0;

        enemy.healthBar = this.add.rectangle(enemy.x, enemy.y-40, 50,8,0x00ff00).setOrigin(0.5).setDepth(5150);

        this.enemies.add(enemy);
        this.enemiesAlive++;
        // bucket insertion happens during rebuild, no per-enemy action needed

        this.moveEnemy(enemy);
    }

    // when an enemy reaches the path exit we slide it off-screen before cleaning up
    handleEnemyEscape(enemy){
        if(enemy._exited) return;
        enemy._exited = true;

        // deduct health immediately
        this.playerHealth -= enemy.damage;
        if (this.audioManager) this.audioManager.playDamage();
        this.enemiesAlive--;
        console.log(`Enemy escaped! Alive: ${this.enemiesAlive}`);
        if(enemy.healthBar) enemy.healthBar.destroy();

        // calculate exit coordinates based on last two path points
        let offX = enemy.x;
        let offY = enemy.y;
        if(this.path.length >= 2){
            const last = this.path[this.path.length-1];
            const prev = this.path[this.path.length-2];
            const dx = last.x - prev.x;
            const dy = last.y - prev.y;
            offX = last.x*this.tileSize + this.tileSize/2 + dx*this.tileSize*2;
            offY = last.y*this.tileSize + this.tileSize/2 + dy*this.tileSize*2;
        }

        this.tweens.add({
            targets: enemy,
            x: offX,
            y: offY,
            duration: 300 / this.time.timeScale,
            ease: 'Linear',
            onComplete: ()=>{
                try{ enemy.destroy(); }catch(e){}
                if(this.enemies) this.enemies.remove(enemy);
                if(this.playerHealth<=0) this.loseGame();
            }
        });
    }

    moveEnemy(enemy){
        if(!enemy || !enemy.active) return;
        
        // if enemy is already at or past the end, handle escape gracefully
        if(enemy.pathIndex >= this.path.length - 1){
            this.handleEnemyEscape(enemy);
            return;
        }
        
        if (enemy.isFlying && this.anims.exists('flying_fly')) {
            const current = enemy.anims.currentAnim ? enemy.anims.currentAnim.key : null;
            if (current !== 'flying_fly') {
                enemy.play('flying_fly');
            }
        }

        const next = this.path[enemy.pathIndex+1];
        const baseDuration = Math.max(300, 800 - this.currentWave*80);
        const duration = baseDuration / this.time.timeScale;

        this.tweens.add({
            targets: enemy,
            x: next.x*this.tileSize + this.tileSize/2,
            y: next.y*this.tileSize + this.tileSize/2,
            duration: duration,
            ease:'Linear',
            useFrames: false,
            onUpdate: ()=>{ 
                // Validate enemy still exists before updating
                if(enemy && enemy.active && enemy.healthBar && !enemy.destroyed) {
                    enemy.healthBar.setPosition(enemy.x, enemy.y-40);
                    enemy.setDepth(5100 + enemy.y);
                }
            },
            onComplete: ()=>{
                // Validate enemy still exists before continuing
                if(!enemy || !enemy.active || enemy.destroyed) return;
                enemy.pathIndex++;
                if(enemy.pathIndex >= this.path.length - 1){
                    this.handleEnemyEscape(enemy);
                } else {
                    this.moveEnemy(enemy);
                }
            }
        });
    }

    // spatial index helpers using grid buckets
    initEnemyBuckets(bucketSize = 128) {
        this.bucketSize = bucketSize;
        this.enemyBuckets = Object.create(null);
    }

    rebuildEnemyBuckets() {
        if (!this.enemies) return;
        this.enemyBuckets = Object.create(null);
        const size = this.bucketSize;
        this.enemies.getChildren().forEach(e => {
            if (!e || !e.active) return;
            const bx = Math.floor(e.x / size);
            const by = Math.floor(e.y / size);
            const key = `${bx},${by}`;
            if (!this.enemyBuckets[key]) this.enemyBuckets[key] = [];
            this.enemyBuckets[key].push(e);
        });
    }

    queryEnemyBuckets(x, y, range) {
        if (!this.enemyBuckets) return [];
        const size = this.bucketSize;
        const minBx = Math.floor((x - range) / size);
        const maxBx = Math.floor((x + range) / size);
        const minBy = Math.floor((y - range) / size);
        const maxBy = Math.floor((y + range) / size);
        const results = [];
        for (let bx = minBx; bx <= maxBx; bx++) {
            for (let by = minBy; by <= maxBy; by++) {
                const bucket = this.enemyBuckets[`${bx},${by}`];
                if (bucket) results.push(...bucket);
            }
        }
        return results;
    }

    loseGame(){
        console.log('💀 GAME OVER...');
        if (this.audioManager) this.audioManager.playGameOver();
        this.waveInProgress = false;

        // hide UI immediately
        const uiBar = document.getElementById('game-ui');
        if (uiBar) uiBar.style.display = 'none';
        const towerSelectionPanel = document.getElementById('tower-selection-panel');
        if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';

        // launch the lose scene and completely stop this level so no input or
        // updates continue in the background. stopping will trigger the
        // shutdown handler defined in create(), which cleans up timers,
        // listeners and other state.  (pausing left the scene active, which
        // allowed clicks to keep placing towers even though everything had
        // been frozen with timeScale = 0.)
        // tell the lose scene which level was failed; stopping the current
        // scene immediately leads to loseScene being unable to detect it later
        // so an explicit parameter is more reliable.
        this.scene.launch('LoseScene', { level: 2 });
        this.scene.stop('Level2Scene');
    }

    winGame(){
        console.log('🎉 WINNING LEVEL 2...');
        if (this.audioManager) this.audioManager.playVictory();
        this.waveInProgress = false;
        const uiBar = document.getElementById('game-ui');
        if (uiBar) uiBar.style.display = 'none';
        const towerSelectionPanel = document.getElementById('tower-selection-panel');
        if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';
        const elapsed = (performance.now() - this.levelStartTimestamp) / 1000;
        const perfect = this.playerHealth === this.maxPlayerHealth;
        const speedrun = elapsed < 120;
        this.scene.launch('WinScene', { level: 2, gold: this.gold, elapsed, perfect, speedrun });
        this.scene.pause('Level2Scene');
    }

    setupAudioControls() {
        const muteBtn = document.getElementById('mute-btn');
        const volumeSlider = document.getElementById('volume-slider');
        
        // Initialize UI state
        if (muteBtn) {
            muteBtn.textContent = this.audioManager.getIsMuted() ? '🔇' : '🔊';
        }
        if (volumeSlider) {
            volumeSlider.value = Math.round(this.audioManager.getMasterVolume() * 100);
        }

        // Store references for cleanup on shutdown
        this.muteClickHandler = () => {
            const isMuted = this.audioManager.toggleMute();
            muteBtn.textContent = isMuted ? '🔇' : '🔊';
            this.audioManager.playClick();
        };
        
        this.volumeChangeHandler = (e) => {
            const volume = parseFloat(e.target.value) / 100;
            this.audioManager.setMasterVolume(volume);
        };

        if (muteBtn) {
            muteBtn.addEventListener('click', this.muteClickHandler);
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', this.volumeChangeHandler);
        }
    }

    spawnBoss() {
        const offset = this.tileSize * 0.3;
        const useFlying = true; // boss always uses flying sprite for dramatic effect
        const key = useFlying ? (this.textures.exists('flying_walk') ? 'flying_walk' : 'enemy') : 'enemy';
        const boss = this.add.sprite(
            this.path[0].x*this.tileSize+this.tileSize/2 + Phaser.Math.Between(-offset,offset),
            this.path[0].y*this.tileSize+this.tileSize/2 + Phaser.Math.Between(-offset,offset),
            key
        ).setDisplaySize(this.tileSize*1.2,this.tileSize*1.2).setDepth(5100).setTint(0xff0000);

        if (useFlying && this.textures.exists('flying_walk')) {
            boss.isFlying = true;
            // Static image, no animation
        }

        boss.hp = 200;
        boss.maxHp = 200;
        boss.damage = 5;
        boss.pathIndex = 0;
        boss.isBoss = true;

        boss.healthBar = this.add.rectangle(boss.x, boss.y-50, 80,12,0xff0000).setOrigin(0.5).setDepth(5150);

        this.enemies.add(boss);
        this.enemiesAlive++;

        console.log('👹 Boss spawned!');
        this.moveEnemy(boss);
    }
}
