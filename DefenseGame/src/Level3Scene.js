import Tower from './Tower.js';
import AudioManager from './AudioManager.js';
import ProgressManager from './ProgressManager.js';
import EffectsManager from './EffectsManager.js';
import SkillTreeManager from './SkillTreeManager.js';

export default class Level3Scene extends Phaser.Scene {
    constructor() {
        super({
            key: 'Level3Scene',
            physics: {
                default: 'arcade',
                arcade: { gravity: { y: 0 }, debug: false }
            }
        });
        this.audioManager = null;
    }

    preload() {
        // Get or create audio manager
        this.audioManager = AudioManager.getInstance();

        // Load grass tiles (support optional `grass_new` replacement)
        this.load.image('grass_new', 'assets/Tiles/grass_new.png');
        this.load.image('stone_horizontal','assets/Tiles/stone_horizontal.png');
        this.load.image('stone_vertical','assets/Tiles/stone_vertical.png');
        this.load.image('corner_tl','assets/Tiles/corner_tl.png');
        this.load.image('corner_tr','assets/Tiles/corner_tr.png');
        this.load.image('corner_bl','assets/Tiles/corner_bl.png');
        this.load.image('corner_br','assets/Tiles/corner_br.png');

        this.load.image('tree1','assets/Decorations/tree1.png');
        this.load.image('tree2','assets/Decorations/tree2.png');
        this.load.image('rock1','assets/Decorations/rock1.png');
        this.load.image('Rock1_new','assets/Decorations/Rock1_new.png');
        this.load.image('Rock2_new','assets/Decorations/Rock2_new.png');
        this.load.image('Rock3_new','assets/Decorations/Rock3_new.png');
        this.load.image('Rock4_new','assets/Decorations/Rock4_new.png');
        this.load.image('rock2','assets/Decorations/rock2.png');
        this.load.image('temple1','assets/Decorations/ruined_temple1.png');
        this.load.image('temple2','assets/Decorations/ruined_temple2.png');
        this.load.image('temple3','assets/Decorations/ruined_temple3.png');
        // Bush spritesheets (8 frames each)
        this.load.spritesheet('Bushe1','assets/Decorations/Bushe1.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('Bushe2','assets/Decorations/Bushe2.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('Bushe3','assets/Decorations/Bushe3.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('Bushe4','assets/Decorations/Bushe4.png', { frameWidth: 128, frameHeight: 128 });
        // Flowers (12) and small grass clumps (6)
        for (let i = 1; i <= 12; i++) this.load.image(`flower${i}`, `assets/Flower/${i}.png`);
        for (let i = 1; i <= 6; i++) this.load.image(`grassSmall${i}`, `assets/Grass/${i}.png`);

        this.load.image('enemy','assets/Enemies/enemy.png');
        // ensure old flying textures are cleared before loading as spritesheets
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
            ['Bushe1','Bushe2','Bushe3','Bushe4','Rock1_new','Rock2_new','Rock3_new','Rock4_new',
             'flower1','flower2','flower3','flower4','flower5','flower6','flower7','flower8','flower9','flower10','flower11','flower12',
             'grassSmall1','grassSmall2','grassSmall3','grassSmall4','grassSmall5','grassSmall6']
            .forEach(k=>{
                if (this.textures.exists(k)) this.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST);
            });
        });

        // Load tower spritesheets - 64x64 per frame
        this.load.spritesheet('tower_izanami','assets/Tower/Izanami.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('tower_susanoo','assets/Tower/Susanoo.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('tower_farm','assets/Tower/shrine_farm.png');
        this.load.image('tower_placement','assets/Tower Placement/tower_placement.png');
        // TODO: Load susanoo_water spritesheet when asset is added

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
        // ---------- AUDIO SETUP ----------
        this.audioManager.resume();
        this.audioManager.playBackgroundMusic();
        this.setupAudioControls();

        // Create flying enemy animations from spritesheets
        // remove any stale animation definitions so they use the freshly loaded textures
        ['flying_walk','flying_fly','flying_hurt','flying_dead'].forEach(key => {
            if (this.anims.exists(key)) {
                this.anims.remove(key);
            }
        });
        // always recreate animations (preload already loaded new spritesheets)
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
        const MAP_WIDTH = 60;
        const MAP_HEIGHT = 32;
        this.mapWidth = MAP_WIDTH;
        this.mapHeight = MAP_HEIGHT;

        // ---------- CAMERA ----------
        this.cameras.main.setBounds(0,0,MAP_WIDTH*this.tileSize,MAP_HEIGHT*this.tileSize);
        this.cameras.main.centerOn(MAP_WIDTH*this.tileSize/2, MAP_HEIGHT*this.tileSize/2);
        this.cameras.main.setZoom(0.6);

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

        // ---------- PLAYER ----------
        this.playerHealth = 15;
        this.maxPlayerHealth = 15;
        this.maxTowers = 8;
        this.gold = 400;
        this.baseGoldReward = 15;

        // Initialize skill modifiers
        SkillTreeManager.initSkills();
        this.skillModifiers = SkillTreeManager.getActiveModifiers();

        // Tower types definition
        this.towerTypes = {
            basic: { name: 'Izanami', image: 'tower_izanami', cost: Math.floor(50 * this.skillModifiers.costMultiplier), damage: 1 * this.skillModifiers.damageMultiplier, range: 220 * this.skillModifiers.rangeMultiplier, attackSpeed: 500 / this.skillModifiers.attackSpeedMultiplier, attackSpeedMult: 1, scaleMult: 1, description: 'Reliable tower', frames: 15 },
            projectile: { name: 'Susanoo', image: 'tower_susanoo', cost: Math.floor(100 * this.skillModifiers.costMultiplier), damage: 4 * this.skillModifiers.damageMultiplier, range: 200 * this.skillModifiers.rangeMultiplier, attackSpeed: 350 / this.skillModifiers.attackSpeedMultiplier, attackSpeedMult: 0.7, scaleMult: 1.5, description: 'Water cannon', frames: 15, projectile: 'susanoo_water' },
            farm: { name: 'Farm', image: 'tower_farm', cost: Math.floor(50 * this.skillModifiers.costMultiplier), damage: 0, range: 10, attackSpeed: 1000, attackSpeedMult: 1.6, scaleMult: 1, moneyGain: 5 * this.skillModifiers.goldMultiplier, description: 'Income generator', frames: 1 }
        };
        this.selectedTowerType = 'basic';

        // Farm/Gold generation system (passive income from farm towers)
        this.farmGoldPerSecond = 5;
        this.lastFarmTick = 0;
        this.farmTickInterval = 1000;

        // Store DOM UI elements for updates
        this.healthBarElement = document.getElementById('health-bar');
        this.healthTextElement = document.getElementById('health-text');
        this.waveNumberElement = document.getElementById('wave-number');
        this.waveStatusElement = document.getElementById('wave-status');
        this.towersCountElement = document.getElementById('towers-count');
        this.goldElement = document.getElementById('gold-count');
        this.pauseButton = document.getElementById('pause-btn');

        // Initialize effects manager
        this.effectsManager = new EffectsManager(this);

        // Setup pause button click handler
        this.pauseButton.addEventListener('click', () => {
            if (this.audioManager) this.audioManager.playClick();
            this.scene.launch('PauseScene', { pausedScene: 'Level3Scene' });
            this.scene.pause();
        });

        // Setup speed button handlers
        this.setupSpeedButtons();

        // Setup tower selection UI
        this.setupTowerSelectionUI();

        // Setup keyboard hotkeys for tower selection
        this.setupKeyboardHotkeys();

        // ---------- TILES & MAP ----------
        // Initialize game structures first
        this.enemies = this.add.group();
        this.initEnemyBuckets();
        this.towers = [];
        this.walls = [];
        this.tiles = [];
        
        // Draw grass into a RenderTexture to avoid seams and reduce CPU overhead.
        // Process in chunks across multiple frames to avoid freezing.
        const grassRT = this.add.renderTexture(0, 0, MAP_WIDTH * this.tileSize, MAP_HEIGHT * this.tileSize)
            .setOrigin(0)
            .setDepth(-1)
            .setVisible(true);
        const grassKey = 'grass_new';
        const brush = this.add.image(0, 0, grassKey)
            .setDisplaySize(this.tileSize, this.tileSize)
            .setOrigin(0)
            .setVisible(false);
        
        // Process grass in chunks to avoid freezing on large maps
        const grassChunkSize = 4; // rows per frame
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
                grassRT.setVisible(true);
                // after grass is ready continue
                this.setupPathAndDecorationsAndWaves();
            }
        };

        // Start the grass rendering process (which will call setupPathAndDecorationsAndWaves when done)
        processGrassChunk();
        
        // Note: Map setup happens asynchronously across multiple frames
    }

    setupPathAndDecorationsAndWaves() {
        const MAP_WIDTH = this.mapWidth;
        const MAP_HEIGHT = this.mapHeight;
        
        // Initialize enemies alive counter
        this.enemiesAlive = 0;

        // Define path as tile-coordinate array - complex winding snake path for Level 3
        const pathNodes = [
            { x: 0, y: 0 },     { x: 8, y: 0 },     { x: 14, y: 0 },    { x: 20, y: 0 },
            { x: 20, y: 8 },    { x: 15, y: 8 },    { x: 10, y: 8 },    { x: 5, y: 8 },
            { x: 5, y: 13 },    { x: 12, y: 13 },   { x: 18, y: 13 },   { x: 25, y: 13 },
            { x: 25, y: 18 },   { x: 18, y: 18 },   { x: 10, y: 18 },   { x: 3, y: 18 },
            { x: 3, y: 24 },    { x: 15, y: 24 },   { x: 30, y: 24 },   { x: 45, y: 24 },
            { x: 55, y: 24 },   { x: 55, y: 28 }
        ];

        // expand pathNodes to full path array
        this.path = [];
        for (let i = 0; i < pathNodes.length - 1; i++) {
            const a = pathNodes[i], b = pathNodes[i+1];
            const dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y);
            if (dx !== 0) {
                for (let x = a.x; x !== b.x + dx; x += dx) this.path.push({ x, y: a.y });
            } else {
                for (let y = a.y; y !== b.y + dy; y += dy) this.path.push({ x: a.x, y });
            }
        }
        if (pathNodes && pathNodes.length > 0) {
            this.path.push(pathNodes[pathNodes.length - 1]);
        }

        // Path tiles
        const pathSet = new Set(this.path.map(p => `${p.x},${p.y}`));
        this.pathSet = pathSet;
        for (const p of this.path) {
            const L = pathSet.has(`${p.x - 1},${p.y}`),
                  R = pathSet.has(`${p.x + 1},${p.y}`),
                  U = pathSet.has(`${p.x},${p.y - 1}`),
                  D = pathSet.has(`${p.x},${p.y + 1}`);
            let key;
            if ((L || R) && (U || D)) {
                if (U && L) key = 'corner_tl';
                else if (U && R) key = 'corner_tr';
                else if (D && L) key = 'corner_bl';
                else if (D && R) key = 'corner_br';
            } else {
                key = (L || R) ? 'stone_horizontal' : 'stone_vertical';
            }
            this.add.image(p.x * this.tileSize + this.tileSize/2, p.y * this.tileSize + this.tileSize/2, key)
                .setDisplaySize(this.tileSize, this.tileSize)
                .setDepth(p.y);
        }

        // ---------- DECORATIONS ----------
        // Place decorations in chunks to avoid frame freezing
        const used = new Set(this.path.map(p => `${p.x},${p.y}`));
        
        const decorationQueue = [
            { count: 15, type: 'special', keys: ['tree1','tree2'], scale: 1.3 },
            { count: 10, type: 'special', keys: ['rock1','rock2'], scale: 0.8 },
            { count: 16, type: 'bush', keys: ['Bushe1','Bushe2','Bushe3','Bushe4'], scale: 1.0 }
        ];
        
        let decorQueueIndex = 0;
        let decorAttemptsPerFrame = 12;
        
        const placeDecorationsChunk = () => {
            if (decorQueueIndex >= decorationQueue.length) {
                // Decorations done, continue with rest of setup
                this.finishMapSetup();
                return;
            }
            
            const decorConfig = decorationQueue[decorQueueIndex];
            let placed = 0;
            let attempts = 0;
            const maxAttempts = decorAttemptsPerFrame * 4;
            
            while (placed < decorConfig.count && attempts < maxAttempts) {
                let x, y;
                if (decorConfig.type === 'special' && Phaser.Math.Between(0, 100) < 70 && this.path.length > 0) {
                    const pathTile = Phaser.Utils.Array.GetRandom(this.path);
                    x = pathTile.x + Phaser.Math.Between(-3, 3);
                    y = pathTile.y + Phaser.Math.Between(-3, 3);
                    x = Phaser.Math.Clamp(x, 0, MAP_WIDTH - 1);
                    y = Phaser.Math.Clamp(y, 0, MAP_HEIGHT - 1);
                } else {
                    x = Phaser.Math.Between(0, MAP_WIDTH - 1);
                    y = Phaser.Math.Between(0, MAP_HEIGHT - 1);
                }
                
                const id = `${x},${y}`;
                attempts++;
                if (!used.has(id)) {
                    const key = Phaser.Utils.Array.GetRandom(decorConfig.keys);
                    if (decorConfig.type === 'bush') {
                        this.add.sprite(x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2, key, 0)
                            .setScale(decorConfig.scale).setDepth(y + 11);
                    } else {
                        this.add.image(x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2, key)
                            .setScale(decorConfig.scale).setDepth(y + 10);
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
            if (decorQueueIndex < decorationQueue.length) {
                this.time.delayedCall(10, placeDecorationsChunk, [], this);
            } else {
                this.finishMapSetup();
            }
        };
        
        placeDecorationsChunk();
    }

    finishMapSetup() {
        // Setup tower placement
        this.input.on('pointerdown', pointer => {
            const towerPos = this.findNearestZone(pointer.worldX, pointer.worldY);
            if (!towerPos) return;
            this.handleTowerPlacement(towerPos);
        });

        // Setup waves
        this.waves = [
            { count: 20, delay: 600, duration: 30000 },
            { count: 25, delay: 500, duration: 30000 },
            { count: 30, delay: 450, duration: 30000 },
            { count: 35, delay: 400, duration: 30000 },
            { count: 40, delay: 400, duration: 35000 },
            { count: 45, delay: 350, duration: 35000 }
        ];
        this.currentWave = 0;
        this.waveActive = false;
        this.waveEnemyCount = 0;
        this.nextWaveCountdown = 0;

        this.updateUI();
        this.setupAudioControls();

        // ESC to pause
        this.input.keyboard.on('keydown-ESC', () => { 
            this.scene.launch('PauseScene', { pausedScene: 'Level3Scene' }); 
            this.scene.pause(); 
        });

        // UI Visibility
        const uiBar = document.getElementById('game-ui');
        const towerSelectionPanel = document.getElementById('tower-selection-panel');
        if (uiBar) uiBar.style.display = 'flex';
        if (towerSelectionPanel) towerSelectionPanel.style.display = 'flex';

        this.events.on('shutdown', () => {
            if (this._shutdownHandled) {
                return;
            }
            this._shutdownHandled = true;

            if (uiBar) uiBar.style.display = 'none';
            if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';
            if (this.audioManager) this.audioManager.stopBackgroundMusic();
            
            this.time.timeScale = 1;

            if (this.waveTimer) {
                this.waveTimer.remove(false);
                this.waveTimer = null;
            }
            this.time.removeAllEvents();
            
            if (this.enemies) {
                try {
                    if (this.enemies.children && this.enemies.children instanceof Map) {
                        const children = Array.from(this.enemies.children.values());
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
                    // Silently ignore errors
                }
            }
            this.enemies = null;

            const muteBtn = document.getElementById('mute-btn');
            const volumeSlider = document.getElementById('volume-slider');
            if (muteBtn && this.muteClickHandler) {
                muteBtn.removeEventListener('click', this.muteClickHandler);
            }
            if (volumeSlider && this.volumeChangeHandler) {
                volumeSlider.removeEventListener('input', this.volumeChangeHandler);
            }
            
            const topBar = document.getElementById('top-bar');
            if (topBar && this.speedButtonHandler) {
                topBar.removeEventListener('click', this.speedButtonHandler);
            }

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
            if (uiBar) uiBar.style.display = 'none';
            if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';
        });
        
        // Start first wave
        this.startWave();
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

    update(time, delta) {
        // refresh spatial index before towers query
        this.rebuildEnemyBuckets();
        // Keyboard camera movement (arrow keys and WASD)
        if (this.keyW.isDown) this.cameras.main.scrollY -= this.cameraSpeed;
        if (this.keyS.isDown) this.cameras.main.scrollY += this.cameraSpeed;
        if (this.keyA.isDown) this.cameras.main.scrollX -= this.cameraSpeed;
        if (this.keyD.isDown) this.cameras.main.scrollX += this.cameraSpeed;

        // Farm gold generation
        this.lastFarmTick += delta;
        if (this.lastFarmTick >= this.farmTickInterval) {
            // Sum up gold from all farm towers
            let totalFarmGold = 0;
            if (this.towers) {
                for (const tower of this.towers) {
                    if (tower.type === 'Farm') {
                        totalFarmGold += tower.moneyGain;
                    }
                }
            }
            
            this.gold += totalFarmGold;
            this.lastFarmTick = 0;
            this.updateUI();
        }

        // Wave management
        if (this.waves && !this.waveActive && this.currentWave < this.waves.length) {
            this.nextWaveCountdown += delta;
            if (this.nextWaveCountdown >= 2000) {
                this.startWave();
                this.nextWaveCountdown = 0;
            }
        }

        // Active wave management
        if (this.waveActive) {
            if (this.enemiesAlive === 0 && this.waveEnemyCount === 0) {
                this.waveActive = false;
                if (this.waves && this.currentWave < this.waves.length) {
                    this.currentWave++;
                    this.updateUI();
                }
            }
        }

        // Win condition
        if (this.waves && this.currentWave >= this.waves.length && this.enemiesAlive === 0 && !this._winTriggered) {
            this._winTriggered = true;
            this.time.delayedCall(500, () => this.winGame());
        }

        // Lose condition (immediate scene transition before loseGame is called from moveEnemy)
        // loseGame is called directly from moveEnemy when playerHealth <= 0

        // Update UI
        this.updateUI();
    }

    startWave() {
        if (!this.waves || this.currentWave >= this.waves.length) return;
        
        const wave = this.waves[this.currentWave];
        const isFinalWave = this.currentWave >= this.waves.length - 1;
        
        this.waveActive = true;
        this.waveEnemyCount = wave.count;

        // Spawn boss on final wave
        if (isFinalWave) {
            this.spawnBoss();
            if (this.debug) console.log(`🌊 Final Wave ${this.currentWave + 1}: BOSS INCOMING!`);
        }

        let spawnedCount = 0;
        const spawnInterval = this.time.addEvent({
            delay: wave.delay,
            repeat: wave.count - 1,
            callback: () => {
                this.spawnEnemy();
                spawnedCount++;
            }
        });

        this.updateUI();
    }

    // spatial index helpers
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
            const anim = this.anims.get('flying_walk');
            if (anim && anim.frames && anim.frames.length > 0) {
                if (this.debug) console.log('🐉 Flying enemy spawned with walk animation');
                enemy.play('flying_walk');
            } else {
                // animation invalid, fallback to static enemy
                enemy.isFlying = false;
            }
        }

        // adjust stats
        enemy.hp = 20 + (this.currentWave * 4) + (isGhost ? -5 : 0);
        enemy.maxHp = enemy.hp;
        enemy.damage = 2 + this.currentWave;
        enemy.pathIndex = 0;

        enemy.healthBar = this.add.rectangle(enemy.x, enemy.y-40, 50,8,0x00ff00).setOrigin(0.5).setDepth(5150);

        this.enemies.add(enemy);
        this.enemiesAlive++;
        // buckets rebuilt each frame; no per-enemy insert needed

        this.moveEnemy(enemy);
    }

    handleTowerPlacement(pos) {
        // pos contains world x/y and grid gx/gy
        const existingTower = this.towers.find(t => t.gx === pos.gx && t.gy === pos.gy);

        if (existingTower) {
            // Show upgrade menu for existing tower
            this.showTowerUpgradeMenu(existingTower);
        } else if (this.towers.length < this.maxTowers) {
            // Place new tower
            const cost = this.towerTypes[this.selectedTowerType].cost;
            if (this.gold >= cost) {
                const config = this.towerTypes[this.selectedTowerType];
                const tower = new Tower(this, pos.x, pos.y, config);
                tower.gx = pos.gx;
                tower.gy = pos.gy;
                this.towers.push(tower);
                this.gold -= cost;
                if (this.audioManager) this.audioManager.playClick();
                if (this.debug) console.log(`✅ Tower placed! Type: ${config.name}, Cost: ${cost}, Remaining gold: ${this.gold}`);
            } else {
                if (this.debug) console.log(`❌ Not enough gold! Need: ${cost}, Have: ${this.gold}`);
            }
        } else {
            if (this.debug) console.log(`❌ Max towers (${this.maxTowers}) reached!`);
        }
        this.updateUI();
    }

    // helper to convert mouse coords to valid placement position
    findNearestZone(x, y) {
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

    // slide enemies off map when they escape
    handleEnemyEscape(enemy){
        if(enemy._exited) return;
        enemy._exited = true;

        this.playerHealth -= enemy.damage;
        if (this.audioManager) this.audioManager.playDamage();
        this.enemiesAlive--;
        // CRITICAL FIX: Also decrement waveEnemyCount when enemy escapes
        if (this.waveEnemyCount > 0) {
            this.waveEnemyCount--;
        }
        if (this.debug) console.log(`Enemy escaped! Alive: ${this.enemiesAlive}`);

        if(enemy.healthBar) enemy.healthBar.destroy();

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
        if(enemy.pathIndex>=this.path.length-1){
            this.handleEnemyEscape(enemy);
            return;
        }
        
        // play flying animation when moving
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
                if(enemy.pathIndex>=this.path.length-1){
                    this.handleEnemyEscape(enemy);
                } else {
                    this.moveEnemy(enemy);
                }
            }
        });
    }

    showTowerUpgradeMenu(tower) {
        this.hideTowerUpgradeMenu();
        
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

        // Level progress selection
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
                <p style="color: #a8daff; margin: 5px 0;"><strong>Attack Speed:</strong> ${tower.attackSpeed}ms</p>
                <p style="color: #a8daff; margin: 5px 0;"><strong>Range:</strong> ${tower.range}</p>
            `;
        }
        menu.appendChild(stats);

        // Button group
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.cssText = `
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        `;

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
        if (overlay) overlay.remove();
        this.selectedTower = null;
    }

    upgradeTowerTool(tower, upgradeType, cost) {
        if (this.gold < cost) {
            console.log(`❌ Not enough gold! Need ${cost}, Have ${this.gold}`);
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

        if (this.audioManager) this.audioManager.playClick();
        this.updateUI();
    }

    upgradeTowerLevel(tower, cost) {
        if (this.gold < cost) {
            console.log(`❌ Not enough gold! Need ${cost}, Have ${this.gold}`);
            return;
        }

        if (tower.upgrade()) {
            this.gold -= cost;
            if (this.debug) console.log(`✨ Tower upgraded! Gold: -${cost} (Total: ${this.gold})`);
            if (this.audioManager) this.audioManager.playUpgrade();
            this.updateUI();
        } else {
            if (this.debug) console.log(`❌ Tower is already at maximum level!`);
        }
    }

    sellTower(tower) {
        const sellPrice = tower.sell();
        this.gold += sellPrice;
        const idx = this.towers.indexOf(tower);
        if (idx > -1) this.towers.splice(idx, 1);
        if (this.debug) console.log(`💰 Tower sold for ${sellPrice}G (Total gold: ${this.gold})`);
        if (this.audioManager) this.audioManager.playClick();
        this.updateUI();
    }

    updateUI() {
        // bail early if core DOM elements aren't ready (shouldn't happen but
        // just in case load order changes)
        if (!this.healthBarElement || !this.healthTextElement || !this.waveNumberElement ||
            !this.waveStatusElement || !this.towersCountElement || !this.goldElement) {
            return;
        }

        // health
        this.healthBarElement.style.width = (this.playerHealth / this.maxPlayerHealth * 100) + '%';
        this.healthTextElement.textContent = `${this.playerHealth}/${this.maxPlayerHealth}`;

        // wave info: guard against waves being undefined or not an array
        let totalWaves = '?';
        if (Array.isArray(this.waves)) {
            totalWaves = this.waves.length;
        }
        this.waveNumberElement.textContent = `Wave ${this.currentWave + 1}/${totalWaves}`;
        this.waveStatusElement.textContent = this.waveActive ? `Enemies: ${this.enemiesAlive}` : 'Ready';

        // towers count
        const towerCount = Array.isArray(this.towers) ? this.towers.length : 0;
        this.towersCountElement.textContent = `${towerCount}/${this.maxTowers}`;

        // gold
        this.goldElement.textContent = this.gold;

        this.updateTowerSelectionUI();
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

        if (this.debug) console.log('👹 Boss spawned!');
        this.moveEnemy(boss);
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
    }

    loseGame(){
        if (this.debug) console.log('💀 GAME OVER...');
        if (this.audioManager) this.audioManager.playGameOver();
        this.waveActive = false;
        const uiBar = document.getElementById('game-ui');
        if (uiBar) uiBar.style.display = 'none';
        const towerSelectionPanel = document.getElementById('tower-selection-panel');
        if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';
        // level 3 failure
        this.scene.launch('LoseScene', { level: 3 });
        this.scene.pause('Level3Scene');
    }

    winGame(){
        if (this.debug) console.log('🎉 WINNING LEVEL 3...');
        if (this.audioManager) this.audioManager.playVictory();
        ProgressManager.completeLevel(3);
        this.waveActive = false;
        const uiBar = document.getElementById('game-ui');
        if (uiBar) uiBar.style.display = 'none';
        const towerSelectionPanel = document.getElementById('tower-selection-panel');
        if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';
        this.scene.launch('WinScene', { level: 3, gold: this.gold });
        this.scene.pause('Level3Scene');
    }

    setupSpeedButtons() {
        const scene = this;
        const topBar = document.getElementById('top-bar');
        
        // Store handler reference for cleanup on shutdown
        this.speedButtonHandler = (e) => {
            if (e.target.classList.contains('speed-btn')) {
                const speed = parseFloat(e.target.getAttribute('data-speed'));
                scene.time.timeScale = speed;
                
                // Update active state
                document.querySelectorAll('.speed-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
            }
        };
        
        if (topBar) {
            topBar.addEventListener('click', this.speedButtonHandler);
        }
    }

    setupKeyboardHotkeys() {
        // 1 = Basic tower
        this.input.keyboard.on('keydown-ONE', () => {
            if (this.audioManager) this.audioManager.playClick();
            this.selectTowerType('basic');
            if (this.debug) console.log('⌨️ Selected: Basic Tower (hotkey 1)');
        });

        // 2 = Projectile tower
        this.input.keyboard.on('keydown-TWO', () => {
            if (this.audioManager) this.audioManager.playClick();
            this.selectTowerType('projectile');
            if (this.debug) console.log('⌨️ Selected: Projectile Tower (hotkey 2)');
        });

        // 3 = Farm tower
        this.input.keyboard.on('keydown-THREE', () => {
            if (this.audioManager) this.audioManager.playClick();
            this.selectTowerType('farm');
            if (this.debug) console.log('⌨️ Selected: Farm Tower (hotkey 3)');
        });
    }

    // animate enemies past the exit and apply damage
    handleEnemyEscape(enemy){
        if(enemy._exited) return;
        enemy._exited = true;

        this.playerHealth -= enemy.damage;
        if(enemy.healthBar) enemy.healthBar.destroy();
        this.enemiesAlive--;
        console.log(`Enemy escaped! Alive: ${this.enemiesAlive}`);

        // determine exit direction
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
        if(enemy.pathIndex>=this.path.length-1){
            this.handleEnemyEscape(enemy);
            return;
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
                if(enemy.pathIndex>=this.path.length-1){
                    this.handleEnemyEscape(enemy);
                } else {
                    this.moveEnemy(enemy);
                }
            }
        });
    }

    setGameSpeed(speed) {
        this.time.timeScale = speed;
    }
}
