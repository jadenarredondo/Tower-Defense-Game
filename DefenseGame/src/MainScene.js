import Tower from './Tower.js';
import AudioManager from './AudioManager.js';
import EffectsManager from './EffectsManager.js';
import SkillTreeManager from './SkillTreeManager.js';
import AchievementManager from './AchievementManager.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        // Try to get audioManager from registry, create new one if not available
        this.audioManager = null;
        this.effectsManager = null;
        this.debug = false;
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

        // Load core decoration assets
        this.load.image('tree1','assets/Decorations/tree1.png');
        this.load.image('tree2','assets/Decorations/tree2.png');
        this.load.image('rock1','assets/Decorations/rock1.png');
        this.load.image('rock2','assets/Decorations/rock2.png');
        // Bush spritesheets (8 frames each, 1024x128 -> 8x128 frames)
        this.load.spritesheet('Bushe1','assets/Decorations/Bushe1.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('Bushe2','assets/Decorations/Bushe2.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('Bushe3','assets/Decorations/Bushe3.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('Bushe4','assets/Decorations/Bushe4.png', { frameWidth: 128, frameHeight: 128 });

        // Load enemy assets from new Enemies folder
        this.load.image('enemy','assets/Enemies/enemy.png');
        this.load.spritesheet('flying_walk','assets/Enemies/flying_walk.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flying_fly','assets/Enemies/flying_fly.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flying_hurt','assets/Enemies/flying_hurt.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('flying_dead','assets/Enemies/flying_dead.png', { frameWidth: 128, frameHeight: 128 });

        // Load tower spritesheets - 64x64 per frame
        this.load.spritesheet('tower_izanami','assets/Tower/Izanami.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('tower_susanoo','assets/Tower/Susanoo.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('tower_farm','assets/Tower/shrine_farm.png');
        this.load.image('tower_placement','assets/Tower Placement/tower_placement.png');

        this.load.on('complete', () => {
            // Apply pixel filter to critical textures
            ['enemy', 'flying_walk', 'flying_fly', 'flying_hurt', 'flying_dead', 
             'tower_izanami', 'tower_susanoo', 'tower_farm', 'grass_new',
             'Bushe1','Bushe2','Bushe3','Bushe4'
            ].forEach(key => {
                if (this.textures.exists(key)) {
                    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
                }
            });
        });
    }

    create() {
        // round camera pixels to avoid rendering gaps
        this.cameras.main.roundPixels = true;
        // ---------- AUDIO SETUP ----------
        this.audioManager.resume();
        this.setupAudioControls();
        // record level start time for speedrun achievement
        this.levelStartTimestamp = performance.now();

        // ---------- EFFECTS SETUP ----------
        this.effectsManager = new EffectsManager(this);

        // bushes are static images now, no animations required

        // ---------- CONFIG ----------
        this.tileSize = 80;
        const MAP_WIDTH = 40;
        const MAP_HEIGHT = 22;
        // store for methods that run later
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

        // ---------- PLAYER ----------
        this.playerHealth = 20;
        this.maxPlayerHealth = 20;
        this.maxTowers = 6;
        this.gold = 200;
        this.baseGoldReward = 10;

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
            this.scene.launch('PauseScene', { pausedScene: 'MainScene' });
            this.scene.pause();
        });

        // Setup speed button handlers
        this.setupSpeedButtons();

        // Setup tower selection UI
        this.setupTowerSelectionUI();

        // Setup keyboard hotkeys for tower selection
        this.setupKeyboardHotkeys();

        // Setup audio controls
        this.setupAudioControls();

        // ---------- WAVE SYSTEM ----------
        this.currentWave = 0;
        this.maxWaves = 5;
        this.waveInProgress = false;
        this.enemiesAlive = 0;
        this.waveTimer = null;
        this.waveSpawningComplete = false;
        this._starting = false;
        this._winTriggered = false;
        this._debugLogged = false;

        // ---------- INITIALIZE TOWERS & ENEMIES ----------
        // Initialize early so update() doesn't fail before async setup completes
        this.enemies = this.add.group();
        // initialize spatial index used by towers
        this.initEnemyBuckets();
        this.towers = [];
        this.selectedTower = null;

        // ---------- MAP GRASS ----------
        // Draw grass into a single RenderTexture to prevent seams and reduce draw calls.
        // Process in chunks across multiple frames to avoid freezing.
        const grassRT = this.add.renderTexture(0, 0, MAP_WIDTH * this.tileSize, MAP_HEIGHT * this.tileSize)
            .setOrigin(0)
            .setDepth(0);
        const grassKey = 'grass_new';
        const brush = this.add.image(0, 0, grassKey)
            .setDisplaySize(this.tileSize, this.tileSize)
            .setOrigin(0)
            .setVisible(false);
        
        // Process grass in chunks of rows to avoid frame freezing
        const grassChunkSize = 4; // Process 4 rows per frame
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
                {x:0,y:11},{x:6,y:11},{x:6,y:4},{x:14,y:4},
                {x:14,y:16},{x:24,y:16},{x:24,y:8},{x:34,y:8},{x:39,y:8}
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

            // Path tiles
            const pathSet = new Set(this.path.map(p=>`${p.x},${p.y}`));
            // keep around for placement logic later
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
                    .setDisplaySize(this.tileSize,this.tileSize).setDepth(p.y+1);
            }

        // ---------- TOWER PLACEMENT ZONES ----------
        // Automatically generate possible locations around the path (sides and corners).
        // After gathering all candidates we filter them so they are spaced apart, then
        // convert to world coordinates with a small random offset for visual variety.
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
        // shuffle so filtering picks random ones first
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
        // if spacing removed too many, add extras until we hit max (allow small clustering)
        const MAX_ZONES = 10;
        if (spaced.length < MAX_ZONES) {
            for (const z of candidateZones) {
                if (spaced.length >= MAX_ZONES) break;
                if (!spaced.includes(z)) spaced.push(z);
            }
        }
        const jitter = this.tileSize * 0.3;
        this.towerZones = spaced.map(z => {
            const worldX = z.x * this.tileSize + this.tileSize/2 + Phaser.Math.Between(-jitter, jitter);
            const worldY = z.y * this.tileSize + this.tileSize/2 + Phaser.Math.Between(-jitter, jitter);
            return {gx: z.x, gy: z.y, x: worldX, y: worldY};
        });
        if(this.debug) console.log(`🧱 Generated ${this.towerZones.length} spaced tower placement zones`);
        // cap number of placement zones for level 1
        if (this.towerZones.length > MAX_ZONES) {
            Phaser.Utils.Array.Shuffle(this.towerZones);
            this.towerZones.length = MAX_ZONES;
            if(this.debug) console.log(`🔒 Capped tower zones to ${MAX_ZONES}`);
        }

        // ---------- DECORATIONS ----------
        // Place decorations in chunks to avoid frame freezing
        const used = new Set(this.path.map(p=>`${p.x},${p.y}`));
        // also treat tower zones as off-limits for decorations so they remain visible
        for (const z of this.towerZones) used.add(`${z.gx},${z.gy}`);
        
        this.decorationQueue = [
            { count: 65, keys: ['tree1','tree2'], scale: 1.3, type: 'image' },
            { count: 40, keys: ['rock1','rock2'], scale: 0.8, type: 'image' },
            { count: 30, keys: ['Bushe1','Bushe2','Bushe3','Bushe4'], scale: 1.0, type: 'bush' }
        ];
        
        // decorate everything immediately; previous chunking slowed perceived load time
        let decorQueueIndex = 0;
        const placeDecorationsChunk = () => {
            if (decorQueueIndex >= this.decorationQueue.length) {
                // Decorations done, continue with rest of setup
                finishMapSetup.call(this);
                return;
            }

            const decorConfig = this.decorationQueue[decorQueueIndex];
            let placed = 0;
            // put all remaining items in one shot
            const targetCount = decorConfig.count;

            while (placed < targetCount && placed < decorConfig.count) {
                const x = Phaser.Math.Between(0, MAP_WIDTH-1);
                const y = Phaser.Math.Between(0, MAP_HEIGHT-1);
                const id = `${x},${y}`;
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

            // continue immediately
            placeDecorationsChunk();
        };

        placeDecorationsChunk();
        };

        // ---------- FINISH MAP SETUP ----------
        const finishMapSetup = function() {

        // ---------- TOWERS ----------
        this.selectedTower = null;
        this.input.on('pointerdown', pointer => {
            const towerPos = this.findNearestZone(pointer.worldX, pointer.worldY);
            if (!towerPos) return;

            // Check if a tower already occupies this grid cell
            const existingTower = this.towers.find(t => t.gx === towerPos.gx && t.gy === towerPos.gy);

            if (existingTower) {
                // Show upgrade menu for this tower
                this.selectedTower = existingTower;
                this.showTowerUpgradeMenu(existingTower);
            } else if (this.towers.length < this.maxTowers) {
                // Place new tower
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
                if (this.debug) console.log(`❌ Max towers reached! Sell or upgrade existing towers instead.`);
            }
        });

        // ---------- PAUSE ----------
        this.input.keyboard.on('keydown-ESC',()=>{ 
            this.scene.launch('PauseScene', { pausedScene: 'MainScene' }); 
            this.scene.pause(); 
        });

        // ---------- UI VISIBILITY ----------
        const uiBar = document.getElementById('game-ui');
        const towerSelectionPanel = document.getElementById('tower-selection-panel');
        if (uiBar) uiBar.style.display = 'flex';
        if (towerSelectionPanel) towerSelectionPanel.style.display = 'flex';

        this.events.on('shutdown', () => {
            if (uiBar) uiBar.style.display = 'none';
            if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';
            if (this.audioManager) this.audioManager.stopBackgroundMusic();
            
            // Reset time scale to 1x before leaving scene
            this.time.timeScale = 1;

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

            // remove keyboard listeners added by this scene
            if (this.input && this.input.keyboard) {
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

        // ---------- START FIRST WAVE ----------
        this.startNextWave();
        
        }; // End of finishMapSetup function
        
        // Note: Map setup happens asynchronously across multiple frames
        // (Grass, path, and decorations load in chunks to prevent freezing)
    }

    update() {
        // refresh bucket grid each frame before towers query it
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

        // Update towers (rotate toward enemies, stop when none visible)
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
                if (this.debug) console.log('🎉 VICTORY CONDITION MET!');
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
                this.audioManager.playClick();
                this.selectTowerType(key);
            });

            towerListContainer.appendChild(option);
        });

        // Update UI visibility
        this.updateTowerSelectionUI();
    }

    selectTowerType(towerType) {
        this.selectedTowerType = towerType;
        console.log(`🎯 Selected tower type: ${towerType}`);
        
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

        // Update gold display with pulse animation only when changed
        if (this.goldElement) {
            this.goldElement.textContent = `${this.gold}`;
            if (this.gold !== this.prevGold) {
                this.goldElement.classList.remove('pulse');
                void this.goldElement.offsetWidth;
                this.goldElement.classList.add('pulse');
            }
            this.prevGold = this.gold;
        }
    }

    // conversion helpers for grid-aligned placement
    findNearestZone(x, y) {
        // compute grid position under pointer
        const gx = Math.floor(x / this.tileSize);
        const gy = Math.floor(y / this.tileSize);
        const mw = this.mapWidth, mh = this.mapHeight;
        if (gx < 0 || gy < 0 || gx >= mw || gy >= mh) return null;
        // disallow path tiles
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
            this.selectTowerType('basic');
            console.log('⌨️ Selected: Basic Tower (hotkey 1)');
        });

        // 2 = Power tower
        this.input.keyboard.on('keydown-TWO', () => {
            this.selectTowerType('power');
            console.log('⌨️ Selected: Power Tower (hotkey 2)');
        });

        // 3 = Sniper tower
        this.input.keyboard.on('keydown-THREE', () => {
            this.selectTowerType('sniper');
            console.log('⌨️ Selected: Sniper Tower (hotkey 3)');
        });
    }

    showTowerInfo(tower, mousePos) {
        const tooltip = document.getElementById('tower-info-tooltip');
        if (!tooltip) return;

        tooltip.style.visibility = 'visible';
        tooltip.style.left = mousePos.x + 10 + 'px';
        tooltip.style.top = mousePos.y + 10 + 'px';

        document.getElementById('tower-info-name').textContent = tower.type;
        document.getElementById('tower-info-level').textContent = `LEVEL ${tower.level}`;
        document.getElementById('tower-info-damage').textContent = `DMG: ${tower.damage.toFixed(1)}`;
        document.getElementById('tower-info-speed').textContent = `SPEED: ${tower.attackSpeed}ms`;
        document.getElementById('tower-info-range').textContent = `RANGE: ${tower.range}`;
        
        const upgradeCost = Math.floor(this.towerTypes[this.selectedTowerType].cost * 0.5);
        document.getElementById('tower-info-upgrade').textContent = `UPGRADE: ${upgradeCost}g`;
    }

    hideTowerInfo() {
        const tooltip = document.getElementById('tower-info-tooltip');
        if (tooltip) tooltip.style.visibility = 'hidden';
    }

    // ---------- WAVE SYSTEM ----------
    startNextWave() {
        // guard re-entrancy
        if(this._starting) return;
        this._starting = true;

        // Check if all waves are complete
        if(this.currentWave >= this.maxWaves) {
            console.log(`✓✓✓ All ${this.maxWaves} waves have been started.`);
            console.log(`Remaining enemies: ${this.enemiesAlive}`);
            this._starting = false;
            return;
        }

        this.currentWave++;
        if (this.debug) console.log(`\n🌊 STARTING WAVE ${this.currentWave}/${this.maxWaves}`);
        this.audioManager.playWaveStart();
        this.waveInProgress = true;
        this.waveSpawningComplete = false;

        // Increase tower slots per wave
        this.maxTowers = 6 + this.currentWave - 1;

        const waveCounts = [5,8,12,16,25];
        const spawnCount = waveCounts[this.currentWave-1] || 5;

        // Spawn enemies sequentially (1.5 second delay between spawns)
        this.waveTimer = this.time.addEvent({
            delay: 1500,
            repeat: spawnCount - 1,
            callback: ()=>{ this.spawnEnemy(); },
            onComplete: ()=>{ 
                this.waveSpawningComplete = true;
                console.log(`✓ Wave ${this.currentWave} spawning complete. Enemies alive: ${this.enemiesAlive}`);
            }
        });

        // 30 second timer per wave - automatically moves to next wave
        this.time.delayedCall(30000, ()=>{
            if(this.waveInProgress) {
                console.log(`⏱️ 30 second wave timer expired! Wave ${this.currentWave} complete.`);
                this.waveInProgress = false;
                this.waveSpawningComplete = true; // Important: Mark spawning as complete for win check
                
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
    spawnEnemy() {
        const offset = this.tileSize * 0.3;
        const enemy = this.add.sprite(
            this.path[0].x*this.tileSize+this.tileSize/2 + Phaser.Math.Between(-offset,offset),
            this.path[0].y*this.tileSize+this.tileSize/2 + Phaser.Math.Between(-offset,offset),
            'enemy'
        ).setDisplaySize(this.tileSize*0.5,this.tileSize*0.5).setDepth(1000).setActive(true).setVisible(true);

        enemy.hp = 15 + (this.currentWave * 3);
        enemy.maxHp = enemy.hp;
        enemy.damage = 1 + this.currentWave;
        enemy.pathIndex = 0;
        enemy._exited = false;

        enemy.healthBar = this.add.rectangle(enemy.x, enemy.y-40, 50,8,0x00ff00).setOrigin(0.5).setDepth(1500);

        this.enemies.add(enemy);
        this.enemiesAlive++;
        // bucket structure rebuilt each frame, no individual insertion

        this.moveEnemy(enemy);
    }

    // animate enemies past the exit and apply damage
    handleEnemyEscape(enemy){
        if(!enemy || enemy._exited || enemy.destroyed) return;
        enemy._exited = true;
        enemy.setActive(false);  // Deactivate to prevent further interactions

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
                try{ 
                    if(enemy && !enemy.destroyed) {
                        enemy.destroy(); 
                    }
                }catch(e){}
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
                    enemy.setDepth(1000 + enemy.y);
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
        this.audioManager.playGameOver();
        this.waveInProgress = false;
        const uiBar = document.getElementById('game-ui');
        if (uiBar) uiBar.style.display = 'none';
        // level 1 failure
        this.scene.launch('LoseScene', { level: 1 });
        this.scene.pause('MainScene');
    }

    winGame(){
        console.log('🎉 WINNING GAME...');
        this.waveInProgress = false;
        this.audioManager.playVictory();
        const uiBar = document.getElementById('game-ui');
        if (uiBar) uiBar.style.display = 'none';
        const elapsed = (performance.now() - this.levelStartTimestamp) / 1000;
        const perfect = this.playerHealth === this.maxPlayerHealth;
        const speedrun = elapsed < 120;
        this.scene.launch('WinScene', { level: 1, gold: this.gold, elapsed, perfect, speedrun });
        this.scene.pause('MainScene');
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

    /**
     * Show tower upgrade menu when tower is clicked
     */
    showTowerUpgradeMenu(tower) {
        this.hideTowerUpgradeMenu();
        
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

        const title = document.createElement('h2');
        title.textContent = `${tower.type} Tower`;
        title.style.cssText = `
            color: #64d5ff;
            margin: 0 0 20px 0;
            font-size: 24px;
            text-shadow: 0 0 10px rgba(100, 213, 255, 0.5);
        `;
        menu.appendChild(title);

        // Level Progress Bar
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

        // Progress bar
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

        // Stats display
        const stats = document.createElement('div');
        stats.style.cssText = `
            background: rgba(124, 58, 237, 0.2);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid rgba(167, 139, 250, 0.3);
        `;
        
        // Show different stats based on tower type
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
        menu.appendChild(levelProgress);

        // Upgrade and Sell buttons
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.cssText = `
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        `;

        // Upgrade Button
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
                this.upgradeTower(tower, upgradeCost);
                // Refresh the menu instead of closing it so user can see new stats
                this.showTowerUpgradeMenu(tower);
            });
        }

        buttonsDiv.appendChild(upgradeBtn);

        // Sell Button
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
            sellBtn.style.boxShadow = '0 0 15px rgba(217, 119, 6, 0.6)';
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

        // Close on ESC
        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideTowerUpgradeMenu();
                document.removeEventListener('keydown', closeHandler);
            }
        };
        document.addEventListener('keydown', closeHandler);
    }

    /**
     * Hide tower upgrade menu
     */
    hideTowerUpgradeMenu() {
        const menu = document.getElementById('tower-upgrade-menu');
        if (menu) {
            menu.remove();
        }
        this.selectedTower = null;
    }

    /**
     * Upgrade a tower to the next level
     */
    upgradeTower(tower, cost) {
        if (this.gold < cost) {
            console.log(`❌ Not enough gold! Need ${cost}, have ${this.gold}`);
            return;
        }

        // Use the tower's upgrade method which handles level check
        if (tower.upgrade()) {
            this.gold -= cost;
            console.log(`✨ Tower upgraded! Gold: -${cost} (Total: ${this.gold})`);
            this.audioManager.playUpgrade();
            if (this.effectsManager) {
                this.effectsManager.flash(200, 0x00ff00, 0.3);
            }
            this.updateUI();
            this.updateTowerSelectionUI();
            // unlock tower master if reached level 10
            if (tower.level >= 10) {
                AchievementManager.unlockAchievement('tower_master');
            }
        } else {
            console.log(`❌ Tower is already at maximum level!`);
        }
    }

    /**
     * Sell a tower and return partial gold
     */
    sellTower(tower) {
        const sellPrice = tower.sell();
        this.gold += sellPrice;
        
        // Remove tower from array
        const index = this.towers.indexOf(tower);
        if (index > -1) {
            this.towers.splice(index, 1);
        }

        console.log(`💰 Tower sold for ${sellPrice}G (Total gold: ${this.gold})`);
        this.audioManager.playClick();
        this.updateUI();
        this.updateTowerSelectionUI();
    }
}